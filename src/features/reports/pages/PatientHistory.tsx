import { useState } from 'react'
import { usePatientReports } from '../api/usePatientReports'
import PatientLayout from '../components/PatientLayout'
import PatientTopNav from '../components/PatientTopNav'
import { format } from 'date-fns'
import { id } from 'date-fns/locale'
import { FileText, Clock, CheckCircle, Activity, ChevronRight, X } from 'lucide-react'
import { countActiveSymptoms } from '@utils/sentinel'
import { clsx } from 'clsx'
import { SymptomReportGrid } from '../components/SymptomReportGrid'
import { mapSymptomDetail } from '../utils/reportMapper'
import type { SymptomReport } from '../types'

export default function PatientHistory() {
  const { data: reports, isLoading } = usePatientReports(20) 
  const [selectedReport, setSelectedReport] = useState<SymptomReport | null>(null)

  return (
    <PatientLayout>
      <div className="bg-surface-container-lowest min-h-screen pb-32">
        
        <PatientTopNav />

        <header className="px-6 mb-8 mt-6">
          <h1 className="font-headline text-3xl font-bold text-primary tracking-tight">
            Hasil & Riwayat
          </h1>
          <p className="font-body text-sm text-on-surface-variant mt-2 leading-relaxed">
            Pantau terus catatan harian Ibu. Laporan rutin sangat membantu perjalanan pemulihan.
          </p>
        </header>

        <main className="px-6 flex flex-col gap-4">
          
          {isLoading ? (
            <div className="py-20 text-center animate-pulse">
              <div className="w-12 h-12 bg-primary-container rounded-full mx-auto mb-4 flex items-center justify-center">
                <Activity className="text-primary animate-spin" size={24} />
              </div>
              <p className="font-headline font-bold text-primary text-sm tracking-widest uppercase">Memuat data riwayat...</p>
            </div>
          ) : reports?.length === 0 ? (
            <div className="bg-white rounded-[32px] p-10 text-center shadow-sm border border-surface-container">
              <div className="bg-primary-container/20 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-6">
                <FileText size={32} className="text-primary" />
              </div>
              <h3 className="font-headline text-lg font-bold text-on-surface mb-2">
                Belum Ada Catatan
              </h3>
              <p className="font-body text-sm text-on-surface-variant">
                Ibu belum mengirimkan laporan gejala. Mulai lapor hari ini untuk memantau kesehatan dengan lebih baik.
              </p>
            </div>
          ) : (
            reports?.map((report) => {
              const activeCount = countActiveSymptoms(report.symptoms)
              const isPending = report.status === 'pending'
              const dateObj = new Date(report.createdAt)

              return (
                <div 
                  key={report.id}
                  onClick={() => setSelectedReport(report)}
                  className="bg-white rounded-[32px] p-6 shadow-sm border border-surface-container-low flex flex-col gap-4 hover:border-primary/20 transition-all group cursor-pointer active:scale-[0.98]"
                >
                  <div className="flex justify-between items-center">
                    <div className="flex items-center gap-3">
                      <div className={clsx(
                        "p-2.5 rounded-2xl",
                        isPending ? "bg-amber-100/50" : "bg-primary-container/30"
                      )}>
                        {isPending ? <Clock size={20} className="text-amber-600" /> : <CheckCircle size={20} className="text-primary" />}
                      </div>
                      <span className={clsx(
                        "font-headline text-sm font-bold",
                        isPending ? "text-amber-700" : "text-primary"
                      )}>
                        {isPending ? 'Sedang Ditinjau' : 'Selesai Dievaluasi'}
                      </span>
                    </div>
                    <span className="font-body text-[10px] text-on-surface-variant font-bold uppercase tracking-widest">
                      {format(dateObj, 'HH:mm', { locale: id })} WIB
                    </span>
                  </div>

                  <div className="flex justify-between items-end">
                    <div>
                      <h3 className="font-headline text-xl font-bold text-on-surface mb-1">
                        {format(dateObj, 'eeee, d MMMM yyyy', { locale: id })}
                      </h3>
                      <div className="flex items-center gap-2 text-on-surface-variant font-body text-sm">
                        <Activity size={16} className="text-primary" />
                        {activeCount > 0 ? `${activeCount} gejala dicatat` : 'Tidak ada keluhan berarti'}
                      </div>
                    </div>
                    <div className="w-10 h-10 rounded-full bg-surface-container flex items-center justify-center group-hover:bg-primary group-hover:text-white transition-all">
                      <ChevronRight size={20} />
                    </div>
                  </div>

                  {report.clinicalNote && (
                    <div className="bg-surface-container-low p-5 rounded-2xl border-l-4 border-tertiary mt-2">
                      <span className="font-headline text-xs font-black text-tertiary uppercase tracking-widest block mb-2">Catatan Apoteker:</span>
                      <p className="font-body text-sm text-on-surface leading-relaxed line-clamp-2">
                        {report.clinicalNote}
                      </p>
                    </div>
                  )}
                </div>
              )
            })
          )}
        </main>

        {/* DETAIL MODAL */}
        {selectedReport && (
          <div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center p-0 sm:p-6 bg-stone-900/60 backdrop-blur-sm transition-all animate-in fade-in duration-300">
            <div 
              className="w-full max-w-2xl bg-white rounded-t-[40px] sm:rounded-[40px] h-[90vh] sm:h-auto max-h-[90vh] overflow-hidden flex flex-col shadow-2xl animate-in slide-in-from-bottom duration-500"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Modal Header */}
              <header className="px-10 py-8 border-b border-stone-100 flex items-center justify-between bg-white shrink-0">
                <div>
                  <h3 className="font-headline text-2xl font-black text-on-surface tracking-tight">Rincian Laporan</h3>
                  <p className="font-body text-xs text-on-surface-variant font-bold uppercase tracking-widest mt-1">
                    {format(new Date(selectedReport.createdAt), 'eeee, d MMMM yyyy', { locale: id })}
                  </p>
                </div>
                <button 
                  onClick={() => setSelectedReport(null)}
                  className="w-12 h-12 rounded-2xl bg-stone-50 flex items-center justify-center text-stone-400 hover:bg-stone-100 transition-all"
                >
                  <X size={24} />
                </button>
              </header>

              {/* Modal Body */}
              <div className="flex-1 overflow-y-auto p-10 space-y-10 scrollbar-hide">
                {/* Status Badge */}
                <div className="flex items-center gap-4">
                  <div className={clsx(
                    "px-6 py-2 rounded-full text-[10px] font-black uppercase tracking-widest border shadow-sm",
                    selectedReport.status === 'pending' 
                      ? "bg-amber-50 text-amber-700 border-amber-100" 
                      : "bg-primary/5 text-primary border-primary/10"
                  )}>
                    {selectedReport.status === 'pending' ? 'Sedang Ditinjau' : 'Sudah Dievaluasi'}
                  </div>
                </div>

                {/* Symptom Grid */}
                <SymptomReportGrid symptoms={mapSymptomDetail(selectedReport.symptoms as any)} />

                {/* Pharmacist Review Section */}
                <div className="space-y-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-tertiary/10 flex items-center justify-center text-tertiary">
                      <FileText size={20} />
                    </div>
                    <h4 className="font-headline text-lg font-extrabold text-on-surface">Evaluasi Klinis</h4>
                  </div>
                  
                  <div className="bg-stone-50 rounded-3xl p-8 border border-stone-100">
                    {selectedReport.clinicalNote ? (
                      <p className="font-body text-base text-on-surface-variant leading-relaxed">
                        {selectedReport.clinicalNote}
                      </p>
                    ) : (
                      <p className="font-body text-sm text-stone-400 italic">
                        Belum ada catatan evaluasi dari apoteker. Laporan Anda sedang dalam antrean tinjauan.
                      </p>
                    )}
                  </div>
                </div>

                {/* Support Info */}
                <div className="bg-primary/5 rounded-3xl p-8 border border-primary/10 flex items-start gap-4">
                  <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center shadow-sm shrink-0">
                    <Activity className="text-primary" size={24} />
                  </div>
                  <div>
                    <h5 className="font-headline font-bold text-primary text-sm mb-1">Terus Pantau Kondisi Anda</h5>
                    <p className="font-body text-xs text-on-surface-variant leading-relaxed">
                      Jika Ibu merasakan gejala yang memburuk secara tiba-tiba sebelum evaluasi selesai, mohon segera hubungi layanan darurat atau gunakan fitur chat untuk berkonsultasi langsung.
                    </p>
                  </div>
                </div>
              </div>

              {/* Modal Footer */}
              <footer className="p-8 bg-stone-50 border-t border-stone-100 shrink-0">
                <button 
                  onClick={() => setSelectedReport(null)}
                  className="w-full py-4 bg-primary text-on-primary rounded-2xl font-headline font-bold shadow-lg shadow-primary/20 hover:shadow-xl transition-all active:scale-[0.98]"
                >
                  Tutup Rincian
                </button>
              </footer>
            </div>
          </div>
        )}
      </div>
    </PatientLayout>
  )
}
