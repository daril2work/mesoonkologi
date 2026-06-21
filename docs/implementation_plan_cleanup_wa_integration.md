# Implementation Plan: Cleanup & Rollback WhatsApp Integration

Dokumen ini adalah fase *Pre-Implementation* yang harus dilakukan **sebelum** kita mulai membangun sistem OTP Fallback (Telegram Admin). 

Tujuannya adalah untuk membersihkan (*rollback*) seluruh pekerjaan terkait integrasi WhatsApp (Fonnte/Kirimdev/Meta API) yang sudah terlanjur dikerjakan dan hampir di-*push* ke repositori Git. Hal ini memastikan *codebase* kembali bersih dan mencegah konflik kode di masa depan.

## 1. Identifikasi File yang Terdampak
Berdasarkan status Git saat ini, terdapat beberapa file yang telah dimodifikasi untuk keperluan pengiriman pesan WhatsApp otomatis dan akan di-*rollback*:

**Frontend (React/Vite):**
- `src/features/reports/api/useReportEscalation.ts`
- `src/features/reports/api/useSubmitReport.ts`
- `src/services/fonnte.service.ts`

**Backend (Supabase Edge Functions):**
- `supabase/functions/request-reset-otp/index.ts`
- `supabase/functions/schedule-wa-reminder/index.ts`
- `supabase/functions/send-whatsapp/index.ts`

**Script Pengujian (Untracked Files):**
- `create_otp.mjs`
- `create_templates.mjs`
- `create_templates_v2.mjs`
- `test_apicoid.mjs`

## 2. Rencana Eksekusi Rollback

### Langkah 1: Batalkan Perubahan (Git Restore)
Kita akan mengembalikan file-file yang dimodifikasi ke *state* terakhir yang bersih di *branch* `main`.
Perintah yang akan dijalankan:
```bash
# Mengembalikan file frontend
git restore src/features/reports/api/useReportEscalation.ts
git restore src/features/reports/api/useSubmitReport.ts
git restore src/services/fonnte.service.ts

# Mengembalikan file backend (Edge Functions)
git restore supabase/functions/request-reset-otp/index.ts
git restore supabase/functions/schedule-wa-reminder/index.ts
git restore supabase/functions/send-whatsapp/index.ts
```
*(Catatan: Jika ada perubahan fungsionalitas lain di dalam file tersebut yang bukan tentang WhatsApp dan ingin dipertahankan, kita harus merevisinya secara manual tanpa `git restore` menyeluruh).*

### Langkah 2: Hapus File Pengujian
Script percobaan API yang tercecer di folder utama akan dihapus agar *root* direktori kembali rapi:
```bash
rm create_otp.mjs create_templates.mjs create_templates_v2.mjs test_apicoid.mjs
```

## 3. Langkah Selanjutnya (Post-Rollback)
Setelah langkah pembersihan ini selesai:
1. Pastikan aplikasi dapat berjalan normal tanpa ada *error* terkait integrasi Fonnte/WA (`npm run dev`).
2. Lakukan *commit* pembersihan ini jika diperlukan.
3. Kita dapat mulai mengeksekusi **Implementation Plan: OTP Fallback (Admin-in-the-Loop)** dengan *codebase* yang segar.
