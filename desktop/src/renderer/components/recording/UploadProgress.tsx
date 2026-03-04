import { useState } from 'react'
import { UploadIcon, CheckCircleIcon, LinkIcon, ClipboardIcon, CheckIcon, RecordIcon } from '../icons'

interface UploadProgressProps {
  progress: number
  shareURL: string | null
  onNewRecording: () => void
}

function truncateURL(url: string): string {
  try {
    const u = new URL(url)
    const path = u.pathname.length > 8 ? u.pathname.slice(0, 8) + '...' : u.pathname
    return u.host + path
  } catch {
    return url
  }
}

export default function UploadProgress({ progress, shareURL, onNewRecording }: UploadProgressProps) {
  const isComplete = progress >= 100
  const [copied, setCopied] = useState(false)

  const copyToClipboard = async () => {
    if (!shareURL) return
    await navigator.clipboard.writeText(shareURL)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="flex flex-col items-center justify-center h-full p-8 relative overflow-hidden">
      {/* Background brand accent — subtle jamakkalam stripes faded out */}
      {isComplete && (
        <div className="jamakkalam-stripes jamakkalam-stripes-animated absolute inset-0 opacity-[0.14] pointer-events-none" />
      )}

      {isComplete ? (
        <>
          {/* Large success icon with brand glow */}
          <div className="relative mb-6">
            <div className="absolute inset-0 rounded-full bg-[var(--emerald)]/20 blur-xl scale-150" />
            <CheckCircleIcon className="w-16 h-16 text-[var(--emerald)] relative" />
          </div>

          <h2 className="text-2xl font-bold text-zinc-100 mb-2">
            Upload Complete!
          </h2>
          <p className="text-base text-zinc-500 mb-8">Your recording is ready to share</p>
        </>
      ) : (
        <>
          <UploadIcon className="w-14 h-14 text-[var(--crimson)] animate-pulse mb-6" />
          <h2 className="text-2xl font-bold text-zinc-100 mb-8">
            Uploading...
          </h2>
          <div className="w-full max-w-sm bg-zinc-800/60 rounded-full h-2.5 mb-3">
            <div
              className="bg-[var(--crimson)] h-2.5 rounded-full transition-all duration-300"
              style={{ width: `${progress}%` }}
            />
          </div>
          <p className="text-base text-zinc-500 font-mono">{progress}%</p>
        </>
      )}

      {shareURL && (
        <div className="flex flex-col items-center gap-5 w-full max-w-xs">
          {/* Share link with inline copy button */}
          <div className="flex items-center gap-2 bg-zinc-800/50 rounded-lg px-4 py-2.5 w-full justify-center">
            <LinkIcon className="w-4 h-4 text-zinc-500 shrink-0" />
            <a
              href={shareURL}
              target="_blank"
              rel="noopener noreferrer"
              className="text-[var(--crimson)] hover:brightness-110 text-base font-medium truncate"
            >
              {truncateURL(shareURL)}
            </a>
            <button
              onClick={copyToClipboard}
              className={`group/copy relative shrink-0 p-1.5 rounded-md transition-colors ${
                copied
                  ? 'text-[var(--emerald)] bg-[var(--emerald)]/10'
                  : 'text-zinc-500 hover:text-zinc-200 hover:bg-zinc-700'
              }`}
            >
              {copied ? (
                <CheckIcon className="w-3.5 h-3.5" />
              ) : (
                <ClipboardIcon className="w-3.5 h-3.5" />
              )}
              <span className="pointer-events-none absolute -top-9 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-md bg-zinc-900 border border-zinc-700 px-2.5 py-1 text-xs font-medium text-zinc-200 opacity-0 transition-opacity group-hover/copy:opacity-100">
                {copied ? 'Copied!' : 'Copy to clipboard'}
              </span>
            </button>
          </div>

          {/* New Recording — primary action */}
          <button
            onClick={onNewRecording}
            className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-[var(--crimson)] text-white rounded-lg text-base font-semibold transition-all hover:brightness-110 active:scale-[0.97]"
          >
            <RecordIcon className="w-5 h-5" />
            New Recording
          </button>
        </div>
      )}
    </div>
  )
}
