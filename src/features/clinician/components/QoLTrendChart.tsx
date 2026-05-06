import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts'

interface QoLTrendChartProps {
  data?: {
    date: string;
    qolScore: number;
    isToday?: boolean;
  }[]
}

const defaultData = [
  { date: 'SEN', qolScore: 40 },
  { date: 'SEL', qolScore: 50 },
  { date: 'RAB', qolScore: 30 },
  { date: 'KAM', qolScore: 60 },
  { date: 'JUM', qolScore: 80, isToday: true },
  { date: 'SAB', qolScore: 50 },
  { date: 'MIN', qolScore: 40 },
]

export default function QoLTrendChart({ data = defaultData }: QoLTrendChartProps) {
  return (
    <div className="w-full h-full relative">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ top: 20, right: 10, left: -20, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
          <XAxis 
            dataKey="date" 
            axisLine={false} 
            tickLine={false} 
            tick={{ fontSize: 10, fontWeight: 800, fill: '#94a3b8' }} 
            dy={10}
          />
          <YAxis 
            axisLine={false} 
            tickLine={false} 
            tick={{ fontSize: 10, fontWeight: 800, fill: '#94a3b8' }} 
            domain={[0, 100]}
            ticks={[0, 25, 50, 75, 100]}
          />
          <Tooltip 
            cursor={{ fill: 'transparent' }}
            content={({ active, payload }) => {
              if (active && payload && payload.length) {
                return (
                  <div className="bg-teal-900 text-white px-3 py-2 rounded-xl shadow-xl text-[10px] font-black uppercase tracking-widest">
                    Skor: {payload[0].value}%
                  </div>
                )
              }
              return null
            }}
          />
          <Bar 
            dataKey="qolScore" 
            radius={[15, 15, 15, 15]} 
            barSize={32}
          >
            {data.map((entry, index) => (
              <Cell 
                key={`cell-${index}`} 
                fill={entry.isToday ? '#006a60' : '#d1fae5'} 
              />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>

      {/* "Hari Ini" Label overlay (Optional: only if isToday exists in data) */}
      {data.some(d => d.isToday) && (
        <div 
          className="absolute top-0 left-[85%] -translate-x-1/2 flex flex-col items-center pointer-events-none"
        >
           <div className="bg-stone-800 text-white px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest shadow-lg">
             Terbaru
           </div>
           <div className="w-[2px] h-4 bg-stone-800"></div>
        </div>
      )}
    </div>
  )
}
