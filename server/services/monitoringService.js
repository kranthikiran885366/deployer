const { sequelize } = require('../db/postgres');
const { QueryTypes } = require('sequelize');
const Alert = require('../models/Alert');

const monitoringService = {
  // System Health
  async getSystemHealth() {
    const memoryUsage = process.memoryUsage();
    const uptime = process.uptime();
    
    // Calculate uptime percentage (mock calculation)
    const uptimePercentage = 99.98;
    
    // Get database connection status
    let dbStatus = 'healthy';
    try {
      await sequelize.authenticate();
    } catch (error) {
      dbStatus = 'unhealthy';
    }

    return {
      uptime: `${uptimePercentage}%`,
      avgResponseTime: '145ms',
      errorRate: '0.02%',
      totalRequests: '2.4M',
      memory: {
        used: Math.round(memoryUsage.heapUsed / 1024 / 1024),
        total: Math.round(memoryUsage.heapTotal / 1024 / 1024),
        percentage: Math.round((memoryUsage.heapUsed / memoryUsage.heapTotal) * 100)
      },
      database: {
        status: dbStatus,
        connections: 15, // Mock data
        queryTime: '45ms'
      },
      lastUpdated: new Date()
    };
  },

  // Service Status
  async getServiceStatus() {
    const services = [
      {
        name: 'API Server',
        status: 'healthy',
        uptime: '99.99%',
        lastCheck: new Date(Date.now() - 60000),
        responseTime: '120ms',
        endpoint: '/api/health'
      },
      {
        name: 'Database',
        status: 'healthy',
        uptime: '99.98%',
        lastCheck: new Date(Date.now() - 120000),
        responseTime: '45ms',
        endpoint: 'postgresql://localhost:5432'
      },
      {
        name: 'Cache Layer',
        status: 'healthy',
        uptime: '99.97%',
        lastCheck: new Date(Date.now() - 60000),
        responseTime: '12ms',
        endpoint: 'redis://localhost:6379'
      },
      {
        name: 'Storage Service',
        status: 'degraded',
        uptime: '99.85%',
        lastCheck: new Date(Date.now() - 60000),
        responseTime: '850ms',
        endpoint: 's3://bucket'
      },
      {
        name: 'CDN',
        status: 'healthy',
        uptime: '99.99%',
        lastCheck: new Date(Date.now() - 30000),
        responseTime: '85ms',
        endpoint: 'https://cdn.example.com'
      },
      {
        name: 'Message Queue',
        status: 'healthy',
        uptime: '99.96%',
        lastCheck: new Date(Date.now() - 120000),
        responseTime: '320ms',
        endpoint: 'rabbitmq://localhost:5672'
      }
    ];

    // Check actual service health (simplified)
    for (const service of services) {
      try {
        if (service.name === 'Database') {
          await sequelize.authenticate();
          service.status = 'healthy';
        }
        // Add other service checks here
      } catch (error) {
        service.status = 'unhealthy';
      }
    }

    return services;
  },

  // System Alerts
  async getSystemAlerts() {
    // Get recent alerts from database
    const dbAlerts = await Alert.findAll({
      where: {
        createdAt: {
          [sequelize.Op.gte]: new Date(Date.now() - 24 * 60 * 60 * 1000) // Last 24 hours
        }
      },
      order: [['createdAt', 'DESC']],
      limit: 20
    });

    // Add system-generated alerts
    const systemAlerts = [
      {
        id: 'sys-1',
        level: 'warning',
        title: 'High Memory Usage',
        description: 'Storage service memory at 85%',
        time: new Date(Date.now() - 15 * 60 * 1000),
        service: 'Storage Service',
        acknowledged: false
      },
      {
        id: 'sys-2',
        level: 'info',
        title: 'Scheduled Maintenance',
        description: 'Database backup in progress',
        time: new Date(Date.now() - 2 * 60 * 60 * 1000),
        service: 'Database',
        acknowledged: true
      }
    ];

    // Combine and sort alerts
    const allAlerts = [...systemAlerts, ...dbAlerts.map(alert => ({
      id: alert.id,
      level: alert.severity || 'info',
      title: alert.name,
      description: alert.message,
      time: alert.createdAt,
      service: alert.projectId ? `Project ${alert.projectId}` : 'System',
      acknowledged: alert.acknowledged || false
    }))];

    return allAlerts.sort((a, b) => new Date(b.time) - new Date(a.time));
  },

  // Performance Metrics
  async getPerformanceMetrics(timeRange = '24h') {
    // Mock performance data - in production, this would come from metrics collection
    const performanceData = [];
    const now = new Date();
    const hours = timeRange === '24h' ? 24 : timeRange === '7d' ? 168 : 24;
    
    for (let i = hours; i >= 0; i--) {
      const time = new Date(now.getTime() - i * 60 * 60 * 1000);
      performanceData.push({
        time: time.toISOString(),
        latency: Math.floor(Math.random() * 100) + 100, // 100-200ms
        errorRate: Math.random() * 2, // 0-2%
        throughput: Math.floor(Math.random() * 1000) + 500, // 500-1500 req/min
        cpuUsage: Math.random() * 80 + 10, // 10-90%
        memoryUsage: Math.random() * 70 + 20 // 20-90%
      });
    }

    return performanceData;
  },

  // Incidents
  async getIncidents() {
    const incidents = [
      {
        id: 1,
        title: 'Cache Sync Issue',
        status: 'resolved',
        severity: 'medium',
        duration: '2h 15m',
        startTime: new Date(Date.now() - 24 * 60 * 60 * 1000),
        endTime: new Date(Date.now() - 22 * 60 * 60 * 1000),
        affectedServices: ['Cache Layer', 'API Server']
      },
      {
        id: 2,
        title: 'Database Replication Lag',
        status: 'resolved',
        severity: 'high',
        duration: '45m',
        startTime: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
        endTime: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000 + 45 * 60 * 1000),
        affectedServices: ['Database']
      },
      {
        id: 3,
        title: 'Spike in API Errors',
        status: 'resolved',
        severity: 'low',
        duration: '12m',
        startTime: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
        endTime: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000 + 12 * 60 * 1000),
        affectedServices: ['API Server']
      }
    ];

    return incidents;
  },

  // Regional Status
  async getRegionalStatus() {
    const regions = [
      { name: 'US East', status: 'healthy', latency: '45ms' },
      { name: 'EU West', status: 'healthy', latency: '52ms' },
      { name: 'Asia Pacific', status: 'healthy', latency: '78ms' },
      { name: 'US West', status: 'healthy', latency: '38ms' },
      { name: 'Canada', status: 'healthy', latency: '41ms' },
      { name: 'Australia', status: 'healthy', latency: '89ms' }
    ];

    return regions;
  },

  // Error Distribution
  async getErrorDistribution() {
    return [
      { name: '5xx Errors', value: 15, count: 45 },
      { name: '4xx Errors', value: 35, count: 105 },
      { name: 'Timeouts', value: 25, count: 75 },
      { name: 'Other', value: 25, count: 75 }
    ];
  },

  // Acknowledge Alert
  async acknowledgeAlert(alertId) {
    try {
      const alert = await Alert.findByPk(alertId);
      if (alert) {
        alert.acknowledged = true;
        alert.acknowledgedAt = new Date();
        await alert.save();
        return alert;
      }
      return null;
    } catch (error) {
      throw new Error(`Failed to acknowledge alert: ${error.message}`);
    }
  },

  // Create System Alert
  async createSystemAlert(alertData) {
    try {
      const alert = await Alert.create({
        name: alertData.title,
        message: alertData.description,
        severity: alertData.level,
        projectId: null, // System alert
        metricType: 'system',
        threshold: null,
        operator: null,
        channels: ['email', 'slack'],
        active: true,
        createdBy: 'system'
      });

      return alert;
    } catch (error) {
      throw new Error(`Failed to create system alert: ${error.message}`);
    }
  }
};

module.exports = monitoringService;