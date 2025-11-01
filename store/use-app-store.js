"use client"

import { create } from "zustand"
import { nanoid } from "nanoid"

const STORAGE_KEY = "clouddeck"

function serializeState(s) {
  return {
    user: s.user,
    isAuthenticated: s.isAuthenticated,
    deployments: s.deployments,
    projects: s.projects,
    databases: s.databases,
    recentActivity: s.recentActivity,
    functions: s.functions,
    cronjobs: s.cronjobs,
    envVars: s.envVars,
    domains: s.domains,
    team: s.team,
    settings: s.settings,
    billing: s.billing,
    logs: s.logs,
  }
}

export const useAppStore = create((set, get) => ({
  user: null,
  isAuthenticated: false,
  deployments: [],
  projects: [],
  databases: [],
  recentActivity: [],
  functions: [],
  cronjobs: [],
  envVars: [],
  domains: [],
  team: [],
  settings: { autoDeploy: true, notifySlack: false },
  billing: { plan: "Hobby", paymentMethod: null, usage: { bandwidthGb: 1, functionsMs: 1500, storageGb: 0.2 } },
  logs: [],
  _initialized: false,
  login: (user) => set({ user, isAuthenticated: true }),
  logout: () => set({ user: null, isAuthenticated: false }),
  setUser: (user) => set({ user }),
  setIsAuthenticated: (isAuthenticated) => set({ isAuthenticated }),
  loadInitialData: () => {
    const state = get()
    if (state._initialized) return
    const raw = typeof window !== "undefined" ? localStorage.getItem(STORAGE_KEY) : null
    if (raw) {
      try {
        const saved = JSON.parse(raw)
        set({ ...saved, _initialized: true })
        return
      } catch {}
    }
    const deployments = Array.from({ length: 8 }).map((_, i) => ({
      id: `dep_${nanoid(6)}`,
      project: ["clouddeck-web", "clouddeck-api", "docs"][i % 3],
      version: `v${1 + i}.${Math.floor(Math.random() * 10)}.${Math.floor(Math.random() * 10)}`,
      status: ["Running", "Building", "Failed"][i % 3],
      time: `${30 - i}m ago`,
    }))
    const projects = [
      { id: nanoid(6), name: "clouddeck-web", framework: "Next.js", region: "iad1" },
      { id: nanoid(6), name: "clouddeck-api", framework: "Express", region: "fra1" },
      { id: nanoid(6), name: "docs", framework: "React", region: "sfo1" },
    ]
    const databases = [
      {
        id: nanoid(6),
        type: "PostgreSQL",
        size: "Small",
        region: "iad1",
        connectionString: "postgres://user:pass@db.example:5432/app",
      },
      {
        id: nanoid(6),
        type: "Redis",
        size: "Small",
        region: "fra1",
        connectionString: "redis://default:pass@redis.example:6379",
      },
    ]
    const recentActivity = deployments.slice(0, 5).map((d) => ({
      id: nanoid(6),
      message: `${d.project} ${d.version} ${d.status === "Failed" ? "failed" : "deployed"}`,
      when: d.time,
    }))
    const functions = [
      { id: nanoid(6), name: "hello-world", path: "/api/hello", enabled: true, lastRunAt: null, lastStatus: null },
    ]
    const cronjobs = [
      { id: nanoid(6), name: "cleanup", schedule: "0 0 * * *", target: "/api/cleanup", enabled: true, lastRunAt: null },
    ]
    const envVars = [
      {
        id: nanoid(6),
        name: "NEXT_PUBLIC_API_URL",
        value: "https://api.example.com",
        scope: "prod",
        createdAt: new Date().toISOString(),
      },
    ]
    const domains = [
      {
        id: nanoid(6),
        host: "app.example.com",
        status: "pending",
        dnsRecords: [{ type: "CNAME", host: "app", value: "cname.clouddeck.dev" }],
      },
    ]
    const team = [{ id: nanoid(6), email: "owner@example.com", role: "owner", invitedAt: new Date().toISOString() }]
    const settings = { autoDeploy: true, notifySlack: false }
    const billing = { plan: "Hobby", paymentMethod: null, usage: { bandwidthGb: 1, functionsMs: 1500, storageGb: 0.2 } }
    const logs = [
      { id: String(Date.now()), service: "clouddeck-web", level: "info", message: "App booted", timestamp: Date.now() },
    ]
    set({
      deployments,
      projects,
      databases,
      recentActivity,
      functions,
      cronjobs,
      envVars,
      domains,
      team,
      settings,
      billing,
      logs,
      _initialized: true,
    })
  },
  triggerDeployment: ({ project }) => {
    const newDep = {
      id: `dep_${nanoid(6)}`,
      project,
      version: `v${Math.floor(Math.random() * 5) + 1}.${Math.floor(Math.random() * 10)}.${Math.floor(Math.random() * 10)}`,
      status: "Building",
      time: "just now",
    }
    set((s) => ({
      deployments: [newDep, ...s.deployments],
      recentActivity: [{ id: nanoid(6), message: `Triggered deploy for ${project}`, when: "now" }, ...s.recentActivity],
    }))
    setTimeout(() => {
      set((s) => ({
        deployments: s.deployments.map((d) => (d.id === newDep.id ? { ...d, status: "Running", time: "1m ago" } : d)),
        recentActivity: [
          { id: nanoid(6), message: `Deploy ready for ${project}`, when: "1m ago" },
          ...s.recentActivity,
        ],
      }))
    }, 1500)
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(serializeState(get())))
    } catch {}
  },
  rollbackDeployment: (id) => {
    const dep = get().deployments.find((d) => d.id === id)
    if (!dep) return
    set((s) => ({
      recentActivity: [{ id: nanoid(6), message: `Rolled back ${dep.project}`, when: "now" }, ...s.recentActivity],
    }))
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(serializeState(get())))
    } catch {}
  },
  createProject: ({ name, framework, region }) => {
    set((s) => ({
      projects: [{ id: nanoid(6), name, framework, region }, ...s.projects],
      recentActivity: [{ id: nanoid(6), message: `Created project ${name}`, when: "now" }, ...s.recentActivity],
    }))
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(serializeState(get())))
    } catch {}
  },
  createDatabase: ({ type, size, region }) => {
    set((s) => ({
      databases: [
        { id: nanoid(6), type, size, region, connectionString: `${type.toLowerCase()}://user:pass@host:0000/app` },
        ...s.databases,
      ],
      recentActivity: [{ id: nanoid(6), message: `Created ${type} database`, when: "now" }, ...s.recentActivity],
    }))
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(serializeState(get())))
    } catch {}
  },
  linkDatabaseToProject: (dbId) => {
    const db = get().databases.find((d) => d.id === dbId)
    if (!db) return
    set((s) => ({
      recentActivity: [{ id: nanoid(6), message: `Linked ${db.type} to project`, when: "now" }, ...s.recentActivity],
    }))
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(serializeState(get())))
    } catch {}
  },
  addFunction: ({ name, path }) => {
    set((s) => ({
      functions: [{ id: nanoid(6), name, path, enabled: true, lastRunAt: null, lastStatus: null }, ...s.functions],
    }))
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(serializeState(get())))
    } catch {}
  },
  toggleFunction: (id) => {
    set((s) => ({ functions: s.functions.map((f) => (f.id === id ? { ...f, enabled: !f.enabled } : f)) }))
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(serializeState(get())))
    } catch {}
  },
  invokeFunction: (id) => {
    const fn = get().functions.find((f) => f.id === id)
    if (!fn) return
    const ok = Math.random() > 0.1
    set((s) => ({
      functions: s.functions.map((f) =>
        f.id === id ? { ...f, lastRunAt: Date.now(), lastStatus: ok ? "success" : "error" } : f,
      ),
      logs: [
        {
          id: String(Date.now()),
          service: fn.name,
          level: ok ? "info" : "error",
          message: `Invocation ${ok ? "ok" : "failed"}`,
          timestamp: Date.now(),
        },
        ...s.logs,
      ],
    }))
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(serializeState(get())))
    } catch {}
  },
  addCron: ({ name, schedule, target }) => {
    const valid =
      /^(\*|([0-5]?\d))\s+(\*|([01]?\d|2[0-3]))\s+(\*|([01]?\d|2[0-9]|3[01]))\s+(\*|([1-7]))\s+(\*|([0-9]|1[0-2]))/.test(
        schedule,
      ) || schedule.split(" ").length === 5
    if (!valid) return
    set((s) => ({
      cronjobs: [{ id: nanoid(6), name, schedule, target, enabled: true, lastRunAt: null }, ...s.cronjobs],
    }))
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(serializeState(get())))
    } catch {}
  },
  toggleCron: (id) => {
    set((s) => ({ cronjobs: s.cronjobs.map((c) => (c.id === id ? { ...c, enabled: !c.enabled } : c)) }))
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(serializeState(get())))
    } catch {}
  },
  runCron: (id) => {
    set((s) => ({ cronjobs: s.cronjobs.map((c) => (c.id === id ? { ...c, lastRunAt: Date.now() } : c)) }))
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(serializeState(get())))
    } catch {}
  },
  addEnv: ({ name, value, scope }) => {
    if (!name || !value) return
    set((s) => ({
      envVars: [
        { id: nanoid(6), name, value, scope: scope || "prod", createdAt: new Date().toISOString() },
        ...s.envVars,
      ],
    }))
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(serializeState(get())))
    } catch {}
  },
  deleteEnv: (id) => {
    set((s) => ({ envVars: s.envVars.filter((e) => e.id !== id) }))
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(serializeState(get())))
    } catch {}
  },
  addDomain: (host) => {
    if (!host) return
    set((s) => ({
      domains: [
        {
          id: nanoid(6),
          host,
          status: "pending",
          dnsRecords: [{ type: "CNAME", host: host.split(".")[0], value: "cname.clouddeck.dev" }],
        },
        ...s.domains,
      ],
    }))
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(serializeState(get())))
    } catch {}
  },
  verifyDomain: (id) => {
    set((s) => ({ domains: s.domains.map((d) => (d.id === id ? { ...d, status: "verified" } : d)) }))
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(serializeState(get())))
    } catch {}
  },
  deleteDomain: (id) => {
    set((s) => ({ domains: s.domains.filter((d) => d.id !== id) }))
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(serializeState(get())))
    } catch {}
  },
  inviteMember: ({ email, role }) => {
    if (!email) return
    set((s) => ({
      team: [{ id: nanoid(6), email, role: role || "member", invitedAt: new Date().toISOString() }, ...s.team],
    }))
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(serializeState(get())))
    } catch {}
  },
  changeRole: (id, role) => {
    set((s) => ({ team: s.team.map((m) => (m.id === id ? { ...m, role } : m)) }))
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(serializeState(get())))
    } catch {}
  },
  removeMember: (id) => {
    set((s) => ({ team: s.team.filter((m) => m.id !== id) }))
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(serializeState(get())))
    } catch {}
  },
  setSetting: (key, value) => {
    set((s) => ({ settings: { ...s.settings, [key]: value } }))
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(serializeState(get())))
    } catch {}
  },
  setPlan: (plan) => {
    set((s) => ({ billing: { ...s.billing, plan } }))
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(serializeState(get())))
    } catch {}
  },
  addPaymentMethod: ({ brand, last4 }) => {
    set((s) => ({ billing: { ...s.billing, paymentMethod: { brand, last4 } } }))
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(serializeState(get())))
    } catch {}
  },
  updateUsage: (usage) => {
    set((s) => ({ billing: { ...s.billing, usage: { ...s.billing.usage, ...usage } } }))
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(serializeState(get())))
    } catch {}
  },
  addLog: (log) => {
    set((s) => ({ logs: [{ id: nanoid(8), timestamp: Date.now(), ...log }, ...s.logs] }))
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(serializeState(get())))
    } catch {}
  },
  clearLogs: () => {
    set({ logs: [] })
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(serializeState(get())))
    } catch {}
  },
}))
