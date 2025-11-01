// Domains Routes
const express = require("express")
const router = express.Router()
const domainController = require("../controllers/domainController")
const authMiddleware = require("../middleware/auth")

router.post("/project/:projectId", authMiddleware, domainController.createDomain)
router.get("/project/:projectId", authMiddleware, domainController.getDomains)
router.post("/:id/verify", authMiddleware, domainController.verifyDomain)
router.delete("/:id", authMiddleware, domainController.deleteDomain)

module.exports = router
