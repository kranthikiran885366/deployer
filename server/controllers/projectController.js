// Project Controller
const projectService = require("../services/projectService")

class ProjectController {
  async createProject(req, res, next) {
    try {
      const project = await projectService.createProject(req.user.userId, req.body)
      res.status(201).json(project)
    } catch (error) {
      next(error)
    }
  }

  async getProjects(req, res, next) {
    try {
      const projects = await projectService.getProjects(req.user.userId)
      res.json(projects)
    } catch (error) {
      next(error)
    }
  }

  async getProjectById(req, res, next) {
    try {
      const { id } = req.params
      const project = await projectService.getProjectById(id)
      if (!project) {
        return res.status(404).json({ error: "Project not found" })
      }
      res.json(project)
    } catch (error) {
      next(error)
    }
  }

  async updateProject(req, res, next) {
    try {
      const { id } = req.params
      const project = await projectService.updateProject(id, req.body)
      res.json(project)
    } catch (error) {
      next(error)
    }
  }

  async deleteProject(req, res, next) {
    try {
      const { id } = req.params
      await projectService.deleteProject(id)
      res.json({ message: "Project deleted successfully" })
    } catch (error) {
      next(error)
    }
  }

  async getProjectStats(req, res, next) {
    try {
      const { id } = req.params
      const stats = await projectService.getProjectStats(id)
      res.json(stats)
    } catch (error) {
      next(error)
    }
  }

  async getProjectHealth(req, res, next) {
    try {
      const { id } = req.params
      const health = await projectService.getProjectHealth(id)
      res.json(health)
    } catch (error) {
      next(error)
    }
  }

  async updateProjectSettings(req, res, next) {
    try {
      const { id } = req.params
      const settings = req.body
      const project = await projectService.updateProjectSettings(id, settings)
      res.json(project)
    } catch (error) {
      next(error)
    }
  }
}

module.exports = new ProjectController()
