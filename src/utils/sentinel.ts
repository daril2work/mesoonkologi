// ============================================================
// MESO App — Sentinel Business Logic
// ============================================================
import type { SymptomData, GradeColor } from '@features/reports/types'
import { SENTINEL_KEYS, SENTINEL_GRADE_THRESHOLD, SYMPTOM_KEYS } from '@features/reports/constants/symptoms.domain'

/**
 * Detect if symptom report contains sentinel (critical) symptoms.
 * Sentinel = fever OR dyspnea present, OR any symptom grade >= 3
 */
export function detectSentinel(symptoms: SymptomData): boolean {
  // Check explicit sentinel symptoms (fever, dyspnea)
  for (const key of SENTINEL_KEYS) {
    const value = symptoms[key as keyof SymptomData]
    if (value !== undefined && typeof value === 'number' && value >= 1) return true
  }

  // Check if any valid symptom hits grade threshold (≥3)
  // We only check keys defined in SYMPTOM_KEYS to exclude dietary data (waterIntake, foodIntake)
  for (const key of SYMPTOM_KEYS) {
    const value = symptoms[key as keyof SymptomData]
    if (value !== undefined && typeof value === 'number' && value >= SENTINEL_GRADE_THRESHOLD) {
      return true
    }
  }

  return false
}

/**
 * Auto-grade overall symptom severity.
 * Returns 'green' | 'yellow' | 'red'
 *
 * Logic:
 *  - Any sentinel → red
 *  - Max grade ≥2 OR ≥3 symptoms active → yellow
 *  - Otherwise → green
 */
export function autoGrade(symptoms: SymptomData): GradeColor {
  if (detectSentinel(symptoms)) return 'red'

  // Only consider clinical symptoms for grading
  const activeValues: number[] = []
  for (const key of SYMPTOM_KEYS) {
    const value = symptoms[key as keyof SymptomData]
    if (value !== undefined && typeof value === 'number' && value > 0) {
      activeValues.push(value)
    }
  }

  if (activeValues.length === 0) return 'green'

  const maxGrade = Math.max(...activeValues)
  const activeCount = activeValues.filter(v => v >= 1).length

  if (maxGrade >= 2 || activeCount >= 3) return 'yellow'
  return 'green'
}

/**
 * Count total active (grade > 0) symptoms.
 */
export function countActiveSymptoms(symptoms: SymptomData): number {
  return SYMPTOM_KEYS.filter(key => {
    const value = symptoms[key as keyof SymptomData]
    return value !== undefined && typeof value === 'number' && value > 0
  }).length
}
