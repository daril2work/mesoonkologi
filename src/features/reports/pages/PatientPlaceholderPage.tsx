import PatientLayout from '../components/PatientLayout'
import { Clock } from 'lucide-react'

export default function PatientPlaceholderPage() {
  return (
    <PatientLayout>
      <div style={{ 
        display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
        height: '60vh', textAlign: 'center', padding: '24px'
      }}>
        <div style={{ background: '#e5f9f5', padding: '24px', borderRadius: '50%', color: '#046b5e', marginBottom: '24px' }}>
          <Clock size={48} />
        </div>
        <h2 style={{ fontFamily: '"Plus Jakarta Sans", sans-serif', fontSize: '1.5rem', fontWeight: 700, color: '#1b1c1c', margin: 0 }}>
          Fitur Segera Hadir
        </h2>
        <p style={{ fontFamily: '"Inter", sans-serif', fontSize: '1rem', color: '#727878', marginTop: '12px', lineHeight: 1.6 }}>
          Halaman ini sedang dalam tahap pengembangan oleh tim teknis kami untuk memberikan pengalaman terbaik bagi Anda.
        </p>
      </div>
    </PatientLayout>
  )
}
