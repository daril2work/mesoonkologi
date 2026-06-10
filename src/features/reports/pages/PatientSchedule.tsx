import { useNavigate } from 'react-router-dom'
import { ROUTES } from '@configs/app.config'
import PatientLayout from '../components/PatientLayout'
import PatientTopNav from '../components/PatientTopNav'
import { Clock, MapPin, ChevronLeft, CalendarPlus, Activity } from 'lucide-react'
import { usePatientSchedule } from '../api/usePatientSchedule'
import { format } from 'date-fns'
import { id } from 'date-fns/locale'
import { clsx } from 'clsx'

export default function PatientSchedule() {
  const navigate = useNavigate()
  const { data: schedules, isLoading } = usePatientSchedule()

  return (
    <PatientLayout>
      <div className="bg-surface-container-lowest min-h-screen pb-32">
        <PatientTopNav />

        <header className="px-6 mb-8 mt-6">
          <button 
            onClick={() => navigate(ROUTES.PATIENT_DASHBOARD)}
            className="flex items-center gap-2 text-primary font-headline font-bold text-sm mb-4 hover:opacity-80 transition-opacity"
          >
            <ChevronLeft size={20} /> Kembali ke Beranda
          </button>
          <h1 className="font-headline text-3xl font-bold text-primary tracking-tight">
            Jadwal Saya
          </h1>
          <p className="font-body text-sm text-on-surface-variant mt-2 leading-relaxed">
            Daftar lengkap jadwal kemoterapi, kontrol, dan janji temu medis Anda.
          </p>
        </header>

        <main className="px-6 flex flex-col gap-4">
          {isLoading ? (
            <div className="py-20 text-center animate-pulse">
              <div className="w-12 h-12 bg-primary-container rounded-full mx-auto mb-4 flex items-center justify-center">
                <Activity className="text-primary animate-spin" size={24} />
              </div>
              <p className="font-headline font-bold text-primary text-sm tracking-widest uppercase">Memuat jadwal...</p>
            </div>
          ) : !schedules || schedules.length === 0 ? (
            <div className="bg-white rounded-[32px] p-10 text-center shadow-sm border border-surface-container">
              <div className="bg-primary-container/20 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-6">
                <CalendarPlus size={32} className="text-primary" />
              </div>
              <h3 className="font-headline text-lg font-bold text-on-surface mb-2">
                Belum Ada Jadwal
              </h3>
              <p className="font-body text-sm text-on-surface-variant">
                Saat ini belum ada jadwal kemoterapi atau kontrol yang direncanakan.
              </p>
            </div>
          ) : (
            schedules.map((schedule) => {
              const dateObj = new Date(schedule.scheduleDate)
              const isPast = dateObj < new Date()
              
              return (
                <div 
                  key={schedule.id}
                  className={clsx(
                    "bg-white rounded-[32px] p-6 shadow-sm border border-surface-container-low flex gap-4 transition-all",
                    isPast && "opacity-60"
                  )}
                >
                  <div className="flex flex-col items-center justify-center bg-primary/10 rounded-2xl w-16 h-16 shrink-0 border border-primary/20">
                    <span className="font-headline font-bold text-primary text-[10px] uppercase tracking-widest">{format(dateObj, 'MMM', { locale: id })}</span>
                    <span className="font-headline font-black text-primary text-xl leading-none">{format(dateObj, 'dd', { locale: id })}</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-1">
                      <span className={clsx(
                        "text-[10px] font-black uppercase tracking-widest px-2.5 py-1 rounded-full",
                        schedule.title.toLowerCase().includes('kemo') ? "bg-error/10 text-error" : 
                        schedule.title.toLowerCase().includes('konsul') ? "bg-tertiary/10 text-tertiary" : 
                        "bg-primary/10 text-primary"
                      )}>
                        {schedule.title.toLowerCase().includes('kemo') ? 'Kemoterapi' : 
                         schedule.title.toLowerCase().includes('konsul') ? 'Konsultasi' : 
                         'Tindak Lanjut'}
                      </span>
                      {isPast && (
                        <span className="text-[10px] font-bold text-stone-400">Selesai</span>
                      )}
                    </div>
                    <h3 className="font-headline text-lg font-bold text-on-surface mb-2 truncate">
                      {schedule.title}
                    </h3>
                    
                    <div className="space-y-1.5">
                      <div className="flex items-center gap-2 text-sm text-on-surface-variant">
                        <Clock size={16} className="text-primary/60" />
                        <span>{format(dateObj, 'HH:mm', { locale: id })} WIB</span>
                      </div>
                      <div className="flex items-start gap-2 text-sm text-on-surface-variant">
                        <MapPin size={16} className="text-primary/60 shrink-0 mt-0.5" />
                        <span className="leading-tight">{schedule.location}</span>
                      </div>
                    </div>
                    

                  </div>
                </div>
              )
            })
          )}
        </main>
      </div>
    </PatientLayout>
  )
}
