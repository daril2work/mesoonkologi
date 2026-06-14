// ============================================================
// MESO App — Pharmacist Settings (INT-02 Refactored)
// State management dipindahkan ke useSystemSettings hook.
// checkFonnteStatus dipindahkan ke Edge Function (SMELL-05 fix).
// ============================================================
import { useState, useEffect } from 'react'
import PharmacistLayout from '../components/PharmacistLayout'
import { useAuthStore } from '@features/auth/store'
import { toast } from 'react-hot-toast'
import { fonnteService } from '@/services/fonnte.service'
import UserManagementPanel from '../components/UserManagementPanel'
import {
  useSystemSettings,
  useSaveWaSettings,
  useSaveFonnteToken,
  checkFonnteStatusViaServer,
} from '../api/useSystemSettings'

export default function PharmacistSettings() {
  const { user } = useAuthStore()

  // INT-02: State form lokal (terisolasi, bukan seluruh settings)
  const [pharmacistWa, setPharmacistWa] = useState('')
  const [doctorWa, setDoctorWa] = useState('')
  const [fonnteToken, setFonnteToken] = useState('')
  const [showToken, setShowToken] = useState(false)
  const [fonnteStatus, setFonnteStatus] = useState<'loading' | 'connect' | 'disconnect' | 'invalid'>('loading')
  const [isTestingPharma, setIsTestingPharma] = useState(false)
  const [isTestingDoctor, setIsTestingDoctor] = useState(false)
  const [activeTab, setActiveTab] = useState<'profile' | 'users'>('profile')

  // INT-02: Data dari React Query (caching + retry otomatis)
  const { data: settings, isLoading } = useSystemSettings()
  const saveWaSettings = useSaveWaSettings()
  const saveFonnteToken = useSaveFonnteToken()

  // Sync form state saat data dari server tiba
  useEffect(() => {
    if (settings) {
      setPharmacistWa(settings.pharmacistWa)
      setDoctorWa(settings.doctorWa)
    }
  }, [settings])

  // SMELL-05: Cek status Fonnte via Edge Function — token tidak pernah ke browser
  useEffect(() => {
    checkFonnteStatusViaServer().then(setFonnteStatus)
  }, [])

  const handleSaveSettings = () => {
    saveWaSettings.mutate({ pharmacistWa, doctorWa })
  }

  const handleSaveFonnteToken = async () => {
    await saveFonnteToken.mutateAsync(fonnteToken.trim())
    // Re-check status setelah token baru disimpan
    setFonnteStatus('loading')
    const newStatus = await checkFonnteStatusViaServer()
    setFonnteStatus(newStatus)
  }

  const handleTestPharma = async () => {
    if (!pharmacistWa) return toast.error('Nomor WA Apoteker belum diisi')
    setIsTestingPharma(true)
    try {
      await fonnteService.sendMessage({
        target: pharmacistWa,
        message: 'CITO! [TEST] Ini adalah pesan tes untuk Apoteker Jaga dari sistem MESO.'
      })
      toast.success('Pesan tes berhasil dikirim ke Apoteker!')
    } catch (error) {
      toast.error('Gagal mengirim pesan tes ke Apoteker.')
    } finally {
      setIsTestingPharma(false)
    }
  }

  const handleTestDoctor = async () => {
    if (!doctorWa) return toast.error('Nomor WA Dokter belum diisi')
    setIsTestingDoctor(true)
    try {
      await fonnteService.sendMessage({
        target: doctorWa,
        message: 'CITO! [TEST] Ini adalah pesan tes untuk Dokter Jaga dari sistem MESO.'
      })
      toast.success('Pesan tes berhasil dikirim ke Dokter!')
    } catch (error) {
      toast.error('Gagal mengirim pesan tes ke Dokter.')
    } finally {
      setIsTestingDoctor(false)
    }
  }

  return (
    <PharmacistLayout>
      <div className="p-4 sm:p-6 lg:p-10 max-w-4xl mx-auto">
        <header className="mb-6 sm:mb-8">
          <h2 className="headline-font text-3xl sm:text-4xl font-black text-on-surface mb-2">Pengaturan Akun</h2>
          <p className="text-on-surface-variant text-sm sm:text-base font-medium">Kelola informasi profil dan preferensi sistem Anda.</p>
        </header>

        {/* Tab Navigation */}
        <div className="flex border-b border-stone-200 mb-8 overflow-x-auto hide-scrollbar">
          <button 
            onClick={() => setActiveTab('profile')}
            className={`px-6 py-4 text-sm font-bold whitespace-nowrap border-b-2 transition-colors ${activeTab === 'profile' ? 'border-[#1a7a7a] text-[#1a7a7a]' : 'border-transparent text-stone-500 hover:text-stone-700'}`}
          >
            Profil &amp; Integrasi
          </button>
          <button 
            onClick={() => setActiveTab('users')}
            className={`px-6 py-4 text-sm font-bold whitespace-nowrap border-b-2 transition-colors ${activeTab === 'users' ? 'border-[#1a7a7a] text-[#1a7a7a]' : 'border-transparent text-stone-500 hover:text-stone-700'}`}
          >
            Pengelolaan User
          </button>
        </div>

        {activeTab === 'profile' ? (
          <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
            {/* Profil Pengguna */}
            <section className="bg-white p-6 sm:p-8 rounded-2xl sm:rounded-[32px] border border-stone-100 shadow-sm">
              <h3 className="font-bold text-lg mb-6">Profil Pengguna</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-8">
              <div>
                <p className="text-[10px] font-black text-stone-400 uppercase tracking-widest mb-1">Nama Lengkap</p>
                <p className="font-bold text-on-surface">{user?.fullName ?? 'Apoteker'}</p>
              </div>
              <div>
                <p className="text-[10px] font-black text-stone-400 uppercase tracking-widest mb-1">Peran Sistem</p>
                <p className="font-bold text-primary uppercase text-xs">{user?.role}</p>
              </div>
              <div className="col-span-1 sm:col-span-2 pt-4 border-t border-stone-50">
                <p className="text-[10px] font-black text-stone-400 uppercase tracking-widest mb-1">Email</p>
                <p className="font-bold text-on-surface">{user?.email}</p>
              </div>
            </div>
          </section>

          {/* Integrasi Layanan */}
          <section className="bg-white p-6 sm:p-8 rounded-2xl sm:rounded-[32px] border border-stone-100 shadow-sm">
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
                  <div className="flex flex-col sm:flex-row gap-3">
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
                      disabled={saveFonnteToken.isPending}
                      className="bg-[#1a7a7a] hover:bg-[#156363] text-white px-6 py-3 rounded-xl text-xs font-black uppercase tracking-widest transition-all active:scale-95 disabled:opacity-50 shrink-0 w-full sm:w-auto"
                    >
                      {saveFonnteToken.isPending ? 'Menyimpan...' : 'Simpan'}
                    </button>
                  </div>
                  <p className="text-[10px] text-stone-400">
                    * Token disimpan secara aman di database. Status koneksi diverifikasi lewat server (token tidak melintas di browser).
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
                        <div className="flex gap-2">
                          <input 
                            type="text" 
                            placeholder="Contoh: 08123456789"
                            className="w-full bg-white border border-stone-200 rounded-xl px-4 py-3 text-sm font-medium focus:ring-2 ring-primary/20 outline-none"
                            value={pharmacistWa}
                            onChange={(e) => setPharmacistWa(e.target.value)}
                          />
                          <button
                            onClick={handleTestPharma}
                            disabled={isTestingPharma || !pharmacistWa}
                            className="bg-stone-100 hover:bg-stone-200 text-stone-600 px-4 py-3 rounded-xl text-xs font-bold transition-all disabled:opacity-50 whitespace-nowrap"
                          >
                            {isTestingPharma ? '...' : 'Test Kirim'}
                          </button>
                        </div>
                      </div>

                      {/* Dokter WA */}
                      <div className="space-y-2">
                        <label className="text-[10px] font-black text-stone-400 uppercase tracking-widest">Dokter Onkologi In-Charge WA</label>
                        <div className="flex gap-2">
                          <input 
                            type="text" 
                            placeholder="Contoh: 08123456789"
                            className="w-full bg-white border border-stone-200 rounded-xl px-4 py-3 text-sm font-medium focus:ring-2 ring-primary/20 outline-none"
                            value={doctorWa}
                            onChange={(e) => setDoctorWa(e.target.value)}
                          />
                          <button
                            onClick={handleTestDoctor}
                            disabled={isTestingDoctor || !doctorWa}
                            className="bg-stone-100 hover:bg-stone-200 text-stone-600 px-4 py-3 rounded-xl text-xs font-bold transition-all disabled:opacity-50 whitespace-nowrap"
                          >
                            {isTestingDoctor ? '...' : 'Test Kirim'}
                          </button>
                        </div>
                      </div>

                      <div className="col-span-1 md:col-span-2 pt-2 flex justify-end">
                        <button 
                          onClick={handleSaveSettings}
                          disabled={saveWaSettings.isPending}
                          className="bg-[#1a7a7a] hover:bg-[#156363] text-white px-8 py-3 rounded-xl text-xs font-black uppercase tracking-widest shadow-lg shadow-[#1a7a7a]/20 transition-all active:scale-95 disabled:opacity-50 w-full sm:w-auto"
                        >
                          {saveWaSettings.isPending ? 'Menyimpan...' : 'Simpan Petugas Jaga'}
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </section>

          {/* Preferensi Notifikasi */}
          <section className="bg-white p-6 sm:p-8 rounded-2xl sm:rounded-[32px] border border-stone-100 shadow-sm">
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
        ) : (
          <UserManagementPanel />
        )}
      </div>
    </PharmacistLayout>
  )
}
