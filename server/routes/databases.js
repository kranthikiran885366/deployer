// Database Routes - Enhanced
const express = require("express")
const router = express.Router()
const databaseController = require("../controllers/databaseController")
const authMiddleware = require("../middleware/auth")

// Databases
router.post("/", authMiddleware, databaseController.createDatabase)
router.get("/", authMiddleware, databaseController.listDatabases)
router.get("/:databaseId", authMiddleware, databaseController.getDatabase)
router.patch("/:databaseId", authMiddleware, databaseController.updateDatabase)
router.delete("/:databaseId", authMiddleware, databaseController.deleteDatabase)

// Query operations
router.post("/:databaseId/query", authMiddleware, databaseController.executeQuery)
router.get("/:databaseId/tables", authMiddleware, databaseController.getTables)
router.get("/:databaseId/tables/:tableName/schema", authMiddleware, databaseController.getTableSchema)
router.get("/:databaseId/tables/:tableName/browse", authMiddleware, databaseController.browseTable)

// Backups
router.post("/:databaseId/backups", authMiddleware, databaseController.createBackup)
router.get("/:databaseId/backups", authMiddleware, databaseController.listBackups)
router.post("/:databaseId/backups/:backupId/restore", authMiddleware, databaseController.restoreBackup)
router.delete("/:databaseId/backups/:backupId", authMiddleware, databaseController.deleteBackup)

// Statistics and health
router.get("/:databaseId/stats", authMiddleware, databaseController.getStatistics)
router.get("/:databaseId/health", authMiddleware, databaseController.getHealth)
router.get("/:databaseId/metrics", authMiddleware, databaseController.getMetrics)
router.get("/:databaseId/connections", authMiddleware, databaseController.getConnections)

// Database users
router.post("/:databaseId/users", authMiddleware, databaseController.createDatabaseUser)
router.get("/:databaseId/users", authMiddleware, databaseController.listDatabaseUsers)

module.exports = router
