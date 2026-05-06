import { useParams, useNavigate } from 'react-router-dom'
import ClinicianLayout from '../components/ClinicianLayout'
import { usePatientDetail } from '../../reports/api/usePatientDetail'
import { useClinicianIntervention } from '../api/useClinicianIntervention'
import VitalsCard from '../components/VitalsCard'
import QoLTrendChart from '../components/QoLTrendChart'
import { clsx } from 'clsx'
import { ROUTES } from '@configs/app.config'
import { MAX_CHEMO_CYCLES } from '@configs/clinical.constants'
import { toast } from 'react-hot-toast'
import { useState } from 'react'

export default function ClinicianPatientDetail() {
  const { id, reportId } = useParams()
  const navigate = useNavigate()
  const { data: patient, isLoading } = usePatientDetail(id, reportId)
  const submitIntervention = useClinicianIntervention()

  // C-01: Controlled state menggantikan document.getElementById (anti-pattern)
  const [doctorNotes, setDoctorNotes] = useState('')
  const [suggestedRegimen, setSuggestedRegimen] = useState('')

  // Sync default value dari patient data saat pertama load
  // (menggunakan useEffect atau defaultValue pada textarea)

  const handleIntervention = (resolve: boolean) => {
    if (!patient?.latestReportId) return

    // C-01: Membaca dari controlled state, bukan dari DOM
    submitIntervention.mutate({
      reportId: patient.latestReportId,
      doctorNotes,
      suggestedRegimen,
      resolveEscalation: resolve
    }, {
      onSuccess: () => {
        toast.success(resolve ? 'Eskalasi diselesaikan!' : 'Draft disimpan.')
        if (resolve) navigate(ROUTES.DOCTOR_WATCHLIST)
      },
      onError: () => toast.error('Gagal menyimpan intervensi.')
    })
  }

  if (isLoading) return (
    <ClinicianLayout>
      <div className="p-20 text-center font-display font-black text-[#006a60] animate-pulse uppercase tracking-[0.2em] text-xs">
        Memuat Profil Klinis Pasien...
      </div>
    </ClinicianLayout>
  )

  if (!patient) return (
    <ClinicianLayout>
      <div className="p-20 text-center font-bold text-red-500">Pasien tidak ditemukan.</div>
    </ClinicianLayout>
  )

  return (
    <ClinicianLayout showBack title="Detail Pasien">
      <div className="space-y-8 md:space-y-12 pb-32 max-w-5xl mx-auto">

        {/* HERO CARD - TEAL GRADIENT */}
        <section className="relative overflow-hidden rounded-[40px] p-8 md:p-12 bg-gradient-to-br from-[#a7f3e0] to-[#c1ffef] shadow-xl shadow-teal-900/5 transition-all">
          <div className="relative z-10 space-y-8">
            <div className="flex justify-between items-start">
               <div className="space-y-1">
                 <p className="text-[10px] md:text-xs font-black text-[#006a60] uppercase tracking-widest opacity-70">ID: {id?.slice(0, 8).toUpperCase()}-XM</p>
                 <h2 className="text-3xl md:text-5xl font-headline font-extrabold text-teal-900 tracking-tight leading-none">{patient.fullName}</h2>
                 <p className="text-sm md:text-lg font-bold text-[#006a60] opacity-80 mt-2">{patient.diagnosis}</p>
               </div>
               <div className="bg-white/40 backdrop-blur-md px-5 py-2.5 rounded-2xl border border-white/20 shadow-sm">
                  <span className="text-[10px] md:text-xs font-black text-[#006a60] uppercase tracking-widest">Siklus {patient.currentCycle}/{MAX_CHEMO_CYCLES}</span>
               </div>
            </div>

            <div className="flex gap-4 md:gap-8 pt-2">
               <div className="flex-1 bg-white/60 backdrop-blur-md p-5 rounded-3xl border border-white/30 shadow-sm">
                  <p className="text-[9px] font-black text-[#006a60] uppercase tracking-widest mb-1 opacity-60">Umur</p>
                  {/* C-03: Gunakan data dari patient, bukan hardcoded */}
                  <p className="text-base md:text-xl font-black text-teal-900">
                    {patient.age > 0 ? `${patient.age} Tahun` : '—'}
                  </p>
               </div>
               <div className="flex-1 bg-white/60 backdrop-blur-md p-5 rounded-3xl border border-white/30 shadow-sm">
                  <p className="text-[9px] font-black text-[#006a60] uppercase tracking-widest mb-1 opacity-60">Siklus</p>
                  <p className="text-base md:text-xl font-black text-teal-900">Siklus {patient.currentCycle}/{MAX_CHEMO_CYCLES}</p>
               </div>
            </div>
          </div>
          <div className="absolute -top-24 -right-24 w-72 h-72 bg-white/10 rounded-full blur-3xl"></div>
        </section>

        {/* STATISTIK VITALITAS */}
        <section className="space-y-6">
          <div className="flex justify-between items-center">
            <h3 className="font-headline font-extrabold text-stone-700 text-xl md:text-2xl tracking-tight">Statistik Vitalitas</h3>
            <span className="text-[10px] font-black text-green-600 uppercase tracking-widest flex items-center gap-2">
               <span className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse"></span>
               Real-time
            </span>
          </div>
          <VitalsCard {...patient.vitals} />
        </section>

        {/* LAPORAN MANDIRI */}
        <section className="space-y-6">
          <div className="flex justify-between items-center">
            <h3 className="font-headline font-extrabold text-stone-700 text-xl md:text-2xl tracking-tight">Laporan Mandiri <span className="text-stone-400 font-bold text-sm md:text-base ml-2">24 Jam Terakhir</span></h3>
          </div>
          
          {/* C-03: Gunakan data latestSymptoms dari patient, bukan hardcoded array */}
          <div className="grid grid-cols-3 gap-4 md:gap-8">
            {patient.latestSymptoms.slice(0, 3).map((s, idx) => {
              const colorMap = ['red', 'purple', 'teal'] as const
              const iconMap = ['bolt', 'sick', 'battery_3_bar'] as const
              const color = colorMap[idx] ?? 'teal'
              const icon = iconMap[idx] ?? 'monitor_heart'
              return (
                <div key={s.label} className={clsx(
                    "p-6 md:p-10 rounded-[40px] border border-stone-50 flex flex-col items-center gap-4 relative overflow-hidden text-center transition-transform active:scale-95",
                    color === 'red' ? "bg-red-50/50" : color === 'purple' ? "bg-purple-50/50" : "bg-teal-50/50"
                )}>
                    <div className={clsx(
                      "w-12 h-12 md:w-16 md:h-16 rounded-full flex items-center justify-center text-white shadow-lg",
                      color === 'red' ? "bg-red-500 shadow-red-500/20" : color === 'purple' ? "bg-purple-500 shadow-purple-500/20" : "bg-teal-500 shadow-teal-500/20"
                    )}>
                        <span className="material-symbols-outlined text-2xl md:text-3xl" style={{ fontVariationSettings: "'FILL' 1" }}>{icon}</span>
                    </div>
                    <div className="space-y-1">
                        <p className={clsx(
                          "text-[9px] md:text-[10px] font-black uppercase tracking-widest",
                          color === 'red' ? "text-red-600" : color === 'purple' ? "text-purple-600" : "text-teal-600"
                        )}>{s.label}</p>
                        <p className="text-xl md:text-3xl font-black headline-font text-stone-700">{s.value}/5</p>
                    </div>
                </div>
              )
            })}
          </div>

          {/* Catatan Pasien Box */}
          <div className="p-8 rounded-[40px] bg-white border border-stone-100 shadow-sm flex gap-6 items-start relative overflow-hidden group">
            <div className="absolute top-0 left-0 w-2 h-full bg-red-500"></div>
            <div className="w-12 h-12 rounded-2xl bg-red-50 flex items-center justify-center text-red-500 shrink-0">
              <span className="material-symbols-outlined text-2xl" style={{ fontVariationSettings: "'FILL' 1" }}>warning</span>
            </div>
            <div className="space-y-2">
              <h4 className="font-black text-[10px] text-stone-400 uppercase tracking-widest">Catatan Pasien</h4>
              <p className="text-stone-600 font-bold italic leading-relaxed md:text-lg">
                {patient.clinicalNote ? `"${patient.clinicalNote}"` : 'Tidak ada catatan tambahan dari pasien.'}
              </p>
            </div>
          </div>
        </section>

        {/* TREN KUALITAS HIDUP */}
        <section className="space-y-8">
          <h3 className="font-headline font-extrabold text-stone-700 text-xl md:text-2xl tracking-tight">Tren Kualitas Hidup (QoL)</h3>
          <div className="bg-stone-50/50 p-8 md:p-12 rounded-[40px] border border-stone-100 space-y-10">
              <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                <div className="space-y-1">
                   <p className="text-[10px] font-black text-stone-400 uppercase tracking-widest mb-1">SKOR RATA-RATA</p>
                   {/* C-03: QoL dari data, bukan hardcoded 76% */}
                   <p className="text-5xl md:text-7xl font-black headline-font text-[#006a60]">
                     {patient.qolScore != null ? `${patient.qolScore}%` : '—'}
                   </p>
                </div>
                <div className="bg-teal-900 px-5 py-2.5 rounded-full shadow-xl shadow-teal-900/20">
                   <p className="text-[10px] md:text-xs font-black text-white uppercase tracking-[0.2em]">Skor Kualitas Hidup</p>
                </div>
              </div>
              <div className="h-64 md:h-80 w-full">
                <QoLTrendChart 
                  data={patient.trends.map((t, idx) => ({
                    ...t,
                    isToday: idx === patient.trends.length - 1
                  }))} 
                />
              </div>
          </div>
        </section>

        {/* INTERVENSI KLINIS DOKTER */}
        <section className="space-y-6">
          <div className="flex items-center gap-3">
             <span className="material-symbols-outlined text-[#b90c55]">edit_note</span>
             <h3 className="font-headline font-extrabold text-stone-700 text-xl md:text-2xl tracking-tight">Intervensi Klinis Dokter</h3>
          </div>
          
          <div className="bg-white p-8 md:p-12 rounded-[40px] border-2 border-[#b90c55]/10 shadow-xl shadow-[#b90c55]/5 space-y-10 relative overflow-hidden">
             <div className="absolute top-0 right-0 w-32 h-32 bg-[#b90c55]/5 rounded-bl-[100px]"></div>
             
             <div className="grid grid-cols-1 md:grid-cols-2 gap-8 md:gap-12">
                <div className="space-y-4">
                   <label htmlFor="doctorNotes" className="text-[10px] font-black text-stone-400 uppercase tracking-widest ml-1">Catatan Instruksi Klinis</label>
                   <textarea 
                     id="doctorNotes"
                     className="w-full bg-stone-50 border-none rounded-3xl p-6 text-sm font-bold text-stone-600 outline-none focus:ring-2 focus:ring-[#b90c55]/20 min-h-[150px] placeholder:text-stone-300"
                     placeholder="Tuliskan instruksi penanganan untuk perawat/apoteker..."
                     value={doctorNotes}
                     onChange={(e) => setDoctorNotes(e.target.value)}
                   ></textarea>
                </div>
                <div className="space-y-4">
                   <label htmlFor="suggestedRegimen" className="text-[10px] font-black text-stone-400 uppercase tracking-widest ml-1">Saran Perubahan Regimen</label>
                   <textarea 
                     id="suggestedRegimen"
                     className="w-full bg-stone-50 border-none rounded-3xl p-6 text-sm font-bold text-stone-600 outline-none focus:ring-2 focus:ring-[#b90c55]/20 min-h-[150px] placeholder:text-stone-300"
                     placeholder="Contoh: Turunkan dosis 25%, ganti ke IV Antiemetik..."
                     value={suggestedRegimen}
                     onChange={(e) => setSuggestedRegimen(e.target.value)}
                   ></textarea>
                </div>
             </div>

             <div className="flex flex-col gap-4 pt-6">
                <button 
                  onClick={() => handleIntervention(true)}
                  className="w-full bg-gradient-to-r from-[#006a60] to-[#004d43] text-white h-16 md:h-20 rounded-3xl font-black text-xs md:text-sm uppercase tracking-[0.2em] shadow-xl shadow-teal-900/20 hover:opacity-90 active:scale-95 transition-all flex items-center justify-center gap-4 px-10"
                >
                  <span className="material-symbols-outlined text-xl md:text-2xl">task_alt</span>
                  SELESAIKAN & DEESKALASI
                </button>
                <button 
                  onClick={() => handleIntervention(false)}
                  className="w-full bg-stone-100 text-stone-500 h-16 md:h-20 rounded-3xl font-black text-xs md:text-sm uppercase tracking-[0.15em] hover:bg-stone-200 active:scale-95 transition-all flex items-center justify-center gap-3 px-10"
                >
                  <span className="material-symbols-outlined text-xl">save</span>
                  SIMPAN DRAFT INTERVENSI
                </button>
             </div>
          </div>
        </section>

        {/* LOG INTERAKSI & FEEDBACK FARMASI */}
        {(patient.pharmacistNotes || patient.escalationStatus === 'resolved') && (
          <section className="space-y-6">
            <div className="flex items-center gap-3">
               <span className="material-symbols-outlined text-teal-600">forum</span>
               <h3 className="font-headline font-extrabold text-stone-700 text-xl md:text-2xl tracking-tight">Log Interaksi & Feedback</h3>
            </div>
            
            <div className="bg-stone-50/50 p-8 rounded-[40px] border border-stone-100 space-y-6">
               {patient.pharmacistNotes && (
                 <div className="flex gap-4 items-start bg-white p-6 rounded-3xl shadow-sm border-l-4 border-teal-500">
                    <div className="w-10 h-10 rounded-full bg-teal-50 flex items-center justify-center text-teal-600 shrink-0">
                       <span className="material-symbols-outlined">person_clinical</span>
                    </div>
                    <div className="space-y-1">
                       <p className="text-[10px] font-black text-stone-400 uppercase tracking-widest">Update dari Apoteker</p>
                       <p className="text-stone-700 font-bold leading-relaxed">{patient.pharmacistNotes}</p>
                    </div>
                 </div>
               )}
               
               <div className="flex gap-4 items-start opacity-60">
                  <div className="w-10 h-10 rounded-full bg-stone-100 flex items-center justify-center text-stone-400 shrink-0">
                     <span className="material-symbols-outlined">event_available</span>
                  </div>
                  <div className="space-y-1">
                     <p className="text-[10px] font-black text-stone-400 uppercase tracking-widest">Sistem</p>
                     <p className="text-stone-500 font-medium">Laporan telah ditandai sebagai {patient.escalationStatus === 'resolved' ? 'Selesai' : 'Aktif'}.</p>
                  </div>
               </div>
            </div>
          </section>
        )}

        {/* AKTIVITAS TERAKHIR */}
        <section className="space-y-6">
          <div className="flex items-center gap-3">
             <span className="material-symbols-outlined text-stone-400">history</span>
             <h3 className="font-headline font-extrabold text-stone-700 text-xl md:text-2xl tracking-tight">Aktivitas Terakhir</h3>
          </div>
          <div className="bg-stone-50/50 p-6 md:p-8 rounded-[40px] border border-stone-50 space-y-6">
             {patient.trends.length > 0 ? (
               patient.trends.slice(0, 3).map((t, idx) => (
                 <div key={idx} className="flex gap-4 items-start border-l-4 border-teal-200 pl-4">
                    <div className="space-y-1">
                       <p className="text-sm font-black text-stone-700">Pembaruan Laporan Mandiri</p>
                       <p className="text-[10px] font-bold text-stone-400 uppercase tracking-widest">{t.date} • Pasien {patient.fullName.split(' ')[0]}</p>
                    </div>
                 </div>
               ))
             ) : (
               <p className="text-stone-400 font-bold text-center py-4 text-xs uppercase tracking-widest">Belum ada aktivitas tercatat.</p>
             )}
          </div>
        </section>

      </div>
    </ClinicianLayout>
  )
}
