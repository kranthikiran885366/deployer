"use client"

import { useParams } from "next/navigation"
import { useAppStore } from "@/store/use-app-store"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Clock, CheckCircle2, AlertCircle, RefreshCw, Download, Share2 } from "lucide-react"

export default function DeploymentDetailPage() {
  const { id } = useParams()
  const { deployments, rollbackDeployment } = useAppStore()
  const dep = deployments.find((d) => d.id === id)

  if (!dep) {
    return (
      <Card>
        <CardContent className="p-12 text-center text-muted-foreground">Deployment not found</CardContent>
      </Card>
    )
  }

  const getStatusIcon = (status) => {
    if (status === "Running") return CheckCircle2
    if (status === "Building") return Clock
    if (status === "Failed") return AlertCircle
    return Clock
  }

  const StatusIcon = getStatusIcon(dep.status)
  const statusColor =
    dep.status === "Running" ? "text-green-500" : dep.status === "Building" ? "text-blue-500" : "text-red-500"

  return (
    <div className="grid gap-6">
      <Card>
        <CardContent className="p-6">
          <div className="flex items-start justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-muted rounded-lg">
                <StatusIcon className={`w-6 h-6 ${statusColor}`} />
              </div>
              <div>
                <h1 className="text-2xl font-semibold">{dep.project}</h1>
                <p className="text-sm text-muted-foreground mt-1">{dep.version}</p>
              </div>
            </div>
            <Badge>{dep.status}</Badge>
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            <div>
              <h3 className="font-medium mb-4">Deployment Information</h3>
              <dl className="space-y-3">
                <div>
                  <dt className="text-xs font-medium text-muted-foreground uppercase">Project</dt>
                  <dd className="text-sm font-medium mt-1">{dep.project}</dd>
                </div>
                <div>
                  <dt className="text-xs font-medium text-muted-foreground uppercase">Version</dt>
                  <dd className="text-sm font-medium mt-1">{dep.version}</dd>
                </div>
                <div>
                  <dt className="text-xs font-medium text-muted-foreground uppercase">Status</dt>
                  <dd className="text-sm font-medium mt-1">{dep.status}</dd>
                </div>
                <div>
                  <dt className="text-xs font-medium text-muted-foreground uppercase">Deployed</dt>
                  <dd className="text-sm font-medium mt-1">{dep.time}</dd>
                </div>
              </dl>
            </div>

            <div>
              <h3 className="font-medium mb-4">Build Details</h3>
              <dl className="space-y-3">
                <div>
                  <dt className="text-xs font-medium text-muted-foreground uppercase">Build Duration</dt>
                  <dd className="text-sm font-medium mt-1">2m 34s</dd>
                </div>
                <div>
                  <dt className="text-xs font-medium text-muted-foreground uppercase">Build Cache</dt>
                  <dd className="text-sm font-medium mt-1">78% hit rate</dd>
                </div>
                <div>
                  <dt className="text-xs font-medium text-muted-foreground uppercase">Deploy Size</dt>
                  <dd className="text-sm font-medium mt-1">24.5 MB</dd>
                </div>
              </dl>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-6">
          <h3 className="font-medium mb-4">Build Logs</h3>
          <div className="bg-muted/50 p-4 rounded-lg font-mono text-xs leading-relaxed max-h-64 overflow-auto space-y-1">
            <div>
              <span className="text-muted-foreground">[14:32:12]</span> Starting build...
            </div>
            <div>
              <span className="text-muted-foreground">[14:32:15]</span> Installing dependencies...
            </div>
            <div>
              <span className="text-muted-foreground">[14:32:45]</span> Running build script...
            </div>
            <div>
              <span className="text-muted-foreground">[14:33:20]</span> Build complete!
            </div>
            <div>
              <span className="text-muted-foreground">[14:33:22]</span> Deploying to production...
            </div>
            <div>
              <span className="text-green-500">[14:33:45]</span>{" "}
              <span className="font-semibold">Deployment successful</span>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="flex gap-3">
        <Button onClick={() => rollbackDeployment(dep.id)} variant="destructive" className="gap-2">
          <RefreshCw className="w-4 h-4" />
          Rollback Deployment
        </Button>
        <Button variant="outline" className="gap-2 bg-transparent">
          <Download className="w-4 h-4" />
          Download Logs
        </Button>
        <Button variant="outline" className="gap-2 bg-transparent">
          <Share2 className="w-4 h-4" />
          Share
        </Button>
      </div>
    </div>
  )
}
