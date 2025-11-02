const axios = require('axios');
const https = require('https');
const { AuditLog } = require('../../models/AuditLog');

class ArgoCDService {
  constructor() {
    this.baseUrl = process.env.ARGOCD_SERVER_URL;
    this.token = process.env.ARGOCD_AUTH_TOKEN;
    this.client = axios.create({
      baseURL: this.baseUrl,
      headers: {
        Authorization: `Bearer ${this.token}`
      },
      httpsAgent: new https.Agent({
        rejectUnauthorized: false // Only for development
      })
    });
  }

  async listApplications() {
    try {
      const { data } = await this.client.get('/api/v1/applications');
      return data.items.map(app => ({
        name: app.metadata.name,
        namespace: app.metadata.namespace,
        project: app.spec.project,
        source: app.spec.source,
        destination: app.spec.destination,
        status: app.status.sync.status,
        health: app.status.health.status,
        operationState: app.status.operationState?.phase
      }));
    } catch (error) {
      throw new Error(`Failed to list applications: ${error.message}`);
    }
  }

  async createApplication(appSpec) {
    try {
      const { data } = await this.client.post('/api/v1/applications', {
        metadata: {
          name: appSpec.name,
          namespace: appSpec.namespace
        },
        spec: {
          project: appSpec.project,
          source: {
            repoURL: appSpec.repoUrl,
            path: appSpec.path,
            targetRevision: appSpec.targetRevision || 'HEAD'
          },
          destination: {
            server: appSpec.destinationServer,
            namespace: appSpec.destinationNamespace
          },
          syncPolicy: appSpec.syncPolicy || {
            automated: {
              prune: true,
              selfHeal: true
            }
          }
        }
      });

      await AuditLog.create({
        action: 'argocd_application_created',
        details: {
          name: appSpec.name,
          project: appSpec.project
        },
        timestamp: new Date()
      });

      return data;
    } catch (error) {
      throw new Error(`Failed to create application: ${error.message}`);
    }
  }

  async getApplication(name) {
    try {
      const { data } = await this.client.get(`/api/v1/applications/${name}`);
      return {
        name: data.metadata.name,
        namespace: data.metadata.namespace,
        project: data.spec.project,
        source: data.spec.source,
        destination: data.spec.destination,
        status: data.status.sync.status,
        health: data.status.health.status,
        resources: data.status.resources,
        operationState: data.status.operationState
      };
    } catch (error) {
      throw new Error(`Failed to get application: ${error.message}`);
    }
  }

  async syncApplication(name, options = {}) {
    try {
      const { data } = await this.client.post(`/api/v1/applications/${name}/sync`, {
        revision: options.revision || 'HEAD',
        prune: options.prune || true,
        dryRun: options.dryRun || false,
        strategy: options.strategy || { apply: { force: false } },
        resources: options.resources || []
      });

      await AuditLog.create({
        action: 'argocd_application_synced',
        details: {
          name,
          options
        },
        timestamp: new Date()
      });

      return data;
    } catch (error) {
      throw new Error(`Failed to sync application: ${error.message}`);
    }
  }

  async deleteApplication(name, cascade = true) {
    try {
      await this.client.delete(`/api/v1/applications/${name}`, {
        params: { cascade }
      });

      await AuditLog.create({
        action: 'argocd_application_deleted',
        details: {
          name,
          cascade
        },
        timestamp: new Date()
      });

      return true;
    } catch (error) {
      throw new Error(`Failed to delete application: ${error.message}`);
    }
  }

  async getApplicationLogs(name, container, options = {}) {
    try {
      const { data } = await this.client.get(`/api/v1/applications/${name}/logs`, {
        params: {
          container,
          sinceSeconds: options.sinceSeconds || 3600,
          tailLines: options.tailLines || 100,
          follow: options.follow || false
        }
      });
      return data;
    } catch (error) {
      throw new Error(`Failed to get application logs: ${error.message}`);
    }
  }

  async getApplicationResources(name) {
    try {
      const { data } = await this.client.get(`/api/v1/applications/${name}/resource-tree`);
      return data.nodes.map(node => ({
        name: node.name,
        kind: node.kind,
        namespace: node.namespace,
        status: node.health?.status,
        sync: node.status,
        version: node.version,
        createdAt: node.createdAt
      }));
    } catch (error) {
      throw new Error(`Failed to get application resources: ${error.message}`);
    }
  }

  async rollbackApplication(name, id) {
    try {
      const { data } = await this.client.post(`/api/v1/applications/${name}/rollback`, {
        id
      });

      await AuditLog.create({
        action: 'argocd_application_rollback',
        details: {
          name,
          id
        },
        timestamp: new Date()
      });

      return data;
    } catch (error) {
      throw new Error(`Failed to rollback application: ${error.message}`);
    }
  }

  async getApplicationEvents(name) {
    try {
      const { data } = await this.client.get(`/api/v1/applications/${name}/events`);
      return data.items.map(event => ({
        type: event.type,
        reason: event.reason,
        message: event.message,
        timestamp: event.lastTimestamp
      }));
    } catch (error) {
      throw new Error(`Failed to get application events: ${error.message}`);
    }
  }
}

module.exports = new ArgoCDService();