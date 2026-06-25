import { clsx } from 'clsx'

interface VitalsCardProps {
  systolic?: number
  diastolic?: number
  heartRate?: number
  temperature?: number
  spo2?: number
}

export default function VitalsCard({ systolic, diastolic, heartRate, temperature, spo2 }: VitalsCardProps) {
  return (
    <div className="grid grid-cols-2 lg:grid-cols-1 gap-6 md:gap-8">
      {/* Heart Rate & Temp - 2 Columns on Mobile */}
      <div className="bg-white p-6 md:p-10 rounded-[32px] md:rounded-[40px] border border-stone-50 shadow-sm flex flex-col items-center text-center gap-4 group hover:shadow-lg transition-all">
        <div className="w-12 h-12 md:w-20 md:h-20 rounded-full bg-red-50 flex items-center justify-center text-red-600 shadow-inner group-hover:scale-110 transition-transform">
          <span className="material-symbols-outlined text-2xl md:text-4xl" style={{ fontVariationSettings: "'FILL' 1" }}>favorite</span>
        </div>
        <div>
          <p className="text-[10px] md:text-xs font-black text-stone-400 uppercase tracking-widest mb-1">Detak Jantung</p>
          <p className="text-xl md:text-4xl font-black font-headline text-stone-700">{heartRate ?? '—'} <span className="text-xs md:text-sm font-bold text-stone-400 uppercase tracking-widest">bpm</span></p>
        </div>
      </div>

      <div className="bg-white p-6 md:p-10 rounded-[32px] md:rounded-[40px] border border-stone-50 shadow-sm flex flex-col items-center text-center gap-4 group hover:shadow-lg transition-all">
        <div className="w-12 h-12 md:w-20 md:h-20 rounded-full bg-cyan-50 flex items-center justify-center text-cyan-600 shadow-inner group-hover:scale-110 transition-transform">
          <span className="material-symbols-outlined text-2xl md:text-4xl" style={{ fontVariationSettings: "'FILL' 1" }}>device_thermostat</span>
        </div>
        <div>
          <p className="text-[10px] md:text-xs font-black text-stone-400 uppercase tracking-widest mb-1">Suhu Tubuh</p>
          <p className="text-xl md:text-4xl font-black font-headline text-stone-700">{temperature ?? '—'} <span className="text-xs md:text-sm font-bold text-stone-400 uppercase tracking-widest">°C</span></p>
        </div>
      </div>

      {/* Blood Pressure - Full Width */}
      <div className="col-span-2 lg:col-span-1 bg-white p-8 md:p-12 rounded-[40px] md:rounded-[48px] border border-stone-50 shadow-sm flex items-center justify-between gap-6 group hover:shadow-lg transition-all relative overflow-hidden">
        <div className="flex items-center gap-6 md:gap-10">
           <div className="w-14 h-14 md:w-24 md:h-24 rounded-3xl bg-purple-50 flex items-center justify-center text-purple-600 shadow-inner group-hover:rotate-12 transition-transform">
             <span className="material-symbols-outlined text-3xl md:text-5xl" style={{ fontVariationSettings: "'FILL' 1" }}>pulmonology</span>
           </div>
           <div>
             <p className="text-[10px] md:text-xs font-black text-stone-400 uppercase tracking-widest mb-1">Tekanan Darah</p>
             <p className="text-2xl md:text-5xl font-black font-headline text-stone-700">{systolic && diastolic ? `${systolic}/${diastolic}` : '—'} <span className="text-xs md:text-sm font-bold text-stone-400 uppercase tracking-widest ml-2">mmHg</span></p>
           </div>
        </div>
        {/* Decorative Waveform (Bars) */}
        <div className="flex items-end gap-1.5 h-12 md:h-20 pr-4">
           {[30, 50, 40, 70, 90, 60, 45, 80].map((h, i) => (
             <div 
               key={i} 
               className={clsx(
                 "w-2 md:w-3 rounded-full transition-all duration-700",
                 i > 5 ? "bg-teal-600/60" : "bg-teal-600/20"
               )} 
               style={{ height: `${h}%` }}
             ></div>
           ))}
        </div>
      </div>
      {/* SpO2 — A-04: Prop yang sebelumnya didefinisikan tapi tidak dirender */}
      {spo2 !== undefined && (
        <div className="col-span-2 lg:col-span-1 bg-white p-6 md:p-10 rounded-[32px] md:rounded-[40px] border border-stone-50 shadow-sm flex flex-col items-center text-center gap-4 group hover:shadow-lg transition-all">
          <div className="w-12 h-12 md:w-20 md:h-20 rounded-full bg-blue-50 flex items-center justify-center text-blue-600 shadow-inner group-hover:scale-110 transition-transform">
            <span className="material-symbols-outlined text-2xl md:text-4xl" style={{ fontVariationSettings: "'FILL' 1" }}>air</span>
          </div>
          <div>
            <p className="text-[10px] md:text-xs font-black text-stone-400 uppercase tracking-widest mb-1">Saturasi O₂</p>
            <p className="text-xl md:text-4xl font-black font-headline text-stone-700">
              {spo2} <span className="text-xs md:text-sm font-bold text-stone-400 uppercase tracking-widest">%</span>
            </p>
          </div>
        </div>
      )}
    </div>
  )
}
