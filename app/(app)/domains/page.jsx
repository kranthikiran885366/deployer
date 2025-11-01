"use client"

import { useState } from "react"
import { useAppStore } from "@/store/use-app-store"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Globe, Copy, CheckCircle2, AlertCircle, Trash2, RefreshCw, Shield } from "lucide-react"

export default function DomainsPage() {
  const { domains, addDomain, verifyDomain, deleteDomain } = useAppStore()
  const [host, setHost] = useState("")
  const [loading, setLoading] = useState(false)

  async function add() {
    if (!host.trim()) return
    setLoading(true)
    try {
      addDomain(host)
      setHost("")
    } finally {
      setLoading(false)
    }
  }

  async function copy(val) {
    try {
      await navigator.clipboard.writeText(val)
      alert("Copied to clipboard!")
    } catch (err) {
      console.error("Copy failed:", err)
    }
  }

  const statusConfig = {
    verified: { icon: CheckCircle2, color: "text-green-500", bg: "bg-green-500/10", label: "Verified" },
    pending: { icon: AlertCircle, color: "text-yellow-500", bg: "bg-yellow-500/10", label: "Pending" },
    failed: { icon: AlertCircle, color: "text-red-500", bg: "bg-red-500/10", label: "Failed" },
  }

  return (
    <div className="grid gap-6">
      <div>
        <h1 className="text-3xl font-bold mb-2">Custom Domains</h1>
        <p className="text-muted-foreground">Manage your domain and DNS configurations</p>
      </div>

      <Card>
        <CardContent className="p-6">
          <h3 className="font-semibold mb-4">Add Domain</h3>
          <div className="flex gap-2">
            <input
              className="border rounded-lg px-4 py-2 flex-1 bg-background"
              value={host}
              onChange={(e) => setHost(e.target.value)}
              placeholder="example.com"
            />
            <Button onClick={add} disabled={loading}>
              {loading ? "Adding..." : "Add"}
            </Button>
          </div>
          <p className="text-xs text-muted-foreground mt-3">
            Enter your domain name to get started with DNS configuration
          </p>
        </CardContent>
      </Card>

      <div className="grid gap-4">
        {domains.length === 0 ? (
          <Card>
            <CardContent className="p-12 text-center text-muted-foreground">
              <Globe className="w-12 h-12 mx-auto mb-4 opacity-20" />
              <p>No domains configured</p>
              <p className="text-sm mt-2">Add your domain to enable HTTPS and custom branding</p>
            </CardContent>
          </Card>
        ) : (
          domains.map((d) => {
            const config = statusConfig[d.status]
            const StatusIcon = config.icon
            return (
              <Card key={d.id} className="hover:shadow-md transition-shadow">
                <CardContent className="p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-start gap-3">
                      <div className={`p-3 ${config.bg} rounded`}>
                        <Globe className={`w-5 h-5 ${config.color}`} />
                      </div>
                      <div className="min-w-0">
                        <h3 className="font-semibold">{d.host}</h3>
                        <div className="flex items-center gap-2 mt-1">
                          <StatusIcon className={`w-4 h-4 ${config.color}`} />
                          <span className={`text-xs font-medium ${config.color}`}>{config.label}</span>
                        </div>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      {d.status !== "verified" && (
                        <Button variant="outline" size="sm" onClick={() => verifyDomain(d.id)} className="gap-1">
                          <RefreshCw className="w-4 h-4" />
                          Verify
                        </Button>
                      )}
                      <Button variant="destructive" size="sm" onClick={() => deleteDomain(d.id)}>
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>

                  <div className="bg-muted/50 p-4 rounded-lg">
                    <div className="flex items-center gap-2 mb-3">
                      <Shield className="w-4 h-4 text-blue-500" />
                      <h4 className="font-mono text-sm font-semibold">DNS Records</h4>
                    </div>
                    <div className="space-y-2">
                      {d.dnsRecords.map((r, i) => (
                        <div
                          key={i}
                          className="flex items-center justify-between text-xs bg-background p-3 rounded border hover:bg-muted transition"
                        >
                          <div className="font-mono min-w-0">
                            <span className="font-semibold text-primary">{r.type}</span>
                            <span className="text-muted-foreground"> {r.host} →</span>
                            <span className="text-foreground ml-1 break-all">{r.value}</span>
                          </div>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => copy(`${r.type} ${r.host} ${r.value}`)}
                            className="ml-2"
                          >
                            <Copy className="w-4 h-4" />
                          </Button>
                        </div>
                      ))}
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
