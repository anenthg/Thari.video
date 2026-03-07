import type { PipConfig } from '../types'

export interface CanvasCompositor {
  canvas: HTMLCanvasElement
  stream: MediaStream
  capturePreviewFrame: (maxWidth: number) => string | null
  dispose: () => void
}

export function createCanvasCompositor(
  screenStream: MediaStream,
  cameraStream: MediaStream | null,
  maxW: number = 1920,
  maxH: number = 1080,
  pipConfig?: PipConfig,
): CanvasCompositor {
  const screenTrack = screenStream.getVideoTracks()[0]
  const screenSettings = screenTrack.getSettings()

  const srcW = screenSettings.width || maxW
  const srcH = screenSettings.height || maxH
  const scale = Math.min(1, maxW / srcW, maxH / srcH)
  const w = Math.round(srcW * scale)
  const h = Math.round(srcH * scale)

  const canvas = document.createElement('canvas')
  canvas.width = w
  canvas.height = h
  const ctx = canvas.getContext('2d')!

  const screenVideo = document.createElement('video')
  screenVideo.srcObject = screenStream
  screenVideo.muted = true
  screenVideo.play()

  let cameraVideo: HTMLVideoElement | null = null
  if (cameraStream) {
    cameraVideo = document.createElement('video')
    cameraVideo.srcObject = cameraStream
    cameraVideo.muted = true
    cameraVideo.play()
  }

  const pipDiameter = pipConfig ? Math.round(pipConfig.size * w) : 160
  const pipRadius = pipDiameter / 2
  const pipX = pipConfig
    ? Math.round(pipConfig.x * w - pipRadius)
    : w - pipDiameter - 20
  const pipY = pipConfig
    ? Math.round(pipConfig.y * h - pipRadius)
    : h - pipDiameter - 20

  const stream = canvas.captureStream(30)

  const interval = setInterval(() => {
    if (screenVideo.readyState >= 2) {
      ctx.drawImage(screenVideo, 0, 0, w, h)
    } else {
      ctx.fillStyle = '#000'
      ctx.fillRect(0, 0, w, h)
    }

    if (cameraVideo && cameraVideo.readyState >= 2) {
      ctx.save()
      ctx.beginPath()
      ctx.arc(pipX + pipRadius, pipY + pipRadius, pipRadius, 0, Math.PI * 2)
      ctx.closePath()
      ctx.clip()

      const camW = cameraVideo.videoWidth
      const camH = cameraVideo.videoHeight
      const camScale = Math.max(pipDiameter / camW, pipDiameter / camH) * 1.15
      const drawW = camW * camScale
      const drawH = camH * camScale
      const offsetX = pipX + (pipDiameter - drawW) / 2
      const offsetY = pipY + (pipDiameter - drawH) / 2
      ctx.drawImage(cameraVideo, offsetX, offsetY, drawW, drawH)

      ctx.restore()

      ctx.beginPath()
      ctx.arc(pipX + pipRadius, pipY + pipRadius, pipRadius, 0, Math.PI * 2)
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.3)'
      ctx.lineWidth = 2
      ctx.stroke()
    }
  }, 33)

  const previewCanvas = document.createElement('canvas')
  const previewCtx = previewCanvas.getContext('2d')!

  return {
    canvas,
    stream,
    capturePreviewFrame(maxWidth: number): string | null {
      if (w === 0 || h === 0) return null
      const scale = Math.min(1, maxWidth / w)
      const pw = Math.round(w * scale)
      const ph = Math.round(h * scale)
      if (previewCanvas.width !== pw) previewCanvas.width = pw
      if (previewCanvas.height !== ph) previewCanvas.height = ph
      previewCtx.drawImage(canvas, 0, 0, pw, ph)
      return previewCanvas.toDataURL('image/jpeg', 0.5)
    },
    dispose() {
      clearInterval(interval)
      screenVideo.pause()
      screenVideo.srcObject = null
      if (cameraVideo) {
        cameraVideo.pause()
        cameraVideo.srcObject = null
      }
    },
  }
}
