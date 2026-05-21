# Laporan Code Review: Pembaruan Gejala, Autentikasi WhatsApp & Integrasi Kuesioner QoL (Sprint 1 & Sprint 2)

Dokumen ini menyajikan hasil peninjauan kode mendalam (*Code Review*) untuk perubahan yang dilakukan pada **Sprint 1 (S1)** dan **Sprint 2 (S2)**. Peninjauan difokuskan pada keterbacaan kode, potensi *code smells*, standarisasi gaya visual, efisiensi state, serta rekomendasi pemeliharaan jangka panjang.

---

## 1. Lingkup Code Review

### Sprint 1 (S1): Pembaruan Skema & Pelaporan Gejala MESO
* **Penambahan Gejala Baru:** `constipation` (Sembelit), `alopecia` (Rambut Rontok), dan `insomnia` (Gangguan Tidur) ke dalam skema klinis.
* **Refaktor Input Emoticon Scale:** Penerapan properti `customLabels` dinamis pada komponen `ScaleInputs.tsx` untuk menampilkan label keterangan klinis deskriptif.
* **Perbaikan Skema Visual:** Penyesuaian gradien visual ke standar modern **Tailwind CSS v4** (`bg-linear-to-br` / `bg-linear-to-r`).
* **Kontrol Survei QoL:** Panel kontrol aktivasi `is_qol_active` pada detail pasien di portal Apoteker.

### Sprint 2 (S2): Perombakan Autentikasi & Integrasi Kuesioner QoL
* **Autentikasi Multi-Identifier:** Halaman masuk (`LoginPage.tsx`) dan registrasi (`RegisterPage.tsx`) berbasis nomor WhatsApp & ID Pasien.
* **Halaman Pemulihan Lupa Sandi:** Rombakan total `ForgotPasswordPage.tsx` menjadi multi-step flow interaktif dengan WhatsApp OTP dan email fallback.
* **Profile Modal Mandiri:** Modal detail profil interaktif di `PatientTopNav.tsx` dengan alat penyalin ID Pasien dan input pelengkap nomor WhatsApp.
* **Kuesioner QoL EQ-5D-3L:** Tab kuesioner kualitas hidup standar Indonesia di `ReportForm.tsx`.

---

## 2. Analisis Potensi Code Smell & Rekomendasi

Tabel di bawah ini menguraikan analisis temuan pola kode buruk (*code smell*), tingkat dampaknya, serta rekomendasi tindakan perbaikan:

| Fitur / Komponen | Deskripsi Temuan Code Smell | Kategori / Klasifikasi | Dampak | Rekomendasi Tindakan Perbaikan |
| :--- | :--- | :--- | :--- | :--- |
| **Otentikasi & Profil** | **inline styles yang Ekstensif**<br>Halaman `ForgotPasswordPage.tsx` & `LoginPage.tsx` menggunakan gaya visual inline yang sangat panjang (mencapai ~450 baris) demi mempertahankan estetika Lumina Healing. | *Bloated Component / Hardcoded Layout* | Sedang | Pindahkan inline styles tersebut ke file stylesheet terpisah (`index.css` atau CSS module khusus), atau gunakan utilitas standar Tailwind v4 demi keterbacaan kode React. |
| **Auth & Edge Functions** | **Duplikasi Logika Normalisasi Telepon**<br>Frontend (`PatientTopNav.tsx`, `ForgotPasswordPage.tsx`) dan backend Deno Edge Functions mengulang logika pembersihan non-digit dan penggantian prefix negara `08` -> `628`. | *Code Duplication (Don't Repeat Yourself - DRY)* | Rendah | Buat file helper utilitas bersama (misal `phoneHelper.ts`) untuk digunakan di frontend. Validasi di Deno Edge Function tetap dipertahankan sebagai *double-layer defense*. |
| **Halaman Lupa Sandi** | **Penyajian Masking Email di Frontend**<br>Alamat email lama disamarkan (masking) di frontend menggunakan helper `maskEmail` sebelum ditampilkan sebagai fallback pemulihan. | *Data Leakage Risk (Minor)* | Rendah | Untuk keamanan maksimal di masa depan, proses masking alamat email sebaiknya dilakukan di tingkat backend (database/RPC) sehingga browser tidak pernah menerima string email asli yang belum disamarkan. |
| **Formulir Laporan** | **Pola Penggabungan State Cohesive**<br>Data gejala klinis dan data QoL EQ-5D-3L disimpan secara terpadu di dalam state tunggal `formData` (key `formData.qol`). | *Clean Design Pattern* | **Positif** (Sangat Baik) | Pendekatan ini sangat direkomendasikan karena mencegah *state explosion* (terlalu banyak state reaktif) dan menjamin pengرسalan satu payload terpadu yang aman. |
| **Navigasi Profil** | **Null-safety Guard pada Aksi Asinkron**<br>Menggunakan pengecekan ketat `if (!user?.id)` sebelum melakukan transaksi basis data `supabase.from('profiles').update` di modal profil. | *Defensive Programming* | **Positif** (Sangat Baik) | Mencegah eror kompilasi TypeScript (TS18047) dan mencegah crash runtime apabila sesi token pengguna kedaluwarsa secara tiba-tiba saat modal sedang terbuka. |

---

## 3. Evaluasi Standarisasi Visual & Tailwind CSS v4

Selama pengerjaan Sprint 1 dan Sprint 2, kami melakukan audit visual untuk membersihkan sintaksis CSS yang usang (*deprecated*). Berikut adalah poin-poin standarisasi visual Lumina Healing yang diterapkan:

### A. Migrasi Gradien Latar Belakang
Semua deklarasi gradien diubah secara ketat dari sintaksis Tailwind v3 (`bg-gradient-to-br` / `bg-gradient-to-r`) menjadi standar **Tailwind CSS v4** (`bg-linear-to-br` / `bg-linear-to-r`). Ini memperbaiki rendering warna gradien di browser modern.
```diff
- <div className="bg-gradient-to-br from-primary to-clinical-teal text-white">
+ <div className="bg-linear-to-br from-primary to-clinical-teal text-white">
```

### B. Inspirational & Ruang Relaksasi Card
* **Inspirational Card (`ReportForm.tsx`):** Diperbaiki dari teks putih di atas shadow card yang sulit dibaca (kurang kontras), menjadi gradien teal-klinis yang premium, terbaca sempurna, dan elegan.
* **Ruang Relaksasi (`PatientDashboard.tsx`):** Menghapus penggunaan token warna tidak valid (`primary-fixed-variant`) dan menggantinya dengan paduan gradien harmonis `from-primary to-clinical-teal` untuk mendukung visual terapeutik.

---

## 4. Kesimpulan & Best Practices Untuk Sprint Berikutnya

1. **Defensive Programming:** Pemakaian type guards dan null safety pada API calls Supabase harus terus dipertahankan di modul lain untuk mencegah kegagalan sistem tak terduga (*unexpected system crash*).
2. **Double-Layer Validation:** Pola validasi nomor telepon di frontend dan backend Deno terbukti sangat kokoh menjaga integritas API dari eksploitasi eksternal. Hal ini harus dijadikan standar untuk semua input sensitif berikutnya.
3. **Pemisahan Logika & Tampilan:** Untuk pengerjaan sprint ke depan, sangat disarankan untuk menulis utility styling di file stylesheet kelas utilitas Tailwind v4 alih-alih menumpuk gaya inline style di dalam JSX React guna menjaga pemeliharaan kode (*maintainability*) yang optimal.
