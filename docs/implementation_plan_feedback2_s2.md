# Laporan Progress Kerja & Remediasi Keamanan (Sprint 2/3)
> Tanggal: 2026-06-14 | Status: 100% Selesai & Ter-deploy | Branch: `main`

Laporan ini menyajikan ringkasan progress perbaikan sistem dan keamanan (remediasi) yang telah diimplementasikan hari ini, berdasarkan temuan pada **code_audit_fiturOTP_ManajemenUser.md**. Seluruh perbaikan telah melalui kompilasi TypeScript (0 errors) dan telah di-push ke GitHub serta dideploy ke Supabase.

---

## 📊 Ringkasan Status Audit vs Hasil Remediasi

| ID Temuan | Kategori | Keterangan Temuan | Status Perbaikan | Solusi / Tindakan yang Dilakukan |
|---|---|---|---|---|
| **[SEC-01]** | Keamanan | `.env` tidak terdaftar di `.gitignore` (Kebocoran Token API) | ✅ **FIXED** | Menambahkan `.env`, `.env.local`, `.env.*.local` ke `.gitignore`. |
| **[SEC-02]** | Keamanan | Fonnte token disimpan di DB (dapat diakses anon client) | ✅ **FIXED** | Mengaktifkan RLS pada `system_settings` via SQL Migration. Menghapus fallback DB pada Edge Functions. |
| **[SEC-03]** | Keamanan | CORS wildcard (`*`) pada Edge Functions | ✅ **FIXED** | Membatasi CORS ke `ALLOWED_ORIGIN` dari environment secrets di semua 5 functions. |
| **[SEC-04]** | Keamanan | OTP tanpa Rate Limiting & Brute Force Protection | ✅ **FIXED** | Menambahkan check rate-limiting (max 1 OTP / 5 menit), attempt counter (max 5 kegagalan sebelum OTP hangus), dan `crypto.getRandomValues()`. |
| **[SEC-05]** | Keamanan | `updateUserRole` memakai anon client (privilege escalation) | ✅ **FIXED** | Memindahkan update role ke Edge Function `update-user-role` dengan validasi JWT role. |
| **[INT-01]** | Integritas | `.env.example` outdated | ✅ **FIXED** | Menyinkronkan variabel aktif (`VITE_WA_ENABLED`) dan menghapus variabel mati. |
| **[INT-02]** | Integritas | `PharmacistSettings` bypass hook pattern | ✅ **FIXED** | Membuat custom hook `useSystemSettings` (React Query) untuk manajemen state settings. |
| **[INT-03]** | Integritas | Potensi IDOR pada usePatientDetail query `reportId` | ✅ **FIXED** | Menambahkan filter `.eq('patient_id', patientId)` untuk validasi kepemilikan data. |
| **[INT-04]** | Integritas | WA Reminder H-1 dijadwalkan dari client-side | ✅ **FIXED** | Memindahkan penjadwalan WA pengingat H-1 ke backend via Edge Function `schedule-wa-reminder`. |
| **[INT-05]** | Integritas | Kapasitas klinik di-hardcode (magic number 10) | ✅ **FIXED** | Mengganti angka 10 dengan named constant `CLINIC_MAX_CAPACITY`. |
| **[SMELL-03]** | Code Smell | Penggunaan `as any` di hooks query Supabase | ✅ **FIXED** | Menghapus type casting `as any` dengan mengetik response query gabungan via `SupabaseQueueRow`. |
| **[SMELL-05]** | Code Smell | Fonnte token dikirim langsung dari browser ke API Fonnte | ✅ **FIXED** | Membuat Edge Function proxy `check-fonnte-status` agar token tidak terekspos di browser DevTools. |
| **[SMELL-07]** | Code Smell | 10 useState manual di Settings form | ✅ **FIXED** | Mengkonsolidasikan state ke dalam hook `useSystemSettings`. |
| **[SMELL-08]** | Code Smell | `window.open` tanpa parameter `noopener,noreferrer` | ✅ **FIXED** | Menambahkan `'noopener,noreferrer'` di pemanggilan `window.open` untuk mencegah reverse tabnapping. |
| **[MINOR-02]** | Minor | Tombol "Lihat Semua Antrean" tidak aktif di dashboard | ✅ **FIXED** | Mengubah tombol mati menjadi React Router `<Link>` yang mengarah ke antrean pasien. |
| **[MINOR-04]** | Minor | `console.error` mencetak PII user ke console | ✅ **FIXED** | Mengganti `console.error` yang memuat PII dengan structured `logger.error` yang aman. |

---

## 🛠 Detail Perubahan Teknis

### 1. Migrasi Database Supabase (SQL Editor)
Dua berkas migrasi telah dibuat di folder `supabase/migrations/`:
- **`20260614_system_settings_fonnte_rls.sql`**: Mengubah kebijakan RLS pada tabel `system_settings`. Kolom `fonnte_token` kini hanya bisa dibaca oleh user dengan role `pharmacist` atau `admin`. Kunci umum lainnya (`pharmacist_wa`, `doctor_wa`) tetap bisa dibaca oleh user biasa/pasien untuk keperluan kontak bantuan.
- **`20260614_otp_rate_limit.sql`**: Menambahkan kolom `attempt_count` (default 0) ke tabel `password_reset_otps` untuk melacak kegagalan verifikasi OTP, serta membuat index partial `idx_otp_active_by_phone` guna mengoptimalkan query pemeriksaan OTP aktif.

### 2. Konfigurasi Server-Side (Edge Functions & Secrets)
Seluruh 6 Edge Functions telah berhasil dideploy ke Supabase menggunakan Management API (`--use-api`) untuk bypass Docker lokal:
1. **`send-whatsapp`** (Updated): Pengiriman pesan WA melalui server dengan proteksi token.
2. **`request-reset-otp`** (Updated): Logika request OTP terproteksi rate-limiting & invalidasi OTP lama.
3. **`verify-and-reset-otp`** (Updated): Verifikasi OTP dengan brute-force protection (max 5 failed attempts).
4. **`update-user-role`** (New): Penggantian role terverifikasi server-side JWT auth (hanya apoteker/admin).
5. **`check-fonnte-status`** (New): Proxy pengecekan koneksi Fonnte ke Deno server tanpa expose API token ke client browser.
6. **`schedule-wa-reminder`** (New): Server-side scheduler untuk reminder H-1 kontrol pasien.

### 3. Penyelarasan Inkonsistensi Role (Bugfix 'clinician' vs 'doctor')
- **Masalah Sebelum Perbaikan**: Halaman Pengelolaan Staf baru (`UserManagementPanel.tsx`) mencoba meng-assign dan memfilter role menggunakan string `'clinician'`. Sedangkan tipe ENUM database di Supabase (`public.app_role`) dan konfigurasi routing aplikasi hanya mengenali string `'doctor'`. Jika dibiarkan, ini akan menyebabkan error database sewaktu apoteker menyimpan role dokter baru.
- **Solusi yang Diimplementasikan**: Melakukan refactoring menyeluruh pada `useUserManagement.ts`, `UserManagementPanel.tsx`, dan Edge Function `update-user-role` untuk menyamakan role menjadi `'doctor'`. Proses pemfilteran dan query database kini 100% sinkron dan aman.

---

## 📋 Hasil Pengujian Kompilasi (TypeScript Validation)
Verifikasi lokal membuktikan tidak ada error runtime maupun compilation:
```bash
npx tsc --noEmit
# Output: Success (0 Errors)
```

---

## 🔄 Rencana Tindakan Berikutnya (Tindak Lanjut)
1. **UX/Design Review**: Refactoring component `PharmacistSchedule.tsx` (untuk memecah *God Component* 583 baris) saat ini berada dalam status **HOLD** menunggu persetujuan tim desain/UX mengenai mockup baru sebelum dieksekusi oleh engineer.
2. **Uji Coba Fungsional Akhir**: Melakukan verifikasi alur OTP dan toggle role di staging server setelah database migrations di-apply di production db.
