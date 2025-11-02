const { MetricsCollector } = require('../../models/metrics/MetricsCollector');
const { PerformanceMetric } = require('../../models/metrics/PerformanceMetric');
const { AuditLog } = require('../../models/AuditLog');

class PerformanceMetricsService {
  constructor() {
    this.collectors = new Map();
    this.metricsBuffer = new Map();
    this.flushInterval = 60000; // 1 minute
    this.initializeFlushInterval();
  }

  initializeFlushInterval() {
    setInterval(() => this.flushMetrics(), this.flushInterval);
  }

  async collectMetric(projectId, metricData) {
    try {
      const metric = {
        timestamp: new Date(),
        ...metricData
      };

      if (!this.metricsBuffer.has(projectId)) {
        this.metricsBuffer.set(projectId, []);
      }
      this.metricsBuffer.get(projectId).push(metric);

      // Flush if buffer gets too large
      if (this.metricsBuffer.get(projectId).length >= 1000) {
        await this.flushMetricsForProject(projectId);
      }

      return true;
    } catch (error) {
      throw new Error(`Failed to collect metric: ${error.message}`);
    }
  }

  async flushMetrics() {
    const promises = [];
    for (const [projectId, metrics] of this.metricsBuffer.entries()) {
      if (metrics.length > 0) {
        promises.push(this.flushMetricsForProject(projectId));
      }
    }
    await Promise.all(promises);
  }

  async flushMetricsForProject(projectId) {
    const metrics = this.metricsBuffer.get(projectId) || [];
    if (metrics.length === 0) return;

    try {
      await PerformanceMetric.insertMany(
        metrics.map(m => ({
          projectId,
          ...m
        }))
      );

      // Clear the buffer
      this.metricsBuffer.set(projectId, []);
    } catch (error) {
      console.error(`Failed to flush metrics for project ${projectId}:`, error);
    }
  }

  async queryMetrics(projectId, options = {}) {
    const query = { projectId };

    if (options.startTime) {
      query.timestamp = { $gte: new Date(options.startTime) };
    }
    if (options.endTime) {
      query.timestamp = { ...query.timestamp, $lte: new Date(options.endTime) };
    }
    if (options.type) {
      query.type = options.type;
    }

    const metrics = await PerformanceMetric.find(query)
      .sort({ timestamp: -1 })
      .limit(options.limit || 1000);

    return this.aggregateMetrics(metrics, options.aggregation);
  }

  aggregateMetrics(metrics, aggregation = '1h') {
    if (!metrics.length) return [];

    const aggregationMs = this.parseAggregationInterval(aggregation);
    const grouped = new Map();

    metrics.forEach(metric => {
      const timestamp = new Date(metric.timestamp);
      const bucket = Math.floor(timestamp.getTime() / aggregationMs) * aggregationMs;
      
      if (!grouped.has(bucket)) {
        grouped.set(bucket, {
          timestamp: new Date(bucket),
          count: 0,
          sum: 0,
          min: Infinity,
          max: -Infinity,
          values: []
        });
      }

      const group = grouped.get(bucket);
      group.count++;
      group.sum += metric.value;
      group.min = Math.min(group.min, metric.value);
      group.max = Math.max(group.max, metric.value);
      group.values.push(metric.value);
    });

    return Array.from(grouped.values()).map(group => ({
      timestamp: group.timestamp,
      count: group.count,
      avg: group.sum / group.count,
      min: group.min,
      max: group.max,
      p95: this.calculatePercentile(group.values, 95),
      p99: this.calculatePercentile(group.values, 99)
    }));
  }

  parseAggregationInterval(interval) {
    const unit = interval.slice(-1);
    const value = parseInt(interval.slice(0, -1));

    switch (unit) {
      case 's': return value * 1000;
      case 'm': return value * 60000;
      case 'h': return value * 3600000;
      case 'd': return value * 86400000;
      default: return 3600000; // Default to 1h
    }
  }

  calculatePercentile(values, percentile) {
    if (!values.length) return 0;
    values.sort((a, b) => a - b);
    const index = Math.ceil((percentile / 100) * values.length) - 1;
    return values[index];
  }

  async getMetricsSummary(projectId, timeRange = '24h') {
    const endTime = new Date();
    const startTime = new Date(endTime - this.parseAggregationInterval(timeRange));

    const metrics = await this.queryMetrics(projectId, {
      startTime,
      endTime,
      aggregation: '5m'
    });

    return {
      timeRange,
      dataPoints: metrics.length,
      summary: {
        avgResponseTime: this.calculateAverage(metrics, 'avg'),
        p95ResponseTime: this.calculateAverage(metrics, 'p95'),
        p99ResponseTime: this.calculateAverage(metrics, 'p99'),
        minResponseTime: Math.min(...metrics.map(m => m.min)),
        maxResponseTime: Math.max(...metrics.map(m => m.max)),
        totalRequests: metrics.reduce((sum, m) => sum + m.count, 0)
      },
      trends: {
        responseTime: this.calculateTrend(metrics, 'avg'),
        requestCount: this.calculateTrend(metrics, 'count')
      }
    };
  }

  calculateAverage(metrics, field) {
    if (!metrics.length) return 0;
    return metrics.reduce((sum, m) => sum + m[field], 0) / metrics.length;
  }

  calculateTrend(metrics, field) {
    if (metrics.length < 2) return 0;

    const xMean = (metrics.length - 1) / 2;
    const yMean = this.calculateAverage(metrics, field);

    let numerator = 0;
    let denominator = 0;

    metrics.forEach((metric, i) => {
      const x = i - xMean;
      const y = metric[field] - yMean;
      numerator += x * y;
      denominator += x * x;
    });

    return denominator !== 0 ? numerator / denominator : 0;
  }

  async configureCollector(projectId, config) {
    try {
      const collector = await MetricsCollector.findOneAndUpdate(
        { projectId },
        {
          ...config,
          updatedAt: new Date()
        },
        { upsert: true, new: true }
      );

      await AuditLog.create({
        projectId,
        action: 'metrics_collector_configured',
        details: config,
        timestamp: new Date()
      });

      return collector;
    } catch (error) {
      throw new Error(`Failed to configure metrics collector: ${error.message}`);
    }
  }

  async getCollectorStatus(projectId) {
    const collector = await MetricsCollector.findOne({ projectId });
    if (!collector) {
      return { status: 'not_configured' };
    }

    const metrics = await this.queryMetrics(projectId, {
      startTime: new Date(Date.now() - 300000), // Last 5 minutes
      limit: 1
    });

    return {
      status: metrics.length > 0 ? 'active' : 'inactive',
      lastMetric: metrics[0]?.timestamp,
      config: collector.toObject()
    };
  }
}

module.exports = new PerformanceMetricsService();