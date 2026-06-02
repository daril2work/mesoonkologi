// ============================================================
// PharmacistDashboard — Sub-komponen: MajorCard
// S-02: Dipindahkan dari inline function di Dashboard.tsx
// CS-02: Gunakan camelToWords dari helpers (bukan inline regex)
// ============================================================
import { Link } from 'react-router-dom'
import { formatDistanceToNow } from 'date-fns'
import { id } from 'date-fns/locale'
import { ROUTES } from '@configs/app.config'
import { SYMPTOM_KEYS, SENTINEL_KEYS, REPORT_SCHEMA } from '@features/reports/constants/symptoms.domain'
import type { QueueReport } from '../api/usePharmacistQueue'

interface MajorCardProps {
  report: QueueReport
}

export function MajorCard({ report }: MajorCardProps) {
  // Logic: Identify the most relevant clinical symptom for display
  const clinicalSymptoms = Object.entries(report.symptoms)
    .filter(([key]) => (SYMPTOM_KEYS as string[]).includes(key))
    .map(([key, value]) => ({ key, value: value as number }))
    .filter(s => s.value > 0)
    .sort((a, b) => b.value - a.value)

  // Find priority: Highest grade OR any active Sentinel
  const topSymptom = 
    clinicalSymptoms.find(s => s.value >= 3) || 
    clinicalSymptoms.find(s => SENTINEL_KEYS.includes(s.key as any)) ||
    clinicalSymptoms[0]

  const schemaItem = REPORT_SCHEMA.find(i => i.key === topSymptom?.key)
  const symptomLabel = schemaItem ? schemaItem.label : 'Keluhan Klinis'

  // A-02: Bangun path dari ROUTES constant, bukan hardcoded string
  const detailPath = ROUTES.PHARMA_PATIENT_DETAIL
    .replace(':id', report.patient.id)
    .replace(':reportId?', report.id)

  return (
    <div className="bg-surface-container-lowest p-4 hover:bg-stone-50/50 transition-colors flex flex-col gap-3 rounded-xl shadow-sm border border-stone-100 group">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-tertiary-container/30 flex items-center justify-center font-bold text-tertiary text-xs border border-tertiary/10 overflow-hidden shrink-0">
            {report.patient.fullName.charAt(0)}
          </div>
          <div className="min-w-0">
            <p className="font-bold text-sm text-on-surface truncate leading-tight">{report.patient.fullName}</p>
            <p className="text-[10px] text-stone-400 font-medium">
              ID: {report.patient.id.slice(0, 8).toUpperCase()} &bull; {formatDistanceToNow(new Date(report.createdAt), { addSuffix: true, locale: id })}
            </p>
          </div>
        </div>
      </div>

      <div className="flex items-center justify-between bg-stone-50/60 p-2.5 rounded-xl border border-stone-100">
        <div className="flex flex-col gap-0.5 min-w-0 mr-4">
          <span className="text-[10px] text-stone-400 font-bold uppercase tracking-wider">Gejala Utama</span>
          <div className="flex items-center gap-1.5 truncate">
            <span className="material-symbols-outlined text-tertiary text-sm shrink-0" style={{ fontVariationSettings: "'FILL' 1" }}>warning</span>
            <span className="text-xs text-on-surface-variant font-bold capitalize truncate">{symptomLabel}</span>
          </div>
        </div>
        <div className="flex flex-col items-end gap-0.5 shrink-0">
          <span className="text-[10px] text-stone-400 font-bold uppercase tracking-wider">Status</span>
          {report.escalationStatus === 'escalated' ? (
            <span className="flex items-center gap-1.5 text-indigo-600 text-xs font-bold">
              <span className="w-1.5 h-1.5 bg-indigo-500 rounded-full animate-pulse" />
              Ter-eskalasi
            </span>
          ) : (
            <span className="flex items-center gap-1.5 text-tertiary text-xs font-bold">
              <span className="w-1.5 h-1.5 bg-tertiary rounded-full" />
              Berat
            </span>
          )}
        </div>
      </div>

      <div className="flex justify-end pt-1">
        <Link
          to={detailPath}
          className="bg-tertiary text-white px-4 py-2 rounded-xl text-xs font-bold transition-all w-full md:w-auto text-center shadow-sm hover:opacity-90 active:scale-95"
        >
          Tinjau Detail
        </Link>
      </div>
    </div>
  )
}
