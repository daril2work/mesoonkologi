// ============================================================
// MESO App — Domain Level Report Schema
// Unified source of truth for all reporting items (Clinical, Dietary, QoL)
// ============================================================

export type ReportDomain = 'CLINICAL' | 'DIETARY' | 'QOL' | 'VITALS'

export type SymptomKey =
  | 'nausea'
  | 'vomiting'
  | 'diarrhea'
  | 'fatigue'
  | 'pain'
  | 'mucositis'
  | 'neuropathy'
  | 'skinReaction'
  | 'appetiteLoss'
  | 'fever'
  | 'dyspnea'

export interface ReportItemDefinition {
  key: string
  label: string
  domain: ReportDomain
  isClinical: boolean        // Used for CTCAE grading & sentinel alerts
  isSentinelEligible: boolean // Can trigger red alert (e.g. fever)
  unit?: string
}

/**
 * Master Schema for all reporting items.
 * Add new items here to automatically integrate them into UI & Logic.
 */
export const REPORT_SCHEMA: ReportItemDefinition[] = [
  // --- CLINICAL DOMAIN (CTCAE) ---
  { key: 'nausea', label: 'Mual', domain: 'CLINICAL', isClinical: true, isSentinelEligible: false },
  { key: 'vomiting', label: 'Muntah', domain: 'CLINICAL', isClinical: true, isSentinelEligible: false },
  { key: 'diarrhea', label: 'Diare', domain: 'CLINICAL', isClinical: true, isSentinelEligible: false },
  { key: 'fatigue', label: 'Kelelahan', domain: 'CLINICAL', isClinical: true, isSentinelEligible: false },
  { key: 'pain', label: 'Nyeri', domain: 'CLINICAL', isClinical: true, isSentinelEligible: false },
  { key: 'mucositis', label: 'Sariawan', domain: 'CLINICAL', isClinical: true, isSentinelEligible: false },
  { key: 'neuropathy', label: 'Kesemutan/Baal', domain: 'CLINICAL', isClinical: true, isSentinelEligible: false },
  { key: 'skinReaction', label: 'Reaksi Kulit', domain: 'CLINICAL', isClinical: true, isSentinelEligible: false },
  { key: 'appetiteLoss', label: 'Nafsu Makan', domain: 'CLINICAL', isClinical: true, isSentinelEligible: false },
  { key: 'fever', label: 'Demam', domain: 'CLINICAL', isClinical: true, isSentinelEligible: true },
  { key: 'dyspnea', label: 'Sesak Napas', domain: 'CLINICAL', isClinical: true, isSentinelEligible: true },

  // --- DIETARY DOMAIN ---
  { key: 'waterIntake', label: 'Asupan Air', domain: 'DIETARY', isClinical: false, isSentinelEligible: false, unit: 'gelas' },
  { key: 'foodIntake', label: 'Asupan Makanan', domain: 'DIETARY', isClinical: false, isSentinelEligible: false },

  // --- FUTURE: QOL DOMAIN (Placeholder) ---
  // { key: 'qolScore', label: 'Kualitas Hidup', domain: 'QOL', isClinical: false, isSentinelEligible: false },
]

/** Helpers to get keys dynamically */
export const SYMPTOM_KEYS = REPORT_SCHEMA.filter(i => i.isClinical).map(i => i.key)
export const SENTINEL_KEYS = REPORT_SCHEMA.filter(i => i.isSentinelEligible).map(i => i.key)
export const DIETARY_KEYS = REPORT_SCHEMA.filter(i => i.domain === 'DIETARY').map(i => i.key)

export const SENTINEL_GRADE_THRESHOLD = 3
