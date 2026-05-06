import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { SYMPTOMS_UI_CONFIG } from '../constants/symptoms.ui'
import type { SymptomData } from '../types'
import { useSubmitReport } from '../api/useSubmitReport'
import { usePatientDirectory } from '../api/usePatientDirectory'
import { ROUTES } from '@configs/app.config'
import PharmacistLayout from '../components/PharmacistLayout'
import { EmoticonScale, BinaryScale } from '../components/ScaleInputs'
import { Send, User } from 'lucide-react'
import toast from 'react-hot-toast'

export default function PharmacistReportForm() {
  const navigate = useNavigate()
  const { data: patients, isLoading: isLoadingPatients } = usePatientDirectory()
  const { mutate: submitReport, isPending } = useSubmitReport()
  
  const [selectedPatientId, setSelectedPatientId] = useState('')
  const [formData, setFormData] = useState<SymptomData>({})

  const handleChange = (key: keyof SymptomData, value: number) => {
    setFormData((prev) => ({ ...prev, [key]: value }))
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!selectedPatientId) {
      toast.error('Pilih pasien terlebih dahulu')
      return
    }

    submitReport({ symptoms: formData, patientId: selectedPatientId }, {
      onSuccess: () => navigate(ROUTES.PHARMA_DASHBOARD),
    })
  }

  return (
    <PharmacistLayout>
      <div className="p-8 max-w-4xl mx-auto pb-20">
        
        {/* Header Section */}
        <div className="mb-10">
          <h2 className="text-3xl headline-font font-extrabold text-on-surface mb-2">Input Laporan Manual</h2>
          <p className="text-on-surface-variant font-medium">Gunakan formulir ini jika pasien melapor melalui telepon atau secara langsung.</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-10">
          
          {/* Patient Selection Card */}
          <section className="bg-white p-8 rounded-2xl shadow-sm border border-stone-100">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary">
                <User size={20} />
              </div>
              <h3 className="text-lg font-bold text-on-surface headline-font">Pilih Pasien</h3>
            </div>
            
            <div className="relative">
              <select 
                value={selectedPatientId}
                onChange={(e) => setSelectedPatientId(e.target.value)}
                className="w-full h-14 bg-stone-50 border border-stone-100 rounded-xl px-4 text-sm font-medium focus:ring-2 focus:ring-primary/20 outline-none appearance-none"
                disabled={isLoadingPatients}
              >
                <option value="">-- Cari atau Pilih Pasien --</option>
                {patients?.map(p => (
                  <option key={p.id} value={p.id}>{p.fullName} (ID: {p.id.slice(0, 6).toUpperCase()})</option>
                ))}
              </select>
              <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-stone-400">
                <span className="material-symbols-outlined">expand_more</span>
              </div>
            </div>
          </section>

          {/* Symptoms Section */}
          <section className="space-y-6">
            <h3 className="text-lg font-bold text-on-surface headline-font px-2">Gejala & Kondisi Pasien</h3>
            <div className="grid grid-cols-1 gap-4">
              {SYMPTOMS_UI_CONFIG.map((symptom) => {
                const currentValue = formData[symptom.key as keyof SymptomData] ?? null

                return (
                  <div 
                    key={symptom.key} 
                    className="bg-white rounded-2xl p-6 shadow-sm border border-stone-100 transition-all hover:shadow-md"
                  >
                    <div className="flex justify-between items-start mb-2">
                      <h4 className="font-bold text-on-surface">{symptom.label}</h4>
                      {symptom.isSentinel && (
                        <span className="bg-error/10 text-error text-[9px] font-black uppercase tracking-widest px-2 py-0.5 rounded">Prioritas</span>
                      )}
                    </div>
                    <p className="text-xs text-on-surface-variant mb-6 leading-relaxed opacity-70">
                      {symptom.description}
                    </p>

                    <div className="flex items-center justify-center py-2">
                      {symptom.isSentinel ? (
                        <BinaryScale 
                          value={currentValue} 
                          onChange={(val) => handleChange(symptom.key as keyof SymptomData, val)} 
                        />
                      ) : (
                        <EmoticonScale 
                          value={currentValue} 
                          onChange={(val) => handleChange(symptom.key as keyof SymptomData, val)} 
                        />
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          </section>

          {/* Action Footer */}
          <div className="pt-6">
            <button
              type="submit"
              disabled={isPending || !selectedPatientId}
              className={`
                w-full h-16 rounded-2xl font-headline font-black text-sm uppercase tracking-widest
                flex items-center justify-center gap-3 transition-all active:scale-95 shadow-lg
                ${isPending || !selectedPatientId
                  ? 'bg-stone-200 text-stone-400 cursor-not-allowed shadow-none' 
                  : 'bg-primary text-on-primary hover:opacity-90 shadow-primary/20'
                }
              `}
            >
              {isPending ? 'Mencatat...' : 'Simpan Laporan Manual'}
              {!isPending && <Send size={18} />}
            </button>
            <p className="text-center text-[10px] text-stone-400 font-bold uppercase tracking-widest mt-6">
              Laporan akan otomatis dianalisis oleh sistem (CTCAE V5.0)
            </p>
          </div>

        </form>
      </div>
    </PharmacistLayout>
  )
}
