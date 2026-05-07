
interface DoctorInstructionsPanelProps {
  doctorNotes?: string
  suggestedRegimen?: string
}

export function DoctorInstructionsPanel({ doctorNotes, suggestedRegimen }: DoctorInstructionsPanelProps) {
  const hasNotes = doctorNotes && doctorNotes.trim().length > 0
  const hasRegimen = suggestedRegimen && suggestedRegimen.trim().length > 0

  if (!hasNotes && !hasRegimen) return null

  return (
    <section className="bg-white rounded-[32px] border-2 border-[#b90c55]/20 shadow-xl shadow-[#b90c55]/5 overflow-hidden">
      <div className="p-6 bg-[#b90c55]/5 border-b border-[#b90c55]/10 flex items-center gap-3">
        <span className="material-symbols-outlined text-[#b90c55] text-2xl">medical_information</span>
        <h3 className="font-headline font-extrabold text-stone-700 text-lg tracking-tight">Instruksi Dokter Onkologi</h3>
      </div>
      
      <div className="p-8 space-y-6">
        {hasNotes && (
          <div className="space-y-2">
            <h4 className="text-[10px] font-black text-stone-400 uppercase tracking-widest ml-1">Catatan Instruksi Klinis</h4>
            <div className="bg-stone-50 rounded-2xl p-5 border border-stone-100">
              <p className="text-sm text-stone-600 font-bold leading-relaxed italic">
                "{doctorNotes}"
              </p>
            </div>
          </div>
        )}

        {hasRegimen && (
          <div className="space-y-2">
            <h4 className="text-[10px] font-black text-stone-400 uppercase tracking-widest ml-1">Saran Perubahan Regimen</h4>
            <div className="bg-amber-50 rounded-2xl p-5 border border-amber-100 flex gap-4 items-start">
              <span className="material-symbols-outlined text-amber-600 mt-0.5">pill</span>
              <p className="text-sm text-amber-900 font-black leading-relaxed">
                {suggestedRegimen}
              </p>
            </div>
          </div>
        )}
      </div>
    </section>
  )
}
