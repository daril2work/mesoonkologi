// ============================================================
// MESO App — Pharmacist Help & Documentation
// Task: Dokumentasi pengoperasian software (Enhanced Detail View)
// ============================================================
import { useState } from 'react'
import PharmacistLayout from '../components/PharmacistLayout'

interface DocSection {
  id: string
  title: string
  shortDesc: string
  content: string[]
  icon: string
  steps?: string[]
}

export default function PharmacistHelp() {
  const [selectedDocId, setSelectedDocId] = useState<string | null>(null)

  const docs: DocSection[] = [
    {
      id: 'queue',
      title: 'Manajemen Antrean',
      shortDesc: 'Memahami alur kerja pemantauan laporan harian pasien.',
      icon: 'dashboard',
      content: [
        'Dashboard Antrean adalah pusat kendali utama bagi apoteker. Semua laporan efek samping yang dikirimkan pasien akan masuk ke sini secara realtime.',
        'Laporan dikategorikan menjadi dua: Prioritas (Major) dan Rutin (Minor). Laporan Major ditandai dengan aksen merah dan ikon peringatan, menunjukkan adanya gejala sentinel yang memerlukan respon dalam < 30 menit.',
        'Anda dapat menggunakan fitur pencarian untuk menemukan pasien spesifik atau menggunakan filter untuk melihat laporan berdasarkan status eskalasi.'
      ],
      steps: [
        'Pantau laporan masuk pada widget Laporan Prioritas.',
        'Gunakan Filter Laporan untuk menyaring kondisi "Ter-eskalasi" atau "Rutin".',
        'Klik tombol "Tinjau" untuk masuk ke pusat komando klinis pasien.'
      ]
    },
    {
      id: 'intervention',
      title: 'Intervensi Klinis',
      shortDesc: 'Prosedur pemberian saran dan tindakan farmasi.',
      icon: 'clinical_notes',
      content: [
        'Fitur Intervensi memungkinkan apoteker mencatat saran klinis secara formal dalam sistem. Setiap intervensi yang disimpan akan tercatat dalam riwayat medis pasien.',
        'Saran yang diberikan dapat berupa penyesuaian penggunaan obat suportif (seperti antiemetik), saran diet, atau tindakan non-farmakologi lainnya.',
        'Pesan intervensi akan otomatis terkirim ke chat pasien sebagai panduan resmi dari apoteker.'
      ],
      steps: [
        'Buka halaman Detail Pasien.',
        'Klik tombol "Catatan Klinis" di panel kanan.',
        'Tuliskan instruksi yang jelas dan aplikatif bagi pasien.',
        'Simpan untuk mengirimkan instruksi ke aplikasi pasien.'
      ]
    },
    {
      id: 'escalation',
      title: 'Eskalasi Dokter',
      shortDesc: 'Kapan dan bagaimana menghubungkan pasien dengan dokter onkologi.',
      icon: 'report_problem',
      content: [
        'Eskalasi adalah jalur komunikasi darurat untuk kasus yang di luar kewenangan apoteker. Sistem MESO menggunakan standar CTCAE untuk membantu penilaian grade gejala.',
        'Gejala Grade 3 atau 4 (Berat/Kritis) harus segera diekskalasi. Saat tombol eskalasi ditekan, dokter onkologi yang bertugas akan menerima notifikasi instan.',
        'Setelah eskalasi, status laporan akan berubah menjadi "Ter-eskalasi" dan dokter akan mengambil alih instruksi medis.'
      ],
      steps: [
        'Tinjau tren gejala di halaman detail.',
        'Pastikan gejala memenuhi kriteria ambang batas kritis (Grade 4).',
        'Klik tombol besar "Eskalasi ke Dokter Onkologi".',
        'Konfirmasi pada modal pop-up yang muncul.'
      ]
    },
    {
      id: 'export',
      title: 'Export Laporan',
      shortDesc: 'Manajemen data dan pelaporan rekapitulasi.',
      icon: 'download',
      content: [
        'Fitur Export memungkinkan apoteker mengekstraksi data mentah untuk kebutuhan audit atau laporan rutin rumah sakit.',
        'Data diekspor dalam format CSV yang kompatibel dengan Excel. Kolom mencakup identitas pasien, siklus kemoterapi, gejala utama, dan status laporan.',
        'Anda dapat mengekspor rekap harian dari dashboard atau seluruh direktori pasien dari halaman Data Pasien.'
      ],
      steps: [
        'Tentukan data yang ingin diunduh (Antrean atau Direktori).',
        'Gunakan pencarian atau filter jika ingin mengunduh data spesifik.',
        'Klik tombol "Export Data" atau "Export Rekap".',
        'File akan otomatis terunduh ke perangkat Anda.'
      ]
    }
  ]

  const selectedDoc = docs.find(d => d.id === selectedDocId)

  return (
    <PharmacistLayout>
      <div className="p-10 max-w-5xl mx-auto pb-32">
        {selectedDoc ? (
          /* DETAIL VIEW */
          <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
            <button 
              onClick={() => setSelectedDocId(null)}
              className="flex items-center gap-2 text-stone-400 hover:text-primary transition-colors mb-8 group"
            >
              <span className="material-symbols-outlined text-lg group-hover:-translate-x-1 transition-transform">arrow_back</span>
              <span className="text-xs font-black uppercase tracking-widest">Kembali ke Pusat Bantuan</span>
            </button>

            <header className="flex items-start gap-8 mb-12">
              <div className="w-20 h-20 rounded-[28px] bg-primary/5 flex items-center justify-center text-primary shrink-0 border border-primary/10">
                <span className="material-symbols-outlined text-4xl">{selectedDoc.icon}</span>
              </div>
              <div>
                <h2 className="headline-font text-4xl font-black text-on-surface mb-2">{selectedDoc.title}</h2>
                <p className="text-on-surface-variant text-lg font-medium">{selectedDoc.shortDesc}</p>
              </div>
            </header>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
              <div className="lg:col-span-2 space-y-8">
                {selectedDoc.content.map((p, i) => (
                  <p key={i} className="text-stone-600 leading-relaxed text-lg font-medium">{p}</p>
                ))}
                
                <div className="p-10 bg-stone-50 rounded-[40px] border border-stone-100 mt-12">
                  <h4 className="font-bold text-lg mb-6 flex items-center gap-2">
                    <span className="material-symbols-outlined text-primary">lightbulb</span>
                    Panduan Cepat
                  </h4>
                  <ul className="space-y-4">
                    {selectedDoc.steps?.map((step, i) => (
                      <li key={i} className="flex gap-4 items-start">
                        <span className="w-6 h-6 rounded-full bg-white border border-stone-200 flex items-center justify-center text-[10px] font-black text-primary shrink-0 mt-0.5">
                          {i + 1}
                        </span>
                        <span className="text-stone-500 text-sm font-medium">{step}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>

              <aside className="space-y-6">
                <div className="bg-primary text-on-primary p-8 rounded-[32px] shadow-lg shadow-primary/20">
                  <h4 className="font-bold mb-3">Butuh bantuan lain?</h4>
                  <p className="text-xs opacity-80 leading-relaxed mb-6">Hubungi tim IT SIMRS atau Administrator MESO jika Anda mengalami kendala teknis sistem.</p>
                  <button className="w-full py-3 bg-white/20 hover:bg-white/30 rounded-xl font-bold text-xs transition-colors">Hubungi Support</button>
                </div>
                <div className="bg-white p-8 rounded-[32px] border border-stone-100 shadow-sm">
                  <h4 className="font-bold text-sm mb-4">Topik Terkait</h4>
                  <div className="space-y-2">
                    {docs.filter(d => d.id !== selectedDocId).map(d => (
                      <button 
                        key={d.id}
                        onClick={() => setSelectedDocId(d.id)}
                        className="w-full text-left p-3 hover:bg-stone-50 rounded-xl transition-colors flex items-center gap-3 group"
                      >
                        <span className="material-symbols-outlined text-lg text-stone-300 group-hover:text-primary transition-colors">{d.icon}</span>
                        <span className="text-xs font-bold text-stone-600 group-hover:text-on-surface">{d.title}</span>
                      </button>
                    ))}
                  </div>
                </div>
              </aside>
            </div>
          </div>
        ) : (
          /* LIST VIEW */
          <div className="animate-in fade-in duration-500">
            <header className="mb-12">
              <h2 className="headline-font text-5xl font-black text-on-surface mb-3 tracking-tight">Pusat Bantuan</h2>
              <p className="text-on-surface-variant text-xl font-medium">Temukan panduan lengkap pengoperasian portal klinis MESO.</p>
            </header>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {docs.map((doc) => (
                <button 
                  key={doc.id} 
                  onClick={() => setSelectedDocId(doc.id)}
                  className="bg-white p-10 rounded-[40px] shadow-sm border border-stone-100 hover:border-primary/20 hover:shadow-xl hover:shadow-primary/5 transition-all text-left group flex flex-col h-full active:scale-95 duration-300"
                >
                  <div className="w-14 h-14 rounded-2xl bg-stone-50 group-hover:bg-primary/5 flex items-center justify-center mb-8 text-stone-300 group-hover:text-primary transition-colors border border-stone-100 group-hover:border-primary/10">
                    <span className="material-symbols-outlined text-3xl">{doc.icon}</span>
                  </div>
                  <h3 className="font-extrabold text-2xl mb-4 group-hover:text-primary transition-colors">{doc.title}</h3>
                  <p className="text-stone-400 font-medium leading-relaxed mb-8 flex-1">{doc.shortDesc}</p>
                  <div className="flex items-center gap-2 text-primary font-black text-xs uppercase tracking-widest opacity-0 group-hover:opacity-100 transition-all translate-y-2 group-hover:translate-y-0">
                    Baca Selengkapnya
                    <span className="material-symbols-outlined text-sm">arrow_forward</span>
                  </div>
                </button>
              ))}
            </div>

            <section className="mt-20 bg-stone-50 rounded-[48px] p-12 border border-stone-100">
              <div className="flex items-center gap-4 mb-10">
                <div className="w-1.5 h-8 bg-primary rounded-full"></div>
                <h3 className="headline-font text-2xl font-black">Pertanyaan Umum (FAQ)</h3>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
                <div className="space-y-4">
                  <h4 className="font-bold text-lg text-primary">Bagaimana cara menyelesaikan laporan?</h4>
                  <p className="text-sm text-stone-500 leading-relaxed font-medium">Klik laporan di dashboard, tinjau detailnya, berikan intervensi jika perlu, lalu klik "Selesaikan Tanpa Eskalasi" atau "Eskalasi".</p>
                </div>
                <div className="space-y-4">
                  <h4 className="font-bold text-lg text-primary">Kapan saya harus eskalasi?</h4>
                  <p className="text-sm text-stone-500 leading-relaxed font-medium">Eskalasi disarankan untuk gejala dengan Grade 3 ke atas atau jika intervensi farmasi awal tidak memberikan perbaikan signifikan.</p>
                </div>
              </div>
            </section>
          </div>
        )}
      </div>
    </PharmacistLayout>
  )
}
