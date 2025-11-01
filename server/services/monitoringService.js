// Monitoring & Performance Service with Prometheus integration
const DeploymentAnalytics = require("../models/DeploymentAnalytics")
const Log = require("../models/Log")
const promClient = require('prom-client')

class MonitoringService {
  constructor() {
    // Initialize Prometheus registry
    this.registry = new promClient.Registry()
    
    // Enable default metrics
    promClient.collectDefaultMetrics({ register: this.registry })

    // Initialize custom metrics
    this.initializeMetrics()
  }

  initializeMetrics() {
    // Response time histogram
    this.responseTimeHistogram = new promClient.Histogram({
      name: 'deployment_response_time_seconds',
      help: 'Response time in seconds',
      labelNames: ['project_id', 'region'],
      buckets: [0.1, 0.3, 0.5, 1, 2, 5],
      registers: [this.registry]
    })

    // Error rate counter
    this.errorCounter = new promClient.Counter({
      name: 'deployment_errors_total',
      help: 'Number of deployment errors',
      labelNames: ['project_id', 'service', 'error_type'],
      registers: [this.registry]
    })

    // Resource usage gauges
    this.memoryGauge = new promClient.Gauge({
      name: 'deployment_memory_usage_bytes',
      help: 'Memory usage in bytes',
      labelNames: ['project_id', 'region'],
      registers: [this.registry]
    })

    this.cpuGauge = new promClient.Gauge({
      name: 'deployment_cpu_usage_percent',
      help: 'CPU usage percentage',
      labelNames: ['project_id', 'region'],
      registers: [this.registry]
    })

    this.bandwidthGauge = new promClient.Gauge({
      name: 'deployment_bandwidth_bytes',
      help: 'Bandwidth usage in bytes',
      labelNames: ['project_id', 'region', 'direction'],
      registers: [this.registry]
    })
  }

  // Prometheus metrics endpoint
  async getMetricsHandler(req, res) {
    try {
      res.set('Content-Type', this.registry.contentType)
      res.end(await this.registry.metrics())
    } catch (error) {
      res.status(500).end(error.message)
    }
  }
  async recordMetric(projectId, deploymentId, metricType, value, region) {
    // Record in MongoDB
    const metric = await DeploymentAnalytics.create({
      projectId,
      deploymentId,
      metricType,
      value,
      region,
      timestamp: new Date(),
    })

    // Update Prometheus metrics
    switch (metricType) {
      case 'responseTime':
        this.responseTimeHistogram.observe({ project_id: projectId, region }, value / 1000) // Convert to seconds
        break
      case 'memoryUsage':
        this.memoryGauge.set({ project_id: projectId, region }, value)
        break
      case 'cpuUsage':
        this.cpuGauge.set({ project_id: projectId, region }, value)
        break
      case 'bandwidth':
        this.bandwidthGauge.set({ project_id: projectId, region, direction: 'in' }, value)
        break
    }

    return metric
  }

  async getMetrics(projectId, metricType, timeRange = 7) {
    const startDate = new Date(Date.now() - timeRange * 24 * 60 * 60 * 1000)

    return await DeploymentAnalytics.find({
      projectId,
      metricType,
      timestamp: { $gte: startDate },
    }).sort({ timestamp: -1 })
  }

  async getProjectMetricsSummary(projectId, timeRange = 7) {
    const startDate = new Date(Date.now() - timeRange * 24 * 60 * 60 * 1000)

    const metrics = await DeploymentAnalytics.find({
      projectId,
      timestamp: { $gte: startDate },
    })

    const summary = {
      responseTime: { avg: 0, max: 0, min: Number.POSITIVE_INFINITY },
      errorRate: { avg: 0, max: 0, min: Number.POSITIVE_INFINITY },
      memoryUsage: { avg: 0, max: 0, min: Number.POSITIVE_INFINITY },
      cpuUsage: { avg: 0, max: 0, min: Number.POSITIVE_INFINITY },
      bandwidth: { avg: 0, max: 0, min: Number.POSITIVE_INFINITY },
    }

    const grouped = {}
    metrics.forEach((m) => {
      if (!grouped[m.metricType]) grouped[m.metricType] = []
      grouped[m.metricType].push(m.value)
    })

    for (const [type, values] of Object.entries(grouped)) {
      if (summary[type]) {
        summary[type].avg = Math.round(values.reduce((a, b) => a + b) / values.length)
        summary[type].max = Math.max(...values)
        summary[type].min = Math.min(...values)
      }
    }

    return summary
  }

  async recordError(projectId, service, error) {
    // Record in MongoDB
    const log = await Log.create({
      projectId,
      service,
      level: "error",
      message: error,
    })

    // Increment Prometheus error counter
    this.errorCounter.inc({
      project_id: projectId,
      service,
      error_type: error.name || 'unknown'
    })

    return log
  }

  async getErrorLogs(projectId, timeRange = 1) {
    const startDate = new Date(Date.now() - timeRange * 24 * 60 * 60 * 1000)

    return await Log.find({
      projectId,
      level: "error",
      createdAt: { $gte: startDate },
    }).sort({ createdAt: -1 })
  }

  async getServiceHealth(projectId) {
    const recentMetrics = await this.getProjectMetricsSummary(projectId, 1)
    const errorCount = await Log.countDocuments({
      projectId,
      level: "error",
      createdAt: { $gte: new Date(Date.now() - 24 * 60 * 60 * 1000) },
    })

    let status = "healthy"
    let statusCode = 100

    if (recentMetrics.responseTime.avg > 1000) statusCode -= 20
    if (recentMetrics.errorRate.avg > 5) statusCode -= 30
    if (errorCount > 10) statusCode -= 20
    if (recentMetrics.memoryUsage.avg > 80) statusCode -= 10
    if (recentMetrics.cpuUsage.avg > 80) statusCode -= 10

    if (statusCode < 40) status = "critical"
    else if (statusCode < 70) status = "warning"
    else if (statusCode < 90) status = "degraded"

    return {
      status,
      statusCode,
      metrics: recentMetrics,
      errorCount,
    }
  }
}

module.exports = new MonitoringService()
