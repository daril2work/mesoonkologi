import { useState } from 'react'
import { Link } from 'react-router-dom'
import PharmacistLayout from '../components/PharmacistLayout'
import { usePatientDirectory, usePatientStats } from '../api/usePatientDirectory'
import { usePatientFilter } from '../hooks/usePatientFilter'
import { format } from 'date-fns'
import { id } from 'date-fns/locale'
import { ROUTES } from '@configs/app.config'
import { clsx } from 'clsx'
import { exportToCSV } from '@utils/helpers'

export default function PharmacistPatients() {
  const { data: patients, isLoading } = usePatientDirectory()
  const { data: stats } = usePatientStats()
  const [isFilterOpen, setIsFilterOpen] = useState(false)

  // S-05: Filter & sort logic ada di usePatientFilter, bukan inline
  const { 
    filteredPatients, 
    searchTerm, 
    sortKey, 
    setSortKey, 
    statusFilter, 
    setStatusFilter 
  } = usePatientFilter(patients)

  const handleExport = () => {
    const exportData = filteredPatients.map(p => ({
      'ID Pasien': p.id,
      'Nama Lengkap': p.fullName,
      'Siklus Saat Ini': p.currentCycle,
      'Status Terakhir': p.overallStatus,
      'Tanggal Laporan Terakhir': p.lastReportDate ? format(new Date(p.lastReportDate), 'dd MMMM yyyy', { locale: id }) : '-',
      'Lokasi Kanker': p.cancerSite || '-'
    }))
    exportToCSV(exportData, 'direktori_pasien_meso')
  }

  return (
    <PharmacistLayout>
      <div className="pt-8 px-8 pb-12 max-w-7xl mx-auto">
        {/* HEADER SECTION */}
        <div className="flex justify-between items-end mb-8">
          <div>
            <h2 className="text-3xl headline-font font-extrabold text-on-surface tracking-tight">Direktori Data Pasien</h2>
            <p className="text-on-surface-variant mt-1 font-medium">Kelola dan pantau perkembangan pasien dalam perawatan kemoterapi.</p>
          </div>
          <div className="flex gap-3 relative">
            <div className="relative">
              <button 
                onClick={() => setIsFilterOpen(!isFilterOpen)}
                className={clsx(
                  "px-6 py-2.5 rounded-full font-bold flex items-center gap-2 transition-all active:scale-95 border",
                  statusFilter !== 'all' 
                    ? "bg-primary/10 border-primary text-primary" 
                    : "bg-surface-container-high border-transparent text-on-surface hover:bg-surface-variant"
                )}
              >
                <span className="material-symbols-outlined text-[20px]">filter_list</span>
                {statusFilter === 'all' ? 'Filter' : statusFilter}
              </button>

              {/* Filter Dropdown */}
              {isFilterOpen && (
                <>
                  <div 
                    className="fixed inset-0 z-40" 
                    onClick={() => setIsFilterOpen(false)} 
                  />
                  <div className="absolute right-0 mt-2 w-56 bg-white rounded-2xl shadow-xl border border-stone-100 p-2 z-50 animate-in fade-in zoom-in-95 duration-200">
                    <p className="px-4 py-2 text-[10px] font-black text-stone-400 uppercase tracking-widest">Filter Status</p>
                    {[
                      { label: 'Semua Status', value: 'all' },
                      { label: 'Butuh Tindakan', value: 'Butuh Tindakan' },
                      { label: 'Observasi', value: 'Observasi' },
                      { label: 'Stabil', value: 'Stabil' },
                    ].map((opt) => (
                      <button
                        key={opt.value}
                        onClick={() => {
                          setStatusFilter(opt.value as any)
                          setIsFilterOpen(false)
                        }}
                        className={clsx(
                          "w-full text-left px-4 py-3 rounded-xl text-sm font-bold transition-colors flex items-center justify-between group",
                          statusFilter === opt.value 
                            ? "bg-primary/5 text-primary" 
                            : "text-stone-600 hover:bg-stone-50"
                        )}
                      >
                        {opt.label}
                        {statusFilter === opt.value && (
                          <span className="material-symbols-outlined text-sm">check</span>
                        )}
                      </button>
                    ))}
                  </div>
                </>
              )}
            </div>
            <button 
              onClick={handleExport}
              className="px-6 py-2.5 rounded-full bg-primary text-on-primary font-bold flex items-center gap-2 hover:opacity-90 shadow-sm transition-all active:scale-95"
            >
              <span className="material-symbols-outlined text-[20px]">file_download</span>
              Export Data
            </button>
          </div>
        </div>

        {/* Bento Grid Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-primary-container/30 p-6 rounded-lg border border-primary/5 group hover:shadow-md transition-all">
            <p className="text-on-primary-container/70 text-[10px] font-black uppercase tracking-widest mb-2">Total Pasien</p>
            <h3 className="text-4xl headline-font font-bold text-primary">{stats?.total?.toLocaleString() ?? '—'}</h3>
            <p className="text-primary text-[10px] mt-4 flex items-center gap-1 font-black uppercase tracking-wider">
              <span className="material-symbols-outlined text-sm">trending_up</span>
              Data Terkini
            </p>
          </div>
          <div className="bg-white p-6 rounded-lg shadow-sm border border-stone-100 group hover:border-tertiary/20 transition-all">
            <p className="text-stone-500 text-[10px] font-black uppercase tracking-widest mb-2">Status Kritis</p>
            <h3 className="text-4xl headline-font font-bold text-tertiary">{stats?.critical ?? '0'}</h3>
            <p className="text-tertiary text-[10px] mt-4 font-black uppercase tracking-wider">Membutuhkan perhatian segera</p>
          </div>
          <div className="bg-white p-6 rounded-lg shadow-sm border border-stone-100 group hover:border-secondary/20 transition-all">
            <p className="text-stone-500 text-[10px] font-black uppercase tracking-widest mb-2">Jadwal Minggu Ini</p>
            <h3 className="text-4xl headline-font font-bold text-secondary">{stats?.scheduledThisWeek ?? '0'}</h3>
            <p className="text-stone-400 text-[10px] mt-4 font-black uppercase tracking-wider">Sesi kemoterapi terencana</p>
          </div>
          <div className="bg-tertiary-container/20 p-6 rounded-lg border border-tertiary/5 group hover:shadow-md transition-all">
            <p className="text-on-tertiary-container/70 text-[10px] font-black uppercase tracking-widest mb-2">Edukasi Selesai</p>
            <h3 className="text-4xl headline-font font-bold text-on-tertiary-container">{stats?.completedEducation ?? '0'}</h3>
            <p className="text-on-tertiary-container text-[10px] mt-4 font-black uppercase tracking-wider">Pasien memahami protokol</p>
          </div>
        </div>

        {/* Table Section */}
        <div className="bg-surface-container-lowest rounded-lg overflow-hidden shadow-sm border border-stone-100">
          <div className="p-6 flex items-center justify-between border-b border-surface-container bg-surface-container-low/20">
            <div className="flex items-center gap-4">
              <span className="font-bold text-lg headline-font text-on-surface">Daftar Pasien Aktif</span>
              <span className="px-3 py-1 bg-surface-container-high rounded-full text-[10px] font-black text-on-surface-variant uppercase tracking-widest">
                {patients?.length ?? 0} Pasien
              </span>
            </div>
            <div className="flex items-center gap-4">
              {/* S-05: Select terhubung ke setSortKey dari usePatientFilter */}
              <select
                value={sortKey}
                onChange={(e) => setSortKey(e.target.value as any)}
                className="bg-transparent border-none text-xs font-black text-stone-500 focus:ring-0 uppercase tracking-widest cursor-pointer outline-none"
              >
                <option value="status">Urutkan: Status</option>
                <option value="name">Urutkan: Nama (A-Z)</option>
                <option value="oldest">Urutkan: Terlama</option>
              </select>
            </div>
          </div>
          
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="bg-surface-container-low/50 text-on-surface-variant uppercase text-[10px] tracking-widest font-black border-b border-stone-100">
                  <th className="px-8 py-4">ID Pasien</th>
                  <th className="px-6 py-4">Nama Pasien</th>
                  <th className="px-6 py-4 text-center">Siklus Ke</th>
                  <th className="px-6 py-4">Laporan Terakhir</th>
                  <th className="px-6 py-4">Status Overall</th>
                  <th className="px-8 py-4 text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-100">
                {isLoading ? (
                  <tr><td colSpan={6} className="px-8 py-10 text-center animate-pulse font-bold text-stone-400">Menyinkronkan data pasien...</td></tr>
                ) : filteredPatients.length === 0 ? (
                  <tr><td colSpan={6} className="px-8 py-12 text-center text-stone-400 font-bold">
                    {searchTerm ? 'Tidak ada pasien yang cocok dengan pencarian.' : 'Belum ada pasien terdaftar.'}
                  </td></tr>
                ) : (
                  filteredPatients.map((p) => (
                    <tr key={p.id} className="hover:bg-surface-container-low transition-colors group cursor-pointer">
                      <td className="px-8 py-5 text-[11px] font-mono font-bold text-stone-400 tracking-wider">#P-{p.id.slice(0, 6).toUpperCase()}</td>
                      <td className="px-6 py-5">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-full bg-primary-container/20 overflow-hidden flex items-center justify-center font-bold text-primary text-sm border border-primary/10">
                            {p.fullName.charAt(0)}
                          </div>
                          <span className="font-bold text-sm text-on-surface group-hover:text-primary transition-colors">{p.fullName}</span>
                        </div>
                      </td>
                      <td className="px-6 py-5 text-center">
                        <span className={clsx(
                          "px-3 py-1 rounded-full font-bold text-[10px] uppercase tracking-widest",
                          p.overallStatus === 'Butuh Tindakan' ? "bg-tertiary-container text-on-tertiary-container" : "bg-primary-container text-on-primary-container"
                        )}>
                          {p.currentCycle} / 8
                        </span>
                      </td>
                      <td className="px-6 py-5 text-sm text-stone-600 font-medium">
                        {p.lastReportDate ? format(new Date(p.lastReportDate), 'dd MMM yyyy', { locale: id }) : 'Belum melapor'}
                      </td>
                      <td className="px-6 py-5">
                        <div className="flex items-center gap-2">
                          <div className={clsx(
                            "w-2 h-2 rounded-full",
                            p.overallStatus === 'Stabil' ? "bg-teal-500" : 
                            p.overallStatus === 'Butuh Tindakan' ? "bg-error animate-pulse" : "bg-amber-400"
                          )}></div>
                          <span className={clsx(
                            "text-xs font-bold uppercase tracking-wider",
                            p.overallStatus === 'Stabil' ? "text-teal-700" : 
                            p.overallStatus === 'Butuh Tindakan' ? "text-error" : "text-amber-700"
                          )}>
                            {p.overallStatus}
                          </span>
                        </div>
                      </td>
                      <td className="px-8 py-5 text-right">
                        <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                          <Link 
                            to={ROUTES.PHARMA_PATIENT_DETAIL.replace(':id', p.id).replace('/:reportId?', '')} 
                            className="p-2 rounded-full hover:bg-white text-stone-500 hover:text-primary transition-colors"
                            title="Lihat Profil & Detail"
                          >
                            <span className="material-symbols-outlined text-[20px]">person</span>
                          </Link>
                          <Link 
                            to={ROUTES.PHARMA_CHAT} 
                            state={{ patientId: p.id, patientName: p.fullName }}
                            className="p-2 rounded-full hover:bg-white text-stone-500 hover:text-primary transition-colors"
                            title="Chat dengan Pasien"
                          >
                            <span className="material-symbols-outlined text-[20px]">chat_bubble</span>
                          </Link>
                          <Link 
                            to={ROUTES.PHARMA_SCHEDULE}
                            className="p-2 rounded-full hover:bg-white text-stone-500 hover:text-primary transition-colors"
                            title="Atur Jadwal"
                          >
                            <span className="material-symbols-outlined text-[20px]">edit_calendar</span>
                          </Link>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          <div className="p-6 bg-surface-container-low/10 flex items-center justify-between border-t border-stone-100">
            <span className="text-[10px] text-stone-500 font-black uppercase tracking-[0.15em]">
              Menampilkan {patients?.length ?? 0} dari {stats?.total?.toLocaleString() ?? '—'} pasien
            </span>
            <div className="flex items-center gap-1">
              <button className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-surface-container text-stone-400 active:scale-90 transition-all">
                <span className="material-symbols-outlined text-[18px]">chevron_left</span>
              </button>
              <button className="w-8 h-8 flex items-center justify-center rounded-lg bg-primary text-on-primary text-[10px] font-black shadow-sm">1</button>
              <button className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-surface-container text-[10px] font-black text-stone-600 transition-colors">2</button>
              <button className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-surface-container text-[10px] font-black text-stone-600 transition-colors">3</button>
              <span className="mx-1 text-stone-400 text-[10px]">...</span>
              <button className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-surface-container text-stone-400 active:scale-90 transition-all">
                <span className="material-symbols-outlined text-[18px]">chevron_right</span>
              </button>
            </div>
          </div>
        </div>

        {/* Asymmetric Support Section */}
        <div className="mt-12 flex flex-col lg:flex-row gap-8">
          <div className="flex-1 bg-secondary-fixed/10 p-10 rounded-xl relative overflow-hidden group border border-secondary-container/10">
            <div className="absolute -right-12 -bottom-12 w-64 h-64 bg-secondary-fixed/20 rounded-full blur-3xl group-hover:scale-125 transition-transform duration-1000"></div>
            <div className="relative z-10 max-w-lg">
              <h4 className="text-2xl headline-font font-bold text-on-secondary-fixed mb-4 tracking-tight">Butuh panduan teknis?</h4>
              <p className="text-on-secondary-fixed-variant mb-8 leading-relaxed font-medium">Akses modul pembelajaran terbaru mengenai monitoring efek samping obat karsinogenik untuk meningkatkan kualitas pelaporan.</p>
              <Link 
                to={ROUTES.PHARMA_EDUCATION}
                className="px-8 py-3.5 bg-secondary text-on-secondary rounded-xl font-black text-sm hover:opacity-90 shadow-lg shadow-secondary/20 transition-all inline-block active:scale-95"
              >
                Buka Manajemen Edukasi
              </Link>
            </div>
          </div>
          
          <div className="w-full lg:w-80 bg-tertiary-fixed/10 p-10 rounded-xl border border-tertiary-container/10 shadow-sm">
            <h4 className="headline-font font-bold text-on-tertiary-fixed mb-6 tracking-tight flex items-center gap-2">
              <span className="material-symbols-outlined text-tertiary">notifications_active</span>
              Notifikasi
            </h4>
            {/* TODO F-01: Notifikasi real dari Supabase realtime (Sprint 4) */}
            <p className="text-sm text-stone-400 font-medium italic">Tidak ada notifikasi baru saat ini.</p>
          </div>
        </div>
      </div>
    </PharmacistLayout>
  )
}
