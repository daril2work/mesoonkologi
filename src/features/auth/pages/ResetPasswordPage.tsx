// ============================================================
// Auth Feature — Reset Password Page
// Design: "Full Teal Hero" (Lumina Healing Design System)
// ============================================================
import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Eye, EyeOff, Lock, AlertTriangle, CheckCircle2 } from 'lucide-react'
import toast from 'react-hot-toast'
import { FormInput } from '@components/ui/FormInput'
import { Button } from '@components/ui/Button'
import { AppLoader } from '@components/ui/AppLoader'
import { supabase } from '@lib/supabase'
import { ROUTES } from '@configs/app.config'
import { logger } from '@utils/logger'
import { useAuthStore } from '../store'

export default function ResetPasswordPage() {
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  
  const [isVerifying, setIsVerifying] = useState(true)
  const [hasSession, setHasSession] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [isSuccess, setIsSuccess] = useState(false)

  const navigate = useNavigate()
  const { logout } = useAuthStore()

  useEffect(() => {
    // Check if there is an active session or a recovery token parsed by Supabase
    const verifySession = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession()
        if (session) {
          setHasSession(true)
        } else {
          setHasSession(false)
        }
      } catch (err) {
        setHasSession(false)
      } finally {
        setIsVerifying(false)
      }
    }

    verifySession()
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!password || !confirmPassword) {
      toast.error('Mohon isi semua bidang kata sandi')
      return
    }

    if (password.length < 6) {
      toast.error('Kata sandi harus minimal 6 karakter')
      return
    }

    if (password !== confirmPassword) {
      toast.error('Konfirmasi kata sandi tidak cocok')
      return
    }

    setIsLoading(true)
    try {
      const { error } = await supabase.auth.updateUser({ password })

      if (error) {
        toast.error('Gagal mengatur ulang kata sandi: ' + error.message)
        setIsLoading(false)
        return
      }

      toast.success('Kata sandi berhasil diperbarui!')
      setIsSuccess(true)
      
      // Force log out to clear the recovery session securely
      await logout()
      
      // Delay navigation to let the user see the success screen briefly
      setTimeout(() => {
        navigate(ROUTES.LOGIN, { replace: true })
      }, 3000)
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Terjadi kesalahan tidak diketahui'
      toast.error('Terjadi kesalahan yang tidak terduga: ' + message)
      logger.error('[ResetPasswordPage]', err instanceof Error ? err : undefined)
      setIsLoading(false)
    }
  }

  if (isVerifying) {
    return <AppLoader />
  }

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      background: '#f6f3f1',
      fontFamily: '"Plus Jakarta Sans", ui-sans-serif, system-ui, sans-serif',
    }}>
      {/* Mobile Frame */}
      <div style={{
        width: '100%',
        maxWidth: 390,
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
        position: 'relative',
        overflow: 'hidden',
        background: '#f6f3f1',
      }}>

        {/* ── HERO SECTION ────────────────────────────── */}
        <div style={{
          background: 'linear-gradient(160deg, #006060 0%, #1a7a7a 60%, #0d9488 100%)',
          padding: '56px 28px 52px',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: 16,
          position: 'relative',
          overflow: 'hidden',
        }}>
          {/* Decorative orbs */}
          <div style={{ position: 'absolute', top: -40, right: -40, width: 200, height: 200, borderRadius: '50%', background: 'rgba(255,255,255,0.04)', pointerEvents: 'none' }} />
          <div style={{ position: 'absolute', bottom: 20, left: -60, width: 160, height: 160, borderRadius: '50%', background: 'rgba(255,255,255,0.03)', pointerEvents: 'none' }} />

          {/* Icon Badge */}
          <div style={{ width: 64, height: 64, borderRadius: '50%', background: 'rgba(255,255,255,0.15)', backdropFilter: 'blur(8px)', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1.5px solid rgba(255,255,255,0.2)', marginBottom: 4 }}>
            {hasSession ? <Lock size={28} color="#ffffff" /> : <AlertTriangle size={28} color="#ffffff" />}
          </div>

          {/* Headline */}
          <div style={{ textAlign: 'center' }}>
            <h1 style={{ fontSize: 24, fontWeight: 800, color: '#ffffff', lineHeight: 1.25, margin: '0 0 8px', letterSpacing: '-0.02em' }}>
              {hasSession ? 'Setel Kata Sandi Baru' : 'Akses Tidak Valid'}
            </h1>
            <p style={{ fontSize: 14, color: 'rgba(255,255,255,0.8)', margin: 0, lineHeight: 1.6, maxWidth: 280 }}>
              {hasSession 
                ? 'Silakan masukkan kata sandi baru Anda di bawah ini untuk mengamankan akun Anda.' 
                : 'Tautan setel ulang kata sandi tidak valid atau telah kedaluwarsa.'}
            </p>
          </div>
        </div>

        {/* ── FORM CARD (Bottom Zone) ────────────────────────────── */}
        <div style={{ 
          background: '#ffffff', 
          borderRadius: '28px 28px 0 0', 
          marginTop: -24, 
          flex: 1, 
          padding: '36px 24px 24px', 
          display: 'flex', 
          flexDirection: 'column', 
          boxShadow: '0 -4px 32px rgba(0,0,0,0.06)', 
          position: 'relative', 
          zIndex: 1 
        }}>
          {isSuccess ? (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', gap: 24, paddingTop: 32 }}>
              <div style={{ color: '#0d9488' }}>
                <CheckCircle2 size={64} strokeWidth={1.5} />
              </div>
              <div>
                <h2 style={{ fontSize: 20, fontWeight: 800, color: '#1b1c1b', margin: '0 0 10px' }}>
                  Pembaruan Berhasil!
                </h2>
                <p style={{ fontSize: 15, color: '#6e7979', lineHeight: 1.6, margin: 0 }}>
                  Kata sandi Anda telah berhasil diperbarui. Mengalihkan Anda kembali ke halaman masuk...
                </p>
              </div>
            </div>
          ) : hasSession ? (
            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 20, height: '100%' }}>
              
              {/* New Password */}
              <div>
                <FormInput
                  label="Kata Sandi Baru"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Minimal 6 karakter"
                  autoComplete="new-password"
                  required
                  style={{ paddingRight: 56 }}
                />
                <button
                  type="button"
                  aria-label={showPassword ? 'Sembunyikan kata sandi' : 'Tampilkan kata sandi'}
                  onClick={() => setShowPassword(!showPassword)}
                  style={{ position: 'absolute', right: 42, marginTop: -46, background: 'none', border: 'none', cursor: 'pointer', padding: 4, display: 'flex', alignItems: 'center', color: '#6e7979' }}
                >
                  {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                </button>
              </div>

              {/* Confirm Password */}
              <div>
                <FormInput
                  label="Konfirmasi Kata Sandi Baru"
                  type={showConfirmPassword ? 'text' : 'password'}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Ulangi kata sandi baru"
                  autoComplete="new-password"
                  required
                  style={{ paddingRight: 56 }}
                />
                <button
                  type="button"
                  aria-label={showConfirmPassword ? 'Sembunyikan kata sandi' : 'Tampilkan kata sandi'}
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  style={{ position: 'absolute', right: 42, marginTop: -46, background: 'none', border: 'none', cursor: 'pointer', padding: 4, display: 'flex', alignItems: 'center', color: '#6e7979' }}
                >
                  {showConfirmPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                </button>
              </div>

              <div style={{ flex: 1, minHeight: 32 }} />

              {/* Submit Button */}
              <Button type="submit" isLoading={isLoading}>
                Perbarui Kata Sandi <span style={{ fontSize: 18 }}>→</span>
              </Button>
            </form>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', gap: 24, paddingTop: 16 }}>
              <p style={{ fontSize: 15, color: '#6e7979', lineHeight: 1.6, margin: 0 }}>
                Tautan pemulihan yang Anda ikuti sudah kedaluwarsa atau tidak valid. Silakan ajukan permintaan lupa kata sandi kembali untuk menerima tautan baru.
              </p>
              
              <div style={{ flex: 1, minHeight: 48 }} />

              <Button onClick={() => navigate(ROUTES.FORGOT_PASSWORD)}>
                Ajukan Lupa Kata Sandi
              </Button>

              <button
                type="button"
                onClick={() => navigate(ROUTES.LOGIN)}
                style={{
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  fontSize: 14,
                  fontWeight: 600,
                  color: '#6e7979',
                  fontFamily: 'inherit',
                  padding: '4px 0',
                  textDecoration: 'underline'
                }}
              >
                Kembali ke Halaman Masuk
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
