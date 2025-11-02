'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { AlertCircle, AlertTriangle, CheckCircle, Activity, Server, AlertOctagon } from 'lucide-react';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';

export default function HealthMonitoringPage() {
  const [systemStatus] = useState({
    uptime: '99.98%',
    avgResponseTime: '145ms',
    errorRate: '0.02%',
    totalRequests: '2.4M',
  });

  const performanceData = [
    { time: '00:00', latency: 120, errorRate: 0.5 },
    { time: '04:00', latency: 95, errorRate: 0.3 },
    { time: '08:00', latency: 180, errorRate: 1.2 },
    { time: '12:00', latency: 210, errorRate: 0.8 },
    { time: '16:00', latency: 165, errorRate: 0.4 },
    { time: '20:00', latency: 140, errorRate: 0.6 },
    { time: '24:00', latency: 125, errorRate: 0.2 },
  ];

  const services = [
    { name: 'API Server', status: 'healthy', uptime: '99.99%', lastCheck: '1 min ago', responseTime: '120ms' },
    { name: 'Database', status: 'healthy', uptime: '99.98%', lastCheck: '2 min ago', responseTime: '45ms' },
    { name: 'Cache Layer', status: 'healthy', uptime: '99.97%', lastCheck: '1 min ago', responseTime: '12ms' },
    { name: 'Storage Service', status: 'degraded', uptime: '99.85%', lastCheck: '1 min ago', responseTime: '850ms' },
    { name: 'CDN', status: 'healthy', uptime: '99.99%', lastCheck: '30 sec ago', responseTime: '85ms' },
    { name: 'Message Queue', status: 'healthy', uptime: '99.96%', lastCheck: '2 min ago', responseTime: '320ms' },
  ];

  const alerts = [
    { id: 1, level: 'warning', title: 'High Memory Usage', desc: 'Storage service memory at 85%', time: '15 min ago', service: 'Storage Service' },
    { id: 2, level: 'info', title: 'Scheduled Maintenance', desc: 'Database backup in progress', time: '2 hours ago', service: 'Database' },
    { id: 3, level: 'error', title: 'Increased Latency', desc: 'API response time increased by 40%', time: '5 hours ago', service: 'API Server' },
  ];

  const incidents = [
    { id: 1, title: 'Cache Sync Issue', status: 'resolved', severity: 'medium', duration: '2h 15m', time: 'Yesterday' },
    { id: 2, title: 'Database Replication Lag', status: 'resolved', severity: 'high', duration: '45m', time: '2 days ago' },
    { id: 3, title: 'Spike in API Errors', status: 'resolved', severity: 'low', duration: '12m', time: '5 days ago' },
  ];

  const errorDistribution = [
    { name: '5xx Errors', value: 15 },
    { name: '4xx Errors', value: 35 },
    { name: 'Timeouts', value: 25 },
    { name: 'Other', value: 25 },
  ];

  const COLORS = ['#ef4444', '#f97316', '#eab308', '#84cc16'];

  const getStatusIcon = (status) => {
    switch (status) {
      case 'healthy':
        return <CheckCircle className="w-5 h-5 text-green-600" />;
      case 'degraded':
        return <AlertTriangle className="w-5 h-5 text-yellow-600" />;
      case 'down':
        return <AlertOctagon className="w-5 h-5 text-red-600" />;
      default:
        return <Activity className="w-5 h-5 text-blue-600" />;
    }
  };

  return (
    <div className="space-y-6 p-6">
      <div>
        <h1 className="text-3xl font-bold mb-2">System Health & Monitoring</h1>
        <p className="text-gray-600">Real-time system status and performance metrics</p>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <p className="text-sm text-gray-600 mb-2">Uptime</p>
              <p className="text-3xl font-bold text-green-600">{systemStatus.uptime}</p>
              <p className="text-xs text-gray-500 mt-2">Last 7 days</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <p className="text-sm text-gray-600 mb-2">Avg Response Time</p>
              <p className="text-3xl font-bold text-blue-600">{systemStatus.avgResponseTime}</p>
              <p className="text-xs text-gray-500 mt-2">Last hour</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <p className="text-sm text-gray-600 mb-2">Error Rate</p>
              <p className="text-3xl font-bold text-red-600">{systemStatus.errorRate}</p>
              <p className="text-xs text-gray-500 mt-2">Last hour</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <p className="text-sm text-gray-600 mb-2">Total Requests</p>
              <p className="text-3xl font-bold text-purple-600">{systemStatus.totalRequests}</p>
              <p className="text-xs text-gray-500 mt-2">Last 24 hours</p>
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="services" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="services">Services</TabsTrigger>
          <TabsTrigger value="performance">Performance</TabsTrigger>
          <TabsTrigger value="alerts">Alerts</TabsTrigger>
          <TabsTrigger value="incidents">Incidents</TabsTrigger>
        </TabsList>

        {/* Services Status */}
        <TabsContent value="services" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Service Health Status</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {services.map((service) => (
                  <Card key={service.name} className="border">
                    <CardContent className="pt-6">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3 flex-1">
                          {getStatusIcon(service.status)}
                          <div>
                            <p className="font-semibold">{service.name}</p>
                            <p className="text-xs text-gray-600">{service.lastCheck}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-6 text-sm">
                          <div>
                            <p className="text-gray-600">Uptime</p>
                            <p className="font-semibold">{service.uptime}</p>
                          </div>
                          <div>
                            <p className="text-gray-600">Response Time</p>
                            <p className="font-semibold">{service.responseTime}</p>
                          </div>
                          <Badge className={
                            service.status === 'healthy' ? 'bg-green-600' : 
                            service.status === 'degraded' ? 'bg-yellow-600' : 
                            'bg-red-600'
                          }>
                            {service.status.charAt(0).toUpperCase() + service.status.slice(1)}
                          </Badge>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Regional Status */}
          <Card>
            <CardHeader>
              <CardTitle>Regional Availability</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-3 gap-4">
                {['US East', 'EU West', 'Asia Pacific', 'US West', 'Canada', 'Australia'].map((region) => (
                  <div key={region} className="text-center p-4 border rounded">
                    <CheckCircle className="w-8 h-8 text-green-600 mx-auto mb-2" />
                    <p className="font-semibold text-sm">{region}</p>
                    <Badge className="mt-2 bg-green-100 text-green-800">Healthy</Badge>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Performance */}
        <TabsContent value="performance" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Response Time Trends</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={performanceData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="time" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Line type="monotone" dataKey="latency" stroke="#3b82f6" name="Latency (ms)" />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Error Rate Trends</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={performanceData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="time" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="errorRate" fill="#ef4444" name="Error Rate (%)" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Error Distribution</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={errorDistribution}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, value }) => `${name}: ${value}%`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {errorDistribution.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Alerts */}
        <TabsContent value="alerts" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Recent Alerts ({alerts.length})</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {alerts.map((alert) => (
                  <Card key={alert.id} className="border">
                    <CardContent className="pt-6">
                      <div className="flex items-start justify-between">
                        <div className="flex items-start gap-3 flex-1">
                          {alert.level === 'error' ? <AlertOctagon className="w-5 h-5 text-red-600 mt-1" /> :
                           alert.level === 'warning' ? <AlertTriangle className="w-5 h-5 text-yellow-600 mt-1" /> :
                           <AlertCircle className="w-5 h-5 text-blue-600 mt-1" />}
                          <div>
                            <p className="font-semibold">{alert.title}</p>
                            <p className="text-sm text-gray-600">{alert.desc}</p>
                            <div className="flex gap-3 mt-2">
                              <Badge variant="outline">{alert.service}</Badge>
                              <span className="text-xs text-gray-500">{alert.time}</span>
                            </div>
                          </div>
                        </div>
                        <Button size="sm" variant="outline">View</Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Alert Settings */}
          <Card>
            <CardHeader>
              <CardTitle>Alert Configuration</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center justify-between p-3 border rounded">
                <div>
                  <p className="font-semibold text-sm">Email Alerts</p>
                  <p className="text-xs text-gray-600">Get notified about critical issues</p>
                </div>
                <input type="checkbox" defaultChecked className="w-5 h-5" />
              </div>
              <div className="flex items-center justify-between p-3 border rounded">
                <div>
                  <p className="font-semibold text-sm">Slack Integration</p>
                  <p className="text-xs text-gray-600">Send alerts to Slack channel</p>
                </div>
                <input type="checkbox" defaultChecked className="w-5 h-5" />
              </div>
              <div className="flex items-center justify-between p-3 border rounded">
                <div>
                  <p className="font-semibold text-sm">SMS Notifications</p>
                  <p className="text-xs text-gray-600">Critical alerts via SMS</p>
                </div>
                <input type="checkbox" className="w-5 h-5" />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Incidents */}
        <TabsContent value="incidents" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Incident History</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {incidents.map((incident) => (
                  <Card key={incident.id} className="border">
                    <CardContent className="pt-6">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-semibold">{incident.title}</p>
                          <div className="flex items-center gap-3 mt-2">
                            <Badge variant={incident.severity === 'high' ? 'destructive' : 'secondary'}>
                              {incident.severity.charAt(0).toUpperCase() + incident.severity.slice(1)}
                            </Badge>
                            <span className="text-xs text-gray-600">Duration: {incident.duration}</span>
                            <span className="text-xs text-gray-600">{incident.time}</span>
                          </div>
                        </div>
                        <Badge className="bg-green-600">{incident.status.charAt(0).toUpperCase() + incident.status.slice(1)}</Badge>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
