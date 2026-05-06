# Pelan Implementasi: MESO App — Tahap Akhir (Pharmacist & Refactor)

Rencana ini mencakup penyelesaian Modul Apoteker, migrasi gaya visual ke Tailwind CSS, dan optimasi performa keamanan database.

## 1. Modul Apoteker: Sistem Intervensi & Detail Laporan
**Tujuan:** Memberikan fungsionalitas penuh bagi Apoteker untuk meninjau laporan dan memberikan saran klinis.

### Perubahan Database
- **[NEW] `20260425_setup_interventions.sql`**: Membuat tabel `interventions`.
  - Struktur: `id (UUID)`, `report_id (UUID)`, `pharmacist_id (UUID)`, `advice_given (TEXT)`, `status (ENUM)`, `created_at`.
  - Relasi: FK ke `reports.id` dan `profiles.id`.

### Perubahan Frontend
- **[NEW] `PharmacistReportDetail.tsx`**: Halaman rincian laporan.
  - Menampilkan ringkasan 11 gejala dengan visualisasi keparahan (Grading CTCAE).
  - Panel samping untuk menuliskan intervensi/saran.
- **[MODIFY] `QueueItem.tsx`**: Menambahkan navigasi `onClick` ke halaman detail menggunakan ID laporan.
- **[NEW] `useIntervention.ts`**: Hook mutasi untuk menyimpan data intervensi ke Supabase.

---

## 2. Refaktorisasi Gaya (Tailwind CSS)
**Tujuan:** Mengganti *inline-styles* dengan Tailwind CSS untuk fleksibilitas dan pemeliharaan jangka panjang.

### Konfigurasi Tema
- **[MODIFY] `tailwind.config.js`**: Menambahkan token desain "Editorial Sanctuary".
  - Colors: `meso-teal`, `meso-surface`, `meso-pink`.
  - Spacing: Mengikuti ritme asimetris Stitch.
  - Typography: Plus Jakarta Sans & Inter.

### Migrasi Komponen
- Mengidentifikasi pola berulang (misal: kartu dashboard, tombol premium) dan mengekstraknya menjadi komponen dasar Tailwind.
- Menghapus atribut `style` pada komponen: `PharmacistDashboard`, `PatientDashboard`, `PatientBottomNav`.

---

## 3. Optimasi RLS (JWT Claims)
**Tujuan:** Mempercepat validasi keamanan di Supabase dengan mengurangi *sub-queries* berat.

### Implementasi
- **[NEW] `20260425_optimize_rls.sql`**:
  - Memanfaatkan `auth.jwt() ->> 'role'` untuk pengecekan hak akses.
  - Mengurangi beban database dari O(N) menjadi O(1) pada setiap baris data yang ditarik.
- **Sinkronisasi Trigger**: Memperbarui trigger `handle_new_user` agar menyuntikkan metadata role ke objek `auth.users`.

---

## Rencana Verifikasi

### Pengujian Manual
1. **Flow Apoteker**: Klik laporan di antrean -> Lihat detail gejala -> Kirim saran -> Pastikan status di antrean berubah.
2. **Visual Check**: Memastikan tampilan tidak berubah (atau menjadi lebih baik) setelah migrasi ke Tailwind.
3. **Security Test**: Mencoba akses data dengan user role yang berbeda untuk memastikan RLS baru tetap kokoh.

---

## Pertanyaan Terbuka
- Apakah saran apoteker (intervensi) perlu memicu notifikasi *push* ke pasien?
- Apakah kita perlu menyimpan status "Sudah Dibaca" oleh pasien untuk setiap intervensi?
