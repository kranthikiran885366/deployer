"use client"

import { useState, useEffect } from "react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Alert } from "@/components/ui/alert"
import { Select } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Table, TableHeader, TableBody, TableRow, TableCell } from "@/components/ui/table"

export default function EdgeHandlersPage() {
  const [handlers, setHandlers] = useState([])
  const [newHandler, setNewHandler] = useState({
    name: "",
    pattern: "/*",
    code: `export default function handler(request) {
  // Your edge logic here
  return new Response("Hello from the edge!")
}`,
    type: "request",
    regions: ["all"],
  })
  const [selectedHandler, setSelectedHandler] = useState(null)
  const [testResult, setTestResult] = useState(null)

  useEffect(() => {
    fetchHandlers()
  }, [])

  const fetchHandlers = async () => {
    try {
      const response = await fetch("/api/edge-handlers")
      const data = await response.json()
      setHandlers(data)
    } catch (error) {
      console.error("Failed to fetch handlers:", error)
    }
  }

  const createHandler = async (e) => {
    e.preventDefault()
    try {
      const response = await fetch("/api/edge-handlers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newHandler),
      })
      if (response.ok) {
        setNewHandler({
          name: "",
          pattern: "/*",
          code: `export default function handler(request) {
  // Your edge logic here
  return new Response("Hello from the edge!")
}`,
          type: "request",
          regions: ["all"],
        })
        fetchHandlers()
      }
    } catch (error) {
      console.error("Failed to create handler:", error)
    }
  }

  const testHandler = async (id) => {
    try {
      const response = await fetch(`/api/edge-handlers/${id}/test`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          url: "https://example.com/test",
          method: "GET",
          headers: {},
        }),
      })
      const data = await response.json()
      setTestResult(data)
      setSelectedHandler(id)
    } catch (error) {
      console.error("Failed to test handler:", error)
    }
  }

  const deployHandler = async (id) => {
    try {
      await fetch(`/api/edge-handlers/${id}/deploy`, {
        method: "POST",
      })
      fetchHandlers()
    } catch (error) {
      console.error("Failed to deploy handler:", error)
    }
  }

  return (
    <div className="container mx-auto p-6">
      <div className="grid gap-6">
        <Card className="p-6">
          <h2 className="text-xl font-semibold mb-4">Create Edge Handler</h2>
          <form onSubmit={createHandler} className="space-y-4">
            <div>
              <label className="text-sm font-medium">Name</label>
              <Input
                value={newHandler.name}
                onChange={(e) => setNewHandler({ ...newHandler, name: e.target.value })}
                placeholder="my-edge-handler"
              />
            </div>

            <div>
              <label className="text-sm font-medium">URL Pattern</label>
              <Input
                value={newHandler.pattern}
                onChange={(e) => setNewHandler({ ...newHandler, pattern: e.target.value })}
                placeholder="/*"
              />
            </div>

            <div>
              <label className="text-sm font-medium">Type</label>
              <Select
                value={newHandler.type}
                onChange={(e) => setNewHandler({ ...newHandler, type: e.target.value })}
              >
                <option value="request">Request Handler</option>
                <option value="response">Response Handler</option>
                <option value="middleware">Middleware</option>
              </Select>
            </div>

            <div>
              <label className="text-sm font-medium">Code</label>
              <Textarea
                value={newHandler.code}
                onChange={(e) => setNewHandler({ ...newHandler, code: e.target.value })}
                className="font-mono"
                rows={10}
              />
            </div>

            <div>
              <label className="text-sm font-medium">Regions</label>
              <Select
                multiple
                value={newHandler.regions}
                onChange={(e) => {
                  const options = Array.from(e.target.selectedOptions)
                  setNewHandler({
                    ...newHandler,
                    regions: options.map(o => o.value),
                  })
                }}
              >
                <option value="all">All Regions</option>
                <option value="us-east">US East</option>
                <option value="us-west">US West</option>
                <option value="eu-central">EU Central</option>
                <option value="ap-south">Asia Pacific</option>
              </Select>
            </div>

            <Button type="submit">Create Handler</Button>
          </form>
        </Card>

        <Card className="p-6">
          <h2 className="text-xl font-semibold mb-4">Edge Handlers</h2>
          <Table>
            <TableHeader>
              <TableRow>
                <TableCell>Name</TableCell>
                <TableCell>Pattern</TableCell>
                <TableCell>Type</TableCell>
                <TableCell>Status</TableCell>
                <TableCell>Regions</TableCell>
                <TableCell>Actions</TableCell>
              </TableRow>
            </TableHeader>
            <TableBody>
              {handlers.map((handler) => (
                <TableRow key={handler.id}>
                  <TableCell>{handler.name}</TableCell>
                  <TableCell>{handler.pattern}</TableCell>
                  <TableCell>{handler.type}</TableCell>
                  <TableCell>
                    <Badge
                      variant={handler.status === "active" ? "success" : "warning"}
                    >
                      {handler.status}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    {handler.regions.map(region => (
                      <Badge key={region} className="mr-1">
                        {region}
                      </Badge>
                    ))}
                  </TableCell>
                  <TableCell>
                    <div className="space-x-2">
                      <Button
                        size="sm"
                        onClick={() => testHandler(handler.id)}
                      >
                        Test
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => deployHandler(handler.id)}
                      >
                        Deploy
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Card>

        {selectedHandler && testResult && (
          <Card className="p-6">
            <h2 className="text-xl font-semibold mb-4">Test Result</h2>
            <div className="space-y-4">
              <div>
                <h3 className="font-medium">Response</h3>
                <pre className="bg-gray-100 p-4 rounded mt-2 overflow-auto">
                  {JSON.stringify(testResult, null, 2)}
                </pre>
              </div>
              
              <div>
                <h3 className="font-medium">Performance</h3>
                <div className="grid grid-cols-3 gap-4 mt-2">
                  <Card className="p-4">
                    <div className="text-sm text-gray-500">Response Time</div>
                    <div className="text-xl font-bold">{testResult.timing.total}ms</div>
                  </Card>
                  <Card className="p-4">
                    <div className="text-sm text-gray-500">Cold Start</div>
                    <div className="text-xl font-bold">{testResult.timing.coldStart}ms</div>
                  </Card>
                  <Card className="p-4">
                    <div className="text-sm text-gray-500">Memory Usage</div>
                    <div className="text-xl font-bold">{testResult.memory}MB</div>
                  </Card>
                </div>
              </div>
            </div>
          </Card>
        )}
      </div>
    </div>
  )
}