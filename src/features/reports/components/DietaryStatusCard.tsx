// ============================================================
// PharmacistPatientDetail — Sub-komponen: Dietary Status Card
// Single Responsibility: Render informasi asupan nutrisi
// ============================================================

interface DietaryItem {
  label: string
  value: number
  unit?: string
}

interface DietaryStatusCardProps {
  items: DietaryItem[]
}

export function DietaryStatusCard({ items }: DietaryStatusCardProps) {
  if (items.length === 0) return null

  return (
    <div className="bg-stone-50/50 rounded-2xl p-6 border border-stone-100">
      <div className="flex items-center gap-2 mb-6">
        <span className="material-symbols-outlined text-stone-400">restaurant</span>
        <h4 className="text-sm font-black text-stone-500 uppercase tracking-widest headline-font">Status Nutrisi</h4>
      </div>

      <div className="grid grid-cols-2 gap-4">
        {items.map((item, idx) => (
          <div key={idx} className="bg-white p-4 rounded-xl border border-stone-100 shadow-sm">
            <p className="text-[10px] font-bold text-stone-400 uppercase tracking-tight mb-1">{item.label}</p>
            <div className="flex items-baseline gap-1">
              <span className="text-xl font-black text-primary headline-font">{item.value}</span>
              {item.unit && <span className="text-[10px] font-bold text-stone-400 uppercase">{item.unit}</span>}
            </div>
            
            {/* Visual Indicator (Scale of 5 for food, arbitrary for water) */}
            <div className="mt-3 h-1 w-full bg-stone-100 rounded-full overflow-hidden">
              <div 
                className="h-full bg-primary/40 rounded-full" 
                style={{ width: `${Math.min((item.value / 8) * 100, 100)}%` }} 
              />
            </div>
          </div>
        ))}
      </div>
      
      <p className="mt-4 text-[10px] text-stone-400 italic">
        * Data ini digunakan untuk pemantauan asupan harian pasien selama masa pemulihan.
      </p>
    </div>
  )
}
