// ============================================================
// PharmacistPatientDetail — Sub-komponen: Symptom Report Grid
// Single Responsibility: Render grid kartu gejala harian
// ============================================================
import { clsx } from 'clsx'
import { format } from 'date-fns'
import { id as localeId } from 'date-fns/locale'

interface SymptomItem {
  label: string
  value: number
  status?: string
}

interface SymptomReportGridProps {
  symptoms: SymptomItem[]
  reportDate?: string
}

const SYMPTOM_ICON_MAP: Record<string, string> = {
  mual: 'sick',
  muntah: 'sick',
  nyeri: 'speed',
  lelah: 'battery_2_bar',
  kelelahan: 'battery_2_bar',
  nafsu: 'restaurant',
  demam: 'thermostat',
  sesak: 'pulmonology',
  diare: 'water_drop',
}

function getSymptomIcon(label: string): string {
  const key = label.toLowerCase()
  for (const [keyword, icon] of Object.entries(SYMPTOM_ICON_MAP)) {
    if (key.includes(keyword)) return icon
  }
  return 'monitor_heart'
}

export function SymptomReportGrid({ symptoms, reportDate }: SymptomReportGridProps) {
  if (symptoms.length === 0) {
    return (
      <div className="py-16 text-center text-stone-400">
        <span className="material-symbols-outlined text-5xl mb-2 block opacity-30">health_metrics</span>
        <p className="text-xs font-black uppercase tracking-widest">Belum ada data gejala</p>
      </div>
    )
  }

  return (
    <section className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-baseline sm:justify-between gap-2 border-b border-stone-105/50 pb-4">
        <h3 className="text-2xl font-headline font-extrabold text-on-surface tracking-tight">
          Laporan Gejala Harian
        </h3>
        <span className="text-[11px] font-black text-stone-400 uppercase tracking-widest flex items-center gap-1.5">
          <span className="material-symbols-outlined text-sm text-stone-300">schedule</span>
          {reportDate 
            ? `Dikirim: ${format(new Date(reportDate), 'dd MMM yyyy, HH:mm', { locale: localeId })} WIB`
            : 'Data Terbaru'}
        </span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {symptoms.map((symptom, idx) => {
          const isCritical = symptom.value >= 4
          const icon = getSymptomIcon(symptom.label)

          return (
            <div
              key={idx}
              className={clsx(
                'p-8 rounded-2xl border transition-all duration-300 group',
                isCritical
                  ? 'bg-tertiary-container/20 border-tertiary/10'
                  : 'bg-white border-stone-100 hover:border-primary/20'
              )}
            >
              <div className="flex justify-between items-start mb-6">
                <div className={clsx('p-3 rounded-xl', isCritical ? 'bg-tertiary/10 text-tertiary' : 'bg-primary/10 text-primary')}>
                  <span
                    className="material-symbols-outlined text-3xl"
                    style={{ fontVariationSettings: "'FILL' 1" }}
                  >
                    {icon}
                  </span>
                </div>
                <span className={clsx('text-3xl font-black headline-font', isCritical ? 'text-tertiary' : 'text-primary')}>
                  {symptom.value}
                  <span className="text-sm font-bold text-stone-300">/5</span>
                </span>
              </div>

              <h4 className="font-extrabold text-on-surface mb-2 headline-font">{symptom.label}</h4>

              {/* Progress bar */}
              <div className="w-full bg-stone-100 h-2.5 rounded-full overflow-hidden border border-stone-50">
                <div
                  className={clsx(
                    'h-full rounded-full transition-all duration-1000',
                    isCritical ? 'bg-tertiary' : 'bg-primary'
                  )}
                  style={{ width: `${(symptom.value / 5) * 100}%` }}
                />
              </div>

              {symptom.status && (
                <p className={clsx(
                  'text-xs mt-4 italic font-medium leading-relaxed',
                  isCritical ? 'text-on-tertiary-container' : 'text-stone-500'
                )}>
                  &ldquo;{symptom.status}&rdquo;
                </p>
              )}
            </div>
          )
        })}
      </div>
    </section>
  )
}
