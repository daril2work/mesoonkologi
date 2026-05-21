// ============================================================
// Reports Domain — Types
// ============================================================
import type { MedicProfile } from '@features/auth/types'

export type GradeColor = 'green' | 'yellow' | 'red'
export type ReportStatus = 'pending' | 'reviewed' | 'resolved'
export type InterventionStatus = 'observed' | 'escalated' | 'resolved'

export interface SymptomData {
  nausea?: number       // 0–3 (CTCAE grade)
  vomiting?: number
  diarrhea?: number
  fatigue?: number
  pain?: number
  mucositis?: number
  neuropathy?: number
  skinReaction?: number
  appetiteLoss?: number
  fever?: number        // boolean-like: 0 or 1 (≥38°C)
  dyspnea?: number      // boolean-like: 0 or 1
  constipation?: number
  alopecia?: number
  insomnia?: number
  waterIntake?: number  // Number of glasses
  foodIntake?: number   // Scale 1-5
  otherSymptomName?: string
  otherSymptomGrade?: number
  qol?: {
    mobility?: number             // 1-3 (Mobilitas)
    selfCare?: number             // 1-3 (Perawatan Diri)
    usualActivities?: number      // 1-3 (Kegiatan Utama)
    painDiscomfort?: number       // 1-3 (Rasa Nyeri / Tidak Nyaman)
    anxietyDepression?: number    // 1-3 (Cemas / Depresi)
  }
}

export interface SymptomReport {
  id: string
  patientId: string
  symptoms: SymptomData
  clinicalNote?: string
  isSentinelAlert: boolean
  gradeAuto: GradeColor
  gradeFinal?: GradeColor
  status: ReportStatus
  escalationStatus?: 'none' | 'escalated' | 'resolved'
  doctorNotes?: string
  suggestedRegimen?: string
  pharmacistNotes?: string
  systolic?: number
  diastolic?: number
  heartRate?: number
  temperature?: number
  spo2?: number
  qolScore?: number
  createdAt: string
  updatedAt?: string
  interventions?: Intervention[]
  patient?: {
    id: string
    fullName: string
    ward?: string
    bedNumber?: string
    currentCycle?: number
  }
}

export interface Intervention {
  id: string
  reportId: string
  actorId: string
  adviceGiven: string
  status: InterventionStatus
  escalatedTo?: string
  createdAt: string
  actor?: MedicProfile
  escalatedToUser?: MedicProfile
}

export interface PatientSchedule {
  id: string
  patientId: string
  title: string
  scheduleDate: string
  location: string
  notes?: string
  status?: 'upcoming' | 'completed' | 'cancelled'
  createdAt: string
}

export interface ReportChatMessage {
  id: string
  senderId: string
  receiverId: string
  content: string
  isRead: boolean
  createdAt: string
}

export interface EducationMaterial {
  id: string
  title: string
  description: string | null
  content: string | null
  category: string
  imageUrl: string | null
  videoUrl: string | null
  isFeatured: boolean
  createdAt: string
}

export interface PatientDirectoryItem {
  id: string
  fullName: string
  phoneNumber?: string
  currentCycle: number
  lastReportDate: string | null
  overallStatus: 'Stabil' | 'Observasi' | 'Butuh Tindakan'
  cancerSite?: string | null
}
