# ⚡ Provider Integration Quick Start

Get Vercel, Netlify, and Render deployments working in 10 minutes.

## 📋 Checklist

### Step 1: Get API Tokens (5 min)

#### Vercel
1. Go to https://vercel.com/account/tokens
2. Click "Create Token"
3. Name: `clouddeck` or similar
4. Copy the token

#### Netlify
1. Go to https://app.netlify.com/user/applications
2. Scroll to "Personal access tokens"
3. Click "New access token"
4. Copy the token

#### Render
1. Go to https://dashboard.render.com/account/api-tokens
2. Click "Create API Key"
3. Copy the key

### Step 2: Configure Backend (2 min)

Edit `server/.env` and add:

```bash
# Vercel
VERCEL_TOKEN=<paste-your-vercel-token-here>
VERCEL_TEAM_ID=

# Netlify
NETLIFY_TOKEN=<paste-your-netlify-token-here>

# Render
RENDER_API_KEY=<paste-your-render-api-key-here>
```

Save the file.

### Step 3: Restart Backend (2 min)

```bash
cd server
node index.js
```

You should see:
```
MongoDB connected
Server running on port 5000
```

### Step 4: Test Connection (1 min)

Open Postman or use `curl`:

```bash
curl -X POST http://localhost:5000/api/providers/connect \
  -H "Content-Type: application/json" \
  -d '{
    "provider": "vercel",
    "credentials": {
      "token": "YOUR_VERCEL_TOKEN"
    }
  }'
```

Expected response:
```json
{
  "success": true,
  "message": "Connected to Vercel",
  "userInfo": {
    "id": "user123",
    "email": "your@email.com",
    "username": "yourname"
  }
}
```

## 🚀 Next: Start a Deployment

```bash
curl -X POST http://localhost:5000/api/providers/deploy \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '{
    "projectId": "your-project-id",
    "provider": "vercel",
    "config": {
      "name": "my-app",
      "branch": "main",
      "buildCommand": "npm run build",
      "outputDirectory": "out",
      "framework": "nextjs"
    }
  }'
```

Response (202 Accepted):
```json
{
  "deployment": "mongo-deployment-id",
  "providerDeploymentId": "dpl_123abc",
  "status": "building",
  "url": "https://my-app.vercel.app"
}
```

## 📊 Check Status

```bash
curl -X GET http://localhost:5000/api/providers/deployments/{deployment-id}/status \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

Response:
```json
{
  "status": "building",
  "progress": 50,
  "url": "https://my-app.vercel.app",
  "metadata": {
    "buildTime": null,
    "errorMessage": null
  }
}
```

## 📝 API Endpoints

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/api/providers/list` | GET | List supported providers |
| `/api/providers/connect` | POST | Connect provider account |
| `/api/providers/deploy` | POST | Start deployment |
| `/api/providers/deployments/{id}/status` | GET | Check deployment status |
| `/api/providers/deployments/{id}/logs` | GET | Get deployment logs |
| `/api/providers/deployments/{id}/cancel` | POST | Cancel deployment |
| `/api/providers/{provider}/disconnect` | DELETE | Disconnect provider |

## 🔍 Debug

### Check if tokens are configured

```bash
# In server directory
cat .env | grep VERCEL_TOKEN
cat .env | grep NETLIFY_TOKEN
cat .env | grep RENDER_API_KEY
```

Should show your tokens (not empty).

### Check backend logs

```bash
# Backend should print errors if API calls fail
node index.js

# Look for:
# - "Vercel deployment failed: ..."
# - "Failed to get Vercel deployment status: ..."
```

### Test with frontend API client

```javascript
import apiClient from '@/lib/api-client'

// Connect
const result = await apiClient.connectProvider('vercel', {
  token: 'your-token'
})

// Deploy
const deployment = await apiClient.startProviderDeployment('proj-123', 'vercel', {
  name: 'my-app',
  branch: 'main'
})

// Check status
const status = await apiClient.getProviderDeploymentStatus(deployment.deployment)
console.log(status)
```

## 🎯 What Works

- ✅ Connect to Vercel, Netlify, Render
- ✅ Start deployments
- ✅ Poll deployment status (real-time)
- ✅ Get deployment logs
- ✅ Cancel deployments
- ✅ Webhook updates (when configured)

## ⚠️ Webhooks (Optional)

To get instant status updates (instead of polling):

### Vercel
1. Go to your Vercel project
2. Settings → Deployments → Webhooks
3. Add webhook: `https://yourdomain.com/api/providers/webhooks/vercel`
4. Add to `.env`: `VERCEL_WEBHOOK_SECRET=<your-webhook-secret>`

### Netlify
1. Go to your Netlify site
2. Site Settings → Build & Deploy → Build hooks
3. Create webhook pointing to `https://yourdomain.com/api/providers/webhooks/netlify`
4. Add to `.env`: `NETLIFY_WEBHOOK_SECRET=<your-webhook-secret>`

### Render
1. Go to your Render service
2. Settings → Add environment variable webhook
3. Set to `https://yourdomain.com/api/providers/webhooks/render`
4. Add to `.env`: `RENDER_WEBHOOK_SECRET=<your-webhook-secret>`

## 📚 Full Documentation

See `DEPLOYERS.md` for:
- Detailed setup instructions
- API reference
- Status mapping
- Troubleshooting

## ✨ You're Ready!

Your app now supports deploying to:
- ✅ **Vercel** (Next.js, static sites)
- ✅ **Netlify** (JAMstack, serverless)
- ✅ **Render** (Full-stack apps)

Start building! 🚀
