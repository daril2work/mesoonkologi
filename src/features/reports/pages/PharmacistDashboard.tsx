import { Link } from 'react-router-dom'
import { usePharmacistQueue } from '../api/usePharmacistQueue'
import PharmacistLayout from '../components/PharmacistLayout'
import { MajorCard } from '../components/MajorCard'
import { formatDistanceToNow } from 'date-fns'
import { id } from 'date-fns/locale'
import { ROUTES } from '@configs/app.config'
import { useSearchParams } from 'react-router-dom'
import { useState } from 'react'
import { exportToCSV } from '@utils/helpers'
import { clsx } from 'clsx'
import { SYMPTOM_KEYS, REPORT_SCHEMA } from '@features/reports/constants/symptoms.domain'
import type { QueueReport } from '../api/usePharmacistQueue'

export default function PharmacistDashboard() {
  const { data: queue, isLoading } = usePharmacistQueue()
  const [searchParams] = useSearchParams()
  const searchTerm = searchParams.get('search')?.toLowerCase() ?? ''
  
  // Task 4: State Filter
  const [isFilterOpen, setIsFilterOpen] = useState(false)
  const [filterStatus, setFilterStatus] = useState<'all' | 'escalated' | 'none'>('all')

  const filteredQueue = queue?.filter(q => {
    const matchesSearch = q.patient.fullName.toLowerCase().includes(searchTerm) || q.id.toLowerCase().includes(searchTerm)
    const matchesStatus = filterStatus === 'all' || q.escalationStatus === filterStatus
    return matchesSearch && matchesStatus
  }) ?? []

  const majorReports: QueueReport[] = filteredQueue.filter(q => q.isSentinelAlert)
  const minorReports: QueueReport[] = filteredQueue.filter(q => !q.isSentinelAlert)

  // Task 3: Handle Export
  const handleExport = () => {
    const exportData = filteredQueue.map(q => ({
      'ID Laporan': q.id,
      'Pasien': q.patient.fullName,
      'Siklus': q.patient.currentCycle,
      'Status Eskalasi': q.escalationStatus === 'escalated' ? 'Ter-eskalasi' : 'Rutin',
      'Gejala Utama': Object.entries(q.symptoms).find(([, v]) => (v as number) > 0)?.[0] ?? '-',
      'Waktu Lapor': new Date(q.createdAt).toLocaleString('id-ID')
    }))
    exportToCSV(exportData, 'rekap_antrean_meso')
  }

  return (
    <PharmacistLayout>
      <div className="p-8 max-w-7xl mx-auto">
        {/* HEADER SECTION */}
        <div className="flex justify-between items-end mb-8">
          <div>
            <h2 className="headline-font text-3xl font-extrabold text-on-surface mb-2">Antrean Laporan</h2>
            <p className="text-on-surface-variant font-medium">Tinjau laporan harian pasien dan berikan respon klinis.</p>
          </div>
          <div className="flex gap-3 relative">
            <div className="relative">
              <button 
                onClick={() => setIsFilterOpen(!isFilterOpen)}
                className={clsx(
                  "px-4 py-2.5 rounded-full border text-sm font-semibold flex items-center gap-2 transition-all shadow-sm",
                  filterStatus !== 'all' ? "bg-primary/5 border-primary text-primary" : "bg-surface-container-lowest border-outline-variant/20 text-on-surface hover:bg-white"
                )}
              >
                <span className="material-symbols-outlined text-lg">filter_list</span>
                {filterStatus === 'all' ? 'Filter Laporan' : filterStatus === 'escalated' ? 'Ter-eskalasi' : 'Rutin'}
              </button>

              {/* Dropdown Filter */}
              {isFilterOpen && (
                <>
                  <div className="fixed inset-0 z-40" onClick={() => setIsFilterOpen(false)} />
                  <div className="absolute right-0 mt-2 w-48 bg-white rounded-2xl shadow-xl border border-stone-100 p-2 z-50 animate-in fade-in zoom-in-95 duration-200">
                    {[
                      { label: 'Semua Laporan', value: 'all' },
                      { label: 'Hanya Eskalasi', value: 'escalated' },
                      { label: 'Hanya Rutin', value: 'none' },
                    ].map((opt) => (
                      <button
                        key={opt.value}
                        onClick={() => {
                          setFilterStatus(opt.value as any)
                          setIsFilterOpen(false)
                        }}
                        className={clsx(
                          "w-full text-left px-4 py-2.5 rounded-xl text-xs font-bold transition-colors flex items-center justify-between group",
                          filterStatus === opt.value ? "bg-primary/5 text-primary" : "text-stone-600 hover:bg-stone-50"
                        )}
                      >
                        {opt.label}
                        {filterStatus === opt.value && <span className="material-symbols-outlined text-sm">check</span>}
                      </button>
                    ))}
                  </div>
                </>
              )}
            </div>

            <button 
              onClick={handleExport}
              className="bg-surface-container-lowest px-4 py-2.5 rounded-full border border-outline-variant/20 text-sm font-semibold flex items-center gap-2 hover:bg-white transition-all shadow-sm"
            >
              <span className="material-symbols-outlined text-lg">download</span>
              Export Rekap
            </button>
          </div>
        </div>

        {/* DASHBOARD GRID */}
        <div className="grid grid-cols-1 gap-6">
          {/* MAJOR REPORTS SECTION (BERAT) */}
          <section>
            <div className="flex items-center gap-2 mb-4">
              <span className="w-2 h-2 rounded-full bg-tertiary"></span>
              <h3 className="headline-font font-bold text-lg text-tertiary">Laporan Prioritas (Major)</h3>
            </div>
            
            <div className="grid grid-cols-1 gap-4">
              {isLoading ? (
                <div className="bg-surface-container-lowest p-6 rounded-lg shadow-sm border-l-8 border-tertiary h-32 animate-pulse" />
              ) : majorReports.length === 0 ? (
                <div className="bg-surface-container-lowest p-8 rounded-lg shadow-sm border-l-8 border-tertiary/20 text-center">
                  <p className="text-on-surface-variant font-bold opacity-40">Tidak ada laporan kritis.</p>
                </div>
              ) : (
                majorReports.map((report) => (
                  <MajorCard key={report.id} report={report} />
                ))
              )}
            </div>
          </section>

          {/* MINOR REPORTS SECTION (RINGAN) */}
          <section className="mt-8">
            <div className="flex items-center gap-2 mb-4">
              <span className="w-2 h-2 rounded-full bg-primary"></span>
              <h3 className="headline-font font-bold text-lg text-primary">Laporan Rutin (Minor)</h3>
            </div>
            
            <div className="bg-surface-container-lowest rounded-lg shadow-sm overflow-hidden">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-surface-container-low/50">
                    <th className="px-6 py-4 text-xs font-bold text-stone-400 uppercase tracking-tight">Nama Pasien</th>
                    <th className="px-6 py-4 text-xs font-bold text-stone-400 uppercase tracking-tight">Gejala</th>
                    <th className="px-6 py-4 text-xs font-bold text-stone-400 uppercase tracking-tight">Siklus</th>
                    <th className="px-6 py-4 text-xs font-bold text-stone-400 uppercase tracking-tight">Waktu</th>
                    <th className="px-6 py-4 text-xs font-bold text-stone-400 uppercase tracking-tight">Status</th>
                    <th className="px-6 py-4 text-xs font-bold text-stone-400 uppercase tracking-tight text-right">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-100">
                  {isLoading ? (
                    <tr><td colSpan={6} className="px-6 py-10 text-center animate-pulse">Memuat data...</td></tr>
                  ) : minorReports.length === 0 ? (
                    <tr><td colSpan={6} className="px-6 py-12 text-center text-stone-400 font-bold">Belum ada laporan rutin.</td></tr>
                    ) : (
                      minorReports.map((report) => {
                        const mainSymptomKey = Object.entries(report.symptoms)
                          .filter(([key]) => (SYMPTOM_KEYS as string[]).includes(key))
                          .find(([, v]) => (v as number) > 0)?.[0] ?? ''
                        
                        const schemaItem = REPORT_SCHEMA.find(i => i.key === mainSymptomKey)
                        const mainSymptomLabel = schemaItem ? schemaItem.label.toLowerCase() : 'Keluhan Ringan'

                      return (
                        <tr key={report.id} className="hover:bg-stone-50/50 transition-colors">
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-3">
                              <div className="w-8 h-8 rounded-full bg-primary-container/20 flex items-center justify-center font-bold text-primary text-xs border border-primary/10 overflow-hidden">
                                  {report.patient.fullName.charAt(0)}
                              </div>
                              <span className="font-bold text-sm text-on-surface">{report.patient.fullName}</span>
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <span className="text-sm text-on-surface-variant font-medium capitalize">{mainSymptomLabel}</span>
                          </td>
                          <td className="px-6 py-4">
                            <span className="text-xs bg-surface-container-low px-2.5 py-1 rounded-full font-semibold">Siklus {report.patient.currentCycle ?? 1}</span>
                          </td>
                          <td className="px-6 py-4 text-sm text-stone-500 font-medium">
                            {formatDistanceToNow(new Date(report.createdAt), { addSuffix: true, locale: id })}
                          </td>
                          <td className="px-6 py-4">
                            <span className="flex items-center gap-1.5 text-primary text-xs font-bold">
                              <span className="w-1.5 h-1.5 rounded-full bg-primary"></span>
                              {report.gradeAuto === 'yellow' ? 'Observasi' : 'Ringan'}
                            </span>
                          </td>
                          <td className="px-6 py-4 text-right">
                            {/* A-02: ROUTES constants, bukan template literal hardcoded */}
                            <Link
                              to={ROUTES.PHARMA_PATIENT_DETAIL
                                .replace(':id', report.patient.id)
                                .replace(':reportId?', report.id)}
                              className="text-primary hover:bg-primary-container px-4 py-1.5 rounded-lg text-sm font-bold transition-all inline-block"
                            >
                              Detail
                            </Link>
                          </td>
                        </tr>
                      )
                    })
                  )}
                </tbody>
              </table>
              <div className="p-6 bg-surface-container-lowest border-t border-stone-100 flex items-center justify-center">
                <button className="text-stone-400 text-xs font-bold uppercase tracking-widest flex items-center gap-2 hover:text-primary transition-colors">
                  Lihat Semua Antrean Rutin
                  <span className="material-symbols-outlined text-sm">keyboard_arrow_down</span>
                </button>
              </div>
            </div>
          </section>
        </div>

        {/* QUOTE / STATS SECTION */}
        <div className="mt-12 grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 bg-primary-container/30 p-8 rounded-lg relative overflow-hidden flex items-center">
            <div className="relative z-10">
              <p className="headline-font font-bold text-primary text-xl mb-2">Tips Respon Empati</p>
              <p className="text-on-primary-container text-sm leading-relaxed max-w-lg italic">
                {majorReports.length > 0 
                  ? `"${majorReports[0].patient.fullName.split(' ')[0]} sedang di siklus kritis. Pastikan memberikan edukasi tentang hidrasi dan penggunaan antiemetik sesuai jadwal."`
                  : `"Semua laporan rutin terpantau stabil. Tetap berikan dukungan dan apresiasi atas kedisiplinan pasien dalam melapor hari ini."`
                }
              </p>
            </div>
            <span className="material-symbols-outlined absolute -right-4 -bottom-4 text-[120px] text-primary/10 rotate-12">volunteer_activism</span>
          </div>
          <div className="bg-surface-container-highest p-8 rounded-lg flex flex-col justify-center text-center">
            <p className="text-xs font-bold text-stone-400 uppercase tracking-widest mb-4">Statistik Hari Ini</p>
            <div className="flex justify-around items-center">
              <div>
                <p className="text-3xl font-extrabold text-tertiary">{majorReports.length}</p>
                <p className="text-[10px] font-bold text-on-surface-variant">KRITIS</p>
              </div>
              <div className="h-10 w-[1px] bg-stone-300"></div>
              <div>
                <p className="text-3xl font-extrabold text-primary">{minorReports.length}</p>
                <p className="text-[10px] font-bold text-on-surface-variant">RUTIN</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </PharmacistLayout>
  )
}
