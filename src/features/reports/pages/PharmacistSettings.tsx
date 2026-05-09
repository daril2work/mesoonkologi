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
  const [fonnteToken, setFonnteToken] = useState('')
  const [showToken, setShowToken] = useState(false)
  const [fonnteStatus, setFonnteStatus] = useState<'loading' | 'connect' | 'disconnect' | 'invalid'>('loading')
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [isSavingToken, setIsSavingToken] = useState(false)

  const checkFonnteStatus = async (tokenToUse: string) => {
    if (!tokenToUse) {
      setFonnteStatus('disconnect')
      return
    }
    setFonnteStatus('loading')
    try {
      const response = await fetch('https://api.fonnte.com/device', {
        method: 'POST',
        headers: {
          'Authorization': tokenToUse
        }
      })
      const data = await response.json()
      if (data && data.status === true) {
        if (data.device_status === 'connect') {
          setFonnteStatus('connect')
        } else {
          setFonnteStatus('disconnect')
        }
      } else {
        setFonnteStatus('invalid')
      }
    } catch (error) {
      console.error('[CheckFonnteStatus Error]', error)
      setFonnteStatus('disconnect')
    }
  }

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
          const tokenSetting = data.find((item) => item.key === 'fonnte_token')
          if (pharmaSetting) setPharmacistWa(pharmaSetting.value)
          if (docSetting) setDoctorWa(docSetting.value)
          if (tokenSetting && tokenSetting.value) {
            setFonnteToken(tokenSetting.value)
            checkFonnteStatus(tokenSetting.value)
          } else {
            setFonnteStatus('disconnect')
          }
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

  // Handle saving Fonnte API Token
  const handleSaveFonnteToken = async () => {
    setIsSavingToken(true)
    try {
      const { error } = await supabase
        .from('system_settings')
        .upsert([
          { key: 'fonnte_token', value: fonnteToken.trim() }
        ])

      if (error) throw error
      
      toast.success('Token API Fonnte berhasil disimpan!', {
        icon: '🔑',
        style: { border: '1px solid #e5f9f5' }
      })
      // Re-check status with the newly saved token
      checkFonnteStatus(fonnteToken.trim())
    } catch (error) {
      console.error('[SaveToken Error]', error)
      toast.error('Gagal menyimpan Token Fonnte.')
    } finally {
      setIsSavingToken(false)
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
                    <div className="flex items-center gap-1.5 mt-0.5">
                      <span className="text-[10px] text-emerald-800 font-black uppercase tracking-widest">Status:</span>
                      {fonnteStatus === 'loading' && (
                        <span className="text-[10px] font-bold text-amber-600 bg-amber-50 px-2 py-0.5 rounded-full uppercase tracking-wider animate-pulse">Memeriksa...</span>
                      )}
                      {fonnteStatus === 'connect' && (
                        <span className="text-[10px] font-bold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-full uppercase tracking-wider">Terhubung (Aktif)</span>
                      )}
                      {fonnteStatus === 'disconnect' && (
                        <span className="text-[10px] font-bold text-rose-700 bg-rose-50 px-2 py-0.5 rounded-full uppercase tracking-wider">Terputus / Kosong</span>
                      )}
                      {fonnteStatus === 'invalid' && (
                        <span className="text-[10px] font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded-full uppercase tracking-wider">Token Tidak Valid</span>
                      )}
                    </div>
                  </div>
                </div>
                
                {/* Fonnte API Token Input */}
                <div className="space-y-3 pt-2 border-t border-emerald-100/40">
                  <label className="text-[10px] font-black text-stone-400 uppercase tracking-widest">Fonnte API Token</label>
                  <div className="flex gap-3">
                    <div className="relative flex-grow">
                      <input 
                        type={showToken ? "text" : "password"} 
                        placeholder="Masukkan Token Fonnte Anda"
                        className="w-full bg-white border border-stone-200 rounded-xl pl-4 pr-12 py-3 text-sm font-medium focus:ring-2 ring-primary/20 outline-none"
                        value={fonnteToken}
                        onChange={(e) => setFonnteToken(e.target.value)}
                      />
                      <button
                        type="button"
                        onClick={() => setShowToken(!showToken)}
                        className="absolute right-4 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-600 transition-colors flex items-center"
                        title={showToken ? "Sembunyikan" : "Tampilkan"}
                      >
                        <span className="material-symbols-outlined text-lg leading-none">
                          {showToken ? "visibility_off" : "visibility"}
                        </span>
                      </button>
                    </div>
                    <button 
                      onClick={handleSaveFonnteToken}
                      disabled={isSavingToken}
                      className="bg-[#1a7a7a] hover:bg-[#156363] text-white px-6 py-3 rounded-xl text-xs font-black uppercase tracking-widest transition-all active:scale-95 disabled:opacity-50 shrink-0"
                    >
                      {isSavingToken ? 'Menyimpan...' : 'Simpan'}
                    </button>
                  </div>
                  <p className="text-[10px] text-stone-400">
                    * Token disimpan secara aman di dalam database untuk pemicu notifikasi otomatis.
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
