// Deployment Service
const Deployment = require("../models/Deployment")
const Project = require("../models/Project")
const Log = require("../models/Log")
const BuildCache = require("../models/BuildCache")
const DeploymentAnalytics = require("../models/DeploymentAnalytics")
const deployerFactory = require("./deployers/deployerFactory")

class DeploymentService {
  async createDeployment(data) {
    const deployment = new Deployment({
      projectId: data.projectId,
      gitCommit: data.gitCommit,
      gitBranch: data.gitBranch,
      gitAuthor: data.gitAuthor,
      commitMessage: data.commitMessage,
      environment: data.environment || "preview",
      deploymentContext: data.deploymentContext || "production",
      canaryDeployment: data.canaryDeployment || false,
      canaryPercentage: data.canaryPercentage || 10,
      provider: data.provider || "custom",
      providerConfig: data.providerConfig || {},
      status: "pending",
    })

    await deployment.save()

    await Log.create({
      projectId: data.projectId,
      deploymentId: deployment._id,
      service: "deployment",
      level: "info",
      message: `Deployment started for commit ${data.gitCommit} by ${data.gitAuthor}`,
    })

    return deployment
  }

  async getDeployments(projectId, limit = 50, filters = {}) {
    const query = { projectId, ...filters }
    return await Deployment.find(query).sort({ createdAt: -1 }).limit(limit).populate("deployedBy", "name email")
  }

  async getDeploymentById(id) {
    return await Deployment.findById(id).populate("deployedBy", "name email")
  }

  async updateDeploymentStatus(id, status, metrics = {}) {
    const deployment = await Deployment.findByIdAndUpdate(
      id,
      {
        status,
        buildTime: metrics.buildTime,
        deployTime: metrics.deployTime,
        buildCacheHitRate: metrics.cacheHitRate,
        buildSize: metrics.buildSize,
      },
      { new: true },
    )

    await Log.create({
      deploymentId: id,
      service: "deployment",
      level: "info",
      message: `Deployment status updated to ${status}`,
    })

    if (status === "running") {
      await this.recordAnalytics(deployment.projectId, id, metrics)
    }

    return deployment
  }

  async rollbackDeployment(id, reason) {
    const deployment = await Deployment.findById(id)
    if (!deployment) throw new Error("Deployment not found")

    const previousDeployment = await Deployment.findOne({
      projectId: deployment.projectId,
      _id: { $ne: id },
      status: "running",
    }).sort({ createdAt: -1 })

    if (!previousDeployment) {
      throw new Error("No previous deployment to rollback to")
    }

    await this.updateDeploymentStatus(id, "rolled-back")
    await Deployment.updateOne({ _id: id }, { rollbackReason: reason })

    await Log.create({
      deploymentId: id,
      service: "deployment",
      level: "warn",
      message: `Deployment rolled back: ${reason}`,
    })

    return previousDeployment
  }

  async checkBuildCache(projectId, cacheKey, framework) {
    const cache = await BuildCache.findOne({ projectId, cacheKey })
    if (cache) {
      await BuildCache.updateOne({ _id: cache._id }, { lastUsedAt: new Date(), $inc: { hitCount: 1 } })
      return cache
    }
    return null
  }

  async saveBuildCache(projectId, cacheKey, framework, buildSteps, size) {
    return await BuildCache.create({
      projectId,
      cacheKey,
      framework,
      buildSteps,
      cacheSize: size,
      lastUsedAt: new Date(),
      expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
    })
  }

  async recordAnalytics(projectId, deploymentId, metrics) {
    const analyticsData = [
      { projectId, deploymentId, metricType: "response_time", value: metrics.responseTime || 145 },
      { projectId, deploymentId, metricType: "memory_usage", value: metrics.memoryUsage || 256 },
      { projectId, deploymentId, metricType: "cpu_usage", value: metrics.cpuUsage || 45 },
    ]
    return await DeploymentAnalytics.insertMany(analyticsData)
  }

  async getDeploymentAnalytics(projectId, timeRange = 7) {
    const startDate = new Date(Date.now() - timeRange * 24 * 60 * 60 * 1000)
    return await DeploymentAnalytics.find({
      projectId,
      timestamp: { $gte: startDate },
    }).sort({ timestamp: -1 })
  }

  async addDeploymentLog(deploymentId, log) {
    return await Log.create({
      deploymentId,
      service: log.service,
      level: log.level || "info",
      message: log.message,
    })
  }

  async getDeploymentLogs(deploymentId) {
    return await Log.find({ deploymentId }).sort({ createdAt: 1 })
  }

  async getDeploymentMetrics(deploymentId) {
    const deployment = await this.getDeploymentById(deploymentId)
    const analytics = await DeploymentAnalytics.find({ deploymentId })
    return {
      deployment,
      metrics: analytics,
      summary: {
        buildTime: deployment.buildTime,
        deployTime: deployment.deployTime,
        cacheHitRate: deployment.buildCacheHitRate,
        buildSize: deployment.buildSize,
      },
    }
  }

  /**
   * Start deployment using provider adapter
   */
  async startDeploymentWithProvider(deploymentId, project, providerConfig = {}) {
    const deployment = await this.getDeploymentById(deploymentId)
    if (!deployment) throw new Error("Deployment not found")

    const provider = deployment.provider || "custom"

    // If using a provider, call the adapter
    if (provider !== "custom") {
      try {
        await this.updateDeploymentStatus(deploymentId, "building")

        const result = await deployerFactory.createDeployment(provider, project, {
          ...deployment.providerConfig,
          ...providerConfig,
        })

        // Update deployment with provider info
        await Deployment.findByIdAndUpdate(deploymentId, {
          providerDeploymentId: result.providerDeploymentId,
          providerMetadata: result.metadata,
          previewUrl: result.url,
          productionUrl: result.url,
          status: result.status,
        })

        await Log.create({
          deploymentId,
          service: "deployment",
          level: "info",
          message: `Deployment sent to ${provider}: ${result.providerDeploymentId}`,
        })

        return result
      } catch (error) {
        await this.updateDeploymentStatus(deploymentId, "failed")
        throw error
      }
    }

    // For custom deployments, just update status
    await this.updateDeploymentStatus(deploymentId, "building")
    return { status: "building", message: "Custom deployment started" }
  }

  /**
   * Poll provider for deployment status updates
   */
  async pollDeploymentStatus(deploymentId) {
    const deployment = await this.getDeploymentById(deploymentId)
    if (!deployment || !deployment.providerDeploymentId) {
      throw new Error("Deployment or provider ID not found")
    }

    try {
      const status = await deployerFactory.getDeploymentStatus(deployment.provider, deployment.providerDeploymentId)

      await Deployment.findByIdAndUpdate(deploymentId, {
        status: status.status,
        previewUrl: status.url || deployment.previewUrl,
      })

      if (status.metadata) {
        await Log.create({
          deploymentId,
          service: "deployment",
          level: "info",
          message: `Status update: ${status.status} (${Math.round(status.progress || 0)}%)`,
        })
      }

      return status
    } catch (error) {
      throw new Error(`Failed to poll deployment status: ${error.message}`)
    }
  }

  /**
   * Get deployment logs from provider
   */
  async getProviderLogs(deploymentId, options = {}) {
    const deployment = await this.getDeploymentById(deploymentId)
    if (!deployment || !deployment.providerDeploymentId) {
      throw new Error("Deployment or provider ID not found")
    }

    return await deployerFactory.getDeploymentLogs(deployment.provider, deployment.providerDeploymentId, options)
  }

  /**
   * Cancel deployment via provider
   */
  async cancelDeploymentViaProvider(deploymentId) {
    const deployment = await this.getDeploymentById(deploymentId)
    if (!deployment || !deployment.providerDeploymentId) {
      throw new Error("Deployment or provider ID not found")
    }

    const result = await deployerFactory.cancelDeployment(deployment.provider, deployment.providerDeploymentId)

    await this.updateDeploymentStatus(deploymentId, "rolled-back")
    await Log.create({
      deploymentId,
      service: "deployment",
      level: "info",
      message: `Deployment canceled via ${deployment.provider}`,
    })

    return result
  }
}

module.exports = new DeploymentService()
