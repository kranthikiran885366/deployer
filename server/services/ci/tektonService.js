const k8s = require('@kubernetes/client-node');
const { AuditLog } = require('../../models/AuditLog');

class TektonService {
  constructor() {
    this.kc = new k8s.KubeConfig();
    this.kc.loadFromDefault();
    this.tekton = this.kc.makeApiClient(k8s.CustomObjectsApi);
    this.namespace = process.env.TEKTON_NAMESPACE || 'default';
  }

  async listPipelines() {
    try {
      const { body } = await this.tekton.listNamespacedCustomObject(
        'tekton.dev',
        'v1beta1',
        this.namespace,
        'pipelines'
      );

      return body.items.map(pipeline => ({
        name: pipeline.metadata.name,
        namespace: pipeline.metadata.namespace,
        tasks: pipeline.spec.tasks,
        params: pipeline.spec.params,
        workspaces: pipeline.spec.workspaces,
        createdAt: pipeline.metadata.creationTimestamp
      }));
    } catch (error) {
      throw new Error(`Failed to list pipelines: ${error.message}`);
    }
  }

  async createPipeline(pipelineSpec) {
    try {
      const { body } = await this.tekton.createNamespacedCustomObject(
        'tekton.dev',
        'v1beta1',
        this.namespace,
        'pipelines',
        {
          apiVersion: 'tekton.dev/v1beta1',
          kind: 'Pipeline',
          metadata: {
            name: pipelineSpec.name
          },
          spec: {
            params: pipelineSpec.params || [],
            workspaces: pipelineSpec.workspaces || [],
            tasks: pipelineSpec.tasks
          }
        }
      );

      await AuditLog.create({
        action: 'tekton_pipeline_created',
        details: {
          name: pipelineSpec.name,
          tasks: pipelineSpec.tasks.length
        },
        timestamp: new Date()
      });

      return body;
    } catch (error) {
      throw new Error(`Failed to create pipeline: ${error.message}`);
    }
  }

  async runPipeline(name, params = {}, workspaces = []) {
    try {
      const { body } = await this.tekton.createNamespacedCustomObject(
        'tekton.dev',
        'v1beta1',
        this.namespace,
        'pipelineruns',
        {
          apiVersion: 'tekton.dev/v1beta1',
          kind: 'PipelineRun',
          metadata: {
            generateName: `${name}-run-`
          },
          spec: {
            pipelineRef: {
              name: name
            },
            params: Object.entries(params).map(([name, value]) => ({
              name,
              value: String(value)
            })),
            workspaces
          }
        }
      );

      await AuditLog.create({
        action: 'tekton_pipeline_run_started',
        details: {
          pipeline: name,
          runName: body.metadata.name,
          params
        },
        timestamp: new Date()
      });

      return body;
    } catch (error) {
      throw new Error(`Failed to run pipeline: ${error.message}`);
    }
  }

  async getPipelineRun(name) {
    try {
      const { body } = await this.tekton.getNamespacedCustomObject(
        'tekton.dev',
        'v1beta1',
        this.namespace,
        'pipelineruns',
        name
      );

      return {
        name: body.metadata.name,
        pipeline: body.spec.pipelineRef.name,
        status: body.status.conditions[0].reason,
        startTime: body.status.startTime,
        completionTime: body.status.completionTime,
        taskRuns: Object.values(body.status.taskRuns || {}).map(tr => ({
          name: tr.pipelineTaskName,
          status: tr.status?.conditions[0].reason,
          startTime: tr.status?.startTime,
          completionTime: tr.status?.completionTime
        }))
      };
    } catch (error) {
      throw new Error(`Failed to get pipeline run: ${error.message}`);
    }
  }

  async getPipelineRunLogs(name) {
    try {
      const run = await this.getPipelineRun(name);
      const logs = {};

      for (const task of run.taskRuns) {
        const { body } = await this.tekton.getNamespacedCustomObjectSubresource(
          'tekton.dev',
          'v1beta1',
          this.namespace,
          'taskruns',
          `${name}-${task.name}`,
          'log'
        );
        logs[task.name] = body;
      }

      return logs;
    } catch (error) {
      throw new Error(`Failed to get pipeline run logs: ${error.message}`);
    }
  }

  async cancelPipelineRun(name) {
    try {
      const { body } = await this.tekton.patchNamespacedCustomObject(
        'tekton.dev',
        'v1beta1',
        this.namespace,
        'pipelineruns',
        name,
        [
          {
            op: 'replace',
            path: '/spec/status',
            value: 'Cancelled'
          }
        ],
        undefined,
        undefined,
        undefined,
        { headers: { 'Content-Type': 'application/json-patch+json' } }
      );

      await AuditLog.create({
        action: 'tekton_pipeline_run_cancelled',
        details: {
          name
        },
        timestamp: new Date()
      });

      return body;
    } catch (error) {
      throw new Error(`Failed to cancel pipeline run: ${error.message}`);
    }
  }

  async deletePipelineRun(name) {
    try {
      await this.tekton.deleteNamespacedCustomObject(
        'tekton.dev',
        'v1beta1',
        this.namespace,
        'pipelineruns',
        name
      );

      await AuditLog.create({
        action: 'tekton_pipeline_run_deleted',
        details: {
          name
        },
        timestamp: new Date()
      });

      return true;
    } catch (error) {
      throw new Error(`Failed to delete pipeline run: ${error.message}`);
    }
  }

  async listTasks() {
    try {
      const { body } = await this.tekton.listNamespacedCustomObject(
        'tekton.dev',
        'v1beta1',
        this.namespace,
        'tasks'
      );

      return body.items.map(task => ({
        name: task.metadata.name,
        namespace: task.metadata.namespace,
        steps: task.spec.steps,
        params: task.spec.params,
        workspaces: task.spec.workspaces,
        createdAt: task.metadata.creationTimestamp
      }));
    } catch (error) {
      throw new Error(`Failed to list tasks: ${error.message}`);
    }
  }

  generateDefaultPipeline(name, stages = []) {
    return {
      name,
      params: [
        {
          name: 'git-url',
          type: 'string',
          description: 'Git repository URL'
        },
        {
          name: 'git-revision',
          type: 'string',
          description: 'Git revision to build',
          default: 'main'
        }
      ],
      workspaces: [
        {
          name: 'source',
          description: 'The git source code'
        }
      ],
      tasks: stages.map((stage, index) => ({
        name: stage.name,
        taskRef: {
          name: stage.task
        },
        runAfter: index > 0 ? [stages[index - 1].name] : [],
        params: stage.params || [],
        workspaces: stage.workspaces || []
      }))
    };
  }
}

module.exports = new TektonService();