import { useState, useCallback, useRef } from 'react'
import type { PipConfig } from '../../lib/types'
import { DEFAULT_PIP_CONFIG } from '../../lib/types'
import { CameraIcon } from './icons'

interface Props {
  onContinue: (pipConfig: PipConfig) => void
  onBack: () => void
}

const MIN_SIZE = 0.05
const MAX_SIZE = 0.25
const SIZE_STEP = 0.02

const CORNER_PRESETS: { label: string; x: number; y: number }[] = [
  { label: 'TL', x: 0.15, y: 0.15 },
  { label: 'TR', x: 0.85, y: 0.15 },
  { label: 'BL', x: 0.15, y: 0.85 },
  { label: 'BR', x: 0.85, y: 0.85 },
]

export default function PipLayoutPreview({ onContinue, onBack }: Props) {
  const [config, setConfig] = useState<PipConfig>(DEFAULT_PIP_CONFIG)
  const containerRef = useRef<HTMLDivElement>(null)
  const draggingRef = useRef(false)

  const clamp = (val: number, min: number, max: number) => Math.min(max, Math.max(min, val))

  const handlePointerDown = useCallback((e: React.PointerEvent) => {
    draggingRef.current = true
    ;(e.target as HTMLElement).setPointerCapture(e.pointerId)
  }, [])

  const handlePointerMove = useCallback((e: React.PointerEvent) => {
    if (!draggingRef.current || !containerRef.current) return
    const rect = containerRef.current.getBoundingClientRect()
    const halfSize = config.size / 2
    const nx = clamp((e.clientX - rect.left) / rect.width, halfSize, 1 - halfSize)
    const ny = clamp((e.clientY - rect.top) / rect.height, halfSize, 1 - halfSize)
    setConfig((prev) => ({ ...prev, x: nx, y: ny }))
  }, [config.size])

  const handlePointerUp = useCallback(() => {
    draggingRef.current = false
  }, [])

  const adjustSize = (delta: number) => {
    setConfig((prev) => {
      const newSize = clamp(prev.size + delta, MIN_SIZE, MAX_SIZE)
      const halfSize = newSize / 2
      return {
        size: newSize,
        x: clamp(prev.x, halfSize, 1 - halfSize),
        y: clamp(prev.y, halfSize, 1 - halfSize),
      }
    })
  }

  const snapToCorner = (cx: number, cy: number) => {
    setConfig((prev) => ({ ...prev, x: cx, y: cy }))
  }

  // Convert normalized to % for positioning
  const pipLeft = `${(config.x - config.size / 2) * 100}%`
  const pipTop = `${(config.y - config.size / 2) * 100}%`
  const pipW = `${config.size * 100}%`

  return (
    <div className="flex flex-col items-center justify-center h-full p-6 gap-5">
      <div className="text-center">
        <h2 className="text-lg font-bold text-zinc-100 mb-1">Camera Position</h2>
        <p className="text-xs text-zinc-500">Drag the circle to position your camera</p>
      </div>

      {/* Screen mockup (16:9) */}
      <div
        ref={containerRef}
        className="relative w-full max-w-[300px] bg-zinc-900 rounded-lg border border-zinc-700 overflow-hidden select-none"
        style={{ aspectRatio: '16 / 9' }}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
      >
        {/* Rule-of-thirds grid */}
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute left-1/3 top-0 bottom-0 w-px bg-zinc-700/40" />
          <div className="absolute left-2/3 top-0 bottom-0 w-px bg-zinc-700/40" />
          <div className="absolute top-1/3 left-0 right-0 h-px bg-zinc-700/40" />
          <div className="absolute top-2/3 left-0 right-0 h-px bg-zinc-700/40" />
        </div>

        {/* Draggable PIP circle */}
        <div
          className="absolute rounded-full bg-zinc-700 border-2 border-white/30 flex items-center justify-center cursor-grab active:cursor-grabbing touch-none"
          style={{ left: pipLeft, top: pipTop, width: pipW, aspectRatio: '1', }}
          onPointerDown={handlePointerDown}
        >
          <CameraIcon className="w-5 h-5 text-zinc-400 pointer-events-none" />
        </div>
      </div>

      {/* Size controls */}
      <div className="flex items-center gap-3">
        <button
          onClick={() => adjustSize(-SIZE_STEP)}
          disabled={config.size <= MIN_SIZE}
          className="w-8 h-8 rounded-full bg-zinc-800 text-zinc-300 hover:bg-zinc-700 disabled:opacity-30 disabled:hover:bg-zinc-800 text-lg font-medium transition-colors"
        >
          −
        </button>
        <span className="text-xs text-zinc-400 w-12 text-center">{Math.round(config.size * 100)}%</span>
        <button
          onClick={() => adjustSize(SIZE_STEP)}
          disabled={config.size >= MAX_SIZE}
          className="w-8 h-8 rounded-full bg-zinc-800 text-zinc-300 hover:bg-zinc-700 disabled:opacity-30 disabled:hover:bg-zinc-800 text-lg font-medium transition-colors"
        >
          +
        </button>
      </div>

      {/* Corner presets */}
      <div className="flex items-center gap-2">
        {CORNER_PRESETS.map((p) => (
          <button
            key={p.label}
            onClick={() => snapToCorner(p.x, p.y)}
            className={`px-2.5 py-1 text-[10px] font-medium rounded transition-colors ${
              Math.abs(config.x - p.x) < 0.05 && Math.abs(config.y - p.y) < 0.05
                ? 'bg-[var(--emerald)]/20 text-[var(--emerald)]'
                : 'bg-zinc-800 text-zinc-400 hover:bg-zinc-700'
            }`}
          >
            {p.label}
          </button>
        ))}
      </div>

      {/* Action buttons */}
      <div className="flex items-center gap-3">
        <button
          onClick={onBack}
          className="px-5 py-2.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 rounded-lg text-sm font-medium transition-colors"
        >
          Back
        </button>
        <button
          onClick={() => onContinue(config)}
          className="px-5 py-2.5 bg-[var(--crimson)] hover:brightness-110 active:scale-[0.97] text-white rounded-lg text-sm font-semibold transition-all"
        >
          Continue
        </button>
      </div>
    </div>
  )
}
