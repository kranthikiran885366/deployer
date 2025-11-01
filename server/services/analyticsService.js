const { Metric, Alert } = require("../models/Metric")

class AnalyticsService {
  async recordMetric(projectId, resourceType, metricType, value, resourceId, tags) {
    const metric = new Metric({
      projectId,
      resourceType,
      resourceId,
      metricType,
      value,
      tags: tags || {},
      timestamp: new Date(),
    })
    return await metric.save()
  }

  async recordBatchMetrics(metrics) {
    return await Metric.insertMany(metrics)
  }

  async getMetricsByType(projectId, resourceType, metricType, { days = 7, limit = 100 }) {
    const startDate = new Date()
    startDate.setDate(startDate.getDate() - days)

    return await Metric.find({
      projectId,
      resourceType,
      metricType,
      timestamp: { $gte: startDate },
    })
      .sort({ timestamp: -1 })
      .limit(limit)
  }

  async calculateAggregate(projectId, resourceType, metricType, aggregation, { days = 7 }) {
    const startDate = new Date()
    startDate.setDate(startDate.getDate() - days)

    const pipeline = [
      {
        $match: {
          projectId,
          resourceType,
          metricType,
          timestamp: { $gte: startDate },
        },
      },
      {
        $group: {
          _id: null,
          count: { $sum: 1 },
          sum: { $sum: "$value" },
          avg: { $avg: "$value" },
          min: { $min: "$value" },
          max: { $max: "$value" },
          stdDev: { $stdDevPop: "$value" },
        },
      },
    ]

    const result = await Metric.aggregate(pipeline)
    return result[0] || {}
  }

  async getDashboardMetrics(projectId, { days = 7 }) {
    const startDate = new Date()
    startDate.setDate(startDate.getDate() - days)

    const pipeline = [
      {
        $match: {
          projectId,
          timestamp: { $gte: startDate },
        },
      },
      {
        $group: {
          _id: {
            date: {
              $dateToString: { format: "%Y-%m-%d", date: "$timestamp" },
            },
            metricType: "$metricType",
          },
          value: { $sum: "$value" },
          count: { $sum: 1 },
        },
      },
      {
        $sort: { "_id.date": -1 },
      },
    ]

    return await Metric.aggregate(pipeline)
  }

  async createAlert(projectId, name, condition, notifications) {
    const alert = new Alert({
      projectId,
      name,
      condition,
      notifications,
      isActive: true,
    })
    return await alert.save()
  }

  async getAlerts(projectId, { isActive = true, limit = 50, offset = 0 }) {
    const query = { projectId }
    if (isActive !== undefined) query.isActive = isActive

    const alerts = await Alert.find(query)
      .sort({ createdAt: -1 })
      .skip(offset)
      .limit(limit)

    const total = await Alert.countDocuments(query)
    return { alerts, total }
  }

  async checkAlerts(projectId) {
    const alerts = await Alert.find({ projectId, isActive: true })

    const triggeredAlerts = []

    for (const alert of alerts) {
      const lastMetric = await Metric.findOne({
        projectId,
        metricType: alert.condition.metric,
      }).sort({ timestamp: -1 })

      if (lastMetric) {
        const shouldTrigger = this._evaluateCondition(lastMetric.value, alert.condition)

        if (shouldTrigger && (!alert.lastTriggeredAt || this._shouldRetrigger(alert.lastTriggeredAt))) {
          triggeredAlerts.push(alert)
          alert.lastTriggeredAt = new Date()
          alert.status = "active"
          await alert.save()
        }
      }
    }

    return triggeredAlerts
  }

  _evaluateCondition(value, condition) {
    switch (condition.operator) {
      case "gt":
        return value > condition.threshold
      case "lt":
        return value < condition.threshold
      case "eq":
        return value === condition.threshold
      case "gte":
        return value >= condition.threshold
      case "lte":
        return value <= condition.threshold
      default:
        return false
    }
  }

  _shouldRetrigger(lastTriggeredAt) {
    const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000)
    return lastTriggeredAt < fiveMinutesAgo
  }

  async generateReport(projectId, reportType, { startDate, endDate }) {
    const metrics = await Metric.find({
      projectId,
      timestamp: { $gte: startDate, $lte: endDate },
    }).sort({ timestamp: -1 })

    return {
      reportType,
      period: { startDate, endDate },
      totalMetrics: metrics.length,
      byResourceType: this._groupByResourceType(metrics),
      byMetricType: this._groupByMetricType(metrics),
      summary: this._generateSummary(metrics),
    }
  }

  _groupByResourceType(metrics) {
    return metrics.reduce((acc, m) => {
      if (!acc[m.resourceType]) acc[m.resourceType] = []
      acc[m.resourceType].push(m)
      return acc
    }, {})
  }

  _groupByMetricType(metrics) {
    return metrics.reduce((acc, m) => {
      if (!acc[m.metricType]) acc[m.metricType] = []
      acc[m.metricType].push(m)
      return acc
    }, {})
  }

  _generateSummary(metrics) {
    return {
      total: metrics.length,
      byType: Object.keys(this._groupByMetricType(metrics)).reduce((acc, type) => {
        acc[type] = this._groupByMetricType(metrics)[type].length
        return acc
      }, {}),
    }
  }

  async deleteAlert(alertId) {
    return await Alert.findByIdAndRemove(alertId)
  }

  async updateAlert(alertId, updates) {
    return await Alert.findByIdAndUpdate(alertId, updates, { new: true })
  }

  async resolveAlert(alertId) {
    return await Alert.findByIdAndUpdate(alertId, { status: "resolved" }, { new: true })
  }

  async muteAlert(alertId, duration) {
    const alert = await Alert.findByIdAndUpdate(
      alertId,
      { status: "muted" },
      { new: true }
    )

    if (duration) {
      setTimeout(() => {
        Alert.findByIdAndUpdate(alertId, { status: "active" })
      }, duration)
    }

    return alert
  }
}

module.exports = new AnalyticsService()
