# Implementasi Fase 2: Backend & Authentication

Fase ini akan menyambungkan tampilan `LoginPage` yang sudah kita bangun dengan backend nyata menggunakan *Supabase Authentication* dan manajemen sesi menggunakan *Zustand*.

## User Review Required

> [!IMPORTANT]
> **Tugas Manual Untuk Anda (Setelah Rencana Ini Disetujui):**
> 1. Setup proyek di [Supabase Dashboard](https://supabase.com).
> 2. Buat file `.env` di root folder MESO-app (copy dari `.env.example`).
> 3. Isi variabel `VITE_SUPABASE_URL` dan `VITE_SUPABASE_ANON_KEY` sesuai dashboard proyek Anda.

---

## Proposed Changes

### Skema Database & Keamanan

#### [NEW] [setup_auth.sql](file:///d:/MESO-app/supabase/migrations/20260416_setup_auth.sql)
Membuat script SQL yang akan Anda jalankan di SQL Editor Supabase untuk:
1.  Membuat tabel `profiles` (mengacu ke tipe data `PatientProfile` / `MedicProfile` yang dikonsolidasikan).
2.  Membuat *Database Trigger* `on_auth_user_created` yang akan otomatis membuat entry di tabel profile saat user baru mendaftar (via Auth).
3.  Mengaktifkan aturan RLS (Row Level Security) agar pasien hanya bisa melihat/mengedit profilnya sendiri.

---

### Global State Management

#### [NEW] authStore.ts
Lokasi: `src/features/auth/store.ts`
Zustand store untuk mengelola:
-   `user`: Data *AuthUser* saat ini.
-   `session`: Sesi aktif dari Supabase.
-   `isLoading`: Loading state umum.
-   Action `setSession()`, `login()`, dan `logout()`.

---

### Integrasi UI

#### [MODIFY] [LoginPage.tsx](file:///d:/MESO-app/src/features/auth/pages/LoginPage.tsx)
-   Membuang fungsi *mock/dummy* login.
-   Menyambungkan input email & password ke fungsi `useAuthStore().login`.
-   Modifikasi tampilan `disabled` dan `isLoading` saat menunggu response API Supabase.
-   Redirect otomatis ke halaman utama sesuai *role* user via `react-router-dom`.

#### [MODIFY] [AppRouter.tsx](file:///d:/MESO-app/src/app/AppRouter.tsx)
-   Menambahkan komponen `<ProtectedRoute>` yang akan mencegah *guest* mengakses dashboard.
-   Menambahkan *auth listener* global yang memantau perubahan status sesi Supabase (login/logout/token refresh).

---

## Open Questions

Ada dua role tambahan di sistem ini, **apakah Anda ingin user mendaftar mandiri (Sign up)** atau akun-akun ini akan **ditambahkan oleh admin rumah sakit**? 
- Jika didaftarkan oleh admin, maka *halaman Register tidak perlu kita kembangkan*, pasien cukup di-generate akunnya saat di rumah sakit lalu dikirimkan *default password*.

## Verification Plan

### Automated / Manual Test
-   [ ] Validasi di Supabase Dashboard: Eksekusi SQL Trigger berjalan tanpa error.
-   [ ] Verifikasi *App Network*: Request POST ke `https://<proyek>.supabase.co/auth/v1/token` berhasil mengembalikan 200 OK.
-   [ ] Verifikasi Router: Masuk ke halaman `/patient/dashboard` tanpa login akan ditendang kembali ke `/login`.
-   [ ] Verifikasi `LocalStorage`: Token JWT berhasil tersimpan di browser via provider sesi Supabase.
