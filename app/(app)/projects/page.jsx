"use client"

import { useState } from "react"
import { useAppStore } from "@/store/use-app-store"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Zap, Server, Settings, Trash2, GitBranch, Code, ExternalLink } from "lucide-react"

export default function ProjectsPage() {
  const { projects, createProject, deployments } = useAppStore()
  const [name, setName] = useState("")
  const [framework, setFramework] = useState("Next.js")
  const [region, setRegion] = useState("iad1")
  const [gitRepo, setGitRepo] = useState("")
  const [loading, setLoading] = useState(false)

  async function add() {
    if (!name.trim()) return
    setLoading(true)
    try {
      createProject({ name, framework, region })
      setName("")
      setGitRepo("")
    } finally {
      setLoading(false)
    }
  }

  const frameworkConfig = {
    "Next.js": { icon: Zap, color: "text-black dark:text-white" },
    Express: { icon: Server, color: "text-yellow-600" },
    React: { icon: Zap, color: "text-cyan-500" },
    Vue: { icon: Zap, color: "text-green-500" },
    Svelte: { icon: Zap, color: "text-orange-500" },
    Python: { icon: Code, color: "text-blue-600" },
  }

  const regionLabels = {
    iad1: "US East (Virginia)",
    fra1: "EU (Frankfurt)",
    sfo1: "US West (California)",
    sin1: "Asia (Singapore)",
  }

  const getProjectStats = (projectName) => {
    const deployCount = deployments.filter((d) => d.project === projectName).length
    const lastDeploy = deployments.find((d) => d.project === projectName)
    return {
      deployments: deployCount,
      lastStatus: lastDeploy?.status || "Never",
    }
  }

  return (
    <div className="grid gap-6">
      <div>
        <h1 className="text-3xl font-bold mb-2">Projects</h1>
        <p className="text-muted-foreground">Create and manage your projects</p>
      </div>

      <Card>
        <CardContent className="p-6">
          <h3 className="font-semibold mb-4">Create New Project</h3>
          <div className="grid gap-4 sm:grid-cols-5">
            <div>
              <label className="text-sm font-medium">Project Name</label>
              <input
                className="border rounded-lg px-4 py-2 w-full mt-2 bg-background"
                placeholder="my-awesome-project"
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
            </div>
            <div>
              <label className="text-sm font-medium">Framework</label>
              <select
                className="border rounded-lg px-4 py-2 w-full mt-2 bg-background"
                value={framework}
                onChange={(e) => setFramework(e.target.value)}
              >
                <option>Next.js</option>
                <option>Express</option>
                <option>React</option>
                <option>Vue</option>
                <option>Svelte</option>
                <option>Python</option>
              </select>
            </div>
            <div>
              <label className="text-sm font-medium">Region</label>
              <select
                className="border rounded-lg px-4 py-2 w-full mt-2 bg-background"
                value={region}
                onChange={(e) => setRegion(e.target.value)}
              >
                <option value="iad1">US East</option>
                <option value="fra1">EU Frankfurt</option>
                <option value="sfo1">US West</option>
                <option value="sin1">Asia</option>
              </select>
            </div>
            <div>
              <label className="text-sm font-medium">Git Repo (Optional)</label>
              <input
                className="border rounded-lg px-4 py-2 w-full mt-2 bg-background"
                placeholder="github.com/user/repo"
                value={gitRepo}
                onChange={(e) => setGitRepo(e.target.value)}
              />
            </div>
            <div className="flex items-end">
              <Button onClick={add} disabled={loading} className="w-full">
                {loading ? "Creating..." : "Create"}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {projects.length === 0 ? (
          <Card className="md:col-span-2 lg:col-span-3">
            <CardContent className="p-12 text-center text-muted-foreground">
              <Zap className="w-12 h-12 mx-auto mb-4 opacity-20" />
              <p>No projects yet. Create one to get started!</p>
            </CardContent>
          </Card>
        ) : (
          projects.map((p) => {
            const config = frameworkConfig[p.framework] || frameworkConfig["Next.js"]
            const FrameworkIcon = config.icon
            const stats = getProjectStats(p.name)
            return (
              <Card key={p.id} className="hover:shadow-lg transition-shadow">
                <CardContent className="p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-start gap-3">
                      <div className="p-2 bg-muted rounded">
                        <FrameworkIcon className={`w-5 h-5 ${config.color}`} />
                      </div>
                      <div className="min-w-0">
                        <h3 className="font-semibold truncate">{p.name}</h3>
                        <p className="text-xs text-muted-foreground mt-1">{p.framework}</p>
                      </div>
                    </div>
                    <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                      <Settings className="w-4 h-4" />
                    </Button>
                  </div>

                  <div className="space-y-2 mb-4">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-muted-foreground">Region</span>
                      <Badge variant="outline">{regionLabels[p.region]}</Badge>
                    </div>
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-muted-foreground">Deployments</span>
                      <Badge variant="outline">{stats.deployments}</Badge>
                    </div>
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-muted-foreground">Last Deploy</span>
                      <Badge variant={stats.lastStatus === "Running" ? "default" : "secondary"}>
                        {stats.lastStatus}
                      </Badge>
                    </div>
                  </div>

                  <div className="flex gap-2 pt-4 border-t">
                    <Button asChild variant="outline" size="sm" className="flex-1 bg-transparent gap-1">
                      <a href={`/projects/${p.id}`}>
                        <ExternalLink className="w-3 h-3" />
                        View
                      </a>
                    </Button>
                    <Button variant="outline" size="sm" className="flex-1 bg-transparent gap-1">
                      <GitBranch className="w-3 h-3" />
                      Branches
                    </Button>
                    <Button variant="ghost" size="sm" className="text-destructive hover:bg-destructive/10">
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )
          })
        )}
      </div>
    </div>
  )
}
