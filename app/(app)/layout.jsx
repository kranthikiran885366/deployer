"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { useEffect, useState } from "react"
import { useAppStore } from "@/store/use-app-store"
import { Button } from "@/components/ui/button"
import { 
  LayoutDashboard, 
  FolderOpen, 
  Rocket, 
  Database, 
  Zap, 
  Clock, 
  Globe, 
  TestTube, 
  Layers, 
  Settings, 
  Users, 
  CreditCard, 
  FileText, 
  Activity,
  Image,
  MapPin,
  Menu,
  X,
  User,
  LogOut,
  Bell
} from "lucide-react"

const navSections = [
  {
    title: "Overview",
    items: [
      { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
      { href: "/projects", label: "Projects", icon: FolderOpen },
    ]
  },
  {
    title: "Deploy & Build",
    items: [
      { href: "/deployments", label: "Deployments", icon: Rocket },
      { href: "/functions", label: "Functions", icon: Zap },
      { href: "/cronjobs", label: "Cron Jobs", icon: Clock },
    ]
  },
  {
    title: "Data & Storage",
    items: [
      { href: "/databases", label: "Databases", icon: Database },
      { href: "/media-cdn", label: "Media CDN", icon: Image },
    ]
  },
  {
    title: "Configuration",
    items: [
      { href: "/domains", label: "Domains", icon: Globe },
      { href: "/env", label: "Environment", icon: Settings },
      { href: "/multi-region", label: "Multi-region", icon: MapPin },
    ]
  },
  {
    title: "Advanced",
    items: [
      { href: "/split-testing", label: "Split Testing", icon: TestTube },
      { href: "/blueprints", label: "Blueprints", icon: Layers },
      { href: "/isr-config", label: "ISR Config", icon: Settings },
      { href: "/edge-handlers", label: "Edge Handlers", icon: Zap },
    ]
  },
  {
    title: "Monitoring",
    items: [
      { href: "/logs", label: "Logs", icon: FileText },
      { href: "/api-graph", label: "Analytics", icon: Activity },
    ]
  },
  {
    title: "Team & Billing",
    items: [
      { href: "/team", label: "Team", icon: Users },
      { href: "/billing", label: "Billing", icon: CreditCard },
    ]
  }
]

export default function AppLayout({ children }) {
  const pathname = usePathname()
  const { isAuthenticated, login, loadInitialData } = useAppStore()
  const [sidebarOpen, setSidebarOpen] = useState(false)

  useEffect(() => {
    loadInitialData()
    if (!isAuthenticated) {
      login({ email: "demo@clouddeck.app" })
    }
  }, [])

  return (
    <div className="min-h-svh bg-background">
      {/* Mobile sidebar overlay */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-40 md:hidden" 
          onClick={() => setSidebarOpen(false)}
        />
      )}
      
      {/* Sidebar */}
      <aside className={`fixed left-0 top-0 h-full w-64 bg-card border-r transform transition-transform duration-200 ease-in-out z-50 md:translate-x-0 ${
        sidebarOpen ? 'translate-x-0' : '-translate-x-full'
      } md:static md:z-auto`}>
        <div className="flex flex-col h-full">
          {/* Logo */}
          <div className="flex items-center justify-between p-4 border-b">
            <Link href="/" className="font-bold text-xl bg-gradient-to-r from-primary to-blue-600 bg-clip-text text-transparent">
              ⚡ CloudDeck
            </Link>
            <Button 
              variant="ghost" 
              size="sm" 
              className="md:hidden"
              onClick={() => setSidebarOpen(false)}
            >
              <X className="size-4" />
            </Button>
          </div>
          
          {/* Navigation */}
          <nav className="flex-1 overflow-y-auto p-4 space-y-6">
            {navSections.map((section) => (
              <div key={section.title}>
                <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">
                  {section.title}
                </h3>
                <div className="space-y-1">
                  {section.items.map((item) => {
                    const Icon = item.icon
                    const isActive = pathname === item.href
                    return (
                      <Link
                        key={item.href}
                        href={item.href}
                        className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                          isActive 
                            ? "bg-primary text-primary-foreground shadow-sm" 
                            : "text-muted-foreground hover:text-foreground hover:bg-muted"
                        }`}
                        onClick={() => setSidebarOpen(false)}
                      >
                        <Icon className="size-4" />
                        {item.label}
                      </Link>
                    )
                  })}
                </div>
              </div>
            ))}
          </nav>
          
          {/* User section */}
          <div className="p-4 border-t">
            <div className="flex items-center gap-3 p-2 rounded-lg hover:bg-muted transition-colors cursor-pointer">
              <div className="w-8 h-8 bg-gradient-to-r from-primary to-blue-600 rounded-full flex items-center justify-center">
                <User className="size-4 text-white" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-sm font-medium truncate">Demo User</div>
                <div className="text-xs text-muted-foreground truncate">demo@clouddeck.app</div>
              </div>
              <Button variant="ghost" size="sm">
                <LogOut className="size-4" />
              </Button>
            </div>
          </div>
        </div>
      </aside>
      
      {/* Main content */}
      <main className="md:ml-64">
        {/* Header */}
        <header className="sticky top-0 z-30 bg-background/80 backdrop-blur-md border-b">
          <div className="flex items-center justify-between px-4 py-3">
            <div className="flex items-center gap-4">
              <Button 
                variant="ghost" 
                size="sm" 
                className="md:hidden"
                onClick={() => setSidebarOpen(true)}
              >
                <Menu className="size-4" />
              </Button>
              <div className="hidden md:block">
                <h1 className="font-semibold text-lg">Dashboard</h1>
                <p className="text-sm text-muted-foreground">Unified Cloud Dashboard</p>
              </div>
            </div>
            
            <div className="flex items-center gap-3">
              <Button variant="ghost" size="sm">
                <Bell className="size-4" />
              </Button>
              <Link href="/" className="text-sm text-primary hover:underline">
                View Site
              </Link>
            </div>
          </div>
        </header>
        
        {/* Page content */}
        <div className="p-4 md:p-6">
          {children}
        </div>
      </main>
    </div>
  )
}
