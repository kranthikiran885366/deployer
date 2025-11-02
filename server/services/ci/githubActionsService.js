const { Octokit } = require('@octokit/rest');
const { AuditLog } = require('../../models/AuditLog');
const { Build } = require('../../models/Build');

class GitHubActionsService {
  constructor() {
    this.octokit = new Octokit({
      auth: process.env.GITHUB_TOKEN
    });
  }

  async listWorkflows(owner, repo) {
    try {
      const { data } = await this.octokit.actions.listRepoWorkflows({
        owner,
        repo
      });

      return data.workflows.map(workflow => ({
        id: workflow.id,
        name: workflow.name,
        path: workflow.path,
        state: workflow.state,
        createdAt: workflow.created_at,
        updatedAt: workflow.updated_at
      }));
    } catch (error) {
      throw new Error(`Failed to list workflows: ${error.message}`);
    }
  }

  async getWorkflowRuns(owner, repo, workflowId) {
    try {
      const { data } = await this.octokit.actions.listWorkflowRuns({
        owner,
        repo,
        workflow_id: workflowId
      });

      return data.workflow_runs.map(run => ({
        id: run.id,
        name: run.name,
        status: run.status,
        conclusion: run.conclusion,
        branch: run.head_branch,
        commit: run.head_commit,
        triggeredBy: run.triggering_actor,
        runNumber: run.run_number,
        createdAt: run.created_at,
        updatedAt: run.updated_at
      }));
    } catch (error) {
      throw new Error(`Failed to get workflow runs: ${error.message}`);
    }
  }

  async triggerWorkflow(owner, repo, workflowId, ref, inputs = {}) {
    try {
      const { data } = await this.octokit.actions.createWorkflowDispatch({
        owner,
        repo,
        workflow_id: workflowId,
        ref,
        inputs
      });

      await AuditLog.create({
        action: 'workflow_triggered',
        details: {
          owner,
          repo,
          workflowId,
          ref,
          inputs
        },
        timestamp: new Date()
      });

      return data;
    } catch (error) {
      throw new Error(`Failed to trigger workflow: ${error.message}`);
    }
  }

  async getWorkflowRunLogs(owner, repo, runId) {
    try {
      const { data } = await this.octokit.actions.downloadWorkflowRunLogs({
        owner,
        repo,
        run_id: runId
      });

      return data;
    } catch (error) {
      throw new Error(`Failed to get workflow run logs: ${error.message}`);
    }
  }

  async cancelWorkflowRun(owner, repo, runId) {
    try {
      await this.octokit.actions.cancelWorkflowRun({
        owner,
        repo,
        run_id: runId
      });

      await AuditLog.create({
        action: 'workflow_cancelled',
        details: {
          owner,
          repo,
          runId
        },
        timestamp: new Date()
      });

      return true;
    } catch (error) {
      throw new Error(`Failed to cancel workflow run: ${error.message}`);
    }
  }

  async createWorkflowFile(owner, repo, path, content) {
    try {
      const { data } = await this.octokit.repos.createOrUpdateFileContents({
        owner,
        repo,
        path,
        message: 'Add workflow file',
        content: Buffer.from(content).toString('base64')
      });

      await AuditLog.create({
        action: 'workflow_file_created',
        details: {
          owner,
          repo,
          path
        },
        timestamp: new Date()
      });

      return data;
    } catch (error) {
      throw new Error(`Failed to create workflow file: ${error.message}`);
    }
  }

  async syncWorkflowRuns(owner, repo) {
    try {
      const workflows = await this.listWorkflows(owner, repo);
      
      for (const workflow of workflows) {
        const runs = await this.getWorkflowRuns(owner, repo, workflow.id);
        
        for (const run of runs) {
          await Build.findOneAndUpdate(
            { 
              provider: 'github',
              workflowId: workflow.id,
              runId: run.id 
            },
            {
              provider: 'github',
              workflowId: workflow.id,
              runId: run.id,
              name: run.name,
              status: run.status,
              conclusion: run.conclusion,
              branch: run.branch,
              commit: run.commit,
              triggeredBy: run.triggeredBy,
              runNumber: run.runNumber,
              createdAt: run.createdAt,
              updatedAt: run.updatedAt
            },
            { upsert: true }
          );
        }
      }

      return true;
    } catch (error) {
      throw new Error(`Failed to sync workflow runs: ${error.message}`);
    }
  }

  generateDefaultWorkflow(name, triggers = {}, steps = []) {
    const workflow = {
      name,
      on: triggers,
      jobs: {
        build: {
          'runs-on': 'ubuntu-latest',
          steps: [
            {
              name: 'Checkout repository',
              uses: 'actions/checkout@v2'
            },
            ...steps
          ]
        }
      }
    };

    return yaml.dump(workflow);
  }
}

module.exports = new GitHubActionsService();