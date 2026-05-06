# 🔍 Audit Code — MESO Pharmacist Dashboard & Clinical Portal

Audit dilakukan pada: `2026-04-25`  
Scope: `src/features/reports/` & `src/lib/supabase.ts`  
Status: **CRITICAL ATTENTION REQUIRED**

---

## 1. Security & Vulnerability (🔴 Kritis)

### [SEC-01] Kebocoran Data Sensitif (`select('*')`)
**File**: `usePatientDetail.ts`, `usePatientDirectory.ts`
- **Masalah**: Penggunaan `select('*')` menarik seluruh kolom dari tabel `profiles`.
- **Risiko**: Data sensitif seperti nomor telepon, email, atau data internal lainnya terkirim ke client-side padahal tidak ditampilkan di UI.
- **Rekomendasi**: Spesifikasikan kolom yang dibutuhkan: `.select('id, full_name, cancer_site, current_cycle')`.

### [SEC-02] Ekspos Error Internal Supabase
**File**: `useSubmitReport.ts` (Baris 49)
- **Masalah**: `toast.error(error.message)` menampilkan pesan error mentah dari database.
- **Risiko**: Memberikan petunjuk struktur database (nama kolom/tabel) kepada pihak luar jika terjadi error.
- **Rekomendasi**: Gunakan pesan generik untuk user dan log detailnya ke `logger.ts`.

### [SEC-03] Role Fallback yang Berbahaya
**File**: `auth/store.ts` (Baris 47)
- **Masalah**: Default role diatur ke `'patient'` jika profil gagal dimuat.
- **Risiko**: Bypass otorisasi; user dengan role tinggi (pharmacist/admin) bisa masuk dengan hak akses yang salah jika koneksi terganggu.
- **Rekomendasi**: Jika profil null, paksa logout atau set sebagai unauthenticated.

---

## 2. Performa & Skalabilitas (🟠 Tinggi)

### [PERF-01] Chat Polling (DoS Potential)
**File**: `useChat.ts` (Baris 33)
- **Masalah**: Polling setiap 3 detik via `refetchInterval`.
- **Risiko**: Menghabiskan kuota request Supabase dengan cepat dan membebani browser client.
- **Rekomendasi**: Ganti dengan **Supabase Realtime Subscription** (WebSockets).

### [PERF-02] N+1 Client-Side Filtering
**File**: `usePatientDirectory.ts`
- **Masalah**: Menarik *semua* laporan lalu difilter di browser menggunakan `.find()`.
- **Risiko**: Performa melambat drastis seiring bertambahnya jumlah pasien dan laporan.
- **Rekomendasi**: Gunakan SQL JOIN atau View di Supabase untuk mendapatkan laporan terbaru per pasien dalam satu request.

---

## 3. Hardcoded & Code Smells (🟡 Menengah)

### [HC-01] Mock Data dalam Production Hook
**File**: `usePatientDirectory.ts` (Baris 74-75)
- **Masalah**: Angka `156` dan `892` tertulis keras (*hardcoded*) di dalam hook API.
- **Dampak**: Dashboard tidak akan pernah menampilkan angka riil dari database.

### [HC-02] Inkonsistensi Key Gejala
**File**: `usePatientDetail.ts`
- **Masalah**: Key gejala menggunakan string Bahasa Indonesia manual: `symptoms['Mual & Muntah']`.
- **Dampak**: Sangat rentan terhadap typo dan perubahan skema database.
- **Rekomendasi**: Gunakan konstanta atau Enum (misal: `SYMPTOM_KEYS.NAUSEA`).

---

## 4. Architectural & UI (⚪ Rendah)

### [UI-01] Duplikasi Header
**File**: `PharmacistPatientDetail.tsx`
- **Masalah**: Komponen ini merender header-nya sendiri, sementara `PharmacistLayout` juga merender header.
- **Dampak**: Terjadi penumpukan layout atau redundansi kode navigasi.

### [UI-02] Dead Code Sub-komponen
**File**: `src/features/reports/components/`
- **Masalah**: `SymptomCardGrid`, `SymptomTrendChart`, dan `TriagePanel` versi lama masih ada tapi tidak lagi digunakan oleh halaman Detail Pasien yang baru.
- **Rekomendasi**: Bersihkan file yang tidak terpakai atau integrasikan kembali secara modular.

---

## Prioritas Perbaikan (Roadmap)

1.  **Segera (P0)**: SEC-01 (Data Leak) & PERF-01 (Realtime Chat).
2.  **Penting (P1)**: HC-01 (Real Data Integration) & PERF-02 (Database Optimization).
3.  **Maintenance (P2)**: UI Clean-up & Sub-component Refactoring.
