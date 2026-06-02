// ============================================================
// PharmacistPatientDetail — Sub-komponen: Patient Header Card
// Single Responsibility: Render info identitas pasien
// ============================================================

interface PatientHeaderCardProps {
  fullName: string
  diagnosis: string
  age?: number | string
  weight?: string
  height?: string
  bp?: string
  cycleInfo?: string
  isActive?: boolean
  statusReason?: string | null
}

export function PatientHeaderCard({
  fullName,
  diagnosis,
  age,
  weight,
  height,
  bp,
  cycleInfo,
  isActive = true,
  statusReason,
}: PatientHeaderCardProps) {
  return (
    <section className="bg-surface-container-lowest rounded-2xl p-4 sm:p-8 lg:p-10 shadow-sm border border-stone-100 relative overflow-hidden group">
      {/* Cycle Badge - Temporarily hidden per client request
      {cycleInfo && isActive && (
        <div className="absolute top-4 right-4 sm:top-8 sm:right-8">
          <div className="bg-primary-container/40 text-primary px-3.5 py-1.5 sm:px-5 sm:py-2 rounded-full text-[8px] sm:text-[10px] font-black uppercase tracking-widest flex items-center gap-1.5 sm:gap-2 border border-primary/10">
            <span className="w-1.5 h-1.5 sm:w-2 sm:h-2 bg-primary rounded-full animate-pulse shadow-[0_0_8px_rgba(4,107,94,0.4)]" />
            {cycleInfo}
          </div>
        </div>
      )}
      */}

      <div className="flex flex-col sm:flex-row items-start gap-4 sm:gap-8 pt-8 sm:pt-0">
        {/* Avatar */}
        <div className="w-16 h-16 sm:w-28 sm:h-28 rounded-2xl bg-primary-container/20 border border-primary/10 flex items-center justify-center font-black text-primary text-xl sm:text-4xl shadow-inner shrink-0">
          {fullName.charAt(0)}
        </div>

        {/* Info */}
        <div className="space-y-2 sm:space-y-3 min-w-0 w-full">
          <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3">
            <h2 className="text-xl sm:text-3xl lg:text-4xl font-headline font-extrabold text-on-surface tracking-tight truncate pr-20 sm:pr-0">
              {fullName}
            </h2>
            {isActive === false && (
              <span className={`
                px-2.5 py-1 rounded-full text-[8px] sm:text-[9px] font-black uppercase tracking-wider shrink-0 self-start sm:self-center border
                ${statusReason === 'deceased'
                  ? 'bg-rose-50 text-rose-700 border-rose-100 shadow-xs'
                  : statusReason === 'discharged'
                  ? 'bg-emerald-50 text-emerald-700 border-emerald-100 shadow-xs'
                  : 'bg-stone-100 text-stone-600 border-stone-200 shadow-xs'
                }
              `}>
                Nonaktif — {statusReason === 'deceased' ? 'Meninggal' : statusReason === 'discharged' ? 'Selesai Terapi' : 'Keluar'}
              </span>
            )}
          </div>
          <p className="text-stone-500 font-bold text-xs sm:text-sm flex items-center gap-2">
            <span
              className="material-symbols-outlined text-primary shrink-0 text-lg sm:text-xl"
              style={{ fontVariationSettings: "'opsz' 20" }}
            >
              medical_information
            </span>
            {diagnosis}
          </p>

          {/* Stat Chips */}
          <div className="flex flex-wrap gap-2 sm:gap-4 mt-4 sm:mt-8">
            {age !== undefined && (
              <div className="bg-surface-container-low px-3 py-2 sm:px-5 sm:py-3 rounded-xl border border-stone-55/40 text-xs sm:text-sm">
                <p className="text-[8px] sm:text-[10px] text-stone-400 uppercase font-black tracking-widest mb-0.5 sm:mb-1">Usia</p>
                <p className="font-extrabold text-on-surface">{age || '—'} Thn</p>
              </div>
            )}
            {(weight || height) && (
              <div className="bg-surface-container-low px-3 py-2 sm:px-5 sm:py-3 rounded-xl border border-stone-55/40 text-xs sm:text-sm">
                <p className="text-[8px] sm:text-[10px] text-stone-400 uppercase font-black tracking-widest mb-0.5 sm:mb-1">BB/TB</p>
                <p className="font-extrabold text-on-surface">
                  {weight ?? '—'} / {height ?? '—'}
                </p>
              </div>
            )}
            {bp && (
              <div className="bg-surface-container-low px-3 py-2 sm:px-5 sm:py-3 rounded-xl border border-stone-55/40 text-xs sm:text-sm">
                <p className="text-[8px] sm:text-[10px] text-stone-400 uppercase font-black tracking-widest mb-0.5 sm:mb-1">Tensi</p>
                <p className="font-extrabold text-primary">{bp}</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Decorative glow */}
      <div className="absolute -bottom-10 -right-10 w-40 h-40 bg-primary/5 rounded-full blur-3xl pointer-events-none group-hover:bg-primary/10 transition-all duration-700" />
    </section>
  )
}
