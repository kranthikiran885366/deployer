const express = require('express');
const router = express.Router();
const edgeHandlerController = require('../controllers/edgeHandlerController');
const { authenticate } = require('../middleware/auth');

// List all edge handlers
router.get('/', authenticate, edgeHandlerController.listHandlers);

// Get a specific edge handler
router.get('/:id', authenticate, edgeHandlerController.getHandler);

// Create a new edge handler
router.post('/', authenticate, edgeHandlerController.createHandler);

// Update an edge handler
router.put('/:id', authenticate, edgeHandlerController.updateHandler);

// Delete an edge handler
router.delete('/:id', authenticate, edgeHandlerController.deleteHandler);

// Deploy an edge handler
router.post('/:id/deploy', authenticate, edgeHandlerController.deployHandler);

// Test an edge handler
router.post('/:id/test', authenticate, edgeHandlerController.testHandler);

module.exports = router;