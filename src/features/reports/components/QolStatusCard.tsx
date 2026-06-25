// ============================================================
// PharmacistPatientDetail — Sub-komponen: Qol Status Card
// Single Responsibility: Render informasi kualitas hidup pasien (EQ-5D-3L)
// ============================================================
import { clsx } from 'clsx'

interface QolData {
  mobility?: number
  selfCare?: number
  usualActivities?: number
  painDiscomfort?: number
  anxietyDepression?: number
}

interface QolStatusCardProps {
  qol: QolData | null | undefined
}

interface QolDomainConfig {
  label: string
  icon: string
  descriptions: Record<number, string>
}

const DOMAIN_CONFIGS: Record<keyof QolData, QolDomainConfig> = {
  mobility: {
    label: 'Mobilitas (Kemampuan Berjalan)',
    icon: 'directions_walk',
    descriptions: {
      1: 'Tidak ada kesulitan berjalan',
      2: 'Ada beberapa kesulitan berjalan',
      3: 'Hanya bisa berbaring di tempat tidur'
    }
  },
  selfCare: {
    label: 'Perawatan Diri (Self-care)',
    icon: 'clean_hands',
    descriptions: {
      1: 'Tidak ada kesulitan merawat diri',
      2: 'Ada beberapa kesulitan mandi/berpakaian',
      3: 'Tidak mampu mandi/berpakaian sendiri'
    }
  },
  usualActivities: {
    label: 'Kegiatan Utama sehari-hari',
    icon: 'work',
    descriptions: {
      1: 'Tidak ada kesulitan beraktivitas normal',
      2: 'Ada beberapa kesulitan beraktivitas',
      3: 'Tidak mampu melakukan aktivitas sehari-hari'
    }
  },
  painDiscomfort: {
    label: 'Rasa Nyeri / Tidak Nyaman',
    icon: 'healing',
    descriptions: {
      1: 'Tidak merasa nyeri/tidak nyaman',
      2: 'Nyeri/tidak nyaman tingkat sedang',
      3: 'Nyeri/tidak nyaman yang sangat hebat'
    }
  },
  anxietyDepression: {
    label: 'Rasa Cemas / Depresi',
    icon: 'sentiment_dissatisfied',
    descriptions: {
      1: 'Tidak merasa cemas/depresi',
      2: 'Merasa cemas/depresi sedang',
      3: 'Cemas/depresi yang sangat hebat'
    }
  }
}

export function QolStatusCard({ qol }: QolStatusCardProps) {
  if (!qol || Object.keys(qol).length === 0) return null

  // Calculate EQ-5D index sum (5 is best, 15 is worst)
  const values = Object.values(qol).filter((v) => typeof v === 'number') as number[]
  const scoreSum = values.reduce((sum, v) => sum + v, 0)
  const maxPossible = values.length * 3
  const minPossible = values.length * 1
  
  // Percentage index of quality of life (100% is best)
  // Formula: ((max - actual) / (max - min)) * 100
  const qolPercentage = values.length > 0 
    ? Math.round(((maxPossible - scoreSum) / (maxPossible - minPossible)) * 100)
    : 0

  return (
    <div className="bg-gradient-to-br from-emerald-50/40 to-teal-50/20 rounded-3xl p-6 sm:p-8 border border-emerald-100/50 shadow-sm relative overflow-hidden group">
      {/* Background decoration */}
      <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-100/20 rounded-full blur-3xl -mr-10 -mt-10" />

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8 border-b border-emerald-100/50 pb-5">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-800 flex items-center justify-center">
            <span className="material-symbols-outlined text-2xl font-bold">spa</span>
          </div>
          <div>
            <h4 className="text-base font-extrabold text-stone-800 font-headline">Pemantauan Kualitas Hidup (QoL)</h4>
            <p className="text-[10px] font-black text-emerald-600 uppercase tracking-widest mt-0.5">Metode EQ-5D-3L</p>
          </div>
        </div>

        {/* Global QoL Score Index */}
        <div className="bg-white px-5 py-3 rounded-2xl border border-emerald-100 flex items-center gap-3 shadow-xs">
          <div className="flex flex-col">
            <span className="text-[9px] font-black text-stone-400 uppercase tracking-wider">Indeks Kualitas Hidup</span>
            <span className="text-xs font-bold text-stone-700">
              Status: {qolPercentage >= 80 ? 'Sangat Baik 🌿' : qolPercentage >= 50 ? 'Cukup Stabil ⚠️' : 'Perlu Perhatian 🚨'}
            </span>
          </div>
          <div className="h-10 w-px bg-stone-100" />
          <span className="text-3xl font-black text-emerald-700 font-headline tracking-tighter">
            {qolPercentage}%
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {Object.entries(DOMAIN_CONFIGS).map(([key, config]) => {
          const val = qol[key as keyof QolData]
          if (val === undefined || val === null) return null

          const isOptimal = val === 1
          const isWarning = val === 2
          const isCritical = val === 3

          return (
            <div 
              key={key} 
              className={clsx(
                "p-5 rounded-2xl border transition-all duration-300 bg-white",
                isOptimal && "border-stone-100 hover:border-emerald-200/60 shadow-xs",
                isWarning && "border-amber-100 bg-amber-50/10 shadow-xs",
                isCritical && "border-rose-100 bg-rose-50/10 shadow-xs"
              )}
            >
              <div className="flex justify-between items-start mb-4">
                <div className="flex items-center gap-2.5">
                  <div className={clsx(
                    "p-2 rounded-lg flex items-center justify-center shrink-0",
                    isOptimal && "bg-emerald-50 text-emerald-700",
                    isWarning && "bg-amber-50 text-amber-700",
                    isCritical && "bg-rose-50 text-rose-700"
                  )}>
                    <span className="material-symbols-outlined text-lg">{config.icon}</span>
                  </div>
                  <span className="font-extrabold text-stone-700 text-xs tracking-tight">{config.label}</span>
                </div>
                
                {/* Level badge */}
                <span className={clsx(
                  "text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full shrink-0",
                  isOptimal && "bg-emerald-100/50 text-emerald-800",
                  isWarning && "bg-amber-100/60 text-amber-800",
                  isCritical && "bg-rose-100/60 text-rose-800"
                )}>
                  Level {val}
                </span>
              </div>

              {/* Progress visual bar */}
              <div className="w-full bg-stone-100 h-1.5 rounded-full overflow-hidden mb-3">
                <div 
                  className={clsx(
                    "h-full rounded-full transition-all duration-700",
                    isOptimal && "bg-emerald-500",
                    isWarning && "bg-amber-500",
                    isCritical && "bg-rose-500"
                  )} 
                  style={{ width: `${(val / 3) * 100}%` }}
                />
              </div>

              <p className={clsx(
                "text-[11px] font-medium leading-relaxed",
                isOptimal && "text-stone-500",
                isWarning && "text-amber-800/90 font-bold",
                isCritical && "text-rose-800/90 font-bold"
              )}>
                &ldquo;{config.descriptions[val]}&rdquo;
              </p>
            </div>
          )
        })}
      </div>
    </div>
  )
}
