# Implementation Plan — Pharmacist Dashboard Phase 2 (Remediation, Architecture & Unification)

Rencana ini menggabungkan hasil audit kode terbaru dengan prioritas arsitektur (Sprint P2) untuk menciptakan fondasi aplikasi yang aman, berperforma tinggi, dan konsisten secara visual.

## User Review Required

> [!IMPORTANT]
> **P2-2 (Styling Migration)**: Migrasi Portal Pasien ke Tailwind v4 akan mengubah tampilan secara signifikan agar selaras dengan Portal Apoteker (Premium Sentuhan Nurani).
> **P2-5 (Modularisasi AppRouter)**: Akan ada pemecahan file besar `AppRouter.tsx` menjadi beberapa provider kecil. Ini krusial untuk memperbaiki bug kebocoran cache data.
> **Supabase Realtime**: Pastikan tabel `chat_messages` sudah mengizinkan Broadcast/Realtime di dashboard Supabase.

---

## Proposed Changes

### 1. Keamanan & Proteksi Data (Audit Remediation)

#### [MODIFY] [store.ts](file:///d:/MESO-app/src/features/auth/store.ts)
- **P0**: Perbaiki logic role fallback. Jika profil gagal dimuat, jangan berikan role default `'patient'`. Set user sebagai `null` untuk mencegah akses ilegal.

#### [MODIFY] [usePatientDetail.ts](file:///d:/MESO-app/src/features/reports/api/usePatientDetail.ts) & [usePatientDirectory.ts](file:///d:/MESO-app/src/features/reports/api/usePatientDirectory.ts)
- **SEC-01**: Ganti `.select('*')` dengan pemilihan kolom eksplisit untuk mencegah kebocoran PII (Personally Identifiable Information).

#### [MODIFY] [useSubmitReport.ts](file:///d:/MESO-app/src/features/reports/api/useSubmitReport.ts)
- **SEC-02**: Gunakan pesan error generik di Toast UI dan catat detail teknis hanya di logger internal.

---

### 2. Optimasi Performa & Realtime (P2-5 Refined)

#### [MODIFY] [useChat.ts](file:///d:/MESO-app/src/features/reports/api/useChat.ts)
- **PERF-01**: Migrasi dari Polling (3 detik) ke **Supabase Realtime Subscription**. Chat akan muncul instan tanpa beban request berulang.

#### [NEW] [AppProviders.tsx](file:///d:/MESO-app/src/app/AppProviders.tsx)
- **P2-5**: Ekstraksi `QueryClient` dan `Toaster` dari `AppRouter.tsx`.
- Pastikan `QueryClient` diinisialisasi dengan cara yang aman (clear cache on logout).

#### [MODIFY] [AppRouter.tsx](file:///d:/MESO-app/src/app/AppRouter.tsx)
- **P2-5**: Bersihkan file ini sehingga hanya fokus pada definisi rute. Pindahkan inisialisasi session ke hook `useAppInitializer.ts`.

---

### 3. Standardisasi & Utility (P2-3)

#### [NEW] [reportMapper.ts](file:///d:/MESO-app/src/features/reports/utils/reportMapper.ts)
- **P2-3**: Ekstraksi fungsi `mapEducationRow` dan `mapPatientRow`.
- Gunakan fungsi ini secara konsisten di semua hooks API (`useEducation`, `usePatientDirectory`).

#### [NEW] [constants.ts](file:///d:/MESO-app/src/features/reports/constants/index.ts)
- Sentralisasi `SYMPTOM_KEYS` dan `TRIAGE_STATUS` untuk mencegah typo antar file.

---

### 4. Unifikasi Sistem Desain (P2-2)

#### [MODIFY] Portal Pasien Pages
- **P2-2**: Update `PatientDashboard.tsx`, `ReportForm.tsx`, dan `PatientHistory.tsx`.
- Ganti gaya inline/Tailwind lama dengan token Material 3 yang sudah kita definisikan di `index.css`.
- Pastikan tipografi menggunakan *Plus Jakarta Sans* untuk headline.

#### [DELETE] UI Dead Code
- Hapus sub-komponen lama yang tidak terpakai di `src/features/reports/components/` (`SymptomCardGrid.tsx`, dsb) yang telah digantikan oleh implementasi premium baru.

---

## Verification Plan

### Automated/Technical Tests
- **Network Audit**: Buka DevTools, pastikan request ke Supabase hanya mengambil kolom yang dibutuhkan.
- **Realtime Chat Test**: Kirim pesan di satu browser, pastikan browser lain menerima pesan tanpa refresh/polling.
- **Cache Integrity**: Logout dari akun Apoteker, login ke akun Pasien. Pastikan tidak ada sisa data apoteker di cache.

### Manual Verification
- Cek visual Portal Pasien: Pastikan padding, margin, dan warna sudah seragam dengan Portal Apoteker (Design Unification).
- Verifikasi Triage: Kirim laporan dengan skor tinggi, pastikan indikator di dashboard apoteker berubah menjadi "Butuh Tindakan" secara akurat.
