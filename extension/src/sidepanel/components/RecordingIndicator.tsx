import { useState } from 'react'
import { MicIcon, MicOffIcon, StopIcon } from './icons'

interface Props {
  elapsed: number
}

function formatTime(seconds: number): string {
  const m = Math.floor(seconds / 60)
    .toString()
    .padStart(2, '0')
  const s = (seconds % 60).toString().padStart(2, '0')
  return `${m}:${s}`
}

export default function RecordingIndicator({ elapsed }: Props) {
  const [micMuted, setMicMuted] = useState(false)

  const handleMicToggle = () => {
    const newMuted = !micMuted
    setMicMuted(newMuted)
    chrome.runtime.sendMessage({ type: 'SET_MIC_MUTED', muted: newMuted })
  }

  const handleStop = () => {
    chrome.runtime.sendMessage({ type: 'STOP_RECORDING' })
  }

  return (
    <div className="flex flex-col items-center justify-center h-full p-8">
      {/* Pulsing red dot and timer */}
      <div className="flex items-center gap-3 mb-10">
        <span className="w-4 h-4 rounded-full bg-[var(--crimson)] animate-pulse" />
        <span className="font-mono text-4xl font-bold text-[var(--crimson)]">
          {formatTime(elapsed)}
        </span>
      </div>

      {/* Recording status text */}
      <p className="text-sm text-zinc-400 mb-8">Recording in progress...</p>

      {/* Controls */}
      <div className="flex items-center gap-6">
        <button
          onClick={handleMicToggle}
          title={micMuted ? 'Unmute mic' : 'Mute mic'}
          className={`p-3 rounded-full transition-all ${
            micMuted
              ? 'bg-[var(--crimson)]/20 text-[var(--crimson)]'
              : 'text-[var(--emerald)] hover:bg-zinc-800'
          }`}
        >
          {micMuted ? (
            <MicOffIcon className="w-6 h-6" />
          ) : (
            <MicIcon className="w-6 h-6" />
          )}
        </button>

        <button
          onClick={handleStop}
          title="Stop recording"
          className="p-4 rounded-full bg-[var(--crimson)] text-white transition-all hover:brightness-110 hover:shadow-[0_0_20px_rgba(217,43,43,0.3)]"
        >
          <StopIcon className="w-7 h-7" />
        </button>
      </div>
    </div>
  )
}
