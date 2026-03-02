import { useState, useRef } from 'react'
import type { AppSettings } from '../lib/types'
import appIcon from '../assets/icon-128.png'

interface Props {
  onConnect: (settings: AppSettings) => void
}

export default function SetupWizard({ onConnect }: Props) {
  const [serviceAccountJson, setServiceAccountJson] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [connecting, setConnecting] = useState(false)
  const [fileName, setFileName] = useState<string | null>(null)
  const [dragOver, setDragOver] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const isFormValid = serviceAccountJson.trim() !== ''

  function handleFile(file: File) {
    setError(null)
    const reader = new FileReader()
    reader.onload = (e) => {
      const text = e.target?.result as string
      setServiceAccountJson(text)
      setFileName(file.name)
    }
    reader.readAsText(file)
  }

  function removeFile() {
    setServiceAccountJson('')
    setFileName(null)
    setError(null)
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  async function handleConnect() {
    setError(null)
    setConnecting(true)

    // Validate JSON format
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
    <div className="flex flex-col items-center justify-center h-screen px-10">
      <img src={appIcon} alt="Thari.video" className="w-20 h-20 mb-4 rounded-2xl" />
      <div className="font-mono text-3xl font-bold tracking-tight mb-2">
        <span className="text-[var(--cotton)]">thari</span>
        <span className="text-[var(--cotton)]/40">.video</span>
      </div>
      <p className="text-zinc-400 mb-2">Connect your Firebase project to get started.</p>
      <div className="stripe-divider h-[3px] w-32 mb-8 rounded-full" />

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
          {fileName ? (
            <div className="w-full px-4 py-4 bg-zinc-800 border border-zinc-700 rounded-lg flex items-center justify-between">
              <div className="flex items-center gap-2 min-w-0">
                <svg className="w-5 h-5 text-emerald-400 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span className="text-sm text-zinc-300 truncate">{fileName}</span>
              </div>
              <button
                type="button"
                onClick={removeFile}
                className="text-zinc-500 hover:text-zinc-300 transition-colors ml-3 shrink-0"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          ) : (
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
          )}
          <p className="text-xs text-zinc-500 mt-1">
            Download from Firebase Console → Project Settings → Service Accounts → Generate New Private Key
          </p>
        </div>

        {error && (
          <p data-testid="error-message" className="text-red-400 text-sm">
            {error}
          </p>
        )}

        <button
          data-testid="connect-button"
          onClick={handleConnect}
          disabled={!isFormValid || connecting}
          className="w-full py-2 px-4 bg-[var(--crimson)] hover:brightness-110 hover:shadow-[0_0_20px_rgba(217,43,43,0.25)] active:scale-[0.97] disabled:bg-zinc-700 disabled:text-zinc-500 rounded-lg font-medium transition-all"
        >
          {connecting ? 'Connecting...' : 'Connect'}
        </button>

      </div>
    </div>
  )
}
