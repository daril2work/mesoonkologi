import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { SYMPTOMS_UI_CONFIG } from '../constants/symptoms.ui'
import type { SymptomData } from '../types'
import { useSubmitReport } from '../api/useSubmitReport'
import { ROUTES } from '@configs/app.config'
import PatientLayout from '../components/PatientLayout'
import { EmoticonScale, BinaryScale, CounterInput, PortionScale } from '../components/ScaleInputs'
import { ArrowLeft, Heart, Send, Coffee, ClipboardList, Smile, ArrowRight, Check } from 'lucide-react'
import { useAuthStore } from '../../auth/store'
import toast from 'react-hot-toast'
import { usePatientQolStatus } from '../hooks/usePatientQolStatus'

export default function ReportForm() {
  const navigate = useNavigate()
  const { mutate: submitReport, isPending } = useSubmitReport()
  
  const [formData, setFormData] = useState<SymptomData>({})
  const { user } = useAuthStore()
  const { isQolActive } = usePatientQolStatus(user?.id)
  const [activeTab, setActiveTab] = useState<'meso' | 'qol'>('meso')

  const handleChange = (key: keyof SymptomData, value: number) => {
    setFormData((prev) => ({ ...prev, [key]: value }))
  }

  const handleQolChange = (key: string, value: number) => {
    setFormData((prev) => ({
      ...prev,
      qol: {
        ...(prev.qol || {}),
        [key]: value
      }
    }))
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    
    if (isQolActive) {
      const qol = formData.qol || {}
      const missing = []
      if (!qol.mobility) missing.push('Mobilitas')
      if (!qol.selfCare) missing.push('Perawatan Diri')
      if (!qol.usualActivities) missing.push('Kegiatan Utama')
      if (!qol.painDiscomfort) missing.push('Rasa Nyeri')
      if (!qol.anxietyDepression) missing.push('Rasa Cemas/Depresi')
      
      if (missing.length > 0) {
        toast.error(`Mohon lengkapi survei Kualitas Hidup (QoL): ${missing.join(', ')}`)
        setActiveTab('qol')
        window.scrollTo({ top: 0, behavior: 'smooth' })
        return
      }
    }

    submitReport({ symptoms: formData }, {
      onSuccess: () => {
        toast.success('Laporan berhasil dikirim!')
        navigate(ROUTES.PATIENT_DASHBOARD)
      },
      onError: (err: any) => {
        toast.error('Gagal mengirim laporan: ' + err.message)
      }
    })
  }

  const qolQuestions = [
    {
      key: 'mobility',
      label: '1. Mobilitas (Kemampuan Berjalan)',
      options: [
        { value: 1, label: 'Saya tidak mempunyai kesulitan untuk berjalan' },
        { value: 2, label: 'Saya mempunyai beberapa kesulitan untuk berjalan' },
        { value: 3, label: 'Saya hanya bisa berbaring di tempat tidur' }
      ]
    },
    {
      key: 'selfCare',
      label: '2. Perawatan Diri (Self-care)',
      options: [
        { value: 1, label: 'Saya tidak mempunyai kesulitan untuk merawat diri sendiri' },
        { value: 2, label: 'Saya mempunyai beberapa kesulitan untuk membasuh diri atau berpakaian sendiri' },
        { value: 3, label: 'Saya tidak mampu membasuh diri atau berpakaian sendiri' }
      ]
    },
    {
      key: 'usualActivities',
      label: '3. Kegiatan Utama (Usual Activities)',
      options: [
        { value: 1, label: 'Saya tidak mempunyai kesulitan untuk melakukan kegiatan sehari-hari (bekerja, belajar, pekerjaan rumah)' },
        { value: 2, label: 'Saya mempunyai beberapa kesulitan untuk melakukan kegiatan sehari-hari' },
        { value: 3, label: 'Saya tidak mampu melakukan kegiatan sehari-hari' }
      ]
    },
    {
      key: 'painDiscomfort',
      label: '4. Rasa Nyeri / Tidak Nyaman',
      options: [
        { value: 1, label: 'Saya tidak merasa nyeri atau tidak nyaman' },
        { value: 2, label: 'Saya merasa nyeri atau tidak nyaman yang sedang' },
        { value: 3, label: 'Saya merasa nyeri atau tidak nyaman yang sangat hebat' }
      ]
    },
    {
      key: 'anxietyDepression',
      label: '5. Rasa Cemas / Depresi',
      options: [
        { value: 1, label: 'Saya tidak merasa cemas atau depresi' },
        { value: 2, label: 'Saya merasa cemas atau depresi yang sedang' },
        { value: 3, label: 'Saya merasa cemas atau depresi yang sangat hebat' }
      ]
    }
  ]

  return (
    <PatientLayout>
      <div className="flex flex-col min-h-screen bg-surface-container-low">
        
        {/* Top Header */}
        <header className="flex justify-between items-center px-6 pt-6 pb-4 bg-surface-container-low sticky top-0 z-10 backdrop-blur-md">
          <button 
            onClick={() => navigate(ROUTES.PATIENT_DASHBOARD)} 
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

          {isQolActive && (
            <div className="flex bg-surface-container-high p-1 rounded-2xl mb-8 border border-surface-container-high shadow-inner">
              <button
                type="button"
                onClick={() => setActiveTab('meso')}
                className={`flex-1 py-3 px-4 rounded-xl font-headline font-bold text-sm flex items-center justify-center gap-2 transition-all ${
                  activeTab === 'meso'
                    ? 'bg-primary text-on-primary shadow-sm'
                    : 'text-on-surface-variant hover:text-on-surface'
                }`}
              >
                <ClipboardList size={18} /> Gejala MESO
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('qol')}
                className={`flex-1 py-3 px-4 rounded-xl font-headline font-bold text-sm flex items-center justify-center gap-2 transition-all ${
                  activeTab === 'qol'
                    ? 'bg-primary text-on-primary shadow-sm'
                    : 'text-on-surface-variant hover:text-on-surface'
                }`}
              >
                <Smile size={18} /> Survey QoL
              </button>
            </div>
          )}

          {/* SINGLE FORM ENCLOSING BOTH TABS */}
          <form onSubmit={handleSubmit} className="flex flex-col gap-8">
            {activeTab === 'qol' ? (
              <div className="flex flex-col gap-6 animate-fade-in">
                <section className="bg-linear-to-br from-[#006060] to-[#0d9488] rounded-[24px] p-6 text-white shadow-sm mb-2">
                  <h3 className="font-headline font-extrabold text-lg mb-1 flex items-center gap-2">
                    <Smile size={20} /> Kuesioner Kualitas Hidup (EQ-5D-3L)
                  </h3>
                  <p className="font-body text-xs text-white/80 leading-relaxed">
                    Silakan pilih satu pernyataan yang paling menggambarkan kondisi kesehatan Ibu hari ini untuk masing-masing kelompok pertanyaan di bawah.
                  </p>
                </section>

                <div className="flex flex-col gap-6">
                  {qolQuestions.map((q) => {
                    const currentValue = formData.qol?.[q.key as keyof typeof formData.qol] || null

                    return (
                      <div 
                        key={q.key} 
                        className="bg-white rounded-[28px] p-6 shadow-sm border border-surface-container-low transition-all hover:shadow-md"
                      >
                        <h4 className="font-headline text-sm font-black text-stone-800 mb-4">
                          {q.label}
                        </h4>

                        <div className="flex flex-col gap-3">
                          {q.options.map((opt) => {
                            const isSelected = currentValue === opt.value

                            return (
                              <button
                                key={opt.value}
                                type="button"
                                onClick={() => handleQolChange(q.key, opt.value)}
                                className={`w-full p-4 rounded-2xl border text-left text-xs font-bold transition-all active:scale-[0.99] flex items-center justify-between gap-3 ${
                                  isSelected
                                    ? 'border-[#006060] bg-[#e5f9f5] text-[#006060]'
                                    : 'border-stone-200 hover:border-stone-400 bg-white text-stone-700'
                                }`}
                              >
                                <span className="leading-relaxed">{opt.label}</span>
                                {isSelected && (
                                  <span className="w-5 h-5 rounded-full bg-[#006060] text-white flex items-center justify-center shrink-0">
                                    <Check size={12} strokeWidth={3} />
                                  </span>
                                )}
                              </button>
                            )
                          })}
                        </div>
                      </div>
                    )
                  })}
                </div>

                {/* Navigation and Submit Buttons */}
                <div className="flex flex-col gap-3 mt-6">
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
                        Mengirim Laporan...
                      </>
                    ) : (
                      <>
                        Kirim Laporan Lengkap <Send size={20} />
                      </>
                    )}
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setActiveTab('meso')
                      window.scrollTo({ top: 0, behavior: 'smooth' })
                    }}
                    className="w-full h-14 rounded-full font-headline font-bold text-sm bg-white border border-stone-200 hover:bg-stone-50 text-stone-600 flex items-center justify-center gap-2 transition-all active:scale-95 shadow-sm"
                  >
                    ← Kembali ke Gejala MESO
                  </button>
                </div>
              </div>
            ) : (
              <div className="flex flex-col gap-10">
                
                {/* Gejala Section */}
                <section>
                  <h2 className="font-headline text-lg font-bold text-on-surface mb-6 flex items-center gap-2">
                    <Heart size={20} className="text-error" fill="currentColor" /> Gejala & Vitalitas
                  </h2>
                  
                  <div className="flex flex-col gap-4">
                    {SYMPTOMS_UI_CONFIG.map((symptom) => {
                      const currentValue = (formData[symptom.key as keyof SymptomData] ?? null) as number | null

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
                                customLabels={symptom.scaleLabels}
                              />
                            )}
                          </div>
                        </div>
                      )
                    })}

                    {/* Gejala Lain-lain Card */}
                    <div className="bg-white rounded-[28px] p-6 shadow-sm border border-surface-container-low transition-all hover:shadow-md">
                      <h3 className="font-headline text-base font-bold text-on-surface mb-1">
                        Efek Samping / Gejala Lain
                      </h3>
                      <p className="font-body text-[0.75rem] text-on-surface-variant mb-4 leading-normal">
                        Apakah ada efek samping atau gejala lain yang Ibu rasakan namun tidak tercantum di atas? Silakan sebutkan di bawah ini.
                      </p>
                      <div className="flex flex-col gap-4">
                        <input
                          type="text"
                          placeholder="Contoh: Pusing, Mulut Kering, dll."
                          value={formData.otherSymptomName ?? ''}
                          onChange={(e) => setFormData((prev) => ({ ...prev, otherSymptomName: e.target.value }))}
                          className="w-full h-12 px-4 rounded-xl border border-surface-container-high focus:outline-none focus:border-primary font-body text-sm bg-surface-container-lowest"
                        />
                        
                        {formData.otherSymptomName && formData.otherSymptomName.trim() !== '' && (
                          <div className="mt-2 animate-fade-in">
                            <p className="font-body text-[0.75rem] font-bold text-on-surface mb-2">
                              Bagaimana tingkat keparahan gejala tersebut?
                            </p>
                            <EmoticonScale
                              value={formData.otherSymptomGrade ?? null}
                              onChange={(val) => handleChange('otherSymptomGrade', val)}
                            />
                          </div>
                        )}
                      </div>
                    </div>
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
                <section className="bg-linear-to-br from-primary to-clinical-teal rounded-[32px] p-8 text-white text-center shadow-lg shadow-primary/10 relative overflow-hidden">
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

                {isQolActive ? (
                  <button
                    type="button"
                    onClick={() => {
                      setActiveTab('qol')
                      window.scrollTo({ top: 0, behavior: 'smooth' })
                    }}
                    className="w-full h-16 rounded-full font-headline font-bold text-base bg-[#006060] hover:bg-[#0d9488] text-white flex items-center justify-center gap-2 transition-all active:scale-95 shadow-lg shadow-primary/20"
                  >
                    Lanjut ke Survei Kualitas Hidup (QoL) <ArrowRight size={20} />
                  </button>
                ) : (
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
                )}

              </div>
            )}
          </form>
        </main>
      </div>
    </PatientLayout>
  )
}

