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
}

export function PatientHeaderCard({
  fullName,
  diagnosis,
  age,
  weight,
  height,
  bp,
  cycleInfo,
}: PatientHeaderCardProps) {
  return (
    <section className="bg-surface-container-lowest rounded-2xl p-10 shadow-sm border border-stone-100 relative overflow-hidden group">
      {/* Cycle Badge */}
      {cycleInfo && (
        <div className="absolute top-0 right-0 p-8">
          <div className="bg-primary-container/40 text-primary px-5 py-2 rounded-full text-[10px] font-black uppercase tracking-widest flex items-center gap-2 border border-primary/10">
            <span className="w-2 h-2 bg-primary rounded-full animate-pulse shadow-[0_0_8px_rgba(4,107,94,0.4)]" />
            {cycleInfo}
          </div>
        </div>
      )}

      <div className="flex items-start gap-8">
        {/* Avatar */}
        <div className="w-28 h-28 rounded-2xl bg-primary-container/20 border border-primary/10 flex items-center justify-center font-black text-primary text-4xl shadow-inner shrink-0">
          {fullName.charAt(0)}
        </div>

        {/* Info */}
        <div className="space-y-3 min-w-0">
          <h2 className="text-4xl font-headline font-extrabold text-on-surface tracking-tight truncate">
            {fullName}
          </h2>
          <p className="text-stone-500 font-bold text-sm flex items-center gap-2">
            <span
              className="material-symbols-outlined text-primary shrink-0"
              style={{ fontVariationSettings: "'opsz' 20" }}
            >
              medical_information
            </span>
            {diagnosis}
          </p>

          {/* Stat Chips */}
          <div className="flex flex-wrap gap-4 mt-8">
            {age !== undefined && (
              <div className="bg-surface-container-low px-5 py-3 rounded-xl border border-stone-50">
                <p className="text-[10px] text-stone-400 uppercase font-black tracking-widest mb-1">Usia</p>
                <p className="font-extrabold text-on-surface">{age || '—'} Tahun</p>
              </div>
            )}
            {(weight || height) && (
              <div className="bg-surface-container-low px-5 py-3 rounded-xl border border-stone-50">
                <p className="text-[10px] text-stone-400 uppercase font-black tracking-widest mb-1">BB/TB</p>
                <p className="font-extrabold text-on-surface">
                  {weight ?? '—'} / {height ?? '—'}
                </p>
              </div>
            )}
            {bp && (
              <div className="bg-surface-container-low px-5 py-3 rounded-xl border border-stone-50">
                <p className="text-[10px] text-stone-400 uppercase font-black tracking-widest mb-1">Tensi</p>
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
