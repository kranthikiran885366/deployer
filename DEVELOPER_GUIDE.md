# 🚀 Enterprise Cloud Deployment Platform - Developer Guide

**Status**: Production-Ready Foundation | **Phase**: 2/3  
**GitHub**: https://github.com/kranthikiran885366/deployer

---

## 📖 Quick Start for Developers

### Prerequisites
```bash
Node.js 18+
PostgreSQL 14+
Redis 6+
Docker & Docker Compose
Kubernetes (kubectl)
```

### Setup Development Environment

1. **Clone the repository**
   ```bash
   git clone https://github.com/kranthikiran885366/deployer.git
   cd deployer
   npm install
   ```

2. **Start services (all-in-one)**
   ```bash
   docker-compose up -d
   # Starts: PostgreSQL, Redis, Prometheus, Grafana, Backend, Frontend
   ```

3. **Run database migrations**
   ```bash
   npm run db:migrate
   ```

4. **Start development servers**
   ```bash
   # Terminal 1 - Backend
   npm run dev:server

   # Terminal 2 - Frontend
   npm run dev:client
   ```

5. **Access the platform**
   - Dashboard: http://localhost:3000
   - API: http://localhost:5000
   - Grafana: http://localhost:3001 (admin/admin)
   - Prometheus: http://localhost:9090

---

## 🏗️ Core Files & Modules

### AI Optimization Engine
**File**: `server/services/ai/optimizationEngine.js`

```javascript
// Predictive scaling forecast
const forecast = await AIOptimization.predictiveScaling(teamId, projectId);

// Build optimization analysis
const analysis = await AIOptimization.analyzeBuildOptimization(projectId);

// Cost forecasting
const forecast = await AIOptimization.forecastCosts(teamId);

// Anomaly detection
const anomalies = await AIOptimization.detectAnomalies(teamId);
```

### Edge Functions Service
**File**: `server/services/edge/functionsService.js`

```javascript
// Deploy edge function
const result = await EdgeFunctions.deployEdgeFunction(projectId, {
  name: 'my-function',
  runtime: 'node18',
  code: 'export default handler...',
  memory: 256,
  timeout: 30,
  concurrency: 100
});

// Invoke function
const response = await EdgeFunctions.invokeFunction(projectId, 'my-function', payload);

// Get metrics
const metrics = await EdgeFunctions.getFunctionMetrics(projectId, 'my-function');
```

### Marketplace & Plugins
**File**: `server/services/marketplace/marketplaceService.js`

```javascript
// List plugins
const plugins = await Marketplace.listPlugins({ category: 'monitoring', minRating: 4 });

// Install plugin
const installation = await Marketplace.installPlugin(userId, pluginId, config);

// Execute build hook
const results = await Marketplace.executeHook('pre-deploy', deploymentContext);

// Get plugin analytics
const analytics = await Marketplace.getPluginAnalytics(pluginId);
```

### Compliance & Audit
**File**: `server/services/compliance/auditService.js`

```javascript
// Log audit event
await ComplianceAudit.logAuditEvent(userId, 'deploy_created', 'deployment', deploymentId);

// GDPR deletion
const request = await ComplianceAudit.initiateGDPRDeletion(userId);

// Generate SOC2 report
const report = await ComplianceAudit.generateSOC2Report(month, year);

// Check HIPAA compliance
const compliance = await ComplianceAudit.checkHIPAACompliance();
```

---

## 📊 Database Schema

### Run Migrations
```bash
node server/db/migrations/001_schema.js
```

### Key Tables

**Users Table**
```sql
SELECT * FROM users WHERE id = 'uuid';
-- Fields: email, password_hash, provider (local/google/github), mfa_enabled, created_at
```

**Projects Table**
```sql
SELECT * FROM projects WHERE team_id = 'uuid';
-- Fields: name, git_url, framework, auto_deploy, region, multi_region
```

**Deployments Table**
```sql
SELECT * FROM deployments WHERE project_id = 'uuid' ORDER BY created_at DESC;
-- Fields: status, git_commit, deployment_strategy, triggered_by, error_message
```

**Subscriptions Table**
```sql
SELECT s.*, sp.name FROM subscriptions s
JOIN subscription_plans sp ON s.plan_id = sp.id
WHERE s.team_id = 'uuid';
-- Fields: status, stripe_subscription_id, current_period_start, current_period_end
```

---

## 🔌 API Integration Examples

### Deploy a Project
```javascript
// POST /api/projects/:id/deploy
const response = await fetch('http://localhost:5000/api/projects/project-id/deploy', {
  method: 'POST',
  headers: {
    'Authorization': 'Bearer YOUR_JWT_TOKEN',
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    branch: 'main',
    environment: 'production',
    buildCommand: 'npm run build'
  })
});

const deployment = await response.json();
console.log('Deployment ID:', deployment.id);
```

### Get Real-time Logs (WebSocket)
```javascript
const ws = new WebSocket('ws://localhost:5000/api/deployments/deploy-id/logs', [
  'Bearer YOUR_JWT_TOKEN'
]);

ws.onmessage = (event) => {
  const log = JSON.parse(event.data);
  console.log(`[${log.level}] ${log.message}`);
};
```

### Predict Scaling Needs
```javascript
// GET /api/ai/scaling-forecast/:projectId
const forecast = await fetch('http://localhost:5000/api/ai/scaling-forecast/project-id', {
  headers: {
    'Authorization': 'Bearer YOUR_JWT_TOKEN'
  }
});

const data = await forecast.json();
console.log('Predicted CPU:', data.summary.peakCpuPredicted + '%');
console.log('Recommended replicas:', data.summary.recommendedAutoscaleMax);
```

### Install a Plugin
```javascript
// POST /api/marketplace/plugins/:id/install
const install = await fetch('http://localhost:5000/api/marketplace/plugins/plugin-id/install', {
  method: 'POST',
  headers: {
    'Authorization': 'Bearer YOUR_JWT_TOKEN',
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    config: {
      webhook_url: 'https://example.com/webhook',
      alert_threshold: 5
    }
  })
});

const result = await install.json();
console.log('Installation ID:', result.installationId);
```

---

## 🧪 Testing

### Run Unit Tests
```bash
npm run test:unit
# Tests: services, utilities, validators
```

### Run Integration Tests
```bash
npm run test:integration
# Tests: API endpoints, database operations
```

### Load Testing
```bash
npm run test:load
# Uses k6 to simulate 1000+ concurrent users
```

### Security Testing
```bash
npm run test:security
# Runs OWASP Top 10 checks, dependency scanning
```

---

## 🚀 Deployment

### Local Development
```bash
docker-compose up -d
npm run dev
```

### Staging (Kubernetes)
```bash
kubectl apply -f k8s/backend-deployment.yaml
kubectl apply -f k8s/frontend-deployment.yaml
kubectl port-forward svc/backend 5000:5000
```

### Production (AWS/GCP/Azure)

**Using Terraform:**
```bash
cd infrastructure/terraform/aws
terraform init
terraform plan
terraform apply -var-file=production.tfvars
```

**Using Helm:**
```bash
helm install deployer ./helm/deployer \
  --namespace production \
  --values values-prod.yaml \
  --set image.tag=v1.0.0
```

---

## 📈 Monitoring & Debugging

### View Logs
```bash
# Docker Compose
docker-compose logs -f backend

# Kubernetes
kubectl logs -f deployment/backend

# ELK Stack
# Open Kibana: http://localhost:5601
```

### View Metrics
```bash
# Prometheus: http://localhost:9090
# Query: deployment_duration_seconds_bucket
# Query: build_cache_hit_rate

# Grafana: http://localhost:3001
# Pre-built dashboards for Deployments, Builds, Billing
```

### Debug Mode
```bash
DEBUG=* npm run dev:server
# Enables verbose logging for all modules
```

---

## 🔐 Security Checklist

- [ ] Generate new JWT secret: `node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"`
- [ ] Set Stripe API keys in `.env`
- [ ] Configure OAuth clients (Google, GitHub)
- [ ] Enable MFA for admin users
- [ ] Set up WAF rules in Cloudflare
- [ ] Configure Let's Encrypt certificate automation
- [ ] Enable database encryption at rest
- [ ] Set up audit logging
- [ ] Configure secrets in Vault
- [ ] Enable network policies in Kubernetes

---

## 🎯 Continue Building

### Phase 3 Roadmap

#### Week 1-2: Advanced Auth
- [ ] Implement SAML 2.0 integration
- [ ] Add LDAP support for enterprise
- [ ] Build custom OAuth provider
- [ ] Implement WebAuthn (passwordless)

#### Week 3-4: Enhanced Dashboard
- [ ] Build admin analytics dashboard
- [ ] Create cost analytics visualizations
- [ ] Add compliance report generator
- [ ] Implement incident timeline view

#### Week 5-6: Advanced CI/CD
- [ ] Build Tekton pipeline templates
- [ ] Implement ArgoCD integration
- [ ] Add GitHub Actions native support
- [ ] Create deployment templates library

#### Week 7-8: Performance & Scale
- [ ] Implement database query optimization
- [ ] Add caching layer (Redis cluster)
- [ ] Optimize Docker image builds
- [ ] Load test to 10,000+ concurrent users

### Feature Priority List

**High Priority**
1. SAML/LDAP enterprise auth
2. Advanced analytics dashboard
3. Tekton CI/CD pipeline templates
4. Database performance optimization
5. Multi-region failover testing

**Medium Priority**
1. GraphQL API implementation
2. Python SDK development
3. Go SDK development
4. Advanced build optimization (ML)
5. Cost allocation by team/project

**Low Priority**
1. Mobile app
2. CLI shell completion
3. VSCode extension
4. Custom billing reports
5. AI ChatOps assistant

---

## 📚 Documentation Structure

```
docs/
├── ARCHITECTURE_ENTERPRISE.md    # System design & diagrams
├── ENTERPRISE.md                 # Deployment & setup guides
├── BUILD_SUMMARY.md              # Feature inventory
├── COMPLETE_AUTH_SUMMARY.md      # Authentication details
├── API.md                        # REST/GraphQL API reference
├── CLI.md                        # CLI tool documentation
├── DEVELOPER.md                  # This file
├── SECURITY.md                   # Security best practices
├── COMPLIANCE.md                 # Compliance guides
└── TROUBLESHOOTING.md            # Common issues & solutions
```

---

## 🤝 Contributing

### Code Style
```bash
npm run lint
npm run format
npm run type-check
```

### Commit Convention
```
feat: Add new feature
fix: Fix bug
docs: Update documentation
perf: Performance improvement
refactor: Code refactoring
test: Add tests
chore: Maintenance
```

### Pull Request Process
1. Fork repository
2. Create feature branch: `git checkout -b feature/amazing-feature`
3. Commit changes: `git commit -m "feat: Add amazing feature"`
4. Push branch: `git push origin feature/amazing-feature`
5. Open Pull Request with description

---

## 🐛 Troubleshooting

### Port Already in Use
```bash
# Find process on port 5000
lsof -i :5000

# Kill process
kill -9 PID

# Or use different port
PORT=5001 npm run dev:server
```

### Database Connection Error
```bash
# Check PostgreSQL is running
docker ps | grep postgres

# Reset database
npm run db:reset

# View logs
docker-compose logs postgres
```

### Out of Memory
```bash
# Increase Docker memory
docker update --memory 4g container_name

# Or in Node.js
NODE_OPTIONS="--max-old-space-size=4096" npm run dev
```

---

## 💬 Support & Community

- **GitHub Issues**: https://github.com/kranthikiran885366/deployer/issues
- **Discussions**: https://github.com/kranthikiran885366/deployer/discussions
- **Email**: support@deployer.dev (when live)
- **Slack**: Join our community workspace

---

## 📞 Contact

- **Project Lead**: Kranthi Kiran (@kranthikiran885366)
- **Email**: mallelakranthikiran@gmail.com
- **GitHub**: https://github.com/kranthikiran885366/deployer

---

**Last Updated**: November 2025  
**Version**: 1.0.0  
**License**: MIT
