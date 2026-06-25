// ============================================================
// Auth Feature — Deactivated/Blocked Account Page
// Single Responsibility: Render a premium, empathetic page for deactivated users
// ============================================================
import { useNavigate } from 'react-router-dom'
import { useAuthStore } from '../store'
import { ROUTES } from '@configs/app.config'
import { ShieldAlert, LogOut, HeartHandshake } from 'lucide-react'
import toast from 'react-hot-toast'
import { logger } from '@utils/logger'

export default function DeactivatedAccountPage() {
  const navigate = useNavigate()
  const { logout } = useAuthStore()

  const handleLogout = async () => {
    try {
      await logout()
      toast.success('Berhasil keluar dari sistem.')
      navigate(ROUTES.LOGIN)
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Terjadi kesalahan tidak diketahui'
      toast.error('Gagal keluar: ' + message)
      logger.error('[DeactivatedAccountPage]', err instanceof Error ? err : undefined)
    }
  }

  return (
    <div className="min-h-screen bg-[#faf9f6] flex flex-col justify-center items-center px-6 py-12 relative overflow-hidden">
      {/* Decorative premium blobs */}
      <div className="absolute top-0 left-0 w-96 h-96 bg-primary/5 rounded-full blur-3xl -translate-x-1/2 -translate-y-1/2" />
      <div className="absolute bottom-0 right-0 w-96 h-96 bg-error/5 rounded-full blur-3xl translate-x-1/2 translate-y-1/2" />

      <div className="max-w-md w-full bg-white rounded-[36px] p-8 sm:p-10 shadow-xl border border-stone-100 flex flex-col items-center text-center relative z-1 animate-fade-in">
        
        {/* Warning Icon Badge */}
        <div className="w-20 h-20 rounded-[28px] bg-amber-50 border border-amber-100 text-amber-600 flex items-center justify-center mb-8 shadow-xs">
          <ShieldAlert size={38} strokeWidth={1.5} />
        </div>

        <h1 className="font-headline text-2xl font-black text-stone-850 mb-3 tracking-tight">
          Akun Dinonaktifkan
        </h1>
        
        <p className="text-[10px] font-black text-amber-600 uppercase tracking-widest mb-6">
          Pemberitahuan Administratif
        </p>

        <div className="bg-stone-50 rounded-2xl p-5 mb-8 border border-stone-100 text-left">
          <p className="font-body text-xs text-stone-600 leading-relaxed mb-4">
            Akun Anda telah dinonaktifkan secara administratif oleh pihak apoteker pendamping atau rumah sakit karena salah satu alasan berikut:
          </p>
          <ul className="list-disc pl-5 font-body text-[11px] text-stone-500 space-y-2 leading-relaxed">
            <li>Siklus kemoterapi Anda telah selesai (*Discharged*).</li>
            <li>Anda sudah tidak terdaftar dalam program aktif (*Dismissed*).</li>
            <li>Perubahan administratif rekam medis pasien.</li>
          </ul>
        </div>

        <div className="flex items-center gap-2 justify-center text-primary mb-10 text-xs font-semibold">
          <HeartHandshake size={16} />
          <span>Terima kasih atas perjuangan Anda.</span>
        </div>

        <div className="flex flex-col gap-3 w-full">
          <button
            onClick={handleLogout}
            className="w-full h-14 rounded-full font-headline font-bold text-sm bg-primary text-on-primary hover:opacity-90 flex items-center justify-center gap-2 transition-all active:scale-95 shadow-md shadow-primary/10"
          >
            <LogOut size={16} /> Keluar dari Aplikasi
          </button>
        </div>
      </div>
    </div>
  )
}
