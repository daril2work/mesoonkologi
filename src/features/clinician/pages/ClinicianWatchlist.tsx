import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useClinicianWatchlist } from '../api/useClinicianWatchlist'
import ClinicianLayout from '../components/ClinicianLayout'
import { format, formatDistanceToNow } from 'date-fns'
import { id as localeId } from 'date-fns/locale'
import { clsx } from 'clsx'

export default function ClinicianWatchlist() {
  const { watchlist, isLoading } = useClinicianWatchlist()
  const [selectedWard, setSelectedWard] = useState('Semua Bangsal')

  // M-05: Implement filtering logic
  const filteredWatchlist = watchlist?.filter(r => 
    selectedWard === 'Semua Bangsal' || r.patient.ward === selectedWard
  )

  const majorCount = filteredWatchlist?.filter(r => r.isSentinelAlert || r.escalationStatus === 'escalated').length ?? 0
  const minorCount = filteredWatchlist?.filter(r => !r.isSentinelAlert && r.escalationStatus !== 'escalated').length ?? 0
  const stats = [
    { label: 'Pasien Terpantau', value: filteredWatchlist?.length ?? '—', icon: 'group' },
    { label: 'Laporan Major', value: majorCount, icon: 'report_problem' },
    { label: 'Laporan Minor', value: minorCount, icon: 'fact_check' },
  ]

  return (
    <ClinicianLayout>
      <div className="space-y-6 md:space-y-10">
        {/* HEADER SECTION */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
          <div className="max-w-2xl">
            <h2 className="text-3xl md:text-4xl font-headline font-extrabold text-stone-700 tracking-tight leading-tight">Daftar Pantau Prioritas</h2>
            <p className="text-stone-400 font-bold mt-2 text-sm md:text-base">Pantau kondisi kritis pasien secara real-time berdasarkan laporan gejala.</p>
          </div>
          <div className="flex w-full md:w-auto gap-3">
            <button className="flex-1 md:flex-none bg-stone-200/50 px-4 md:px-6 py-3 rounded-2xl text-[11px] md:text-sm font-bold text-stone-600 flex items-center justify-center gap-2 hover:bg-stone-200 transition-all active:scale-95">
              <span className="material-symbols-outlined text-base md:text-lg">filter_list</span>
              <span className="hidden sm:inline">Filter Lanjut</span>
              <span className="sm:hidden">Filter</span>
            </button>
            <button className="flex-1 md:flex-none bg-[#006a60] px-4 md:px-6 py-3 rounded-2xl text-[11px] md:text-sm font-bold text-white flex items-center justify-center gap-2 hover:opacity-90 transition-all shadow-lg shadow-[#006a60]/20 active:scale-95">
              <span className="material-symbols-outlined text-base md:text-lg">download</span>
              Ekspor Laporan
            </button>
          </div>
        </div>

        {/* FILTERS BAR */}
        <div className="flex flex-col lg:flex-row gap-4 md:gap-6">
          <div className="bg-white p-4 md:p-6 rounded-3xl md:rounded-[32px] border border-stone-100 shadow-sm flex-1 lg:max-w-xs">
            <p className="text-[9px] md:text-[10px] font-black text-stone-400 uppercase tracking-widest mb-2 md:mb-3">Filter Bangsal</p>
            <select 
              className="w-full bg-stone-50 border-none rounded-xl py-2.5 md:py-3 px-4 text-xs md:text-sm font-bold text-stone-600 outline-none focus:ring-2 focus:ring-primary/10"
              value={selectedWard}
              onChange={(e) => setSelectedWard(e.target.value)}
            >
              <option value="Semua Bangsal">Semua Bangsal</option>
              <option value="Paviliun Melati">Paviliun Melati</option>
              <option value="Onkologi A">Onkologi A</option>
            </select>
          </div>
          <div className="bg-white p-4 md:p-6 rounded-3xl md:rounded-[32px] border border-stone-100 shadow-sm flex-1 lg:max-w-xs">
            <p className="text-[9px] md:text-[10px] font-black text-stone-400 uppercase tracking-widest mb-2 md:mb-3">Siklus Kemo</p>
            <select className="w-full bg-stone-50 border-none rounded-xl py-2.5 md:py-3 px-4 text-xs md:text-sm font-bold text-stone-600 outline-none focus:ring-2 focus:ring-primary/10">
              <option>Semua Siklus</option>
              <option>Siklus 1</option>
              <option>Siklus 2</option>
            </select>
          </div>
          <div className="flex-1 flex items-center justify-start lg:justify-end gap-6 md:gap-8 px-2 md:px-6 overflow-x-auto no-scrollbar py-2">
            <div className="flex items-center gap-2 shrink-0">
              <span className="w-2 md:w-2.5 h-2 md:h-2.5 bg-[#b90c55] rounded-full shadow-[0_0_8px_rgba(185,12,85,0.4)]"></span>
              {/* C-03: Data dari watchlist nyata */}
              <span className="text-[10px] md:text-xs font-black text-stone-500 uppercase tracking-widest">{majorCount} Major</span>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <span className="w-2 md:w-2.5 h-2 md:h-2.5 bg-[#40e0d0] rounded-full"></span>
              <span className="text-[10px] md:text-xs font-black text-stone-500 uppercase tracking-widest">{minorCount} Minor</span>
            </div>
            <div className="text-[9px] md:text-[10px] font-bold text-stone-300 uppercase tracking-widest italic shrink-0">
              Update: {new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })} WIB
            </div>
          </div>
        </div>

        {/* WATCHLIST TABLE (Desktop) / CARDS (Mobile) */}
        <div className="bg-white rounded-3xl md:rounded-[40px] border border-stone-100 shadow-sm overflow-hidden">
          {/* Desktop Table View */}
          <div className="hidden md:block overflow-x-auto">
            <table className="w-full text-left border-collapse min-w-[1000px]">
              <thead>
                <tr className="bg-stone-50/50">
                  <th className="px-8 py-6 text-[10px] font-black text-stone-400 uppercase tracking-widest">ID Pasien</th>
                  <th className="px-8 py-6 text-[10px] font-black text-stone-400 uppercase tracking-widest">Nama Pasien</th>
                  <th className="px-8 py-6 text-[10px] font-black text-stone-400 uppercase tracking-widest">Bangsal / Siklus</th>
                  <th className="px-8 py-6 text-[10px] font-black text-stone-400 uppercase tracking-widest">Status Terakhir</th>
                  <th className="px-8 py-6 text-[10px] font-black text-stone-400 uppercase tracking-widest">Waktu Laporan</th>
                  <th className="px-8 py-6 text-[10px] font-black text-stone-400 uppercase tracking-widest">Tingkat Prioritas</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-50">
                {isLoading ? (
                  <tr><td colSpan={6} className="px-8 py-20 text-center animate-pulse font-black text-stone-300 uppercase tracking-[0.2em] text-xs">Menyinkronkan data klinis...</td></tr>
                ) : filteredWatchlist?.length === 0 ? (
                  <tr><td colSpan={6} className="px-8 py-20 text-center text-stone-300 font-bold">Tidak ada laporan aktif hari ini.</td></tr>
                ) : (
                  filteredWatchlist?.map((report) => {
                    const isMajor = report.isSentinelAlert || report.escalationStatus === 'escalated'
                    return (
                      <tr key={report.id} className="hover:bg-[#f6fbf9]/50 transition-colors cursor-pointer group">
                        <td className="px-8 py-6">
                          <span className="text-xs font-black text-stone-300 uppercase tracking-tight group-hover:text-stone-500">#PX-{report.patient.id.slice(0, 5).toUpperCase()}</span>
                        </td>
                        <td className="px-8 py-6">
                          <Link to={`/doctor/patient/${report.patient.id}/${report.id}`} className="flex items-center gap-4">
                            <div className={clsx(
                              "w-10 h-10 rounded-full flex items-center justify-center font-black text-xs border-2 border-white shadow-sm",
                              isMajor ? "bg-red-50 text-red-600" : "bg-teal-50 text-teal-600"
                            )}>
                              {report.patient.fullName.split(' ').map(n => n[0]).join('')}
                            </div>
                            <span className="font-bold text-stone-700">{report.patient.fullName}</span>
                          </Link>
                        </td>
                        <td className="px-8 py-6">
                          <div className="flex flex-col">
                            <span className="font-bold text-stone-700 text-sm">{report.patient.ward}</span>
                            <span className="text-[10px] font-black text-stone-400 uppercase tracking-widest">Siklus {report.patient.currentCycle}</span>
                          </div>
                        </td>
                        <td className="px-8 py-6">
                          <div className="flex flex-wrap gap-2">
                             {Object.entries(report.symptoms).filter(([_, v]) => (v as number) > 0).slice(0, 2).map(([k, v]) => (
                               <span key={k} className="px-3 py-1 bg-red-50 text-red-600 rounded-full text-[10px] font-black uppercase tracking-widest border border-red-100">
                                 {k.replace(/([A-Z])/g, ' $1')} {v > 2 ? 'Akut' : ''}
                               </span>
                             ))}
                          </div>
                        </td>
                        <td className="px-8 py-6">
                          <div className="flex flex-col">
                            <span className="font-bold text-stone-700 text-sm">{format(new Date(report.createdAt), 'HH:mm')} WIB</span>
                            <span className="text-[10px] font-black text-red-400 uppercase tracking-widest">{formatDistanceToNow(new Date(report.createdAt), { addSuffix: true, locale: localeId })}</span>
                          </div>
                        </td>
                        <td className="px-8 py-6">
                          <Link 
                            to={`/doctor/patient/${report.patient.id}/${report.id}`}
                            className={clsx(
                              "px-4 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest inline-block text-center",
                              isMajor ? "bg-[#b90c55] text-white shadow-md shadow-[#b90c55]/20" : "bg-[#40e0d0] text-teal-900"
                            )}
                          >
                            {isMajor ? 'Laporan Major' : 'Minor'}
                          </Link>
                        </td>
                      </tr>
                    )
                  })
                )}
              </tbody>
            </table>
          </div>

        {/* Mobile Card View */}
        <div className="md:hidden space-y-6">
          {isLoading ? (
             <div className="p-10 text-center animate-pulse text-stone-300 font-black text-[10px] uppercase tracking-widest">Loading...</div>
          ) : filteredWatchlist?.map((report) => {
            const isMajor = report.isSentinelAlert || report.escalationStatus === 'escalated'
            return (
              <Link 
                key={report.id} 
                to={`/doctor/patient/${report.patient.id}/${report.id}`} 
                className={clsx(
                  "block p-6 bg-white rounded-[32px] border-l-[12px] shadow-sm relative overflow-hidden active:scale-[0.98] transition-all",
                  isMajor ? "border-red-600 bg-red-50/20" : "border-teal-600 bg-teal-50/20"
                )}
              >
                <div className="flex justify-between items-center mb-6">
                  <span className={clsx(
                    "px-4 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-widest",
                    isMajor ? "bg-red-600 text-white shadow-lg shadow-red-600/20" : "bg-teal-600 text-white"
                  )}>
                    {isMajor ? 'MERAH / MAJOR' : 'HIJAU / MINOR'}
                  </span>
                  <span className="text-[10px] font-bold text-stone-400">
                    {formatDistanceToNow(new Date(report.createdAt), { addSuffix: true, locale: localeId })}
                  </span>
                </div>
                
                <div className="flex items-center gap-5">
                  <div className="w-16 h-16 rounded-2xl bg-stone-100 overflow-hidden border-2 border-white shadow-sm shrink-0">
                    <img 
                      src={`https://ui-avatars.com/api/?name=${encodeURIComponent(report.patient.fullName)}&background=${isMajor ? 'fee2e2' : 'ccfbf1'}&color=${isMajor ? 'b91c1c' : '0d9488'}&bold=true`} 
                      className="w-full h-full object-cover"
                      alt={report.patient.fullName}
                    />
                  </div>
                  <div className="space-y-1">
                    <h3 className="text-xl font-black text-stone-700 headline-font">{report.patient.fullName}</h3>
                    <p className="text-xs font-black text-stone-400 uppercase tracking-widest">ID: #P-{report.patient.id.slice(0, 5).toUpperCase()}</p>
                    <div className="flex items-center gap-2 mt-2">
                       <span className="material-symbols-outlined text-[#006a60] text-sm">bed</span>
                       <span className="text-[10px] font-black text-[#006a60] uppercase tracking-widest">{report.patient.ward} / Siklus {report.patient.currentCycle}</span>
                    </div>
                  </div>
                </div>
              </Link>
            )
          })}
        </div>
  
          <div className="px-8 py-6 bg-stone-50/50 border-t border-stone-50 flex justify-between items-center">
            {/* C-03: Jumlah pasien dari data nyata */}
            <p className="text-[10px] font-black text-stone-400 uppercase tracking-widest">Menampilkan {filteredWatchlist?.length ?? 0} pasien dalam daftar pantau</p>
            <div className="flex gap-2">
              <button className="w-8 h-8 rounded-full bg-white border border-stone-100 flex items-center justify-center text-stone-400 hover:text-primary transition-colors active:scale-90"><span className="material-symbols-outlined text-sm">chevron_left</span></button>
              <button className="w-8 h-8 rounded-full bg-[#006a60] text-white flex items-center justify-center text-xs font-black">1</button>
              <button className="w-8 h-8 rounded-full bg-white border border-stone-100 flex items-center justify-center text-xs font-black text-stone-400 hover:text-primary">2</button>
              <button className="w-8 h-8 rounded-full bg-white border border-stone-100 flex items-center justify-center text-xs font-black text-stone-400 hover:text-primary">3</button>
              <button className="w-8 h-8 rounded-full bg-white border border-stone-100 flex items-center justify-center text-stone-400 hover:text-primary transition-colors active:scale-90"><span className="material-symbols-outlined text-sm">chevron_right</span></button>
            </div>
          </div>
        </div>

        {/* BOTTOM STATS SECTION */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-6 md:gap-10">
          <div className="md:col-span-12 lg:col-span-4 bg-white p-6 md:p-10 rounded-[32px] md:rounded-[40px] border-l-[8px] md:border-l-[10px] border-[#b90c55] border border-stone-100 shadow-sm">
            <h4 className="text-base md:text-lg font-headline font-extrabold text-stone-700 mb-3 md:mb-4">Catatan Protokol Major</h4>
            <p className="text-xs md:text-sm text-stone-500 leading-relaxed font-medium">Setiap laporan berstatus <span className="text-[#b90c55] font-black uppercase">Major</span> harus ditinjau dalam waktu maksimal 30 menit. Pastikan ketersediaan bed isolasi atau unit gawat darurat jika diperlukan tindakan segera.</p>
          </div>
          <div className="md:col-span-12 lg:col-span-8 bg-[#004d43] p-6 md:p-10 rounded-[32px] md:rounded-[40px] shadow-2xl relative overflow-hidden flex items-center">
             <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent pointer-events-none"></div>
             <div className="relative z-10 w-full">
               <h4 className="text-[9px] md:text-[10px] font-black text-white/40 uppercase tracking-[0.25em] mb-6 md:mb-8">Ringkasan Harian Bangsal</h4>
               <div className="flex flex-wrap justify-between items-center gap-6 md:pr-10">
                  {stats.map((stat, idx) => (
                    <div key={idx} className="flex flex-col gap-1 md:gap-2">
                       <span className="text-2xl md:text-4xl font-black headline-font text-white">{stat.value}</span>
                       <span className="text-[9px] md:text-[10px] font-black text-white/50 uppercase tracking-widest">{stat.label}</span>
                    </div>
                  ))}
               </div>
             </div>
             <span className="material-symbols-outlined absolute -right-4 md:-right-6 -bottom-4 md:-bottom-6 text-[120px] md:text-[180px] text-white/5 rotate-12">clinical_notes</span>
          </div>
        </div>
      </div>
    </ClinicianLayout>
  )
}
