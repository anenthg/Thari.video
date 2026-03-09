export interface Recorder {
  start: () => void
  stop: () => Promise<Blob>
  dispose: () => void
  getSize: () => number
}

export function createRecorder(
  videoStream: MediaStream,
  audioStream: MediaStream | null,
  videoBitsPerSecond: number = 2_500_000,
): Recorder {
  const videoTracks = videoStream.getVideoTracks()
  const audioTracks = audioStream ? audioStream.getAudioTracks() : []
  const combinedStream = new MediaStream([...videoTracks, ...audioTracks])

  const mimeType = MediaRecorder.isTypeSupported('video/webm;codecs=vp9,opus')
    ? 'video/webm;codecs=vp9,opus'
    : MediaRecorder.isTypeSupported('video/webm;codecs=vp8,opus')
      ? 'video/webm;codecs=vp8,opus'
      : 'video/webm'

  const mediaRecorder = new MediaRecorder(combinedStream, {
    mimeType,
    videoBitsPerSecond,
  })

  const chunks: Blob[] = []
  let accumulatedSize = 0

  mediaRecorder.ondataavailable = (e) => {
    if (e.data.size > 0) {
      chunks.push(e.data)
      accumulatedSize += e.data.size
    }
  }

  mediaRecorder.onerror = (e) => {
    console.error('[recorder] MediaRecorder error:', e)
  }

  let resolveStop: ((blob: Blob) => void) | null = null

  mediaRecorder.onstop = () => {
    resolveStop?.(new Blob(chunks, { type: mimeType }))
  }

  return {
    start() {
      chunks.length = 0
      accumulatedSize = 0
      mediaRecorder.start(1000)
    },
    stop() {
      return new Promise<Blob>((resolve) => {
        resolveStop = resolve
        if (mediaRecorder.state === 'recording') {
          mediaRecorder.requestData()
        }
        mediaRecorder.stop()
      })
    },
    getSize() {
      return accumulatedSize
    },
    dispose() {
      if (mediaRecorder.state !== 'inactive') {
        mediaRecorder.stop()
      }
    },
  }
}
