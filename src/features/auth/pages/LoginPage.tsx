// ============================================================
// Auth Feature — Login Page
// Design: "Full Teal Hero" (Lumina Healing Design System)
// ============================================================
import { useState, useEffect } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { Eye, EyeOff, Lock, Headphones } from 'lucide-react'
import toast from 'react-hot-toast'
import { FormInput } from '@components/ui/FormInput'
import { Toggle } from '@components/ui/Toggle'
import { Button } from '@components/ui/Button'
import { supabase } from '@lib/supabase'
import { ROUTES } from '@configs/app.config'
import { useAuthStore } from '../store'

export default function LoginPage() {
  const [showPassword, setShowPassword] = useState(false)
  const [staySignedIn, setStaySignedIn] = useState(true)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [isLoading, setIsLoading] = useState(false)

  const navigate = useNavigate()
  const location = useLocation()
  const { session, user } = useAuthStore()

  // Watch for global auth state instead of synchronous navigation
  // to prevent race conditions with profile fetching in Zustand
  useEffect(() => {
    if (session && user) {
      const stateFrom = (location.state as { from?: { pathname: string } })?.from?.pathname
      
      if (stateFrom) {
        navigate(stateFrom, { replace: true })
      } else {
        // Route dynamically based on role if no 'from' state exists
        if (user.role === 'pharmacist' || user.role === 'admin') {
          navigate(ROUTES.PHARMA_DASHBOARD, { replace: true })
        } else if (user.role === 'doctor') {
          navigate(ROUTES.DOCTOR_WATCHLIST, { replace: true })
        } else {
          navigate(ROUTES.PATIENT_DASHBOARD, { replace: true })
        }
      }
    }
  }, [session, user, navigate, location])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!email || !password) {
      toast.error('Mohon isi email/WhatsApp/ID Pasien dan kata sandi Anda')
      return
    }
    
    setIsLoading(true)
    try {
      // Panggil RPC database untuk menerjemahkan WhatsApp / ID Pasien / Email menjadi email login yang valid
      const { data: formattedEmail, error: rpcError } = await supabase.rpc('get_login_identifier', {
        search_val: email
      })

      if (rpcError) throw rpcError

      const { error } = await supabase.auth.signInWithPassword({
        email: formattedEmail || email,
        password,
      })

      if (error) {
        toast.error('Gagal masuk: ' + error.message)
        setIsLoading(false) // Unlock only if error, let success stay locked while redirecting
        return
      }

      toast.success('Berhasil masuk!')
      // Do nothing here — the useEffect above will redirect once DB fetch finishes
    } catch (err: any) {
      toast.error(err.message || 'Terjadi kesalahan yang tidak terduga.')
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

        {/* ── HERO SECTION (Top 42%) ────────────────────────────── */}
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

          {/* Logo */}
          <div style={{ width: 64, height: 64, borderRadius: '50%', background: 'rgba(255,255,255,0.15)', backdropFilter: 'blur(8px)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 28, marginBottom: 4, border: '1.5px solid rgba(255,255,255,0.2)' }}>
            🌿
          </div>

          {/* Headline */}
          <div style={{ textAlign: 'center' }}>
            <h1 style={{ fontSize: 26, fontWeight: 800, color: '#ffffff', lineHeight: 1.25, margin: '0 0 8px', letterSpacing: '-0.02em' }}>
              Selamat datang kembali
            </h1>
            <p style={{ fontSize: 15, color: 'rgba(255,255,255,0.75)', margin: 0, lineHeight: 1.6, maxWidth: 260 }}>
              Kami di sini untuk menemani perjalanan Anda
            </p>
          </div>

          {/* Trust Badge */}
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, background: 'rgba(255,255,255,0.15)', backdropFilter: 'blur(8px)', border: '1px solid rgba(255,255,255,0.2)', borderRadius: 999, padding: '6px 14px', marginTop: 4 }}>
            <Lock size={12} color="rgba(255,255,255,0.9)" />
            <span style={{ fontSize: 13, fontWeight: 600, color: 'rgba(255,255,255,0.9)', letterSpacing: '0.01em' }}>
              Data Anda aman
            </span>
          </div>
        </div>

        {/* ── FORM CARD (Bottom Zone) ────────────────────────────── */}
        <form
          onSubmit={handleSubmit}
          style={{ background: '#ffffff', borderRadius: '28px 28px 0 0', marginTop: -24, flex: 1, padding: '36px 24px 24px', display: 'flex', flexDirection: 'column', gap: 16, boxShadow: '0 -4px 32px rgba(0,0,0,0.06)', position: 'relative', zIndex: 1 }}
        >
          {/* Email / ID */}
          <FormInput
            label="WhatsApp / ID Pasien / Email"
            type="text"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Masukkan nomor WA, ID Pasien, atau email Anda"
            autoComplete="username"
            autoCapitalize="none"
            inputMode="email"
            required
          />

          {/* Password */}
          <div>
            <FormInput
              label="Kata Sandi"
              type={showPassword ? 'text' : 'password'}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              autoComplete="current-password"
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

          {/* Stay Signed In */}
          <Toggle
            label="Tetap masuk"
            checked={staySignedIn}
            onChange={setStaySignedIn}
            id="stay-signed-in"
          />

          {/* CTA */}
          <Button type="submit" isLoading={isLoading}>
            Masuk ke portal saya <span style={{ fontSize: 20 }}>→</span>
          </Button>

          {/* Forgot Password OR Register */}
          <div style={{ textAlign: 'center', marginTop: -4, display: 'flex', flexDirection: 'column', gap: 4 }}>
            <button
              type="button"
              onClick={() => navigate(ROUTES.FORGOT_PASSWORD)}
              style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 14, fontWeight: 500, color: '#3e4948', fontFamily: 'inherit', padding: '4px 0', minHeight: 32 }}
            >
              Lupa kata sandi?
            </button>
            <button
              type="button"
              onClick={() => navigate(ROUTES.REGISTER)}
              style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 14, fontWeight: 600, color: '#006060', fontFamily: 'inherit', padding: '4px 0', minHeight: 32 }}
            >
              Belum punya akun? Daftar
            </button>
          </div>

          <div style={{ flex: 1 }} />

          {/* Privacy Link */}
          <div style={{ textAlign: 'center', marginBottom: 8 }}>
            <button
              type="button"
              onClick={() => navigate(ROUTES.PRIVACY_POLICY)}
              style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 12, color: '#a3a9a8', textDecoration: 'underline' }}
            >
              Kebijakan Privasi & Perlindungan Data
            </button>
          </div>

          {/* Support Footer */}
          <div style={{ background: '#f6f3f1', borderRadius: 20, padding: '14px 20px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10, marginTop: 0 }}>
            <Headphones size={18} color="#1a7a7a" />
            <span style={{ fontSize: 15, fontWeight: 600, color: '#1a7a7a' }}>
              Butuh bantuan? Hubungi kami
            </span>
          </div>
        </form>
      </div>
    </div>
  )
}
