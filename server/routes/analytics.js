const express = require("express")
const router = express.Router()
const analyticsController = require("../controllers/analyticsController")
const authMiddleware = require("../middleware/auth")

// Metrics
router.post("/metrics", authMiddleware, analyticsController.createMetric)
router.get("/metrics", authMiddleware, analyticsController.listMetrics)
router.get("/metrics/:deploymentId", authMiddleware, analyticsController.getDeploymentMetrics)
router.get("/metrics/stats/:projectId", authMiddleware, analyticsController.getMetricStats)
router.get("/aggregates/:projectId", authMiddleware, analyticsController.getAggregatedMetrics)

// Alerts
router.post("/alerts", authMiddleware, analyticsController.createAlert)
router.get("/alerts", authMiddleware, analyticsController.listAlerts)
router.get("/alerts/:alertId", authMiddleware, analyticsController.getAlert)
router.patch("/alerts/:alertId", authMiddleware, analyticsController.updateAlert)
router.delete("/alerts/:alertId", authMiddleware, analyticsController.deleteAlert)
router.post("/alerts/:alertId/trigger", authMiddleware, analyticsController.triggerAlert)

// Reports
router.post("/reports", authMiddleware, analyticsController.generateReport)
router.get("/reports", authMiddleware, analyticsController.listReports)
router.get("/reports/:reportId", authMiddleware, analyticsController.getReport)
router.delete("/reports/:reportId", authMiddleware, analyticsController.deleteReport)

// Dashboard
router.get("/dashboard/:projectId", authMiddleware, analyticsController.getDashboardData)
router.get("/health/:projectId", authMiddleware, analyticsController.getHealthcheck)

// Comparisons and trends
router.post("/compare", authMiddleware, analyticsController.compareMetrics)
router.get("/trends/:projectId", authMiddleware, analyticsController.getTrendAnalysis)
router.get("/alert-history", authMiddleware, analyticsController.getAlertHistory)

// Export
router.get("/export/:projectId", authMiddleware, analyticsController.exportMetrics)

module.exports = router
