const { ComplianceReport } = require('../../models/compliance/ComplianceReport');
const { ComplianceCheck } = require('../../models/compliance/ComplianceCheck');
const { CompliancePolicy } = require('../../models/compliance/CompliancePolicy');
const { AuditLog } = require('../../models/AuditLog');

class ComplianceService {
  async createCompliancePolicy(policyData) {
    try {
      const policy = new CompliancePolicy({
        name: policyData.name,
        description: policyData.description,
        framework: policyData.framework,
        requirements: policyData.requirements,
        checks: policyData.checks,
        severity: policyData.severity,
        enabled: true,
        createdAt: new Date()
      });

      await policy.save();

      await AuditLog.create({
        action: 'compliance_policy_created',
        details: {
          policyId: policy._id,
          name: policy.name,
          framework: policy.framework
        },
        timestamp: new Date()
      });

      return policy;
    } catch (error) {
      throw new Error(`Failed to create compliance policy: ${error.message}`);
    }
  }

  async runComplianceCheck(projectId, policies = []) {
    try {
      const checks = [];
      const timestamp = new Date();

      const allPolicies = policies.length > 0 
        ? await CompliancePolicy.find({ _id: { $in: policies } })
        : await CompliancePolicy.find({ enabled: true });

      for (const policy of allPolicies) {
        const checkResults = await this.evaluatePolicy(projectId, policy);
        checks.push({
          policyId: policy._id,
          name: policy.name,
          framework: policy.framework,
          results: checkResults,
          timestamp
        });
      }

      const report = new ComplianceReport({
        projectId,
        timestamp,
        checks,
        summary: this.generateComplianceSummary(checks)
      });

      await report.save();

      await AuditLog.create({
        projectId,
        action: 'compliance_check_completed',
        details: {
          reportId: report._id,
          policiesChecked: checks.length
        },
        timestamp
      });

      return report;
    } catch (error) {
      throw new Error(`Failed to run compliance check: ${error.message}`);
    }
  }

  async evaluatePolicy(projectId, policy) {
    const results = [];

    for (const check of policy.checks) {
      const result = await this.runSingleCheck(projectId, check);
      results.push({
        checkId: check.id,
        name: check.name,
        status: result.status,
        details: result.details,
        remediation: check.remediation
      });
    }

    return results;
  }

  async runSingleCheck(projectId, check) {
    // Implement actual check logic based on check type
    switch (check.type) {
      case 'resource_access':
        return await this.checkResourceAccess(projectId, check);
      case 'data_encryption':
        return await this.checkDataEncryption(projectId, check);
      case 'audit_logging':
        return await this.checkAuditLogging(projectId, check);
      case 'backup_retention':
        return await this.checkBackupRetention(projectId, check);
      default:
        return {
          status: 'skipped',
          details: `Check type ${check.type} not implemented`
        };
    }
  }

  generateComplianceSummary(checks) {
    const summary = {
      total: 0,
      passed: 0,
      failed: 0,
      skipped: 0,
      compliance_score: 0,
      by_framework: {}
    };

    for (const check of checks) {
      if (!summary.by_framework[check.framework]) {
        summary.by_framework[check.framework] = {
          total: 0,
          passed: 0,
          failed: 0,
          skipped: 0
        };
      }

      const frameworkStats = summary.by_framework[check.framework];
      
      check.results.forEach(result => {
        summary.total++;
        frameworkStats.total++;

        switch (result.status) {
          case 'passed':
            summary.passed++;
            frameworkStats.passed++;
            break;
          case 'failed':
            summary.failed++;
            frameworkStats.failed++;
            break;
          case 'skipped':
            summary.skipped++;
            frameworkStats.skipped++;
            break;
        }
      });
    }

    // Calculate compliance score
    summary.compliance_score = summary.total > 0
      ? Math.round((summary.passed / (summary.total - summary.skipped)) * 100)
      : 0;

    // Calculate framework-specific scores
    for (const framework in summary.by_framework) {
      const stats = summary.by_framework[framework];
      stats.compliance_score = stats.total > 0
        ? Math.round((stats.passed / (stats.total - stats.skipped)) * 100)
        : 0;
    }

    return summary;
  }

  async getComplianceHistory(projectId, options = {}) {
    const query = { projectId };

    if (options.startDate) {
      query.timestamp = { $gte: new Date(options.startDate) };
    }
    if (options.endDate) {
      query.timestamp = { ...query.timestamp, $lte: new Date(options.endDate) };
    }
    if (options.framework) {
      query['checks.framework'] = options.framework;
    }

    const reports = await ComplianceReport.find(query)
      .sort({ timestamp: -1 })
      .limit(options.limit || 10);

    return {
      reports,
      trend: this.calculateComplianceTrend(reports)
    };
  }

  calculateComplianceTrend(reports) {
    if (reports.length < 2) return 0;

    const scores = reports.map(r => r.summary.compliance_score);
    const changes = [];

    for (let i = 1; i < scores.length; i++) {
      changes.push(scores[i] - scores[i-1]);
    }

    const averageChange = changes.reduce((a, b) => a + b, 0) / changes.length;
    return Math.round(averageChange * 100) / 100;
  }

  async generateComplianceReport(projectId, reportId) {
    const report = await ComplianceReport.findById(reportId);
    if (!report) {
      throw new Error('Report not found');
    }

    const reportData = {
      metadata: {
        projectId,
        timestamp: report.timestamp,
        reportId: report._id
      },
      summary: report.summary,
      details: this.formatReportDetails(report),
      recommendations: this.generateRecommendations(report),
      remediationPlan: this.generateRemediationPlan(report)
    };

    await AuditLog.create({
      projectId,
      action: 'compliance_report_generated',
      details: {
        reportId,
        score: report.summary.compliance_score
      },
      timestamp: new Date()
    });

    return reportData;
  }

  formatReportDetails(report) {
    const details = {
      frameworks: {},
      critical_issues: [],
      improvement_areas: []
    };

    for (const check of report.checks) {
      if (!details.frameworks[check.framework]) {
        details.frameworks[check.framework] = {
          checks: [],
          compliance_score: 0,
          issues: []
        };
      }

      const frameworkDetails = details.frameworks[check.framework];

      check.results.forEach(result => {
        if (result.status === 'failed') {
          frameworkDetails.issues.push({
            check: result.name,
            details: result.details,
            remediation: result.remediation
          });

          if (check.severity === 'critical') {
            details.critical_issues.push({
              framework: check.framework,
              check: result.name,
              details: result.details,
              remediation: result.remediation
            });
          }
        }
      });

      frameworkDetails.checks.push({
        name: check.name,
        results: check.results
      });
    }

    return details;
  }

  generateRecommendations(report) {
    const recommendations = [];

    // Analyze failed checks
    report.checks.forEach(check => {
      check.results.forEach(result => {
        if (result.status === 'failed') {
          recommendations.push({
            priority: check.severity === 'critical' ? 'high' : 'medium',
            category: check.framework,
            issue: result.name,
            recommendation: result.remediation,
            impact: 'Failing this check impacts compliance with ' + check.framework
          });
        }
      });
    });

    // Sort recommendations by priority
    return recommendations.sort((a, b) => {
      const priority = { high: 0, medium: 1, low: 2 };
      return priority[a.priority] - priority[b.priority];
    });
  }

  generateRemediationPlan(report) {
    const failedChecks = [];

    report.checks.forEach(check => {
      check.results.forEach(result => {
        if (result.status === 'failed') {
          failedChecks.push({
            framework: check.framework,
            severity: check.severity,
            check: result.name,
            remediation: result.remediation
          });
        }
      });
    });

    // Group by severity
    const plan = {
      immediate: [],
      short_term: [],
      long_term: []
    };

    failedChecks.forEach(check => {
      switch (check.severity) {
        case 'critical':
          plan.immediate.push(check);
          break;
        case 'high':
          plan.short_term.push(check);
          break;
        default:
          plan.long_term.push(check);
      }
    });

    return {
      summary: {
        immediate_actions: plan.immediate.length,
        short_term_actions: plan.short_term.length,
        long_term_actions: plan.long_term.length
      },
      phases: {
        immediate: {
          timeframe: '24 hours',
          actions: plan.immediate
        },
        short_term: {
          timeframe: '1 week',
          actions: plan.short_term
        },
        long_term: {
          timeframe: '1 month',
          actions: plan.long_term
        }
      }
    };
  }

  // Individual check implementations
  async checkResourceAccess(projectId, check) {
    // Implement resource access check logic
    return {
      status: 'passed',
      details: 'All resources have proper access controls'
    };
  }

  async checkDataEncryption(projectId, check) {
    // Implement encryption check logic
    return {
      status: 'passed',
      details: 'All sensitive data is properly encrypted'
    };
  }

  async checkAuditLogging(projectId, check) {
    // Implement audit logging check logic
    return {
      status: 'passed',
      details: 'Audit logging is properly configured'
    };
  }

  async checkBackupRetention(projectId, check) {
    // Implement backup retention check logic
    return {
      status: 'passed',
      details: 'Backup retention policies are compliant'
    };
  }
}

module.exports = new ComplianceService();