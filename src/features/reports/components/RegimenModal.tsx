// ============================================================
// MESO App — Regimen Update Modal
// F-05: Modal untuk mengubah regimen kemoterapi pasien
// ============================================================
import React, { useState } from 'react'
import { toast } from 'react-hot-toast'
import { supabase } from '@lib/supabase'
import { useSubmitIntervention } from '../api/useInterventions'

interface RegimenModalProps {
  isOpen: boolean
  onClose: () => void
  patientId: string
  reportId?: string
}

export function RegimenModal({ isOpen, onClose, patientId, reportId }: RegimenModalProps) {
  const [regimen, setRegimen] = useState('')
  const [isPending, setIsPending] = useState(false)
  const submitIntervention = useSubmitIntervention()

  if (!isOpen) return null

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!regimen.trim()) {
      toast.error('Nama regimen tidak boleh kosong.')
      return
    }

    setIsPending(true)
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ cancer_site: regimen }) // Menggunakan cancer_site sebagai placeholder regimen untuk saat ini jika kolom regimen belum ada
        .eq('id', patientId)

      if (error) throw error
      
      if (reportId) {
        await submitIntervention.mutateAsync({
          reportId,
          adviceGiven: `Regimen diubah menjadi: ${regimen}`,
          status: 'resolved'
        })
      }
      
      toast.success('Regimen berhasil diperbarui.')
      onClose()
    } catch (err) {
      toast.error('Gagal memperbarui regimen.')
    } finally {
      setIsPending(false)
    }
  }

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <div 
        className="absolute inset-0 bg-stone-900/40 backdrop-blur-sm animate-in fade-in duration-300" 
        onClick={onClose} 
      />
      <div className="bg-white w-full max-w-md rounded-[40px] shadow-2xl relative z-10 overflow-hidden animate-in zoom-in-95 duration-300">
        <div className="p-8 bg-surface-container-low border-b border-stone-100">
          <h3 className="font-headline text-2xl font-black text-on-surface tracking-tight">Ubah Regimen Terapi</h3>
          <p className="text-on-surface-variant text-sm mt-1">Sesuaikan jenis regimen kemoterapi untuk pasien ini.</p>
        </div>

        <form onSubmit={handleSubmit} className="p-8 space-y-6">
          <div>
            <label className="text-[10px] font-black text-stone-400 uppercase tracking-widest block mb-2 px-1">Nama Regimen Baru</label>
            <input
              type="text"
              value={regimen}
              onChange={(e) => setRegimen(e.target.value)}
              className="w-full bg-stone-50 border border-stone-100 rounded-2xl px-6 py-4 text-sm focus:ring-2 focus:ring-primary/20 outline-none transition-all"
              placeholder="Contoh: AC-Taxol, CHOP, dll."
            />
          </div>

          <div className="flex gap-4 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-4 rounded-2xl font-bold text-sm text-stone-500 hover:bg-stone-50 transition-colors"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={isPending}
              className="flex-1 py-4 rounded-2xl bg-secondary text-white font-black text-sm hover:opacity-90 transition-all active:scale-95 shadow-lg shadow-secondary/20 disabled:opacity-60"
            >
              {isPending ? 'Menyimpan...' : 'Update Regimen'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
