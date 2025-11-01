# 🚀 Quick Start: Provider Integration

Your CloudDeck deployment framework now has **real Vercel, Netlify, and Render integrations** ready to use!

## What You Have

✅ **3 Production-Ready Adapters**
- Vercel API v13 integration (builds, deployments, logs, webhooks)
- Netlify API v1 integration (sites, builds, logs, webhooks)
- Render API integration (services, deployments, logs, webhooks)

✅ **Complete Backend Stack**
- Provider factory pattern for clean adapter management
- Secure token handling with environment variables
- Webhook validation with HMAC signatures
- Deployment database schema extended with provider fields
- Full AuditLog tracking for compliance

✅ **Frontend Ready**
- API client methods for all provider operations
- Providers page for token management
- Ready for deployment UI components

✅ **Documentation**
- `DEPLOYERS.md` - Complete technical guide
- `PROVIDER_INTEGRATION_COMPLETE.md` - Implementation summary

## Setup in 5 Minutes

### 1. Get Your API Credentials

**Vercel:**
- Visit: https://vercel.com/account/tokens
- Click "Create Token"
- Copy the token

**Netlify:**
- Visit: https://app.netlify.com/user/applications
- Click "Create new token"
- Copy the token

**Render:**
- Visit: https://dashboard.render.com/account/api-tokens
- Click "Create API Key"
- Copy the key

### 2. Add Tokens to Backend

Edit `server/.env` and add (restart backend after):

```properties
# Vercel
VERCEL_TOKEN=your_vercel_token_here

# Netlify
NETLIFY_TOKEN=your_netlify_token_here

# Render
RENDER_API_KEY=your_render_api_key_here
```

**Important:** Never commit `.env` to git. In production, use AWS Secrets Manager or HashiCorp Vault.

### 3. Restart Servers

```bash
# Terminal 1: Backend
cd server
npm install  # if needed
node index.js

# Terminal 2: Frontend
pnpm dev
```

### 4. Test Providers Page

1. Open http://localhost:3000 in browser
2. Navigate to **Providers** (in left sidebar or add route `/providers`)
3. For each provider:
   - Click "Connect [Provider]"
   - Paste your token
   - Click "Connect"
   - Should see success message

### 5. Test Deployment

1. Go to **Deployments**
2. Click "New Deployment"
3. Select provider: Vercel, Netlify, or Render
4. Fill in config (project name, branch, build command)
5. Click "Deploy"
6. Watch real-time status updates

## File Structure

```
server/
├── services/deployers/
│   ├── deployerAdapter.js          # Base contract
│   ├── vercelAdapter.js            # Vercel implementation
│   ├── netlifyAdapter.js           # Netlify implementation
│   ├── renderAdapter.js            # Render implementation
│   └── deployerFactory.js          # Provider factory
├── controllers/
│   └── providersController.js      # API controller
├── routes/
│   └── providers.js                # Routes: POST /connect, /deploy, etc.
└── models/
    └── Deployment.js               # Updated schema

app/
└── (app)/providers/
    └── page.jsx                    # Provider management UI

lib/
└── api-client.js                  # Updated with provider methods
```

## API Examples

### Connect Provider
```bash
curl -X POST http://localhost:5000/api/providers/connect \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "provider": "vercel",
    "credentials": { "token": "xxx" }
  }'
```

### Start Deployment
```bash
curl -X POST http://localhost:5000/api/providers/deploy \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "projectId": "proj-123",
    "provider": "vercel",
    "config": {
      "name": "my-app",
      "branch": "main",
      "buildCommand": "npm run build",
      "outputDirectory": "out"
    }
  }'
```

### Get Status
```bash
curl http://localhost:5000/api/providers/deployments/deploy-123/status \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

### Get Logs
```bash
curl http://localhost:5000/api/providers/deployments/deploy-123/logs \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

## Webhook Setup (Optional but Recommended)

For real-time deployment updates instead of polling:

### Vercel Webhooks
1. Go to your Vercel project → Settings → Integrations
2. Add webhook: `https://yourdomain.com/api/providers/webhooks/vercel`
3. Set secret: Add to `server/.env` as `VERCEL_WEBHOOK_SECRET`

### Netlify Webhooks
1. Go to your Netlify site → Site settings → Build & deploy → Notifications
2. Add webhook: `https://yourdomain.com/api/providers/webhooks/netlify`
3. Set secret: Add to `server/.env` as `NETLIFY_WEBHOOK_SECRET`

### Render Webhooks
1. Go to Render service → Environment → Webhooks
2. Add endpoint: `https://yourdomain.com/api/providers/webhooks/render`
3. Set secret: Add to `server/.env` as `RENDER_WEBHOOK_SECRET`

## Troubleshooting

### "VERCEL_TOKEN not configured"
- Add `VERCEL_TOKEN` to `server/.env`
- Restart backend server
- Verify token is valid at vercel.com

### Deployment stuck on "building"
- Check provider directly (Vercel.com, Netlify.com, Render.com)
- Verify repository access
- Check build logs on provider

### Webhook not working
- Verify URL is accessible from internet (not localhost)
- Check webhook signature in provider settings
- Review browser console and server logs

### "Invalid token"
- Get new token from provider
- Verify token scope has permission to create deployments
- Ensure token isn't expired

## Production Checklist

- [ ] Replace `.env` with secrets manager (AWS/Vault)
- [ ] Set webhook URLs and secrets in provider dashboards
- [ ] Test end-to-end with real repository
- [ ] Set up monitoring/alerts for failed deployments
- [ ] Configure rate limiting for provider APIs
- [ ] Review AuditLog for compliance
- [ ] Set up backup provider (failover strategy)
- [ ] Configure auto-refresh token if provider supports it
- [ ] Document procedures for rotating credentials
- [ ] Set up deployment notifications (Slack/email)

## Next Steps

1. **Connect your first provider** and deploy an app
2. **Set up webhooks** for real-time status
3. **Create deployment templates** for common configs
4. **Add other providers** (AWS, GCP, Azure)
5. **Build deployment analytics** dashboard
6. **Implement rollback automation**

## Support

For detailed technical info, see:
- `DEPLOYERS.md` - Complete integration guide
- `PROVIDER_INTEGRATION_COMPLETE.md` - Implementation details

---

**Ready to deploy! 🚀** Paste your provider tokens in `.env` and start deploying to Vercel, Netlify, or Render directly from CloudDeck.
