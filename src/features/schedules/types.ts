// ============================================================
// Schedules Domain — Types
// ============================================================

export type ScheduleType = 'chemo' | 'medication' | 'checkup' | 'lab'

export interface Schedule {
  id: string
  patientId: string
  type: ScheduleType
  title: string
  scheduledAt: string
  isCompleted: boolean
  notes?: string
  createdAt: string
}
