import { useQuery } from '@tanstack/react-query'
import { supabase } from '@lib/supabase'
import { mapSymptomDetail, mapDietaryDetail } from '../utils/reportMapper'
import { SYMPTOM_KEYS } from '../constants'

export interface PatientDetailData {
  id: string
  fullName: string
  age: number
  weight: string
  height: string
  bp: string
  diagnosis: string
  cycleInfo: string
  currentCycle: number
  latestSymptoms: {
    label: string
    value: number
    status: string
  }[]
  latestDietary: {
    label: string
    value: number
    unit: string
  }[]
  latestQol?: {
    mobility?: number
    selfCare?: number
    usualActivities?: number
    painDiscomfort?: number
    anxietyDepression?: number
  } | null
  trends: {
    date: string
    mual: number
    nyeri: number
    lelah: number
    nafsu: number
    qolScore: number
  }[]
  latestReportId?: string
  latestReportDate?: string
  isCritical?: boolean
  escalationStatus: 'none' | 'escalated' | 'resolved'
  doctorNotes?: string
  suggestedRegimen?: string
  pharmacistNotes?: string
  clinicalNote?: string
  vitals?: {
    systolic?: number
    diastolic?: number
    heartRate?: number
    temperature?: number
    spo2?: number
  }
  qolScore?: number
  isQolActive?: boolean
  isActive?: boolean
  statusReason?: string | null
  deactivatedAt?: string | null
  reportsHistory?: {
    id: string
    createdAt: string
    isSentinelAlert: boolean
    escalationStatus: 'none' | 'escalated' | 'resolved'
    status: string
  }[]
}

export function usePatientDetail(patientId?: string, reportId?: string) {
  return useQuery({
    queryKey: ['patientDetail', patientId, reportId],
    queryFn: async () => {
      if (!patientId) return null

      // 1. Fetch Profile (Limit columns for security)
      const { data: profile, error: pError } = await supabase
        .from('profiles')
        .select('id, full_name, cancer_site, current_cycle, age, weight_kg, height_cm, is_qol_active, is_active, status_reason, deactivated_at')
        .eq('id', patientId)
        .single()

      if (pError) throw pError

      // 2. Fetch Reports (last 15)
      const { data: reports, error: rError } = await supabase
        .from('symptom_reports')
        .select('*, escalation_status, doctor_notes')
        .eq('patient_id', patientId)
        .order('created_at', { ascending: false })
        .limit(15)

      if (rError) throw rError

      // 3. Determine which report to show
      let latest = reports[0]
      if (reportId) {
        const foundInBatch = reports.find(r => r.id === reportId)
        if (foundInBatch) {
          latest = foundInBatch
        } else {
          // If not in the last 5, fetch the specific report
          const { data: specific, error: sError } = await supabase
            .from('symptom_reports')
            .select('*, escalation_status, doctor_notes')
            .eq('id', reportId)
            .single()
          
          if (!sError && specific) {
            latest = specific
          }
        }
      }

      const symptoms = latest?.symptoms || {}

      // Map to UI Structure
      return {
        id: profile.id,
        fullName: profile.full_name,
        age: profile.age ?? 0,
        weight: profile.weight_kg ? `${profile.weight_kg} kg` : '—',
        height: profile.height_cm ? `${profile.height_cm} cm` : '—',
        bp: '—', // BP usually comes from latest report vitals, handled below
        diagnosis: profile.cancer_site || 'Karsinoma Mammae',
        cycleInfo: `Siklus ${profile.current_cycle} / 8`,
        currentCycle: profile.current_cycle || 1,
        isQolActive: profile.is_qol_active ?? false,
        isActive: profile.is_active ?? true,
        statusReason: profile.status_reason || null,
        deactivatedAt: profile.deactivated_at || null,
        latestSymptoms: mapSymptomDetail(symptoms),
        latestDietary: mapDietaryDetail(symptoms),
        latestQol: symptoms.qol || null,
        trends: [...reports].slice(0, 5).reverse().map(r => ({
          date: new Date(r.created_at).toLocaleDateString('id-ID', { day: '2-digit', month: 'short' }),
          mual: r.symptoms[SYMPTOM_KEYS.NAUSEA] || 0,
          nyeri: r.symptoms[SYMPTOM_KEYS.PAIN] || 0,
          lelah: r.symptoms[SYMPTOM_KEYS.FATIGUE] || 0,
          nafsu: r.symptoms[SYMPTOM_KEYS.APPETITE] || 0,
          qolScore: r.qol_score || 0
        })),
        latestReportId: latest?.id,
        latestReportDate: latest?.created_at,
        isCritical: latest?.is_sentinel_alert,
        escalationStatus: latest?.escalation_status || 'none',
        doctorNotes: latest?.doctor_notes,
        suggestedRegimen: latest?.suggested_regimen,
        pharmacistNotes: latest?.pharmacist_notes,
        clinicalNote: latest?.clinical_note,
        vitals: {
          systolic: latest?.systolic,
          diastolic: latest?.diastolic,
          heartRate: latest?.heart_rate,
          temperature: latest?.temperature,
          spo2: latest?.spo2,
        },
        qolScore: latest?.qol_score,
        reportsHistory: reports.map(r => ({
          id: r.id,
          createdAt: r.created_at,
          isSentinelAlert: r.is_sentinel_alert,
          escalationStatus: r.escalation_status || 'none',
          status: r.status
        }))
      } as PatientDetailData
    },
    enabled: !!patientId
  })
}
