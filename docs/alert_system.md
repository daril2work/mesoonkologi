# Dokumentasi Sistem Peringatan Klinis (CITO Alert System)

Sistem Peringatan Klinis (CITO Alert System) adalah modul keselamatan pasien (Patient Safety) pada **MESO-app** yang terintegrasi secara dinamis dengan WhatsApp Gateway (Fonnte) untuk memberikan peringatan instan (real-time notifications) kepada tenaga medis jaga yang sedang bertugas (*In-Charge*).

Sistem ini dirancang secara asinkronus (*fire-and-forget*) untuk memastikan peringatan darurat terkirim dengan cepat tanpa memblokir atau menunda alur penyimpanan laporan utama di database.

---

## 🏗️ Arsitektur & Aliran Sistem

```
[ Pasien Kirim Laporan Gejala Kritis ]
               │
               ▼
   [ useSubmitReport.ts ] (Mendeteksi is_sentinel_alert: true)
               │
               ├──────────────────────────────────────────────┐
               ▼ (Utama: Menyimpan Data)                     ▼ (Latar Belakang: WA Alert)
     [ Simpan ke DB ]                                  [ Ambil 'pharmacist_wa' ]
               │                                       [ dari 'system_settings' ]
               ▼                                              │
      (Laporan Tersimpan)                                     ▼
                                                       [ Kirim WhatsApp CITO ]
                                                       [ ke Apoteker Jaga ]
```

---

## 🗄️ Komponen Utama

### 1. Database Konfigurasi (`system_settings`)
Nomor WhatsApp penerima alert tidak ditanam keras (*hardcoded*) di kode sumber ataupun membebani tabel `profiles`. Konfigurasi disimpan secara dinamis pada tabel database pusat bernama `system_settings`:
*   `pharmacist_wa`: Menyimpan nomor WhatsApp aktif Apoteker Jaga.
*   `doctor_wa`: Menyimpan nomor WhatsApp aktif Dokter Onkologi Jaga.

Semua pengguna terautentikasi (termasuk pasien) diberikan hak akses baca (`SELECT`) melalui Row Level Security (RLS) untuk memicu pengiriman pesan, sementara operasi penulisan (`INSERT/UPDATE/DELETE`) hanya diizinkan untuk peran `pharmacist` dan `admin`.

### 2. Antarmuka Pengguna (UI) Pengaturan Jaga
Terintegrasi langsung di halaman **Pengaturan Akun Apoteker** (`PharmacistSettings.tsx`).
*   Apoteker dapat memasukkan nomor ponsel petugas jaga baru kapan saja.
*   Penyimpanan menggunakan metode `.upsert()` Supabase untuk memperbarui data secara terpusat secara real-time.
*   Mendukung format input fleksibel (karakter non-digit otomatis dibersihkan dan diseragamkan dengan kode negara `62` oleh Edge Function).

### 3. Pemicu Alert (Triggers)

| Peristiwa Pemicu | Kriteria Kondisi | Penerima | File Sumber Kode |
| :--- | :--- | :--- | :--- |
| **Laporan Gejala Kritis Baru** | Terdeteksi Sentinel Alert (`is_sentinel_alert: true`): Demam, Sesak Napas, atau gejala klinis $\ge$ Grade 3 | **Apoteker Jaga** (`pharmacist_wa`) | [useSubmitReport.ts](file:///d:/MESO-app/src/features/reports/api/useSubmitReport.ts) |
| **Eskalasi Laporan Medis** | Apoteker menekan tombol eskalasi laporan ke dokter onkologi di portal | **Dokter Jaga** (`doctor_wa`) | [useReportEscalation.ts](file:///d:/MESO-app/src/features/reports/api/useReportEscalation.ts) |

---

## ✉️ Format Pesan WhatsApp

Pesan WhatsApp dirancang ringkas sesuai standar kedaruratan klinis (**CITO**):
> **"CITO! Ada laporan MESO yang perlu anda tindak lanjuti segera!"**

---

## 🛡️ Failsafe & Stabilitas

Sistem peringatan ini didesain dengan prinsip **Failsafe & Non-blocking**:
*   Pengambilan data nomor penerima dan pemanggilan API `fonnteService.sendMessage` dibungkus dalam blok penanganan error `.then().catch()`.
*   Kegagalan dalam pemrosesan alert (seperti API Fonnte mati, token kedaluwarsa, kuota habis, atau gangguan koneksi eksternal) **tidak akan membatalkan transaksi database utama**. Pasien tetap berhasil mencatat gejala mereka, apoteker tetap sukses melakukan eskalasi di portal, dan logger akan mencatat detail galat WhatsApp secara aman untuk diperiksa admin IT SIMRS.
