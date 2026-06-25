// ============================================================
// Auth Feature — Forgot Password Page
// Design: "Full Teal Hero" (Lumina Healing Design System)
// Description: Automated WhatsApp OTP reset & Email recovery fallback
// ============================================================
import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { KeyRound, Mail, CheckCircle2, Smartphone, ShieldCheck, Eye, EyeOff } from 'lucide-react'
import toast from 'react-hot-toast'
import { FormInput } from '@components/ui/FormInput'
import { Button } from '@components/ui/Button'
import { supabase } from '@lib/supabase'
import { ROUTES } from '@configs/app.config'
import { logger } from '@utils/logger'

interface ForgotPasswordUserData {
  id: string
  phone_number: string | null
  email: string | null
}

export default function ForgotPasswordPage() {
  const [step, setStep] = useState<1 | 2 | 3 | 4>(1) // 1: Input search, 2: WA OTP, 3: Reset Success, 4: Email Sent Fallback
  const [searchVal, setSearchVal] = useState('')
  const [otpCode, setOtpCode] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [isOtpValid, setIsOtpValid] = useState(false)
  const [userData, setUserData] = useState<Partial<ForgotPasswordUserData> | null>(null)
  const navigate = useNavigate()

  // Catch deep link param from WA
  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const phoneParam = params.get('phone')
    if (phoneParam) {
      setUserData({ phone_number: phoneParam })
      setStep(2)
    }
  }, [])

  // Mask email utility for premium privacy UX
  const maskEmail = (emailStr: string) => {
    if (!emailStr) return ''
    const parts = emailStr.split('@')
    if (parts.length !== 2) return emailStr
    const name = parts[0]
    const domain = parts[1]
    if (name.length <= 2) {
      return `${name[0]}***@${domain}`
    }
    return `${name[0]}${'*'.repeat(name.length - 2)}${name[name.length - 1]}@${domain}`
  }

  // Step 1: Submit search identifier (WhatsApp, Patient ID, or Email)
  const handleCheckIdentifier = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!searchVal.trim()) {
      toast.error('Mohon isi nomor WhatsApp, ID Pasien, atau email Anda')
      return
    }

    setIsLoading(true)
    try {
      // Query the user profiles + auth using RPC
      const { data: userProfile, error: rpcError } = await supabase.rpc('get_user_by_identifier', {
        search_val: searchVal.trim()
      })

      if (rpcError) throw rpcError

      if (!userProfile) {
        toast.error('Pengguna tidak ditemukan. Silakan periksa kembali input Anda.')
        setIsLoading(false)
        return
      }

      setUserData(userProfile)

      // Check if user has WhatsApp number registered
      if (userProfile.phone_number && userProfile.phone_number.trim() !== '') {
        // WhatsApp Recovery flow
        toast.loading('Memproses permintaan pemulihan...', { id: 'otp-send' })
        const { data, error: funcError } = await supabase.functions.invoke('request-reset-otp', {
          body: { phone_number: userProfile.phone_number }
        })

        if (funcError || (data && data.error)) {
          toast.error('Gagal mengirim OTP: ' + (funcError?.message || data?.error), { id: 'otp-send' })
          return
        }

        toast.success('Permintaan pemulihan diteruskan. Silakan tunggu WA dari Admin.', { id: 'otp-send' })
        setStep(2)
      } else {
        // Fallback email flow (for legacy users)
        const userEmail = userProfile.email
        if (!userEmail || userEmail.endsWith('@meso.id')) {
          // If the email is virtual and they have no phone number, they are trapped. (Should not happen)
          toast.error('Akun Anda tidak memiliki nomor WhatsApp maupun email aktif. Hubungi pusat bantuan klinis.', { id: 'otp-send' })
          return
        }

        toast.loading('Mengirim tautan pemulihan kata sandi ke email Anda...', { id: 'email-send' })
        const { error: emailResetError } = await supabase.auth.resetPasswordForEmail(userEmail, {
          redirectTo: `${window.location.origin}${ROUTES.RESET_PASSWORD}`,
        })

        if (emailResetError) {
          toast.error('Gagal mengirim email pemulihan: ' + emailResetError.message, { id: 'email-send' })
          return
        }

        toast.success('Tautan pemulihan kata sandi berhasil dikirim!', { id: 'email-send' })
        setStep(4)
      }

    } catch (err) {
      const message = err instanceof Error ? err.message : 'Terjadi kesalahan tidak diketahui'
      toast.error(message)
      logger.error('[ForgotPasswordPage]', err instanceof Error ? err : undefined)
    } finally {
      setIsLoading(false)
    }
  }

  // Step 2a: Verify WhatsApp OTP Only
  const handleVerifyOtpOnly = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!otpCode) {
      toast.error('Mohon isi kode OTP')
      return
    }

    if (!userData) return toast.error('Data pengguna tidak ditemukan')

    setIsLoading(true)
    try {
      const { data, error: verifyError } = await supabase.functions.invoke('verify-and-reset-otp', {
        body: {
          phone_number: userData.phone_number,
          otp_code: otpCode.trim()
        }
      })

      if (verifyError || (data && data.error)) {
        toast.error('Verifikasi gagal: ' + (verifyError?.message || data?.error))
        return
      }

      toast.success('OTP Valid! Silakan buat kata sandi baru.')
      setIsOtpValid(true)
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Terjadi kesalahan tidak diketahui'
      toast.error(message)
      logger.error('[ForgotPasswordPage]', err instanceof Error ? err : undefined)
    } finally {
      setIsLoading(false)
    }
  }

  // Step 2b: Update Password
  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newPassword || !confirmPassword) {
      toast.error('Mohon lengkapi kata sandi baru')
      return
    }

    if (newPassword.length < 6) {
      toast.error('Kata sandi baru minimal 6 karakter')
      return
    }

    if (newPassword !== confirmPassword) {
      toast.error('Konfirmasi kata sandi tidak cocok')
      return
    }

    if (!userData) return toast.error('Data pengguna tidak ditemukan')

    setIsLoading(true)
    try {
      const { data, error: resetError } = await supabase.functions.invoke('verify-and-reset-otp', {
        body: {
          phone_number: userData.phone_number,
          otp_code: otpCode.trim(),
          new_password: newPassword
        }
      })

      if (resetError || (data && data.error)) {
        toast.error('Gagal memperbarui: ' + (resetError?.message || data?.error))
        return
      }

      toast.success('Kata sandi berhasil diperbarui!')
      setStep(3)
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Terjadi kesalahan tidak diketahui'
      toast.error(message)
      logger.error('[ForgotPasswordPage]', err instanceof Error ? err : undefined)
    } finally {
      setIsLoading(false)
    }
  }

  // Resend OTP handler for WhatsApp
  const handleResendOtp = async () => {
    if (!userData || !userData.phone_number) return
    setIsLoading(true)
    try {
      toast.loading('Mengirim ulang kode OTP...', { id: 'otp-resend' })
      const { data, error } = await supabase.functions.invoke('request-reset-otp', {
        body: { phone_number: userData.phone_number }
      })

      if (error || (data && data.error)) {
        toast.error('Gagal mengirim OTP: ' + (error?.message || data?.error), { id: 'otp-resend' })
        return
      }

      toast.success('Kode OTP baru telah dikirim ke WhatsApp!', { id: 'otp-resend' })
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Terjadi kesalahan tidak diketahui'
      toast.error('Terjadi kesalahan saat mengirim ulang OTP: ' + message)
      logger.error('[ForgotPasswordPage]', err instanceof Error ? err : undefined)
    } finally {
      setIsLoading(false)
    }
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

        {/* ── HERO SECTION (Top Zone) ────────────────────────────── */}
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
            <KeyRound size={28} color="#ffffff" />
          </div>

          {/* Headline */}
          <div style={{ textAlign: 'center' }}>
            <h1 style={{ fontSize: 24, fontWeight: 800, color: '#ffffff', lineHeight: 1.25, margin: '0 0 8px', letterSpacing: '-0.02em' }}>
              Atur Ulang Kata Sandi
            </h1>
            <p style={{ fontSize: 14, color: 'rgba(255,255,255,0.8)', margin: 0, lineHeight: 1.6, maxWidth: 280 }}>
              {step === 1 && 'Dapatkan akses kembali ke portal Anda dengan cepat dan aman.'}
              {step === 2 && 'Masukkan kode OTP WhatsApp dan kata sandi baru Anda.'}
              {step === 3 && 'Akun Anda telah berhasil dipulihkan.'}
              {step === 4 && 'Tautan email pemulihan berhasil dikirim.'}
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
          {/* STEP 1: Search user / Identify */}
          {step === 1 && (
            <form onSubmit={handleCheckIdentifier} style={{ display: 'flex', flexDirection: 'column', gap: 20, height: '100%' }}>
              <FormInput
                label="Nomor WhatsApp / ID Pasien / Email"
                type="text"
                value={searchVal}
                onChange={(e) => setSearchVal(e.target.value)}
                placeholder="Masukkan salah satu data di atas"
                required
              />

              <div style={{ display: 'flex', gap: 10, background: '#e6f4f1', padding: '12px 16px', borderRadius: 16 }}>
                <Smartphone size={18} color="#0d9488" style={{ flexShrink: 0, marginTop: 2 }} />
                <p style={{ margin: 0, fontSize: 13, color: '#0f766e', lineHeight: 1.5 }}>
                  <strong>Pemulihan via WhatsApp:</strong> Admin MESO akan memvalidasi dan mengirimkan kode pemulihan langsung ke nomor WA Anda.
                </p>
              </div>

              <div style={{ flex: 1, minHeight: 32 }} />

              <Button type="submit" isLoading={isLoading}>
                Lanjutkan Pemulihan <span style={{ fontSize: 18 }}>→</span>
              </Button>

              <button
                type="button"
                onClick={() => navigate(ROUTES.LOGIN)}
                style={{ 
                  background: 'none', 
                  border: 'none', 
                  cursor: 'pointer', 
                  fontSize: 15, 
                  fontWeight: 600, 
                  color: '#006060', 
                  fontFamily: 'inherit', 
                  alignSelf: 'center', 
                  padding: '8px 16px',
                  minHeight: 36
                }}
              >
                Kembali ke Halaman Masuk
              </button>
            </form>
          )}

          {/* STEP 2: Verify WhatsApp OTP */}
          {step === 2 && !isOtpValid && (
            <form onSubmit={handleVerifyOtpOnly} style={{ display: 'flex', flexDirection: 'column', gap: 16, height: '100%' }}>
              <div style={{ background: '#f0fdf4', border: '1px solid #bbf7d0', padding: '12px 16px', borderRadius: 16, display: 'flex', gap: 10 }}>
                <ShieldCheck size={20} color="#16a34a" style={{ flexShrink: 0 }} />
                <span style={{ fontSize: 13, color: '#15803d', lineHeight: 1.4 }}>
                  Permintaan OTP untuk <strong>{userData?.phone_number}</strong> telah masuk ke sistem. Admin MESO akan segera mengirimkan kode OTP secara manual via WhatsApp. <strong>Harap bersabar menunggu.</strong>
                </span>
              </div>

              <FormInput
                label="Kode OTP (6 Digit)"
                type="text"
                value={otpCode}
                onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                placeholder="Masukkan 6 angka OTP"
                required
                style={{ letterSpacing: '0.25em', fontSize: 18, textAlign: 'center', fontWeight: 'bold' }}
              />

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 4 }}>
                <span style={{ fontSize: 13, color: '#6e7979' }}>Tidak menerima kode?</span>
                <button
                  type="button"
                  onClick={handleResendOtp}
                  disabled={isLoading}
                  style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 13, fontWeight: 700, color: '#0d9488', textDecoration: 'underline', padding: '4px 0' }}
                >
                  Kirim Ulang OTP
                </button>
              </div>

              <div style={{ flex: 1, minHeight: 16 }} />

              <Button type="submit" isLoading={isLoading}>
                Validasi OTP <span style={{ fontSize: 18 }}>→</span>
              </Button>

              <button
                type="button"
                onClick={() => setStep(1)}
                style={{ 
                  background: 'none', 
                  border: 'none', 
                  cursor: 'pointer', 
                  fontSize: 14, 
                  fontWeight: 600, 
                  color: '#6e7979', 
                  fontFamily: 'inherit', 
                  alignSelf: 'center', 
                  padding: '8px 16px',
                  minHeight: 36
                }}
              >
                Kembali ke Step 1
              </button>
            </form>
          )}

          {/* STEP 2b: Input New Password */}
          {step === 2 && isOtpValid && (
            <form onSubmit={handleResetPassword} style={{ display: 'flex', flexDirection: 'column', gap: 16, height: '100%' }}>
              <div style={{ background: '#f0fdf4', border: '1px solid #bbf7d0', padding: '12px 16px', borderRadius: 16, display: 'flex', gap: 10 }}>
                <ShieldCheck size={20} color="#16a34a" style={{ flexShrink: 0 }} />
                <span style={{ fontSize: 13, color: '#15803d', lineHeight: 1.4 }}>
                  Kode OTP Valid. Silakan buat kata sandi baru untuk akun Anda.
                </span>
              </div>

              <div>
                <FormInput
                  label="Kata Sandi Baru"
                  type={showPassword ? 'text' : 'password'}
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Minimal 6 karakter"
                  required
                  style={{ paddingRight: 56 }}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  style={{ position: 'absolute', right: 42, marginTop: -46, background: 'none', border: 'none', cursor: 'pointer', padding: 4, display: 'flex', alignItems: 'center', color: '#6e7979' }}
                >
                  {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                </button>
              </div>

              <FormInput
                label="Konfirmasi Kata Sandi Baru"
                type={showPassword ? 'text' : 'password'}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Ulangi kata sandi baru"
                required
              />

              <div style={{ flex: 1, minHeight: 16 }} />

              <Button type="submit" isLoading={isLoading}>
                Perbarui Kata Sandi <span style={{ fontSize: 18 }}>✓</span>
              </Button>
            </form>
          )}

          {/* STEP 3: OTP Reset Success */}
          {step === 3 && (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', gap: 20, paddingTop: 16 }}>
              <div style={{ color: '#0d9488', marginBottom: 8 }}>
                <CheckCircle2 size={64} strokeWidth={1.5} />
              </div>

              <div>
                <h2 style={{ fontSize: 20, fontWeight: 800, color: '#1b1c1b', margin: '0 0 10px' }}>
                  Kata Sandi Diperbarui!
                </h2>
                <p style={{ fontSize: 15, color: '#6e7979', lineHeight: 1.6, margin: 0 }}>
                  Kata sandi akun Anda berhasil diganti secara aman. Silakan masuk kembali menggunakan kredensial baru Anda.
                </p>
              </div>

              <div style={{ flex: 1, minHeight: 48 }} />

              <Button onClick={() => navigate(ROUTES.LOGIN)}>
                Kembali ke Halaman Masuk
              </Button>
            </div>
          )}

          {/* STEP 4: Fallback Email Sent (Legacy Users) */}
          {step === 4 && (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', gap: 20, paddingTop: 16 }}>
              <div style={{ color: '#0d9488', marginBottom: 8 }}>
                <Mail size={64} strokeWidth={1.5} />
              </div>

              <div>
                <h2 style={{ fontSize: 20, fontWeight: 800, color: '#1b1c1b', margin: '0 0 10px' }}>
                  Email Pemulihan Dikirim!
                </h2>
                <p style={{ fontSize: 15, color: '#6e7979', lineHeight: 1.6, margin: 0 }}>
                  Karena nomor WhatsApp belum ditambahkan ke profil Anda, kami telah mengirimkan tautan penyetelan ulang sandi klasik secara otomatis ke email terdaftar: <strong style={{ color: '#1b1c1b' }}>{maskEmail(userData?.email || '')}</strong>.
                </p>
                <p style={{ fontSize: 13, color: '#8c9594', lineHeight: 1.5, marginTop: 12 }}>
                  Silakan periksa folder kotak masuk/spam Anda. Setelah masuk, jangan lupa memperbarui nomor WhatsApp Anda di modal Profil.
                </p>
              </div>

              <div style={{ flex: 1, minHeight: 32 }} />

              <Button onClick={() => navigate(ROUTES.LOGIN)}>
                Kembali ke Halaman Masuk
              </Button>

              <button
                type="button"
                onClick={() => setStep(1)}
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
                Coba identitas berbeda
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
