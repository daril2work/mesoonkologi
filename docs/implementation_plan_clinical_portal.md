# Pelan Implementasi: Clinical Portal (Sentuhan Nurani)

Berdasarkan desain Stitch terbaru, kita akan merombak Modul Apoteker menjadi portal klinis yang komprehensif. Rencana ini menangani kompleksitas teknis pada performa RLS, konsistensi desain, dan logika triase klinis.

## 1. Fondasi UI & Arsitektur (Layout & Tokens)
**Tujuan:** Memastikan konsistensi visual "Sentuhan Nurani" di seluruh halaman.

- **[MODIFY] `tailwind.config.js`**: Menambahkan preset warna:
  - `clinical-teal`: `#046b5e` (Aksi Utama)
  - `clinical-surface`: `#f6f3f2` (Background)
  - `clinical-card`: `#ffffff` (Container)
  - `clinical-danger`: `#b90c55` (Prioritas/Tindakan)
- **[MODIFY] `PharmacistLayout.tsx`**: Update Sidebar dengan tipografi *editorial* dan TopBar yang menyertakan bar pencarian global pasien.

---

## 2. Fitur Utama: Antrean Laporan Pasien
**Tujuan:** Membedah laporan harian ke dalam dua kategori urgensi.

- **Laporan Prioritas (Major)**: Kartu lebar dengan foto profil besar, status siklus, dan label "BERAT" yang mencolok.
- **Laporan Rutin (Minor)**: Tabel ringkas untuk gejala ringan.
- **Tips Respon Empati**: Blok saran dinamis di bagian bawah dashboard yang berubah berdasarkan data antrean.

---

## 3. Fitur Utama: Direktori Data Pasien
**Tujuan:** Manajemen populasi pasien secara efisien.

- **KPI Cards**: Agregasi *real-time* untuk "Total Pasien", "Status Kritis", "Jadwal Minggu Ini", dan "Edukasi Selesai".
- **DataTable**: Daftar pasien dengan indikator status berwarna (Stabil, Butuh Tindakan, Observasi).
- **Export Data**: Integrasi fungsi CSV/Excel untuk pelaporan rumah sakit.

---

## 4. Fitur Utama: Detail Pasien & Intervensi
**Tujuan:** Pusat komando klinis per individu pasien.

- **Visual Dashboard**:
  - **Daily 'Klik-Klik'**: Grid kartu gejala harian (Mual, Nyeri, Lelah, Nafsu Makan).
  - **Tren Gejala**: Bar chart (menggunakan Recharts) untuk melihat progres keparahan 4 laporan terakhir.
- **Discussion Panel**: Antarmuka chat *real-time* di sisi kanan untuk diskusi langsung.
- **Clinical Actions**: Tombol eskalasi ke Onkologi (Merah) dan catatan klinis.
- **Triase Otomatis**: Kotak analisis yang menjelaskan grade CTCAE dan rekomendasi penanganan.

---

## 5. Manajemen Edukasi & Jadwal
**Tujuan:** Kurasi konten dan pengaturan logistik kemoterapi.

- **Education Hub**: Galeri materi dengan status "Total Konten" dan filter kategori.
- **Clinical Schedule**: 
  - **Monthly Calendar**: Menampilkan titik-titik jadwal kemoterapi.
  - **Daily Timeline**: Daftar urutan pasien hari ini di sisi kanan (Bed/Slot info).

---

## Solusi Kesulitan Teknis (Analysis)

### A. Optimasi Performa (N+1 RLS)
Kita akan bermigrasi dari `EXISTS profiles` ke **JWT Role Claims**.
- **Langkah**: Memperbarui migrasi SQL untuk mengecek `auth.jwt() ->> 'role'` sehingga validasi keamanan dilakukan di lapisan API tanpa membebani database setiap kali baris data dibaca.

### B. Akurasi Triase (CTCAE Grading)
Untuk memastikan status "Butuh Tindakan" (Merah) akurat:
- **Langkah**: Memperkuat fungsi `calculateGrade` di `sentinel.ts` agar menangani kombinasi gejala sentinel (Demam + Sesak) secara otomatis sebagai Major Alert.

### C. Konsistensi Styling (Tailwind Migration)
Menghilangkan *inline styles* yang menyulitkan *maintenance*.
- **Langkah**: Menggunakan `@apply` untuk pola desain Stitch yang berulang agar kode JSX tetap bersih.

---

## Verification Plan

### Automated
- Unit test untuk fungsi filter antrean (Major vs Minor).
- Integrasi test untuk pengiriman pesan chat antara apoteker dan pasien.

### Manual
- Memastikan transisi antar menu (Antrean -> Detail Pasien) terasa mulus dan data sinkron.
- Verifikasi tampilan pada resolusi monitor standar (1920x1080) mengingat dashboard portal sangat padat informasi.

---

## Keputusan Desain Final
- **Jadwal Klinis**: Tidak menggunakan fitur Drag-and-Drop. Pemindahan jadwal dilakukan secara manual via form sederhana untuk menghindari *over-engineering*.
- **Manajemen Edukasi**: Tidak ada fitur *Direct Upload* video ke Supabase. Sistem hanya akan menyimpan URL/Embed link (YouTube/Lainnya) untuk menjaga performa storage.
