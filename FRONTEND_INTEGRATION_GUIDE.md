# Frontend-Backend Integration Implementation Guide

This guide shows how to quickly integrate any frontend page with the backend API.

## Quick Start Template

Here's a minimal template you can use for any page:

```javascript
'use client'

import { useEffect, useState } from 'react'
import apiClient from '@/lib/api-client'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { useToast } from '@/hooks/use-toast'

export default function PageName() {
  const { toast } = useToast()
  const [data, setData] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    setLoading(true)
    try {
      const result = await apiClient.request('/api/endpoint-path')
      setData(result)
    } catch (error) {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">Page Title</h1>
      
      {loading ? (
        <Skeleton className="h-48 w-full" />
      ) : (
        <Card>
          <CardHeader>
            <CardTitle>Content Title</CardTitle>
          </CardHeader>
          <CardContent>
            {/* Render data here */}
          </CardContent>
        </Card>
      )}
    </div>
  )
}
```

## Integration Patterns

### 1. Simple Data Fetching

**Best for:** Display-only pages, read-only data

```javascript
useEffect(() => {
  const fetchData = async () => {
    try {
      const result = await apiClient.request('/api/path')
      setData(result)
    } catch (error) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' })
    } finally {
      setLoading(false)
    }
  }
  fetchData()
}, [])
```

### 2. Create Operations

**Best for:** Forms that create new resources

```javascript
const handleCreate = async (formData) => {
  try {
    const newItem = await apiClient.request('/api/resource', {
      method: 'POST',
      body: JSON.stringify(formData)
    })
    setItems([...items, newItem])
    toast({ title: 'Success', description: 'Created successfully' })
  } catch (error) {
    toast({ title: 'Error', description: error.message, variant: 'destructive' })
  }
}
```

### 3. Update Operations

**Best for:** Edit forms, inline updates

```javascript
const handleUpdate = async (id, updates) => {
  try {
    const updated = await apiClient.request(`/api/resource/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(updates)
    })
    setItems(items.map(i => i._id === id ? updated : i))
    toast({ title: 'Success', description: 'Updated successfully' })
  } catch (error) {
    toast({ title: 'Error', description: error.message, variant: 'destructive' })
  }
}
```

### 4. Delete Operations

**Best for:** Removal with confirmation

```javascript
const handleDelete = async (id) => {
  if (!confirm('Are you sure?')) return
  
  try {
    await apiClient.request(`/api/resource/${id}`, {
      method: 'DELETE'
    })
    setItems(items.filter(i => i._id !== id))
    toast({ title: 'Success', description: 'Deleted successfully' })
  } catch (error) {
    toast({ title: 'Error', description: error.message, variant: 'destructive' })
  }
}
```

### 5. Dependent Data Fetching

**Best for:** Pages with multiple data sources

```javascript
useEffect(() => {
  const fetchAllData = async () => {
    try {
      const [items, stats] = await Promise.all([
        apiClient.request('/api/items'),
        apiClient.request('/api/stats')
      ])
      setItems(items)
      setStats(stats)
    } catch (error) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' })
    } finally {
      setLoading(false)
    }
  }
  fetchAllData()
}, [])
```

### 6. Pagination

**Best for:** Lists with many items

```javascript
useEffect(() => {
  const fetchPaginated = async () => {
    try {
      const result = await apiClient.request(
        `/api/items?limit=${limit}&skip=${skip}`
      )
      setItems(result.items)
      setTotal(result.total)
    } catch (error) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' })
    }
  }
  fetchPaginated()
}, [page])
```

### 7. Search/Filter

**Best for:** Searchable lists

```javascript
const handleSearch = async (query) => {
  setSearchQuery(query)
  try {
    const results = await apiClient.request(
      `/api/items?search=${query}&type=${filter}`
    )
    setItems(results)
  } catch (error) {
    toast({ title: 'Error', description: error.message, variant: 'destructive' })
  }
}
```

### 8. Real-time Updates

**Best for:** Lists that need frequent refresh

```javascript
useEffect(() => {
  fetchData()
  const interval = setInterval(fetchData, 30000) // Refresh every 30 seconds
  return () => clearInterval(interval)
}, [])
```

## Complete Examples

### Analytics Dashboard

```javascript
'use client'

import { useEffect, useState } from 'react'
import apiClient from '@/lib/api-client'
import { useToast } from '@/hooks/use-toast'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend } from 'recharts'
import { Skeleton } from '@/components/ui/skeleton'

export default function AnalyticsPage() {
  const { toast } = useToast()
  const [metrics, setMetrics] = useState([])
  const [dashboard, setDashboard] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchAnalytics()
  }, [])

  const fetchAnalytics = async () => {
    try {
      const [metricsData, dashboardData] = await Promise.all([
        apiClient.request('/analytics/metrics?timeRange=7'),
        apiClient.request('/analytics/dashboard')
      ])
      setMetrics(metricsData)
      setDashboard(dashboardData)
    } catch (error) {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      })
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return <Skeleton className="h-96 w-full" />
  }

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">Analytics Dashboard</h1>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader>
            <CardTitle>Deployments</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{dashboard?.deploymentCount || 0}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Success Rate</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{dashboard?.successRate || 0}%</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Avg Build Time</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{dashboard?.avgBuildTime || 0}s</div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Metrics Over Time</CardTitle>
        </CardHeader>
        <CardContent>
          <LineChart width={800} height={300} data={metrics}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="timestamp" />
            <YAxis />
            <Tooltip />
            <Legend />
            <Line type="monotone" dataKey="value" stroke="#8884d8" />
          </LineChart>
        </CardContent>
      </Card>
    </div>
  )
}
```

### Database Management Page

```javascript
'use client'

import { useEffect, useState } from 'react'
import apiClient from '@/lib/api-client'
import { useToast } from '@/hooks/use-toast'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

export default function DatabasesPage() {
  const { toast } = useToast()
  const [databases, setDatabases] = useState([])
  const [loading, setLoading] = useState(true)
  const [open, setOpen] = useState(false)
  const [formData, setFormData] = useState({ name: '', type: 'postgres' })

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
        body: JSON.stringify(formData)
      })
      setDatabases([...databases, newDb])
      setFormData({ name: '', type: 'postgres' })
      setOpen(false)
      toast({ title: 'Success', description: 'Database created' })
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
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create New Database</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleCreate} className="space-y-4">
              <div>
                <Label>Name</Label>
                <Input
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="Database name"
                />
              </div>
              <Button type="submit" className="w-full">Create</Button>
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
            <p className="text-gray-500">No databases</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {databases.map((db) => (
                  <TableRow key={db._id}>
                    <TableCell>{db.name}</TableCell>
                    <TableCell>{db.type}</TableCell>
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

### API Token Management

```javascript
'use client'

import { useEffect, useState } from 'react'
import apiClient from '@/lib/api-client'
import { useToast } from '@/hooks/use-toast'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

export default function ApiTokensPage() {
  const { toast } = useToast()
  const [tokens, setTokens] = useState([])
  const [loading, setLoading] = useState(true)
  const [tokenName, setTokenName] = useState('')
  const [newToken, setNewToken] = useState(null)

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

  const handleCreateToken = async () => {
    if (!tokenName.trim()) {
      toast({ title: 'Error', description: 'Token name required' })
      return
    }

    try {
      const token = await apiClient.request('/api-tokens', {
        method: 'POST',
        body: JSON.stringify({ name: tokenName })
      })
      setNewToken(token.secret)
      setTokens([...tokens, token])
      setTokenName('')
      toast({ title: 'Success', description: 'Token created' })
    } catch (error) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' })
    }
  }

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">API Tokens</h1>

      {newToken && (
        <Card className="border-green-200 bg-green-50">
          <CardContent className="pt-6">
            <p className="font-mono text-sm break-all mb-2">{newToken}</p>
            <p className="text-sm text-gray-600">Save this token securely. You won't see it again.</p>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Create New Token</CardTitle>
        </CardHeader>
        <CardContent className="flex gap-2">
          <Input
            value={tokenName}
            onChange={(e) => setTokenName(e.target.value)}
            placeholder="Token name"
          />
          <Button onClick={handleCreateToken}>Create</Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Active Tokens</CardTitle>
        </CardHeader>
        <CardContent>
          {tokens.map((token) => (
            <div key={token._id} className="flex justify-between items-center p-4 border rounded mb-2">
              <div>
                <p className="font-medium">{token.name}</p>
                <p className="text-sm text-gray-600">{token.prefix}...</p>
              </div>
              <Badge>Active</Badge>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  )
}
```

## Common Patterns & Tips

### Loading States
Always show a skeleton or loading indicator while fetching:
```javascript
{loading ? <Skeleton className="h-48" /> : <Content />}
```

### Error Handling
Consistent error handling with toast notifications:
```javascript
} catch (error) {
  toast({
    title: 'Error',
    description: error.message,
    variant: 'destructive',
  })
}
```

### Optimistic Updates
Update UI immediately while request processes:
```javascript
// Update state immediately
setItems([...items, newItem])
// Then persist to server
try {
  await apiClient.create(newItem)
} catch (error) {
  // Revert on error
  setItems(items)
}
```

### Debounced Search
Avoid excessive API calls:
```javascript
const [searchTimer, setSearchTimer] = useState(null)

const handleSearch = (query) => {
  clearTimeout(searchTimer)
  setSearchTimer(setTimeout(() => {
    apiClient.request(`/search?q=${query}`)
  }, 500))
}
```

### Batch Operations
Update multiple items efficiently:
```javascript
const handleBatchDelete = async (ids) => {
  try {
    await apiClient.request('/delete-batch', {
      method: 'POST',
      body: JSON.stringify({ ids })
    })
    setItems(items.filter(i => !ids.includes(i._id)))
  } catch (error) {
    // Handle error
  }
}
```

## Troubleshooting

**Common Issues:**

1. **401 Unauthorized** - Token expired or missing
   - Solution: Login again, token will be auto-refreshed

2. **CORS Error** - Cross-origin request blocked
   - Solution: Ensure NEXT_PUBLIC_API_URL is correct

3. **Network Error** - Can't reach API
   - Solution: Check API server is running, check firewall/proxy

4. **State Not Updating** - Data fetched but UI doesn't change
   - Solution: Ensure you're calling setState, not mutating state directly

## Performance Tips

1. **Memoize callbacks** to prevent unnecessary renders
2. **Use `useCallback`** for frequently called functions
3. **Paginate large lists** instead of loading all at once
4. **Implement virtual scrolling** for 1000+ items
5. **Cache API responses** in memory for frequent requests

## Next Steps

1. Follow this guide to integrate the remaining pages
2. Test all CRUD operations
3. Add form validation
4. Implement real-time updates with WebSockets
5. Add proper error boundaries
6. Set up automated testing

---

**Happy Integrating!** 🚀
