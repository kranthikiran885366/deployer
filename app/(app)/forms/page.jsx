"use client"

import { useState, useEffect } from "react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Alert } from "@/components/ui/alert"
import { Table, TableHeader, TableBody, TableRow, TableCell } from "@/components/ui/table"

export default function FormsPage() {
  const [forms, setForms] = useState([])
  const [newForm, setNewForm] = useState({ name: "", fields: [] })
  const [submissions, setSubmissions] = useState([])
  const [selectedForm, setSelectedForm] = useState(null)

  useEffect(() => {
    fetchForms()
  }, [])

  const fetchForms = async () => {
    try {
      const response = await fetch("/api/forms")
      const data = await response.json()
      setForms(data)
    } catch (error) {
      console.error("Failed to fetch forms:", error)
    }
  }

  const fetchSubmissions = async (formId) => {
    try {
      const response = await fetch(`/api/forms/${formId}/submissions`)
      const data = await response.json()
      setSubmissions(data)
      setSelectedForm(formId)
    } catch (error) {
      console.error("Failed to fetch submissions:", error)
    }
  }

  const createForm = async (e) => {
    e.preventDefault()
    try {
      const response = await fetch("/api/forms", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newForm),
      })
      if (response.ok) {
        setNewForm({ name: "", fields: [] })
        fetchForms()
      }
    } catch (error) {
      console.error("Failed to create form:", error)
    }
  }

  const addField = () => {
    setNewForm(prev => ({
      ...prev,
      fields: [...prev.fields, { name: "", type: "text", required: false }]
    }))
  }

  const updateField = (index, field) => {
    setNewForm(prev => ({
      ...prev,
      fields: prev.fields.map((f, i) => i === index ? field : f)
    }))
  }

  return (
    <div className="container mx-auto p-6">
      <div className="grid gap-6">
        <Card className="p-6">
          <h2 className="text-xl font-semibold mb-4">Create Form</h2>
          <form onSubmit={createForm} className="space-y-4">
            <Input
              placeholder="Form name"
              value={newForm.name}
              onChange={(e) => setNewForm({ ...newForm, name: e.target.value })}
            />
            
            {newForm.fields.map((field, index) => (
              <div key={index} className="flex gap-2">
                <Input
                  placeholder="Field name"
                  value={field.name}
                  onChange={(e) => updateField(index, { ...field, name: e.target.value })}
                />
                <select
                  className="border rounded px-2"
                  value={field.type}
                  onChange={(e) => updateField(index, { ...field, type: e.target.value })}
                >
                  <option value="text">Text</option>
                  <option value="email">Email</option>
                  <option value="number">Number</option>
                  <option value="file">File</option>
                </select>
                <input
                  type="checkbox"
                  checked={field.required}
                  onChange={(e) => updateField(index, { ...field, required: e.target.checked })}
                />
                <label>Required</label>
              </div>
            ))}
            
            <Button type="button" onClick={addField}>Add Field</Button>
            <Button type="submit">Create Form</Button>
          </form>
        </Card>

        <Card className="p-6">
          <h2 className="text-xl font-semibold mb-4">Your Forms</h2>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {forms.map((form) => (
              <Card key={form.id} className="p-4">
                <h3 className="font-medium mb-2">{form.name}</h3>
                <p className="text-sm text-gray-500 mb-4">
                  {form.fields.length} fields | {form.submissionCount} submissions
                </p>
                <div className="space-x-2">
                  <Button onClick={() => fetchSubmissions(form.id)}>
                    View Submissions
                  </Button>
                  <Button variant="outline" onClick={() => navigator.clipboard.writeText(form.embedCode)}>
                    Copy Embed Code
                  </Button>
                </div>
              </Card>
            ))}
          </div>
        </Card>

        {selectedForm && (
          <Card className="p-6">
            <h2 className="text-xl font-semibold mb-4">Form Submissions</h2>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableCell>Date</TableCell>
                  <TableCell>Fields</TableCell>
                  <TableCell>Actions</TableCell>
                </TableRow>
              </TableHeader>
              <TableBody>
                {submissions.map((submission) => (
                  <TableRow key={submission.id}>
                    <TableCell>{new Date(submission.createdAt).toLocaleString()}</TableCell>
                    <TableCell>
                      <pre className="text-sm">
                        {JSON.stringify(submission.data, null, 2)}
                      </pre>
                    </TableCell>
                    <TableCell>
                      <Button variant="outline" size="sm">
                        Export
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </Card>
        )}
      </div>
    </div>
  )
}