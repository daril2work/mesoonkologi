/**
 * MESO App — Domain Constants
 * Used for consistency across UI and API layers.
 */

export const SYMPTOM_KEYS = {
  NAUSEA: 'nausea',
  PAIN: 'neuropathy',
  FATIGUE: 'fatigue',
  APPETITE: 'appetiteLoss',
} as const

export const TRIAGE_STATUS = {
  STABLE: 'Stabil',
  OBSERVATION: 'Observasi',
  CRITICAL: 'Butuh Tindakan',
} as const

export const GRADE_COLORS = {
  GREEN: 'green',
  YELLOW: 'yellow',
  RED: 'red',
} as const

export type SymptomKey = typeof SYMPTOM_KEYS[keyof typeof SYMPTOM_KEYS]
export type TriageStatus = typeof TRIAGE_STATUS[keyof typeof TRIAGE_STATUS]
