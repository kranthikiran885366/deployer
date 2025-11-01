"use client"

import { useEffect, useState } from "react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Alert } from "@/components/ui/alert"
import { useAppStore } from "@/store/use-app-store"

export default function APIGraphPage() {
  const [apis, setApis] = useState([])
  const [selectedApi, setSelectedApi] = useState(null)
  const [testResponse, setTestResponse] = useState(null)

  useEffect(() => {
    fetchApis()
  }, [])

  const fetchApis = async () => {
    try {
      const response = await fetch("/api/apis")
      const data = await response.json()
      setApis(data)
    } catch (error) {
      console.error("Failed to fetch APIs:", error)
    }
  }

  const testEndpoint = async (endpoint) => {
    try {
      const response = await fetch(`/api/test-endpoint`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: endpoint.url, method: endpoint.method }),
      })
      const data = await response.json()
      setTestResponse(data)
    } catch (error) {
      setTestResponse({ error: error.message })
    }
  }

  const renderApiGraph = () => {
    return (
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {apis.map((api) => (
          <Card key={api.id} className="p-4">
            <h3 className="font-medium mb-2">{api.name}</h3>
            <p className="text-sm text-gray-500 mb-4">{api.description}</p>
            <div className="space-y-2">
              {api.endpoints.map((endpoint) => (
                <div key={endpoint.id} className="flex items-center justify-between">
                  <span className="text-sm">
                    <span className={`inline-block px-2 py-1 rounded text-xs mr-2 ${getMethodColor(endpoint.method)}`}>
                      {endpoint.method}
                    </span>
                    {endpoint.path}
                  </span>
                  <Button variant="outline" size="sm" onClick={() => testEndpoint(endpoint)}>
                    Test
                  </Button>
                </div>
              ))}
            </div>
          </Card>
        ))}
      </div>
    )
  }

  const getMethodColor = (method) => {
    const colors = {
      GET: "bg-blue-100 text-blue-800",
      POST: "bg-green-100 text-green-800",
      PUT: "bg-yellow-100 text-yellow-800",
      DELETE: "bg-red-100 text-red-800",
    }
    return colors[method] || "bg-gray-100 text-gray-800"
  }

  return (
    <div className="container mx-auto p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-semibold">API Graph</h1>
        <Button onClick={() => fetchApis()}>Refresh APIs</Button>
      </div>

      {testResponse && (
        <Alert className="mb-4" variant={testResponse.error ? "destructive" : "default"}>
          <pre className="whitespace-pre-wrap">{JSON.stringify(testResponse, null, 2)}</pre>
        </Alert>
      )}

      {renderApiGraph()}
    </div>
  )
}