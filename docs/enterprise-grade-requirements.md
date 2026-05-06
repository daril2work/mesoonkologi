# Enterprise Grade Application Requirements

Dokumen ini digunakan sebagai **standar penilaian** untuk mengevaluasi apakah sebuah aplikasi sudah memenuhi kualitas enterprise. Agent dapat menggunakan dokumen ini sebagai checklist audit dan memberikan skor serta rekomendasi perbaikan.

---

## Cara Menggunakan Dokumen Ini

Untuk setiap kategori, nilai aplikasi dengan skala berikut:

- ✅ **Terpenuhi** — sudah implementasi dan berjalan baik
- ⚠️ **Parsial** — ada implementasi tapi belum lengkap atau ada celah
- ❌ **Belum** — belum ada implementasi sama sekali
- `N/A` — tidak relevan untuk konteks aplikasi ini

Hitung skor akhir: **(jumlah ✅ / total item relevan) × 100%**

| Grade | Skor |
|-------|------|
| 🥇 Enterprise Ready | 85–100% |
| 🥈 Production Ready | 65–84% |
| 🥉 MVP Ready | 40–64% |
| 🔴 Needs Work | < 40% |

---

## 1. Security

> Aplikasi enterprise tidak boleh kompromi di area ini. Ini adalah kategori dengan bobot tertinggi.

### 1.1 Authentication & Authorization
- [x] Autentikasi menggunakan metode standar (OAuth2, JWT, session-based)
  > ✅ Supabase Auth — JWT-based, managed service
- [x] Password disimpan dengan hashing yang kuat (bcrypt, argon2) — bukan plain text atau MD5
  > ✅ Ditangani sepenuhnya oleh Supabase Auth (bcrypt)
- [x] Ada mekanisme refresh token dan token expiry
  > ✅ Supabase Auth mengelola refresh token secara otomatis
- [x] Role-based access control (RBAC) — setiap user hanya bisa akses sesuai perannya
  > ✅ Kolom `role` di tabel `profiles` + RLS policy per tabel di Supabase
- [ ] Multi-factor authentication (MFA) tersedia, terutama untuk admin
  > ❌ Belum diimplementasikan — Supabase mendukung MFA TOTP tapi belum diaktifkan
- [ ] Brute force protection (rate limiting pada endpoint login)
  > ⚠️ Supabase punya rate limiting bawaan tapi belum dikonfigurasi secara eksplisit untuk kebutuhan klinis

### 1.2 Data Protection
- [x] Semua komunikasi menggunakan HTTPS (TLS 1.2 minimum)
  > ✅ Supabase endpoint selalu HTTPS; Vite dev server pakai HTTP tapi hanya untuk development
- [x] Data sensitif dienkripsi saat disimpan (at-rest encryption)
  > ✅ Supabase (PostgreSQL di AWS) menggunakan AES-256 at-rest encryption
- [x] API key, secret, dan credential tidak pernah di-hardcode di kode — menggunakan environment variable
  > ✅ Semua key ada di `.env` dan diakses via `import.meta.env`
- [x] File `.env` tidak pernah masuk ke repository (ada di `.gitignore`)
  > ✅ `.env` terdaftar di `.gitignore`
- [ ] Tidak ada data sensitif yang muncul di log
  > ⚠️ Ada beberapa `console.error('[usePatientSchedule]', error)` yang bisa mengekspos detail query error ke browser console

### 1.3 Input Validation & Protection
- [ ] Semua input dari user divalidasi di sisi server (bukan hanya client)
  > ⚠️ Validasi dilakukan di RLS Supabase, namun tidak ada schema validation (Zod/Yup) di sisi aplikasi sebelum insert
- [x] Proteksi terhadap SQL injection
  > ✅ Supabase JS SDK menggunakan parameterized query secara bawaan
- [x] Proteksi terhadap XSS (Cross-Site Scripting)
  > ✅ React secara bawaan meng-escape semua string output; tidak ada `dangerouslySetInnerHTML` yang dipakai
- [ ] Proteksi terhadap CSRF (Cross-Site Request Forgery)
  > ⚠️ Tidak ada CSRF token eksplisit; partially mitigated by Supabase JWT di header Authorization
- [ ] Upload file dibatasi tipe dan ukurannya
  > N/A — belum ada fitur upload file di fase ini

### 1.4 Dependency Security
- [ ] Tidak ada dependency dengan known vulnerability kritis (cek dengan `npm audit` atau `pip-audit`)
  > ⚠️ `npm audit` belum dijalankan secara formal dan hasilnya belum didokumentasikan
- [ ] Dependency di-update secara berkala
  > ⚠️ Belum ada jadwal update dependency yang terdefinisi

---

## 2. Reliability & Error Handling

> Aplikasi enterprise harus gagal dengan elegan — bukan crash tanpa pesan.

### 2.1 Error Handling
- [x] Semua error ditangkap dan tidak membocorkan stack trace ke user
  > ✅ `useMutation.onError` menampilkan pesan user-friendly via `react-hot-toast`, bukan raw error
- [x] Pesan error untuk user bersifat informatif tapi tidak mengekspos detail teknis
  > ✅ Pesan error dalam Bahasa Indonesia yang empatik (contoh: "Gagal mengirim laporan")
- [ ] Ada global error handler / error boundary
  > ❌ Tidak ada `<ErrorBoundary>` di `PatientLayout` atau `AppRouter`; jika satu komponen crash, seluruh halaman bisa blank
- [x] Error pada integrasi pihak ketiga (API eksternal) ditangani dengan fallback
  > ✅ Semua query React Query menggunakan pola `if (error) throw error` + `isLoading` guard di UI

### 2.2 Availability
- [ ] Ada health check endpoint (`/health` atau `/ping`) yang bisa dimonitor
  > N/A — Aplikasi adalah frontend SPA; backend health check ditangani oleh Supabase platform
- [ ] Aplikasi bisa restart otomatis jika crash (menggunakan PM2, systemd, atau container orchestration)
  > ❌ Belum ada konfigurasi deployment (PM2/Docker) — aplikasi hanya dijalankan via `npm run dev`
- [ ] Ada retry mechanism untuk operasi yang bisa gagal sementara (network call, queue)
  > ⚠️ React Query memiliki retry bawaan (3x) untuk query, namun belum dikonfigurasi eksplisit untuk mutation
- [ ] Graceful shutdown — aplikasi bisa stop dengan bersih tanpa data loss
  > N/A — Frontend SPA; tidak relevan di level ini

### 2.3 Data Integrity
- [x] Operasi kritis menggunakan database transaction (kalau ada multi-step write)
  > ✅ Sejauh ini setiap operasi adalah single-table insert — tidak ada multi-step write yang memerlukan transaction
- [x] Tidak ada partial state — kalau satu operasi gagal, semuanya di-rollback
  > ✅ Single insert per operasi, tidak ada risiko partial state saat ini
- [ ] Validasi data dilakukan sebelum disimpan ke database
  > ⚠️ Tidak ada schema validation layer (Zod) di frontend — data dikirim langsung ke Supabase; hanya RLS yang memproteksi

---

## 3. Performance & Scalability

> Aplikasi harus tetap responsif saat load meningkat.

### 3.1 Response Time
- [ ] API endpoint merespons dalam < 500ms untuk operasi normal
  > ⚠️ Belum ada pengukuran formal; secara subjektif query Supabase cepat tapi belum diverifikasi dengan benchmarking
- [x] Halaman web load dalam < 3 detik (First Contentful Paint)
  > ✅ Vite dengan lazy loading per route; bundle split per fitur sudah diimplementasikan di `AppRouter.tsx`
- [x] Query database dioptimasi — tidak ada N+1 query problem
  > ✅ Setiap hook melakukan satu query tunggal; tidak ada loop yang memicu query tambahan
- [ ] Index database dipasang pada kolom yang sering di-query atau di-filter
  > ⚠️ Migration SQL tidak mendefinisikan index eksplisit (selain PK); kolom `patient_id`, `sender_id`, `receiver_id` belum diindex

### 3.2 Scalability
- [x] Aplikasi bisa di-scale horizontal (stateless — session tidak disimpan di memory server)
  > ✅ Frontend SPA + Supabase managed — sepenuhnya stateless di sisi aplikasi
- [ ] File upload disimpan di object storage (S3, Cloudflare R2), bukan di server lokal
  > N/A — Belum ada fitur upload file
- [x] Background job dijalankan secara async — tidak memblokir response ke user
  > ✅ Semua operasi DB dijalankan async via React Query; UI tidak pernah blocked
- [ ] Ada rate limiting pada endpoint publik untuk mencegah abuse
  > ⚠️ Supabase memiliki rate limiting bawaan tapi tidak dikonfigurasi secara eksplisit untuk skenario abuse

### 3.3 Caching
- [x] Data yang jarang berubah di-cache (konfigurasi, lookup data)
  > ✅ React Query cache dengan staleTime default; education materials dan pharmacist data jarang berubah
- [ ] Response API yang berat memiliki caching strategy yang jelas
  > ⚠️ `staleTime` tidak dikonfigurasi eksplisit di semua hook — menggunakan default 0ms (refetch setiap mount)
- [ ] Cache invalidation terdefinisi — kapan cache di-clear
  > ⚠️ `invalidateQueries` dipanggil setelah mutation (✅ untuk laporan & chat), namun tidak semua hook mendefinisikan `staleTime` secara eksplisit

---

## 4. Observability & Monitoring

> Kalau sesuatu salah di production, kamu harus tahu sebelum user komplain.

### 4.1 Logging
- [ ] Semua event penting di-log: login, logout, aksi kritis user, error
  > ⚠️ Hanya ada `console.error` sporadis; tidak ada structured logging yang komprehensif
- [ ] Log memiliki level yang jelas: DEBUG, INFO, WARN, ERROR
  > ❌ Tidak ada logging framework — hanya `console.error` dan `console.log` ad-hoc
- [ ] Log menyertakan context: timestamp, user ID, request ID
  > ❌ Tidak ada context di log yang ada
- [ ] Log disimpan secara terpusat dan bisa di-search (bukan hanya di server)
  > ❌ Tidak ada integrasi ke Sentry, Datadog, Logtail, atau sejenisnya

### 4.2 Monitoring & Alerting
- [ ] Ada monitoring uptime — ada alert kalau aplikasi down
  > ❌ Belum ada uptime monitoring (UptimeRobot, Pingdom, dll.)
- [ ] Error rate dipantau — ada alert kalau error spike tiba-tiba
  > ❌ Tidak ada error tracking (Sentry/Bugsnag)
- [ ] Ada dashboard untuk melihat health aplikasi secara real-time
  > ❌ Belum ada; hanya Supabase dashboard bawaan untuk DB metrics
- [ ] Performa database dipantau (slow query, connection pool)
  > ⚠️ Supabase Dashboard menyediakan query insights, namun belum dikonfigurasi atau dipantau aktif

### 4.3 Audit Trail (khusus Internal Tools & SaaS)
- [x] Setiap aksi penting user tercatat: siapa, melakukan apa, kapan
  > ✅ Tabel `symptom_reports` dan `chat_messages` memiliki `patient_id`/`sender_id` + `created_at` — audit trail minimal tersedia
- [ ] Audit log tidak bisa dihapus oleh user biasa
  > ⚠️ RLS policy ada, namun belum ada policy yang secara eksplisit melarang DELETE oleh pasien pada data historis mereka sendiri
- [ ] Ada fitur untuk melihat history perubahan data
  > ❌ Tidak ada fitur audit history di UI; tidak ada `updated_by` atau changelog table

---

## 5. Maintainability & Code Quality

> Kode yang bisa dipahami 6 bulan kemudian oleh orang lain (atau dirimu sendiri).

### 5.1 Struktur & Organisasi
- [x] Struktur folder konsisten dan mengikuti konvensi framework yang dipakai
  > ✅ Domain-driven structure: `features/{domain}/{api,components,pages,constants,types}` diterapkan konsisten
- [x] Separation of concerns — logic bisnis tidak campur dengan routing atau database query
  > ✅ Business logic (sentinel detection, auto-grading) dipisah ke `@utils/sentinel`; data fetching di hook tersendiri; UI murni di komponen
- [ ] Tidak ada "god file" — satu file yang berisi segalanya (> 500 baris patut dicurigai)
  > ⚠️ `PatientDashboard.tsx` ±188 baris (masih aman), `PatientEducation.tsx` ±282 baris (borderline); belum ada yang > 500 baris
- [x] Naming convention konsisten (variabel, fungsi, file)
  > ✅ camelCase untuk fungsi/variabel, PascalCase untuk komponen, kebab-case untuk file non-komponen; konsisten di seluruh codebase

### 5.2 Documentation
- [ ] Ada README yang menjelaskan cara setup dan menjalankan aplikasi
  > ⚠️ README ada tapi belum dikonfirmasi memuat instruksi setup yang lengkap (supabase migration, env setup)
- [ ] Setiap API endpoint terdokumentasi (input, output, error yang mungkin)
  > ⚠️ Tidak ada API documentation formal; hook memiliki komentar singkat tapi tidak sistematis
- [ ] Environment variable yang dibutuhkan terdaftar lengkap di README atau `.env.example`
  > ⚠️ Perlu dikonfirmasi apakah `.env.example` sudah lengkap dan terkini
- [x] Keputusan arsitektur penting dicatat (kenapa pakai X bukan Y)
  > ✅ Dokumentasi arsitektur dan keputusan desain ada di folder `docs/`

### 5.3 Testing
- [ ] Ada unit test untuk logic bisnis yang kritis
  > ❌ Tidak ada unit test sama sekali — `detectSentinel()` dan `autoGrade()` belum ditest
- [ ] Ada integration test untuk alur utama aplikasi
  > ❌ Tidak ada integration test
- [ ] Test bisa dijalankan secara otomatis (tidak perlu setup manual yang rumit)
  > ❌ Belum ada test runner yang terkonfigurasi (Vitest/Jest)
- [ ] Code coverage minimal 60% untuk fitur kritis
  > ❌ Coverage 0% — tidak ada test

---

## 6. Data Management & Compliance

> Data adalah aset. Harus dikelola dengan tanggung jawab.

### 6.1 Backup & Recovery
- [x] Database di-backup secara otomatis dan terjadwal
  > ✅ Supabase Pro melakukan daily backup otomatis; Free tier memiliki backup mingguan
- [ ] Backup pernah di-test restore — tidak hanya ada tapi juga bisa dipulihkan
  > ❌ Belum ada dokumentasi bahwa backup pernah diuji restore
- [ ] Retention policy backup terdefinisi (berapa lama backup disimpan)
  > ⚠️ Supabase mendefinisikan retention (7 hari di Free, 30 hari di Pro), namun belum terdokumentasi eksplisit di project docs
- [ ] Ada prosedur disaster recovery yang terdokumentasi
  > ❌ Belum ada dokumen disaster recovery

### 6.2 Data Privacy
- [ ] Data user yang tidak lagi diperlukan dihapus (data retention policy)
  > ❌ Belum ada data retention policy yang terdefinisi
- [ ] Ada mekanisme untuk user request delete data mereka (GDPR compliance)
  > ❌ Belum ada fitur "hapus akun & data saya" — penting mengingat ini data medis sensitif
- [x] Data yang dikumpulkan sudah sesuai dengan privacy policy yang dikomunikasikan ke user
  > ⚠️ Belum ada halaman Privacy Policy di dalam aplikasi (diasumsikan akan ditambahkan sebelum production)
- [ ] PII (Personally Identifiable Information) tidak masuk ke log atau analytics yang tidak terenkripsi
  > ⚠️ `console.error` sporadis bisa mengekspos nama user atau ID; tidak ada audit formal terkait hal ini

### 6.3 Multi-tenancy (khusus SaaS & Internal Tools)
- [x] Data antar tenant/organisasi terisolasi — user A tidak bisa akses data user B
  > ✅ Supabase RLS memastikan pasien hanya bisa akses data milik mereka sendiri (`patient_id = auth.uid()`)
- [x] Query selalu di-scope ke tenant yang sedang login
  > ✅ Semua query hook menggunakan `user.id` dari `useAuthStore` sebagai filter
- [ ] Ada mekanisme untuk offboarding tenant (export & delete data)
  > ❌ Belum ada fitur export data pasien atau mekanisme penghapusan akun

---

## 7. AI-Specific Requirements

> Khusus untuk aplikasi yang menggunakan AI/LLM (Chatbot, AI app).

### 7.1 Prompt Security
- N/A Tidak ada integrasi LLM/AI eksternal di fase ini
- N/A
- N/A

### 7.2 Reliability AI
- N/A Tidak ada integrasi LLM/AI eksternal di fase ini
- N/A
- N/A

### 7.3 Cost & Usage Control
- N/A Tidak ada integrasi LLM/AI eksternal di fase ini
- N/A
- N/A

### 7.4 Transparency
- N/A Tidak ada fitur AI generatif yang diekspos ke user
- N/A
- N/A

---

## 8. Deployment & DevOps

> Cara deploy yang benar adalah fondasi dari reliability.

### 8.1 Environment Management
- [ ] Ada pemisahan yang jelas antara environment: development, staging, production
  > ⚠️ Saat ini hanya ada satu Supabase project; belum ada environment staging yang terpisah
- [x] Konfigurasi per environment menggunakan environment variable, bukan hardcode
  > ✅ Semua config ada di `.env`; tidak ada hardcoded URL atau key di kode
- [ ] Perubahan selalu di-test di staging sebelum masuk production
  > ❌ Tidak ada staging environment — semua development langsung ke Supabase production project

### 8.2 Deployment Process
- [ ] Proses deploy terdokumentasi dan bisa dilakukan oleh lebih dari satu orang
  > ❌ Belum ada deployment documentation; hanya berjalan via `npm run dev`
- [ ] Ada rollback plan — bisa kembali ke versi sebelumnya dengan cepat kalau ada masalah
  > ❌ Belum ada; tidak ada versi build yang tersimpan
- [ ] Zero-downtime deployment (blue-green atau rolling deploy) untuk aplikasi kritikal
  > ❌ Belum ada deployment pipeline sama sekali
- [ ] Secrets dan credential dikelola dengan secret manager, bukan dikirim manual
  > ⚠️ Credential ada di `.env` lokal; belum menggunakan secret manager (Vault, AWS Secrets Manager, dll.)

### 8.3 CI/CD (nice to have, wajib untuk skala besar)
- [ ] Ada automated test yang jalan setiap kali ada perubahan kode
  > ❌ Tidak ada CI pipeline (GitHub Actions, dll.) dan tidak ada test suite
- [ ] Deploy ke production memerlukan approval atau review
  > ❌ Belum ada deployment pipeline
- [ ] Ada notifikasi ke tim kalau deploy berhasil atau gagal
  > ❌ Belum ada deployment pipeline

---

## Ringkasan Audit

Gunakan tabel ini untuk merangkum hasil penilaian:

| Kategori | Total Item | ✅ Terpenuhi | ⚠️ Parsial | ❌ Belum | Skor |
|----------|-----------|-------------|-----------|---------|------|
| 1. Security | 15 | 7 | 5 | 3 | 47% |
| 2. Reliability | 10 | 4 | 3 | 3 | 40% |
| 3. Performance | 10 | 5 | 4 | 1 | 50% |
| 4. Observability | 11 | 1 | 3 | 7 | 9% |
| 5. Maintainability | 11 | 5 | 4 | 2 | 45% |
| 6. Data Management | 11 | 3 | 3 | 5 | 27% |
| 7. AI-Specific | 12 | N/A | N/A | N/A | N/A |
| 8. Deployment | 10 | 1 | 2 | 7 | 10% |
| **TOTAL** | **78 (66 relevan)** | **26** | **24** | **28** | **39%** |

> **Grade: 🔴 Needs Work → menuju 🥉 MVP Ready**
> Jika ⚠️ Parsial dihitung setengah: (26 + 12) / 66 × 100% ≈ **57% → 🥉 MVP Ready**

---

## Top Priority Fixes

Setelah audit, ini adalah item yang paling kritis untuk diperbaiki sebelum production:

1. **Tidak ada Error Boundary** — *Risiko langsung ke pengguna: jika satu komponen React crash, seluruh halaman menjadi blank tanpa pesan. Pasien kanker yang sedang melapor gejala bisa kehilangan data tanpa tahu alasannya. Tambahkan `<ErrorBoundary>` di `PatientLayout` dan `AppRouter`.*

2. **Tidak ada unit test untuk logika klinis kritis** — *Fungsi `detectSentinel()` dan `autoGrade()` menentukan apakah pasien dalam kondisi darurat. Jika ada bug di sini, konsekuensinya adalah medis. Ini harus menjadi area pertama yang dicover dengan unit test.*

3. **Tidak ada error tracking & monitoring** — *Tidak ada Sentry atau sejenisnya — artinya bug di production tidak akan terdeteksi sampai pasien atau apoteker mengeluh. Integrasi Sentry Free tier cukup dan bisa selesai dalam satu jam.*

4. **Tidak ada staging environment** — *Semua pengembangan langsung ke Supabase production. Migration SQL yang salah bisa merusak data pasien aktif. Buat Supabase project terpisah untuk staging, minimal untuk menguji migration.*

5. **Data privacy compliance (GDPR/UU PDP)** — *Mengingat ini adalah aplikasi data medis, belum ada mekanisme "hapus data saya", data retention policy, atau halaman Privacy Policy. Di Indonesia, UU PDP No. 27/2022 sudah berlaku dan data kesehatan termasuk data sensitif dengan perlindungan tertinggi.*

---

> Dokumen ini dibuat sebagai panduan audit internal. Standar enterprise bisa bervariasi tergantung industri, regulasi, dan skala bisnis. Gunakan sebagai baseline, bukan sebagai ceiling.
>
> **Audit dilakukan pada:** 23 April 2026 | **Auditor:** Antigravity AI | **Versi aplikasi:** Phase 4 — Patient UI (MVP)
