import { format } from 'date-fns'
import { id as localeId } from 'date-fns/locale'
import { useInterventions } from '../api/useInterventions'

interface InterventionHistoryPanelProps {
  reportId?: string
}

export function InterventionHistoryPanel({ reportId }: InterventionHistoryPanelProps) {
  const { data: interventions, isLoading } = useInterventions(reportId)

  if (!reportId) return null

  if (isLoading) {
    return (
      <div className="bg-white rounded-2xl sm:rounded-[32px] p-5 sm:p-8 border border-stone-100 shadow-sm animate-pulse flex justify-center items-center h-40">
        <span className="text-xs font-bold text-stone-300 uppercase tracking-widest">Memuat Riwayat...</span>
      </div>
    )
  }

  if (!interventions || interventions.length === 0) {
    return null
  }

  return (
    <section className="bg-white rounded-2xl sm:rounded-[32px] border border-stone-100 shadow-sm overflow-hidden">
      <div className="p-5 sm:p-8 border-b border-stone-100 bg-surface-container-lowest flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center">
            <span className="material-symbols-outlined">clinical_notes</span>
          </div>
          <div>
            <h3 className="font-headline font-black text-on-surface">Riwayat Intervensi</h3>
            <p className="text-[10px] text-stone-400 font-black uppercase tracking-widest mt-1">
              {interventions.length} Catatan Klinis
            </p>
          </div>
        </div>
      </div>
      
      <div className="p-5 sm:p-8 space-y-6">
        {interventions.map((intervention, index) => (
          <div key={intervention.id} className="relative pl-6">
            {/* Timeline line */}
            {index !== interventions.length - 1 && (
              <div className="absolute left-[11px] top-8 bottom-[-24px] w-0.5 bg-stone-100" />
            )}
            
            {/* Timeline dot */}
            <div className="absolute left-0 top-1.5 w-6 h-6 rounded-full border-4 border-white bg-amber-400 shadow-sm" />
            
            <div className="bg-stone-50 rounded-2xl p-5 border border-stone-100">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <span className="font-bold text-sm text-stone-700">
                    {intervention.actor?.fullName || 'Dokter/Apoteker'}
                  </span>
                  <span className="text-[10px] bg-stone-200 text-stone-600 px-2 py-0.5 rounded-full font-bold">
                    {intervention.actor?.role === 'doctor' ? 'Dokter' : 'Apoteker'}
                  </span>
                </div>
                <span className="text-[10px] text-stone-400 font-bold">
                  {format(new Date(intervention.createdAt), 'dd MMM yyyy, HH:mm', { locale: localeId })}
                </span>
              </div>
              <p className="text-sm text-stone-600 leading-relaxed font-medium">
                {intervention.adviceGiven}
              </p>
            </div>
          </div>
        ))}
      </div>
    </section>
  )
}
