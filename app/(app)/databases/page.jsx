"use client"

import { useState } from "react"
import { useAppStore } from "@/store/use-app-store"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Copy, Download, Settings, Trash2, RefreshCw, Database, Users, HardDrive } from "lucide-react"

export default function DatabasesPage() {
  const { databases, createDatabase } = useAppStore()
  const [type, setType] = useState("PostgreSQL")
  const [size, setSize] = useState("Small")
  const [region, setRegion] = useState("iad1")
  const [loading, setLoading] = useState(false)

  async function add() {
    setLoading(true)
    try {
      createDatabase({ type, size, region })
    } finally {
      setLoading(false)
    }
  }

  const dbConfig = {
    PostgreSQL: {
      icon: "🐘",
      color: "bg-blue-500",
      features: ["ACID compliance", "JSON support", "PostGIS"],
    },
    Redis: {
      icon: "⚡",
      color: "bg-red-500",
      features: ["In-memory cache", "Real-time sync", "Pub/Sub"],
    },
    MongoDB: {
      icon: "🍃",
      color: "bg-green-500",
      features: ["Document DB", "Flexible schema", "Aggregation"],
    },
    MySQL: {
      icon: "🐬",
      color: "bg-blue-600",
      features: ["Relational DB", "InnoDB support", "Full-text search"],
    },
  }

  const sizeConfig = {
    Micro: "0.5 GB RAM, 1 vCPU",
    Small: "2 GB RAM, 2 vCPU",
    Medium: "8 GB RAM, 4 vCPU",
    Large: "32 GB RAM, 8 vCPU",
  }

  async function copy(val) {
    try {
      await navigator.clipboard.writeText(val)
      alert("Connection string copied to clipboard!")
    } catch (err) {
      console.error("Failed to copy:", err)
    }
  }

  return (
    <div className="grid gap-6">
      <div>
        <h1 className="text-3xl font-bold mb-2">Databases</h1>
        <p className="text-muted-foreground">Create and manage managed databases</p>
      </div>

      <Card>
        <CardContent className="p-6">
          <h3 className="font-semibold mb-4">Provision Database</h3>
          <div className="grid gap-4 sm:grid-cols-5">
            <div>
              <label className="text-sm font-medium">Type</label>
              <select
                className="border rounded-lg px-4 py-2 w-full mt-2 bg-background"
                value={type}
                onChange={(e) => setType(e.target.value)}
              >
                <option>PostgreSQL</option>
                <option>Redis</option>
                <option>MongoDB</option>
                <option>MySQL</option>
              </select>
            </div>
            <div>
              <label className="text-sm font-medium">Size</label>
              <select
                className="border rounded-lg px-4 py-2 w-full mt-2 bg-background"
                value={size}
                onChange={(e) => setSize(e.target.value)}
              >
                <option>Micro</option>
                <option>Small</option>
                <option>Medium</option>
                <option>Large</option>
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
            <div className="flex items-end">
              <Button onClick={add} disabled={loading} className="w-full">
                {loading ? "Creating..." : "Create"}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-4">
        {databases.length === 0 ? (
          <Card>
            <CardContent className="p-12 text-center text-muted-foreground">
              <Database className="w-12 h-12 mx-auto mb-4 opacity-20" />
              <p>No databases provisioned yet</p>
              <p className="text-sm mt-2">Create a database to store your data</p>
            </CardContent>
          </Card>
        ) : (
          databases.map((d) => {
            const config = dbConfig[d.type] || dbConfig.PostgreSQL
            return (
              <Card key={d.id} className="hover:shadow-md transition-shadow">
                <CardContent className="p-6">
                  <div className="grid gap-4">
                    <div className="flex items-start justify-between">
                      <div className="flex items-start gap-3">
                        <div className={`p-3 ${config.color} rounded text-white text-lg`}>{config.icon}</div>
                        <div className="min-w-0">
                          <div className="font-semibold text-lg">{d.type}</div>
                          <div className="text-sm text-muted-foreground mt-1">
                            {d.size} • {d.region}
                          </div>
                          <div className="text-xs text-muted-foreground mt-1 flex items-center gap-2">
                            <HardDrive className="w-3 h-3" />
                            {sizeConfig[d.size]}
                          </div>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <Button variant="outline" size="sm" className="gap-1 bg-transparent">
                          <Settings className="w-4 h-4" />
                        </Button>
                        <Button variant="ghost" size="sm" className="text-destructive hover:bg-destructive/10">
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>

                    <div className="grid sm:grid-cols-3 gap-3 py-3 border-y">
                      {config.features.map((f, i) => (
                        <div key={i} className="flex items-center gap-2 text-sm">
                          <span className="text-primary">✓</span>
                          <span className="text-muted-foreground">{f}</span>
                        </div>
                      ))}
                    </div>

                    <div>
                      <div className="text-xs font-medium text-muted-foreground mb-2">Connection String</div>
                      <div className="flex gap-2">
                        <code className="flex-1 text-xs bg-muted p-3 rounded font-mono break-all">
                          {d.connectionString}
                        </code>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => copy(d.connectionString)}
                          className="gap-1 flex-shrink-0"
                        >
                          <Copy className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>

                    <div className="flex gap-2 pt-2 flex-wrap">
                      <Button variant="outline" size="sm" className="gap-1 bg-transparent">
                        <Download className="w-4 h-4" />
                        Backup
                      </Button>
                      <Button variant="outline" size="sm" className="gap-1 bg-transparent">
                        <RefreshCw className="w-4 h-4" />
                        Rotate
                      </Button>
                      <Button variant="outline" size="sm" className="gap-1 bg-transparent">
                        <Users className="w-4 h-4" />
                        Users
                      </Button>
                    </div>
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
