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
import { usePatientDetail } from '../api/usePatientDetail'
import { ROUTES } from '@configs/app.config'
import { useAuthStore } from '@features/auth/store'
import { PatientHeaderCard } from '../components/PatientHeaderCard'
import { SymptomReportGrid } from '../components/SymptomReportGrid'
import { QolStatusCard } from '../components/QolStatusCard'
import { DietaryStatusCard } from '../components/DietaryStatusCard'
import { PatientTrendChart } from '../components/PatientTrendChart'
import { ClinicalChatPanel } from '../components/ClinicalChatPanel'
import { EscalationActionPanel } from '../components/EscalationActionPanel'
import { InterventionHistoryPanel } from '../components/InterventionHistoryPanel'
import { DoctorInstructionsPanel } from '../components/DoctorInstructionsPanel'
import { DeactivationModal } from '../components/DeactivationModal'
import { getDeactivationLabel } from '@utils/helpers'

import PharmacistLayout from '../components/PharmacistLayout'
import { usePatientActions } from '../hooks/usePatientActions'

export default function PharmacistPatientDetail() {
  const { id, reportId } = useParams()
  const { user: currentUser } = useAuthStore()
  const { data: patient, isLoading } = usePatientDetail(id, reportId)
  
  const {
    handleDeactivate,
    handleReactivate,
    toggleQoL,
    isUpdatingQoL,
    isDeactivating
  } = usePatientActions(id)

  const [historyPage, setHistoryPage] = useState(1)
  const [isDeactivateOpen, setIsDeactivateOpen] = useState(false)

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

  const itemsPerPage = 3
  const totalHistoryPages = patient?.reportsHistory ? Math.ceil(patient.reportsHistory.length / itemsPerPage) : 0
  const paginatedHistory = patient?.reportsHistory ? patient.reportsHistory.slice((historyPage - 1) * itemsPerPage, historyPage * itemsPerPage) : []

  return (
    <PharmacistLayout>
      {/* Top Bar Navigation */}
      <header className="fixed top-0 right-0 w-full lg:w-[calc(100%-16rem)] lg:left-64 left-0 h-16 bg-white/80 backdrop-blur-xl flex items-center justify-between px-4 lg:px-8 z-40 border-b border-stone-100 gap-3">
        <div className="flex items-center gap-2 sm:gap-4 min-w-0">
          <Link
            to={ROUTES.PHARMA_DASHBOARD}
            className="flex items-center gap-1 sm:gap-2 text-stone-600 hover:text-primary transition-colors group shrink-0"
          >
            <span className="material-symbols-outlined text-xl transition-transform group-hover:-translate-x-1">
              arrow_back
            </span>
            <span className="font-bold text-sm hidden sm:inline">Kembali ke Antrean</span>
            <span className="font-bold text-xs sm:hidden">Kembali</span>
          </Link>
          <div className="h-4 w-px bg-stone-300 mx-1 sm:mx-2 shrink-0" />
          <div className="flex flex-col min-w-0">
            <span className="font-extrabold text-primary text-xs sm:text-sm headline-font truncate">Detail Pasien</span>
            <span className="text-[9px] sm:text-[10px] text-stone-400 uppercase font-black tracking-tight truncate">
              ID: SN-{id.slice(0, 8).toUpperCase()}
            </span>
          </div>
        </div>

        {/* User Chip */}
        <div className="flex items-center gap-3 bg-stone-100/50 py-1.5 pl-2 pr-4 rounded-full border border-stone-100 shrink-0">
          <div className="w-8 h-8 rounded-full bg-primary-container/30 border border-primary/20 flex items-center justify-center font-bold text-primary text-xs shrink-0">
            {currentUser?.fullName?.charAt(0) ?? 'A'}
          </div>
          <span className="font-bold text-xs text-stone-700 hidden sm:block">
            {currentUser?.fullName ?? 'Apoteker'}
          </span>
        </div>
      </header>

      {/* Main Content */}
      <main className="mt-16 p-4 sm:p-6 lg:p-10 h-[calc(100vh-4rem)] overflow-y-auto scrollbar-hide">
        <div className="max-w-7xl mx-auto grid grid-cols-12 gap-6 lg:gap-10 pb-20">

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
              isActive={patient.isActive}
              statusReason={patient.statusReason}
            />

            {/* QoL Settings Toggle Panel */}
            <div className="bg-surface-container-lowest rounded-2xl p-6 shadow-sm border border-stone-100 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 transition-all hover:shadow-md">
              <div className="flex items-center gap-4">
                <div className={`w-12 h-12 rounded-xl flex items-center justify-center text-xl transition-all ${patient.isQolActive ? 'bg-primary-container/20 text-primary' : 'bg-surface-container-highest text-stone-400'}`}>
                  <span className="material-symbols-outlined">
                    {patient.isQolActive ? 'assignment_turned_in' : 'assignment_late'}
                  </span>
                </div>
                <div>
                  <h4 className="font-headline font-bold text-sm text-on-surface">Survei Kualitas Hidup (QoL)</h4>
                  <p className="text-[11px] text-stone-400 font-body mt-0.5 max-w-sm">
                    {patient.isQolActive 
                      ? 'Survei sedang aktif. Pasien akan diminta mengisi kuesioner EORTC QLQ-C30 pada laporan berikutnya.' 
                      : 'Survei nonaktif. Pasien hanya mengisi laporan gejala dan skala VAS.'}
                  </p>
                </div>
              </div>
              <button
                onClick={() => toggleQoL(!!patient.isQolActive)}
                disabled={isUpdatingQoL}
                className={`px-4 py-2 rounded-xl text-xs font-headline font-bold transition-all flex items-center gap-2 ${
                  patient.isQolActive
                    ? 'bg-error-container/20 text-error hover:bg-error-container/30 border border-error/10'
                    : 'bg-primary text-on-primary hover:opacity-90 shadow-sm'
                } disabled:opacity-50`}
              >
                {isUpdatingQoL ? (
                  <span className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                ) : patient.isQolActive ? (
                  'Nonaktifkan'
                ) : (
                  'Aktifkan Survei'
                )}
              </button>
            </div>

            {/* Patient Active/Inactive Deactivation Panel */}
            <div className="bg-surface-container-lowest rounded-2xl p-6 shadow-sm border border-stone-100 flex items-center justify-between transition-all hover:shadow-md">
              <div className="flex items-center gap-4">
                <div className={`w-12 h-12 rounded-xl flex items-center justify-center text-xl transition-all ${patient.isActive ? 'bg-primary-container/20 text-primary' : 'bg-rose-50 text-rose-500'}`}>
                  <span className="material-symbols-outlined">
                    {patient.isActive ? 'how_to_reg' : 'person_off'}
                  </span>
                </div>
                <div>
                  <h4 className="font-headline font-bold text-sm text-on-surface">Status Keaktifan Pasien</h4>
                  <p className="text-[11px] text-stone-400 font-body leading-normal">
                    {patient.isActive 
                      ? 'Pasien Aktif — Dapat mengirimkan laporan harian & konsultasi chat' 
                      : `Pasien Nonaktif (${getDeactivationLabel(patient.statusReason)})`}
                  </p>
                </div>
              </div>
              {patient.isActive ? (
                <button
                  onClick={() => setIsDeactivateOpen(true)}
                  disabled={isDeactivating}
                  className="px-4 py-2 rounded-xl text-xs font-headline font-bold bg-rose-600 hover:bg-rose-500 text-white shadow-sm flex items-center gap-2 transition-all active:scale-95 disabled:opacity-50"
                >
                  {isDeactivating ? (
                    <span className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                  ) : (
                    'Deaktivasi Pasien'
                  )}
                </button>
              ) : (
                <button
                  onClick={handleReactivate}
                  disabled={isDeactivating}
                  className="px-4 py-2 rounded-xl text-xs font-headline font-bold bg-primary text-on-primary hover:opacity-90 shadow-sm flex items-center gap-2 transition-all active:scale-95 disabled:opacity-50"
                >
                  {isDeactivating ? (
                    <span className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                  ) : (
                    'Reaktivasi Pasien'
                  )}
                </button>
              )}
            </div>

            {/* Riwayat Pelaporan Gejala Selector Panel (Paginated) */}
            {patient.reportsHistory && patient.reportsHistory.length > 1 && (
              <div className="bg-surface-container-lowest rounded-2xl p-6 shadow-sm border border-stone-100 space-y-4 transition-all">
                <div className="flex items-center justify-between gap-4 border-b border-stone-50 pb-3">
                  <div className="flex items-center gap-2">
                    <span className="material-symbols-outlined text-stone-400">history</span>
                    <h4 className="text-sm font-black text-stone-500 uppercase tracking-widest headline-font">Riwayat Pelaporan Gejala</h4>
                  </div>
                  
                  {/* Pagination Buttons */}
                  {totalHistoryPages > 1 && (
                    <div className="flex items-center gap-2 bg-stone-50 px-2.5 py-1 rounded-lg border border-stone-100 shrink-0">
                      <button
                        onClick={() => setHistoryPage(p => Math.max(1, p - 1))}
                        disabled={historyPage === 1}
                        className="w-5 h-5 rounded flex items-center justify-center hover:bg-stone-200 transition-colors disabled:opacity-30 disabled:hover:bg-transparent text-stone-600"
                        title="Halaman Sebelumnya"
                      >
                        <span className="material-symbols-outlined text-sm leading-none font-bold">chevron_left</span>
                      </button>
                      <span className="text-[9px] font-black text-stone-500 uppercase tracking-tight">
                        Hal {historyPage} / {totalHistoryPages}
                      </span>
                      <button
                        onClick={() => setHistoryPage(p => Math.min(totalHistoryPages, p + 1))}
                        disabled={historyPage === totalHistoryPages}
                        className="w-5 h-5 rounded flex items-center justify-center hover:bg-stone-200 transition-colors disabled:opacity-30 disabled:hover:bg-transparent text-stone-600"
                        title="Halaman Berikutnya"
                      >
                        <span className="material-symbols-outlined text-sm leading-none font-bold">chevron_right</span>
                      </button>
                    </div>
                  )}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                  {paginatedHistory.map((rep) => {
                    const isSelected = rep.id === patient.latestReportId
                    const dateObj = new Date(rep.createdAt)
                    const dateStr = dateObj.toLocaleDateString('id-ID', { day: '2-digit', month: 'short' })
                    const timeStr = dateObj.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })
                    
                    return (
                      <Link
                        key={rep.id}
                        to={`/pharma/patient/${id}/${rep.id}`}
                        className={`p-3 rounded-xl border text-left transition-all flex flex-col gap-1.5 ${
                          isSelected
                            ? 'bg-primary/5 border-primary shadow-sm'
                            : 'bg-white border-stone-100 hover:border-primary/20 hover:bg-stone-50'
                        }`}
                      >
                        <div className="flex items-center justify-between gap-2">
                          <span className={`text-xs font-bold ${isSelected ? 'text-primary' : 'text-stone-700'}`}>
                            {dateStr}, {timeStr}
                          </span>
                          {rep.isSentinelAlert && (
                            <span className="w-2 h-2 rounded-full bg-error animate-pulse shrink-0" title="Krisis (Sentinel)" />
                          )}
                        </div>
                        <div className="flex items-center justify-between gap-2">
                          <span className="text-[9px] font-black uppercase tracking-tight text-stone-400">
                            {isSelected ? 'Laporan Terpilih' : 'Klik untuk Tinjau'}
                          </span>
                          {rep.escalationStatus === 'escalated' && (
                            <span className="text-[8px] bg-rose-50 text-rose-700 border border-rose-100 px-1.5 py-0.5 rounded font-black uppercase shrink-0">Eskalasi</span>
                          )}
                        </div>
                      </Link>
                    )
                  })}
                </div>
              </div>
            )}

            <SymptomReportGrid symptoms={patient.latestSymptoms} reportDate={patient.latestReportDate} />
            {patient.latestQol && <QolStatusCard qol={patient.latestQol} />}
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

      {/* Deactivation Modal */}
      {isDeactivateOpen && (
        <DeactivationModal
          isOpen={isDeactivateOpen}
          onClose={() => setIsDeactivateOpen(false)}
          onConfirm={async (reason) => {
            const success = await handleDeactivate(reason)
            if (success) {
              setIsDeactivateOpen(false)
            }
          }}
          isPending={isDeactivating}
        />
      )}
    </PharmacistLayout>
  )
}
