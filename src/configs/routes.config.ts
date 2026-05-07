// ============================================================
// MESO App — Route Definitions
// ============================================================

export const ROUTES = {
  // Public
  HOME: '/',
  LOGIN: '/login',
  REGISTER: '/register',
  FORGOT_PASSWORD: '/forgot-password',
  RESET_PASSWORD: '/reset-password',
  PRIVACY_POLICY: '/privacy',

  // Patient
  PATIENT_DASHBOARD: '/patient/dashboard',
  PATIENT_REPORT_NEW: '/patient/report/new',
  PATIENT_HISTORY: '/patient/history',
  PATIENT_EDUCATION: '/patient/education',
  PATIENT_SCHEDULE: '/patient/schedule',
  PATIENT_CHAT: '/patient/chat',
  PATIENT_PROFILE: '/patient/profile',

  // Pharmacist (Apoteker)
  PHARMA_DASHBOARD: '/pharma/dashboard',
  PHARMA_QUEUE: '/pharma/queue',
  PHARMA_REPORT_NEW: '/pharma/report/new',
  PHARMA_REPORT_DETAIL: '/pharma/report/:id',
  PHARMA_CHAT: '/pharma/chat',
  PHARMA_PATIENTS: '/pharma/patients',
  PHARMA_PATIENT_DETAIL: '/pharma/patient/:id/:reportId?',
  PHARMA_EDUCATION: '/pharma/education',
  PHARMA_SCHEDULE: '/pharma/schedule',
  PHARMA_HELP: '/pharma/help',
  PHARMA_SETTINGS: '/pharma/settings',

  // Doctor
  DOCTOR_WATCHLIST: '/doctor/watchlist',
  DOCTOR_PATIENT: '/doctor/patient/:id/:reportId?',
  DOCTOR_HISTORY: '/doctor/history',

  // Admin
  ADMIN_DASHBOARD: '/admin/dashboard',
} as const

export type AppRoute = (typeof ROUTES)[keyof typeof ROUTES]
