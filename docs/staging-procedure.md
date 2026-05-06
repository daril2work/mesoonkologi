# MESO — Staging & Deployment Procedure

Untuk memastikan stabilitas sistem *enterprise*, setiap perubahan besar harus melalui lingkungan **Staging** sebelum dideploy ke **Production**.

## 1. Lingkungan (Environments)

| Environment | Purpose | Database | Base URL |
| :--- | :--- | :--- | :--- |
| **Local** | Development harian | Supabase Local / Dev Project | `localhost:5173` |
| **Staging** | Uji coba fitur & migrasi | Supabase Staging Project | `staging.meso.app` |
| **Production** | Live system (Data Pasien Asli) | Supabase Production Project | `app.meso.app` |

## 2. Alur Migrasi Database (Safe Migration)

Jangan pernah menjalankan SQL langsung di Production tanpa diuji di Staging.

1.  **Ekstraksi**: Buat file `.sql` baru di folder `supabase/migrations/`.
2.  **Uji Staging**: Jalankan script SQL di proyek Supabase Staging.
3.  **Validasi**: Pastikan aplikasi di link Staging berjalan normal.
4.  **Uji Hapus (Rollback)**: Jika memungkinkan, siapkan script untuk membatalkan perubahan jika terjadi error.
5.  **Deploy Production**: Jalankan script di Production setelah disetujui.

## 3. Variabel Lingkungan (.env)

Setiap lingkungan HARUS memiliki file `.env` sendiri. Pastikan `VITE_SUPABASE_URL` dan `VITE_SUPABASE_ANON_KEY` tidak tertukar.

```bash
# Contoh .env.staging
VITE_SUPABASE_URL=https://staging-project-id.supabase.co
VITE_SUPABASE_ANON_KEY=your-staging-anon-key
VITE_APP_ENV=staging
```

## 4. Checklist Pra-Deployment (Production)

- [ ] Seluruh unit test (`npm test`) lulus.
- [ ] Migrasi DB sudah diaplikasikan di Staging.
- [ ] Tidak ada API keys yang ter-hardcode di kode.
- [ ] `ErrorBoundary` sudah terpasang secara global.
- [ ] Kebijakan Privasi sudah sesuai dengan versi terbaru.

---
*Dokumen ini adalah bagian dari Enterprise Hardening Fase 5.*
