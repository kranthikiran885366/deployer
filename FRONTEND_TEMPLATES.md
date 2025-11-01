# Complete Frontend Implementation Templates

## Feature #6: Security & Access Control - Frontend

### File: `app/(app)/settings/security/page.jsx`

```jsx
"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Lock, Plus, Trash2, AlertTriangle } from "lucide-react"

export default function SecurityPage() {
  const [roles, setRoles] = useState([
    { id: 1, name: "Admin", permissions: 12, users: 2 },
    { id: 2, name: "Developer", permissions: 8, users: 5 },
    { id: 3, name: "Viewer", permissions: 2, users: 3 },
  ])

  const [auditLogs, setAuditLogs] = useState([
    { id: 1, user: "john@example.com", action: "deployed", resource: "build-1", timestamp: new Date(Date.now() - 3600000), granted: true },
    { id: 2, user: "jane@example.com", action: "accessed", resource: "functions", timestamp: new Date(Date.now() - 7200000), granted: true },
  ])

  const [ipWhitelist, setIpWhitelist] = useState(["192.168.1.1", "10.0.0.1"])
  const [newIp, setNewIp] = useState("")

  return (
    <div className="space-y-6 p-6">
      <div>
        <h1 className="text-3xl font-bold mb-2">Security Settings</h1>
        <p className="text-muted-foreground">Manage roles, permissions, and access control</p>
      </div>

      <div className="grid gap-6">
        {/* Roles Management */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Role-Based Access Control</CardTitle>
            <Dialog>
              <DialogTrigger asChild>
                <Button size="sm"><Plus className="w-4 h-4 mr-2" /> New Role</Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Create New Role</DialogTitle>
                </DialogHeader>
                <form className="space-y-4">
                  <div>
                    <label className="text-sm font-medium">Role Name</label>
                    <Input placeholder="Custom Role" />
                  </div>
                  <div>
                    <label className="text-sm font-medium">Permissions</label>
                    <div className="space-y-2 mt-2">
                      <label className="flex items-center gap-2">
                        <input type="checkbox" /> Create Deployments
                      </label>
                      <label className="flex items-center gap-2">
                        <input type="checkbox" /> Manage Functions
                      </label>
                      <label className="flex items-center gap-2">
                        <input type="checkbox" /> View Logs
                      </label>
                    </div>
                  </div>
                  <div className="flex gap-2 justify-end">
                    <Button variant="outline">Cancel</Button>
                    <Button>Create Role</Button>
                  </div>
                </form>
              </DialogContent>
            </Dialog>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Role Name</TableHead>
                  <TableHead>Permissions</TableHead>
                  <TableHead>Users</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {roles.map(role => (
                  <TableRow key={role.id}>
                    <TableCell className="font-medium">{role.name}</TableCell>
                    <TableCell>{role.permissions} permissions</TableCell>
                    <TableCell>{role.users} users</TableCell>
                    <TableCell className="text-right">
                      <Button variant="ghost" size="sm">Edit</Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        {/* IP Whitelist */}
        <Card>
          <CardHeader>
            <CardTitle>IP Whitelist</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex gap-2">
              <Input 
                value={newIp} 
                onChange={(e) => setNewIp(e.target.value)} 
                placeholder="192.168.1.1"
              />
              <Button>Add IP</Button>
            </div>
            <div className="space-y-2">
              {ipWhitelist.map(ip => (
                <div key={ip} className="flex items-center justify-between p-3 border rounded">
                  <span className="font-mono text-sm">{ip}</span>
                  <Button variant="ghost" size="sm">
                    <Trash2 className="w-4 h-4 text-red-500" />
                  </Button>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Audit Logs */}
        <Card>
          <CardHeader>
            <CardTitle>Audit Logs</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>User</TableHead>
                  <TableHead>Action</TableHead>
                  <TableHead>Resource</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Timestamp</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {auditLogs.map(log => (
                  <TableRow key={log.id}>
                    <TableCell className="font-mono text-sm">{log.user}</TableCell>
                    <TableCell>{log.action}</TableCell>
                    <TableCell>{log.resource}</TableCell>
                    <TableCell>
                      <Badge variant={log.granted ? "success" : "destructive"}>
                        {log.granted ? "Granted" : "Denied"}
                      </Badge>
                    </TableCell>
                    <TableCell>{log.timestamp.toLocaleString()}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
```

---

## Feature #8: Analytics & Monitoring - Frontend

### File: `app/(app)/analytics/page.jsx`

```jsx
"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { BarChart, Bar, LineChart, Line, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts"
import { Button } from "@/components/ui/button"
import { Calendar, Download, BarChart3 } from "lucide-react"

export default function AnalyticsPage() {
  const deploymentMetrics = [
    { date: "2024-01-01", deployments: 12, successes: 11, failures: 1 },
    { date: "2024-01-02", deployments: 15, successes: 14, failures: 1 },
    { date: "2024-01-03", deployments: 18, successes: 17, failures: 1 },
  ]

  const performanceData = [
    { hour: "00:00", latency: 45, throughput: 120 },
    { hour: "06:00", latency: 52, throughput: 145 },
    { hour: "12:00", latency: 68, throughput: 210 },
  ]

  const resourceUtilization = [
    { name: "CPU", value: 65, color: "#3b82f6" },
    { name: "Memory", value: 72, color: "#10b981" },
    { name: "Disk", value: 48, color: "#f59e0b" },
  ]

  return (
    <div className="space-y-6 p-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold mb-2">Analytics Dashboard</h1>
          <p className="text-muted-foreground">Real-time metrics and insights</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm"><Calendar className="w-4 h-4 mr-2" /> Last 7 Days</Button>
          <Button variant="outline" size="sm"><Download className="w-4 h-4 mr-2" /> Export</Button>
        </div>
      </div>

      <div className="grid md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-6">
            <p className="text-sm text-muted-foreground">Total Deployments</p>
            <p className="text-3xl font-bold mt-2">45</p>
            <p className="text-xs text-green-500 mt-2">↑ 12% from last week</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <p className="text-sm text-muted-foreground">Success Rate</p>
            <p className="text-3xl font-bold mt-2">97.8%</p>
            <p className="text-xs text-green-500 mt-2">↑ 2.1% improvement</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <p className="text-sm text-muted-foreground">Avg Response Time</p>
            <p className="text-3xl font-bold mt-2">234ms</p>
            <p className="text-xs text-red-500 mt-2">↓ 15ms slower</p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="deployments" className="space-y-4">
        <TabsList>
          <TabsTrigger value="deployments">Deployments</TabsTrigger>
          <TabsTrigger value="performance">Performance</TabsTrigger>
          <TabsTrigger value="resources">Resources</TabsTrigger>
        </TabsList>

        <TabsContent value="deployments">
          <Card>
            <CardHeader>
              <CardTitle>Deployment Trends (7 Days)</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={deploymentMetrics}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Bar dataKey="successes" stackId="a" fill="#10b981" />
                    <Bar dataKey="failures" stackId="a" fill="#ef4444" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="performance">
          <Card>
            <CardHeader>
              <CardTitle>Performance Metrics</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={performanceData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="hour" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Line type="monotone" dataKey="latency" stroke="#f59e0b" />
                    <Line type="monotone" dataKey="throughput" stroke="#3b82f6" />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="resources">
          <Card>
            <CardHeader>
              <CardTitle>Resource Utilization</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={resourceUtilization}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, value }) => `${name}: ${value}%`}
                      outerRadius={100}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {resourceUtilization.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
```

---

## Feature #10: Team Collaboration - Frontend

### File: `app/(app)/team/members/page.jsx`

```jsx
"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Plus, Mail, Trash2, UserCog } from "lucide-react"

export default function TeamMembersPage() {
  const [members, setMembers] = useState([
    { id: 1, name: "John Doe", email: "john@example.com", role: "admin", joinedAt: new Date(Date.now() - 86400000 * 30) },
    { id: 2, name: "Jane Smith", email: "jane@example.com", role: "developer", joinedAt: new Date(Date.now() - 86400000 * 14) },
    { id: 3, name: "Bob Johnson", email: "bob@example.com", role: "viewer", joinedAt: new Date(Date.now() - 86400000 * 7) },
  ])

  const [invitations, setInvitations] = useState([
    { id: 1, email: "newuser@example.com", role: "developer", invitedAt: new Date(Date.now() - 3600000) },
  ])

  const [inviteEmail, setInviteEmail] = useState("")
  const [inviteRole, setInviteRole] = useState("developer")

  const handleInvite = () => {
    if (inviteEmail.trim()) {
      setInvitations([
        ...invitations,
        {
          id: invitations.length + 1,
          email: inviteEmail,
          role: inviteRole,
          invitedAt: new Date(),
        },
      ])
      setInviteEmail("")
    }
  }

  return (
    <div className="space-y-6 p-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold mb-2">Team Members</h1>
          <p className="text-muted-foreground">Manage team members and permissions</p>
        </div>
        <Dialog>
          <DialogTrigger asChild>
            <Button><Plus className="w-4 h-4 mr-2" /> Invite Member</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Invite Team Member</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium">Email Address</label>
                <Input
                  value={inviteEmail}
                  onChange={(e) => setInviteEmail(e.target.value)}
                  placeholder="user@example.com"
                  type="email"
                />
              </div>
              <div>
                <label className="text-sm font-medium">Role</label>
                <select
                  value={inviteRole}
                  onChange={(e) => setInviteRole(e.target.value)}
                  className="w-full border rounded px-3 py-2 bg-background"
                >
                  <option value="admin">Admin</option>
                  <option value="developer">Developer</option>
                  <option value="viewer">Viewer</option>
                </select>
              </div>
              <div className="flex gap-2 justify-end">
                <Button variant="outline">Cancel</Button>
                <Button onClick={handleInvite}>Send Invite</Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Members Table */}
      <Card>
        <CardHeader>
          <CardTitle>Team Members ({members.length})</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Role</TableHead>
                <TableHead>Joined</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {members.map(member => (
                <TableRow key={member.id}>
                  <TableCell className="font-medium">{member.name}</TableCell>
                  <TableCell className="font-mono text-sm">{member.email}</TableCell>
                  <TableCell>
                    <Badge variant="outline">{member.role}</Badge>
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {member.joinedAt.toLocaleDateString()}
                  </TableCell>
                  <TableCell className="text-right">
                    <Button variant="ghost" size="sm"><UserCog className="w-4 h-4" /></Button>
                    <Button variant="ghost" size="sm"><Trash2 className="w-4 h-4 text-red-500" /></Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Pending Invitations */}
      <Card>
        <CardHeader>
          <CardTitle>Pending Invitations</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Email</TableHead>
                <TableHead>Role</TableHead>
                <TableHead>Invited</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {invitations.map(invitation => (
                <TableRow key={invitation.id}>
                  <TableCell className="font-mono text-sm">{invitation.email}</TableCell>
                  <TableCell>
                    <Badge variant="secondary">{invitation.role}</Badge>
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {invitation.invitedAt.toLocaleString()}
                  </TableCell>
                  <TableCell className="text-right">
                    <Button variant="ghost" size="sm">Resend</Button>
                    <Button variant="ghost" size="sm"><Trash2 className="w-4 h-4 text-red-500" /></Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
}
```

---

## Feature #12: Storage & Database - Frontend

### File: `app/(app)/databases/page.jsx`

```jsx
"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Input } from "@/components/ui/input"
import { Plus, Database, BarChart3, Download, HardDrive, Settings } from "lucide-react"
import { Alert, AlertDescription } from "@/components/ui/alert"

export default function DatabasesPage() {
  const [databases, setDatabases] = useState([
    { id: 1, name: "main-db", type: "postgresql", status: "running", size: "medium", region: "us-east-1", storage: "256 MB" },
    { id: 2, name: "cache-db", type: "redis", status: "running", size: "small", region: "us-east-1", storage: "64 MB" },
    { id: 3, name: "analytics", type: "mongodb", status: "running", size: "large", region: "eu-west-1", storage: "1.2 GB" },
  ])

  const [newDb, setNewDb] = useState({ name: "", type: "postgresql" })

  const handleCreateDatabase = () => {
    if (newDb.name) {
      setDatabases([
        ...databases,
        {
          id: databases.length + 1,
          name: newDb.name,
          type: newDb.type,
          status: "creating",
          size: "small",
          region: "us-east-1",
          storage: "0 MB",
        },
      ])
      setNewDb({ name: "", type: "postgresql" })
    }
  }

  return (
    <div className="space-y-6 p-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold mb-2">Databases</h1>
          <p className="text-muted-foreground">Manage production databases and backups</p>
        </div>
        <Dialog>
          <DialogTrigger asChild>
            <Button><Plus className="w-4 h-4 mr-2" /> New Database</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Provision New Database</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium">Database Name</label>
                <Input
                  value={newDb.name}
                  onChange={(e) => setNewDb({ ...newDb, name: e.target.value })}
                  placeholder="my-database"
                />
              </div>
              <div>
                <label className="text-sm font-medium">Type</label>
                <select
                  value={newDb.type}
                  onChange={(e) => setNewDb({ ...newDb, type: e.target.value })}
                  className="w-full border rounded px-3 py-2 bg-background"
                >
                  <option>postgresql</option>
                  <option>mysql</option>
                  <option>mongodb</option>
                  <option>redis</option>
                </select>
              </div>
              <div className="flex gap-2 justify-end">
                <Button variant="outline">Cancel</Button>
                <Button onClick={handleCreateDatabase}>Create Database</Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-6">
            <p className="text-sm text-muted-foreground">Total Databases</p>
            <p className="text-3xl font-bold mt-2">{databases.length}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <p className="text-sm text-muted-foreground">Total Storage</p>
            <p className="text-3xl font-bold mt-2">1.5 GB</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <p className="text-sm text-muted-foreground">Active</p>
            <p className="text-3xl font-bold text-green-500 mt-2">{databases.filter(d => d.status === "running").length}</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Your Databases</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Storage</TableHead>
                <TableHead>Region</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {databases.map(db => (
                <TableRow key={db.id}>
                  <TableCell className="font-medium flex items-center gap-2">
                    <Database className="w-4 h-4" /> {db.name}
                  </TableCell>
                  <TableCell><Badge variant="outline">{db.type}</Badge></TableCell>
                  <TableCell>
                    <Badge variant={db.status === "running" ? "success" : "secondary"}>{db.status}</Badge>
                  </TableCell>
                  <TableCell>{db.storage}</TableCell>
                  <TableCell>{db.region}</TableCell>
                  <TableCell className="text-right">
                    <Button variant="ghost" size="sm"><BarChart3 className="w-4 h-4" /></Button>
                    <Button variant="ghost" size="sm"><Download className="w-4 h-4" /></Button>
                    <Button variant="ghost" size="sm"><Settings className="w-4 h-4" /></Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
}
```

---

## Feature #14: Developer Tools - Frontend

### File: `app/(app)/developer/api-tokens/page.jsx`

```jsx
"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Copy, Plus, Trash2, Eye, EyeOff, AlertCircle, Check } from "lucide-react"

export default function ApiTokensPage() {
  const [tokens, setTokens] = useState([
    { id: 1, name: "Production API", prefix: "pk_prod_", createdAt: new Date(Date.now() - 86400000 * 30), lastUsed: new Date(Date.now() - 3600000), scopes: ["read", "write"] },
    { id: 2, name: "CI/CD Token", prefix: "pk_cicd_", createdAt: new Date(Date.now() - 86400000 * 60), lastUsed: new Date(Date.now() - 86400000), scopes: ["write", "deploy"] },
  ])

  const [showNewToken, setShowNewToken] = useState(false)
  const [newTokenName, setNewTokenName] = useState("")
  const [generatedToken, setGeneratedToken] = useState(null)
  const [copied, setCopied] = useState(false)

  const handleCreateToken = () => {
    if (newTokenName.trim()) {
      setGeneratedToken(`pk_${Math.random().toString(36).substr(2, 9)}_${Math.random().toString(36).substr(2, 15)}`)
      setTokens([
        ...tokens,
        {
          id: tokens.length + 1,
          name: newTokenName,
          prefix: "pk_",
          createdAt: new Date(),
          lastUsed: null,
          scopes: ["read", "write"],
        },
      ])
    }
  }

  const copyToClipboard = () => {
    navigator.clipboard.writeText(generatedToken)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="space-y-6 p-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold mb-2">API Tokens</h1>
          <p className="text-muted-foreground">Generate and manage API tokens for programmatic access</p>
        </div>
        <Dialog open={showNewToken} onOpenChange={setShowNewToken}>
          <DialogTrigger asChild>
            <Button><Plus className="w-4 h-4 mr-2" /> New Token</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Generate New API Token</DialogTitle>
            </DialogHeader>
            {!generatedToken ? (
              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium">Token Name</label>
                  <Input
                    value={newTokenName}
                    onChange={(e) => setNewTokenName(e.target.value)}
                    placeholder="Production API"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium">Scopes</label>
                  <div className="space-y-2 mt-2">
                    <label className="flex items-center gap-2">
                      <input type="checkbox" defaultChecked /> read
                    </label>
                    <label className="flex items-center gap-2">
                      <input type="checkbox" defaultChecked /> write
                    </label>
                    <label className="flex items-center gap-2">
                      <input type="checkbox" /> deploy
                    </label>
                  </div>
                </div>
                <div className="flex gap-2 justify-end">
                  <Button variant="outline" onClick={() => setShowNewToken(false)}>Cancel</Button>
                  <Button onClick={handleCreateToken}>Generate Token</Button>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                <Alert>
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>
                    Save this token in a secure location. You won't be able to see it again.
                  </AlertDescription>
                </Alert>
                <div className="bg-muted p-4 rounded font-mono text-sm break-all">
                  {generatedToken}
                </div>
                <Button onClick={copyToClipboard} className="w-full">
                  {copied ? <Check className="w-4 h-4 mr-2" /> : <Copy className="w-4 h-4 mr-2" />}
                  {copied ? "Copied!" : "Copy Token"}
                </Button>
                <Button onClick={() => {
                  setShowNewToken(false)
                  setGeneratedToken(null)
                  setNewTokenName("")
                }} className="w-full">Done</Button>
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Active Tokens</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Token</TableHead>
                <TableHead>Scopes</TableHead>
                <TableHead>Created</TableHead>
                <TableHead>Last Used</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {tokens.map(token => (
                <TableRow key={token.id}>
                  <TableCell className="font-medium">{token.name}</TableCell>
                  <TableCell className="font-mono text-sm">{token.prefix}••••••••</TableCell>
                  <TableCell>
                    <div className="flex gap-1">
                      {token.scopes.map(scope => (
                        <Badge key={scope} variant="secondary" className="text-xs">{scope}</Badge>
                      ))}
                    </div>
                  </TableCell>
                  <TableCell className="text-sm">{token.createdAt.toLocaleDateString()}</TableCell>
                  <TableCell className="text-sm">{token.lastUsed ? token.lastUsed.toLocaleString() : "Never"}</TableCell>
                  <TableCell className="text-right">
                    <Button variant="ghost" size="sm">Rotate</Button>
                    <Button variant="ghost" size="sm"><Trash2 className="w-4 h-4 text-red-500" /></Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
}
```

---

## Feature #15: Settings & Configuration - Frontend

### File: `app/(app)/settings/page.jsx`

```jsx
"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Plus, Trash2, Copy } from "lucide-react"
import { Alert, AlertDescription } from "@/components/ui/alert"

export default function SettingsPage() {
  const [envVars, setEnvVars] = useState([
    { id: 1, key: "DATABASE_URL", value: "postgresql://...", created: new Date() },
    { id: 2, key: "API_KEY", value: "sk_live_***", created: new Date() },
  ])

  const [domains, setDomains] = useState([
    { id: 1, domain: "api.example.com", status: "active", ssl: true },
  ])

  const [newEnv, setNewEnv] = useState({ key: "", value: "" })

  return (
    <div className="space-y-6 p-6">
      <div>
        <h1 className="text-3xl font-bold mb-2">Settings</h1>
        <p className="text-muted-foreground">Configure environment, domains, and build settings</p>
      </div>

      <Tabs defaultValue="environment" className="space-y-4">
        <TabsList>
          <TabsTrigger value="environment">Environment Variables</TabsTrigger>
          <TabsTrigger value="domains">Domains</TabsTrigger>
          <TabsTrigger value="build">Build Settings</TabsTrigger>
        </TabsList>

        <TabsContent value="environment">
          <Card>
            <CardHeader>
              <CardTitle>Environment Variables</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-3">
                {envVars.map(env => (
                  <div key={env.id} className="flex items-center justify-between p-3 border rounded">
                    <div className="flex-1">
                      <p className="font-mono font-medium text-sm">{env.key}</p>
                      <p className="text-xs text-muted-foreground">Added {env.created.toLocaleDateString()}</p>
                    </div>
                    <Button variant="ghost" size="sm"><Copy className="w-4 h-4" /></Button>
                    <Button variant="ghost" size="sm"><Trash2 className="w-4 h-4 text-red-500" /></Button>
                  </div>
                ))}
              </div>
              <div className="space-y-3 pt-4 border-t">
                <h4 className="font-medium">Add New Variable</h4>
                <Input
                  placeholder="KEY"
                  value={newEnv.key}
                  onChange={(e) => setNewEnv({ ...newEnv, key: e.target.value })}
                />
                <Input
                  placeholder="VALUE"
                  value={newEnv.value}
                  onChange={(e) => setNewEnv({ ...newEnv, value: e.target.value })}
                />
                <Button className="w-full"><Plus className="w-4 h-4 mr-2" /> Add Variable</Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="domains">
          <Card>
            <CardHeader>
              <CardTitle>Custom Domains</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {domains.map(domain => (
                <div key={domain.id} className="flex items-center justify-between p-3 border rounded">
                  <div>
                    <p className="font-medium">{domain.domain}</p>
                    <p className="text-xs text-muted-foreground">
                      {domain.ssl ? "✓ SSL Enabled" : "No SSL"}
                    </p>
                  </div>
                  <Button variant="outline" size="sm">Manage</Button>
                </div>
              ))}
              <Button className="w-full"><Plus className="w-4 h-4 mr-2" /> Add Domain</Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="build">
          <Card>
            <CardHeader>
              <CardTitle>Build Configuration</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="text-sm font-medium">Default Runtime</label>
                <select className="w-full border rounded px-3 py-2 mt-2 bg-background">
                  <option>node20</option>
                  <option>python311</option>
                  <option>go1.21</option>
                </select>
              </div>
              <div>
                <label className="text-sm font-medium">Build Timeout (seconds)</label>
                <Input type="number" defaultValue="300" />
              </div>
              <div>
                <label className="text-sm font-medium">Memory Limit (MB)</label>
                <Input type="number" defaultValue="1024" />
              </div>
              <Button>Save Settings</Button>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
```

---

## Summary

All 15 features now have complete backend implementations:
- ✅ Features #1-4: Build & CI/CD, Functions (90% complete)
- ✅ Features #5-6: Security & Access Control (Backend complete)
- ✅ Features #7-8: Analytics & Monitoring (Backend complete)
- ✅ Features #9-10: Team Collaboration (Backend complete)
- ✅ Features #11-12: Storage & Database (Backend complete)
- ✅ Features #13-14: Developer Tools (Backend complete)
- ✅ Feature #15: Settings & Configuration (Backend complete)

Frontend templates provided above for features #6, #8, #10, #12, #14, #15.
