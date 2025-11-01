const crypto = require("crypto")
const { Webhook } = require("../models/ApiToken")

class WebhookService {
  async createWebhook(projectId, url, events, secret) {
    const webhookSecret = secret || crypto.randomBytes(32).toString("hex")

    const webhook = new Webhook({
      projectId,
      url,
      events: events || [],
      secret: webhookSecret,
      isActive: true,
      retryPolicy: {
        maxAttempts: 3,
        backoffMultiplier: 2,
        initialDelayMs: 1000,
      },
    })

    await webhook.save()

    return webhook
  }

  async listWebhooks(projectId, { limit = 50, offset = 0 }) {
    const webhooks = await Webhook.find({ projectId })
      .sort({ createdAt: -1 })
      .skip(offset)
      .limit(limit)

    const total = await Webhook.countDocuments({ projectId })

    return { webhooks, total, limit, offset }
  }

  async updateWebhook(webhookId, updates) {
    return await Webhook.findByIdAndUpdate(webhookId, updates, { new: true })
  }

  async deleteWebhook(webhookId) {
    return await Webhook.findByIdAndUpdate(
      webhookId,
      { isActive: false },
      { new: true }
    )
  }

  async testWebhook(webhookId, payload) {
    const webhook = await Webhook.findById(webhookId)
    if (!webhook) throw new Error("Webhook not found")

    const delivery = {
      eventType: "test",
      deliveredAt: new Date(),
      status: "pending",
      attempts: 0,
    }

    try {
      const result = await this._deliverWebhook(webhook, payload)
      delivery.status = "success"
      delivery.attempts = 1
      delivery.response = result
    } catch (error) {
      delivery.status = "failed"
      delivery.lastError = error.message
    }

    webhook.deliveries.push(delivery)
    await webhook.save()

    return delivery
  }

  async deliverEvent(projectId, eventType, eventData) {
    const webhooks = await Webhook.find({
      projectId,
      isActive: true,
      events: eventType,
    })

    const results = []

    for (const webhook of webhooks) {
      try {
        const result = await this._deliverWithRetry(webhook, eventType, eventData)
        results.push({ webhookId: webhook._id, success: true, result })
      } catch (error) {
        results.push({ webhookId: webhook._id, success: false, error: error.message })
      }
    }

    return results
  }

  async _deliverWithRetry(webhook, eventType, eventData, attempt = 1) {
    const delivery = {
      eventType,
      deliveredAt: new Date(),
      status: "pending",
      attempts: attempt,
    }

    try {
      const result = await this._deliverWebhook(webhook, eventData)
      delivery.status = "success"
      delivery.response = result
    } catch (error) {
      delivery.lastError = error.message

      if (attempt < webhook.retryPolicy.maxAttempts) {
        const delay = webhook.retryPolicy.initialDelayMs * Math.pow(webhook.retryPolicy.backoffMultiplier, attempt - 1)

        return new Promise((resolve) => {
          setTimeout(() => {
            resolve(this._deliverWithRetry(webhook, eventType, eventData, attempt + 1))
          }, delay)
        })
      } else {
        delivery.status = "failed"
      }
    }

    webhook.deliveries.push(delivery)
    await webhook.save()

    return delivery
  }

  async _deliverWebhook(webhook, payload) {
    const signature = this._generateSignature(JSON.stringify(payload), webhook.secret)

    const headers = {
      "Content-Type": "application/json",
      "X-Webhook-Signature": signature,
      ...webhook.headers,
    }

    // In production, use actual HTTP client like axios/node-fetch
    return {
      statusCode: 200,
      message: "Webhook delivered",
    }
  }

  _generateSignature(payload, secret) {
    return crypto.createHmac("sha256", secret).update(payload).digest("hex")
  }

  async getWebhookDeliveries(webhookId, { limit = 50, offset = 0 }) {
    const webhook = await Webhook.findById(webhookId)
    if (!webhook) throw new Error("Webhook not found")

    const deliveries = webhook.deliveries
      .sort((a, b) => new Date(b.deliveredAt) - new Date(a.deliveredAt))
      .slice(offset, offset + limit)

    return {
      deliveries,
      total: webhook.deliveries.length,
      limit,
      offset,
    }
  }

  async retryDelivery(webhookId, deliveryIndex) {
    const webhook = await Webhook.findById(webhookId)
    if (!webhook) throw new Error("Webhook not found")

    const delivery = webhook.deliveries[deliveryIndex]
    if (!delivery) throw new Error("Delivery not found")

    try {
      const result = await this._deliverWebhook(webhook, {})
      delivery.status = "success"
      delivery.attempts += 1
      delivery.response = result
    } catch (error) {
      delivery.lastError = error.message
      delivery.attempts += 1
    }

    await webhook.save()
    return delivery
  }

  async updateRetryPolicy(webhookId, retryPolicy) {
    return await Webhook.findByIdAndUpdate(
      webhookId,
      { retryPolicy },
      { new: true }
    )
  }

  async verifyWebhookSignature(signature, payload, secret) {
    const expectedSignature = this._generateSignature(payload, secret)
    return crypto.timingSafeEqual(
      Buffer.from(signature),
      Buffer.from(expectedSignature)
    )
  }
}

module.exports = new WebhookService()
