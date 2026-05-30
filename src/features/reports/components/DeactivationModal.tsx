// ============================================================
// PharmacistPatientDetail — Sub-komponen: DeactivationModal
// Single Responsibility: Modal premium konfirmasi deaktifasi pasien
// ============================================================
import { useState } from 'react'
import { X, ShieldAlert, Award, UserMinus, HeartCrack } from 'lucide-react'

interface DeactivationModalProps {
  isOpen: boolean
  onClose: () => void
  onConfirm: (reason: string) => void
  isPending?: boolean
}

export function DeactivationModal({
  isOpen,
  onClose,
  onConfirm,
  isPending = false
}: DeactivationModalProps) {
  const [selectedReason, setSelectedReason] = useState<string>('discharged')

  if (!isOpen) return null

  const reasons = [
    {
      id: 'discharged',
      label: 'Selesai Terapi (Discharged)',
      description: 'Pasien telah menyelesaikan siklus kemoterapi mereka dengan sukses.',
      icon: Award,
      colorClass: 'text-emerald-600 bg-emerald-50 border-emerald-100',
      activeBorder: 'border-emerald-500 bg-emerald-50/10'
    },
    {
      id: 'dismissed',
      label: 'Keluar dari Program (Dismissed)',
      description: 'Pasien mengunduh diri atau dirujuk ke program pemantauan luar.',
      icon: UserMinus,
      colorClass: 'text-stone-600 bg-stone-50 border-stone-100',
      activeBorder: 'border-stone-500 bg-stone-50/10'
    },
    {
      id: 'deceased',
      label: 'Meninggal Dunia (Deceased)',
      description: 'Pasien telah berpulang. Akses pelaporan akan dinonaktifkan permanen.',
      icon: HeartCrack,
      colorClass: 'text-rose-600 bg-rose-50 border-rose-100',
      activeBorder: 'border-rose-500 bg-rose-50/10'
    }
  ]

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-900/40 backdrop-blur-md animate-fade-in">
      <div className="bg-white rounded-[32px] w-full max-w-lg shadow-2xl border border-stone-150 relative overflow-hidden flex flex-col">
        
        {/* Header */}
        <header className="px-6 pt-6 pb-4 flex justify-between items-center border-b border-stone-50">
          <div className="flex items-center gap-2 text-stone-850 font-headline font-extrabold text-sm">
            <ShieldAlert size={18} className="text-amber-500" />
            <span>Deaktivasi Akun Pasien</span>
          </div>
          <button 
            onClick={onClose} 
            className="w-8 h-8 rounded-full bg-stone-50 hover:bg-stone-100 text-stone-400 hover:text-stone-600 flex items-center justify-center transition-colors active:scale-90"
          >
            <X size={16} />
          </button>
        </header>

        {/* Content */}
        <main className="p-6 overflow-y-auto max-h-[70vh] flex flex-col gap-5">
          <div>
            <p className="font-body text-xs text-stone-600 leading-relaxed">
              Anda akan menonaktifkan akun pasien ini dari program pemantauan aktif. Rekam medis masa lalu akan tetap diarsipkan secara aman untuk audit klinis.
            </p>
            <p className="font-body text-[10px] font-bold text-stone-450 mt-1 uppercase tracking-wider">
              Pilih Alasan Penonaktifan:
            </p>
          </div>

          <div className="flex flex-col gap-3">
            {reasons.map((r) => {
              const Icon = r.icon
              const isSelected = selectedReason === r.id

              return (
                <button
                  key={r.id}
                  type="button"
                  onClick={() => setSelectedReason(r.id)}
                  className={`p-4 rounded-2xl border text-left transition-all active:scale-[0.99] flex gap-3 ${
                    isSelected 
                      ? `${r.activeBorder} shadow-xs` 
                      : 'border-stone-100 hover:border-stone-300 bg-white'
                  }`}
                >
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 border ${r.colorClass}`}>
                    <Icon size={20} />
                  </div>
                  <div>
                    <h5 className="font-headline font-black text-xs text-stone-700">{r.label}</h5>
                    <p className="font-body text-[10px] text-stone-450 mt-0.5 leading-normal">{r.description}</p>
                  </div>
                </button>
              )
            })}
          </div>
        </main>

        {/* Footer */}
        <footer className="px-6 py-4 bg-stone-50 border-t border-stone-100 flex justify-end gap-3 rounded-b-[32px]">
          <button
            type="button"
            onClick={onClose}
            className="h-12 px-6 rounded-full font-headline font-bold text-xs bg-white border border-stone-200 text-stone-600 hover:bg-stone-50 active:scale-95 transition-all"
          >
            Batal
          </button>
          <button
            type="button"
            onClick={() => onConfirm(selectedReason)}
            disabled={isPending}
            className="h-12 px-6 rounded-full font-headline font-bold text-xs bg-rose-600 hover:bg-rose-500 text-white active:scale-95 transition-all shadow-md shadow-rose-200/50 flex items-center gap-1.5 disabled:opacity-50"
          >
            {isPending ? (
              <span className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : (
              <span>Deaktifkan Pasien</span>
            )}
          </button>
        </footer>
      </div>
    </div>
  )
}
