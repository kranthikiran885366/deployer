'use client'

import { useEffect, useState } from 'react'
import { useAppStore } from '@/store/use-app-store'
import apiClient from '@/lib/api-client'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Loader2, CheckCircle, AlertCircle } from 'lucide-react'

export default function ProvidersPage() {
  const [providers, setProviders] = useState([])
  const [loading, setLoading] = useState(true)
  const [connecting, setConnecting] = useState({})
  const [tokens, setTokens] = useState({})
  const [messages, setMessages] = useState({})

  useEffect(() => {
    loadProviders()
  }, [])

  const loadProviders = async () => {
    try {
      const data = await apiClient.getSupportedProviders()
      setProviders(data.providers || [])
    } catch (error) {
      console.error('Failed to load providers:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleConnect = async (providerName) => {
    const token = tokens[providerName]
    if (!token) {
      setMessages({
        ...messages,
        [providerName]: { type: 'error', text: 'Token is required' },
      })
      return
    }

    setConnecting({ ...connecting, [providerName]: true })

    try {
      const result = await apiClient.connectProvider(providerName, { token })
      setMessages({
        ...messages,
        [providerName]: { type: 'success', text: `Connected as ${result.userInfo?.email || 'User'}` },
      })
      setTokens({ ...tokens, [providerName]: '' })
      setTimeout(() => {
        setMessages({ ...messages, [providerName]: null })
      }, 3000)
    } catch (error) {
      setMessages({
        ...messages,
        [providerName]: { type: 'error', text: error?.message || 'Connection failed' },
      })
    } finally {
      setConnecting({ ...connecting, [providerName]: false })
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <Loader2 className="w-8 h-8 animate-spin" />
      </div>
    )
  }

  return (
    <div className="flex flex-col h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      {/* Header */}
      <div className="bg-white border-b border-slate-200 p-6">
        <h1 className="text-3xl font-bold text-slate-900">Cloud Providers</h1>
        <p className="text-slate-600 mt-1">Connect your deployment providers to CloudDeck</p>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-auto p-6">
        <div className="max-w-4xl mx-auto space-y-6">
          {providers.map((provider) => (
            <Card key={provider.name} className="border border-slate-200">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-xl">{provider.displayName}</CardTitle>
                    <p className="text-sm text-slate-500 mt-1">{provider.description}</p>
                  </div>
                  <div className="text-3xl font-bold text-slate-200">{provider.displayName.charAt(0)}</div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Provider-specific instructions */}
                <div className="bg-blue-50 border border-blue-200 p-3 rounded-lg">
                  <p className="text-sm font-semibold text-blue-900 mb-2">Setup Instructions:</p>
                  <div className="text-sm text-blue-800 space-y-1">
                    {provider.name === 'Vercel' && (
                      <>
                        <p>1. Visit https://vercel.com/account/tokens</p>
                        <p>2. Create a new API token (Full Access recommended)</p>
                        <p>3. Paste the token below</p>
                      </>
                    )}
                    {provider.name === 'Netlify' && (
                      <>
                        <p>1. Visit https://app.netlify.com/user/applications</p>
                        <p>2. Create a new personal access token</p>
                        <p>3. Paste the token below</p>
                      </>
                    )}
                    {provider.name === 'Render' && (
                      <>
                        <p>1. Visit https://dashboard.render.com/account/api-tokens</p>
                        <p>2. Create a new API token</p>
                        <p>3. Paste the key below</p>
                      </>
                    )}
                  </div>
                </div>

                {/* Token input */}
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-slate-700">API Token / Key</label>
                  <Input
                    type="password"
                    placeholder={`Enter your ${provider.displayName} token`}
                    value={tokens[provider.name] || ''}
                    onChange={(e) => setTokens({ ...tokens, [provider.name]: e.target.value })}
                    disabled={connecting[provider.name]}
                    className="font-mono text-xs"
                  />
                  <p className="text-xs text-slate-500">Your token will be securely stored and never shared.</p>
                </div>

                {/* Message */}
                {messages[provider.name] && (
                  <div className={`flex items-center gap-2 p-2 rounded-lg ${
                    messages[provider.name].type === 'success'
                      ? 'bg-green-50 text-green-700'
                      : 'bg-red-50 text-red-700'
                  }`}>
                    {messages[provider.name].type === 'success' ? (
                      <CheckCircle className="w-4 h-4" />
                    ) : (
                      <AlertCircle className="w-4 h-4" />
                    )}
                    <span className="text-sm">{messages[provider.name].text}</span>
                  </div>
                )}

                {/* Action */}
                <Button
                  onClick={() => handleConnect(provider.name)}
                  disabled={connecting[provider.name] || !tokens[provider.name]}
                  className="w-full"
                >
                  {connecting[provider.name] && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                  {connecting[provider.name] ? 'Connecting...' : `Connect ${provider.displayName}`}
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  )
}
