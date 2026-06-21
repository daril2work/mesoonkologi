import { useState } from 'react'
import PharmacistLayout from '../components/PharmacistLayout'
import { usePharmacistSchedules, useCreateSchedule } from '../api/usePatientSchedule'
import { usePatientDirectory } from '../api/usePatientDirectory'
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, isSameDay, startOfWeek, endOfWeek } from 'date-fns'
import { id } from 'date-fns/locale'
import { clsx } from 'clsx'
import { supabase } from '@lib/supabase'
import toast from 'react-hot-toast'

// INT-05: Kapasitas maksimal klinik per hari — ganti magic number 10
// Nilai ini bisa dipindah ke system_settings di masa mendatang
const CLINIC_MAX_CAPACITY = 10

export default function PharmacistSchedule() {
  const [viewType, setViewType] = useState<'monthly' | 'weekly'>('monthly')
  const [currentDate, setCurrentDate] = useState<Date>(new Date())
  const [selectedDate, setSelectedDate] = useState<Date>(new Date())

  const { data: schedules, isLoading } = usePharmacistSchedules(currentDate)
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
      // M-01 Fix: Konversi waktu lokal WIB (GMT+7) ke ISO string yang benar
      const scheduleISODate = `${formData.date}T${formData.time}:00+07:00`
      await createScheduleMutation.mutateAsync({
        patient_id: formData.patientId,
        title: formData.title,
        schedule_date: scheduleISODate,
        location: formData.location
      })
      toast.success('Jadwal berhasil ditambahkan')
      setIsModalOpen(false)

      // INT-04: WA Reminder H-1 dijadwalkan dari SERVER — bukan dari browser
      // Keuntungan: reliable (tidak tergantung browser tetap terbuka),
      //             aman (waktu dihitung server, tidak bisa dimanipulasi client)
      try {
        const { data, error } = await supabase.functions.invoke('schedule-wa-reminder', {
          body: {
            patientId: formData.patientId,
            scheduleDate: scheduleISODate,
            scheduleTitle: formData.title,
          }
        })

        if (error || data?.error) {
          console.error('[Schedule WA Reminder]', error ?? data?.error)
          toast.error('Gagal menjadwalkan WA reminder, namun jadwal berhasil disimpan')
        } else {
          toast.success('WhatsApp Reminder H-1 dijadwalkan otomatis')
        }
      } catch (waError) {
        console.error('[Schedule WA Reminder Error]', waError)
        toast.error('Gagal menjadwalkan WA otomatis, namun jadwal berhasil disimpan')
      }
    } catch (error: unknown) {
      const msg = error instanceof Error ? error.message : 'Cek koneksi database'
      toast.error(`Gagal: ${msg}`)
    }
  }

  const handleSendReminder = async (schedule: any) => {
    if (!schedule.patientPhone) {
      toast.error('Nomor WA pasien tidak tersedia')
      return
    }

    const formattedDate = format(new Date(schedule.scheduleDate), 'eeee, d MMMM yyyy', { locale: id })
    const formattedTime = format(new Date(schedule.scheduleDate), 'HH:mm')
    
    const msg = `Halo ${schedule.patientName},\n\nIni adalah pengingat jadwal ${schedule.title} Anda di Klinik Eksekutif (Poli Onkologi) pada ${formattedDate} pukul ${formattedTime}.\n\nMohon hadir tepat waktu. Terima kasih.`
    
    let waPhone = schedule.patientPhone
    if (waPhone.startsWith('0')) {
      waPhone = '62' + waPhone.slice(1)
    }
    
    const waUrl = `https://wa.me/${waPhone}?text=${encodeURIComponent(msg)}`
    window.open(waUrl, '_blank')
  }

  const today = new Date()

  // Hitung rentang hari kalender dinamis (Bulanan vs Mingguan)
  const calendarDays = viewType === 'monthly'
    ? eachDayOfInterval({
        start: startOfWeek(startOfMonth(currentDate), { weekStartsOn: 0 }),
        end: endOfWeek(endOfMonth(currentDate), { weekStartsOn: 0 }),
      })
    : eachDayOfInterval({
        start: startOfWeek(currentDate, { weekStartsOn: 0 }),
        end: endOfWeek(currentDate, { weekStartsOn: 0 }),
      })

  const todaySchedules = schedules?.filter(s => isSameDay(new Date(s.scheduleDate), today)) || []
  const activeDaySchedules = schedules?.filter(s => isSameDay(new Date(s.scheduleDate), selectedDate)) || []
  const upcomingSchedules = schedules?.filter(s => new Date(s.scheduleDate) > today).slice(0, 5) || []

  const getSchedulesForDay = (day: Date) => {
    return schedules?.filter(s => isSameDay(new Date(s.scheduleDate), day)) || []
  }

  const handlePrevDate = () => {
    setCurrentDate(prev => {
      if (viewType === 'monthly') {
        return new Date(prev.getFullYear(), prev.getMonth() - 1, 1)
      } else {
        const prevWeek = new Date(prev)
        prevWeek.setDate(prev.getDate() - 7)
        return prevWeek
      }
    })
  }

  const handleNextDate = () => {
    setCurrentDate(prev => {
      if (viewType === 'monthly') {
        return new Date(prev.getFullYear(), prev.getMonth() + 1, 1)
      } else {
        const nextWeek = new Date(prev)
        nextWeek.setDate(prev.getDate() + 7)
        return nextWeek
      }
    })
  }

  const isSelectedToday = isSameDay(selectedDate, today)

  return (
    <PharmacistLayout>
      <div className="p-4 sm:p-6 lg:p-8 max-w-[1600px] mx-auto">

        {/* Page Content Grid */}
        <section className="p-0 lg:p-10 grid grid-cols-12 gap-6 lg:gap-10 max-w-[1600px] mx-auto w-full flex-grow">
          {/* LEFT COLUMN: CALENDAR */}
          <div className="col-span-12 xl:col-span-8 space-y-8">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between md:justify-start gap-3">
                <h2 className="text-2xl sm:text-3xl font-extrabold font-headline text-on-surface tracking-tight">Jadwal Klinis</h2>
                <div className="flex items-center justify-center gap-2">
                  <button 
                    onClick={handlePrevDate}
                    className="p-1 hover:bg-stone-100 rounded-full transition-colors flex items-center justify-center text-stone-500 hover:text-on-surface active:scale-90"
                    title="Sebelumnya"
                  >
                    <span className="material-symbols-outlined text-xl">chevron_left</span>
                  </button>
                  <p className="text-on-surface-variant font-medium min-w-[140px] text-center select-none text-sm sm:text-base">
                    {viewType === 'monthly' 
                      ? format(currentDate, 'MMMM yyyy', { locale: id })
                      : `${format(startOfWeek(currentDate, { weekStartsOn: 0 }), 'd MMM')} - ${format(endOfWeek(currentDate, { weekStartsOn: 0 }), 'd MMM yyyy', { locale: id })}`
                    }
                  </p>
                  <button 
                    onClick={handleNextDate}
                    className="p-1 hover:bg-stone-100 rounded-full transition-colors flex items-center justify-center text-stone-500 hover:text-on-surface active:scale-90"
                    title="Berikutnya"
                  >
                    <span className="material-symbols-outlined text-xl">chevron_right</span>
                  </button>
                </div>
              </div>
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 w-full md:w-auto">
                <div className="bg-surface-container-low p-1.5 rounded-xl flex border border-stone-100 shadow-sm justify-between sm:justify-start flex-1 sm:flex-none">
                  <button 
                    onClick={() => setViewType('monthly')}
                    className={clsx(
                      "px-4 sm:px-6 py-2 text-xs font-black uppercase tracking-widest rounded-lg transition-all flex-1 sm:flex-none",
                      viewType === 'monthly' 
                        ? "bg-white shadow-sm text-primary" 
                        : "text-stone-400 hover:text-on-surface"
                    )}
                  >
                    Bulanan
                  </button>
                  <button 
                    onClick={() => setViewType('weekly')}
                    className={clsx(
                      "px-4 sm:px-6 py-2 text-xs font-black uppercase tracking-widest rounded-lg transition-all flex-1 sm:flex-none",
                      viewType === 'weekly' 
                        ? "bg-white shadow-sm text-primary" 
                        : "text-stone-400 hover:text-on-surface"
                    )}
                  >
                    Mingguan
                  </button>
                </div>
                <button 
                  onClick={() => {
                    setFormData(prev => ({ ...prev, date: format(selectedDate, 'yyyy-MM-dd') }))
                    setIsModalOpen(true)
                  }}
                  className="bg-primary text-on-primary px-6 sm:px-8 py-3 sm:py-3.5 rounded-xl font-bold text-sm flex items-center justify-center gap-2 hover:opacity-90 shadow-lg shadow-primary/20 transition-all active:scale-95 w-full sm:w-auto font-body"
                >
                  <span className="material-symbols-outlined text-[20px]">add</span>
                  Tambah Jadwal
                </button>
              </div>
            </div>

            {/* Calendar Widget */}
            <div className="bg-surface-container-lowest rounded-2xl p-3 sm:p-6 lg:p-8 shadow-sm border border-stone-100">
              {/* Days Header */}
              <div className="grid grid-cols-7 mb-4 sm:mb-6">
                {['Min', 'Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab'].map(day => (
                  <div key={day} className="text-center py-1 sm:py-2 text-[8px] sm:text-[10px] font-black text-stone-400 tracking-wider sm:tracking-[0.2em] uppercase">{day}</div>
                ))}
              </div>
              
              {/* Grid Days */}
              <div className="grid grid-cols-7 gap-px bg-stone-100 rounded-xl overflow-hidden border border-stone-100">
                {calendarDays.map((day, idx) => {
                  const isCurrentMonth = isSameMonth(day, currentDate)
                  const isTodayDate = isSameDay(day, today)
                  const isSelectedDate = isSameDay(day, selectedDate)
                  const daySchedules = getSchedulesForDay(day)
                  
                  return (
                    <div 
                      key={idx} 
                      onClick={() => setSelectedDate(day)}
                      className={clsx(
                        viewType === 'weekly' ? "h-40 sm:h-64" : "h-16 sm:h-28 lg:h-36",
                        "p-1.5 sm:p-3 lg:p-4 flex flex-col gap-1 lg:gap-2 transition-all cursor-pointer relative group",
                        isCurrentMonth ? "bg-white hover:bg-surface-container-low" : "bg-stone-50/50 text-stone-300",
                        isTodayDate && "ring-2 ring-primary ring-inset z-10",
                        isSelectedDate && !isTodayDate && "ring-2 ring-stone-300 ring-inset z-10 bg-stone-50/40"
                      )}
                    >
                      <span className={clsx(
                        "text-xs sm:text-sm font-bold",
                        isTodayDate ? "text-primary" : isCurrentMonth ? "text-on-surface" : "text-stone-300"
                      )}>
                        {format(day, 'd')}
                      </span>
                      {isTodayDate && <span className="text-[7px] sm:text-[9px] font-black text-primary uppercase tracking-widest leading-none hidden sm:inline">Today</span>}
                      
                      <div className="flex flex-wrap sm:flex-col gap-1 mt-1">
                        {daySchedules.slice(0, viewType === 'weekly' ? 5 : 2).map((s, i) => (
                          <div 
                            key={i} 
                            className={clsx(
                              "text-[9px] px-2 py-1 rounded truncate font-black uppercase tracking-wider hidden sm:block",
                              s.title.includes('Kemo') ? "bg-primary-container/40 text-on-primary-container" :
                              s.title.includes('Kontrol') ? "bg-secondary-container/20 text-on-secondary-container" :
                              "bg-tertiary-container/30 text-on-tertiary-container"
                            )}
                          >
                            {s.patientName.split(' ')[0]}
                          </div>
                        ))}
                        
                        {/* Dot indicator for mobile month view */}
                        <div className="flex sm:hidden gap-0.5 flex-wrap">
                          {daySchedules.slice(0, 3).map((s, i) => (
                            <span 
                              key={i}
                              className={clsx(
                                "w-1.5 h-1.5 rounded-full shrink-0",
                                s.title.includes('Kemo') ? "bg-primary" :
                                s.title.includes('Kontrol') ? "bg-secondary" :
                                "bg-amber-400"
                              )}
                            />
                          ))}
                          {daySchedules.length > 3 && (
                            <span className="text-[7px] font-black text-stone-400 leading-none">+</span>
                          )}
                        </div>

                        {daySchedules.length > (viewType === 'weekly' ? 5 : 2) && (
                          <div className="text-[9px] font-black text-stone-400 pl-1 hidden sm:block">
                            +{daySchedules.length - (viewType === 'weekly' ? 5 : 2)} lagi
                          </div>
                        )}
                      </div>
                    </div>
                  )
                })}
              </div>

              {/* Legend Section */}
              <div className="mt-6 pt-6 border-t border-stone-100 flex flex-wrap gap-4 sm:gap-8">
                <div className="flex items-center gap-3">
                  <span className="w-2.5 h-2.5 rounded-full bg-primary shadow-sm shadow-primary/20"></span>
                  <span className="text-[9px] sm:text-[10px] font-black text-stone-500 uppercase tracking-widest">Sesi Kemoterapi</span>
                </div>
                <div className="flex items-center gap-3">
                  <span className="w-2.5 h-2.5 rounded-full bg-amber-400 shadow-sm shadow-amber-400/20"></span>
                  <span className="text-[9px] sm:text-[10px] font-black text-stone-500 uppercase tracking-widest">Konsultasi Umum</span>
                </div>
                <div className="flex items-center gap-3">
                  <span className="w-2.5 h-2.5 rounded-full bg-secondary shadow-sm shadow-secondary/20"></span>
                  <span className="text-[9px] sm:text-[10px] font-black text-stone-500 uppercase tracking-widest">Kontrol Lanjutan</span>
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
                <h4 className="text-5xl font-black text-on-surface mt-3 headline-font tracking-tight">
                  {Math.min(100, Math.round((todaySchedules.length / CLINIC_MAX_CAPACITY) * 100))}%
                </h4>
                <div className="w-full h-2.5 bg-white rounded-full mt-5 overflow-hidden border border-stone-100 shadow-inner">
                  <div 
                    className="h-full bg-primary rounded-full shadow-lg shadow-primary/20 transition-all duration-500"
                    style={{ width: `${Math.min(100, (todaySchedules.length / CLINIC_MAX_CAPACITY) * 100)}%` }}
                  ></div>
                </div>
              </div>
            </div>
          </div>

          {/* RIGHT COLUMN: TIMELINE */}
          <div className="col-span-12 xl:col-span-4 flex flex-col space-y-8">
            <div className="flex items-center justify-between">
              <h3 className="text-2xl font-bold headline-font text-on-surface tracking-tight">
                {isSelectedToday ? 'Timeline Hari Ini' : 'Timeline Jadwal'}
              </h3>
              <span className="text-[10px] font-black text-primary bg-primary-container/40 px-4 py-1.5 rounded-full uppercase tracking-widest">
                {format(selectedDate, 'd MMM yyyy', { locale: id })}
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
                  {activeDaySchedules.length > 0 ? activeDaySchedules.map((s, idx) => (
                    <div key={s.id} className="relative flex gap-8 group">
                      {/* Node */}
                      <div className={clsx(
                        "z-10 w-9 h-9 rounded-full flex items-center justify-center border-4 border-white shadow-md transition-transform group-hover:scale-110",
                        (isSelectedToday && idx === 0) ? "bg-primary" : "bg-stone-200"
                      )}>
                        {(isSelectedToday && idx === 0) && <div className="w-2 h-2 rounded-full bg-white animate-ping"></div>}
                      </div>
                      
                      {/* Content */}
                      <div className="flex-grow">
                        <div className="flex justify-between items-center mb-3">
                          <p className={clsx(
                            "text-[10px] font-black uppercase tracking-widest",
                            (isSelectedToday && idx === 0) ? "text-primary" : "text-stone-400"
                          )}>
                            {(isSelectedToday && idx === 0) ? 'Sedang Berlangsung' : 'Terjadwal'}
                          </p>
                          <span className="text-xs font-black text-on-surface">{format(new Date(s.scheduleDate), 'HH:mm')}</span>
                        </div>
                        <div className={clsx(
                          "p-5 rounded-2xl border transition-all duration-300",
                          (isSelectedToday && idx === 0) 
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
                              // M-04 Fix: Gunakan flag terpisah VITE_WA_ENABLED, bukan token langsung
                              const isWAConfigured = import.meta.env.VITE_WA_ENABLED === 'true'
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

                  {/* Upcoming indicators if selected day is empty */}
                  {activeDaySchedules.length === 0 && upcomingSchedules.map((s) => (
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
