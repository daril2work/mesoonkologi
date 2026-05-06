import { useState } from 'react'
import { Link } from 'react-router-dom'
import ClinicianLayout from '../components/ClinicianLayout'
import { useClinicianHistory } from '../api/useClinicianHistory'
import { formatDistanceToNow, format } from 'date-fns'
import { id as localeId } from 'date-fns/locale'
import { clsx } from 'clsx'

export default function ClinicianHistory() {
  const { history, isLoading } = useClinicianHistory()
  const [searchQuery, setSearchQuery] = useState('')

  // M-06: Implement search logic
  const filteredHistory = history.filter(r => 
    r.patient.fullName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    r.patient.id.toLowerCase().includes(searchQuery.toLowerCase())
  )

  return (
    <ClinicianLayout showBack title="Riwayat Pasien">
      <div className="space-y-10">
        {/* HEADER SECTION */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
          <div className="max-w-2xl">
            <h2 className="text-3xl md:text-4xl font-headline font-extrabold text-stone-700 tracking-tight leading-tight">Riwayat Pasien</h2>
            <p className="text-stone-400 font-bold mt-2 text-sm md:text-base">Daftar pasien yang pernah di-eskalasi dan ditangani sebelumnya.</p>
          </div>
          <div className="bg-white px-6 py-3 rounded-2xl border border-stone-100 shadow-sm flex items-center gap-3">
             <span className="w-2.5 h-2.5 bg-stone-300 rounded-full"></span>
             <span className="text-xs font-black text-stone-500 uppercase tracking-widest">{filteredHistory.length} Laporan Terarsip</span>
          </div>
        </div>

        {/* SEARCH & FILTER (Simulated) */}
        <div className="bg-white p-4 md:p-6 rounded-[32px] border border-stone-100 shadow-sm flex flex-col md:flex-row gap-4 items-center">
           <div className="relative flex-1 w-full">
              <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-stone-300">search</span>
              <input 
                type="text" 
                placeholder="Cari nama pasien atau ID..." 
                className="w-full bg-stone-50 border-none rounded-2xl py-3 pl-12 pr-6 text-sm font-bold text-stone-600 outline-none focus:ring-2 focus:ring-teal-500/10 transition-all"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
           </div>
           <button className="w-full md:w-auto px-8 py-3 bg-stone-100 text-stone-500 rounded-2xl text-sm font-black uppercase tracking-widest hover:bg-stone-200 transition-all">
              Filter Tanggal
           </button>
        </div>

        {/* HISTORY LIST */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {isLoading ? (
            <div className="col-span-2 py-20 text-center animate-pulse text-stone-300 font-black text-xs uppercase tracking-widest">Memuat riwayat eskalasi...</div>
          ) : filteredHistory.length === 0 ? (
            <div className="col-span-2 py-20 text-center text-stone-300 font-bold">Belum ada riwayat eskalasi tersimpan.</div>
          ) : (
            filteredHistory.map((report) => (
              <Link 
                key={report.id} 
                to={`/doctor/patient/${report.patient.id}`} 
                className="group p-8 bg-white rounded-[40px] border border-stone-100 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all relative overflow-hidden"
              >
                <div className="flex justify-between items-start mb-6">
                  <div className="flex items-center gap-4">
                     <div className="w-14 h-14 rounded-2xl bg-stone-50 flex items-center justify-center text-stone-400 group-hover:bg-teal-50 group-hover:text-teal-600 transition-colors">
                        <span className="material-symbols-outlined text-3xl">account_circle</span>
                     </div>
                     <div>
                        <h3 className="text-xl font-black text-stone-700 headline-font">{report.patient.fullName}</h3>
                        <p className="text-[10px] font-black text-stone-300 uppercase tracking-widest">ID: #P-{report.patient.id.slice(0, 5).toUpperCase()}</p>
                     </div>
                  </div>
                  <span className="px-4 py-1.5 bg-stone-100 text-stone-500 rounded-xl text-[9px] font-black uppercase tracking-widest">
                    {format(new Date(report.createdAt), 'dd MMM yyyy', { locale: localeId })}
                  </span>
                </div>

                <div className="space-y-4">
                   <div className="p-4 bg-stone-50/50 rounded-2xl border border-stone-100/50">
                      <p className="text-[9px] font-black text-stone-400 uppercase tracking-widest mb-1">Catatan Dokter</p>
                      <p className="text-sm font-bold text-stone-600 line-clamp-2">
                         {report.doctorNotes || 'Tidak ada catatan tertulis.'}
                      </p>
                   </div>
                   <div className="flex justify-between items-center text-[10px] font-black uppercase tracking-widest">
                      <span className="text-stone-400">Status: <span className={clsx(report.escalationStatus === 'resolved' ? "text-green-600" : "text-amber-600")}>{report.escalationStatus}</span></span>
                      <span className="text-[#006a60] group-hover:underline">Lihat Detail →</span>
                   </div>
                </div>
              </Link>
            ))
          )}
        </div>
      </div>
    </ClinicianLayout>
  )
}
