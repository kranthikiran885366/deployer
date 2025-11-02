const { CustomReport } = require('../../models/reporting/CustomReport');
const { ReportTemplate } = require('../../models/reporting/ReportTemplate');
const { AuditLog } = require('../../models/AuditLog');
const performanceMetricsService = require('./performanceMetricsService');
const securityAnalyticsService = require('./securityAnalyticsService');
const complianceService = require('./complianceService');

class CustomReportService {
  async createReportTemplate(templateData) {
    try {
      const template = new ReportTemplate({
        name: templateData.name,
        description: templateData.description,
        sections: templateData.sections,
        metrics: templateData.metrics,
        schedule: templateData.schedule,
        recipients: templateData.recipients,
        createdAt: new Date()
      });

      await template.save();

      await AuditLog.create({
        action: 'report_template_created',
        details: {
          templateId: template._id,
          name: template.name
        },
        timestamp: new Date()
      });

      return template;
    } catch (error) {
      throw new Error(`Failed to create report template: ${error.message}`);
    }
  }

  async generateCustomReport(projectId, templateId, options = {}) {
    try {
      const template = await ReportTemplate.findById(templateId);
      if (!template) {
        throw new Error('Report template not found');
      }

      const report = new CustomReport({
        projectId,
        templateId,
        name: template.name,
        timestamp: new Date(),
        sections: []
      });

      // Generate report sections based on template
      for (const section of template.sections) {
        const sectionData = await this.generateReportSection(
          projectId,
          section,
          options
        );
        report.sections.push(sectionData);
      }

      // Generate summary
      report.summary = this.generateReportSummary(report.sections);

      await report.save();

      await AuditLog.create({
        projectId,
        action: 'custom_report_generated',
        details: {
          reportId: report._id,
          templateId
        },
        timestamp: new Date()
      });

      return report;
    } catch (error) {
      throw new Error(`Failed to generate custom report: ${error.message}`);
    }
  }

  async generateReportSection(projectId, section, options) {
    const timeRange = options.timeRange || section.defaultTimeRange || '24h';
    
    switch (section.type) {
      case 'performance':
        return {
          type: 'performance',
          title: section.title,
          metrics: await this.getPerformanceMetrics(projectId, timeRange, section.metrics)
        };
      
      case 'security':
        return {
          type: 'security',
          title: section.title,
          analytics: await this.getSecurityAnalytics(projectId, timeRange, section.metrics)
        };
      
      case 'compliance':
        return {
          type: 'compliance',
          title: section.title,
          compliance: await this.getComplianceData(projectId, timeRange, section.frameworks)
        };
      
      case 'custom':
        return {
          type: 'custom',
          title: section.title,
          data: await this.getCustomMetrics(projectId, section.query, timeRange)
        };
      
      default:
        throw new Error(`Unsupported section type: ${section.type}`);
    }
  }

  async getPerformanceMetrics(projectId, timeRange, metrics) {
    const data = await performanceMetricsService.queryMetrics(projectId, {
      startTime: this.calculateStartTime(timeRange),
      metrics: metrics
    });

    return {
      summary: this.summarizeMetrics(data),
      trends: this.calculateTrends(data),
      details: this.formatMetricsDetails(data)
    };
  }

  async getSecurityAnalytics(projectId, timeRange, metrics) {
    const data = await securityAnalyticsService.getSecurityAnalytics(
      projectId,
      timeRange
    );

    return {
      summary: data.summary,
      threats: data.topThreats,
      timeline: data.timeline,
      riskScore: data.riskScore
    };
  }

  async getComplianceData(projectId, timeRange, frameworks) {
    const reports = await complianceService.getComplianceHistory(projectId, {
      startDate: this.calculateStartTime(timeRange),
      frameworks: frameworks
    });

    return {
      summary: reports.reports[0]?.summary,
      trend: reports.trend,
      frameworks: this.summarizeComplianceByFramework(reports.reports)
    };
  }

  async getCustomMetrics(projectId, query, timeRange) {
    // Implement custom metrics query logic
    return [];
  }

  calculateStartTime(timeRange) {
    const now = new Date();
    const unit = timeRange.slice(-1);
    const value = parseInt(timeRange.slice(0, -1));

    switch (unit) {
      case 'h':
        return new Date(now - value * 3600000);
      case 'd':
        return new Date(now - value * 86400000);
      case 'w':
        return new Date(now - value * 604800000);
      case 'm':
        return new Date(now - value * 2592000000);
      default:
        return new Date(now - 86400000); // Default to 24 hours
    }
  }

  summarizeMetrics(data) {
    return {
      average: this.calculateAverage(data),
      min: Math.min(...data.map(d => d.value)),
      max: Math.max(...data.map(d => d.value)),
      trend: this.calculateTrend(data)
    };
  }

  calculateTrends(data) {
    const intervals = this.splitIntoIntervals(data, 10);
    return intervals.map(interval => ({
      timestamp: interval[0].timestamp,
      value: this.calculateAverage(interval)
    }));
  }

  formatMetricsDetails(data) {
    return data.map(d => ({
      timestamp: d.timestamp,
      value: d.value,
      metadata: d.metadata
    }));
  }

  calculateAverage(data) {
    return data.reduce((sum, d) => sum + d.value, 0) / data.length;
  }

  calculateTrend(data) {
    if (data.length < 2) return 0;

    const values = data.map(d => d.value);
    const firstHalf = values.slice(0, Math.floor(values.length / 2));
    const secondHalf = values.slice(Math.floor(values.length / 2));

    const firstAvg = firstHalf.reduce((a, b) => a + b, 0) / firstHalf.length;
    const secondAvg = secondHalf.reduce((a, b) => a + b, 0) / secondHalf.length;

    return ((secondAvg - firstAvg) / firstAvg) * 100;
  }

  splitIntoIntervals(data, count) {
    const intervalSize = Math.ceil(data.length / count);
    const intervals = [];

    for (let i = 0; i < data.length; i += intervalSize) {
      intervals.push(data.slice(i, i + intervalSize));
    }

    return intervals;
  }

  summarizeComplianceByFramework(reports) {
    if (!reports.length) return {};

    const latestReport = reports[0];
    return Object.entries(latestReport.summary.by_framework).map(([framework, stats]) => ({
      framework,
      score: stats.compliance_score,
      passed: stats.passed,
      failed: stats.failed,
      trend: this.calculateFrameworkTrend(framework, reports)
    }));
  }

  calculateFrameworkTrend(framework, reports) {
    const scores = reports
      .map(r => r.summary.by_framework[framework]?.compliance_score)
      .filter(score => score !== undefined);

    if (scores.length < 2) return 0;

    const recent = scores.slice(0, Math.ceil(scores.length / 2));
    const older = scores.slice(Math.ceil(scores.length / 2));

    const recentAvg = recent.reduce((a, b) => a + b, 0) / recent.length;
    const olderAvg = older.reduce((a, b) => a + b, 0) / older.length;

    return ((recentAvg - olderAvg) / olderAvg) * 100;
  }

  generateReportSummary(sections) {
    const summary = {
      performance: {},
      security: {},
      compliance: {},
      generated_at: new Date()
    };

    sections.forEach(section => {
      switch (section.type) {
        case 'performance':
          summary.performance = {
            ...summary.performance,
            ...this.summarizePerformanceSection(section)
          };
          break;
        case 'security':
          summary.security = {
            ...summary.security,
            ...this.summarizeSecuritySection(section)
          };
          break;
        case 'compliance':
          summary.compliance = {
            ...summary.compliance,
            ...this.summarizeComplianceSection(section)
          };
          break;
      }
    });

    return summary;
  }

  summarizePerformanceSection(section) {
    return {
      metrics_count: Object.keys(section.metrics).length,
      overall_trend: this.calculateOverallTrend(section.metrics)
    };
  }

  summarizeSecuritySection(section) {
    return {
      risk_score: section.analytics.riskScore,
      threat_count: section.analytics.threats.length
    };
  }

  summarizeComplianceSection(section) {
    return {
      overall_score: section.compliance.summary?.compliance_score || 0,
      frameworks_count: Object.keys(section.compliance.frameworks || {}).length
    };
  }

  calculateOverallTrend(metrics) {
    const trends = Object.values(metrics).map(m => m.trend);
    return trends.reduce((a, b) => a + b, 0) / trends.length;
  }
}

module.exports = new CustomReportService();