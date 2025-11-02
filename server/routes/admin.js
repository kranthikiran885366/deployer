const express = require('express');
const router = express.Router();
const adminController = require('../controllers/adminController');
const authMiddleware = require('../middleware/auth');
const { requireRole } = require('../middleware/rbac');

// Dashboard
router.get('/dashboard', authMiddleware, requireRole(['admin']), adminController.getDashboard);

// Settings
router.get('/settings', authMiddleware, requireRole(['admin']), adminController.getAdminSettings);
router.put('/settings', authMiddleware, requireRole(['admin']), adminController.updateAdminSettings);

// Users & Team Management
router.get('/users', authMiddleware, requireRole(['admin']), adminController.getUsers);
router.get('/team', authMiddleware, requireRole(['admin']), adminController.getTeamMembers);
router.post('/team/invite', authMiddleware, requireRole(['admin']), adminController.inviteTeamMember);
router.delete('/team/:userId', authMiddleware, requireRole(['admin']), adminController.removeTeamMember);

// Analytics
router.get('/analytics/cost', authMiddleware, requireRole(['admin']), adminController.getCostAnalytics);
router.get('/analytics/performance', authMiddleware, requireRole(['admin']), adminController.getPerformanceAnalytics);
router.get('/analytics/security', authMiddleware, requireRole(['admin']), adminController.getSecurityAnalytics);
router.get('/analytics/compliance', authMiddleware, requireRole(['admin']), adminController.getComplianceAnalytics);

// Monitoring
router.get('/monitoring/health', authMiddleware, requireRole(['admin']), adminController.getSystemHealth);
router.get('/monitoring/services', authMiddleware, requireRole(['admin']), adminController.getServiceStatus);
router.get('/monitoring/alerts', authMiddleware, requireRole(['admin']), adminController.getSystemAlerts);

// System Info
router.get('/system', authMiddleware, requireRole(['admin']), adminController.getSystemInfo);

// API Management
router.get('/api/stats', authMiddleware, requireRole(['admin']), adminController.getApiStats);

// Audit Logs
router.get('/audit', authMiddleware, requireRole(['admin']), adminController.getAuditLogs);

// CI/CD Management
router.get('/cicd/stats', authMiddleware, requireRole(['admin']), adminController.getCicdStats);

// Auth Management
router.get('/auth/stats', authMiddleware, requireRole(['admin']), adminController.getAuthStats);

// Cost Management
router.get('/costs', authMiddleware, requireRole(['admin']), adminController.getCostManagement);

// Performance Management
router.get('/performance', authMiddleware, requireRole(['admin']), adminController.getPerformanceManagement);

module.exports = router;