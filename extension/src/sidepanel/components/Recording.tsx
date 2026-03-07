import { useState, useEffect, useCallback } from 'react'
import type { AppSettings, PipConfig, RecordingPhase } from '../../lib/types'
import type { StateUpdateMessage } from '../../lib/messages'
import RecordingSetup from './RecordingSetup'
import PipLayoutPreview from './PipLayoutPreview'
import RecordingIndicator from './RecordingIndicator'
import Countdown from './Countdown'
import ReviewPlayer from './ReviewPlayer'
import UploadProgress from './UploadProgress'

interface Props {
  settings: AppSettings
}

export default function Recording({ settings }: Props) {
  const [phase, setPhase] = useState<RecordingPhase>('idle')
  const [elapsed, setElapsed] = useState(0)
  const [blobId, setBlobId] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [shareURL, setShareURL] = useState<string | null>(null)
  const [uploadProgress, setUploadProgress] = useState(0)
  const [countdownValue, setCountdownValue] = useState(3)
  const [previewDataUrl, setPreviewDataUrl] = useState<string | null>(null)
  const [debugLogs, setDebugLogs] = useState<string[]>([])
  const [showPipLayout, setShowPipLayout] = useState(false)
  const [pendingRecordingConfig, setPendingRecordingConfig] = useState<{
    camera: boolean; mic: boolean; hd: boolean; cameraDeviceId?: string; micDeviceId?: string
  } | null>(null)

  // Request current state on mount
  useEffect(() => {
    chrome.runtime.sendMessage({ type: 'GET_STATE' })
  }, [])

  // Listen for state updates and debug logs
  useEffect(() => {
    const listener = (message: { type: string; state?: StateUpdateMessage['state']; settings?: StateUpdateMessage['settings']; message?: string; dataUrl?: string }) => {
      if (message.type === 'STATE_UPDATE' && message.state) {
        const s = message.state
        setPhase(s.phase)
        setElapsed(s.elapsed)
        setBlobId(s.blobId)
        setError(s.error)
        setShareURL(s.shareURL)
        setUploadProgress(s.uploadProgress)
      }
      if (message.type === 'PREVIEW_FRAME' && message.dataUrl) {
        setPreviewDataUrl(message.dataUrl)
      }
      if (message.type === 'DEBUG_LOG' && message.message) {
        setDebugLogs((prev) => [...prev.slice(-50), message.message!])
      }
    }

    chrome.runtime.onMessage.addListener(listener)
    return () => chrome.runtime.onMessage.removeListener(listener)
  }, [])

  // Clear debug logs when starting a new recording
  const clearLogs = useCallback(() => setDebugLogs([]), [])

  // Countdown timer (local, runs 3-2-1 then SW takes over)
  useEffect(() => {
    if (phase !== 'countdown') return
    setCountdownValue(3)

    const interval = setInterval(() => {
      setCountdownValue((prev) => {
        if (prev <= 1) {
          clearInterval(interval)
          return 1
        }
        return prev - 1
      })
    }, 1000)

    return () => clearInterval(interval)
  }, [phase])

  // Clear preview when leaving recording phase
  useEffect(() => {
    if (phase !== 'recording') {
      setPreviewDataUrl(null)
    }
  }, [phase])

  const handleRecordingStart = useCallback((config: {
    camera: boolean; mic: boolean; hd: boolean; cameraDeviceId?: string; micDeviceId?: string
  }) => {
    if (config.camera) {
      setPendingRecordingConfig(config)
      setShowPipLayout(true)
    } else {
      chrome.runtime.sendMessage({ type: 'START_RECORDING', ...config })
    }
  }, [])

  const handlePipContinue = useCallback((pipConfig: PipConfig) => {
    if (pendingRecordingConfig) {
      chrome.runtime.sendMessage({ type: 'START_RECORDING', ...pendingRecordingConfig, pipConfig })
    }
    setShowPipLayout(false)
    setPendingRecordingConfig(null)
  }, [pendingRecordingConfig])

  const handlePipBack = useCallback(() => {
    setShowPipLayout(false)
    setPendingRecordingConfig(null)
  }, [])

  const handleNewRecording = useCallback(() => {
    setPhase('idle')
    setBlobId(null)
    setShareURL(null)
    setUploadProgress(0)
    setError(null)
    setPreviewDataUrl(null)
    setDebugLogs([])
    chrome.runtime.sendMessage({ type: 'GET_STATE' })
  }, [])

  // Debug log panel (shown in all phases when there are logs)
  const debugPanel = debugLogs.length > 0 ? (
    <div className="fixed bottom-12 left-0 right-0 max-h-[40vh] overflow-y-auto bg-black/90 border-t border-zinc-700 p-2 z-50">
      <div className="flex items-center justify-between mb-1">
        <span className="text-[10px] font-mono text-zinc-500">DEBUG LOG ({debugLogs.length})</span>
        <button onClick={clearLogs} className="text-[10px] text-zinc-500 hover:text-zinc-300">Clear</button>
      </div>
      <div className="space-y-0.5">
        {debugLogs.map((log, i) => (
          <div key={i} className="text-[10px] font-mono text-zinc-400 leading-tight whitespace-pre-wrap break-all">
            {log}
          </div>
        ))}
      </div>
    </div>
  ) : null

  if (error) {
    return (
      <>
        <div className="flex flex-col items-center justify-center h-full p-8 text-center">
          <p className="text-red-400 text-sm mb-4">{error}</p>
          <button
            onClick={handleNewRecording}
            className="px-4 py-2 bg-zinc-700 hover:bg-zinc-600 rounded-lg text-sm font-medium transition-colors"
          >
            Try Again
          </button>
        </div>
        {debugPanel}
      </>
    )
  }

  let content: React.ReactNode

  if (showPipLayout) {
    content = <PipLayoutPreview onContinue={handlePipContinue} onBack={handlePipBack} />
  } else switch (phase) {
    case 'idle':
      content = <RecordingSetup onStart={handleRecordingStart} />
      break

    case 'countdown':
      content = <Countdown value={countdownValue} />
      break

    case 'recording':
      content = <RecordingIndicator elapsed={elapsed} previewDataUrl={previewDataUrl} />
      break

    case 'review':
      content = (
        <ReviewPlayer
          blobId={blobId!}
          duration={elapsed}
          onDiscard={handleNewRecording}
          onUpload={(title, password) => {
            chrome.runtime.sendMessage({
              type: 'UPLOAD_RECORDING',
              title,
              password,
            })
          }}
        />
      )
      break

    case 'uploading':
      content = (
        <UploadProgress
          progress={uploadProgress}
          shareURL={shareURL}
          onNewRecording={handleNewRecording}
        />
      )
      break

    default:
      content = <RecordingSetup onStart={handleRecordingStart} />
  }

  return (
    <>
      {content}
      {debugPanel}
    </>
  )
}
