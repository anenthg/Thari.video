import { useState, useRef } from 'react'
import type { AppSettings } from '../lib/types'
import appIcon from '../assets/icon-128.png'
import iamHelpImg from '../assets/iam-help.png'

interface Props {
  onConnect: (settings: AppSettings) => void
}

export default function SetupWizard({ onConnect }: Props) {
  const [serviceAccountJson, setServiceAccountJson] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [connecting, setConnecting] = useState(false)
  const [fileName, setFileName] = useState<string | null>(null)
  const [dragOver, setDragOver] = useState(false)
  const [projectId, setProjectId] = useState<string | null>(null)
  const [step, setStep] = useState<'upload' | 'prerequisites'>('upload')
  const [showHelp, setShowHelp] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  function handleFile(file: File) {
    setError(null)
    const reader = new FileReader()
    reader.onload = (e) => {
      const text = e.target?.result as string
      setServiceAccountJson(text)
      setFileName(file.name)
      try {
        const parsed = JSON.parse(text)
        if (parsed.project_id) {
          setProjectId(parsed.project_id)
          setStep('prerequisites')
        } else {
          setProjectId(null)
          setError('Invalid Service Account JSON. Missing project_id field.')
        }
      } catch {
        setProjectId(null)
        setError('Invalid JSON format.')
      }
    }
    reader.readAsText(file)
  }

  function handleBack() {
    setStep('upload')
    setServiceAccountJson('')
    setFileName(null)
    setProjectId(null)
    setError(null)
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  async function handleConnect() {
    setError(null)
    setConnecting(true)

    try {
      const parsed = JSON.parse(serviceAccountJson)
      if (!parsed.project_id || !parsed.private_key || !parsed.client_email) {
        setError('Invalid Service Account JSON. Missing required fields (project_id, private_key, client_email).')
        setConnecting(false)
        return
      }
    } catch {
      setError('Invalid JSON format. Please paste a valid Service Account JSON.')
      setConnecting(false)
      return
    }

    try {
      const result = await Promise.race([
        window.api.validateFirebaseConnection(serviceAccountJson),
        new Promise<{ ok: false; error: string }>((_, reject) =>
          setTimeout(() => reject(new Error('Connection timed out. Check your Service Account and try again.')), 15000),
        ),
      ])

      if (!result.ok) {
        setError(result.error ?? 'Connection failed')
        setConnecting(false)
        return
      }

      const settings: AppSettings = {
        firebaseProjectId: result.projectId,
        serviceAccountJson,
        isProvisioned: false,
      }

      await window.api.saveSettings(settings)
      setConnecting(false)
      onConnect(settings)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Connection failed. Please try again.')
      setConnecting(false)
    }
  }

  return (
    <div className="flex flex-col h-screen">
      <div className="stripe-divider h-[3px] shrink-0" />
      <div className="flex-1 flex flex-col items-center justify-center px-10">
        <img src={appIcon} alt="OpenLoom" className="w-20 h-20 mb-4 rounded-2xl" />
        <div className="font-mono text-3xl font-bold tracking-tight mb-2">
          <span className="text-[var(--cotton)]">Open</span>
          <span className="text-[var(--cotton)]/40">Loom</span>
        </div>

        {step === 'upload' && (
          <>
            <p className="text-zinc-400 mb-8">Connect your Firebase project to get started.</p>

            <div className="w-full max-w-md space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">
                  Service Account JSON
                </label>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".json"
                  className="hidden"
                  data-testid="service-account-json"
                  onChange={(e) => {
                    const file = e.target.files?.[0]
                    if (file) handleFile(file)
                  }}
                />
                <div
                  onClick={() => fileInputRef.current?.click()}
                  onDragOver={(e) => { e.preventDefault(); setDragOver(true) }}
                  onDragLeave={() => setDragOver(false)}
                  onDrop={(e) => {
                    e.preventDefault()
                    setDragOver(false)
                    const file = e.dataTransfer.files[0]
                    if (file) handleFile(file)
                  }}
                  className={`w-full px-4 py-8 bg-zinc-800 border-2 border-dashed rounded-lg cursor-pointer transition-colors text-center ${
                    dragOver
                      ? 'border-[var(--crimson)] bg-[var(--crimson)]/5'
                      : 'border-zinc-700 hover:border-zinc-500'
                  }`}
                >
                  <svg className="w-8 h-8 mx-auto mb-2 text-zinc-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m6.75 12l-3-3m0 0l-3 3m3-3v6m-1.5-15H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
                  </svg>
                  <p className="text-sm text-zinc-400">
                    Drop your Service Account JSON file here, or <span className="text-[var(--crimson)]">click to browse</span>
                  </p>
                </div>
                <p className="text-xs text-zinc-500 mt-1">
                  Download from Firebase Console → Project Settings → Service Accounts → Generate New Private Key
                </p>
              </div>

              {error && (
                <p data-testid="error-message" className="text-red-400 text-sm">
                  {error}
                </p>
              )}
            </div>
          </>
        )}

        {step === 'prerequisites' && projectId && (
          <>
            <p className="text-zinc-400 mb-2">
              Project: <span className="font-mono text-zinc-300">{projectId}</span>
            </p>
            <p className="text-zinc-500 text-sm mb-8">
              Ensure these are configured before continuing.
            </p>

            <div className="w-full max-w-md space-y-4">
              <div className="rounded-lg border border-zinc-700 bg-zinc-800/50 p-4 space-y-3">
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <p className="text-xs text-zinc-400">IAM roles on the service account:</p>
                    <button
                      onClick={() => setShowHelp(true)}
                      className="text-xs text-zinc-400 border-b border-dotted border-zinc-500 hover:text-zinc-300 transition-colors"
                    >
                      Help
                    </button>
                  </div>
                  <p className="text-xs text-zinc-500 mb-2">
                    In the IAM page, find the <span className="text-zinc-300">firebase-adminsdk</span> service account and add these roles:
                  </p>
                  <div className="space-y-1 mb-2">
                    {['Cloud Functions Developer', 'Service Account User', 'Cloud Run Admin'].map((role) => (
                      <div key={role} className="flex items-center gap-2 text-xs text-zinc-300">
                        <span className="text-zinc-500">○</span>
                        {role}
                      </div>
                    ))}
                  </div>
                  <button
                    onClick={() => window.open(`https://console.cloud.google.com/iam-admin/iam?project=${projectId}`)}
                    className="text-xs text-[var(--mustard)] hover:text-[var(--mustard)]/80 transition-colors"
                  >
                    Go to IAM page →
                  </button>
                </div>

                <div className="border-t border-zinc-700 pt-3">
                  <p className="text-xs text-zinc-400 mb-1.5">APIs that must be enabled:</p>
                  <div className="space-y-1">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2 text-xs text-zinc-300">
                        <span className="text-zinc-500">○</span>
                        Cloud Functions API
                      </div>
                      <button
                        onClick={() => window.open(`https://console.cloud.google.com/apis/library/cloudfunctions.googleapis.com?project=${projectId}`)}
                        className="text-xs text-[var(--mustard)] hover:text-[var(--mustard)]/80 transition-colors"
                      >
                        Enable →
                      </button>
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2 text-xs text-zinc-300">
                        <span className="text-zinc-500">○</span>
                        Cloud Build API
                      </div>
                      <button
                        onClick={() => window.open(`https://console.cloud.google.com/apis/library/cloudbuild.googleapis.com?project=${projectId}`)}
                        className="text-xs text-[var(--mustard)] hover:text-[var(--mustard)]/80 transition-colors"
                      >
                        Enable →
                      </button>
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2 text-xs text-zinc-300">
                        <span className="text-zinc-500">○</span>
                        Cloud Run Admin API
                      </div>
                      <button
                        onClick={() => window.open(`https://console.cloud.google.com/apis/library/run.googleapis.com?project=${projectId}`)}
                        className="text-xs text-[var(--mustard)] hover:text-[var(--mustard)]/80 transition-colors"
                      >
                        Enable →
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              {error && (
                <p data-testid="error-message" className="text-red-400 text-sm">
                  {error}
                </p>
              )}

              <button
                data-testid="connect-button"
                onClick={handleConnect}
                disabled={connecting}
                className="w-full py-2 px-4 bg-[var(--crimson)] hover:brightness-110 hover:shadow-[0_0_20px_rgba(217,43,43,0.25)] active:scale-[0.97] disabled:bg-zinc-700 disabled:text-zinc-500 rounded-lg font-medium transition-all"
              >
                {connecting ? 'Connecting...' : 'Continue'}
              </button>

              <button
                onClick={handleBack}
                disabled={connecting}
                className="w-full py-2 px-4 text-zinc-500 hover:text-zinc-300 text-sm font-medium transition-colors disabled:opacity-50"
              >
                ← Change service account
              </button>
            </div>
          </>
        )}
      </div>

      {showHelp && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm"
          onClick={() => setShowHelp(false)}
        >
          <div
            className="relative mx-6 max-w-2xl rounded-xl border border-zinc-700 bg-[var(--warp-indigo)] p-4 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-3">
              <p className="text-sm font-medium text-[var(--cotton)]">How to assign IAM roles</p>
              <button
                onClick={() => setShowHelp(false)}
                className="text-zinc-500 hover:text-zinc-300 transition-colors"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <img
              src={iamHelpImg}
              alt="Step 1: Find the firebase-adminsdk service account. Step 2: Add the required roles."
              className="rounded-lg w-full"
            />
          </div>
        </div>
      )}
    </div>
  )
}
