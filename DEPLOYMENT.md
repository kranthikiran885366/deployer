# CloudDeck Deployment & Hosting Platform

## Project Overview

A comprehensive cloud hosting and deployment management platform built with Next.js (frontend) and Express.js with MongoDB (backend).

## Features

### Core Deployment Features
- One-click deployment from GitHub, GitLab, Bitbucket
- Continuous Deployment (auto deploy on git push)
- Manual deploys via CLI or drag-and-drop ZIP
- Atomic deploys with zero-downtime updates
- Instant rollbacks to previous versions
- Preview deploys for every PR/branch
- Deploy contexts (production/staging/dev configs)
- Custom build commands and environment configs
- Build caching for faster redeploys

### Project Management
- Create and manage multiple projects
- Support for Next.js, Express, React, Vue, Svelte
- Deploy to multiple regions (iad1, fra1, sfo1, sin1)
- Auto-deploy on git push with branch controls
- Project status tracking (active, paused, archived)

### Database Management
- PostgreSQL, MySQL, MongoDB, Redis support
- Automatic backups with point-in-time recovery
- Managed database provisioning
- Scalable sizing (micro to xlarge)
- Multi-region deployment
- Connection pooling and optimization

### Serverless Functions
- Deploy serverless functions (Node, Python)
- Multiple runtime support
- Function invocation and monitoring
- Memory and timeout configuration
- Performance tracking

### Scheduled Jobs (Cron)
- Cron job scheduling with validation
- Custom target endpoints
- Execution tracking
- Failure notifications

### Domain & SSL Management
- Custom domain setup with DNS configuration
- Automatic SSL certificate generation
- Domain verification workflow
- Certificate renewal automation

### Environment Variables
- Scope-based configuration (prod/staging/dev)
- Secret value protection
- Bulk import/export
- Audit trails for changes

### Logging & Monitoring
- Real-time log streaming
- Log filtering and search
- Level-based filtering (debug, info, warn, error)
- Log export functionality
- Service-specific logging

### Team & Access Control
- Role-based access control (owner, admin, developer, viewer)
- Team member management
- Invitation system with email
- Audit logs for access

### Billing & Usage
- Tiered pricing (Hobby, Pro, Scale)
- Usage tracking (bandwidth, functions, storage)
- Payment method management
- Invoice history

## Tech Stack

### Frontend
- **Framework**: Next.js 15 with App Router
- **Language**: JavaScript
- **Styling**: Tailwind CSS v4
- **UI Components**: Shadcn/ui
- **State Management**: Zustand
- **Forms**: React Hook Form
- **HTTP Client**: Fetch API with custom client

### Backend
- **Runtime**: Node.js
- **Framework**: Express.js
- **Database**: MongoDB with Mongoose
- **Authentication**: JWT
- **API**: RESTful with comprehensive routing

### Infrastructure
- **Development**: Local setup with nodemon
- **Database**: MongoDB Atlas or local instance
- **Environment**: Node.js 18+

## Project Structure

\`\`\`
.
├── app/                    # Next.js app directory
│   ├── (app)/             # Protected routes
│   │   ├── dashboard/
│   │   ├── projects/
│   │   ├── deployments/
│   │   ├── databases/
│   │   ├── functions/
│   │   ├── cronjobs/
│   │   ├── domains/
│   │   ├── env/
│   │   ├── logs/
│   │   ├── team/
│   │   ├── billing/
│   │   ├── settings/
│   │   └── layout.jsx
│   ├── login/
│   ├── page.jsx           # Landing page
│   ├── layout.tsx         # Root layout
│   └── globals.css
├── components/
│   ├── ui/               # Shadcn components
│   └── clouddeck/        # Custom components
├── lib/
│   ├── api-client.js     # API client
│   └── utils.ts
├── store/
│   └── use-app-store.js  # Zustand store
├── server/               # Backend
│   ├── config/
│   │   ├── database.js
│   │   └── env.js
│   ├── models/           # Mongoose models
│   ├── services/         # Business logic
│   ├── controllers/      # Request handlers
│   ├── routes/           # API routes
│   ├── middleware/       # Express middleware
│   ├── utils/            # Utilities
│   └── index.js          # Server entry
└── public/               # Static assets
\`\`\`

## Setup Instructions

### Prerequisites
- Node.js 18+
- MongoDB (local or Atlas)
- Git

### Frontend Setup
\`\`\`bash
# Install dependencies
npm install

# Run development server
npm run dev

# Build for production
npm run build
npm start
\`\`\`

### Backend Setup
\`\`\`bash
# Navigate to server directory
cd server

# Install dependencies
npm install

# Create .env file
cp ../.env.example .env

# Run development server
npm run dev

# Run production
npm start
\`\`\`

## API Documentation

### Authentication
All API routes require JWT token in Authorization header:
\`\`\`
Authorization: Bearer <token>
\`\`\`

### Endpoints

#### Deployments
- `GET /api/deployments/project/:projectId` - List deployments
- `POST /api/deployments` - Create deployment
- `GET /api/deployments/:id` - Get deployment details
- `PATCH /api/deployments/:id/status` - Update status
- `POST /api/deployments/:id/rollback` - Rollback deployment
- `GET /api/deployments/:id/logs` - Get deployment logs

#### Projects
- `GET /api/projects` - List projects
- `POST /api/projects` - Create project
- `GET /api/projects/:id` - Get project
- `PATCH /api/projects/:id` - Update project
- `DELETE /api/projects/:id` - Delete project
- `GET /api/projects/:id/stats` - Get project stats

#### Databases
- `GET /api/databases/project/:projectId` - List databases
- `POST /api/databases/project/:projectId` - Create database
- `PATCH /api/databases/:id` - Update database
- `DELETE /api/databases/:id` - Delete database

#### Functions
- `GET /api/functions/project/:projectId` - List functions
- `POST /api/functions/project/:projectId` - Create function
- `PATCH /api/functions/:id` - Update function
- `DELETE /api/functions/:id` - Delete function
- `POST /api/functions/:id/invoke` - Invoke function

#### Cron Jobs
- `GET /api/cronjobs/project/:projectId` - List cron jobs
- `POST /api/cronjobs/project/:projectId` - Create cron job
- `PATCH /api/cronjobs/:id` - Update cron job
- `DELETE /api/cronjobs/:id` - Delete cron job
- `POST /api/cronjobs/:id/run` - Run cron job

#### Domains
- `GET /api/domains/project/:projectId` - List domains
- `POST /api/domains/project/:projectId` - Create domain
- `POST /api/domains/:id/verify` - Verify domain
- `DELETE /api/domains/:id` - Delete domain

#### Environment
- `GET /api/environment/project/:projectId` - List env vars
- `POST /api/environment/project/:projectId` - Create env var
- `PATCH /api/environment/:id` - Update env var
- `DELETE /api/environment/:id` - Delete env var

#### Team
- `GET /api/team/project/:projectId` - List team members
- `POST /api/team/project/:projectId/invite` - Invite member
- `PATCH /api/team/:id/role` - Update member role
- `DELETE /api/team/:id` - Remove member

#### Logs
- `GET /api/logs/project/:projectId` - Get logs
- `GET /api/logs/project/:projectId/stats` - Get log stats
- `DELETE /api/logs/project/:projectId` - Clear logs

## Real Data Integration

The application integrates real MongoDB data through:
1. API Client (`lib/api-client.js`) - Centralized API communication
2. Zustand Store (`store/use-app-store.js`) - Client-side state management
3. Express Controllers - Server-side request handling
4. Mongoose Models - Data persistence

## Missing Features Implemented

1. ✅ Complete backend infrastructure (Express, MongoDB)
2. ✅ All database models with relationships
3. ✅ RESTful API routes for all features
4. ✅ Service layer with business logic
5. ✅ Middleware for auth and validation
6. ✅ Error handling and logging
7. ✅ Real data integration across all pages
8. ✅ Enhanced UI/UX on all pages
9. ✅ Team management and access control
10. ✅ Billing and usage tracking
