import { SYMPTOM_KEYS as UI_SYMPTOM_KEYS, TRIAGE_STATUS } from '../constants'
import type { TriageStatus } from '../constants'
import type { PatientDirectoryItem } from '../types'
import { camelToWords } from '@utils/helpers'

// ============================================================
// S-03: Typed Supabase row interfaces
// Menggantikan row: any dan as any casting
// Update sesuai skema database jika ada perubahan kolom
// ============================================================
interface SupabaseSymptomReport {
  created_at: string
  is_sentinel_alert: boolean | null
  grade_auto: string | null
}

interface SupabaseProfileRow {
  id: string
  full_name: string | null
  current_cycle: number | null
  cancer_site: string | null
  symptom_reports: SupabaseSymptomReport[] | null
}

/**
 * Maps a profile row with joined symptom_reports to a PatientDirectoryItem
 */
export function mapPatientDirectoryRow(row: SupabaseProfileRow): PatientDirectoryItem {
  const reports = (row.symptom_reports ?? []) as SupabaseSymptomReport[]
  
  // Get latest report
  const lastReport = reports.sort((a, b) => 
    new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
  )[0]
  
  let status: TriageStatus = TRIAGE_STATUS.STABLE
  if (lastReport?.is_sentinel_alert) status = TRIAGE_STATUS.CRITICAL
  else if (lastReport?.grade_auto === 'yellow') status = TRIAGE_STATUS.OBSERVATION

  return {
    id: row.id,
    fullName: row.full_name ?? 'Tanpa Nama',
    currentCycle: row.current_cycle ?? 1,
    lastReportDate: lastReport?.created_at ?? null,
    overallStatus: status,
    cancerSite: row.cancer_site
  }
}

import { SYMPTOM_KEYS as ALL_CLINICAL_SYMPTOMS, REPORT_SCHEMA } from '../constants/symptoms.domain'

/**
 * Maps raw symptoms object to the UI structure used in Patient Detail
 */
export function mapSymptomDetail(symptoms: Record<string, number>) {
  // Core symptoms that we always want to show
  const coreKeys = [
    UI_SYMPTOM_KEYS.NAUSEA,
    UI_SYMPTOM_KEYS.PAIN,
    UI_SYMPTOM_KEYS.FATIGUE,
    UI_SYMPTOM_KEYS.APPETITE,
  ]

  const coreSymptoms = [
    { 
      label: 'Mual & Muntah', 
      value: symptoms[UI_SYMPTOM_KEYS.NAUSEA] || 0, 
      status: getSymptomStatus(symptoms[UI_SYMPTOM_KEYS.NAUSEA] || 0) 
    },
    { 
      label: 'Tingkat Nyeri', 
      value: symptoms[UI_SYMPTOM_KEYS.PAIN] || 0, 
      status: getSymptomStatus(symptoms[UI_SYMPTOM_KEYS.PAIN] || 0) 
    },
    { 
      label: 'Kelelahan', 
      value: symptoms[UI_SYMPTOM_KEYS.FATIGUE] || 0, 
      status: getSymptomStatus(symptoms[UI_SYMPTOM_KEYS.FATIGUE] || 0) 
    },
    { 
      label: 'Nafsu Makan', 
      value: symptoms[UI_SYMPTOM_KEYS.APPETITE] || 0, 
      status: getSymptomStatus(symptoms[UI_SYMPTOM_KEYS.APPETITE] || 0) 
    },
  ]

  // Tambahkan gejala klinis lain yang memiliki nilai > 0
  // Kita filter menggunakan ALL_CLINICAL_SYMPTOMS untuk memastikan data nutrisi (water/food) tidak masuk
  const additionalSymptoms = Object.entries(symptoms)
    .filter(([key, val]) => 
      !coreKeys.includes(key as any) && 
      (ALL_CLINICAL_SYMPTOMS as readonly string[]).includes(key) && 
      val > 0
    )
    .map(([key, val]) => ({
      label: camelToWords(key),
      value: val,
      status: getSymptomStatus(val)
    }))

  return [...coreSymptoms, ...additionalSymptoms]
}

/**
 * Maps raw symptoms object to the UI structure for Dietary Status
 */
export function mapDietaryDetail(symptoms: Record<string, number>) {
  const dietaryItems = REPORT_SCHEMA.filter(item => item.domain === 'DIETARY')
  
  return dietaryItems.map(item => ({
    label: item.label,
    value: symptoms[item.key] || 0,
    unit: item.unit || ''
  }))
}

/**
 * Maps an education material row to EducationMaterial type
 */
export function mapEducationRow(row: any) {
  return {
    id: row.id,
    title: row.title,
    description: row.description,
    content: row.content,
    category: row.category,
    imageUrl: row.image_url,
    videoUrl: row.video_url,
    isFeatured: row.is_featured,
    createdAt: row.created_at,
  }
}

// Helper for status descriptions (can be expanded with real clinical logic)
function getSymptomStatus(value: number): string {
  if (value === 0) return 'Tidak ada keluhan.'
  if (value < 3) return 'Keluhan ringan, masih bisa beraktivitas.'
  if (value < 7) return 'Keluhan sedang, mengganggu kenyamanan.'
  return 'Keluhan berat, butuh penanganan medis segera.'
}
