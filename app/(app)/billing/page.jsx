"use client"

import { useState } from "react"
import { useAppStore } from "@/store/use-app-store"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Check, Zap, CreditCard, TrendingUp } from "lucide-react"

export default function BillingPage() {
  const { billing, setPlan, addPaymentMethod } = useAppStore()
  const [brand, setBrand] = useState("visa")
  const [last4, setLast4] = useState("4242")

  const plans = [
    {
      name: "Hobby",
      price: "$0",
      description: "Perfect for getting started",
      features: ["Up to 3 projects", "1 Database", "1GB bandwidth/month", "Community support", "Public logs"],
      popular: false,
    },
    {
      name: "Pro",
      price: "$29",
      description: "Most popular for teams",
      features: [
        "Unlimited projects",
        "10 Databases",
        "100GB bandwidth/month",
        "Email support",
        "Team collaboration",
        "Private logs",
        "Custom domains",
      ],
      popular: true,
    },
    {
      name: "Scale",
      price: "Custom",
      description: "For enterprise needs",
      features: [
        "Unlimited everything",
        "Dedicated infrastructure",
        "Custom SLA",
        "Phone support",
        "SSO",
        "Advanced analytics",
      ],
      popular: false,
    },
  ]

  function addPm() {
    addPaymentMethod({ brand, last4 })
  }

  return (
    <div className="grid gap-6">
      <div>
        <h1 className="text-3xl font-bold mb-2">Billing & Plans</h1>
        <p className="text-muted-foreground">Manage your subscription and usage</p>
      </div>

      <Card>
        <CardContent className="p-6">
          <h3 className="font-semibold mb-2">Current Subscription</h3>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-2xl font-bold">{billing.plan} Plan</p>
              <p className="text-sm text-muted-foreground mt-1">
                Renews on {new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toLocaleDateString()}
              </p>
            </div>
            <Badge className="bg-primary text-white">Active</Badge>
          </div>
        </CardContent>
      </Card>

      <section>
        <h2 className="text-xl font-semibold mb-4">Upgrade Your Plan</h2>
        <div className="grid gap-4 md:grid-cols-3">
          {plans.map((p) => (
            <Card
              key={p.name}
              className={`relative hover:shadow-lg transition-all ${
                billing.plan === p.name ? "ring-2 ring-primary" : ""
              } ${p.popular ? "md:scale-105" : ""}`}
            >
              {p.popular && (
                <div className="absolute -top-3 left-4 bg-primary text-white px-3 py-1 rounded-full text-xs font-semibold">
                  Most Popular
                </div>
              )}
              <CardContent className="p-6 pt-8">
                <div>
                  <h3 className="font-semibold text-lg">{p.name}</h3>
                  <p className="text-xs text-muted-foreground mt-1">{p.description}</p>
                  <div className="text-3xl font-bold my-3">{p.price}</div>
                </div>
                <Button className="w-full mb-4" disabled={billing.plan === p.name}>
                  {billing.plan === p.name ? "Current Plan" : `Switch to ${p.name}`}
                </Button>
                <ul className="space-y-2">
                  {p.features.map((f, i) => (
                    <li key={i} className="flex items-start gap-2 text-sm">
                      <Check className="w-4 h-4 text-primary mt-0.5 flex-shrink-0" />
                      <span>{f}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      <Card>
        <CardContent className="p-6">
          <h3 className="font-semibold mb-4 flex items-center gap-2">
            <CreditCard className="w-5 h-5" />
            Payment Method
          </h3>
          {billing.paymentMethod ? (
            <div className="flex items-center justify-between p-4 border rounded-lg">
              <div className="flex items-center gap-3">
                <Zap className="w-5 h-5 text-primary" />
                <div>
                  <Badge className="bg-gray-500 text-white capitalize mb-1">{billing.paymentMethod.brand}</Badge>
                  <p className="text-sm font-mono">•••• {billing.paymentMethod.last4}</p>
                </div>
              </div>
              <Button variant="outline">Update</Button>
            </div>
          ) : (
            <div className="grid gap-4 sm:grid-cols-3">
              <select
                className="border rounded-lg px-4 py-2 bg-background"
                value={brand}
                onChange={(e) => setBrand(e.target.value)}
              >
                <option value="visa">Visa</option>
                <option value="mastercard">Mastercard</option>
                <option value="amex">American Express</option>
              </select>
              <input
                className="border rounded-lg px-4 py-2 bg-background"
                value={last4}
                onChange={(e) => setLast4(e.target.value)}
                placeholder="Last 4 digits"
              />
              <Button onClick={addPm}>Add Payment</Button>
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-6">
          <h3 className="font-semibold mb-4 flex items-center gap-2">
            <TrendingUp className="w-5 h-5" />
            Current Usage
          </h3>
          <div className="space-y-4">
            <UsageBar label="Bandwidth" value={billing.usage.bandwidthGb} max={100} unit="GB" />
            <UsageBar label="Functions" value={(billing.usage.functionsMs / 1000).toFixed(1)} max={100} unit="k ms" />
            <UsageBar label="Storage" value={billing.usage.storageGb} max={10} unit="GB" />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-6">
          <h3 className="font-semibold mb-4">Recent Invoices</h3>
          <div className="space-y-2">
            {[...Array(3)].map((_, i) => (
              <div
                key={i}
                className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted transition"
              >
                <div className="text-sm">
                  <p className="font-medium">Invoice #{1003 - i}</p>
                  <p className="text-xs text-muted-foreground">
                    {new Date(Date.now() - i * 30 * 24 * 60 * 60 * 1000).toLocaleDateString()}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-sm font-semibold">${29}</span>
                  <Button variant="ghost" size="sm">
                    Download
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

function UsageBar({ label, value, max, unit }) {
  const pct = Math.min(100, Math.round((Number(value) / max) * 100))
  const isWarning = pct > 80
  return (
    <div>
      <div className="flex justify-between mb-2">
        <span className="font-medium text-sm">{label}</span>
        <span className={`text-sm font-semibold ${isWarning ? "text-yellow-600" : ""}`}>
          {value}/{max} {unit}
        </span>
      </div>
      <div className="h-2 bg-muted rounded-full overflow-hidden">
        <div
          className={`h-2 rounded-full transition-colors ${isWarning ? "bg-yellow-500" : "bg-primary"}`}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  )
}
