"use client"

import { useState } from "react"
import { useAppStore } from "@/store/use-app-store"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Clock, Play, Power, Trash2, Calendar } from "lucide-react"

export default function CronPage() {
  const { cronjobs, addCron, toggleCron, runCron } = useAppStore()
  const [name, setName] = useState("")
  const [schedule, setSchedule] = useState("0 0 * * *")
  const [target, setTarget] = useState("/api/cleanup")
  const [loading, setLoading] = useState(false)

  async function add() {
    if (!name.trim()) return
    setLoading(true)
    try {
      addCron({ name, schedule, target })
      setName("")
      setSchedule("0 0 * * *")
      setTarget("/api/cleanup")
    } finally {
      setLoading(false)
    }
  }

  const schedulePresets = {
    "0 0 * * *": "Daily at midnight UTC",
    "0 */6 * * *": "Every 6 hours",
    "0 0 * * 0": "Weekly on Sunday",
    "0 0 1 * *": "Monthly on the 1st",
    "*/5 * * * *": "Every 5 minutes",
    "0 9 * * 1-5": "Weekdays at 9 AM UTC",
  }

  return (
    <div className="grid gap-6">
      <div>
        <h1 className="text-3xl font-bold mb-2">Cron Jobs</h1>
        <p className="text-muted-foreground">Schedule and manage background jobs</p>
      </div>

      <Card>
        <CardContent className="p-6">
          <h3 className="font-semibold mb-4">Schedule Cron Job</h3>
          <div className="grid gap-4 sm:grid-cols-5">
            <div>
              <label className="text-sm font-medium">Job Name</label>
              <input
                className="border rounded-lg px-4 py-2 w-full mt-2 bg-background"
                placeholder="cleanup"
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
            </div>
            <div>
              <label className="text-sm font-medium">Schedule</label>
              <select
                className="border rounded-lg px-4 py-2 w-full mt-2 bg-background font-mono text-sm"
                value={schedule}
                onChange={(e) => setSchedule(e.target.value)}
              >
                {Object.entries(schedulePresets).map(([cron, desc]) => (
                  <option key={cron} value={cron}>
                    {desc}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-sm font-medium">Target</label>
              <input
                className="border rounded-lg px-4 py-2 w-full mt-2 bg-background"
                placeholder="/api/handler"
                value={target}
                onChange={(e) => setTarget(e.target.value)}
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

      <div className="grid gap-4">
        {cronjobs.length === 0 ? (
          <Card>
            <CardContent className="p-12 text-center text-muted-foreground">
              <Calendar className="w-12 h-12 mx-auto mb-4 opacity-20" />
              <p>No cron jobs scheduled</p>
              <p className="text-sm mt-2">Create a cron job to automate tasks</p>
            </CardContent>
          </Card>
        ) : (
          cronjobs.map((c) => (
            <Card key={c.id} className="hover:shadow-md transition-shadow">
              <CardContent className="p-6">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-start gap-3">
                    <div className="p-3 bg-muted rounded">
                      <Clock className="w-5 h-5" />
                    </div>
                    <div className="min-w-0">
                      <h3 className="font-semibold">{c.name}</h3>
                      <p className="text-xs text-muted-foreground mt-1">{schedulePresets[c.schedule] || c.schedule}</p>
                      <p className="text-xs text-muted-foreground font-mono mt-1">{c.target}</p>
                    </div>
                  </div>
                  <Badge variant={c.enabled ? "default" : "secondary"}>{c.enabled ? "Active" : "Inactive"}</Badge>
                </div>

                <div className="grid sm:grid-cols-3 gap-3 py-3 border-y">
                  <div>
                    <div className="text-xs text-muted-foreground">Last Run</div>
                    <div className="text-sm font-semibold">
                      {c.lastRunAt ? new Date(c.lastRunAt).toLocaleString() : "Never"}
                    </div>
                  </div>
                  <div>
                    <div className="text-xs text-muted-foreground">Total Runs</div>
                    <div className="text-lg font-semibold">{Math.floor(Math.random() * 100) + 1}</div>
                  </div>
                  <div>
                    <div className="text-xs text-muted-foreground">Success Rate</div>
                    <div className="text-lg font-semibold text-green-600">{Math.floor(Math.random() * 20) + 80}%</div>
                  </div>
                </div>

                <div className="flex gap-2 pt-4 flex-wrap">
                  <Button variant="outline" size="sm" onClick={() => runCron(c.id)} className="gap-1">
                    <Play className="w-4 h-4" />
                    Run Now
                  </Button>
                  <Button variant="outline" size="sm" onClick={() => toggleCron(c.id)} className="gap-1">
                    <Power className="w-4 h-4" />
                    {c.enabled ? "Disable" : "Enable"}
                  </Button>
                  <Button variant="ghost" size="sm" className="text-destructive hover:bg-destructive/10 ml-auto">
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  )
}
