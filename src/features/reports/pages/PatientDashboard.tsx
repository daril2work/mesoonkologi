import { useAuthStore } from '@features/auth/store'
import { useNavigate } from 'react-router-dom'
import { ROUTES } from '@configs/app.config'
import PatientLayout from '../components/PatientLayout'
import PatientTopNav from '../components/PatientTopNav'
import { ClipboardList, Lightbulb, Calendar, Droplet, Utensils, PlayCircle, MessageCircle, Bell } from 'lucide-react'
import { usePatientSchedule } from '../api/usePatientSchedule'
import { usePatientReports } from '../api/usePatientReports'
import { useEducationMaterials } from '../api/useEducation'
import { format } from 'date-fns'
import { id } from 'date-fns/locale'

export default function PatientDashboard() {
  const { user } = useAuthStore()
  const navigate = useNavigate()
  
  // Fetch data
  const { data: schedules } = usePatientSchedule()
  const { data: reports } = usePatientReports(1)
  const { data: education } = useEducationMaterials()
  
  const nextSchedule = schedules?.[0]
  const latestReport = reports?.[0]
  const nutritionData = latestReport?.symptoms || {}
  
  const featuredTip = education?.find(m => m.isFeatured) || education?.[0]

  return (
    <PatientLayout>
      <div className="bg-white min-h-screen pb-32">
        <PatientTopNav />
        <div className="flex flex-col gap-8 px-6 pt-6">
        
        {/* Greeting Section */}
        <section className="animate-fade-in">
          <h1 className="font-headline text-3xl font-bold text-primary leading-tight tracking-tight">
            Selamat pagi,<br/>Ibu {user?.fullName?.split(' ')[0] ?? 'Sari'}.
          </h1>
          <p className="font-body text-sm text-on-surface-variant mt-2 leading-relaxed">
            Semoga hari ini penuh dengan ketenangan dan kekuatan.
          </p>
        </section>

        {/* Lapor Kondisi Card (Bento-style) */}
        <section className="bg-primary-container p-6 rounded-[32px] shadow-sm relative overflow-hidden group">
          <div className="bg-white/40 w-12 h-12 rounded-2xl flex items-center justify-center mb-4 backdrop-blur-sm">
            <ClipboardList className="text-primary" size={24} />
          </div>
          <h2 className="font-headline text-lg font-bold text-primary mb-2">
            Lapor Kondisi Hari Ini
          </h2>
          <p className="font-body text-xs text-primary/80 mb-6 leading-relaxed">
            Hanya butuh 2 menit untuk memantau kesehatan Ibu. Laporan Ibu sangat membantu tim medis memberikan dukungan yang tepat.
          </p>
          <button
            onClick={() => navigate(ROUTES.PATIENT_REPORT_NEW)}
            className="bg-primary text-on-primary px-6 py-3 rounded-full font-headline font-bold text-sm flex items-center gap-2 hover:opacity-90 transition-all active:scale-95 shadow-md"
          >
            Lapor Sekarang <span>→</span>
          </button>
          
          {/* Decorative element */}
          <div className="absolute -right-4 -bottom-4 w-24 h-24 bg-white/10 rounded-full blur-2xl group-hover:bg-white/20 transition-all" />
        </section>

        <div className="grid grid-cols-1 gap-4">
          {/* Tips Hari Ini Card */}
          <section className="bg-tertiary-container p-6 rounded-[32px] shadow-sm">
            <div className="mb-4">
              <Lightbulb className="text-tertiary" size={28} />
            </div>
            <p className="text-[10px] font-black text-tertiary/60 uppercase tracking-[0.2em] mb-1">
              Tips Hari Ini
            </p>
            <h2 className="font-headline text-lg font-bold text-tertiary mb-2">
              {featuredTip?.title || 'Menjaga Kesehatan'}
            </h2>
            <p className="font-body text-sm text-tertiary/90 mb-4 leading-relaxed line-clamp-2">
              {featuredTip?.description || 'Dapatkan informasi kesehatan terbaru untuk mendukung pemulihan Ibu.'}
            </p>
            <button 
              onClick={() => navigate(ROUTES.PATIENT_EDUCATION)}
              className="text-tertiary font-headline font-bold text-xs flex items-center gap-1 hover:underline"
            >
              Baca selengkapnya <span>→</span>
            </button>
          </section>

          {/* Jadwal Kemo Berikutnya */}
          <section className="bg-white p-6 rounded-[32px] shadow-sm border-l-8 border-secondary-container">
            <div className="mb-4">
              <Calendar className="text-secondary" size={24} />
            </div>
            <h2 className="font-headline text-lg font-bold text-on-surface mb-2">
              {nextSchedule?.title || 'Jadwal Kemo Berikutnya'}
            </h2>
            {nextSchedule ? (
              <div className="mb-4">
                <p className="font-headline text-sm font-semibold text-on-surface">
                  {format(new Date(nextSchedule.scheduleDate), 'eeee, d MMM', { locale: id })}, Pukul {format(new Date(nextSchedule.scheduleDate), 'HH:mm', { locale: id })} WIB
                </p>
                <p className="font-body text-xs text-on-surface-variant mt-1">
                  {nextSchedule.location}
                </p>
              </div>
            ) : (
              <p className="font-body text-sm text-on-surface-variant mb-4">
                Belum ada jadwal yang direncanakan.
              </p>
            )}
            <button className="text-secondary font-headline font-bold text-xs flex items-center gap-2 hover:opacity-80 transition-opacity">
              Atur Pengingat <Bell size={14} />
            </button>
          </section>
        </div>

        {/* Catatan Nutrisi (Horizontal Scroll or Grid) */}
        <section>
          <h3 className="font-headline text-base font-bold text-on-surface mb-4 flex items-center gap-2">
            <span className="text-xl">🍏</span> Catatan Nutrisi
          </h3>
          <div className="flex flex-col gap-3">
            <div className="bg-white p-4 rounded-3xl flex items-center gap-4 shadow-sm border border-surface-container-low">
              <div className="bg-primary-container w-12 h-12 rounded-full flex items-center justify-center">
                <Droplet className="text-primary" size={20} />
              </div>
              <div>
                <h4 className="font-headline text-sm font-bold text-on-surface">Air Putih</h4>
                <p className="font-body text-xs text-on-surface-variant">
                  {nutritionData.waterIntake ?? 0}/8 Gelas hari ini
                </p>
              </div>
            </div>
            <div className="bg-white p-4 rounded-3xl flex items-center gap-4 shadow-sm border border-surface-container-low">
              <div className="bg-tertiary-container w-12 h-12 rounded-full flex items-center justify-center">
                <Utensils className="text-tertiary" size={20} />
              </div>
              <div>
                <h4 className="font-headline text-sm font-bold text-on-surface">Porsi Makan</h4>
                <p className="font-body text-xs text-on-surface-variant">
                  {getFoodStatus(nutritionData.foodIntake)}
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Ruang Relaksasi (Premium Gradient) */}
        <section className="bg-linear-to-br from-primary to-clinical-teal p-6 rounded-[32px] text-white shadow-lg shadow-primary/20">
          <h2 className="font-headline text-xl font-bold mb-4">
            Ruang Relaksasi
          </h2>
          <div className="bg-white/10 backdrop-blur-md p-4 rounded-2xl border border-white/20">
            <p className="font-body text-xs text-white/90 mb-4 leading-relaxed">
              Dengarkan audio meditasi terbimbing khusus untuk ketenangan hati dan pikiran.
            </p>
            <button 
              onClick={() => navigate(ROUTES.PATIENT_EDUCATION)}
              className="w-full bg-white text-primary py-3 rounded-full font-headline font-bold text-sm flex items-center justify-center gap-2 hover:bg-surface-container transition-all"
            >
              <PlayCircle size={20} /> Mulai Meditasi
            </button>
          </div>
        </section>

        {/* Hubungi Bantuan */}
        <section className="bg-surface-container-high p-6 rounded-[32px] mb-8">
          <h3 className="font-headline text-base font-bold text-primary mb-4">
            Butuh Bantuan?
          </h3>
          <div className="flex items-center gap-4 mb-6">
            <div className="w-14 h-14 rounded-full overflow-hidden border-2 border-primary-container shadow-md">
              <img src="https://ui-avatars.com/api/?name=Apoteker&background=046b5e&color=ffffff" alt="Apoteker" className="w-full h-full object-cover" />
            </div>
            <div>
              <h4 className="font-headline text-sm font-bold text-on-surface">Apoteker Pendamping</h4>
              <p className="font-body text-xs text-primary font-medium">Siap melayani konsultasi Ibu</p>
            </div>
          </div>
          <button 
            onClick={() => navigate(ROUTES.PATIENT_CHAT)}
            className="w-full bg-primary text-on-primary py-4 rounded-full font-headline font-bold text-sm flex items-center justify-center gap-2 hover:opacity-95 transition-all shadow-md active:scale-95"
          >
            <MessageCircle size={20} /> Hubungi Apoteker
          </button>
        </section>

      </div>
    </div>
    </PatientLayout>
  )
}

function getFoodStatus(value?: number) {
  if (!value) return 'Belum ada data'
  if (value <= 1) return 'Sangat Sedikit'
  if (value <= 2) return 'Kurang dari biasanya'
  if (value <= 3) return 'Cukup Baik'
  if (value <= 4) return 'Porsi Normal'
  return 'Sangat Baik'
}
