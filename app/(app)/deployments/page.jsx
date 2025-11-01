"use client"

import { useState } from "react"
import Link from "next/link"
import { useAppStore } from "@/store/use-app-store"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { CheckCircle2, AlertCircle, Clock, Zap, Search, MoreVertical, Play, RotateCcw, Eye } from "lucide-react"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"

export default function DeploymentsPage() {
  const { deployments, projects, triggerDeployment, rollbackDeployment } = useAppStore()
  const [selectedProject, setSelectedProject] = useState("")
  const [searchTerm, setSearchTerm] = useState("")
  const [filter, setFilter] = useState("all")
  const [sortBy, setSortBy] = useState("recent")
  const [loading, setLoading] = useState(false)

  const filteredDeployments = deployments
    .filter((d) => {
      const matchesProject = !selectedProject || d.project === selectedProject
      const matchesSearch =
        d.project.toLowerCase().includes(searchTerm.toLowerCase()) ||
        d.version.toLowerCase().includes(searchTerm.toLowerCase())
      const matchesFilter = filter === "all" || d.status.toLowerCase() === filter.toLowerCase()
      return matchesProject && matchesSearch && matchesFilter
    })
    .sort((a, b) => {
      if (sortBy === "recent") return new Date(b.time) - new Date(a.time)
      if (sortBy === "status") return a.status.localeCompare(b.status)
      return 0
    })

  async function handleDeploy() {
    if (!selectedProject) return
    setLoading(true)
    try {
      await triggerDeployment({ project: selectedProject })
    } finally {
      setLoading(false)
    }
  }

  const getStatusConfig = (status) => {
    const configs = {
      Running: { icon: CheckCircle2, color: "text-green-500", bg: "bg-green-500/10", badge: "success" },
      Building: { icon: Clock, color: "text-blue-500", bg: "bg-blue-500/10", badge: "secondary" },
      Failed: { icon: AlertCircle, color: "text-red-500", bg: "bg-red-500/10", badge: "destructive" },
      Pending: { icon: Clock, color: "text-gray-500", bg: "bg-gray-500/10", badge: "outline" },
    }
    return configs[status] || configs["Pending"]
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold">Deployments</h1>
          <p className="text-muted-foreground mt-1">Manage and monitor all your deployments</p>
        </div>
        <Button
          onClick={handleDeploy}
          disabled={loading || !selectedProject}
          size="lg"
          className="w-full sm:w-auto gap-2"
        >
          <Play className="w-4 h-4" />
          {loading ? "Deploying..." : "Trigger Deployment"}
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="relative">
          <Search className="absolute left-3 top-3 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Search by project or version..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        <select
          className="border rounded-lg px-4 py-2 bg-background"
          value={selectedProject}
          onChange={(e) => setSelectedProject(e.target.value)}
        >
          <option value="">Select Project</option>
          {projects.map((p) => (
            <option key={p.id} value={p.name}>
              {p.name}
            </option>
          ))}
        </select>
        <select
          className="border rounded-lg px-4 py-2 bg-background"
          value={sortBy}
          onChange={(e) => setSortBy(e.target.value)}
        >
          <option value="recent">Most Recent</option>
          <option value="status">By Status</option>
        </select>
        <select
          className="border rounded-lg px-4 py-2 bg-background"
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
        >
          <option value="all">All Statuses</option>
          <option value="running">Running</option>
          <option value="building">Building</option>
          <option value="failed">Failed</option>
        </select>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>Deployment History</span>
            <span className="text-sm font-normal text-muted-foreground">{filteredDeployments.length} total</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {filteredDeployments.length === 0 ? (
            <div className="text-center py-12">
              <Zap className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
              <p className="text-muted-foreground">No deployments found</p>
              <p className="text-sm text-muted-foreground mt-2">Trigger a deployment to get started</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Status</TableHead>
                    <TableHead>Project</TableHead>
                    <TableHead>Version</TableHead>
                    <TableHead>Time</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredDeployments.map((d, idx) => {
                    const config = getStatusConfig(d.status)
                    const StatusIcon = config.icon

                    return (
                      <TableRow key={idx} className="hover:bg-muted/50">
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <div className={`p-2 rounded-lg ${config.bg}`}>
                              <StatusIcon className={`w-4 h-4 ${config.color}`} />
                            </div>
                            <Badge variant={config.badge}>{d.status}</Badge>
                          </div>
                        </TableCell>
                        <TableCell className="font-medium">{d.project}</TableCell>
                        <TableCell className="text-muted-foreground font-mono">{d.version}</TableCell>
                        <TableCell className="text-sm text-muted-foreground">{d.time}</TableCell>
                        <TableCell className="text-right">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="sm">
                                <MoreVertical className="w-4 h-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem asChild>
                                <Link href={`/deployments/${d.id}`} className="flex items-center gap-2">
                                  <Eye className="w-4 h-4" />
                                  View Details
                                </Link>
                              </DropdownMenuItem>
                              <DropdownMenuItem>View Logs</DropdownMenuItem>
                              {d.status === "Running" && (
                                <DropdownMenuItem
                                  onClick={() => rollbackDeployment(d.id)}
                                  className="text-destructive flex items-center gap-2"
                                >
                                  <RotateCcw className="w-4 h-4" />
                                  Rollback
                                </DropdownMenuItem>
                              )}
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    )
                  })}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
