const express = require('express');
const router = express.Router();
const { authenticate } = require('../middleware/auth');
const { rateLimiter } = require('../middleware/rateLimiter');

// Import all feature routers - Existing features
const splitTestingRoutes = require('./split-testing');
const blueprintRoutes = require('./blueprints');
const isrConfigRoutes = require('./isr-config');
const edgeHandlerRoutes = require('./edge-handlers');
const mediaCdnRoutes = require('./media-cdn');
const multiRegionRoutes = require('./multi-region');
const billingRoutes = require('./billing');

// Import all feature routers - New features (1-15)
const buildRoutes = require('./builds');
const functionRoutes = require('./functions');
const securityRoutes = require('./security');
const analyticsRoutes = require('./analytics');
const teamRoutes = require('./team');
const databaseRoutes = require('./databases');
const apiTokenRoutes = require('./api-tokens');
const webhookRoutes = require('./webhooks');
const settingsRoutes = require('./settings');

// Existing feature routes
router.use('/split-testing', authenticate, splitTestingRoutes);
router.use('/blueprints', authenticate, blueprintRoutes);
router.use('/isr-config', authenticate, isrConfigRoutes);
router.use('/edge-handlers', authenticate, edgeHandlerRoutes);
router.use('/media-cdn', authenticate, mediaCdnRoutes);
router.use('/multi-region', authenticate, multiRegionRoutes);
router.use('/billing', billingRoutes);

// New feature routes (1-15)
router.use('/builds', authenticate, buildRoutes);
router.use('/functions', authenticate, functionRoutes);
router.use('/security', authenticate, securityRoutes);
router.use('/analytics', authenticate, analyticsRoutes);
router.use('/team', authenticate, teamRoutes);
router.use('/databases', authenticate, databaseRoutes);
router.use('/api-tokens', authenticate, apiTokenRoutes);
router.use('/webhooks', authenticate, webhookRoutes);
router.use('/settings', authenticate, settingsRoutes);

// Health check endpoint
router.get('/health', (req, res) => {
  res.json({ status: 'healthy', timestamp: new Date() });
});

// API status endpoint
router.get('/status', authenticate, (req, res) => {
  res.json({ 
    status: 'online',
    user: req.user,
    timestamp: new Date()
  });
});

module.exports = router;