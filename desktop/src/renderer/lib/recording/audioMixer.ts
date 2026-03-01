export interface AudioMixer {
  destination: MediaStreamAudioDestinationNode
  setMicMuted: (muted: boolean) => void
  dispose: () => void
}

export function createAudioMixer(
  systemStream: MediaStream | null,
  micStream: MediaStream | null,
): AudioMixer {
  const ctx = new AudioContext()
  // AudioContext may start suspended after an async gap — ensure it's running
  if (ctx.state !== 'running') ctx.resume()
  const destination = ctx.createMediaStreamDestination()

  let micGain: GainNode | null = null

  // Only connect system audio if it has live tracks
  const sysAudioTracks = systemStream?.getAudioTracks().filter((t) => t.readyState === 'live') ?? []
  if (sysAudioTracks.length > 0) {
    const liveSystemAudio = new MediaStream(sysAudioTracks)
    const systemSource = ctx.createMediaStreamSource(liveSystemAudio)
    systemSource.connect(destination)
  }

  // Only connect mic if it has live tracks
  const micAudioTracks = micStream?.getAudioTracks().filter((t) => t.readyState === 'live') ?? []
  if (micAudioTracks.length > 0) {
    const liveMicAudio = new MediaStream(micAudioTracks)
    const micSource = ctx.createMediaStreamSource(liveMicAudio)
    micGain = ctx.createGain()
    micGain.gain.value = 1
    micSource.connect(micGain)
    micGain.connect(destination)
  }

  return {
    destination,
    setMicMuted(muted: boolean) {
      if (micGain) micGain.gain.value = muted ? 0 : 1
    },
    dispose() {
      ctx.close()
    },
  }
}
