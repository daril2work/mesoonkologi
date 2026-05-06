import { useState } from 'react'
import PharmacistLayout from '../components/PharmacistLayout'
import { usePharmacistSchedules, useCreateSchedule } from '../api/usePatientSchedule'
import { usePatientDirectory } from '../api/usePatientDirectory'
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, isSameDay, startOfWeek, endOfWeek } from 'date-fns'
import { id } from 'date-fns/locale'
import { clsx } from 'clsx'
import { fonnteService } from '@/services/fonnte.service'
import toast from 'react-hot-toast'

export default function PharmacistSchedule() {
  const { data: schedules, isLoading } = usePharmacistSchedules()
  const { data: patients } = usePatientDirectory()
  const createScheduleMutation = useCreateSchedule()

  const [isModalOpen, setIsModalOpen] = useState(false)
  const [formData, setFormData] = useState({
    patientId: '',
    title: 'Kontrol Pasca Kemo',
    date: format(new Date(), 'yyyy-MM-dd'),
    time: '09:00',
    location: 'Poli Onkologi',
    notes: ''
  })

  const handleCreateSchedule = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!formData.patientId) {
      toast.error('Mohon pilih pasien terlebih dahulu')
      return
    }

    try {
      await createScheduleMutation.mutateAsync({
        patient_id: formData.patientId,
        title: formData.title,
        schedule_date: `${formData.date}T${formData.time}:00Z`,
        location: formData.location
      })
      toast.success('Jadwal berhasil ditambahkan')
      setIsModalOpen(false)
    } catch (error: any) {
      console.error('[CreateSchedule Error]', error)
      toast.error(`Gagal: ${error.message || 'Cek koneksi database'}`)
    }
  }

  const handleSendReminder = async (schedule: any) => {
    if (!schedule.patientPhone) {
      toast.error('Nomor WA pasien tidak tersedia')
      return
    }

    const toastId = toast.loading('Mengirim reminder WA...')
    try {
      const msg = fonnteService.formatReminderMessage(
        schedule.patientName,
        format(new Date(schedule.scheduleDate), 'eeee, d MMMM yyyy', { locale: id }),
        format(new Date(schedule.scheduleDate), 'HH:mm'),
        schedule.title
      )

      await fonnteService.sendMessage({
        target: schedule.patientPhone,
        message: msg
      })

      toast.success('Reminder WA berhasil dikirim', { id: toastId })
    } catch (error) {
      toast.error('Gagal mengirim WA: ' + (error as Error).message, { id: toastId })
    }
  }

  const today = new Date()
  const monthStart = startOfMonth(today)
  const monthEnd = endOfMonth(today)
  const calendarStart = startOfWeek(monthStart, { weekStartsOn: 0 })
  const calendarEnd = endOfWeek(monthEnd, { weekStartsOn: 0 })

  const calendarDays = eachDayOfInterval({
    start: calendarStart,
    end: calendarEnd,
  })

  const todaySchedules = schedules?.filter(s => isSameDay(new Date(s.scheduleDate), today)) || []
  const upcomingSchedules = schedules?.filter(s => new Date(s.scheduleDate) > today).slice(0, 5) || []

  const getSchedulesForDay = (day: Date) => {
    return schedules?.filter(s => isSameDay(new Date(s.scheduleDate), day)) || []
  }

  return (
    <PharmacistLayout>
      <div className="pt-8 px-8 pb-12 max-w-[1600px] mx-auto">

        {/* Page Content Grid */}
        <section className="p-10 grid grid-cols-12 gap-10 max-w-[1600px] mx-auto w-full flex-grow">
          {/* LEFT COLUMN: CALENDAR */}
          <div className="col-span-12 xl:col-span-8 space-y-8">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-4xl font-extrabold font-headline text-on-surface tracking-tight">Jadwal Klinis</h2>
                <p className="text-on-surface-variant mt-1 font-medium">{format(today, 'MMMM yyyy', { locale: id })}</p>
              </div>
              <div className="flex items-center gap-4">
                <div className="bg-surface-container-low p-1.5 rounded-xl flex border border-stone-100 shadow-sm">
                  <button className="px-6 py-2 bg-white shadow-sm text-xs font-black uppercase tracking-widest rounded-lg text-primary">Bulanan</button>
                  <button className="px-6 py-2 text-xs font-black uppercase tracking-widest text-stone-400 hover:text-on-surface transition-colors">Mingguan</button>
                </div>
                <button 
                  onClick={() => setIsModalOpen(true)}
                  className="bg-primary text-on-primary px-8 py-3.5 rounded-xl font-bold text-sm flex items-center gap-2 hover:opacity-90 shadow-lg shadow-primary/20 transition-all active:scale-95"
                >
                  <span className="material-symbols-outlined text-[20px]">add</span>
                  Tambah Jadwal
                </button>
              </div>
            </div>

            {/* Calendar Widget */}
            <div className="bg-surface-container-lowest rounded-2xl p-8 shadow-sm border border-stone-100">
              {/* Days Header */}
              <div className="grid grid-cols-7 mb-6">
                {['Min', 'Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab'].map(day => (
                  <div key={day} className="text-center py-2 text-[10px] font-black text-stone-400 tracking-[0.2em] uppercase">{day}</div>
                ))}
              </div>
              
              {/* Grid Days */}
              <div className="grid grid-cols-7 gap-px bg-stone-100 rounded-xl overflow-hidden border border-stone-100">
                {calendarDays.map((day, idx) => {
                  const isCurrentMonth = isSameMonth(day, today)
                  const isTodayDate = isSameDay(day, today)
                  const daySchedules = getSchedulesForDay(day)
                  
                  return (
                    <div 
                      key={idx} 
                      className={clsx(
                        "h-36 p-4 flex flex-col gap-2 transition-all cursor-pointer relative group",
                        isCurrentMonth ? "bg-white hover:bg-surface-container-low" : "bg-stone-50/50 text-stone-300",
                        isTodayDate && "ring-2 ring-primary ring-inset z-10"
                      )}
                    >
                      <span className={clsx(
                        "text-sm font-bold",
                        isTodayDate ? "text-primary" : isCurrentMonth ? "text-on-surface" : "text-stone-300"
                      )}>
                        {format(day, 'd')}
                      </span>
                      {isTodayDate && <span className="text-[9px] font-black text-primary uppercase tracking-widest">Today</span>}
                      
                      <div className="flex flex-col gap-1 mt-1">
                        {daySchedules.slice(0, 2).map((s, i) => (
                          <div 
                            key={i} 
                            className={clsx(
                              "text-[9px] px-2 py-1 rounded truncate font-black uppercase tracking-wider",
                              s.title.includes('Kemo') ? "bg-primary-container/40 text-on-primary-container" :
                              s.title.includes('Kontrol') ? "bg-secondary-container/20 text-on-secondary-container" :
                              "bg-tertiary-container/30 text-on-tertiary-container"
                            )}
                          >
                            {s.patientName.split(' ')[0]}
                          </div>
                        ))}
                        {daySchedules.length > 2 && (
                          <div className="text-[9px] font-black text-stone-400 pl-2">+{daySchedules.length - 2} lagi</div>
                        )}
                      </div>
                    </div>
                  )
                })}
              </div>

              {/* Legend Section */}
              <div className="mt-10 pt-8 border-t border-stone-100 flex gap-8">
                <div className="flex items-center gap-3">
                  <span className="w-2.5 h-2.5 rounded-full bg-primary shadow-sm shadow-primary/20"></span>
                  <span className="text-[10px] font-black text-stone-500 uppercase tracking-widest">Sesi Kemoterapi</span>
                </div>
                <div className="flex items-center gap-3">
                  <span className="w-2.5 h-2.5 rounded-full bg-amber-400 shadow-sm shadow-amber-400/20"></span>
                  <span className="text-[10px] font-black text-stone-500 uppercase tracking-widest">Konsultasi Umum</span>
                </div>
                <div className="flex items-center gap-3">
                  <span className="w-2.5 h-2.5 rounded-full bg-secondary shadow-sm shadow-secondary/20"></span>
                  <span className="text-[10px] font-black text-stone-500 uppercase tracking-widest">Kontrol Lanjutan</span>
                </div>
              </div>
            </div>

            {/* Summary Bento Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-primary-container/30 p-8 rounded-2xl border border-primary/5 shadow-sm group hover:shadow-md transition-all">
                <p className="text-primary text-[10px] font-black uppercase tracking-[0.2em]">Total Hari Ini</p>
                <h4 className="text-5xl font-black text-primary mt-3 headline-font tracking-tight">{todaySchedules.length}</h4>
                <p className="text-on-primary-container/60 text-xs font-bold mt-2">Pasien Terjadwal</p>
              </div>
              <div className="bg-tertiary-container/30 p-8 rounded-2xl border border-tertiary/5 shadow-sm group hover:shadow-md transition-all">
                <p className="text-tertiary text-[10px] font-black uppercase tracking-[0.2em]">Sesi Kemo</p>
                <h4 className="text-5xl font-black text-tertiary mt-3 headline-font tracking-tight">
                  {todaySchedules.filter(s => s.title.includes('Kemo')).length}
                </h4>
                <p className="text-on-tertiary-container/60 text-xs font-bold mt-2">Slot Bed Terisi</p>
              </div>
              <div className="bg-surface-container-high/40 p-8 rounded-2xl border border-stone-100 shadow-sm">
                <p className="text-stone-500 text-[10px] font-black uppercase tracking-[0.2em]">Kapasitas Klinik</p>
                {/* M-04: Dinamis berdasarkan todaySchedules (asumsi max 10/hari) */}
                <h4 className="text-5xl font-black text-on-surface mt-3 headline-font tracking-tight">
                  {Math.min(100, Math.round((todaySchedules.length / 10) * 100))}%
                </h4>
                <div className="w-full h-2.5 bg-white rounded-full mt-5 overflow-hidden border border-stone-100 shadow-inner">
                  <div 
                    className="h-full bg-primary rounded-full shadow-lg shadow-primary/20 transition-all duration-500"
                    style={{ width: `${Math.min(100, (todaySchedules.length / 10) * 100)}%` }}
                  ></div>
                </div>
              </div>
            </div>
          </div>

          {/* RIGHT COLUMN: TIMELINE */}
          <div className="col-span-12 xl:col-span-4 flex flex-col space-y-8">
            <div className="flex items-center justify-between">
              <h3 className="text-2xl font-bold headline-font text-on-surface tracking-tight">Timeline Hari Ini</h3>
              <span className="text-[10px] font-black text-primary bg-primary-container/40 px-4 py-1.5 rounded-full uppercase tracking-widest">
                {format(today, 'd MMM yyyy', { locale: id })}
              </span>
            </div>

            <div className="bg-surface-container-lowest rounded-2xl p-8 shadow-sm border border-stone-100 flex-grow flex flex-col gap-10 relative overflow-hidden">
              {/* Timeline Vertical Line */}
              <div className="absolute left-12 top-16 bottom-16 w-0.5 bg-stone-100"></div>

              {isLoading ? (
                <div className="flex-grow flex items-center justify-center animate-pulse text-stone-400 font-bold uppercase text-[10px] tracking-widest">
                  Menyusun Timeline...
                </div>
              ) : (
                <div className="space-y-10 relative">
                  {todaySchedules.length > 0 ? todaySchedules.map((s, idx) => (
                    <div key={s.id} className="relative flex gap-8 group">
                      {/* Node */}
                      <div className={clsx(
                        "z-10 w-9 h-9 rounded-full flex items-center justify-center border-4 border-white shadow-md transition-transform group-hover:scale-110",
                        idx === 0 ? "bg-primary" : "bg-stone-200"
                      )}>
                        {idx === 0 && <div className="w-2 h-2 rounded-full bg-white animate-ping"></div>}
                      </div>
                      
                      {/* Content */}
                      <div className="flex-grow">
                        <div className="flex justify-between items-center mb-3">
                          <p className={clsx(
                            "text-[10px] font-black uppercase tracking-widest",
                            idx === 0 ? "text-primary" : "text-stone-400"
                          )}>
                            {idx === 0 ? 'Sedang Berlangsung' : 'Mendatang'}
                          </p>
                          <span className="text-xs font-black text-on-surface">{format(new Date(s.scheduleDate), 'HH:mm')}</span>
                        </div>
                        <div className={clsx(
                          "p-5 rounded-2xl border transition-all duration-300",
                          idx === 0 
                            ? "bg-primary-container/10 border-primary-container/40 shadow-sm" 
                            : "bg-surface-container-low/30 border-transparent hover:border-stone-200"
                        )}>
                          <h5 className="font-bold text-on-surface headline-font group-hover:text-primary transition-colors">{s.patientName}</h5>
                          <p className="text-[11px] text-stone-500 font-medium mt-1 uppercase tracking-tight">
                            ID: SN-{s.id.slice(0,5).toUpperCase()} • <span className="font-black text-primary">{s.title}</span>
                          </p>
                          <div className="mt-4 flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <span className="text-[9px] bg-primary/10 text-primary px-3 py-1 rounded-full font-black uppercase tracking-widest">
                                {format(new Date(s.scheduleDate), 'HH:mm')}
                              </span>
                            </div>
                            {(() => {
                              const isWAConfigured = !!import.meta.env.VITE_FONNTE_TOKEN
                              return (
                                <button 
                                  onClick={() => handleSendReminder(s)}
                                  disabled={!isWAConfigured}
                                  title={!isWAConfigured ? 'Token WA belum dikonfigurasi di .env' : 'Kirim Reminder'}
                                  className={clsx(
                                    "flex items-center gap-1.5 transition-colors",
                                    isWAConfigured ? "text-emerald-600 hover:text-emerald-700" : "text-stone-300 cursor-not-allowed"
                                  )}
                                >
                                  <span className="material-symbols-outlined text-sm" style={{ fontVariationSettings: "'FILL' 1" }}>send</span>
                                  <span className="text-[9px] font-black uppercase tracking-widest">Kirim Reminder WA</span>
                                </button>
                              )
                            })()}
                          </div>
                        </div>
                      </div>
                    </div>
                  )) : (
                    <div className="py-20 text-center">
                        <span className="material-symbols-outlined text-stone-200 text-6xl mb-4" style={{ fontVariationSettings: "'wght' 200" }}>event_busy</span>
                        <p className="text-xs font-black text-stone-400 uppercase tracking-widest">Tidak ada jadwal hari ini</p>
                    </div>
                  )}

                  {/* Upcoming indicators if today is empty */}
                  {todaySchedules.length === 0 && upcomingSchedules.map((s) => (
                    <div key={s.id} className="relative flex gap-8 group opacity-60">
                        <div className="z-10 w-9 h-9 rounded-full bg-stone-100 border-4 border-white shadow-sm"></div>
                        <div className="flex-grow py-2">
                            <p className="text-[9px] font-black text-stone-400 uppercase tracking-widest mb-1">{format(new Date(s.scheduleDate), 'dd MMM')}</p>
                            <h5 className="font-bold text-sm text-stone-600">{s.patientName}</h5>
                        </div>
                    </div>
                  ))}
                </div>
              )}

              <button className="mt-auto w-full py-4 text-primary text-xs font-black uppercase tracking-[0.2em] border-2 border-primary/10 rounded-2xl hover:bg-primary/5 transition-all active:scale-95">
                Lihat Selengkapnya
              </button>
            </div>

            {/* Environmental Conditions */}
            <div className="bg-surface-container-high/40 rounded-2xl p-6 flex items-center justify-between border border-stone-100">
              <div>
                <h6 className="text-xs font-black uppercase tracking-widest text-on-surface">Kondisi Lingkungan</h6>
                <p className="text-[10px] font-bold text-stone-400 mt-1">Lobi Utama & Area Perawatan</p>
              </div>
              <div className="flex items-center gap-6">
                <div className="text-center group">
                  <span className="material-symbols-outlined text-primary group-hover:scale-110 transition-transform">thermostat</span>
                  <p className="text-[10px] font-black text-on-surface mt-1">24°C</p>
                </div>
                <div className="text-center group">
                  <span className="material-symbols-outlined text-primary group-hover:scale-110 transition-transform">air</span>
                  <p className="text-[10px] font-black text-on-surface mt-1">Ideal</p>
                </div>
              </div>
            </div>
          </div>
        </section>
        {/* ADD SCHEDULE MODAL */}
        {isModalOpen && (
          <div className="fixed inset-0 bg-stone-900/60 backdrop-blur-sm z-[100] flex items-center justify-center p-6 animate-in fade-in duration-200">
            <div className="bg-white rounded-3xl w-full max-w-xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300">
              <div className="bg-primary p-8 text-on-primary">
                <div className="flex justify-between items-center mb-2">
                  <h3 className="text-2xl font-black headline-font">Tambah Jadwal Baru</h3>
                  <button onClick={() => setIsModalOpen(false)} className="material-symbols-outlined hover:rotate-90 transition-transform">close</button>
                </div>
                <p className="text-on-primary/60 text-xs font-bold uppercase tracking-widest">Atur Sesi Klinis Pasien</p>
              </div>

              <form onSubmit={handleCreateSchedule} className="p-8 space-y-6">
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-stone-400 uppercase tracking-widest">Pilih Pasien</label>
                  <select 
                    required
                    className="w-full bg-stone-50 border border-stone-100 rounded-xl px-4 py-3.5 text-sm font-bold text-on-surface focus:ring-2 ring-primary/20 outline-none"
                    value={formData.patientId}
                    onChange={(e) => setFormData({...formData, patientId: e.target.value})}
                  >
                    <option value="">-- Pilih Pasien --</option>
                    {patients?.map(p => (
                      <option key={p.id} value={p.id}>{p.fullName}</option>
                    ))}
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-stone-400 uppercase tracking-widest">Tanggal</label>
                    <input 
                      type="date"
                      required
                      className="w-full bg-stone-50 border border-stone-100 rounded-xl px-4 py-3.5 text-sm font-bold text-on-surface focus:ring-2 ring-primary/20 outline-none"
                      value={formData.date}
                      onChange={(e) => setFormData({...formData, date: e.target.value})}
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-stone-400 uppercase tracking-widest">Waktu</label>
                    <input 
                      type="time"
                      required
                      className="w-full bg-stone-50 border border-stone-100 rounded-xl px-4 py-3.5 text-sm font-bold text-on-surface focus:ring-2 ring-primary/20 outline-none"
                      value={formData.time}
                      onChange={(e) => setFormData({...formData, time: e.target.value})}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-black text-stone-400 uppercase tracking-widest">Jenis Kegiatan</label>
                  <input 
                    type="text"
                    required
                    placeholder="Contoh: Sesi Kemoterapi"
                    className="w-full bg-stone-50 border border-stone-100 rounded-xl px-4 py-3.5 text-sm font-bold text-on-surface focus:ring-2 ring-primary/20 outline-none"
                    value={formData.title}
                    onChange={(e) => setFormData({...formData, title: e.target.value})}
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-black text-stone-400 uppercase tracking-widest">Lokasi</label>
                  <input 
                    type="text"
                    required
                    className="w-full bg-stone-50 border border-stone-100 rounded-xl px-4 py-3.5 text-sm font-bold text-on-surface focus:ring-2 ring-primary/20 outline-none"
                    value={formData.location}
                    onChange={(e) => setFormData({...formData, location: e.target.value})}
                  />
                </div>

                <div className="pt-4 flex gap-4">
                  <button 
                    type="button"
                    onClick={() => setIsModalOpen(false)}
                    className="flex-1 py-4 text-stone-400 text-xs font-black uppercase tracking-widest hover:bg-stone-50 rounded-2xl transition-colors"
                  >
                    Batal
                  </button>
                  <button 
                    type="submit"
                    disabled={createScheduleMutation.isPending}
                    className="flex-[2] py-4 bg-primary text-on-primary text-xs font-black uppercase tracking-widest rounded-2xl shadow-lg shadow-primary/20 hover:opacity-90 active:scale-95 transition-all disabled:opacity-50"
                  >
                    Simpan Jadwal
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </PharmacistLayout>
  )
}
