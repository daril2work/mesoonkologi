// ============================================================
// PharmacistPatientDetail — Orchestrator Page (G-01 Refactored)
// Tanggung jawab satu-satunya: menyusun sub-komponen + loading/error states
//
// Sub-komponen domain:
//   PatientHeaderCard   → identitas pasien
//   SymptomReportGrid   → grid kartu gejala harian
//   PatientTrendChart   → bar chart tren mingguan
//   ClinicalChatPanel   → chat apoteker ↔ pasien
//   EscalationActionPanel → tombol eskalasi + actions
// ============================================================
import { useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { useQueryClient } from '@tanstack/react-query'
import { supabase } from '@lib/supabase'
import PharmacistLayout from '../components/PharmacistLayout'
import { usePatientDetail } from '../api/usePatientDetail'
import { useAuthStore } from '@features/auth/store'
import { ROUTES } from '@configs/app.config'
import { PatientHeaderCard } from '../components/PatientHeaderCard'
import { SymptomReportGrid } from '../components/SymptomReportGrid'
import { DietaryStatusCard } from '../components/DietaryStatusCard'
import { PatientTrendChart } from '../components/PatientTrendChart'
import { ClinicalChatPanel } from '../components/ClinicalChatPanel'
import { EscalationActionPanel } from '../components/EscalationActionPanel'
import { InterventionHistoryPanel } from '../components/InterventionHistoryPanel'
import { DoctorInstructionsPanel } from '../components/DoctorInstructionsPanel'

export default function PharmacistPatientDetail() {
  const { id, reportId } = useParams()
  const { user: currentUser } = useAuthStore()
  const { data: patient, isLoading } = usePatientDetail(id, reportId)
  const queryClient = useQueryClient()
  const [isUpdating, setIsUpdating] = useState(false)

  const toggleQoL = async () => {
    if (!id || !patient) return
    setIsUpdating(true)
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ is_qol_active: !patient.isQolActive })
        .eq('id', id)

      if (error) throw error
      
      await queryClient.invalidateQueries({ queryKey: ['patientDetail', id, reportId] })
    } catch (err) {
      console.error('Failed to toggle QoL active state:', err)
    } finally {
      setIsUpdating(false)
    }
  }

  if (isLoading) {
    return (
      <PharmacistLayout>
        <div className="p-20 text-center font-display font-bold text-primary animate-pulse uppercase tracking-[0.2em] text-xs">
          Menyiapkan pusat komando klinis...
        </div>
      </PharmacistLayout>
    )
  }

  if (!patient || !id) {
    return (
      <PharmacistLayout>
        <div className="p-20 text-center font-display font-bold text-error">
          Data pasien tidak ditemukan.
        </div>
      </PharmacistLayout>
    )
  }

  return (
    <PharmacistLayout>
      {/* Top Bar Navigation */}
      <header className="fixed top-0 right-0 w-[calc(100%-16rem)] h-16 bg-white/80 backdrop-blur-xl flex items-center justify-between px-8 z-40 border-b border-stone-100">
        <div className="flex items-center gap-4">
          <Link
            to={ROUTES.PHARMA_DASHBOARD}
            className="flex items-center gap-2 text-stone-600 hover:text-primary transition-colors group"
          >
            <span className="material-symbols-outlined text-xl transition-transform group-hover:-translate-x-1">
              arrow_back
            </span>
            <span className="font-bold text-sm">Kembali ke Antrean</span>
          </Link>
          <div className="h-4 w-px bg-stone-300 mx-2" />
          <div className="flex flex-col">
            <span className="font-extrabold text-primary text-sm headline-font">Detail Pasien</span>
            <span className="text-[10px] text-stone-400 uppercase font-black tracking-tight">
              ID: SN-{id.slice(0, 8).toUpperCase()}
            </span>
          </div>
        </div>

        {/* User Chip */}
        <div className="flex items-center gap-3 bg-stone-100/50 py-1.5 pl-2 pr-4 rounded-full border border-stone-100">
          <div className="w-8 h-8 rounded-full bg-primary-container/30 border border-primary/20 flex items-center justify-center font-bold text-primary text-xs">
            {currentUser?.fullName?.charAt(0) ?? 'A'}
          </div>
          <span className="font-bold text-xs text-stone-700">
            {currentUser?.fullName ?? 'Apoteker'}
          </span>
        </div>
      </header>

      {/* Main Content */}
      <main className="mt-16 p-10 h-[calc(100vh-4rem)] overflow-y-auto scrollbar-hide">
        <div className="max-w-7xl mx-auto grid grid-cols-12 gap-10 pb-20">

          {/* LEFT COLUMN */}
          <div className="col-span-12 lg:col-span-7 space-y-10">
            <PatientHeaderCard
              fullName={patient.fullName}
              diagnosis={patient.diagnosis}
              age={patient.age}
              weight={patient.weight}
              height={patient.height}
              bp={patient.bp}
              cycleInfo={patient.cycleInfo}
            />

            {/* QoL Settings Toggle Panel */}
            <div className="bg-surface-container-lowest rounded-2xl p-6 shadow-sm border border-stone-100 flex items-center justify-between transition-all hover:shadow-md">
              <div className="flex items-center gap-4">
                <div className={`w-12 h-12 rounded-xl flex items-center justify-center text-xl transition-all ${patient.isQolActive ? 'bg-primary-container/20 text-primary' : 'bg-stone-100 text-stone-400'}`}>
                  <span className="material-symbols-outlined">
                    {patient.isQolActive ? 'spa' : 'sentiment_satisfied'}
                  </span>
                </div>
                <div>
                  <h4 className="font-headline font-bold text-sm text-on-surface">Survei Kualitas Hidup (QoL)</h4>
                  <p className="text-[11px] text-stone-400 font-body leading-normal">
                    {patient.isQolActive 
                      ? 'Aktif — Pasien dapat mengisi kuesioner QoL di portal mereka' 
                      : 'Nonaktif — Portal pasien hanya menampilkan pelaporan gejala MESO'}
                  </p>
                </div>
              </div>
              <button
                onClick={toggleQoL}
                disabled={isUpdating}
                className={`px-4 py-2 rounded-xl text-xs font-headline font-bold transition-all flex items-center gap-2 ${
                  patient.isQolActive
                    ? 'bg-error-container/20 text-error hover:bg-error-container/30 border border-error/10'
                    : 'bg-primary text-on-primary hover:opacity-90 shadow-sm'
                } disabled:opacity-50`}
              >
                {isUpdating ? (
                  <span className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                ) : patient.isQolActive ? (
                  'Nonaktifkan'
                ) : (
                  'Aktifkan Survei'
                )}
              </button>
            </div>

            <SymptomReportGrid symptoms={patient.latestSymptoms} />
            <DietaryStatusCard items={patient.latestDietary} />
            <PatientTrendChart trends={patient.trends} />
            <InterventionHistoryPanel reportId={patient.latestReportId} />
          </div>

          {/* RIGHT COLUMN */}
          <div className="col-span-12 lg:col-span-5 flex flex-col gap-10">
            <DoctorInstructionsPanel 
              doctorNotes={patient.doctorNotes} 
              suggestedRegimen={patient.suggestedRegimen} 
            />
            <ClinicalChatPanel
              patientId={id}
              patientFirstName={patient.fullName.split(' ')[0]}
            />
            <EscalationActionPanel
              patientId={id}
              patientName={patient.fullName}
              reportId={patient.latestReportId}
              escalationStatus={patient.escalationStatus}
              activeSymptoms={patient.latestSymptoms}
            />
          </div>

        </div>
      </main>
    </PharmacistLayout>
  )
}
