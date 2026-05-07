// ============================================================
// MESO App — Intervention Form Modal
// F-04: Form untuk memberikan intervensi klinis kepada pasien
// ============================================================
import React, { useState } from 'react'
import { toast } from 'react-hot-toast'
import { useSubmitIntervention } from '../api/useInterventions'

interface InterventionModalProps {
  isOpen: boolean
  onClose: () => void
  patientId: string
  reportId?: string
}

export function InterventionModal({ isOpen, onClose, patientId: _patientId, reportId }: InterventionModalProps) {
  const [content, setContent] = useState('')
  const submitIntervention = useSubmitIntervention()

  if (!isOpen) return null

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!content.trim()) {
      toast.error('Catatan intervensi tidak boleh kosong.')
      return
    }

    if (!reportId) {
      toast.error('Gagal: Report ID tidak ditemukan.')
      return
    }

    submitIntervention.mutate(
      { 
        reportId, 
        adviceGiven: content 
      },
      {
        onSuccess: () => {
          toast.success('Intervensi berhasil disimpan.')
          setContent('')
          onClose()
        },
        onError: () => {
          toast.error('Gagal menyimpan intervensi.')
        }
      }
    )
  }

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <div 
        className="absolute inset-0 bg-stone-900/40 backdrop-blur-sm animate-in fade-in duration-300" 
        onClick={onClose} 
      />
      <div className="bg-white w-full max-w-lg rounded-[40px] shadow-2xl relative z-10 overflow-hidden animate-in zoom-in-95 duration-300">
        <div className="p-8 bg-surface-container-low border-b border-stone-100">
          <h3 className="headline-font text-2xl font-black text-on-surface tracking-tight">Catatan Intervensi Klinis</h3>
          <p className="text-on-surface-variant text-sm mt-1">Berikan panduan atau tindakan klinis untuk pasien ini.</p>
        </div>

        <form onSubmit={handleSubmit} className="p-8 space-y-6">
          <div>
            <label className="text-[10px] font-black text-stone-400 uppercase tracking-widest block mb-2 px-1">Isi Intervensi</label>
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              className="w-full h-48 bg-stone-50 border border-stone-100 rounded-3xl p-6 text-sm focus:ring-2 focus:ring-primary/20 outline-none transition-all placeholder:text-stone-300"
              placeholder="Contoh: Kurangi dosis obat anti-emetik, berikan tambahan cairan oral..."
            />
          </div>

          <div className="flex gap-4 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-4 rounded-2xl font-bold text-sm text-stone-500 hover:bg-stone-50 transition-colors"
            >
              Batalkan
            </button>
            <button
              type="submit"
              disabled={submitIntervention.isPending}
              className="flex-1 py-4 rounded-2xl bg-primary text-on-primary font-black text-sm hover:opacity-90 transition-all active:scale-95 shadow-lg shadow-primary/20 disabled:opacity-60"
            >
              {submitIntervention.isPending ? 'Menyimpan...' : 'Simpan Intervensi'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
