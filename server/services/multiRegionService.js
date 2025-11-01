const Region = require('../models/Region');
const Deployment = require('../models/Deployment');
const AWS = require('aws-sdk');
const { CloudBuild } = require('@google-cloud/cloud-build');
const { ComputeManagementClient } = require('@azure/arm-compute');

class MultiRegionService {
  constructor() {
    this.providers = {
      aws: new AWS.ECS(),
      gcp: new CloudBuild(),
      azure: new ComputeManagementClient(),
    };
  }

  async createRegion(regionData) {
    const region = new Region(regionData);
    return region.save();
  }

  async listRegions() {
    return Region.find().sort({ name: 1 });
  }

  async getRegion(id) {
    return Region.findById(id).populate('deployments.deploymentId');
  }

  async toggleRegion(id) {
    const region = await Region.findById(id);
    if (!region) {
      throw new Error('Region not found');
    }

    region.isActive = !region.isActive;
    if (!region.isActive) {
      region.traffic.percentage = 0;
    }

    return region.save();
  }

  async updateTrafficDistribution(id, percentage) {
    const region = await Region.findById(id);
    if (!region) {
      throw new Error('Region not found');
    }

    // Ensure total traffic across regions doesn't exceed 100%
    const otherRegions = await Region.find({ _id: { $ne: id } });
    const totalOtherTraffic = otherRegions.reduce(
      (sum, r) => sum + (r.traffic.percentage || 0),
      0
    );

    if (totalOtherTraffic + percentage > 100) {
      throw new Error('Total traffic distribution cannot exceed 100%');
    }

    return region.updateTraffic(percentage);
  }

  async deployToRegion(regionId, deploymentId) {
    const [region, deployment] = await Promise.all([
      Region.findById(regionId),
      Deployment.findById(deploymentId),
    ]);

    if (!region || !deployment) {
      throw new Error('Region or deployment not found');
    }

    try {
      await region.addDeployment(deploymentId, deployment.version);

      // Deploy based on provider
      switch (region.provider) {
        case 'aws':
          await this._deployToAWS(region, deployment);
          break;
        case 'gcp':
          await this._deployToGCP(region, deployment);
          break;
        case 'azure':
          await this._deployToAzure(region, deployment);
          break;
        default:
          throw new Error('Unsupported provider');
      }

      await region.updateDeploymentStatus(deploymentId, 'running', {
        level: 'info',
        message: 'Deployment successful',
      });

      return region;
    } catch (error) {
      await region.updateDeploymentStatus(deploymentId, 'failed', {
        level: 'error',
        message: error.message,
      });
      throw error;
    }
  }

  async getHealthChecks() {
    const regions = await Region.find({ isActive: true });
    const healthChecks = {};

    await Promise.all(
      regions.map(async (region) => {
        try {
          const metrics = await this._checkRegionHealth(region);
          await region.updateHealth(metrics);
          
          healthChecks[region.id] = {
            health: this._calculateHealthScore(metrics),
            latency: metrics.latency,
            status: region.health.status,
          };
        } catch (error) {
          console.error(`Health check failed for region ${region.name}:`, error);
        }
      })
    );

    return healthChecks;
  }

  async _deployToAWS(region, deployment) {
    // AWS ECS deployment logic
    const params = {
      cluster: region.name,
      service: deployment.name,
      taskDefinition: `${deployment.name}:${deployment.version}`,
      desiredCount: region.configuration.scalingMin,
    };

    await this.providers.aws.updateService(params).promise();
  }

  async _deployToGCP(region, deployment) {
    // Google Cloud Build deployment logic
    const build = {
      steps: [
        {
          name: 'gcr.io/cloud-builders/docker',
          args: ['build', '-t', `${region.location}/${deployment.name}:${deployment.version}`, '.'],
        },
      ],
    };

    await this.providers.gcp.createBuild(build);
  }

  async _deployToAzure(region, deployment) {
    // Azure deployment logic
    const params = {
      location: region.location,
      tags: {
        version: deployment.version,
      },
      properties: {
        hardwareProfile: {
          vmSize: region.configuration.instanceType,
        },
      },
    };

    await this.providers.azure.virtualMachines.createOrUpdate(
      region.name,
      deployment.name,
      params
    );
  }

  async _checkRegionHealth(region) {
    // Implement health checks based on provider
    const metrics = {
      cpuUsage: Math.random() * 100,
      memoryUsage: Math.random() * 100,
      latency: Math.random() * 1000,
      errorRate: Math.random() * 10,
    };

    return metrics;
  }

  _calculateHealthScore(metrics) {
    // Calculate health score between 0 and 1
    const cpuScore = 1 - (metrics.cpuUsage / 100);
    const memoryScore = 1 - (metrics.memoryUsage / 100);
    const latencyScore = 1 - (metrics.latency / 1000);
    const errorScore = 1 - (metrics.errorRate / 10);

    return (cpuScore + memoryScore + latencyScore + errorScore) / 4;
  }
}

module.exports = new MultiRegionService();