import type { AppSettings } from './types'

export type StepStatus = 'pending' | 'running' | 'done' | 'error'

export interface ProvisioningStep {
  id: string
  label: string
  status: StepStatus
  error?: string
}

interface StepResult {
  ok: boolean
  error?: string
}

async function verifyFirestore(): Promise<StepResult> {
  try {
    const result = await window.api.firestoreQuery('videos', 'created_at', 'desc')
    if (!result.ok) {
      return { ok: false, error: result.error }
    }
    return { ok: true }
  } catch (e) {
    return { ok: false, error: `Firestore verification failed: ${e instanceof Error ? e.message : String(e)}` }
  }
}

async function verifyStorage(): Promise<StepResult> {
  try {
    const result = await window.api.storageGetPublicUrl('videos/__probe__')
    if (!result.ok) {
      return { ok: false, error: result.error }
    }
    return { ok: true }
  } catch (e) {
    return { ok: false, error: `Storage verification failed: ${e instanceof Error ? e.message : String(e)}` }
  }
}

export type StepUpdateCallback = (steps: ProvisioningStep[]) => void

export async function runProvisioning(
  _settings: AppSettings,
  onUpdate: StepUpdateCallback,
): Promise<boolean> {
  const steps: ProvisioningStep[] = [
    { id: 'firestore', label: 'Verifying Firestore access...', status: 'pending' },
    { id: 'storage', label: 'Verifying Storage bucket...', status: 'pending' },
  ]

  function updateStep(id: string, update: Partial<ProvisioningStep>) {
    const step = steps.find((s) => s.id === id)
    if (step) Object.assign(step, update)
    onUpdate([...steps])
  }

  // Step 1: Verify Firestore
  updateStep('firestore', { status: 'running' })
  const firestoreResult = await verifyFirestore()
  if (!firestoreResult.ok) {
    updateStep('firestore', { status: 'error', error: firestoreResult.error })
    return false
  }
  updateStep('firestore', { status: 'done' })

  // Step 2: Verify Storage
  updateStep('storage', { status: 'running' })
  const storageResult = await verifyStorage()
  if (!storageResult.ok) {
    updateStep('storage', { status: 'error', error: storageResult.error })
    return false
  }
  updateStep('storage', { status: 'done' })

  return true
}
