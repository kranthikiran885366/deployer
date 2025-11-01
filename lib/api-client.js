class APIClient {
  constructor(baseURL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api") {
    this.baseURL = baseURL
    this.apiOrigin = baseURL.replace("/api", "")
    this.token = typeof window !== "undefined" ? localStorage.getItem("auth_token") : null
  }

  setToken(token) {
    this.token = token
    if (typeof window !== "undefined") {
      localStorage.setItem("auth_token", token)
    }
  }

  setRefreshToken(refreshToken) {
    if (typeof window !== "undefined") {
      localStorage.setItem("refresh_token", refreshToken)
    }
  }

  getRefreshToken() {
    if (typeof window !== "undefined") {
      return localStorage.getItem("refresh_token")
    }
    return null
  }

  clearTokens() {
    if (typeof window !== "undefined") {
      localStorage.removeItem("auth_token")
      localStorage.removeItem("refresh_token")
    }
    this.token = null
  }

  async request(endpoint, options = {}, isAuthEndpoint = false) {
    // Use apiOrigin for auth endpoints, baseURL for API endpoints
    const baseUrl = isAuthEndpoint ? this.apiOrigin : this.baseURL
    const url = `${baseUrl}${endpoint}`
    
    const headers = {
      "Content-Type": "application/json",
      ...(this.token && { Authorization: `Bearer ${this.token}` }),
      ...options.headers,
    }

    try {
      const response = await fetch(url, {
        ...options,
        headers,
      })

      if (!response.ok) {
        const error = await response.json().catch(() => ({}))
        throw new Error(error.error || `HTTP ${response.status}`)
      }

      return await response.json()
    } catch (error) {
      console.error(`[API Error] ${endpoint}:`, error.message)
      throw error
    }
  }

  // ==================== Authentication ====================
  
  async signup(email, password, confirmPassword, name) {
    const data = await this.request("/auth/signup", {
      method: "POST",
      body: JSON.stringify({ email, password, confirmPassword, name }),
    }, true)
    
    if (data.token) {
      this.setToken(data.token)
      this.setRefreshToken(data.refreshToken)
    }
    return data
  }

  async login(email, password) {
    const data = await this.request("/auth/login", {
      method: "POST",
      body: JSON.stringify({ email, password }),
    }, true)
    
    if (data.token) {
      this.setToken(data.token)
      this.setRefreshToken(data.refreshToken)
    }
    return data
  }

  async logout() {
    try {
      await this.request("/auth/logout", {
        method: "POST",
      }, true)
    } catch (error) {
      console.warn("Logout error:", error)
    }
    this.clearTokens()
  }

  async refreshAccessToken() {
    const refreshToken = this.getRefreshToken()
    if (!refreshToken) {
      throw new Error("No refresh token available")
    }

    const data = await this.request("/auth/refresh", {
      method: "POST",
      body: JSON.stringify({ refreshToken }),
    }, true)

    if (data.token) {
      this.setToken(data.token)
    }
    return data
  }

  async getCurrentUser() {
    return this.request("/auth/me", {}, true)
  }

  async updateProfile(name, avatar) {
    return this.request("/auth/profile", {
      method: "PUT",
      body: JSON.stringify({ name, avatar }),
    }, true)
  }

  async changePassword(currentPassword, newPassword, confirmPassword) {
    return this.request("/auth/change-password", {
      method: "POST",
      body: JSON.stringify({ currentPassword, newPassword, confirmPassword }),
    }, true)
  }

  async forgotPassword(email) {
    return this.request("/auth/forgot-password", {
      method: "POST",
      body: JSON.stringify({ email }),
    }, true)
  }

  async resetPassword(resetToken, newPassword, confirmPassword) {
    return this.request("/auth/reset-password", {
      method: "POST",
      body: JSON.stringify({ resetToken, newPassword, confirmPassword }),
    }, true)
  }

  startGoogleOAuth() {
    if (typeof window !== "undefined") {
      window.location.href = `${this.apiOrigin}/auth/google`
    }
  }

  startGitHubOAuth() {
    if (typeof window !== "undefined") {
      window.location.href = `${this.apiOrigin}/auth/github`
    }
  }

  // Deployments
  async getDeployments(projectId, limit = 50) {
    return this.request(`/deployments/project/${projectId}?limit=${limit}`)
  }

  async createDeployment(data) {
    return this.request("/deployments", { method: "POST", body: JSON.stringify(data) })
  }

  async getDeployment(id) {
    return this.request(`/deployments/${id}`)
  }

  async updateDeploymentStatus(id, status) {
    return this.request(`/deployments/${id}/status`, { method: "PATCH", body: JSON.stringify({ status }) })
  }

  async rollbackDeployment(id) {
    return this.request(`/deployments/${id}/rollback`, { method: "POST" })
  }

  async getDeploymentLogs(id) {
    return this.request(`/deployments/${id}/logs`)
  }

  // Projects
  async getProjects() {
    return this.request("/projects")
  }

  async createProject(data) {
    return this.request("/projects", { method: "POST", body: JSON.stringify(data) })
  }

  async getProject(id) {
    return this.request(`/projects/${id}`)
  }

  async updateProject(id, data) {
    return this.request(`/projects/${id}`, { method: "PATCH", body: JSON.stringify(data) })
  }

  async deleteProject(id) {
    return this.request(`/projects/${id}`, { method: "DELETE" })
  }

  async getProjectStats(id) {
    return this.request(`/projects/${id}/stats`)
  }

  // Databases
  async getDatabases(projectId) {
    return this.request(`/databases/project/${projectId}`)
  }

  async createDatabase(projectId, data) {
    return this.request(`/databases/project/${projectId}`, { method: "POST", body: JSON.stringify(data) })
  }

  async updateDatabase(id, data) {
    return this.request(`/databases/${id}`, { method: "PATCH", body: JSON.stringify(data) })
  }

  async deleteDatabase(id) {
    return this.request(`/databases/${id}`, { method: "DELETE" })
  }

  // Functions
  async getFunctions(projectId) {
    return this.request(`/functions/project/${projectId}`)
  }

  async createFunction(projectId, data) {
    return this.request(`/functions/project/${projectId}`, { method: "POST", body: JSON.stringify(data) })
  }

  async updateFunction(id, data) {
    return this.request(`/functions/${id}`, { method: "PATCH", body: JSON.stringify(data) })
  }

  async deleteFunction(id) {
    return this.request(`/functions/${id}`, { method: "DELETE" })
  }

  async invokeFunction(id) {
    return this.request(`/functions/${id}/invoke`, { method: "POST" })
  }

  // Cron Jobs
  async getCronJobs(projectId) {
    return this.request(`/cronjobs/project/${projectId}`)
  }

  async createCronJob(projectId, data) {
    return this.request(`/cronjobs/project/${projectId}`, { method: "POST", body: JSON.stringify(data) })
  }

  async updateCronJob(id, data) {
    return this.request(`/cronjobs/${id}`, { method: "PATCH", body: JSON.stringify(data) })
  }

  async deleteCronJob(id) {
    return this.request(`/cronjobs/${id}`, { method: "DELETE" })
  }

  async runCronJob(id) {
    return this.request(`/cronjobs/${id}/run`, { method: "POST" })
  }

  // Domains
  async getDomains(projectId) {
    return this.request(`/domains/project/${projectId}`)
  }

  async createDomain(projectId, host) {
    return this.request(`/domains/project/${projectId}`, { method: "POST", body: JSON.stringify({ host }) })
  }

  async verifyDomain(id) {
    return this.request(`/domains/${id}/verify`, { method: "POST" })
  }

  async deleteDomain(id) {
    return this.request(`/domains/${id}`, { method: "DELETE" })
  }

  // Environment
  async getEnvironments(projectId, scope) {
    const query = scope ? `?scope=${scope}` : ""
    return this.request(`/environment/project/${projectId}${query}`)
  }

  async createEnvironment(projectId, data) {
    return this.request(`/environment/project/${projectId}`, { method: "POST", body: JSON.stringify(data) })
  }

  async updateEnvironment(id, data) {
    return this.request(`/environment/${id}`, { method: "PATCH", body: JSON.stringify(data) })
  }

  async deleteEnvironment(id) {
    return this.request(`/environment/${id}`, { method: "DELETE" })
  }

  // Team
  async getTeamMembers(projectId) {
    return this.request(`/team/project/${projectId}`)
  }

  async inviteMember(projectId, email, role) {
    return this.request(`/team/project/${projectId}/invite`, {
      method: "POST",
      body: JSON.stringify({ email, role }),
    })
  }

  async updateMemberRole(id, role) {
    return this.request(`/team/${id}/role`, { method: "PATCH", body: JSON.stringify({ role }) })
  }

  async removeMember(id) {
    return this.request(`/team/${id}`, { method: "DELETE" })
  }

  // Logs
  async getLogs(projectId, options = {}) {
    const query = new URLSearchParams(options).toString()
    return this.request(`/logs/project/${projectId}${query ? `?${query}` : ""}`)
  }

  async getLogStats(projectId) {
    return this.request(`/logs/project/${projectId}/stats`)
  }

  async clearLogs(projectId) {
    return this.request(`/logs/project/${projectId}`, { method: "DELETE" })
  }

  // Build Management
  async getBuildCache(projectId) {
    return this.request(`/builds/cache/${projectId}`)
  }

  async initiateBuild(projectId, deploymentId, config) {
    return this.request("/builds/initiate", {
      method: "POST",
      body: JSON.stringify({ projectId, deploymentId, config }),
    })
  }

  async recordBuildStep(deploymentId, step, duration, status) {
    return this.request(`/builds/${deploymentId}/step`, {
      method: "POST",
      body: JSON.stringify({ step, duration, status }),
    })
  }

  async finalizeBuild(deploymentId, metrics) {
    return this.request(`/builds/${deploymentId}/finalize`, {
      method: "POST",
      body: JSON.stringify(metrics),
    })
  }

  async generateCacheKey(framework, dependencies, buildConfig) {
    return this.request("/builds/cache-key", {
      method: "POST",
      body: JSON.stringify({ framework, dependencies, buildConfig }),
    })
  }

  async getBuildRecommendations(deploymentId, metrics) {
    return this.request(`/builds/recommendations/${deploymentId}`, {
      method: "POST",
      body: JSON.stringify({ metrics }),
    })
  }

  // Monitoring and Analytics
  async recordMetric(projectId, deploymentId, metricType, value, region) {
    return this.request("/monitoring/metric", {
      method: "POST",
      body: JSON.stringify({ projectId, deploymentId, metricType, value, region }),
    })
  }

  async getMetrics(projectId, metricType, timeRange = 7) {
    return this.request(`/monitoring/metrics/${projectId}?metricType=${metricType}&timeRange=${timeRange}`)
  }

  async getMetricsSummary(projectId, timeRange = 7) {
    return this.request(`/monitoring/summary/${projectId}?timeRange=${timeRange}`)
  }

  async getServiceHealth(projectId) {
    return this.request(`/monitoring/health/${projectId}`)
  }

  async getErrorLogs(projectId, timeRange = 1) {
    return this.request(`/monitoring/errors/${projectId}?timeRange=${timeRange}`)
  }

  // Deployment Metrics and Analytics
  async getDeploymentMetrics(deploymentId) {
    return this.request(`/deployments/${deploymentId}/metrics`)
  }

  async getDeploymentAnalytics(projectId, timeRange = 7) {
    return this.request(`/deployments/analytics/project/${projectId}?timeRange=${timeRange}`)
  }

  async getDeploymentsByStatus(projectId, status) {
    return this.request(`/deployments/project/${projectId}?status=${status}`)
  }

  async rollbackDeploymentWithReason(id, reason) {
    return this.request(`/deployments/${id}/rollback`, {
      method: "POST",
      body: JSON.stringify({ reason }),
    })
  }

  // Project Health and Statistics
  async getProjectHealth(projectId) {
    return this.request(`/projects/${projectId}/health`)
  }

  async getFunctionMetrics(functionId) {
    return this.request(`/functions/${functionId}/metrics`)
  }

  async toggleFunction(functionId, enabled) {
    return this.request(`/functions/${functionId}/toggle`, {
      method: "PATCH",
      body: JSON.stringify({ enabled }),
    })
  }

  // Provider Operations
  async getSupportedProviders() {
    return this.request("/providers/list")
  }

  async connectProvider(provider, credentials) {
    return this.request("/providers/connect", {
      method: "POST",
      body: JSON.stringify({ provider, credentials }),
    })
  }

  async disconnectProvider(provider) {
    return this.request(`/providers/${provider}/disconnect`, {
      method: "DELETE",
    })
  }

  async startProviderDeployment(projectId, provider, config) {
    return this.request("/providers/deploy", {
      method: "POST",
      body: JSON.stringify({ projectId, provider, config }),
    })
  }

  async getProviderDeploymentStatus(deploymentId) {
    return this.request(`/providers/deployments/${deploymentId}/status`)
  }

  async getProviderDeploymentLogs(deploymentId, limit = 50, offset = 0) {
    return this.request(`/providers/deployments/${deploymentId}/logs?limit=${limit}&offset=${offset}`)
  }

  async cancelProviderDeployment(deploymentId) {
    return this.request(`/providers/deployments/${deploymentId}/cancel`, {
      method: "POST",
    })
  }
}

const apiClient = new APIClient()
export default apiClient

