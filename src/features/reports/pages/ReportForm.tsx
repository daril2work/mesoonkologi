import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { SYMPTOMS_UI_CONFIG } from '../constants/symptoms.ui'
import type { SymptomData } from '../types'
import { useSubmitReport } from '../api/useSubmitReport'
import { ROUTES } from '@configs/app.config'
import PatientLayout from '../components/PatientLayout'
import { EmoticonScale, BinaryScale, CounterInput, PortionScale } from '../components/ScaleInputs'
import { ArrowLeft, Heart, Send, Coffee } from 'lucide-react'

export default function ReportForm() {
  const navigate = useNavigate()
  const { mutate: submitReport, isPending } = useSubmitReport()
  
  const [formData, setFormData] = useState<SymptomData>({})

  const handleChange = (key: keyof SymptomData, value: number) => {
    setFormData((prev) => ({ ...prev, [key]: value }))
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    submitReport({ symptoms: formData }, {
      onSuccess: () => navigate(ROUTES.PATIENT_DASHBOARD),
    })
  }

  return (
    <PatientLayout>
      <div className="flex flex-col min-h-screen bg-surface-container-low">
        
        {/* Top Header */}
        <header className="flex justify-between items-center px-6 pt-6 pb-4 bg-surface-container-low sticky top-0 z-10 backdrop-blur-md">
          <button 
            onClick={() => navigate(-1)} 
            className="text-primary flex items-center gap-2 font-headline font-bold text-sm hover:opacity-80 transition-opacity"
          >
            <ArrowLeft size={20} /> Lapor Gejala
          </button>
          <div className="text-primary font-headline font-extrabold text-[0.7rem] uppercase tracking-widest opacity-60">
            Sahabat Pejuang
          </div>
        </header>

        <main className="px-6 pb-12">
          
          <section className="mb-8 animate-fade-in">
            <h1 className="font-headline text-3xl font-bold text-primary mb-2 leading-tight tracking-tight">
              Lapor Gejala Hari Ini
            </h1>
            <p className="font-body text-sm text-on-surface-variant leading-relaxed">
              Bagaimana perasaan Ibu hari ini? Laporan Ibu membantu kami memberikan dukungan yang tepat.
            </p>
          </section>

          <form onSubmit={handleSubmit} className="flex flex-col gap-10">
            
            {/* Gejala Section */}
            <section>
              <h2 className="font-headline text-lg font-bold text-on-surface mb-6 flex items-center gap-2">
                <Heart size={20} className="text-error" fill="currentColor" /> Gejala & Vitalitas
              </h2>
              
              <div className="flex flex-col gap-4">
                {SYMPTOMS_UI_CONFIG.map((symptom) => {
                  const currentValue = formData[symptom.key as keyof SymptomData] ?? null

                  return (
                    <div 
                      key={symptom.key} 
                      className="bg-white rounded-[28px] p-6 shadow-sm border border-surface-container-low transition-all hover:shadow-md"
                    >
                      <h3 className="font-headline text-base font-bold text-on-surface mb-1">
                        {symptom.label}
                      </h3>
                      <p className="font-body text-[0.75rem] text-on-surface-variant mb-4 leading-normal">
                        {symptom.description}
                      </p>

                      <div className="mt-2">
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

            {/* Nutrisi Section */}
            <section>
              <h2 className="font-headline text-lg font-bold text-on-surface mb-6 flex items-center gap-2">
                <Coffee size={20} className="text-primary" /> Nutrisi & Hidrasi
              </h2>
              
              <div className="flex flex-col gap-4">
                {/* Water Intake */}
                <div className="bg-white rounded-[28px] p-8 shadow-sm border border-surface-container-low transition-all hover:shadow-md">
                  <h3 className="font-headline text-base font-bold text-on-surface mb-1 flex items-center gap-2">
                    Asupan Air Putih
                  </h3>
                  <p className="font-body text-[0.75rem] text-on-surface-variant mb-6 leading-normal">
                    Sudah berapa gelas air putih yang Ibu minum hari ini?
                  </p>
                  <CounterInput 
                    value={formData.waterIntake ?? 0} 
                    onChange={(val) => handleChange('waterIntake', val)} 
                  />
                </div>

                {/* Food Intake */}
                <div className="bg-white rounded-[28px] p-8 shadow-sm border border-surface-container-low transition-all hover:shadow-md">
                  <h3 className="font-headline text-base font-bold text-on-surface mb-1 flex items-center gap-2">
                    Porsi Makan
                  </h3>
                  <p className="font-body text-[0.75rem] text-on-surface-variant mb-6 leading-normal">
                    Bagaimana porsi makan Ibu hari ini dibandingkan biasanya?
                  </p>
                  <PortionScale 
                    value={formData.foodIntake ?? null} 
                    onChange={(val) => handleChange('foodIntake', val)} 
                  />
                </div>
              </div>
            </section>

            {/* Inspirational Card */}
            <section className="bg-gradient-to-br from-primary-fixed to-primary-fixed-variant rounded-[32px] p-8 text-white text-center shadow-lg shadow-primary/10 relative overflow-hidden">
               <div className="absolute top-0 left-0 opacity-10 text-9xl -translate-x-1/4 -translate-y-1/4">🌿</div>
               <p className="font-headline italic text-sm font-semibold relative z-1 leading-relaxed">
                 "Setiap langkah kecil Ibu menuju pemulihan adalah sebuah kemenangan bagi kita semua."
               </p>
            </section>

            {/* Thank you box */}
            <section className="bg-primary-container/30 rounded-[32px] p-8 text-center border border-primary-container">
              <div className="flex justify-center mb-4">
                <Heart size={32} className="text-primary animate-pulse" fill="currentColor" />
              </div>
              <p className="font-body text-sm text-primary leading-relaxed">
                Laporan Ibu sangat berharga.<br/>
                <span className="font-headline font-bold text-base mt-2 block">Terima kasih sudah memantau kesehatan hari ini.</span>
              </p>
            </section>

            <button
              type="submit"
              disabled={isPending}
              className={`
                w-full h-16 rounded-full font-headline font-bold text-base
                flex items-center justify-center gap-2 transition-all active:scale-95 shadow-lg
                ${isPending 
                  ? 'bg-surface-container-high text-on-surface-variant cursor-not-allowed shadow-none' 
                  : 'bg-primary text-on-primary hover:opacity-90 shadow-primary/20'
                }
              `}
            >
              {isPending ? (
                <>
                  <span className="animate-spin rounded-full h-5 w-5 border-2 border-on-surface-variant border-t-transparent" />
                  Mengirim...
                </>
              ) : (
                <>
                  Kirim Laporan <Send size={20} />
                </>
              )}
            </button>

          </form>
        </main>
      </div>
    </PatientLayout>
  )
}

