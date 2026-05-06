// ============================================================
// PharmacistPatientDetail — Sub-komponen: Patient Trend Chart
// Single Responsibility: Render bar chart tren gejala mingguan
// ============================================================

interface TrendEntry {
  date: string
  mual: number
  nyeri: number
  lelah: number
  nafsu: number
}

interface PatientTrendChartProps {
  trends: TrendEntry[]
}

export function PatientTrendChart({ trends }: PatientTrendChartProps) {
  if (trends.length === 0) {
    return (
      <section className="bg-surface-container-low/50 p-10 rounded-2xl border border-stone-100">
        <div className="py-12 text-center text-stone-300">
          <span className="material-symbols-outlined text-5xl block mb-2" style={{ fontVariationSettings: "'wght' 200" }}>
            show_chart
          </span>
          <p className="text-xs font-black uppercase tracking-widest">Belum ada data tren</p>
        </div>
      </section>
    )
  }

  return (
    <section className="bg-white p-10 rounded-[32px] border border-stone-100 shadow-sm relative overflow-hidden group">
      {/* Background Decorative Gradient */}
      <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-full -mr-16 -mt-16 blur-3xl group-hover:bg-primary/10 transition-colors duration-1000"></div>

      <div className="flex justify-between items-start mb-10 relative z-10">
        <div>
          <h3 className="text-xl font-headline font-black text-on-surface tracking-tight">
            Tren Intensitas Gejala
          </h3>
          <p className="text-[10px] font-black text-stone-400 uppercase tracking-widest mt-1">Analisis {trends.length} Laporan Terakhir</p>
        </div>
        <div className="flex gap-2">
          <span className="w-8 h-8 rounded-lg bg-stone-50 flex items-center justify-center text-stone-400">
            <span className="material-symbols-outlined text-sm">show_chart</span>
          </span>
        </div>
      </div>

      <div className="h-48 flex items-end justify-between gap-6 px-4 relative z-10">
        {trends.map((col, idx) => {
          // Max possible sum is 20 (5 * 4)
          const scale = 100 / 20 
          
          return (
            <div key={idx} className="flex flex-col items-center flex-1 gap-4 h-full group/col">
              <div className="w-full bg-stone-50 h-full rounded-2xl relative flex flex-col justify-end overflow-hidden border border-stone-100/50">
                {/* Nafsu - Purple */}
                <div 
                  className="w-full bg-indigo-400/80 transition-all duration-700 delay-300 hover:brightness-110" 
                  style={{ height: `${col.nafsu * scale}%` }}
                  title={`Nafsu Makan: ${col.nafsu}`}
                />
                {/* Lelah - Amber */}
                <div 
                  className="w-full bg-amber-400/80 transition-all duration-700 delay-200 hover:brightness-110" 
                  style={{ height: `${col.lelah * scale}%` }}
                  title={`Kelelahan: ${col.lelah}`}
                />
                {/* Nyeri - Rose */}
                <div 
                  className="w-full bg-rose-400/80 transition-all duration-700 delay-100 hover:brightness-110" 
                  style={{ height: `${col.nyeri * scale}%` }}
                  title={`Nyeri: ${col.nyeri}`}
                />
                {/* Mual - Teal */}
                <div 
                  className="w-full bg-teal-400/80 transition-all duration-700 hover:brightness-110" 
                  style={{ height: `${col.mual * scale}%` }}
                  title={`Mual: ${col.mual}`}
                />
              </div>
              <span className="text-[10px] font-black text-stone-500 uppercase tracking-tighter opacity-70 group-hover/col:opacity-100 transition-opacity">
                {col.date}
              </span>
            </div>
          )
        })}
      </div>

      {/* Legend - Detailed */}
      <div className="mt-10 grid grid-cols-2 sm:grid-cols-4 gap-4 border-t border-stone-100 pt-8 relative z-10">
        <div className="flex items-center gap-2.5">
          <span className="w-2.5 h-2.5 bg-teal-400 rounded-full" />
          <span className="text-[9px] font-black text-stone-400 uppercase tracking-widest">Mual</span>
        </div>
        <div className="flex items-center gap-2.5">
          <span className="w-2.5 h-2.5 bg-rose-400 rounded-full" />
          <span className="text-[9px] font-black text-stone-400 uppercase tracking-widest">Nyeri</span>
        </div>
        <div className="flex items-center gap-2.5">
          <span className="w-2.5 h-2.5 bg-amber-400 rounded-full" />
          <span className="text-[9px] font-black text-stone-400 uppercase tracking-widest">Lelah</span>
        </div>
        <div className="flex items-center gap-2.5">
          <span className="w-2.5 h-2.5 bg-indigo-400 rounded-full" />
          <span className="text-[9px] font-black text-stone-400 uppercase tracking-widest">Nafsu</span>
        </div>
      </div>
    </section>
  )
}
