# 🏗️ CloudDeck Microservices Architecture

## 📁 Project Structure

```
clouddeck-platform/
├── 🌐 frontend/                    # Next.js Dashboard
├── 🚪 api-gateway/                 # Kong/Traefik Configuration
├── 🔐 auth-service/                # Authentication & Authorization
├── 🏗️ build-service/               # Build Pipeline Engine
├── 🚀 deploy-service/              # Deployment Orchestration
├── 📊 analytics-service/           # Metrics & Analytics
├── 💳 billing-service/             # Subscription & Usage Tracking
├── 📧 notification-service/        # Email/Slack/Webhook Notifications
├── 🌍 edge-service/                # Edge Functions & CDN
├── 🔍 monitoring-service/          # Health Checks & Observability
├── 📦 registry-service/            # Container Registry Management
├── 🗄️ database/                    # Database Schemas & Migrations
├── ☁️ infrastructure/              # Terraform & Kubernetes Configs
├── 🛠️ cli/                        # CloudDeck CLI Tool
├── 📚 docs/                       # API Documentation
└── 🧪 e2e-tests/                  # End-to-End Testing
```

## 🔧 Service Details

### 1. 🔐 Auth Service
```
auth-service/
├── src/
│   ├── controllers/
│   │   ├── auth.controller.js
│   │   ├── oauth.controller.js
│   │   └── user.controller.js
│   ├── middleware/
│   │   ├── jwt.middleware.js
│   │   ├── rbac.middleware.js
│   │   └── rate-limit.middleware.js
│   ├── services/
│   │   ├── auth.service.js
│   │   ├── oauth.service.js
│   │   └── user.service.js
│   ├── models/
│   │   ├── user.model.js
│   │   ├── session.model.js
│   │   └── organization.model.js
│   └── utils/
│       ├── jwt.util.js
│       ├── crypto.util.js
│       └── validation.util.js
├── Dockerfile
├── docker-compose.yml
├── package.json
└── README.md
```

**Key Features:**
- OAuth2 integration (GitHub, Google, GitLab)
- JWT token management
- Role-based access control (RBAC)
- Multi-factor authentication (MFA)
- Session management
- Password policies

### 2. 🏗️ Build Service
```
build-service/
├── cmd/
│   └── main.go
├── internal/
│   ├── api/
│   │   ├── handlers/
│   │   ├── middleware/
│   │   └── routes/
│   ├── build/
│   │   ├── docker/
│   │   ├── frameworks/
│   │   ├── cache/
│   │   └── queue/
│   ├── storage/
│   │   ├── s3/
│   │   └── local/
│   └── config/
├── pkg/
│   ├── logger/
│   ├── metrics/
│   └── utils/
├── deployments/
│   ├── docker/
│   └── k8s/
├── Dockerfile
├── go.mod
└── README.md
```

**Key Features:**
- Multi-language build support
- Docker-based isolation
- Build caching (Docker layers + dependencies)
- Parallel build execution
- Build artifact management
- Framework auto-detection

### 3. 🚀 Deploy Service
```
deploy-service/
├── cmd/
│   └── main.go
├── internal/
│   ├── controllers/
│   ├── k8s/
│   │   ├── operator/
│   │   ├── resources/
│   │   └── watchers/
│   ├── deployment/
│   │   ├── strategies/
│   │   ├── health/
│   │   └── rollback/
│   └── networking/
│       ├── ingress/
│       ├── ssl/
│       └── dns/
├── pkg/
│   ├── k8s-client/
│   ├── helm/
│   └── terraform/
├── charts/
│   └── app-template/
├── Dockerfile
└── README.md
```

**Key Features:**
- Kubernetes operator for deployments
- Blue-green deployments
- Canary releases
- Automatic rollbacks
- Health checks
- SSL certificate management

### 4. 📊 Analytics Service
```
analytics-service/
├── src/
│   ├── collectors/
│   │   ├── metrics.collector.js
│   │   ├── logs.collector.js
│   │   └── events.collector.js
│   ├── processors/
│   │   ├── aggregation.processor.js
│   │   ├── billing.processor.js
│   │   └── alerts.processor.js
│   ├── storage/
│   │   ├── clickhouse.client.js
│   │   ├── timeseries.service.js
│   │   └── cache.service.js
│   └── api/
│       ├── metrics.controller.js
│       ├── dashboard.controller.js
│       └── reports.controller.js
├── config/
│   ├── clickhouse/
│   └── kafka/
├── Dockerfile
└── README.md
```

**Key Features:**
- Real-time metrics collection
- Usage analytics
- Performance monitoring
- Custom dashboards
- Alerting system
- Data retention policies

### 5. 💳 Billing Service
```
billing-service/
├── src/
│   ├── controllers/
│   │   ├── subscription.controller.js
│   │   ├── usage.controller.js
│   │   └── invoice.controller.js
│   ├── services/
│   │   ├── stripe.service.js
│   │   ├── usage-calculator.service.js
│   │   └── invoice.service.js
│   ├── models/
│   │   ├── subscription.model.js
│   │   ├── usage-record.model.js
│   │   └── invoice.model.js
│   └── jobs/
│       ├── usage-aggregation.job.js
│       ├── invoice-generation.job.js
│       └── payment-processing.job.js
├── Dockerfile
└── README.md
```

**Key Features:**
- Stripe integration
- Usage-based billing
- Subscription management
- Invoice generation
- Payment processing
- Dunning management

## 🌐 API Gateway Configuration

### Kong Configuration
```yaml
# kong.yml
_format_version: "3.0"

services:
  - name: auth-service
    url: http://auth-service:3000
    routes:
      - name: auth-routes
        paths: ["/api/auth"]
        
  - name: build-service
    url: http://build-service:8080
    routes:
      - name: build-routes
        paths: ["/api/builds"]
        
  - name: deploy-service
    url: http://deploy-service:8080
    routes:
      - name: deploy-routes
        paths: ["/api/deployments"]

plugins:
  - name: rate-limiting
    config:
      minute: 100
      hour: 1000
      
  - name: cors
    config:
      origins: ["*"]
      methods: ["GET", "POST", "PUT", "DELETE"]
      
  - name: jwt
    config:
      secret_is_base64: false
```

## 🗄️ Database Schema (PostgreSQL)

```sql
-- Core Tables
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email VARCHAR(255) UNIQUE NOT NULL,
    name VARCHAR(255) NOT NULL,
    avatar_url TEXT,
    github_id INTEGER,
    google_id VARCHAR(255),
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE organizations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    slug VARCHAR(100) UNIQUE NOT NULL,
    plan_id UUID REFERENCES plans(id),
    owner_id UUID REFERENCES users(id),
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE projects (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    organization_id UUID REFERENCES organizations(id),
    repository_url TEXT NOT NULL,
    framework VARCHAR(50),
    build_command TEXT,
    output_directory VARCHAR(255),
    node_version VARCHAR(20),
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE deployments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id UUID REFERENCES projects(id),
    commit_sha VARCHAR(40) NOT NULL,
    branch VARCHAR(255) NOT NULL,
    status VARCHAR(20) DEFAULT 'pending',
    url TEXT,
    preview_url TEXT,
    build_logs TEXT,
    deploy_logs TEXT,
    started_at TIMESTAMP,
    completed_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX idx_deployments_project_id ON deployments(project_id);
CREATE INDEX idx_deployments_status ON deployments(status);
CREATE INDEX idx_deployments_created_at ON deployments(created_at);
```

## 🐳 Docker Compose (Development)

```yaml
# docker-compose.yml
version: '3.8'

services:
  # Databases
  postgres:
    image: postgres:15
    environment:
      POSTGRES_DB: clouddeck
      POSTGRES_USER: clouddeck
      POSTGRES_PASSWORD: password
    ports:
      - "5432:5432"
    volumes:
      - postgres_data:/var/lib/postgresql/data

  redis:
    image: redis:7-alpine
    ports:
      - "6379:6379"

  # Message Queue
  rabbitmq:
    image: rabbitmq:3-management
    ports:
      - "5672:5672"
      - "15672:15672"

  # Services
  auth-service:
    build: ./auth-service
    ports:
      - "3001:3000"
    environment:
      - DATABASE_URL=postgresql://clouddeck:password@postgres:5432/clouddeck
      - REDIS_URL=redis://redis:6379
    depends_on:
      - postgres
      - redis

  build-service:
    build: ./build-service
    ports:
      - "8081:8080"
    environment:
      - DATABASE_URL=postgresql://clouddeck:password@postgres:5432/clouddeck
      - RABBITMQ_URL=amqp://rabbitmq:5672
    depends_on:
      - postgres
      - rabbitmq
    volumes:
      - /var/run/docker.sock:/var/run/docker.sock

  deploy-service:
    build: ./deploy-service
    ports:
      - "8082:8080"
    environment:
      - DATABASE_URL=postgresql://clouddeck:password@postgres:5432/clouddeck
    depends_on:
      - postgres

volumes:
  postgres_data:
```

## ☸️ Kubernetes Deployment

```yaml
# k8s/auth-service.yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: auth-service
spec:
  replicas: 3
  selector:
    matchLabels:
      app: auth-service
  template:
    metadata:
      labels:
        app: auth-service
    spec:
      containers:
      - name: auth-service
        image: clouddeck/auth-service:latest
        ports:
        - containerPort: 3000
        env:
        - name: DATABASE_URL
          valueFrom:
            secretKeyRef:
              name: database-secret
              key: url
        resources:
          requests:
            memory: "256Mi"
            cpu: "250m"
          limits:
            memory: "512Mi"
            cpu: "500m"
---
apiVersion: v1
kind: Service
metadata:
  name: auth-service
spec:
  selector:
    app: auth-service
  ports:
  - port: 3000
    targetPort: 3000
```

## 🚀 Deployment Pipeline

```yaml
# .github/workflows/deploy.yml
name: Deploy to Production

on:
  push:
    branches: [main]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - name: Run Tests
        run: |
          npm test
          go test ./...

  build:
    needs: test
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - name: Build Docker Images
        run: |
          docker build -t clouddeck/auth-service:${{ github.sha }} ./auth-service
          docker build -t clouddeck/build-service:${{ github.sha }} ./build-service
          
      - name: Push to Registry
        run: |
          docker push clouddeck/auth-service:${{ github.sha }}
          docker push clouddeck/build-service:${{ github.sha }}

  deploy:
    needs: build
    runs-on: ubuntu-latest
    steps:
      - name: Deploy to Kubernetes
        run: |
          kubectl set image deployment/auth-service auth-service=clouddeck/auth-service:${{ github.sha }}
          kubectl set image deployment/build-service build-service=clouddeck/build-service:${{ github.sha }}
```

This microservices architecture provides a scalable, maintainable foundation for a production-grade deployment platform that can compete with industry leaders.