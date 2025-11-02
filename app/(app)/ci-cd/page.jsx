'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { AlertCircle, CheckCircle, Clock, TrendingUp, Zap, AlertTriangle, Filter, Plus, Settings } from 'lucide-react';
import apiClient from '@/lib/api-client';

export default function CICDOverviewPage() {
  const [overview, setOverview] = useState(null);
  const [pipelines, setPipelines] = useState([]);
  const [recentRuns, setRecentRuns] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filter, setFilter] = useState('all');

  useEffect(() => {
    const fetchData = async () => {
      try {
        setError('');
        const [overviewRes, pipelinesRes, runsRes] = await Promise.all([
          apiClient.getCICDOverview(),
          apiClient.getCICDPipelines(),
          apiClient.getCICDRecentRuns()
        ]);

        if (overviewRes.success) setOverview(overviewRes.data);
        if (pipelinesRes.success) setPipelines(pipelinesRes.data || []);
        if (runsRes.success) setRecentRuns(runsRes.data || []);
      } catch (err) {
        setError(err.message || 'Failed to fetch CI/CD data');
        console.error('Fetch error:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="space-y-2">
          <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto"></div>
          <p className="text-muted-foreground">Loading CI/CD overview...</p>
        </div>
      </div>
    );
  }

  const filteredRuns = filter === 'all' 
    ? recentRuns 
    : recentRuns.filter(r => r.status === filter);

  const successRate = overview?.totalRuns 
    ? Math.round((overview?.successfulRuns / overview?.totalRuns) * 100) 
    : 0;

  return (
    <div className="max-w-7xl mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="space-y-2">
        <h1 className="text-3xl font-bold">CI/CD Pipeline Overview</h1>
        <p className="text-muted-foreground">
          Monitor and manage your continuous integration and deployment pipelines
        </p>
      </div>

      {/* Alerts */}
      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <p className="text-sm text-muted-foreground">Total Pipelines</p>
                <Zap className="w-4 h-4 text-primary" />
              </div>
              <p className="text-3xl font-bold">{overview?.totalPipelines || 0}</p>
              <p className="text-xs text-green-600">Active</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <p className="text-sm text-muted-foreground">Success Rate</p>
                <CheckCircle className="w-4 h-4 text-green-600" />
              </div>
              <p className="text-3xl font-bold">{successRate}%</p>
              <Progress value={successRate} className="h-1 mt-2" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <p className="text-sm text-muted-foreground">Failed Runs</p>
                <AlertTriangle className="w-4 h-4 text-red-600" />
              </div>
              <p className="text-3xl font-bold">{overview?.failedRuns || 0}</p>
              <p className="text-xs text-red-600">Last 24h</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <p className="text-sm text-muted-foreground">Avg Duration</p>
                <Clock className="w-4 h-4 text-blue-600" />
              </div>
              <p className="text-3xl font-bold">{overview?.avgDuration || '0'}m</p>
              <p className="text-xs text-muted-foreground">Per run</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Run History */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Run History (7 days)</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={250}>
              <LineChart data={overview?.runHistory || []}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Line 
                  type="monotone" 
                  dataKey="success" 
                  stroke="#10b981" 
                  name="Successful"
                />
                <Line 
                  type="monotone" 
                  dataKey="failed" 
                  stroke="#ef4444" 
                  name="Failed"
                />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Status Distribution */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Pipeline Status</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={250}>
              <PieChart>
                <Pie
                  data={[
                    { name: 'Success', value: overview?.successfulRuns || 0, fill: '#10b981' },
                    { name: 'Failed', value: overview?.failedRuns || 0, fill: '#ef4444' },
                    { name: 'Running', value: overview?.runningPipelines || 0, fill: '#f59e0b' },
                  ]}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, value }) => `${name}: ${value}`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  <Cell fill="#10b981" />
                  <Cell fill="#ef4444" />
                  <Cell fill="#f59e0b" />
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Pipelines */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-3">
          <CardTitle>Active Pipelines</CardTitle>
          <Button size="sm">
            <Plus className="w-4 h-4 mr-2" />
            New Pipeline
          </Button>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {pipelines.length === 0 ? (
              <p className="text-muted-foreground text-center py-8">No pipelines configured</p>
            ) : (
              pipelines.map(pipeline => (
                <div key={pipeline.id} className="p-3 border rounded-lg hover:bg-muted/50 transition">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <p className="font-medium">{pipeline.name}</p>
                      <p className="text-sm text-muted-foreground">{pipeline.source} → {pipeline.target}</p>
                    </div>
                    <div className="text-right">
                      <Badge 
                        variant={pipeline.status === 'active' ? 'default' : 'outline'}
                      >
                        {pipeline.status}
                      </Badge>
                      <p className="text-xs text-muted-foreground mt-1">
                        Last run: {pipeline.lastRun}
                      </p>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>

      {/* Recent Runs */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-3">
          <CardTitle>Recent Runs</CardTitle>
          <div className="flex gap-2">
            {['all', 'success', 'failed', 'running'].map(f => (
              <Button
                key={f}
                size="sm"
                variant={filter === f ? 'default' : 'outline'}
                onClick={() => setFilter(f)}
              >
                {f.charAt(0).toUpperCase() + f.slice(1)}
              </Button>
            ))}
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {filteredRuns.length === 0 ? (
              <p className="text-muted-foreground text-center py-8">No runs found</p>
            ) : (
              filteredRuns.map(run => (
                <div key={run.id} className="p-3 border rounded-lg flex items-center justify-between">
                  <div className="flex-1">
                    <p className="font-medium">{run.pipeline}</p>
                    <p className="text-sm text-muted-foreground">{run.branch} • {run.commit}</p>
                  </div>
                  <div className="text-right">
                    <Badge 
                      variant={
                        run.status === 'success' ? 'default' :
                        run.status === 'failed' ? 'destructive' :
                        'secondary'
                      }
                    >
                      {run.status}
                    </Badge>
                    <p className="text-xs text-muted-foreground mt-1">{run.duration}</p>
                  </div>
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
