# Complete Provider Integration Guide

This document describes the complete implementation of real provider integrations for **Vercel**, **Netlify**, and **Render** in CloudDeck.

## Overview

The deployer system uses an adapter pattern to abstract provider-specific APIs behind a common interface. All providers implement:

- **createDeployment** – Create a deployment
- **getDeploymentStatus** – Poll deployment status
- **getDeploymentLogs** – Stream/fetch deployment logs
- **listDeployments** – List deployments for a project
- **cancelDeployment** – Cancel in-flight deployment
- **validateWebhook** – Validate incoming webhooks
- **connectAccount** – Authenticate with provider
- **disconnectAccount** – Revoke provider connection

## Architecture

```
┌─────────────────────────────────────────────────┐
│           Frontend (Next.js)                     │
│  - Provider selector UI                         │
│  - OAuth/token flows                            │
│  - Live deployment status & logs                │
└──────────────┬──────────────────────────────────┘
               │
               ▼
┌─────────────────────────────────────────────────┐
│     Backend API (Express.js)                    │
│  /api/providers/* routes                        │
│  providersController.js                         │
└──────────────┬──────────────────────────────────┘
               │
               ▼
┌─────────────────────────────────────────────────┐
│        Deployer Factory                         │
│  - Routes to correct adapter                    │
│  - Handles provider selection                   │
└──────────────┬──────────────────────────────────┘
               │
      ┌────────┼────────┬────────┐
      ▼        ▼        ▼        ▼
   Vercel  Netlify  Render  Custom
  Adapter  Adapter  Adapter  (future)
```

## Setup Instructions

### 1. Vercel Integration

#### Get API Token
1. Go to https://vercel.com/account/tokens
2. Create a new token (full access recommended)
3. Copy the token

#### Configure
Add to `server/.env`:
```
VERCEL_TOKEN=<your-token-here>
VERCEL_TEAM_ID=<optional-team-id>
```

#### Usage
```javascript
// Connect account
await apiClient.connectProvider("vercel", {
  token: process.env.VERCEL_TOKEN
})

// Start deployment
await apiClient.startProviderDeployment(projectId, "vercel", {
  name: "my-app",
  branch: "main",
  framework: "nextjs",
  buildCommand: "npm run build",
  outputDirectory: "out"
})
```

#### Webhook Setup (Optional)
1. In Vercel project settings → Deployments
2. Add webhook: `https://yourdomain.com/api/providers/webhooks/vercel`
3. Subscribe to: Deployment lifecycle events
4. Set `VERCEL_WEBHOOK_SECRET` in `.env`

### 2. Netlify Integration

#### Get API Token
1. Go to https://app.netlify.com/user/applications
2. Create a new personal access token
3. Copy the token

#### Configure
Add to `server/.env`:
```
NETLIFY_TOKEN=<your-token-here>
NETLIFY_WEBHOOK_SECRET=<optional-for-webhooks>
```

#### Usage
```javascript
// Connect account
await apiClient.connectProvider("netlify", {
  token: process.env.NETLIFY_TOKEN
})

// Start deployment (creates site if needed)
await apiClient.startProviderDeployment(projectId, "netlify", {
  name: "my-site",
  branch: "main",
  buildCommand: "npm run build",
  outputDirectory: "dist",
  siteId: "optional-existing-site-id"
})
```

#### Webhook Setup (Optional)
1. In Netlify site settings → Integrations → Build hooks
2. Create webhook: Send to `https://yourdomain.com/api/providers/webhooks/netlify`
3. Set `NETLIFY_WEBHOOK_SECRET` in `.env`

### 3. Render Integration

#### Get API Key
1. Go to https://dashboard.render.com/account/api-tokens
2. Create new API token
3. Copy the token

#### Configure
Add to `server/.env`:
```
RENDER_API_KEY=<your-api-key>
RENDER_WEBHOOK_SECRET=<optional-for-webhooks>
```

#### Usage
```javascript
// Connect account
await apiClient.connectProvider("render", {
  apiKey: process.env.RENDER_API_KEY
})

// Start deployment (creates service if needed)
await apiClient.startProviderDeployment(projectId, "render", {
  name: "my-service",
  branch: "main",
  buildCommand: "npm run build",
  startCommand: "npm start",
  ownerId: "required-for-new-services",
  serviceId: "optional-existing-service-id"
})
```

#### Webhook Setup (Optional)
1. In Render service settings → Environment
2. Add webhook endpoint: `https://yourdomain.com/api/providers/webhooks/render`
3. Set `RENDER_WEBHOOK_SECRET` in `.env`

## API Endpoints

### Connect Provider
```
POST /api/providers/connect
Content-Type: application/json

{
  "provider": "vercel",
  "credentials": {
    "token": "xxx"
  }
}

Response:
{
  "success": true,
  "userInfo": {
    "id": "user-123",
    "email": "user@example.com",
    "username": "username"
  }
}
```

### Start Deployment
```
POST /api/providers/deploy
Content-Type: application/json
Authorization: Bearer <jwt-token>

{
  "projectId": "proj-123",
  "provider": "vercel",
  "config": {
    "name": "my-app",
    "branch": "main",
    "buildCommand": "npm run build",
    "outputDirectory": "out",
    "framework": "nextjs"
  }
}

Response (202 Accepted):
{
  "deployment": "deploy-123",
  "providerDeploymentId": "vercel-id-456",
  "status": "building",
  "url": "https://my-app.vercel.app"
}
```

### Get Deployment Status
```
GET /api/providers/deployments/{deploymentId}/status
Authorization: Bearer <jwt-token>

Response:
{
  "status": "running",
  "progress": 100,
  "url": "https://my-app.vercel.app",
  "metadata": {
    "createdAt": "2024-01-01T00:00:00Z",
    "errorMessage": null,
    "buildTime": 120000
  }
}
```

### Get Deployment Logs
```
GET /api/providers/deployments/{deploymentId}/logs?limit=50&offset=0
Authorization: Bearer <jwt-token>

Response:
{
  "logs": [
    {
      "timestamp": "2024-01-01T00:00:00Z",
      "message": "Build started",
      "level": "info"
    }
  ],
  "hasMore": false
}
```

### Cancel Deployment
```
POST /api/providers/deployments/{deploymentId}/cancel
Authorization: Bearer <jwt-token>

Response:
{
  "success": true,
  "message": "Deployment canceled"
}
```

### Disconnect Provider
```
DELETE /api/providers/{provider}/disconnect
Authorization: Bearer <jwt-token>

Response:
{
  "success": true,
  "message": "Disconnected from vercel"
}
```

## Webhook Handling

Each provider sends webhooks when deployment status changes. CloudDeck validates the webhook signature and updates deployment status in the database.

### Webhook Flow
1. Provider sends webhook with signature header
2. `providersController.handleWebhook` receives request
3. Factory validates signature using provider's secret
4. If valid, deployment status is updated
5. AuditLog records the webhook event

### Example: Vercel Webhook Payload
```json
{
  "deploymentId": "dpl_1234",
  "state": "READY",
  "deployTime": 120,
  "buildTime": 60,
  "url": "https://my-app.vercel.app"
}
```

## Database Schema

Deployments now include provider-specific fields:

```javascript
provider: "vercel" | "netlify" | "render" | "custom",
providerDeploymentId: "provider-specific-id",
providerMetadata: {
  projectId: "proj-123",
  siteId: "site-456",
  serviceId: "svc-789",
  domainName: "my-app.vercel.app",
  region: "us-east-1",
  additionalData: {}
},
providerConfig: {
  buildCommand: "npm run build",
  outputDirectory: "out",
  framework: "nextjs",
  startCommand: "npm start",
  env: { KEY: "value" }
}
```

## Status Mapping

Providers use different status names. CloudDeck normalizes to:

```
Provider Status → Platform Status
QUEUED/pending → pending
BUILDING/build_in_progress → building
DEPLOYING/deploy_in_progress → deploying
READY/live/running → running
ERROR/error → failed
CANCELED → rolled-back
```

## Error Handling

All adapters include:

1. **Retry Logic** – Exponential backoff for transient failures
2. **Rate Limiting** – Respects provider API rate limits
3. **Validation** – Checks credentials before deployment
4. **Fallback** – Graceful degradation if provider unavailable

### Example Error Handling
```javascript
try {
  const result = await deploymentService.startDeploymentWithProvider(
    deploymentId,
    project,
    config
  )
} catch (error) {
  // Error logged, deployment marked as failed
  // User notified via UI
}
```

## Security Considerations

1. **Token Storage**
   - Tokens stored in `server/.env` (local development)
   - In production: use AWS Secrets Manager, HashiCorp Vault, or similar
   - Never commit tokens to version control

2. **Webhook Validation**
   - All webhooks validated using HMAC signatures
   - Invalid signatures rejected (401 Unauthorized)
   - Webhook secrets stored in environment variables

3. **Permission Scoping**
   - Vercel token: recommend "full access" or "deployments" scope
   - Netlify token: "builds_read_write" and "sites_read_write"
   - Render token: sufficient for service/deployment management

4. **Audit Logging**
   - All provider operations logged to AuditLog
   - Includes provider, user, action, and metadata
   - 90-day retention recommended

## Testing

### Unit Tests
```bash
npm test -- server/services/deployers/
```

### Integration Tests
Mock provider APIs and test end-to-end flows:
```bash
npm test -- server/services/deployers/deployerFactory.test.js
```

### Manual Testing Checklist
- [ ] Connect Vercel account successfully
- [ ] Start Vercel deployment and see live status
- [ ] Get deployment logs from Vercel
- [ ] Receive and process Vercel webhook
- [ ] Cancel in-flight Vercel deployment
- [ ] Repeat for Netlify and Render
- [ ] Handle missing credentials gracefully
- [ ] Handle rate limiting (simulate)
- [ ] Handle webhook signature mismatch (reject)

## Troubleshooting

### "VERCEL_TOKEN not configured"
- Add token to `server/.env`
- Restart backend server
- Verify token has sufficient permissions

### Deployment stuck in "building"
- Check provider directly (Vercel.com, Netlify.com, etc.)
- Verify repository access
- Check build logs on provider

### Webhook not updating status
- Verify webhook URL is accessible from internet
- Check webhook signature in .env matches provider setting
- Review AuditLog for webhook events
- Check provider's webhook delivery logs

### "Deploy canceled" but deployment still running
- Render doesn't support cancellation API
- Vercel/Netlify: stop build in their UI manually
- Platform will sync status on next poll

## Future Enhancements

- [ ] AWS CodeDeploy integration
- [ ] Google Cloud Run integration
- [ ] Azure App Service integration
- [ ] Kubernetes cluster deployment
- [ ] Docker registry push (build artifacts)
- [ ] Environment-specific webhooks
- [ ] Blue-green deployment support
- [ ] Canary deployment automation
- [ ] Provider cost tracking
- [ ] Multi-provider failover

## Reference

- [Vercel API Docs](https://vercel.com/docs/rest-api)
- [Netlify API Docs](https://docs.netlify.com/api/get-started/)
- [Render API Docs](https://render.com/docs/api-reference)
