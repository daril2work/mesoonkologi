// ============================================================
// MESO App — Pharmacist Settings
// ============================================================
import { useState, useEffect } from 'react'
import PharmacistLayout from '../components/PharmacistLayout'
import { useAuthStore } from '@features/auth/store'
import { supabase } from '@lib/supabase'
import { toast } from 'react-hot-toast'

export default function PharmacistSettings() {
  const { user } = useAuthStore()
  const [pharmacistWa, setPharmacistWa] = useState('')
  const [doctorWa, setDoctorWa] = useState('')
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)

  // Fetch current WhatsApp settings from Supabase
  useEffect(() => {
    async function loadSettings() {
      try {
        const { data, error } = await supabase
          .from('system_settings')
          .select('*')

        if (error) throw error

        if (data) {
          const pharmaSetting = data.find((item) => item.key === 'pharmacist_wa')
          const docSetting = data.find((item) => item.key === 'doctor_wa')
          if (pharmaSetting) setPharmacistWa(pharmaSetting.value)
          if (docSetting) setDoctorWa(docSetting.value)
        }
      } catch (error) {
        console.error('[LoadSettings Error]', error)
      } finally {
        setIsLoading(false)
      }
    }
    loadSettings()
  }, [])

  // Handle saving the dynamic WhatsApp settings
  const handleSaveSettings = async () => {
    setIsSaving(true)
    try {
      const { error } = await supabase
        .from('system_settings')
        .upsert([
          { key: 'pharmacist_wa', value: pharmacistWa.trim() },
          { key: 'doctor_wa', value: doctorWa.trim() }
        ])

      if (error) throw error
      
      toast.success('Nomor WhatsApp petugas in-charge berhasil disimpan!', {
        icon: '✅',
        style: { border: '1px solid #e5f9f5' }
      })
    } catch (error) {
      console.error('[SaveSettings Error]', error)
      toast.error('Gagal menyimpan pengaturan WhatsApp.')
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <PharmacistLayout>
      <div className="p-10 max-w-4xl mx-auto">
        <header className="mb-12">
          <h2 className="headline-font text-4xl font-black text-on-surface mb-2">Pengaturan Akun</h2>
          <p className="text-on-surface-variant font-medium">Kelola informasi profil dan preferensi sistem Anda.</p>
        </header>

        <div className="space-y-8">
          {/* Profil Pengguna */}
          <section className="bg-white p-8 rounded-[32px] border border-stone-100 shadow-sm">
            <h3 className="font-bold text-lg mb-6">Profil Pengguna</h3>
            <div className="grid grid-cols-2 gap-8">
              <div>
                <p className="text-[10px] font-black text-stone-400 uppercase tracking-widest mb-1">Nama Lengkap</p>
                <p className="font-bold text-on-surface">{user?.fullName ?? 'Apoteker'}</p>
              </div>
              <div>
                <p className="text-[10px] font-black text-stone-400 uppercase tracking-widest mb-1">Peran Sistem</p>
                <p className="font-bold text-primary uppercase text-xs">{user?.role}</p>
              </div>
              <div className="col-span-2 pt-4 border-t border-stone-50">
                <p className="text-[10px] font-black text-stone-400 uppercase tracking-widest mb-1">Email</p>
                <p className="font-bold text-on-surface">{user?.email}</p>
              </div>
            </div>
          </section>

          {/* Integrasi Layanan */}
          <section className="bg-white p-8 rounded-[32px] border border-stone-100 shadow-sm">
            <h3 className="font-bold text-lg mb-2">Integrasi Layanan</h3>
            <p className="text-xs text-stone-500 mb-6">Kelola koneksi dengan pihak ketiga untuk fitur otomatisasi.</p>
            
            <div className="space-y-6">
              <div className="p-6 bg-emerald-50/50 border border-emerald-100 rounded-2xl space-y-6">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-emerald-500 rounded-xl flex items-center justify-center text-white">
                    <span className="material-symbols-outlined">chat_bubble</span>
                  </div>
                  <div>
                    <h4 className="font-bold text-emerald-900 text-sm">Fonnte WhatsApp Gateway</h4>
                    <p className="text-[10px] text-emerald-600 font-bold uppercase tracking-widest">Status: Terhubung</p>
                  </div>
                </div>
                
                {/* Fonnte API Token Input (Readonly representation as per original) */}
                <div className="space-y-3 pt-2 border-t border-emerald-100/40">
                  <label className="text-[10px] font-black text-stone-400 uppercase tracking-widest">Fonnte API Token</label>
                  <div className="flex gap-3">
                    <input 
                      type="password" 
                      className="flex-grow bg-white border border-stone-200 rounded-xl px-4 py-3 text-sm font-medium focus:ring-2 ring-primary/20 outline-none"
                      defaultValue="**************************"
                      disabled
                    />
                    <button 
                      disabled
                      className="bg-stone-50 border border-stone-200 px-6 py-3 rounded-xl text-xs font-black uppercase tracking-widest text-stone-400 cursor-not-allowed"
                    >
                      Simpan
                    </button>
                  </div>
                  <p className="text-[10px] text-stone-400">
                    * Token dikonfigurasi secara aman melalui variabel lingkungan Supabase Edge Function.
                  </p>
                </div>

                {/* Dynamic WhatsApp In-Charge Numbers */}
                <div className="space-y-4 pt-6 border-t border-emerald-100/50">
                  <h5 className="font-bold text-xs text-emerald-900 uppercase tracking-wider">Nomor WA Petugas Jaga (In-Charge)</h5>
                  <p className="text-[11px] text-emerald-700/80 leading-relaxed">
                    Masukkan nomor WhatsApp penerima alert darurat. Sistem akan otomatis mengirim notifikasi instan apabila terdeteksi laporan krisis atau eskalasi medis.
                  </p>

                  {isLoading ? (
                    <div className="py-4 text-center text-xs text-stone-400 animate-pulse">
                      Memuat nomor petugas jaga...
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {/* Apoteker WA */}
                      <div className="space-y-2">
                        <label className="text-[10px] font-black text-stone-400 uppercase tracking-widest">Apoteker In-Charge WA</label>
                        <input 
                          type="text" 
                          placeholder="Contoh: 08123456789"
                          className="w-full bg-white border border-stone-200 rounded-xl px-4 py-3 text-sm font-medium focus:ring-2 ring-primary/20 outline-none"
                          value={pharmacistWa}
                          onChange={(e) => setPharmacistWa(e.target.value)}
                        />
                      </div>

                      {/* Dokter WA */}
                      <div className="space-y-2">
                        <label className="text-[10px] font-black text-stone-400 uppercase tracking-widest">Dokter Onkologi In-Charge WA</label>
                        <input 
                          type="text" 
                          placeholder="Contoh: 08123456789"
                          className="w-full bg-white border border-stone-200 rounded-xl px-4 py-3 text-sm font-medium focus:ring-2 ring-primary/20 outline-none"
                          value={doctorWa}
                          onChange={(e) => setDoctorWa(e.target.value)}
                        />
                      </div>

                      <div className="col-span-1 md:col-span-2 pt-2 flex justify-end">
                        <button 
                          onClick={handleSaveSettings}
                          disabled={isSaving}
                          className="bg-[#1a7a7a] hover:bg-[#156363] text-white px-8 py-3 rounded-xl text-xs font-black uppercase tracking-widest shadow-lg shadow-[#1a7a7a]/20 transition-all active:scale-95 disabled:opacity-50"
                        >
                          {isSaving ? 'Menyimpan...' : 'Simpan Petugas Jaga'}
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </section>

          {/* Preferensi Notifikasi */}
          <section className="bg-white p-8 rounded-[32px] border border-stone-100 shadow-sm">
            <h3 className="font-bold text-lg mb-6">Preferensi Notifikasi</h3>
            <div className="flex items-center justify-between">
              <div>
                <p className="font-bold text-sm">Notifikasi Realtime</p>
                <p className="text-xs text-stone-500">Dapatkan peringatan instan saat ada laporan baru masuk.</p>
              </div>
              <div className="w-12 h-6 bg-[#1a7a7a] rounded-full relative flex items-center px-1 cursor-pointer">
                <div className="w-4 h-4 bg-white rounded-full absolute right-1 shadow-sm"></div>
              </div>
            </div>
          </section>
        </div>
      </div>
    </PharmacistLayout>
  )
}
