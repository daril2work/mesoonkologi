// ============================================================
// MESO App — Pharmacist Settings
// ============================================================
import PharmacistLayout from '../components/PharmacistLayout'
import { useAuthStore } from '@features/auth/store'

export default function PharmacistSettings() {
  const { user } = useAuthStore()

  return (
    <PharmacistLayout>
      <div className="p-10 max-w-4xl mx-auto">
        <header className="mb-12">
          <h2 className="headline-font text-4xl font-black text-on-surface mb-2">Pengaturan Akun</h2>
          <p className="text-on-surface-variant font-medium">Kelola informasi profil dan preferensi sistem Anda.</p>
        </header>

        <div className="space-y-8">
          <section className="bg-white p-8 rounded-[32px] border border-stone-100 shadow-sm">
            <h3 className="font-bold text-lg mb-6">Profil Pengguna</h3>
            <div className="grid grid-cols-2 gap-8">
              <div>
                <p className="text-[10px] font-black text-stone-400 uppercase tracking-widest mb-1">Nama Lengkap</p>
                <p className="font-bold text-on-surface">{user?.fullName}</p>
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

          <section className="bg-white p-8 rounded-[32px] border border-stone-100 shadow-sm">
            <h3 className="font-bold text-lg mb-2">Integrasi Layanan</h3>
            <p className="text-xs text-stone-500 mb-6">Kelola koneksi dengan pihak ketiga untuk fitur otomatisasi.</p>
            
            <div className="space-y-6">
              <div className="p-6 bg-emerald-50/50 border border-emerald-100 rounded-2xl">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 bg-emerald-500 rounded-xl flex items-center justify-center text-white">
                    <span className="material-symbols-outlined">chat_bubble</span>
                  </div>
                  <div>
                    <h4 className="font-bold text-emerald-900 text-sm">Fonnte WhatsApp Gateway</h4>
                    <p className="text-[10px] text-emerald-600 font-bold uppercase tracking-widest">Status: Terhubung</p>
                  </div>
                </div>
                
                <div className="space-y-3">
                  <label className="text-[10px] font-black text-stone-400 uppercase tracking-widest">Fonnte API Token</label>
                  <div className="flex gap-3">
                    <input 
                      type="password" 
                      className="flex-grow bg-white border border-stone-200 rounded-xl px-4 py-3 text-sm font-medium focus:ring-2 ring-primary/20 outline-none"
                      defaultValue="**************************"
                    />
                    <button className="bg-white border border-stone-200 px-6 py-3 rounded-xl text-xs font-black uppercase tracking-widest text-stone-600 hover:bg-stone-50 transition-colors">
                      Simpan
                    </button>
                  </div>
                  <p className="text-[10px] text-stone-400">
                    * Token ini digunakan untuk mengirimkan reminder otomatis H-1 kepada pasien.
                  </p>
                </div>
              </div>
            </div>
          </section>

          <section className="bg-white p-8 rounded-[32px] border border-stone-100 shadow-sm">
            <h3 className="font-bold text-lg mb-6">Preferensi Notifikasi</h3>
            <div className="flex items-center justify-between">
              <div>
                <p className="font-bold text-sm">Notifikasi Realtime</p>
                <p className="text-xs text-stone-500">Dapatkan peringatan instan saat ada laporan baru masuk.</p>
              </div>
              <div className="w-12 h-6 bg-primary rounded-full relative flex items-center px-1">
                <div className="w-4 h-4 bg-white rounded-full absolute right-1 shadow-sm"></div>
              </div>
            </div>
          </section>
        </div>
      </div>
    </PharmacistLayout>
  )
}
