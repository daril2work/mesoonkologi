# Audit Final: Security, Vulnerability, Code Smell & God Class
## MESO App — Frontend (React + TypeScript)
**Tanggal:** 2026-06-25 | **Auditor:** Antigravity AI

---

## Ringkasan Eksekutif

Secara umum, kodebase MESO App berada dalam **kondisi cukup sehat** untuk aplikasi klinis early-stage. Pola arsitektur utama (React Query, Zustand, RLS, ProtectedRoute) sudah benar. Namun terdapat sejumlah isu yang perlu diatasi sebelum menyentuh skala produksi penuh.

| Kategori | Temuan | Severity |
|---|---|---|
| 🔴 Security/Vulnerability | 3 isu | CRITICAL / HIGH |
| 🟠 God Class / God Config | 2 isu | HIGH |
| 🟡 Code Smell | 7 isu | MEDIUM |
| 🟢 Tech Debt / Minor | 5 isu | LOW |

---

## 🔴 SECTION 1 — Security & Vulnerability

### [SEC-01] `window.open(waUrl, '_blank')` tanpa `noopener,noreferrer`
**Severity: HIGH** | File: [`PharmacistSchedule.tsx:99`](file:///d:/MESO-app/src/features/reports/pages/PharmacistSchedule.tsx#L99)

Saat apoteker membuka link WhatsApp `wa.me` untuk reminder manual, digunakan `window.open(waUrl, '_blank')` tanpa flag `noopener,noreferrer`. Ini mengekspos halaman pengirim ke **reverse tabnapping attack** — halaman baru yang dibuka bisa memanipulasi `window.opener` dan melakukan phishing redirect.

```tsx
// ❌ SAAT INI — Rentan
window.open(waUrl, '_blank')

// ✅ HARUS DIGANTI
window.open(waUrl, '_blank', 'noopener,noreferrer')
```

**Referensi:** [MDN - noopener](https://developer.mozilla.org/en-US/docs/Web/HTML/Element/a#rel)

---

### [SEC-02] Kode OTP dalam URL di `ForgotPasswordPage` (Potential PII Leak)
**Severity: HIGH** | File: [`ForgotPasswordPage.tsx:27-35`](file:///d:/MESO-app/src/features/auth/pages/ForgotPasswordPage.tsx#L27)

Deep link dari WhatsApp menyertakan `phone_number` sebagai URL query parameter (`?phone=...`). Nomor HP pasien (PII/PHI) ini akan:
1. Tersimpan di **browser history**
2. Muncul di **web server access logs** jika ada reverse proxy/CDN
3. Bisa ter-capture di **analytics tools** (jika dipasang di masa depan)

```tsx
// ❌ Berbahaya — PII di URL
const phoneParam = params.get('phone')
if (phoneParam) {
  setUserData({ phone_number: phoneParam })
}
```

**Rekomendasi:** Gunakan `sessionStorage` satu arah atau alihkan via short-lived token server-side, bukan nomor mentah di URL query string.

---

### [SEC-03] `navigator.clipboard` Tanpa Error Handling / Fallback
**Severity: MEDIUM** | File: [`PatientTopNav.tsx:251`](file:///d:/MESO-app/src/features/reports/components/PatientTopNav.tsx#L251), [`PatientEducation.tsx:128`](file:///d:/MESO-app/src/features/reports/pages/PatientEducation.tsx#L128), [`PharmacistEducation.tsx:296`](file:///d:/MESO-app/src/features/reports/pages/PharmacistEducation.tsx#L296)

`navigator.clipboard.writeText()` bisa **gagal silently** pada:
- HTTP context (non-HTTPS, walaupun Supabase pakai HTTPS, ini risiko di localhost)
- Beberapa browser mobile lama
- Jika user menolak permission clipboard

Di beberapa tempat ada `await navigator.clipboard.writeText(...)` tanpa `try/catch`:

```tsx
// ❌ Di PatientEducation.tsx — Tidak ada error handling
navigator.clipboard.writeText(featured.videoUrl);
toast.success('Tautan disalin!');
```

Jika clipboard gagal, toast sukses tetap muncul — menyesatkan user.

---

## 🟠 SECTION 2 — God Class / God Config

### [GOD-01] `PatientTopNav.tsx` — God Component (354 baris, 5+ tanggung jawab)
**Severity: HIGH** | File: [`PatientTopNav.tsx`](file:///d:/MESO-app/src/features/reports/components/PatientTopNav.tsx)

Komponen ini memiliki terlalu banyak tanggung jawab dalam satu file:

| Responsibility | Baris |
|---|---|
| Top navigation bar rendering | 63-119 |
| Notification overlay + marking | 122-207 |
| Profile modal UI | 209-350 |
| Supabase query (fetchProfile) langsung di komponen | 29-46 |
| Supabase mutation (update phone_number) langsung di komponen | 312-338 |
| WhatsApp form state management | 23-25, 307-344 |

**Masalah utama:** `fetchProfile()` dan mutasi `supabase.from('profiles').update(...)` dipanggil **langsung di dalam komponen**, bukan di custom hook/API layer. Ini melanggar separation of concerns dan membuat unit testing hampir tidak mungkin.

**Rekomendasi Refactor:**
```
PatientTopNav.tsx
  → usePatientProfile.ts (hook: fetchProfile + update)
  → ProfileModal.tsx (komponen terpisah)
  → NotificationPanel.tsx (komponen terpisah)
```

---

### [GOD-02] `PharmacistSettings.tsx` — Mixed Abstraction Level
**Severity: HIGH** | File: [`PharmacistSettings.tsx`](file:///d:/MESO-app/src/features/reports/pages/PharmacistSettings.tsx)

Walaupun sudah direfactor sebagian (penggunaan `useSystemSettings`), halaman ini masih mencampur dua level abstraksi:
- **Baik:** Business logic dipindah ke `useSystemSettings`, `useSaveWaSettings`, dll.
- **Masalah:** `checkFonnteStatusViaServer()` dipanggil langsung dalam `useEffect` tanpa dijadikan React Query hook. Ini berarti tidak ada caching, tidak ada retry otomatis, dan state `fonnteStatus` dikelola manual.
- `handleTestPharma` dan `handleTestDoctor` adalah duplikasi logika identik (pola copy-paste) yang bisa diekstrak ke fungsi tunggal `handleTestWA(phone, label)`.

```tsx
// ❌ Duplikasi (GOD-02)
const handleTestPharma = async () => { /* 15 baris identik */ }
const handleTestDoctor = async () => { /* 15 baris identik */ }

// ✅ Solusi
const handleTestWA = async (phone: string, label: string) => { ... }
```

---

## 🟡 SECTION 3 — Code Smell

### [SMELL-01] `console.error` Langsung Digunakan (Bukan via `logger`)
**Severity: MEDIUM** | Multiple files

Proyek sudah memiliki `logger.ts` yang baik, namun masih banyak `console.error` langsung yang lolos code review:

| File | Baris |
|---|---|
| `PharmacistSchedule.tsx` | L67, L73 |
| `PharmacistReportDetail.tsx` | L39 |
| `usePatientQolStatus.ts` | L18 |
| `usePatientActions.ts` | L134 |
| `useUserManagement.ts` | L29, L65 |
| `PatientTopNav.tsx` | L42 |
| `whatsapp.service.ts` | L32 |

Semua `console.error` ini harus dimigrasi ke `logger.error(...)` agar konsisten dan siap integrasi Sentry/Datadog di masa depan.

---

### [SMELL-02] `catch (err: any)` — Hilangkan Any pada Error Catch
**Severity: MEDIUM** | ~10 file

TypeScript memberikan `unknown` sebagai default tipe `catch`. Pattern `catch (err: any)` yang tersebar luas menonaktifkan type safety pada error handling — bisa menyembunyikan bugs.

```tsx
// ❌ Type unsafe
} catch (err: any) {
  toast.error(err.message) // Bisa crash jika err bukan Error object
}

// ✅ Standar aman
} catch (err) {
  const message = err instanceof Error ? err.message : 'Terjadi kesalahan'
  toast.error(message)
}
```

File terdampak: `ForgotPasswordPage.tsx`, `LoginPage.tsx`, `RegisterPage.tsx`, `usePatientActions.ts`, dll.

---

### [SMELL-03] Hardcoded Route String di `PharmacistLayout.tsx`
**Severity: MEDIUM** | File: [`PharmacistLayout.tsx:245`](file:///d:/MESO-app/src/features/reports/components/PharmacistLayout.tsx#L245)

```tsx
// ❌ Hardcoded — tidak konsisten dengan pola ROUTES constants yang sudah ada
onClick={() => navigate('/pharma/settings')}

// ✅ Harus pakai ROUTES constant
onClick={() => navigate(ROUTES.PHARMA_SETTINGS)}
```

---

### [SMELL-04] Navbar Hardcoded di `PharmacistLayout.tsx` (Magic String Paths)
**Severity: MEDIUM** | File: [`PharmacistLayout.tsx:63-68`](file:///d:/MESO-app/src/features/reports/components/PharmacistLayout.tsx#L63)

```tsx
// ❌ Magic string paths di navItems
const navItems = [
  { label: 'Antrean Laporan', icon: 'assignment', path: '/pharma/dashboard' },
  { label: 'Data Pasien', icon: 'group', path: '/pharma/patients' },
  ...
]

// ✅ Harus pakai ROUTES constants
const navItems = [
  { label: 'Antrean Laporan', icon: 'assignment', path: ROUTES.PHARMA_DASHBOARD },
  { label: 'Data Pasien', icon: 'group', path: ROUTES.PHARMA_PATIENTS },
  ...
]
```

Jika route berubah, harus update di 2 tempat (routes.config.ts dan PharmacistLayout) — DRY violation.

---

### [SMELL-05] `useState<any>` untuk Data Profil dan User
**Severity: MEDIUM** | Files: [`PatientTopNav.tsx:21`](file:///d:/MESO-app/src/features/reports/components/PatientTopNav.tsx#L21), [`ForgotPasswordPage.tsx:24`](file:///d:/MESO-app/src/features/auth/pages/ForgotPasswordPage.tsx#L24)

```tsx
// ❌ Hilang type safety
const [profileData, setProfileData] = useState<any>(null)
const [userData, setUserData] = useState<any>(null)
```

Kedua state ini harus memiliki interface/type yang terdefinisi. `profileData` seharusnya menggunakan tipe dari Supabase atau interface lokal seperti `PatientProfile`.

---

### [SMELL-06] `setStatusFilter(opt.value as any)` — Unsafe Type Cast
**Severity: LOW-MEDIUM** | File: [`PharmacistPatients.tsx:88`](file:///d:/MESO-app/src/features/reports/pages/PharmacistPatients.tsx#L88)

```tsx
// ❌ Unsafe cast
setStatusFilter(opt.value as any)

// ✅ Seharusnya — filter options array sudah typed
.map((opt: { label: string; value: StatusFilter }) => ...)
setStatusFilter(opt.value) // Tidak perlu cast
```

---

### [SMELL-07] `PatientHistory.tsx` dan `PharmacistPatients.tsx` — Duplikasi Status Badge Logic
**Severity: MEDIUM**

Logic render status badge (warna dot + teks berdasarkan `overallStatus`) terduplikasi persis di **desktop table** dan **mobile card** dalam `PharmacistPatients.tsx` (baris 236-266 dan 332-362). Ini adalah duplikasi ~30 baris identik.

**Rekomendasi:** Ekstrak ke komponen `<PatientStatusBadge status={p.overallStatus} isActive={p.isActive} statusReason={p.statusReason} />`. Komponen `StatusBadge.tsx` sudah ada di `@components/ui` — tinggal diperluas.

---

## 🟢 SECTION 4 — Tech Debt & Minor Issues

### [DEBT-01] `PharmacistHelp.tsx` — Dokumentasi Hardcoded, Tidak Maintainable
**Severity: LOW**

Array `docs` berisi konten dokumentasi hardcoded di dalam komponen React. Jika ada pembaruan SOP klinis, harus mengubah kode. Solusi ideal: pindah ke file JSON/MDX atau CMS ringan.

---

### [DEBT-02] `ForgotPasswordPage.tsx` — Multi-Step Form dalam Satu Komponen (509 baris)
**Severity: LOW-MEDIUM** | File: [`ForgotPasswordPage.tsx`](file:///d:/MESO-app/src/features/auth/pages/ForgotPasswordPage.tsx)

File ini sudah berisi 4 step alur yang dikontrol dengan `step` state. Walaupun bisa diterima secara fungsional, setiap step idealnya dipisah ke komponen tersendiri (`Step1SearchForm`, `Step2OtpVerify`, dst.) untuk readability dan testability. 509 baris adalah threshold yang mulai menuju god component.

---

### [DEBT-03] `TODO F-01` — Notifikasi Real-time Belum Diimplementasi
**Severity: LOW** | File: [`PharmacistPatients.tsx:424`](file:///d:/MESO-app/src/features/reports/pages/PharmacistPatients.tsx#L424)

```tsx
{/* TODO F-01: Notifikasi real dari Supabase realtime (Sprint 4) */}
```

Sidebar notifikasi masih menampilkan placeholder statik. Ini adalah feature gap yang perlu di-track di backlog.

---

### [DEBT-04] `PharmacistSchedule.tsx` — "Kondisi Lingkungan" (24°C) Placeholder Hardcoded
**Severity: LOW** | File: [`PharmacistSchedule.tsx:462`](file:///d:/MESO-app/src/features/reports/pages/PharmacistSchedule.tsx#L462)

```tsx
<p className="text-[10px] font-black text-on-surface mt-1">24°C</p>
```

Widget "Kondisi Lingkungan" menampilkan nilai statis (24°C, "Ideal") yang tidak terhubung ke data nyata apapun. Ini adalah UI dummy yang bisa menyesatkan pengguna klinis. Harus dihapus atau ditandai jelas sebagai placeholder.

---

### [DEBT-05] `exportToCSV` — Tidak Menangani Karakter Spesial dengan Benar
**Severity: LOW** | File: [`helpers.ts:102`](file:///d:/MESO-app/src/utils/helpers.ts#L102)

```tsx
const headers = Object.keys(data[0]).join(',') // ❌ Header tidak di-quote
```

Header kolom tidak di-wrap dalam tanda kutip, sehingga nama kolom yang mengandung koma (misalnya "Tanggal, Status") akan merusak struktur CSV. Harus konsisten:

```tsx
const headers = Object.keys(data[0]).map(h => `"${h}"`).join(',')
```

---

## ✅ SECTION 5 — Hal yang Sudah Baik (Tidak Perlu Diubah)

- **Arsitektur Auth** (`ProtectedRoute.tsx`, `store.ts`) — sangat solid: eager clear, role-based redirect, account deactivation check, infinite loop prevention.
- **Separation of Concerns** di `PharmacistPatientDetail.tsx` — berhasil direfactor menjadi orchestrator page yang bersih.
- **Structured Logger** (`logger.ts`) — sudah dipersiapkan untuk Sentry.
- **RLS Supabase** — token tidak pernah diekspos ke frontend (`SMELL-05` sudah di-address di `useSystemSettings`).
- **React Query** digunakan secara konsisten dengan query keys yang terdefinisi.
- **`exportToCSV`** sudah menangani escaping double quote (`""`).
- **`whatsapp.service.ts`** menggunakan Edge Function sebagai proxy — benar secara arsitektur, token tidak ada di frontend.
- **`CLINIC_MAX_CAPACITY`** sudah dijadikan konstanta (bukan magic number).

---

## Prioritas Perbaikan (Urutan Rekomendasi)

| # | Isu | File | Effort |
|---|---|---|---|
| 1 | **SEC-01** Tambah `noopener,noreferrer` | `PharmacistSchedule.tsx:99` | 5 menit |
| 2 | **SMELL-03** Ganti hardcoded route | `PharmacistLayout.tsx:245` | 5 menit |
| 3 | **SMELL-04** Ganti magic string navItems | `PharmacistLayout.tsx:63-68` | 15 menit |
| 4 | **SMELL-01** Migrasi `console.error` ke `logger` | ~8 file | 30 menit |
| 5 | **SEC-03** Tambah try/catch pada `navigator.clipboard` | 3-4 file | 20 menit |
| 6 | **SMELL-02** Ganti `catch (err: any)` | ~10 file | 30 menit |
| 7 | **DEBT-04** Hapus/tandai widget cuaca hardcoded | `PharmacistSchedule.tsx` | 10 menit |
| 8 | **DEBT-05** Fix CSV header quoting | `helpers.ts:102` | 5 menit |
| 9 | **GOD-02** Refactor test WA duplikasi | `PharmacistSettings.tsx` | 20 menit |
| 10 | **SMELL-05** Type `profileData` & `userData` | 2 file | 30 menit |
| 11 | **GOD-01** Pecah `PatientTopNav` | `PatientTopNav.tsx` | 2-3 jam |
| 12 | **SEC-02** Mitigasi PII di URL (OTP deep link) | `ForgotPasswordPage.tsx` | 1-2 hari |

---
*Dokumen ini dibuat secara otomatis melalui analisis statis kode. Tidak ada perubahan kode yang dilakukan dalam proses audit ini.*
