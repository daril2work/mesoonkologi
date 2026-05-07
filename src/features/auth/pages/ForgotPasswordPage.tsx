// ============================================================
// Auth Feature — Forgot Password Page
// Design: "Full Teal Hero" (Lumina Healing Design System)
// ============================================================
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { KeyRound, Mail, CheckCircle2 } from 'lucide-react'
import toast from 'react-hot-toast'
import { FormInput } from '@components/ui/FormInput'
import { Button } from '@components/ui/Button'
import { supabase } from '@lib/supabase'
import { ROUTES } from '@configs/app.config'

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [isSubmitted, setIsSubmitted] = useState(false)

  const navigate = useNavigate()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!email) {
      toast.error('Mohon isi alamat email Anda')
      return
    }

    setIsLoading(true)
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}${ROUTES.RESET_PASSWORD}`,
      })

      if (error) {
        toast.error('Gagal mengirim email pemulihan: ' + error.message)
        return
      }

      toast.success('Email pemulihan kata sandi berhasil dikirim!')
      setIsSubmitted(true)
    } catch (err: any) {
      toast.error('Terjadi kesalahan yang tidak terduga.')
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
              Lupa Kata Sandi?
            </h1>
            <p style={{ fontSize: 14, color: 'rgba(255,255,255,0.8)', margin: 0, lineHeight: 1.6, maxWidth: 280 }}>
              Masukkan email Anda dan kami akan mengirimkan tautan untuk mengatur ulang kata sandi Anda.
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
          {!isSubmitted ? (
            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 20, height: '100%' }}>
              {/* Email */}
              <FormInput
                label="Alamat Email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Masukkan email terdaftar Anda"
                autoComplete="email"
                autoCapitalize="none"
                inputMode="email"
                required
              />

              {/* Notice */}
              <div style={{ display: 'flex', gap: 10, background: '#f0f9ff', padding: '12px 16px', borderRadius: 16 }}>
                <Mail size={18} color="#0284c7" style={{ flexShrink: 0, marginTop: 2 }} />
                <p style={{ margin: 0, fontSize: 13, color: '#0369a1', lineHeight: 1.5 }}>
                  Pastikan alamat email yang Anda masukkan aktif dan terdaftar di MESO-app.
                </p>
              </div>

              <div style={{ flex: 1, minHeight: 32 }} />

              {/* Action Button */}
              <Button type="submit" isLoading={isLoading}>
                Kirim Tautan Pemulihan <span style={{ fontSize: 18 }}>→</span>
              </Button>

              {/* Back to Login */}
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
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', gap: 20, paddingTop: 16 }}>
              {/* Success Icon */}
              <div style={{ color: '#0d9488', marginBottom: 8 }}>
                <CheckCircle2 size={64} strokeWidth={1.5} />
              </div>

              <div>
                <h2 style={{ fontSize: 20, fontWeight: 800, color: '#1b1c1b', margin: '0 0 10px' }}>
                  Email Berhasil Dikirim!
                </h2>
                <p style={{ fontSize: 15, color: '#6e7979', lineHeight: 1.6, margin: 0 }}>
                  Kami telah mengirimkan instruksi setel ulang kata sandi ke <strong>{email}</strong>. 
                  Silakan periksa folder kotak masuk serta folder spam/promosi Anda.
                </p>
              </div>

              <div style={{ flex: 1, minHeight: 48 }} />

              {/* Return CTA */}
              <Button onClick={() => navigate(ROUTES.LOGIN)}>
                Kembali ke Halaman Masuk
              </Button>

              <button
                type="button"
                onClick={() => setIsSubmitted(false)}
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
                Kirim ulang ke email berbeda
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
