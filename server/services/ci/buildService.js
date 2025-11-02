const { Build } = require('../../models/Build');
const { AuditLog } = require('../../models/AuditLog');
const githubActionsService = require('./githubActionsService');
const tektonService = require('./tektonService');

class BuildService {
  async createBuild(buildData) {
    try {
      const build = new Build({
        projectId: buildData.projectId,
        provider: buildData.provider,
        buildNumber: await this.getNextBuildNumber(buildData.projectId),
        trigger: buildData.trigger || 'manual',
        branch: buildData.branch || 'main',
        commit: buildData.commit,
        config: buildData.config,
        status: 'pending',
        startedAt: new Date()
      });

      await build.save();

      await AuditLog.create({
        projectId: buildData.projectId,
        action: 'build_created',
        details: {
          buildId: build._id,
          provider: buildData.provider,
          trigger: buildData.trigger
        },
        timestamp: new Date()
      });

      // Start the build based on provider
      await this.startBuild(build);

      return build;
    } catch (error) {
      throw new Error(`Failed to create build: ${error.message}`);
    }
  }

  async getNextBuildNumber(projectId) {
    const lastBuild = await Build.findOne({ projectId })
      .sort({ buildNumber: -1 })
      .select('buildNumber');
    return (lastBuild?.buildNumber || 0) + 1;
  }

  async startBuild(build) {
    try {
      switch (build.provider) {
        case 'github':
          await this.startGitHubBuild(build);
          break;
        case 'tekton':
          await this.startTektonBuild(build);
          break;
        default:
          throw new Error(`Unsupported build provider: ${build.provider}`);
      }
    } catch (error) {
      await Build.findByIdAndUpdate(build._id, {
        status: 'failed',
        error: error.message,
        endedAt: new Date()
      });
      throw error;
    }
  }

  async startGitHubBuild(build) {
    const { owner, repo, workflow } = build.config;
    await githubActionsService.triggerWorkflow(
      owner,
      repo,
      workflow,
      build.branch,
      {
        buildId: build._id.toString()
      }
    );
  }

  async startTektonBuild(build) {
    const { pipeline, params, workspaces } = build.config;
    await tektonService.runPipeline(
      pipeline,
      {
        ...params,
        buildId: build._id.toString()
      },
      workspaces
    );
  }

  async getBuild(buildId) {
    const build = await Build.findById(buildId);
    if (!build) {
      throw new Error('Build not found');
    }
    return build;
  }

  async listBuilds(projectId, options = {}) {
    const query = { projectId };
    if (options.status) {
      query.status = options.status;
    }
    if (options.provider) {
      query.provider = options.provider;
    }

    const builds = await Build.find(query)
      .sort({ startedAt: -1 })
      .skip(options.offset || 0)
      .limit(options.limit || 20);

    const total = await Build.countDocuments(query);

    return {
      builds,
      total,
      offset: options.offset || 0,
      limit: options.limit || 20
    };
  }

  async updateBuildStatus(buildId, status, details = {}) {
    const build = await Build.findById(buildId);
    if (!build) {
      throw new Error('Build not found');
    }

    const updates = {
      status,
      ...details
    };

    if (['completed', 'failed', 'cancelled'].includes(status)) {
      updates.endedAt = new Date();
    }

    const updatedBuild = await Build.findByIdAndUpdate(
      buildId,
      updates,
      { new: true }
    );

    await AuditLog.create({
      projectId: build.projectId,
      action: 'build_status_updated',
      details: {
        buildId,
        oldStatus: build.status,
        newStatus: status,
        ...details
      },
      timestamp: new Date()
    });

    return updatedBuild;
  }

  async cancelBuild(buildId) {
    const build = await Build.findById(buildId);
    if (!build) {
      throw new Error('Build not found');
    }

    if (!['pending', 'running'].includes(build.status)) {
      throw new Error('Build cannot be cancelled in its current state');
    }

    try {
      switch (build.provider) {
        case 'github':
          const { owner, repo, runId } = build.config;
          await githubActionsService.cancelWorkflowRun(owner, repo, runId);
          break;
        case 'tekton':
          const { pipelineRunName } = build.config;
          await tektonService.cancelPipelineRun(pipelineRunName);
          break;
      }

      await this.updateBuildStatus(buildId, 'cancelled', {
        error: 'Build cancelled by user'
      });

      await AuditLog.create({
        projectId: build.projectId,
        action: 'build_cancelled',
        details: { buildId },
        timestamp: new Date()
      });

      return true;
    } catch (error) {
      throw new Error(`Failed to cancel build: ${error.message}`);
    }
  }

  async getBuildLogs(buildId) {
    const build = await Build.findById(buildId);
    if (!build) {
      throw new Error('Build not found');
    }

    try {
      switch (build.provider) {
        case 'github':
          const { owner, repo, runId } = build.config;
          return await githubActionsService.getWorkflowRunLogs(owner, repo, runId);
        case 'tekton':
          const { pipelineRunName } = build.config;
          return await tektonService.getPipelineRunLogs(pipelineRunName);
        default:
          throw new Error(`Unsupported build provider: ${build.provider}`);
      }
    } catch (error) {
      throw new Error(`Failed to get build logs: ${error.message}`);
    }
  }

  async retryBuild(buildId) {
    const originalBuild = await Build.findById(buildId);
    if (!originalBuild) {
      throw new Error('Build not found');
    }

    const retryBuild = await this.createBuild({
      ...originalBuild.toObject(),
      trigger: 'retry',
      originalBuildId: buildId
    });

    await AuditLog.create({
      projectId: originalBuild.projectId,
      action: 'build_retried',
      details: {
        originalBuildId: buildId,
        newBuildId: retryBuild._id
      },
      timestamp: new Date()
    });

    return retryBuild;
  }

  async getBuildMetrics(projectId, timeRange = 30) {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - timeRange);

    const builds = await Build.find({
      projectId,
      startedAt: { $gte: startDate }
    });

    return {
      total: builds.length,
      successful: builds.filter(b => b.status === 'completed').length,
      failed: builds.filter(b => b.status === 'failed').length,
      cancelled: builds.filter(b => b.status === 'cancelled').length,
      averageDuration: this.calculateAverageDuration(builds),
      successRate: (builds.filter(b => b.status === 'completed').length / builds.length) * 100,
      byProvider: this.groupBuildsByProvider(builds),
      byTrigger: this.groupBuildsByTrigger(builds),
      timeline: this.generateBuildTimeline(builds, timeRange)
    };
  }

  calculateAverageDuration(builds) {
    const completedBuilds = builds.filter(b => b.endedAt);
    if (completedBuilds.length === 0) return 0;

    const totalDuration = completedBuilds.reduce((sum, build) => {
      return sum + (build.endedAt - build.startedAt);
    }, 0);

    return totalDuration / completedBuilds.length;
  }

  groupBuildsByProvider(builds) {
    return builds.reduce((acc, build) => {
      acc[build.provider] = (acc[build.provider] || 0) + 1;
      return acc;
    }, {});
  }

  groupBuildsByTrigger(builds) {
    return builds.reduce((acc, build) => {
      acc[build.trigger] = (acc[build.trigger] || 0) + 1;
      return acc;
    }, {});
  }

  generateBuildTimeline(builds, timeRange) {
    const timeline = [];
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - timeRange);

    for (let i = 0; i <= timeRange; i++) {
      const date = new Date(startDate);
      date.setDate(date.getDate() + i);
      const dayBuilds = builds.filter(b => {
        const buildDate = new Date(b.startedAt);
        return buildDate.toDateString() === date.toDateString();
      });

      timeline.push({
        date: date.toISOString().split('T')[0],
        total: dayBuilds.length,
        successful: dayBuilds.filter(b => b.status === 'completed').length,
        failed: dayBuilds.filter(b => b.status === 'failed').length
      });
    }

    return timeline;
  }
}

module.exports = new BuildService();