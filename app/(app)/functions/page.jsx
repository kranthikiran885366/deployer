"use client"

import { useState } from "react"
import { useAppStore } from "@/store/use-app-store"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Play, Power, Copy, Trash2, Code, Clock, Zap } from "lucide-react"

export default function FunctionsPage() {
  const { functions, addFunction, toggleFunction, invokeFunction } = useAppStore()
  const [name, setName] = useState("")
  const [path, setPath] = useState("/api/hello")
  const [runtime, setRuntime] = useState("node")
  const [loading, setLoading] = useState(false)

  async function add() {
    if (!name.trim() || !path.trim()) return
    setLoading(true)
    try {
      addFunction({ name, path })
      setName("")
      setPath("/api/hello")
    } finally {
      setLoading(false)
    }
  }

  const runtimeConfig = {
    node: { label: "Node.js", version: "18.x", color: "bg-green-500" },
    python: { label: "Python", version: "3.11", color: "bg-blue-500" },
    go: { label: "Go", version: "1.20", color: "bg-cyan-500" },
  }

  return (
    <div className="grid gap-6">
      <div>
        <h1 className="text-3xl font-bold mb-2">Serverless Functions</h1>
        <p className="text-muted-foreground">Deploy and manage serverless functions</p>
      </div>

      <Card>
        <CardContent className="p-6">
          <h3 className="font-semibold mb-4">Deploy Serverless Function</h3>
          <div className="grid gap-4 sm:grid-cols-5">
            <div>
              <label className="text-sm font-medium">Function Name</label>
              <input
                className="border rounded-lg px-4 py-2 w-full mt-2 bg-background"
                placeholder="my-function"
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
            </div>
            <div>
              <label className="text-sm font-medium">Path</label>
              <input
                className="border rounded-lg px-4 py-2 w-full mt-2 bg-background font-mono text-sm"
                placeholder="/api/handler"
                value={path}
                onChange={(e) => setPath(e.target.value)}
              />
            </div>
            <div>
              <label className="text-sm font-medium">Runtime</label>
              <select
                className="border rounded-lg px-4 py-2 w-full mt-2 bg-background"
                value={runtime}
                onChange={(e) => setRuntime(e.target.value)}
              >
                <option value="node">Node.js</option>
                <option value="python">Python</option>
                <option value="go">Go</option>
              </select>
            </div>
            <div className="flex items-end">
              <Button onClick={add} disabled={loading} className="w-full">
                {loading ? "Deploying..." : "Deploy"}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-4">
        {functions.length === 0 ? (
          <Card>
            <CardContent className="p-12 text-center text-muted-foreground">
              <Code className="w-12 h-12 mx-auto mb-4 opacity-20" />
              <p>No functions deployed yet</p>
              <p className="text-sm mt-2">Deploy a serverless function to get started</p>
            </CardContent>
          </Card>
        ) : (
          functions.map((f) => (
            <Card key={f.id} className="hover:shadow-md transition-shadow">
              <CardContent className="p-6">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-start gap-3">
                    <div className="p-3 bg-muted rounded">
                      <Code className="w-5 h-5" />
                    </div>
                    <div className="min-w-0">
                      <h3 className="font-semibold">{f.name}</h3>
                      <p className="text-xs text-muted-foreground font-mono mt-1">{f.path}</p>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Badge variant={f.enabled ? "default" : "secondary"}>{f.enabled ? "Enabled" : "Disabled"}</Badge>
                  </div>
                </div>

                <div className="grid sm:grid-cols-3 gap-3 py-3 border-y">
                  <div>
                    <div className="text-xs text-muted-foreground flex items-center gap-1">
                      <Zap className="w-3 h-3" />
                      Invocations
                    </div>
                    <div className="text-lg font-semibold">{Math.floor(Math.random() * 1000) + 100}</div>
                  </div>
                  <div>
                    <div className="text-xs text-muted-foreground flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      Avg Duration
                    </div>
                    <div className="text-lg font-semibold">{Math.floor(Math.random() * 300) + 50}ms</div>
                  </div>
                  <div>
                    <div className="text-xs text-muted-foreground">Last Run</div>
                    <div className="text-sm font-semibold">
                      {f.lastRunAt ? new Date(f.lastRunAt).toLocaleTimeString() : "Never"}
                    </div>
                  </div>
                </div>

                <div className="flex gap-2 pt-4 flex-wrap">
                  <Button variant="outline" size="sm" onClick={() => invokeFunction(f.id)} className="gap-1">
                    <Play className="w-4 h-4" />
                    Invoke
                  </Button>
                  <Button variant="outline" size="sm" onClick={() => toggleFunction(f.id)} className="gap-1">
                    <Power className="w-4 h-4" />
                    {f.enabled ? "Disable" : "Enable"}
                  </Button>
                  <Button variant="outline" size="sm" className="gap-1 bg-transparent">
                    <Copy className="w-4 h-4" />
                    Logs
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
