const { SecurityEvent } = require('../../models/security/SecurityEvent');
const { SecurityAlert } = require('../../models/security/SecurityAlert');
const { AuditLog } = require('../../models/AuditLog');

class SecurityAnalyticsService {
  async logSecurityEvent(eventData) {
    try {
      const event = new SecurityEvent({
        timestamp: new Date(),
        severity: this.calculateSeverity(eventData),
        ...eventData
      });

      await event.save();

      // Check if event triggers any alerts
      await this.checkAlertTriggers(event);

      return event;
    } catch (error) {
      throw new Error(`Failed to log security event: ${error.message}`);
    }
  }

  calculateSeverity(eventData) {
    // Severity calculation logic based on event type and details
    const severityMap = {
      'unauthorized_access': 'high',
      'failed_login': eventData.failedAttempts > 5 ? 'medium' : 'low',
      'api_abuse': 'medium',
      'data_leak': 'critical',
      'malicious_ip': 'high',
      'suspicious_activity': 'medium'
    };

    return severityMap[eventData.type] || 'low';
  }

  async checkAlertTriggers(event) {
    // Implement alert triggering logic based on event data
    const triggers = await this.getAlertTriggers(event.projectId);

    for (const trigger of triggers) {
      if (this.matchesTriggerCondition(event, trigger)) {
        await this.createSecurityAlert(event, trigger);
      }
    }
  }

  async getAlertTriggers(projectId) {
    // Fetch alert trigger configurations from database
    // This is a simplified example
    return [
      {
        type: 'failed_login',
        condition: {
          threshold: 5,
          timeWindow: 300 // 5 minutes
        },
        severity: 'high'
      },
      {
        type: 'unauthorized_access',
        condition: {
          immediate: true
        },
        severity: 'critical'
      }
    ];
  }

  matchesTriggerCondition(event, trigger) {
    if (event.type !== trigger.type) return false;

    if (trigger.condition.immediate) {
      return true;
    }

    if (trigger.condition.threshold) {
      // Check if threshold is exceeded within time window
      return this.checkThresholdExceeded(event, trigger.condition);
    }

    return false;
  }

  async checkThresholdExceeded(event, condition) {
    const timeWindow = new Date(event.timestamp.getTime() - (condition.timeWindow * 1000));
    
    const count = await SecurityEvent.countDocuments({
      projectId: event.projectId,
      type: event.type,
      timestamp: { $gte: timeWindow }
    });

    return count >= condition.threshold;
  }

  async createSecurityAlert(event, trigger) {
    const alert = new SecurityAlert({
      projectId: event.projectId,
      type: event.type,
      severity: trigger.severity,
      sourceEvent: event._id,
      timestamp: new Date(),
      status: 'open'
    });

    await alert.save();

    await AuditLog.create({
      projectId: event.projectId,
      action: 'security_alert_created',
      details: {
        alertId: alert._id,
        type: event.type,
        severity: trigger.severity
      },
      timestamp: new Date()
    });

    return alert;
  }

  async getSecurityEvents(projectId, options = {}) {
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
    if (options.severity) {
      query.severity = options.severity;
    }

    const events = await SecurityEvent.find(query)
      .sort({ timestamp: -1 })
      .skip(options.offset || 0)
      .limit(options.limit || 100);

    const total = await SecurityEvent.countDocuments(query);

    return {
      events,
      total,
      offset: options.offset || 0,
      limit: options.limit || 100
    };
  }

  async getSecurityAlerts(projectId, options = {}) {
    const query = { projectId };

    if (options.status) {
      query.status = options.status;
    }
    if (options.severity) {
      query.severity = options.severity;
    }

    const alerts = await SecurityAlert.find(query)
      .sort({ timestamp: -1 })
      .skip(options.offset || 0)
      .limit(options.limit || 100)
      .populate('sourceEvent');

    const total = await SecurityAlert.countDocuments(query);

    return {
      alerts,
      total,
      offset: options.offset || 0,
      limit: options.limit || 100
    };
  }

  async updateAlertStatus(alertId, status, resolution = '') {
    const alert = await SecurityAlert.findByIdAndUpdate(
      alertId,
      {
        status,
        resolution,
        resolvedAt: status === 'resolved' ? new Date() : undefined
      },
      { new: true }
    );

    if (!alert) {
      throw new Error('Alert not found');
    }

    await AuditLog.create({
      projectId: alert.projectId,
      action: 'security_alert_updated',
      details: {
        alertId,
        oldStatus: alert.status,
        newStatus: status,
        resolution
      },
      timestamp: new Date()
    });

    return alert;
  }

  async getSecurityAnalytics(projectId, timeRange = '24h') {
    const endTime = new Date();
    const startTime = new Date(endTime - this.parseTimeRange(timeRange));

    const [events, alerts] = await Promise.all([
      SecurityEvent.find({
        projectId,
        timestamp: { $gte: startTime, $lte: endTime }
      }),
      SecurityAlert.find({
        projectId,
        timestamp: { $gte: startTime, $lte: endTime }
      })
    ]);

    return {
      summary: {
        totalEvents: events.length,
        totalAlerts: alerts.length,
        criticalAlerts: alerts.filter(a => a.severity === 'critical').length,
        openAlerts: alerts.filter(a => a.status === 'open').length
      },
      severityDistribution: this.calculateSeverityDistribution(events),
      eventTypeDistribution: this.calculateEventTypeDistribution(events),
      timeline: this.generateSecurityTimeline(events, alerts, timeRange),
      topThreats: this.identifyTopThreats(events),
      riskScore: this.calculateRiskScore(events, alerts)
    };
  }

  parseTimeRange(timeRange) {
    const unit = timeRange.slice(-1);
    const value = parseInt(timeRange.slice(0, -1));

    switch (unit) {
      case 'h': return value * 3600000;
      case 'd': return value * 86400000;
      case 'w': return value * 604800000;
      default: return 86400000; // Default to 1 day
    }
  }

  calculateSeverityDistribution(events) {
    return events.reduce((acc, event) => {
      acc[event.severity] = (acc[event.severity] || 0) + 1;
      return acc;
    }, {});
  }

  calculateEventTypeDistribution(events) {
    return events.reduce((acc, event) => {
      acc[event.type] = (acc[event.type] || 0) + 1;
      return acc;
    }, {});
  }

  generateSecurityTimeline(events, alerts, timeRange) {
    const interval = this.calculateTimelineInterval(timeRange);
    const timeline = [];
    const startTime = new Date(Date.now() - this.parseTimeRange(timeRange));

    for (let time = startTime; time <= new Date(); time = new Date(time.getTime() + interval)) {
      const timeEnd = new Date(time.getTime() + interval);
      
      timeline.push({
        timestamp: time,
        events: events.filter(e => e.timestamp >= time && e.timestamp < timeEnd).length,
        alerts: alerts.filter(a => a.timestamp >= time && a.timestamp < timeEnd).length
      });
    }

    return timeline;
  }

  calculateTimelineInterval(timeRange) {
    const total = this.parseTimeRange(timeRange);
    const desired = 24; // Desired number of points
    return Math.floor(total / desired);
  }

  identifyTopThreats(events) {
    const threats = events.reduce((acc, event) => {
      const key = `${event.type}_${event.source}`;
      if (!acc[key]) {
        acc[key] = {
          type: event.type,
          source: event.source,
          count: 0,
          severity: event.severity
        };
      }
      acc[key].count++;
      return acc;
    }, {});

    return Object.values(threats)
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);
  }

  calculateRiskScore(events, alerts) {
    const severityWeights = {
      critical: 1.0,
      high: 0.7,
      medium: 0.4,
      low: 0.1
    };

    const eventScore = events.reduce((score, event) => {
      return score + (severityWeights[event.severity] || 0);
    }, 0);

    const alertScore = alerts.reduce((score, alert) => {
      return score + (severityWeights[alert.severity] || 0) * 2;
    }, 0);

    const maxScore = (events.length + alerts.length * 2); // Maximum possible score
    const normalizedScore = ((eventScore + alertScore) / maxScore) * 100;

    return Math.min(Math.round(normalizedScore), 100);
  }
}

module.exports = new SecurityAnalyticsService();