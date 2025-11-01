// Project Service
const Project = require("../models/Project")
const Deployment = require("../models/Deployment")
const Function = require("../models/Function")
const Environment = require("../models/Environment")

class ProjectService {
  async createProject(userId, data) {
    const project = new Project({
      userId,
      name: data.name,
      description: data.description,
      framework: data.framework,
      region: data.region || "iad1",
      githubRepo: data.githubRepo,
      gitlabRepo: data.gitlabRepo,
      buildCommand: data.buildCommand,
      startCommand: data.startCommand,
      rootDirectory: data.rootDirectory || "/",
      autoDeploy: data.autoDeploy !== false,
    })

    await project.save()
    return project
  }

  async getProjects(userId) {
    return await Project.find({ userId }).sort({ createdAt: -1 })
  }

  async getProjectById(id) {
    return await Project.findById(id)
  }

  async updateProject(id, data) {
    return await Project.findByIdAndUpdate(id, data, { new: true })
  }

  async deleteProject(id) {
    await Deployment.deleteMany({ projectId: id })
    await Function.deleteMany({ projectId: id })
    await Environment.deleteMany({ projectId: id })
    return await Project.findByIdAndDelete(id)
  }

  async getProjectStats(projectId) {
    const allDeployments = await Deployment.find({ projectId })
    const deployments = allDeployments.length
    const failedDeployments = allDeployments.filter((d) => d.status === "failed").length
    const runningDeployments = allDeployments.filter((d) => d.status === "running").length
    const successfulDeployments = deployments - failedDeployments

    const avgBuildTime = allDeployments.reduce((sum, d) => sum + (d.buildTime || 0), 0) / Math.max(deployments, 1)
    const avgDeployTime = allDeployments.reduce((sum, d) => sum + (d.deployTime || 0), 0) / Math.max(deployments, 1)
    const avgCacheHitRate =
      allDeployments.reduce((sum, d) => sum + (d.buildCacheHitRate || 0), 0) / Math.max(deployments, 1)

    return {
      totalDeployments: deployments,
      successfulDeployments,
      failedDeployments,
      runningDeployments,
      successRate: deployments > 0 ? ((successfulDeployments / deployments) * 100).toFixed(2) : 0,
      avgBuildTime: Math.round(avgBuildTime),
      avgDeployTime: Math.round(avgDeployTime),
      avgCacheHitRate: Math.round(avgCacheHitRate),
      lastDeployment: allDeployments[0],
    }
  }

  async getProjectHealth(projectId) {
    const stats = await this.getProjectStats(projectId)
    const recentDeployments = await Deployment.find({ projectId }).limit(10)

    const failureRate = 100 - Number(stats.successRate)
    let health = "healthy"

    if (failureRate > 50) health = "critical"
    else if (failureRate > 20) health = "warning"
    else if (failureRate > 5) health = "degraded"

    return {
      status: health,
      metrics: stats,
      recentDeployments,
    }
  }

  async updateProjectSettings(projectId, settings) {
    return await Project.findByIdAndUpdate(projectId, settings, { new: true })
  }
}

module.exports = new ProjectService()
