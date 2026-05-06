// ============================================================
// MESO App — Grade & Role Display Configuration
// ============================================================

export type GradeColor = 'green' | 'yellow' | 'red'

/** Severity grade display tokens */
export const GRADE_CONFIG = {
  green: {
    label: 'Ringan',
    hex: '#22c55e',
    description: 'Gejala ringan, pantau mandiri',
  },
  yellow: {
    label: 'Sedang',
    hex: '#f59e0b',
    description: 'Perlu konsultasi apoteker',
  },
  red: {
    label: 'Berat / Sentinel',
    hex: '#e11d48',
    description: 'Butuh penanganan segera',
  },
} as const satisfies Record<GradeColor, { label: string; hex: string; description: string }>

/** Human-readable labels by user role */
export const ROLE_LABELS = {
  patient: 'Pasien',
  pharmacist: 'Apoteker',
  doctor: 'Dokter',
  admin: 'Admin',
} as const

export type UserRoleKey = keyof typeof ROLE_LABELS
