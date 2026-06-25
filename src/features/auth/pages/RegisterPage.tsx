import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { Eye, EyeOff, UserPlus, Info } from 'lucide-react'
import toast from 'react-hot-toast'
import { FormInput } from '@components/ui/FormInput'
import { Button } from '@components/ui/Button'
import { supabase } from '@lib/supabase'
import { ROUTES } from '@configs/app.config'
import { logger } from '@utils/logger'

export default function RegisterPage() {
  const [showPassword, setShowPassword] = useState(false)
  const [fullName, setFullName] = useState('')
  const [whatsApp, setWhatsApp] = useState('')
  const [password, setPassword] = useState('')
  const [isLoading, setIsLoading] = useState(false)

  const navigate = useNavigate()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!fullName || !whatsApp || !password) {
      toast.error('Mohon lengkapi data Nama, Nomor WhatsApp, dan Kata Sandi Anda')
      return
    }
    
    if (password.length < 6) {
      toast.error('Kata sandi harus minimal 6 karakter')
      return
    }

    setIsLoading(true)
    try {
      // Clean phone number from non-digits
      const cleanPhone = whatsApp.replace(/\D/g, '')
      const formattedEmail = `${cleanPhone}@meso.id`

      // Create user and inject raw_user_meta_data for the Postgres Trigger
      const { error } = await supabase.auth.signUp({
        email: formattedEmail,
        password,
        options: {
          data: {
            full_name: fullName,
            role: 'patient',
            phone_number: cleanPhone,
            hospital_id: null,
          }
        }
      })

      if (error) {
        toast.error('Gagal mendaftar: ' + error.message)
        return
      }

      toast.success('Pendaftaran berhasil! Menyambungkan Anda...')
      // Navigate to patient dashboard
      navigate(ROUTES.PATIENT_DASHBOARD, { replace: true })
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Terjadi kesalahan tidak diketahui'
      toast.error('Terjadi kesalahan tidak terduga: ' + message)
      logger.error('[RegisterPage]', err instanceof Error ? err : undefined)
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

        {/* ── HERO SECTION ────────────────────────────── */}
        <div style={{
          background: 'linear-gradient(160deg, #006060 0%, #1a7a7a 60%, #0d9488 100%)',
          padding: '48px 28px 48px',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'flex-start',
          gap: 12,
          position: 'relative',
          overflow: 'hidden',
        }}>
          {/* Decorative orbs */}
          <div style={{ position: 'absolute', top: -40, right: -40, width: 200, height: 200, borderRadius: '50%', background: 'rgba(255,255,255,0.04)', pointerEvents: 'none' }} />

          {/* Headline */}
          <div style={{ width: 48, height: 48, borderRadius: 16, background: 'rgba(255,255,255,0.15)', backdropFilter: 'blur(8px)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 4, border: '1px solid rgba(255,255,255,0.2)' }}>
            <UserPlus size={24} color="#ffffff" />
          </div>

          <div>
            <h1 style={{ fontSize: 24, fontWeight: 800, color: '#ffffff', lineHeight: 1.25, margin: '0 0 6px', letterSpacing: '-0.01em' }}>
              Daftar Akun Baru
            </h1>
            <p style={{ fontSize: 14, color: 'rgba(255,255,255,0.85)', margin: 0, lineHeight: 1.5, maxWidth: 300 }}>
              Mulai pantau kondisi kesehatan dan efek pengobatan secara mandiri.
            </p>
          </div>
        </div>

        {/* ── FORM CARD ────────────────────────────── */}
        <form
          onSubmit={handleSubmit}
          style={{ background: '#ffffff', borderRadius: '28px 28px 0 0', marginTop: -24, flex: 1, padding: '32px 24px 24px', display: 'flex', flexDirection: 'column', gap: 16, boxShadow: '0 -4px 32px rgba(0,0,0,0.06)', position: 'relative', zIndex: 1 }}
        >
          {/* Full Name */}
          <FormInput
            label="Nama Lengkap"
            type="text"
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            placeholder="Sesuai KTP"
            autoComplete="name"
            autoCapitalize="words"
            required
          />

          {/* WhatsApp */}
          <FormInput
            label="Nomor WhatsApp"
            type="tel"
            value={whatsApp}
            onChange={(e) => setWhatsApp(e.target.value)}
            placeholder="Contoh: 08123456789"
            autoComplete="tel"
            inputMode="tel"
            required
          />



          {/* Password */}
          <div>
            <FormInput
              label="Buat Kata Sandi"
              type={showPassword ? 'text' : 'password'}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Minimal 6 karakter"
              autoComplete="new-password"
              required
              style={{ paddingRight: 56 }}
            />
            {/* Eye toggle — overlays the input */}
            <button
              type="button"
              aria-label={showPassword ? 'Sembunyikan kata sandi' : 'Tampilkan kata sandi'}
              onClick={() => setShowPassword(!showPassword)}
              style={{ position: 'absolute', right: 42, marginTop: -46, background: 'none', border: 'none', cursor: 'pointer', padding: 4, display: 'flex', alignItems: 'center', color: '#6e7979' }}
            >
              {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
            </button>
          </div>
          
          <div style={{ display: 'flex', gap: 8, background: '#fef9c3', padding: '12px 16px', borderRadius: 12, marginTop: -4 }}>
            <Info size={16} color="#ca8a04" style={{ flexShrink: 0, marginTop: 2 }} />
            <p style={{ margin: 0, fontSize: 13, color: '#a16207', lineHeight: 1.4 }}>
              Dengan mendaftar, Anda menyetujui <Link to={ROUTES.PRIVACY_POLICY} style={{ color: '#ca8a04', fontWeight: 700, textDecoration: 'underline' }}>Kebijakan Privasi</Link> kami untuk tujuan medis secara rahasia.
            </p>
          </div>

          <div style={{ flex: 1, minHeight: 16 }} />

          {/* CTA */}
          <Button type="submit" isLoading={isLoading}>
            Buat Akun Sekarang
          </Button>

          {/* Back to Login */}
          <div style={{ textAlign: 'center', marginTop: 4 }}>
            <span style={{ fontSize: 14, color: '#6e7979' }}>Sudah punya akun? </span>
            <Link
              to={ROUTES.LOGIN}
              style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 14, fontWeight: 600, color: '#006060', fontFamily: 'inherit', padding: 0, textDecoration: 'none' }}
            >
              Masuk di sini
            </Link>
          </div>
        </form>
      </div>
    </div>
  )
}
