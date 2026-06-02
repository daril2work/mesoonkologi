// ============================================================
// PharmacistPatientDetail — Sub-komponen: Escalation Action Panel
// Single Responsibility: Tombol eskalasi, secondary actions,
// ringkasan gejala aktif, dan resolve button
// ============================================================
import { useState } from 'react'
import { clsx } from 'clsx'
import { toast } from 'react-hot-toast'
import { useNavigate } from 'react-router-dom'
import { useReportEscalation } from '../api/useReportEscalation'
import { useUpdateReportStatus } from '../api/useUpdateReportStatus'
import { useSendMessage } from '../api/useChat'
import { ConfirmationModal } from '@components/ui/ConfirmationModal'
import { ROUTES } from '@configs/app.config'
import { InterventionModal } from './InterventionModal'
import { RegimenModal } from './RegimenModal'

interface ActiveSymptom {
  label: string
  value: number
}

interface EscalationActionPanelProps {
  patientId: string
  patientName: string
  reportId?: string
  escalationStatus?: string
  activeSymptoms: ActiveSymptom[]
}

export function EscalationActionPanel({
  patientId,
  patientName,
  reportId,
  escalationStatus,
  activeSymptoms,
}: EscalationActionPanelProps) {
  const navigate = useNavigate()
  const escalateReport = useReportEscalation()
  const updateStatus = useUpdateReportStatus()
  const sendMessage = useSendMessage()
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [isInterventionOpen, setIsInterventionOpen] = useState(false)
  const [isRegimenOpen, setIsRegimenOpen] = useState(false)

  const isAlreadyEscalated = escalationStatus === 'escalated'

  const handleConfirmEscalation = () => {
    if (!reportId) return
    escalateReport.mutate(
      { reportId },
      {
        onSuccess: () => {
          setIsModalOpen(false)
          toast.success('Eskalasi berhasil dikirim ke Dokter Onkologi.')
          sendMessage.mutate({
            receiverId: patientId,
            content: 'Laporan Anda telah kami eskalasi ke Dokter Onkologi untuk penanganan lebih lanjut. Mohon tunggu instruksi berikutnya.',
          })
        },
        onError: () => {
          setIsModalOpen(false)
          toast.error('Gagal mengirim eskalasi. Silakan coba lagi.')
        },
      }
    )
  }

  const handleResolve = () => {
    if (!reportId) return
    updateStatus.mutate(
      { reportId, status: 'reviewed' },
      { onSuccess: () => navigate(ROUTES.PHARMA_DASHBOARD) }
    )
  }

  const top3Symptoms = activeSymptoms
    .filter(s => s.value > 0)
    .sort((a, b) => b.value - a.value)
    .slice(0, 3)

  return (
    <>
      <section className="space-y-6">
        {/* Eskalasi Button */}
        <button
          onClick={() => reportId && setIsModalOpen(true)}
          disabled={escalateReport.isPending || isAlreadyEscalated || !reportId}
          className={clsx(
            'w-full h-24 px-6 sm:px-8 rounded-3xl font-display font-black text-base sm:text-lg uppercase tracking-widest',
            'flex items-center justify-center gap-3 sm:gap-4 shadow-2xl transition-all active:scale-95',
            'disabled:opacity-70 disabled:scale-100 relative',
            isAlreadyEscalated
              ? 'bg-stone-100 text-stone-400 border-2 border-dashed border-stone-200'
              : 'bg-[#b90c55] text-white shadow-[#b90c55]/30 hover:shadow-[#b90c55]/50'
          )}
        >
          {isAlreadyEscalated ? (
            <>
              <span className="material-symbols-outlined text-2xl sm:text-3xl shrink-0">check_circle</span>
              <span className="text-center leading-snug">Laporan Ter-eskalasi</span>
            </>
          ) : (
            <>
              <div className="w-12 h-12 sm:w-14 sm:h-14 bg-white/20 rounded-2xl border border-white/20 flex items-center justify-center shrink-0 shadow-[inset_0_2px_4px_rgba(255,255,255,0.3)]">
                <span
                  className="material-symbols-outlined text-3xl sm:text-4xl drop-shadow-md"
                  style={{ fontVariationSettings: "'FILL' 1" }}
                >
                  report_problem
                </span>
              </div>
              <span className="text-left sm:text-center leading-snug">
                {escalateReport.isPending ? 'Memproses...' : 'Eskalasi ke Dokter Onkologi'}
              </span>
            </>
          )}
        </button>

        {/* Secondary Actions */}
        <div className="grid grid-cols-2 gap-6">
          <button 
            onClick={() => setIsInterventionOpen(true)}
            className="bg-surface-container-low text-on-surface-variant font-black text-[11px] uppercase tracking-widest h-24 rounded-3xl flex flex-col items-center justify-center gap-3 hover:bg-stone-200 transition-all border border-stone-100 shadow-sm active:scale-95 group"
          >
            <div className="p-3 bg-white rounded-2xl group-hover:bg-primary/5 transition-colors">
              <span className="material-symbols-outlined text-stone-400 group-hover:text-primary transition-colors">
                clinical_notes
              </span>
            </div>
            Catatan Klinis
          </button>
          <button 
            onClick={() => setIsRegimenOpen(true)}
            className="bg-surface-container-low text-on-surface-variant font-black text-[11px] uppercase tracking-widest h-24 rounded-3xl flex flex-col items-center justify-center gap-3 hover:bg-stone-200 transition-all border border-stone-100 shadow-sm active:scale-95 group"
          >
            <div className="p-3 bg-white rounded-2xl group-hover:bg-primary/5 transition-colors">
              <span className="material-symbols-outlined text-stone-400 group-hover:text-primary transition-colors">
                pill
              </span>
            </div>
            Ubah Regimen
          </button>
        </div>

        {/* Active Symptoms Summary */}
        {top3Symptoms.length > 0 && (
          <div className="bg-white border-2 border-[#b90c55]/20 p-5 sm:p-10 rounded-3xl sm:rounded-[40px] shadow-sm relative overflow-hidden">
            <div className="absolute left-0 top-0 bottom-0 w-2 bg-[#b90c55]" />
            <h4 className="text-[11px] font-black text-[#b90c55] uppercase tracking-[0.25em] mb-6 flex items-center gap-2">
              <span
                className="material-symbols-outlined text-sm"
                style={{ fontVariationSettings: "'FILL' 1" }}
              >
                smart_toy
              </span>
              Ringkasan Gejala Aktif
            </h4>
            <div className="space-y-3">
              {top3Symptoms.map((s) => (
                <div key={s.label} className="flex items-center justify-between">
                  <span className="text-sm font-bold text-stone-600">{s.label}</span>
                  <span className={clsx(
                    'text-xs font-black uppercase tracking-widest px-3 py-1 rounded-full',
                    s.value >= 4
                      ? 'bg-[#b90c55]/10 text-[#b90c55]'
                      : s.value >= 2
                      ? 'bg-amber-50 text-amber-700'
                      : 'bg-stone-100 text-stone-500'
                  )}>
                    Grade {s.value}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Resolve Without Escalation */}
        {!isAlreadyEscalated && reportId && (
          <button
            onClick={handleResolve}
            disabled={updateStatus.isPending}
            className="w-full mt-4 bg-primary/10 text-primary h-14 rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-primary/20 transition-all active:scale-95 border border-primary/5 disabled:opacity-60"
          >
            {updateStatus.isPending ? 'Memproses...' : 'Selesaikan Tanpa Eskalasi'}
          </button>
        )}
      </section>

      {/* Confirmation Modal */}
      <ConfirmationModal
        isOpen={isModalOpen}
        variant="danger"
        title="Konfirmasi Eskalasi Pasien"
        description={`Apakah Anda yakin ingin melakukan eskalasi untuk ${patientName}? Dokter Onkologi akan segera diberitahu melalui dashboard dan notifikasi sistem.`}
        confirmLabel="Ya, Eskalasi Sekarang"
        cancelLabel="Batalkan"
        isPending={escalateReport.isPending}
        onConfirm={handleConfirmEscalation}
        onCancel={() => setIsModalOpen(false)}
      />

      {/* F-04: Intervention Modal */}
      <InterventionModal
        isOpen={isInterventionOpen}
        onClose={() => setIsInterventionOpen(false)}
        patientId={patientId}
        reportId={reportId}
      />

      {/* F-05: Regimen Modal */}
      <RegimenModal
        isOpen={isRegimenOpen}
        onClose={() => setIsRegimenOpen(false)}
        patientId={patientId}
        reportId={reportId}
      />
    </>
  )
}
