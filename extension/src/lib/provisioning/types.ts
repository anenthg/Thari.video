export type StepStatus = 'pending' | 'running' | 'waiting' | 'done' | 'error'

export interface StepAction {
  label: string
  url: string
}

export interface ProvisioningStep {
  id: string
  label: string
  status: StepStatus
  error?: string
  actions?: StepAction[]
}

export type StepUpdateCallback = (steps: ProvisioningStep[]) => void
