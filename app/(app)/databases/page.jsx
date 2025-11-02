"use client"

import { useState, useEffect } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Copy, Download, Settings, Trash2, RefreshCw, Database, Users, HardDrive, AlertCircle, CheckCircle, Plus } from "lucide-react"
import apiClient from "@/lib/api-client"
import Link from "next/link"

export default function DatabasesPage() {
  const [databases, setDatabases] = useState([])
  const [loading, setLoading] = useState(true)
  const [creating, setCreating] = useState(false)
  const [error, setError] = useState('')
  const [successMessage, setSuccessMessage] = useState('')
  const [type, setType] = useState("postgresql")
  const [size, setSize] = useState("small")
  const [region, setRegion] = useState("iad1")
  const [name, setName] = useState('')

  useEffect(() => {
    fetchDatabases()
  }, [])

  const fetchDatabases = async () => {
    try {
      setError('')
      const response = await apiClient.getDatabases()
      if (response && Array.isArray(response)) {
        setDatabases(response)
      } else {
        setDatabases([])
      }
    } catch (err) {
      setError(err.message || 'Failed to fetch databases')
      setDatabases([])
    } finally {
      setLoading(false)
    }
  }

  const handleCreateDatabase = async () => {
    if (!name.trim()) {
      setError('Database name is required')
      return
    }

    setCreating(true)
    try {
      setError('')
      const response = await apiClient.createDatabase({
        name: name.trim(),
        type,
        size,
        region,
        projectId: '507f1f77bcf86cd799439011' // Default project ID
      })
      
      if (response) {
        setSuccessMessage('Database created successfully!')
        setName('')
        await fetchDatabases()
        setTimeout(() => setSuccessMessage(''), 3000)
      }
    } catch (err) {
      setError(err.message || 'Failed to create database')
    } finally {
      setCreating(false)
    }
  }

  const handleDeleteDatabase = async (id) => {
    if (!confirm('Are you sure you want to delete this database?')) return
    
    try {
      setError('')
      await apiClient.deleteDatabase(id)
      setSuccessMessage('Database deleted successfully!')
      await fetchDatabases()
      setTimeout(() => setSuccessMessage(''), 3000)
    } catch (err) {
      setError(err.message || 'Failed to delete database')
    }
  }

  const dbConfig = {
    postgresql: {
      icon: "🐘",
      color: "bg-blue-500",
      features: ["ACID compliance", "JSON support", "PostGIS"],
    },
    redis: {
      icon: "⚡",
      color: "bg-red-500",
      features: ["In-memory cache", "Real-time sync", "Pub/Sub"],
    },
    mongodb: {
      icon: "🍃",
      color: "bg-green-500",
      features: ["Document DB", "Flexible schema", "Aggregation"],
    },
    mysql: {
      icon: "🐬",
      color: "bg-blue-600",
      features: ["Relational DB", "InnoDB support", "Full-text search"],
    },
    mariadb: {
      icon: "🐬",
      color: "bg-blue-700",
      features: ["MySQL compatible", "High performance", "Open source"],
    },
  }

  const sizeConfig = {
    micro: "0.5 GB RAM, 1 vCPU",
    small: "2 GB RAM, 2 vCPU",
    medium: "8 GB RAM, 4 vCPU",
    large: "32 GB RAM, 8 vCPU",
    xlarge: "64 GB RAM, 16 vCPU",
  }

  async function copy(val) {
    try {
      await navigator.clipboard.writeText(val)
      alert("Connection string copied to clipboard!")
    } catch (err) {
      console.error("Failed to copy:", err)
    }
  }

  if (loading) {
    return (
      <div className="p-6 flex items-center justify-center min-h-screen">
        <div className="animate-spin"><RefreshCw className="w-8 h-8" /></div>
      </div>
    )
  }

  return (
    <div className="grid gap-6">
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-3xl font-bold mb-2">Databases</h1>
          <p className="text-muted-foreground">Create and manage managed databases</p>
        </div>
        <Link href="/databases/create">
          <Button className="gap-2">
            <Plus className="w-4 h-4" />
            Create Database
          </Button>
        </Link>
      </div>

      {/* Alerts */}
      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {successMessage && (
        <Alert className="border-green-200 bg-green-50">
          <CheckCircle className="h-4 w-4 text-green-600" />
          <AlertDescription className="text-green-800">{successMessage}</AlertDescription>
        </Alert>
      )}

      <Card>
        <CardContent className="p-6">
          <h3 className="font-semibold mb-4">Quick Create Database</h3>
          <div className="grid gap-4 sm:grid-cols-6">
            <div>
              <label className="text-sm font-medium">Name</label>
              <input
                className="border rounded-lg px-4 py-2 w-full mt-2 bg-background"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="my-database"
              />
            </div>
            <div>
              <label className="text-sm font-medium">Type</label>
              <select
                className="border rounded-lg px-4 py-2 w-full mt-2 bg-background"
                value={type}
                onChange={(e) => setType(e.target.value)}
              >
                <option value="postgresql">PostgreSQL</option>
                <option value="redis">Redis</option>
                <option value="mongodb">MongoDB</option>
                <option value="mysql">MySQL</option>
                <option value="mariadb">MariaDB</option>
              </select>
            </div>
            <div>
              <label className="text-sm font-medium">Size</label>
              <select
                className="border rounded-lg px-4 py-2 w-full mt-2 bg-background"
                value={size}
                onChange={(e) => setSize(e.target.value)}
              >
                <option value="micro">Micro</option>
                <option value="small">Small</option>
                <option value="medium">Medium</option>
                <option value="large">Large</option>
                <option value="xlarge">XLarge</option>
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
              <Button onClick={handleCreateDatabase} disabled={creating || !name.trim()} className="w-full">
                {creating ? "Creating..." : "Create"}
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
            const config = dbConfig[d.type] || dbConfig.postgresql
            return (
              <Card key={d._id} className="hover:shadow-md transition-shadow">
                <CardContent className="p-6">
                  <div className="grid gap-4">
                    <div className="flex items-start justify-between">
                      <div className="flex items-start gap-3">
                        <div className={`p-3 ${config.color} rounded text-white text-lg`}>{config.icon}</div>
                        <div className="min-w-0">
                          <div className="font-semibold text-lg">{d.name || d.displayName}</div>
                          <div className="text-sm text-muted-foreground mt-1 capitalize">
                            {d.type} • {d.size} • {d.region}
                          </div>
                          <div className="text-xs text-muted-foreground mt-1 flex items-center gap-2">
                            <HardDrive className="w-3 h-3" />
                            {sizeConfig[d.size] || 'Unknown size'}
                          </div>
                          <div className="text-xs text-muted-foreground mt-1">
                            Status: <span className={`font-medium ${d.status === 'running' ? 'text-green-600' : d.status === 'creating' ? 'text-yellow-600' : 'text-red-600'}`}>
                              {d.status}
                            </span>
                          </div>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <Link href={`/databases/${d._id}`}>
                          <Button variant="outline" size="sm" className="gap-1 bg-transparent">
                            <Settings className="w-4 h-4" />
                          </Button>
                        </Link>
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          className="text-destructive hover:bg-destructive/10"
                          onClick={() => handleDeleteDatabase(d._id)}
                        >
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

                    {d.connectionString && (
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
                    )}

                    <div className="flex gap-2 pt-2 flex-wrap">
                      <Link href={`/databases/backup?db=${d._id}`}>
                        <Button variant="outline" size="sm" className="gap-1 bg-transparent">
                          <Download className="w-4 h-4" />
                          Backup
                        </Button>
                      </Link>
                      <Link href={`/databases/${d._id}/users`}>
                        <Button variant="outline" size="sm" className="gap-1 bg-transparent">
                          <Users className="w-4 h-4" />
                          Users
                        </Button>
                      </Link>
                      <Link href={`/databases/monitoring?db=${d._id}`}>
                        <Button variant="outline" size="sm" className="gap-1 bg-transparent">
                          <RefreshCw className="w-4 h-4" />
                          Monitor
                        </Button>
                      </Link>
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
