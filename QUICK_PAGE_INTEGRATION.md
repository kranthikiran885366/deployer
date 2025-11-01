# Quick Template Page Integration Guide

This guide shows you how to quickly integrate the remaining 4 template pages with the backend in **under 30 minutes**.

## Template Pages to Integrate

1. ✅ **Analytics Page** - Metrics & Alerts Dashboard
2. ✅ **Databases Page** - Database Management
3. ✅ **API Tokens Page** - Token Management
4. ✅ **Settings Page** - General Settings

---

## 1. Analytics Page

**File:** `app/(app)/analytics/page.jsx`

**Integration Steps:**

```javascript
'use client'

import { useEffect, useState } from 'react'
import apiClient from '@/lib/api-client'
import { useToast } from '@/hooks/use-toast'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts'
import { Skeleton } from '@/components/ui/skeleton'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'

export default function AnalyticsPage() {
  const { toast } = useToast()
  const [metrics, setMetrics] = useState([])
  const [alerts, setAlerts] = useState([])
  const [dashboard, setDashboard] = useState(null)
  const [loading, setLoading] = useState(true)
  const [timeRange, setTimeRange] = useState('7')

  useEffect(() => {
    fetchAnalytics()
  }, [timeRange])

  const fetchAnalytics = async () => {
    setLoading(true)
    try {
      const [metricsData, alertsData, dashboardData] = await Promise.all([
        apiClient.request(`/analytics/metrics?timeRange=${timeRange}`),
        apiClient.request('/analytics/alerts'),
        apiClient.request(`/analytics/dashboard`),
      ])
      setMetrics(metricsData || [])
      setAlerts(alertsData || [])
      setDashboard(dashboardData || {})
    } catch (error) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' })
    } finally {
      setLoading(false)
    }
  }

  const handleDeleteAlert = async (alertId) => {
    if (!confirm('Delete this alert?')) return
    try {
      await apiClient.request(`/analytics/alerts/${alertId}`, { method: 'DELETE' })
      setAlerts(alerts.filter(a => a._id !== alertId))
      toast({ title: 'Success', description: 'Alert deleted' })
    } catch (error) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' })
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Analytics Dashboard</h1>
        <Select value={timeRange} onValueChange={setTimeRange}>
          <SelectTrigger className="w-40">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="1">Last 24 Hours</SelectItem>
            <SelectItem value="7">Last 7 Days</SelectItem>
            <SelectItem value="30">Last 30 Days</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {loading ? (
        <div className="space-y-4">
          <Skeleton className="h-32 w-full" />
          <Skeleton className="h-64 w-full" />
        </div>
      ) : (
        <>
          {/* Key Metrics */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Total Deployments</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{dashboard.deploymentCount || 0}</div>
                <p className="text-xs text-gray-500">+{dashboard.deploymentTrend || 0}% this period</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Success Rate</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{dashboard.successRate || 0}%</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Avg Build Time</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{dashboard.avgBuildTime || 0}s</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Active Functions</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{dashboard.activeFunctions || 0}</div>
              </CardContent>
            </Card>
          </div>

          {/* Metrics Chart */}
          <Card>
            <CardHeader>
              <CardTitle>Metrics Over Time</CardTitle>
            </CardHeader>
            <CardContent>
              {metrics.length > 0 ? (
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={metrics}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="timestamp" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Line type="monotone" dataKey="value" stroke="#8884d8" />
                  </LineChart>
                </ResponsiveContainer>
              ) : (
                <p className="text-gray-500">No metrics data available</p>
              )}
            </CardContent>
          </Card>

          {/* Alerts */}
          <Card>
            <CardHeader>
              <CardTitle>Active Alerts ({alerts.length})</CardTitle>
            </CardHeader>
            <CardContent>
              {alerts.length === 0 ? (
                <p className="text-gray-500">No alerts configured</p>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Alert Name</TableHead>
                      <TableHead>Metric</TableHead>
                      <TableHead>Threshold</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {alerts.map((alert) => (
                      <TableRow key={alert._id}>
                        <TableCell className="font-medium">{alert.name}</TableCell>
                        <TableCell>{alert.metricType}</TableCell>
                        <TableCell>{alert.threshold}</TableCell>
                        <TableCell>
                          <Badge variant={alert.active ? 'default' : 'secondary'}>
                            {alert.active ? 'Active' : 'Inactive'}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDeleteAlert(alert._id)}
                            className="text-red-600"
                          >
                            Delete
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </>
      )}
    </div>
  )
}
```

**Time to integrate:** 5 minutes

---

## 2. Databases Page

**File:** `app/(app)/databases/page.jsx`

```javascript
'use client'

import { useEffect, useState } from 'react'
import apiClient from '@/lib/api-client'
import { useToast } from '@/hooks/use-toast'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'

const DB_TYPES = [
  { value: 'postgres', label: 'PostgreSQL' },
  { value: 'mysql', label: 'MySQL' },
  { value: 'mongodb', label: 'MongoDB' },
  { value: 'redis', label: 'Redis' },
]

export default function DatabasesPage() {
  const { toast } = useToast()
  const [databases, setDatabases] = useState([])
  const [loading, setLoading] = useState(true)
  const [open, setOpen] = useState(false)
  const [formData, setFormData] = useState({
    name: '',
    type: 'postgres',
    host: '',
    port: '',
    username: '',
  })

  useEffect(() => {
    fetchDatabases()
  }, [])

  const fetchDatabases = async () => {
    try {
      const data = await apiClient.request('/databases')
      setDatabases(data || [])
    } catch (error) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' })
    } finally {
      setLoading(false)
    }
  }

  const handleCreate = async (e) => {
    e.preventDefault()
    try {
      const newDb = await apiClient.request('/databases', {
        method: 'POST',
        body: JSON.stringify(formData),
      })
      setDatabases([...databases, newDb])
      setFormData({ name: '', type: 'postgres', host: '', port: '', username: '' })
      setOpen(false)
      toast({ title: 'Success', description: 'Database added' })
    } catch (error) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' })
    }
  }

  const handleDelete = async (id) => {
    if (!confirm('Delete this database?')) return
    try {
      await apiClient.request(`/databases/${id}`, { method: 'DELETE' })
      setDatabases(databases.filter(d => d._id !== id))
      toast({ title: 'Success', description: 'Database deleted' })
    } catch (error) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' })
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Databases</h1>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button className="bg-blue-600 hover:bg-blue-700">Add Database</Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[500px]">
            <DialogHeader>
              <DialogTitle>Connect New Database</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleCreate} className="space-y-4">
              <div>
                <Label>Database Name</Label>
                <Input
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="My Database"
                />
              </div>
              <div>
                <Label>Type</Label>
                <Select value={formData.type} onValueChange={(v) => setFormData({ ...formData, type: v })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {DB_TYPES.map((t) => (
                      <SelectItem key={t.value} value={t.value}>
                        {t.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Host</Label>
                <Input
                  value={formData.host}
                  onChange={(e) => setFormData({ ...formData, host: e.target.value })}
                  placeholder="localhost"
                />
              </div>
              <div>
                <Label>Port</Label>
                <Input
                  value={formData.port}
                  onChange={(e) => setFormData({ ...formData, port: e.target.value })}
                  placeholder="5432"
                />
              </div>
              <Button type="submit" className="w-full">Connect Database</Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Connected Databases</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <p>Loading...</p>
          ) : databases.length === 0 ? (
            <p className="text-gray-500">No databases connected</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Host</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {databases.map((db) => (
                  <TableRow key={db._id}>
                    <TableCell className="font-medium">{db.name}</TableCell>
                    <TableCell>
                      <Badge>{db.type}</Badge>
                    </TableCell>
                    <TableCell>{db.host}</TableCell>
                    <TableCell>
                      <Badge variant="outline">Connected</Badge>
                    </TableCell>
                    <TableCell>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDelete(db._id)}
                        className="text-red-600"
                      >
                        Delete
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
```

**Time to integrate:** 5 minutes

---

## 3. API Tokens Page

**File:** `app/(app)/developer/api-tokens/page.jsx`

```javascript
'use client'

import { useEffect, useState } from 'react'
import apiClient from '@/lib/api-client'
import { useToast } from '@/hooks/use-toast'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Badge } from '@/components/ui/badge'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Copy, Eye, EyeOff } from 'lucide-react'

export default function ApiTokensPage() {
  const { toast } = useToast()
  const [tokens, setTokens] = useState([])
  const [loading, setLoading] = useState(true)
  const [open, setOpen] = useState(false)
  const [tokenName, setTokenName] = useState('')
  const [newToken, setNewToken] = useState(null)
  const [showSecret, setShowSecret] = useState(false)

  useEffect(() => {
    fetchTokens()
  }, [])

  const fetchTokens = async () => {
    try {
      const data = await apiClient.request('/api-tokens')
      setTokens(data || [])
    } catch (error) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' })
    } finally {
      setLoading(false)
    }
  }

  const handleCreateToken = async (e) => {
    e.preventDefault()
    if (!tokenName.trim()) {
      toast({ title: 'Error', description: 'Token name required', variant: 'destructive' })
      return
    }

    try {
      const token = await apiClient.request('/api-tokens', {
        method: 'POST',
        body: JSON.stringify({ name: tokenName }),
      })
      setNewToken(token.secret)
      setTokens([...tokens, { ...token, secret: '****' }])
      setTokenName('')
      setOpen(true)
      toast({ title: 'Success', description: 'Token created' })
    } catch (error) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' })
    }
  }

  const handleRevokeToken = async (id) => {
    if (!confirm('Revoke this token?')) return
    try {
      await apiClient.request(`/api-tokens/${id}`, { method: 'DELETE' })
      setTokens(tokens.filter(t => t._id !== id))
      toast({ title: 'Success', description: 'Token revoked' })
    } catch (error) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' })
    }
  }

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text)
    toast({ title: 'Copied to clipboard' })
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">API Tokens</h1>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button className="bg-blue-600 hover:bg-blue-700">Generate Token</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create New API Token</DialogTitle>
            </DialogHeader>
            {newToken ? (
              <div className="space-y-4">
                <p className="text-sm text-gray-600">Your API token has been created. Save it in a secure place.</p>
                <div className="bg-gray-100 p-4 rounded font-mono text-sm break-all cursor-pointer" onClick={() => copyToClipboard(newToken)}>
                  {showSecret ? newToken : '••••••••••••'}
                </div>
                <Button onClick={() => copyToClipboard(newToken)} className="w-full">
                  <Copy className="mr-2 h-4 w-4" /> Copy Token
                </Button>
              </div>
            ) : (
              <form onSubmit={handleCreateToken} className="space-y-4">
                <div>
                  <Label>Token Name</Label>
                  <Input
                    value={tokenName}
                    onChange={(e) => setTokenName(e.target.value)}
                    placeholder="My API Token"
                  />
                </div>
                <Button type="submit" className="w-full">Create Token</Button>
              </form>
            )}
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Active Tokens</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <p>Loading...</p>
          ) : tokens.length === 0 ? (
            <p className="text-gray-500">No tokens yet</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Token</TableHead>
                  <TableHead>Created</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {tokens.map((token) => (
                  <TableRow key={token._id}>
                    <TableCell className="font-medium">{token.name}</TableCell>
                    <TableCell className="font-mono text-sm">{token.prefix}...</TableCell>
                    <TableCell className="text-sm">
                      {new Date(token.createdAt).toLocaleDateString()}
                    </TableCell>
                    <TableCell>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleRevokeToken(token._id)}
                        className="text-red-600"
                      >
                        Revoke
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
```

**Time to integrate:** 5 minutes

---

## 4. Settings Page

**File:** `app/(app)/settings/page.jsx`

```javascript
'use client'

import { useEffect, useState } from 'react'
import apiClient from '@/lib/api-client'
import { useToast } from '@/hooks/use-toast'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Switch } from '@/components/ui/switch'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'

export default function SettingsPage() {
  const { toast } = useToast()
  const [envVars, setEnvVars] = useState([])
  const [domains, setDomains] = useState([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('env-vars')
  const [envName, setEnvName] = useState('')
  const [envValue, setEnvValue] = useState('')
  const [isSecret, setIsSecret] = useState(false)
  const [domain, setDomain] = useState('')
  const [ssl, setSSL] = useState(true)

  useEffect(() => {
    fetchSettings()
  }, [activeTab])

  const fetchSettings = async () => {
    setLoading(true)
    try {
      if (activeTab === 'env-vars') {
        const data = await apiClient.request('/settings/env-vars')
        setEnvVars(data || [])
      } else if (activeTab === 'domains') {
        const data = await apiClient.request('/settings/domains')
        setDomains(data || [])
      }
    } catch (error) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' })
    } finally {
      setLoading(false)
    }
  }

  const handleCreateEnvVar = async (e) => {
    e.preventDefault()
    try {
      const newVar = await apiClient.request('/settings/env-vars', {
        method: 'POST',
        body: JSON.stringify({ key: envName, value: envValue, isSecret }),
      })
      setEnvVars([...envVars, newVar])
      setEnvName('')
      setEnvValue('')
      setIsSecret(false)
      toast({ title: 'Success', description: 'Environment variable added' })
    } catch (error) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' })
    }
  }

  const handleDeleteEnvVar = async (id) => {
    try {
      await apiClient.request(`/settings/env-vars/${id}`, { method: 'DELETE' })
      setEnvVars(envVars.filter(v => v._id !== id))
      toast({ title: 'Success', description: 'Variable deleted' })
    } catch (error) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' })
    }
  }

  const handleAddDomain = async (e) => {
    e.preventDefault()
    try {
      const newDomain = await apiClient.request('/settings/domains', {
        method: 'POST',
        body: JSON.stringify({ host: domain, ssl }),
      })
      setDomains([...domains, newDomain])
      setDomain('')
      setSSL(true)
      toast({ title: 'Success', description: 'Domain added' })
    } catch (error) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' })
    }
  }

  const handleDeleteDomain = async (id) => {
    try {
      await apiClient.request(`/settings/domains/${id}`, { method: 'DELETE' })
      setDomains(domains.filter(d => d._id !== id))
      toast({ title: 'Success', description: 'Domain deleted' })
    } catch (error) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' })
    }
  }

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">Settings</h1>

      <div className="flex space-x-4 border-b">
        <button
          onClick={() => setActiveTab('env-vars')}
          className={`px-4 py-2 ${activeTab === 'env-vars' ? 'border-b-2 border-blue-500 text-blue-600' : 'text-gray-600'}`}
        >
          Environment Variables
        </button>
        <button
          onClick={() => setActiveTab('domains')}
          className={`px-4 py-2 ${activeTab === 'domains' ? 'border-b-2 border-blue-500 text-blue-600' : 'text-gray-600'}`}
        >
          Domains
        </button>
      </div>

      {activeTab === 'env-vars' && (
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Add Environment Variable</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleCreateEnvVar} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Variable Name</Label>
                    <Input
                      value={envName}
                      onChange={(e) => setEnvName(e.target.value)}
                      placeholder="API_KEY"
                    />
                  </div>
                  <div>
                    <Label>Value</Label>
                    <Input
                      type={isSecret ? 'password' : 'text'}
                      value={envValue}
                      onChange={(e) => setEnvValue(e.target.value)}
                      placeholder="Value"
                    />
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <Switch checked={isSecret} onCheckedChange={setIsSecret} />
                  <Label>Secret (encrypted)</Label>
                </div>
                <Button type="submit">Add Variable</Button>
              </form>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Environment Variables</CardTitle>
            </CardHeader>
            <CardContent>
              {envVars.length === 0 ? (
                <p className="text-gray-500">No variables</p>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead>Value</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {envVars.map((v) => (
                      <TableRow key={v._id}>
                        <TableCell className="font-medium">{v.key}</TableCell>
                        <TableCell className="font-mono text-sm">{v.isSecret ? '***' : v.value}</TableCell>
                        <TableCell>
                          <Badge variant={v.isSecret ? 'destructive' : 'default'}>
                            {v.isSecret ? 'Secret' : 'Public'}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDeleteEnvVar(v._id)}
                            className="text-red-600"
                          >
                            Delete
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </div>
      )}

      {activeTab === 'domains' && (
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Add Domain</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleAddDomain} className="space-y-4">
                <div>
                  <Label>Domain</Label>
                  <Input
                    value={domain}
                    onChange={(e) => setDomain(e.target.value)}
                    placeholder="example.com"
                  />
                </div>
                <div className="flex items-center space-x-2">
                  <Switch checked={ssl} onCheckedChange={setSSL} />
                  <Label>Enable SSL</Label>
                </div>
                <Button type="submit">Add Domain</Button>
              </form>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Connected Domains</CardTitle>
            </CardHeader>
            <CardContent>
              {domains.length === 0 ? (
                <p className="text-gray-500">No domains</p>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Domain</TableHead>
                      <TableHead>SSL</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {domains.map((d) => (
                      <TableRow key={d._id}>
                        <TableCell className="font-medium">{d.host}</TableCell>
                        <TableCell>
                          <Badge variant={d.ssl ? 'default' : 'secondary'}>
                            {d.ssl ? 'Enabled' : 'Disabled'}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline">Verified</Badge>
                        </TableCell>
                        <TableCell>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDeleteDomain(d._id)}
                            className="text-red-600"
                          >
                            Delete
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  )
}
```

**Time to integrate:** 8 minutes

---

## Quick Integration Summary

| Page | Status | Time |
|------|--------|------|
| Analytics | 📝 → ✅ | 5 min |
| Databases | 📝 → ✅ | 5 min |
| API Tokens | 📝 → ✅ | 5 min |
| Settings | 📝 → ✅ | 8 min |
| **Total** | | **23 min** |

---

## Final Status After Integration

```
Frontend Pages:
✅ Builds - Complete
✅ Functions - Complete
✅ Security - Complete
✅ Team - Complete
✅ Analytics - Complete (after adding above)
✅ Databases - Complete (after adding above)
✅ API Tokens - Complete (after adding above)
✅ Settings - Complete (after adding above)

= 100% Frontend Ready ✅
```

---

## Testing Checklist

After integrating pages, test:

- [ ] Load each page without errors
- [ ] Data fetches and displays correctly
- [ ] Create operations work
- [ ] Update operations work
- [ ] Delete operations work
- [ ] Error handling shows toasts
- [ ] Loading states display
- [ ] No console errors

---

## Deployment Ready? ✅

Once all pages are integrated and tested:

1. Run `npm run build`
2. Test build locally
3. Deploy to staging
4. Test all features in staging
5. Deploy to production

**Estimated Total Time to Production:** 1-2 weeks

---

**Happy Integration!** 🚀
