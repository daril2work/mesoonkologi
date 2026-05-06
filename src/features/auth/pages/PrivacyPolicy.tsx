import { useNavigate } from 'react-router-dom'
import { ArrowLeft, ShieldCheck, Lock, Eye, Trash2, FileText } from 'lucide-react'

/**
 * MESO App — Privacy Policy Page
 * Compliant with UU PDP No. 27/2022 (Indonesia) for medical data.
 */
export default function PrivacyPolicy() {
  const navigate = useNavigate()

  return (
    <div style={{ minHeight: '100vh', background: '#fcf9f8', paddingBottom: '64px' }}>
      {/* Header */}
      <header style={{ 
        padding: '24px', 
        background: '#ffffff', 
        display: 'flex', 
        alignItems: 'center', 
        gap: '16px',
        position: 'sticky',
        top: 0,
        zIndex: 10,
        boxShadow: '0 4px 12px rgba(27, 28, 28, 0.02)'
      }}>
        <button 
          onClick={() => navigate(-1)}
          style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: '#046b5e' }}
        >
          <ArrowLeft size={24} />
        </button>
        <h1 style={{ 
          fontFamily: '"Plus Jakarta Sans", sans-serif', 
          fontSize: '1.25rem', 
          fontWeight: 800, 
          color: '#1b1c1c', 
          margin: 0 
        }}>
          Kebijakan Privasi
        </h1>
      </header>

      <main style={{ padding: '32px 24px', maxWidth: '800px', margin: '0 auto' }}>
        
        <div style={{ 
          background: '#e5f9f5', 
          borderRadius: '24px', 
          padding: '24px', 
          display: 'flex', 
          gap: '16px', 
          marginBottom: '32px' 
        }}>
          <ShieldCheck size={32} color="#046b5e" />
          <p style={{ 
            fontFamily: '"Inter", sans-serif', 
            fontSize: '0.875rem', 
            color: '#046b5e', 
            margin: 0, 
            lineHeight: 1.6,
            fontWeight: 500
          }}>
            Data kesehatan Ibu adalah prioritas utama kami. Kami berkomitmen untuk melindungi informasi medis Ibu sesuai dengan standar hukum yang berlaku.
          </p>
        </div>

        <section style={{ marginBottom: '40px' }}>
          <h2 style={{ fontFamily: '"Plus Jakarta Sans", sans-serif', fontSize: '1.125rem', fontWeight: 700, color: '#1b1c1c', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Lock size={20} color="#046b5e" /> 1. Data yang Kami Kumpulkan
          </h2>
          <p style={{ fontFamily: '"Inter", sans-serif', fontSize: '0.95rem', color: '#424848', lineHeight: 1.7 }}>
            Kami mengumpulkan informasi kesehatan yang Ibu berikan melalui formulir laporan gejala, termasuk namun tidak terbatas pada: mual, nyeri, demam, dan catatan klinis lainnya. Informasi ini digunakan secara eksklusif untuk membantu tim medis memantau kondisi pengobatan Ibu.
          </p>
        </section>

        <section style={{ marginBottom: '40px' }}>
          <h2 style={{ fontFamily: '"Plus Jakarta Sans", sans-serif', fontSize: '1.125rem', fontWeight: 700, color: '#1b1c1c', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Eye size={20} color="#046b5e" /> 2. Penggunaan & Akses Data
          </h2>
          <p style={{ fontFamily: '"Inter", sans-serif', fontSize: '0.95rem', color: '#424848', lineHeight: 1.7 }}>
            Akses ke data kesehatan Ibu dibatasi hanya kepada tenaga medis profesional (Apoteker dan Dokter) yang bertugas di rumah sakit mitra. Kami tidak pernah menjual atau membagikan data Ibu ke pihak ketiga untuk tujuan komersial.
          </p>
        </section>

        <section style={{ marginBottom: '40px' }}>
          <h2 style={{ fontFamily: '"Plus Jakarta Sans", sans-serif', fontSize: '1.125rem', fontWeight: 700, color: '#1b1c1c', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Trash2 size={20} color="#b90c55" /> 3. Hak Anda (Right to be Forgotten)
          </h2>
          <p style={{ fontFamily: '"Inter", sans-serif', fontSize: '0.95rem', color: '#424848', lineHeight: 1.7 }}>
            Sesuai UU PDP No. 27/2022, Ibu berhak meminta penghapusan data pribadi dan medis dari sistem kami. Jika Ibu ingin menghentikan penggunaan aplikasi dan menghapus seluruh riwayat laporan, silakan hubungi tim dukungan kami melalui menu bantuan atau hubungi Apoteker pendamping.
          </p>
        </section>

        <section style={{ marginBottom: '40px' }}>
          <h2 style={{ fontFamily: '"Plus Jakarta Sans", sans-serif', fontSize: '1.125rem', fontWeight: 700, color: '#1b1c1c', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <FileText size={20} color="#046b5e" /> 4. Keamanan Informasi
          </h2>
          <p style={{ fontFamily: '"Inter", sans-serif', fontSize: '0.95rem', color: '#424848', lineHeight: 1.7 }}>
            Kami menggunakan enkripsi berlapis standar industri untuk melindungi data saat disimpan dan TLS untuk melindungi data saat dalam perjalanan. Sistem kami diaudit secara berkala untuk memastikan keamanan infrastruktur.
          </p>
        </section>

        <div style={{ 
          borderTop: '1px solid #e5e2e1', 
          paddingTop: '24px', 
          marginTop: '48px',
          textAlign: 'center' 
        }}>
          <p style={{ fontFamily: '"Inter", sans-serif', fontSize: '0.75rem', color: '#727878' }}>
            Terakhir diperbarui: 23 April 2026<br/>
            Versi 1.0 (Enterprise Readiness Phase)
          </p>
        </div>

      </main>
    </div>
  )
}
