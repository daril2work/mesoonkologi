# Security Checklist — MESO App
> Dokumen ini memuat daftar kontrol keamanan yang harus diverifikasi sebelum setiap deployment ke production.
> Update tanggal: 2026-06-14

---

## ✅ Sprint 1 — Security Hotfix (Selesai)

| ID | Temuan | Status | Mitigasi |
|----|--------|--------|----------|
| SEC-01 | `.env` tidak ter-ignore di Git | ✅ **FIXED** | `.gitignore` diupdate |
| SEC-02 | `fonnte_token` terbaca pasien via RLS | ✅ **FIXED** | Migration `20260614_system_settings_fonnte_rls.sql` |
| SEC-03 | CORS wildcard di Edge Functions | ✅ **FIXED** | `ALLOWED_ORIGIN` env var di semua 5 functions |
| SEC-04 | OTP: `Math.random()` + no rate limiting | ✅ **FIXED** | `crypto.getRandomValues()` + rate limit + attempt counter |
| SEC-05 | `updateUserRole` dari anon client | ✅ **FIXED** | Edge Function `update-user-role` dengan JWT auth check |

---

## ✅ Sprint 2 — Integrity & API Hardening (Selesai)

| ID | Temuan | Status | Mitigasi |
|----|--------|--------|----------|
| INT-01 | `.env.example` tidak sinkron | ✅ **FIXED** | Hapus variabel mati, tambah VITE_WA_ENABLED |
| INT-02 | Settings God state di PharmacistSettings | ✅ **FIXED** | Refactor ke `useSystemSettings` hook (React Query) |
| INT-03 | IDOR di usePatientDetail (reportId tanpa patient_id filter) | ✅ **FIXED** | Tambah `.eq('patient_id', patientId)` |
| INT-04 | WA scheduling di client-side | ✅ **FIXED** | Edge Function `schedule-wa-reminder` |
| INT-05 | Magic number `10` (kapasitas klinik) | ✅ **FIXED** | Named constant `CLINIC_MAX_CAPACITY` |
| SMELL-05 | `checkFonnteStatus` memanggil API dengan token langsung di browser | ✅ **FIXED** | Edge Function `check-fonnte-status` (proxy) |
| SMELL-08 | `window.open` tanpa `noopener,noreferrer` | ✅ **FIXED** | Tambah `'noopener,noreferrer'` di 3 tempat |
| MINOR-02 | Tombol "Lihat Semua Antrean Rutin" tidak aktif | ✅ **FIXED** | Diubah jadi `<Link>` ke `PHARMA_PATIENTS` |
| MINOR-03 | Route `ADMIN_DASHBOARD` unused | ✅ **FIXED** | Dikomentari (placeholder untuk masa mendatang) |
| SMELL-07 | `console.error` log user ID (PII) | ✅ **FIXED** | Ganti dengan `logger.error` tanpa ID |

---

## ✅ Sprint 3 — Type Safety (Selesai sebagian)

| ID | Temuan | Status | Catatan |
|----|--------|--------|---------|
| SMELL-03 | `as any` di `usePharmacistQueue` | ✅ **FIXED** | Typed `SupabaseQueueRow` + `resolvePatient()` helper |
| SMELL-03 | `as any` di `usePatientDirectory` | ✅ **FIXED** | Mapper sudah typed, hapus cast |
| SMELL-01 | `PharmacistSchedule` 583 baris (God Component) | ⏸ **HOLD** | Menunggu UX/desain approval |

---

## 🔄 Sprint 4 — Masih Perlu Dikerjakan

| ID | Temuan | Status |
|----|--------|--------|
| SMELL-06 | Toggle Notifikasi di Settings tidak fungsional | ⬜ TODO |
| MINOR-01 | Comment `TODO` aktif di `PharmacistPatients` | ⬜ TODO |

---

## 📋 Deployment Checklist

Sebelum push ke production, pastikan:

### Supabase Edge Function Secrets
- [ ] `FONNTE_TOKEN` sudah diset via Supabase Dashboard → Edge Functions → Secrets
- [ ] `ALLOWED_ORIGIN` diset ke domain production (contoh: `https://meso.rsxyz.id`)
- [ ] `SUPABASE_URL` dan `SUPABASE_SERVICE_ROLE_KEY` sudah diset (auto-inject oleh Supabase)

### Database Migrations
- [ ] `20260614_system_settings_fonnte_rls.sql` sudah dijalankan di Supabase
- [ ] `20260614_otp_rate_limit.sql` sudah dijalankan di Supabase
- [ ] Verifikasi kolom `attempt_count` ada di tabel `password_reset_otps`

### Edge Functions Deployment
- [ ] `update-user-role` di-deploy
- [ ] `check-fonnte-status` di-deploy
- [ ] `schedule-wa-reminder` di-deploy

### Git
- [ ] `.env` tidak ada di Git (cek dengan `git status`)
- [ ] `.env.example` dicommit sebagai template referensi

### Functional Testing
- [ ] Login sebagai pasien → coba akses `system_settings` → tidak bisa baca `fonnte_token`
- [ ] Request OTP → kirim 2 kali dalam 5 menit → request kedua harus ditolak (HTTP 429)
- [ ] Salah OTP 5 kali → OTP diblokir otomatis
- [ ] Update role user dari halaman Settings → berhasil (pharmacist saja yang bisa)
- [ ] Buat jadwal → WA reminder H-1 terjadwal via Edge Function
