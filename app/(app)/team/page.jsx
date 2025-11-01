"use client"

import { useState } from "react"
import { useAppStore } from "@/store/use-app-store"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Mail, Trash2, Users } from "lucide-react"

export default function TeamPage() {
  const { team, inviteMember, changeRole, removeMember } = useAppStore()
  const [email, setEmail] = useState("")
  const [role, setRole] = useState("developer")
  const [loading, setLoading] = useState(false)

  async function invite() {
    if (!email.trim()) return
    setLoading(true)
    try {
      inviteMember({ email, role })
      setEmail("")
      setRole("developer")
    } finally {
      setLoading(false)
    }
  }

  const roleConfig = {
    owner: { color: "bg-purple-500", description: "Full access to all resources" },
    admin: { color: "bg-blue-500", description: "Can manage team and deployments" },
    developer: { color: "bg-green-500", description: "Can deploy and manage resources" },
    viewer: { color: "bg-gray-500", description: "Read-only access" },
  }

  return (
    <div className="grid gap-6">
      <div>
        <h1 className="text-3xl font-bold mb-2">Team Members</h1>
        <p className="text-muted-foreground">Manage team access and permissions</p>
      </div>

      <Card>
        <CardContent className="p-6">
          <h3 className="font-semibold mb-4">Invite Team Member</h3>
          <div className="grid gap-4 sm:grid-cols-4">
            <div>
              <label className="text-sm font-medium">Email</label>
              <input
                className="border rounded-lg px-4 py-2 w-full mt-2 bg-background"
                placeholder="user@example.com"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
            <div>
              <label className="text-sm font-medium">Role</label>
              <select
                className="border rounded-lg px-4 py-2 w-full mt-2 bg-background"
                value={role}
                onChange={(e) => setRole(e.target.value)}
              >
                <option value="viewer">Viewer</option>
                <option value="developer">Developer</option>
                <option value="admin">Admin</option>
                <option value="owner">Owner</option>
              </select>
            </div>
            <div className="flex items-end">
              <Button onClick={invite} disabled={loading} className="w-full bg-transparent" variant="outline">
                <Mail className="w-4 h-4 mr-2" />
                {loading ? "Inviting..." : "Send Invite"}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-3">
        {team.length === 0 ? (
          <Card>
            <CardContent className="p-12 text-center text-muted-foreground">
              <Users className="w-12 h-12 mx-auto mb-4 opacity-20" />
              <p>No team members yet</p>
              <p className="text-sm mt-2">Invite team members to collaborate</p>
            </CardContent>
          </Card>
        ) : (
          team.map((m) => {
            const config = roleConfig[m.role]
            return (
              <Card key={m.id} className="hover:shadow-sm transition-shadow">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between gap-4">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-10 h-10 bg-muted rounded-full flex items-center justify-center flex-shrink-0">
                        <span className="text-sm font-semibold">{m.email.charAt(0).toUpperCase()}</span>
                      </div>
                      <div className="min-w-0">
                        <div className="font-medium text-sm">{m.email}</div>
                        <div className="text-xs text-muted-foreground">
                          Invited {new Date(m.invitedAt).toLocaleDateString()}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <div className="hidden sm:block">
                        <Badge className={`${config.color} text-white whitespace-nowrap`}>
                          {m.role.charAt(0).toUpperCase() + m.role.slice(1)}
                        </Badge>
                      </div>
                      <select
                        className="border rounded px-2 py-1.5 text-xs bg-background"
                        value={m.role}
                        onChange={(e) => changeRole(m.id, e.target.value)}
                      >
                        <option value="viewer">Viewer</option>
                        <option value="developer">Developer</option>
                        <option value="admin">Admin</option>
                        <option value="owner">Owner</option>
                      </select>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => removeMember(m.id)}
                        className="text-destructive hover:bg-destructive/10"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                  <p className="text-xs text-muted-foreground mt-2">{config.description}</p>
                </CardContent>
              </Card>
            )
          })
        )}
      </div>
    </div>
  )
}
