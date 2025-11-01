const billingService = require('../services/billingService');

class BillingController {
  async getPlans(req, res) {
    try {
      const plans = await billingService.getPlans();
      res.json(plans);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }

  async getCurrentSubscription(req, res) {
    try {
      const subscription = await billingService.getSubscription(
        req.user.id,
        req.query.organizationId
      );
      res.json(subscription);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }

  async createSubscription(req, res) {
    try {
      const subscription = await billingService.createSubscription(
        req.user.id,
        req.body.planId,
        req.body.paymentMethodId,
        req.body.options
      );
      res.status(201).json(subscription);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }

  async updateSubscription(req, res) {
    try {
      const subscription = await billingService.updateSubscription(
        req.params.id,
        req.body
      );
      res.json(subscription);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }

  async cancelSubscription(req, res) {
    try {
      const subscription = await billingService.cancelSubscription(
        req.params.id,
        req.body
      );
      res.json(subscription);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }

  async getUsageAnalytics(req, res) {
    try {
      const analytics = await billingService.getUsageAnalytics(
        req.params.id,
        req.query
      );
      res.json(analytics);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }

  async recordUsage(req, res) {
    try {
      const subscription = await billingService.recordUsage(
        req.params.id,
        req.body
      );
      res.json(subscription);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }
}

module.exports = new BillingController();