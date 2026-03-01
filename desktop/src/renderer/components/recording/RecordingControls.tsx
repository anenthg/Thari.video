import { useRef, useEffect, useState } from 'react'
import { MicIcon, MicOffIcon, StopIcon } from '../icons'

interface RecordingControlsProps {
  canvas: HTMLCanvasElement
  elapsedSeconds: number
  onStop: () => void
  onToggleMic: (muted: boolean) => void
}

function formatTime(seconds: number): string {
  const m = Math.floor(seconds / 60)
    .toString()
    .padStart(2, '0')
  const s = (seconds % 60).toString().padStart(2, '0')
  return `${m}:${s}`
}

export default function RecordingControls({
  canvas,
  elapsedSeconds,
  onStop,
  onToggleMic,
}: RecordingControlsProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const [micMuted, setMicMuted] = useState(false)

  useEffect(() => {
    const container = containerRef.current
    if (container && canvas) {
      canvas.style.width = '100%'
      canvas.style.height = '100%'
      canvas.style.objectFit = 'contain'
      canvas.style.borderRadius = '8px'
      container.appendChild(canvas)
      return () => {
        if (container.contains(canvas)) {
          container.removeChild(canvas)
        }
      }
    }
  }, [canvas])

  const handleMicToggle = () => {
    const newMuted = !micMuted
    setMicMuted(newMuted)
    onToggleMic(newMuted)
  }

  return (
    <div className="flex flex-col h-full p-4">
      <div
        ref={containerRef}
        className="flex-1 bg-black rounded-lg overflow-hidden mb-4"
      />

      <div className="flex items-center justify-center gap-4">
        <div className="flex items-center gap-2 text-[var(--crimson)]">
          <span className="w-3 h-3 rounded-full bg-[var(--crimson)] animate-pulse" />
          <span className="font-mono text-lg">{formatTime(elapsedSeconds)}</span>
        </div>

        <button
          onClick={handleMicToggle}
          title={micMuted ? 'Unmute mic' : 'Mute mic'}
          className={`p-2.5 rounded-full transition-colors ${
            micMuted
              ? 'bg-[var(--crimson)]/20 text-[var(--crimson)]'
              : 'text-[var(--emerald)] hover:bg-zinc-800'
          }`}
        >
          {micMuted ? <MicOffIcon className="w-5 h-5" /> : <MicIcon className="w-5 h-5" />}
        </button>

        <button
          onClick={onStop}
          title="Stop recording"
          className="p-2.5 rounded-full bg-[var(--crimson)] text-white transition-all hover:brightness-110"
        >
          <StopIcon className="w-5 h-5" />
        </button>
      </div>
    </div>
  )
}
