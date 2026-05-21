# Catatan Diskusi Arsitektur Pelaporan Pasien

Berikut adalah ringkasan hasil diskusi terkait teknis UI Pelaporan Pasien di aplikasi MESO, yang digunakan sebagai panduan/feedback sebelum melakukan perubahan.

## 1. Mekanisme Alur Pelaporan
Sistem dirancang secara modular dan terintegrasi otomatis:
- **Pengisian Data**: [ReportForm.tsx](file:///d:/MESO-app/src/features/reports/pages/ReportForm.tsx) secara dinamis merender item dari schema terpusat.
- **Pemrosesan**: Input visual (misal skala 0-3) diproses oleh [sentinel.ts](file:///d:/MESO-app/src/utils/sentinel.ts) secara _realtime_ di frontend sebelum dikirim ke API untuk mendeteksi bahaya klinis (Sentinel).
- **Simpan & Notifikasi**: Melalui hook [useSubmitReport.ts](file:///d:/MESO-app/src/features/reports/api/useSubmitReport.ts), data dimasukkan ke Supabase dengan status default `pending`. Jika memicu status Sentinel, API Fonnte otomatis menembak WA notifikasi ke Apoteker Jaga.

## 2. Berkas Terkait Utama (Affected Files)
- **Schema Master**: 
    - `src/features/reports/constants/symptoms.domain.ts`
    - `src/features/reports/constants/symptoms.ui.ts`
- **Komponen Visual**: 
    - `src/features/reports/pages/ReportForm.tsx`
    - `src/features/reports/components/ScaleInputs.tsx`
- **Logika & API**: 
    - `src/utils/sentinel.ts`
    - `src/features/reports/api/useSubmitReport.ts`

## 3. Dampak Penambahan Item Gejala (Low Impact)
**Kesimpulan**: Sangat mudah dilakukan dan berdampak kecil bagi stabilitas sistem.
- Penambahan item (contoh: rambut rontok) **tidak membutuhkan perombakan layout/form**.
- Cukup menambahkan entry baru pada array di `symptoms.domain.ts` dan `symptoms.ui.ts`, UI akan melakukan sinkronisasi otomatis.

## 4. Perubahan Tampilan (Emoticon ke Narasi) terhadap Logic Sentinel
**Kesimpulan**: Tidak mempengaruhi logika backend/perhitungan sama sekali.
- Algoritma Sentinel di `utils/sentinel.ts` hanya membaca angka `0`, `1`, `2`, `3`.
- Apabila UI berubah dari emoticon ke narasi (misal: A. Sedikit, B. Sedang), sistem tetap dapat memetakan pilihan tersebut ke angka numerik di balik layar. Tidak perlu merubah rumus *grade/sentinel*.

## 5. Perubahan Visual Menjadi Accordion
**Kesimpulan**: Tidak signifikan.
- Perubahan murni estetika pada file `ReportForm.tsx`. 
- Sama sekali tidak mengganggu tata kelola basis data, hook pengiriman, maupun validasi klinis.

## 6. Konsistensi Alur Eskalasi (Tetap)
**Kesimpulan**: Sesuai spesifikasi.
- Alur data tetap bermuara pada antrean Apoteker terlebih dahulu sebelum masuk ke eskalasi instruksi Dokter. Data yang disimpan pertama kali berstatus 'pending' untuk peninjauan manual oleh Apoteker.

---
*Dokumen ini dibuat sebagai acuan implementasi masa depan pada repository MESO-app.*
