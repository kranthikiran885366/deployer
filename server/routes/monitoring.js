// Monitoring Routes - new routes for monitoring
const express = require("express")
const router = express.Router()
const monitoringService = require("../services/monitoringService")
const authMiddleware = require("../middleware/auth")

router.post("/metric", authMiddleware, async (req, res, next) => {
  try {
    const { projectId, deploymentId, metricType, value, region } = req.body
    const metric = await monitoringService.recordMetric(projectId, deploymentId, metricType, value, region)
    res.status(201).json(metric)
  } catch (error) {
    next(error)
  }
})

router.get("/metrics/:projectId", authMiddleware, async (req, res, next) => {
  try {
    const { projectId } = req.params
    const { metricType, timeRange = 7 } = req.query
    const metrics = await monitoringService.getMetrics(projectId, metricType, Number.parseInt(timeRange))
    res.json(metrics)
  } catch (error) {
    next(error)
  }
})

router.get("/summary/:projectId", authMiddleware, async (req, res, next) => {
  try {
    const { projectId } = req.params
    const { timeRange = 7 } = req.query
    const summary = await monitoringService.getProjectMetricsSummary(projectId, Number.parseInt(timeRange))
    res.json(summary)
  } catch (error) {
    next(error)
  }
})

router.get("/health/:projectId", authMiddleware, async (req, res, next) => {
  try {
    const { projectId } = req.params
    const health = await monitoringService.getServiceHealth(projectId)
    res.json(health)
  } catch (error) {
    next(error)
  }
})

router.get("/errors/:projectId", authMiddleware, async (req, res, next) => {
  try {
    const { projectId } = req.params
    const { timeRange = 1 } = req.query
    const errors = await monitoringService.getErrorLogs(projectId, Number.parseInt(timeRange))
    res.json(errors)
  } catch (error) {
    next(error)
  }
})

module.exports = router
