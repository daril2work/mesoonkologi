// ============================================================
// PharmacistDashboard — Sub-komponen: MajorCard
// S-02: Dipindahkan dari inline function di Dashboard.tsx
// CS-02: Gunakan camelToWords dari helpers (bukan inline regex)
// ============================================================
import { Link } from 'react-router-dom'
import { formatDistanceToNow } from 'date-fns'
import { id } from 'date-fns/locale'
import { camelToWords } from '@utils/helpers'
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
    <div className="bg-surface-container-lowest p-6 rounded-lg shadow-sm border-l-8 border-tertiary flex items-center justify-between group hover:shadow-md transition-all">
      <div className="flex items-center gap-6 flex-1 min-w-0">
        {/* Avatar */}
        <div className="w-14 h-14 rounded-full overflow-hidden flex-shrink-0 bg-tertiary-container">
          <div className="w-full h-full bg-tertiary/10 flex items-center justify-center font-bold text-tertiary text-xl font-headline">
            {report.patient.fullName.charAt(0)}
          </div>
        </div>

        {/* Data Grid */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 flex-1 min-w-0">
          <div className="min-w-0">
            <p className="text-xs font-bold text-stone-400 uppercase tracking-tight mb-1">Nama Pasien</p>
            <p className="font-bold text-on-surface truncate">{report.patient.fullName}</p>
            <p className="text-[10px] text-stone-400 font-mono">ID: {report.patient.id.slice(0, 8).toUpperCase()}</p>
          </div>
          <div>
            <p className="text-xs font-bold text-stone-400 uppercase tracking-tight mb-1">Gejala Utama</p>
            <div className="flex items-center gap-2">
              <span
                className="material-symbols-outlined text-tertiary text-lg"
                style={{ fontVariationSettings: "'FILL' 1" }}
              >
                warning
              </span>
              <span className="font-semibold text-on-surface capitalize">{symptomLabel}</span>
            </div>
          </div>
          <div className="hidden md:block">
            <p className="text-xs font-bold text-stone-400 uppercase tracking-tight mb-1">Status Siklus</p>
            <p className="font-semibold text-on-surface">Siklus {report.patient.currentCycle ?? 1}</p>
          </div>
          <div className="hidden md:block">
            <p className="text-xs font-bold text-stone-400 uppercase tracking-tight mb-1">Waktu Lapor</p>
            <p className="font-semibold text-on-surface">
              {formatDistanceToNow(new Date(report.createdAt), { addSuffix: true, locale: id })}
            </p>
          </div>
        </div>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-4 ml-6 shrink-0">
        {report.escalationStatus === 'escalated' ? (
          <span className="bg-indigo-100 text-indigo-600 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest border border-indigo-200 flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 bg-indigo-500 rounded-full animate-pulse" />
            Ter-eskalasi
          </span>
        ) : (
          <span className="bg-tertiary-container text-on-tertiary-container px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest">
            Berat
          </span>
        )}
        {/* A-02: Pakai ROUTES constant, bukan template literal hardcoded */}
        <Link
          to={detailPath}
          className="bg-primary text-on-primary px-6 py-2.5 rounded-xl font-bold text-sm hover:opacity-90 active:scale-95 transition-all inline-block"
        >
          Tinjau
        </Link>
      </div>
    </div>
  )
}
