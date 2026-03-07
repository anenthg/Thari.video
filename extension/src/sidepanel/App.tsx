import { useState, useEffect, useCallback } from 'react'
import type { AppSettings } from '../lib/types'
import type { ExtensionMessage, StateUpdateMessage } from '../lib/messages'
import SetupWizard from './components/SetupWizard'
import Provisioning from './components/Provisioning'
import Layout from './components/Layout'

function isConfigured(s: AppSettings): boolean {
  const provider = s.provider || 'firebase'
  if (provider === 'convex') {
    return !!(s.convexDeployKey && s.convexDeploymentUrl)
  }
  if (provider === 'supabase') {
    return !!(s.supabaseProjectUrl && s.supabaseServiceRoleKey)
  }
  return !!(s.firebaseProjectId && s.serviceAccountJson)
}

async function sendMessage(msg: ExtensionMessage): Promise<unknown> {
  return chrome.runtime.sendMessage(msg)
}

export default function App() {
  const [settings, setSettings] = useState<AppSettings | null>(null)
  const [loading, setLoading] = useState(true)

  const loadSettings = useCallback(async () => {
    const result = await sendMessage({ type: 'GET_SETTINGS' }) as AppSettings
    if (!result.provider && (result as Record<string, unknown>).firebaseProjectId) {
      result.provider = 'firebase'
    }
    if (isConfigured(result)) {
      setSettings(result)
    }
    setLoading(false)
  }, [])

  useEffect(() => {
    loadSettings()

    // Listen for state updates from service worker
    const listener = (message: StateUpdateMessage) => {
      if (message.type === 'STATE_UPDATE' && message.settings) {
        setSettings(message.settings)
      }
    }
    chrome.runtime.onMessage.addListener(listener)
    return () => chrome.runtime.onMessage.removeListener(listener)
  }, [loadSettings])

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-zinc-500">Loading...</div>
      </div>
    )
  }

  if (!settings) {
    return (
      <SetupWizard
        onConnect={(s) => {
          setSettings(s)
        }}
      />
    )
  }

  if (isConfigured(settings) && !settings.isProvisioned) {
    return (
      <Provisioning
        settings={settings}
        onComplete={async () => {
          const updated = { ...settings, isProvisioned: true }
          await sendMessage({ type: 'SAVE_SETTINGS', settings: updated })
          setSettings(updated)
        }}
        onDisconnect={async () => {
          await sendMessage({ type: 'DISCONNECT' })
          setSettings(null)
        }}
      />
    )
  }

  return (
    <Layout
      settings={settings}
      onDisconnect={async () => {
        await sendMessage({ type: 'DISCONNECT' })
        setSettings(null)
      }}
      onReprovision={async () => {
        const updated = { ...settings, isProvisioned: false }
        setSettings(updated)
        await sendMessage({ type: 'SAVE_SETTINGS', settings: updated })
      }}
    />
  )
}
