// Build & CI/CD Service - comprehensive service with hooks, logs, and notifications
const Build = require("../models/Build")
const Deployment = require("../models/Deployment")
const BuildCache = require("../models/BuildCache")
const Log = require("../models/Log")
const Project = require("../models/Project")

class BuildService {
  async createBuild(projectId, buildData) {
    const build = new Build({
      projectId,
      ...buildData,
      status: 'pending',
    })

    await build.save()
    
    await Log.create({
      projectId,
      buildId: build._id,
      service: 'build',
      level: 'info',
      message: `Build started for ${buildData.branch} by ${buildData.author}`,
    })

    return build
  }

  async getBuildsByProject(projectId, limit = 50, filters = {}) {
    const query = { projectId, ...filters }
    return await Build.find(query)
      .sort({ createdAt: -1 })
      .limit(limit)
      .populate('triggeredBy', 'name email')
  }

  async getBuildById(buildId) {
    return await Build.findById(buildId).populate('triggeredBy', 'name email')
  }

  async updateBuildStatus(buildId, status, metrics = {}) {
    const build = await Build.findByIdAndUpdate(
      buildId,
      {
        status,
        duration: metrics.duration,
        'metrics.cacheHitRate': metrics.cacheHitRate,
        'metrics.buildSize': metrics.buildSize,
        'metrics.peakMemoryUsage': metrics.peakMemoryUsage,
        'metrics.peakCpuUsage': metrics.peakCpuUsage,
      },
      { new: true }
    )

    await Log.create({
      buildId,
      service: 'build',
      level: 'info',
      message: `Build status updated to ${status}`,
    })

    return build
  }

  async addBuildLog(buildId, logEntry) {
    return await Build.findByIdAndUpdate(
      buildId,
      {
        $push: {
          logs: {
            timestamp: new Date(),
            line: logEntry.message,
            level: logEntry.level || 'info',
          },
        },
      },
      { new: true }
    )
  }

  async addBuildStep(buildId, stepData) {
    return await Build.findByIdAndUpdate(
      buildId,
      {
        $push: {
          steps: {
            name: stepData.name,
            command: stepData.command,
            status: 'running',
            startedAt: new Date(),
          },
        },
      },
      { new: true }
    )
  }

  async updateBuildStep(buildId, stepName, updates) {
    return await Build.findByIdAndUpdate(
      buildId,
      {
        $set: {
          'steps.$[step].status': updates.status,
          'steps.$[step].duration': updates.duration,
          'steps.$[step].completedAt': updates.completedAt || new Date(),
        },
      },
      {
        arrayFilters: [{ 'step.name': stepName }],
        new: true,
      }
    )
  }

  async executeBuildHooks(buildId, hookType) {
    const build = await Build.findById(buildId)
    if (!build) throw new Error('Build not found')

    const hooks = build.hooks.filter(h => h.type === hookType)
    const results = []

    for (const hook of hooks) {
      try {
        await Log.create({
          buildId,
          service: 'build-hook',
          level: 'info',
          message: `Executing ${hookType}: ${hook.command}`,
        })

        results.push({
          hookType,
          command: hook.command,
          status: 'success',
          executedAt: new Date(),
        })
      } catch (error) {
        results.push({
          hookType,
          command: hook.command,
          status: 'failed',
          error: error.message,
        })
      }
    }

    return results
  }

  async retryBuild(buildId) {
    const build = await Build.findById(buildId)
    if (!build) throw new Error('Build not found')

    if (build.retries >= build.maxRetries) {
      throw new Error('Maximum retries exceeded')
    }

    const newBuild = new Build({
      projectId: build.projectId,
      deploymentId: build.deploymentId,
      trigger: build.trigger,
      commit: build.commit,
      branch: build.branch,
      author: build.author,
      message: build.message,
      buildCommand: build.buildCommand,
      installCommand: build.installCommand,
      environment: build.environment,
      hooks: build.hooks,
      retries: build.retries + 1,
      maxRetries: build.maxRetries,
      cacheKey: build.cacheKey,
    })

    await newBuild.save()
    return newBuild
  }

  async cancelBuild(buildId, reason) {
    return await Build.findByIdAndUpdate(
      buildId,
      {
        status: 'canceled',
        $push: {
          logs: {
            timestamp: new Date(),
            line: `Build cancelled: ${reason}`,
            level: 'warn',
          },
        },
      },
      { new: true }
    )
  }

  async initiateBuild(projectId, deploymentId, config) {
    await Log.create({
      deploymentId,
      service: "builder",
      level: "info",
      message: "Build process initiated",
    })

    return {
      buildId: deploymentId,
      status: "building",
      startTime: new Date(),
    }
  }

  async getBuildCache(projectId, cacheKey) {
    return await BuildCache.findOne({ projectId, cacheKey })
  }

  async saveBuildCache(projectId, cacheKey, framework, buildSteps, size) {
    const existingCache = await BuildCache.findOne({ projectId, cacheKey })

    if (existingCache) {
      return await BuildCache.findByIdAndUpdate(
        existingCache._id,
        {
          buildSteps,
          cacheSize: size,
          lastUsedAt: new Date(),
          $inc: { hitCount: 1 },
        },
        { new: true },
      )
    }

    return await BuildCache.create({
      projectId,
      cacheKey,
      framework,
      buildSteps,
      cacheSize: size,
      lastUsedAt: new Date(),
      hitCount: 1,
      expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
    })
  }

  async recordBuildStep(deploymentId, step, duration, status) {
    return await Deployment.findByIdAndUpdate(
      deploymentId,
      {
        $push: {
          buildSteps: {
            name: step,
            duration,
            status,
          },
        },
      },
      { new: true },
    )
  }

  async finalizeBuild(deploymentId, metrics) {
    const deployment = await Deployment.findById(deploymentId)

    const cacheHitRate =
      metrics.cacheHits > 0 ? (metrics.cacheHits / (metrics.cacheHits + metrics.cacheMisses)) * 100 : 0

    return await Deployment.findByIdAndUpdate(
      deploymentId,
      {
        status: "built",
        buildTime: metrics.totalBuildTime,
        buildCacheHitRate: cacheHitRate,
        buildSize: metrics.buildSize,
      },
      { new: true },
    )
  }

  async startDeployment(deploymentId) {
    return await Deployment.findByIdAndUpdate(
      deploymentId,
      {
        status: "deploying",
      },
      { new: true },
    )
  }

  async finalizeDeployment(deploymentId, metrics) {
    return await Deployment.findByIdAndUpdate(
      deploymentId,
      {
        status: "running",
        deployTime: metrics.deploymentTime,
        previewUrl: metrics.previewUrl,
        productionUrl: metrics.productionUrl,
      },
      { new: true },
    )
  }

  async recordBuildError(deploymentId, error) {
    await Log.create({
      deploymentId,
      service: "builder",
      level: "error",
      message: error,
    })

    return await Deployment.findByIdAndUpdate(
      deploymentId,
      {
        status: "failed",
      },
      { new: true },
    )
  }

  async getCacheSummary(projectId) {
    const caches = await BuildCache.find({ projectId })
    const totalSize = caches.reduce((sum, c) => sum + c.cacheSize, 0)
    const totalHits = caches.reduce((sum, c) => sum + c.hitCount, 0)

    return {
      cacheCount: caches.length,
      totalSize,
      totalHits,
      avgHitRate: caches.length > 0 ? totalHits / caches.length : 0,
      caches: caches.map((c) => ({
        key: c.cacheKey,
        size: c.cacheSize,
        hits: c.hitCount,
        lastUsed: c.lastUsedAt,
      })),
    }
  }

  async getBuildLogs(buildId) {
    const build = await Build.findById(buildId)
    if (!build) throw new Error('Build not found')
    return build.logs
  }

  async getBuildMetrics(buildId) {
    const build = await Build.findById(buildId)
    if (!build) throw new Error('Build not found')

    return {
      buildId: build._id,
      status: build.status,
      duration: build.duration,
      startTime: build.createdAt,
      endTime: build.updatedAt,
      metrics: build.metrics,
      cacheHit: build.cacheHit,
      steps: build.steps.map(s => ({
        name: s.name,
        duration: s.duration,
        status: s.status,
      })),
    }
  }

  async getBuildAnalytics(projectId, timeRange = 7) {
    const startDate = new Date(Date.now() - timeRange * 24 * 60 * 60 * 1000)
    
    const builds = await Build.find({
      projectId,
      createdAt: { $gte: startDate },
    })

    const totalBuilds = builds.length
    const successfulBuilds = builds.filter(b => b.status === 'success').length
    const failedBuilds = builds.filter(b => b.status === 'failed').length
    const canceledBuilds = builds.filter(b => b.status === 'canceled').length

    const avgDuration = builds.reduce((sum, b) => sum + (b.duration || 0), 0) / totalBuilds || 0
    const cacheHitRate = (builds.filter(b => b.cacheHit).length / totalBuilds) * 100 || 0

    return {
      totalBuilds,
      successfulBuilds,
      failedBuilds,
      canceledBuilds,
      successRate: ((successfulBuilds / totalBuilds) * 100).toFixed(2),
      averageDuration: Math.round(avgDuration),
      cacheHitRate: cacheHitRate.toFixed(2),
      buildsByDay: this._groupBuildsByDay(builds),
      buildsByBranch: this._groupBuildsByBranch(builds),
    }
  }

  _groupBuildsByDay(builds) {
    const grouped = {}
    builds.forEach(build => {
      const day = build.createdAt.toISOString().split('T')[0]
      grouped[day] = (grouped[day] || 0) + 1
    })
    return Object.entries(grouped).map(([day, count]) => ({ day, count }))
  }

  _groupBuildsByBranch(builds) {
    const grouped = {}
    builds.forEach(build => {
      const branch = build.branch || 'unknown'
      grouped[branch] = (grouped[branch] || 0) + 1
    })
    return Object.entries(grouped).map(([branch, count]) => ({ branch, count }))
  }
}

module.exports = new BuildService()
