"use client"

import { useState, useEffect } from "react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Alert } from "@/components/ui/alert"
import { Progress } from "@/components/ui/progress"
import { Table, TableHeader, TableBody, TableRow, TableCell } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Select } from "@/components/ui/select"
import { Spinner } from "@/components/ui/spinner"

export default function MediaCDNPage() {
  const [assets, setAssets] = useState([])
  const [uploading, setUploading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)
  const [selectedFiles, setSelectedFiles] = useState([])
  const [settings, setSettings] = useState({
    compressionLevel: "medium",
    cacheControl: "public, max-age=31536000",
    region: "auto",
  })

  useEffect(() => {
    fetchAssets()
  }, [])

  const fetchAssets = async () => {
    try {
      const response = await fetch("/api/media-cdn/assets")
      const data = await response.json()
      setAssets(data)
    } catch (error) {
      console.error("Failed to fetch assets:", error)
    }
  }

  const handleFileSelect = (e) => {
    setSelectedFiles(Array.from(e.target.files))
  }

  const uploadFiles = async () => {
    setUploading(true)
    setUploadProgress(0)

    for (let i = 0; i < selectedFiles.length; i++) {
      const file = selectedFiles[i]
      const formData = new FormData()
      formData.append("file", file)
      formData.append("settings", JSON.stringify(settings))

      try {
        const response = await fetch("/api/media-cdn/upload", {
          method: "POST",
          body: formData,
        })

        if (!response.ok) throw new Error("Upload failed")
        
        setUploadProgress(((i + 1) / selectedFiles.length) * 100)
      } catch (error) {
        console.error("Upload error:", error)
      }
    }

    setUploading(false)
    setSelectedFiles([])
    fetchAssets()
  }

  const optimizeAsset = async (id) => {
    try {
      await fetch(`/api/media-cdn/assets/${id}/optimize`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(settings),
      })
      fetchAssets()
    } catch (error) {
      console.error("Optimization failed:", error)
    }
  }

  const purgeCache = async (id) => {
    try {
      await fetch(`/api/media-cdn/assets/${id}/purge`, {
        method: "POST",
      })
      fetchAssets()
    } catch (error) {
      console.error("Cache purge failed:", error)
    }
  }

  const formatSize = (bytes) => {
    if (bytes === 0) return "0 B"
    const k = 1024
    const sizes = ["B", "KB", "MB", "GB"]
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`
  }

  return (
    <div className="container mx-auto p-6">
      <div className="grid gap-6">
        <Card className="p-6">
          <h2 className="text-xl font-semibold mb-4">Upload Media Assets</h2>
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium">Files</label>
              <Input
                type="file"
                multiple
                onChange={handleFileSelect}
                accept="image/*,video/*"
              />
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div>
                <label className="text-sm font-medium">Compression Level</label>
                <Select
                  value={settings.compressionLevel}
                  onChange={(e) => setSettings({
                    ...settings,
                    compressionLevel: e.target.value,
                  })}
                >
                  <option value="none">None</option>
                  <option value="low">Low</option>
                  <option value="medium">Medium</option>
                  <option value="high">High</option>
                </Select>
              </div>

              <div>
                <label className="text-sm font-medium">Cache Control</label>
                <Select
                  value={settings.cacheControl}
                  onChange={(e) => setSettings({
                    ...settings,
                    cacheControl: e.target.value,
                  })}
                >
                  <option value="no-cache">No Cache</option>
                  <option value="public, max-age=3600">1 Hour</option>
                  <option value="public, max-age=86400">1 Day</option>
                  <option value="public, max-age=31536000">1 Year</option>
                </Select>
              </div>

              <div>
                <label className="text-sm font-medium">Region</label>
                <Select
                  value={settings.region}
                  onChange={(e) => setSettings({
                    ...settings,
                    region: e.target.value,
                  })}
                >
                  <option value="auto">Auto (CDN Optimized)</option>
                  <option value="us-east">US East</option>
                  <option value="us-west">US West</option>
                  <option value="eu">Europe</option>
                  <option value="asia">Asia</option>
                </Select>
              </div>
            </div>

            {uploading && (
              <div>
                <Progress value={uploadProgress} className="w-full" />
                <div className="text-sm text-center mt-2">
                  Uploading... {Math.round(uploadProgress)}%
                </div>
              </div>
            )}

            <Button
              onClick={uploadFiles}
              disabled={selectedFiles.length === 0 || uploading}
            >
              {uploading ? <Spinner className="mr-2" /> : null}
              Upload {selectedFiles.length} Files
            </Button>
          </div>
        </Card>

        <Card className="p-6">
          <h2 className="text-xl font-semibold mb-4">Media Assets</h2>
          <Table>
            <TableHeader>
              <TableRow>
                <TableCell>Preview</TableCell>
                <TableCell>Name</TableCell>
                <TableCell>Type</TableCell>
                <TableCell>Size</TableCell>
                <TableCell>Status</TableCell>
                <TableCell>CDN URL</TableCell>
                <TableCell>Actions</TableCell>
              </TableRow>
            </TableHeader>
            <TableBody>
              {assets.map((asset) => (
                <TableRow key={asset.id}>
                  <TableCell>
                    {asset.type.startsWith("image/") ? (
                      <img
                        src={asset.cdnUrl}
                        alt={asset.name}
                        className="w-16 h-16 object-cover rounded"
                      />
                    ) : (
                      <video
                        src={asset.cdnUrl}
                        className="w-16 h-16 object-cover rounded"
                      />
                    )}
                  </TableCell>
                  <TableCell>{asset.name}</TableCell>
                  <TableCell>{asset.type}</TableCell>
                  <TableCell>{formatSize(asset.size)}</TableCell>
                  <TableCell>
                    <Badge
                      variant={asset.status === "active" ? "success" : "warning"}
                    >
                      {asset.status}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <a
                      href={asset.cdnUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-500 hover:underline"
                    >
                      {asset.cdnUrl}
                    </a>
                  </TableCell>
                  <TableCell>
                    <div className="space-x-2">
                      <Button
                        size="sm"
                        onClick={() => optimizeAsset(asset.id)}
                      >
                        Optimize
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => purgeCache(asset.id)}
                      >
                        Purge Cache
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Card>
      </div>
    </div>
  )
}