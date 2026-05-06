// ============================================================
// Auth Domain — Types
// ============================================================

export type UserRole = 'patient' | 'pharmacist' | 'doctor' | 'admin'

export interface AuthUser {
  id: string
  email: string
  role: UserRole
  fullName: string | null
  createdAt: string
}

export interface PatientProfile {
  id: string
  userId: string
  fullName: string
  cancerSite: string
  currentCycle: number
  hospitalId?: string
  dateOfBirth?: string
  phoneNumber?: string
  avatarUrl?: string
}

export interface MedicProfile {
  id: string
  userId: string
  fullName: string
  specialization?: string
  employeeId: string
  hospitalId?: string
  avatarUrl?: string
}
