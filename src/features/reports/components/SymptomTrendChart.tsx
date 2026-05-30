import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'
import { clsx } from 'clsx'

interface TrendData {
  date: string
  mual: number
  nyeri: number
  lelah: number
  nafsu: number
}

interface SymptomTrendChartProps {
  trends: TrendData[]
}

export default function SymptomTrendChart({ trends }: SymptomTrendChartProps) {
  return (
    <section className="bg-white p-4 sm:p-10 rounded-3xl sm:rounded-[48px] border border-clinical-border shadow-clinical hover:shadow-clinical-lg hover:border-clinical-teal/20 transition-all group relative overflow-hidden bg-[radial-gradient(#f1eeec_1.5px,transparent_1.5px)] [background-size:24px_24px]">
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 mb-8 relative z-10">
        <div>
          <h2 className="font-display text-2xl sm:text-3xl font-extrabold text-clinical-text m-0 tracking-tight">Analisis Tren Klinis</h2>
          <p className="text-sm sm:text-base font-bold text-clinical-text-soft mt-2 tracking-tight">Visualisasi fluktuasi gejala utama dalam 5 periode laporan terakhir.</p>
        </div>
        <div className="flex flex-wrap items-center gap-4 sm:gap-6 px-4 sm:px-6 py-2 sm:py-3 bg-white/50 rounded-2xl border border-clinical-border self-start lg:self-auto">
          {[
            { key: 'mual', color: 'bg-clinical-danger', label: 'Mual' },
            { key: 'nyeri', color: 'bg-clinical-warning', label: 'Nyeri' },
            { key: 'lelah', color: 'bg-clinical-teal', label: 'Lelah' }
          ].map((item) => (
            <div key={item.key} className="flex items-center gap-2.5">
              <div className={clsx("w-2.5 h-2.5 rounded-full shadow-sm", item.color)} />
              <span className="text-[10px] font-black text-clinical-text uppercase tracking-[0.15em]">{item.label}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="h-96 w-full pr-4">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={trends} barGap={8}>
            <CartesianGrid strokeDasharray="8 8" vertical={false} stroke="#f1eeec" />
            <XAxis 
              dataKey="date" 
              axisLine={false} 
              tickLine={false} 
              tick={{ fontSize: 11, fontWeight: 900, fill: '#98a2b3', textAnchor: 'middle' }} 
              dy={15}
            />
            <YAxis 
              axisLine={false} 
              tickLine={false} 
              tick={{ fontSize: 11, fontWeight: 900, fill: '#98a2b3' }} 
              domain={[0, 4]}
              ticks={[0, 1, 2, 3, 4]}
              dx={-10}
            />
            <Tooltip 
              contentStyle={{ 
                borderRadius: '24px', 
                border: '1px solid #f1eeec', 
                boxShadow: '0 20px 40px rgba(0,0,0,0.08)', 
                fontFamily: 'inherit',
                padding: '16px 20px',
                fontWeight: '800'
              }}
              cursor={{ fill: '#fdfcfb', radius: 12 }}
            />
            <Bar dataKey="mual" fill="#d92d20" radius={[6, 6, 0, 0]} barSize={20} />
            <Bar dataKey="nyeri" fill="#f79009" radius={[6, 6, 0, 0]} barSize={20} />
            <Bar dataKey="lelah" fill="#088374" radius={[6, 6, 0, 0]} barSize={20} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </section>
  )
}
