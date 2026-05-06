# 📋 Master Remediation Plan — MESO App
### Gabungan: Code Audit (Pharmacist Portal) + Tech Debt Audit (Full Codebase)

> Dibuat: `2026-04-25` | Sumber: `audit_report.md` + `tech_debt_audit.md`

---

## Ringkasan Eksekutif

Audit menemukan **15 isu** yang dikategorikan dalam 4 tingkat prioritas. Isu-isu ini berasal dari dua sumber utama:

| Sumber | Scope | Isu Ditemukan |
|---|---|---|
| Code Audit (Pharmacist Portal) | `src/features/reports/` | 7 isu (CSS, layout, import) |
| Tech Debt Audit (Full Codebase) | Seluruh `src/` | 8 isu (arsitektur, modul, data) |

Isu-isu ini digabung dan de-duplikasi, lalu diprioritaskan berdasarkan **dampak terhadap user di production** × **risiko regresi jika dibiarkan**.

---

## 🔴 P0 — Blocking (Harus Diperbaiki Sekarang)

> [!CAUTION]
> Isu P0 langsung mempengaruhi tampilan atau kebenaran data untuk user nyata di production.

### P0-1 · Token CSS Hilang: `clinical-teal-soft` & `shadow-glow`
- **Sumber**: Code Audit #1, #6
- **File**: `src/index.css`
- **Masalah**: `bg-clinical-teal-soft` dipakai di 5 file halaman tapi tidak terdaftar di `@theme`. Background card avatar, symptom icon, dan chat header tidak muncul. `shadow-glow` juga tidak mengikuti format Tailwind V4 (`--shadow-*`).
- **Fix**: Tambahkan ke `@theme` di `index.css`:
  ```css
  --color-clinical-teal-soft: #e2f4f1;   /* alias dari teal-light */
  --shadow-glow: 0 0 20px rgba(8, 131, 116, 0.1);
  ```
- **Estimasi**: 5 menit

### P0-2 · Mock Vital Signs di API Layer
- **Sumber**: Tech Debt #7
- **File**: `src/features/reports/api/usePatientDetail.ts` baris 60–63
- **Masalah**: `age: 52`, `weight: '58kg'`, `bp: '124/82'` hardcode di dalam query function. Setiap pasien yang login akan melihat data ini, bukan data mereka sendiri.
- **Fix**: Tambahkan kolom `age`, `weight_kg`, `height_cm`, `blood_pressure` ke tabel `profiles` di Supabase. Sampai DB siap, tampilkan `'—'` bukan data palsu.
- **Estimasi**: 30 menit (DB migration) + 10 menit (code)

---

## 🟠 P1 — High Priority (Sprint Ini)

> [!WARNING]
> Isu P1 menyebabkan bug visual yang nyata atau coupling arsitektur yang berisiko tinggi.

### P1-1 · Class Tailwind Tidak Valid: `pl-13` dan `py-4.5`
- **Sumber**: Code Audit #2
- **File**: `PharmacistLayout.tsx:96`, `PharmacistPatients.tsx:30`, `PharmacistPatientDetail.tsx:259`
- **Masalah**: Class tidak dikenali Tailwind → input search icon tidak ter-offset, padding input tidak sesuai desain.
- **Fix**:
  - `pl-13` → `pl-[52px]` (13 × 4px = 52px)
  - `py-4.5` → `py-[18px]` (4.5 × 4px = 18px)
- **Estimasi**: 10 menit

### P1-2 · Layout Terbalik di `PharmacistPatients.tsx`
- **Sumber**: Code Audit #5
- **File**: `src/features/reports/pages/PharmacistPatients.tsx` baris 22–53
- **Masalah**: Search bar + tombol filter muncul **di atas** judul halaman `<h1>`, padahal seharusnya sebaliknya. Secara semantik dan visual ini terbalik.
- **Fix**: Pindahkan blok `<header>` (baris 46–53) ke sebelum blok search bar (baris 22–44).
- **Estimasi**: 5 menit

### P1-3 · Ghost Component `Activity` di PharmacistSchedule
- **Sumber**: Code Audit #7
- **File**: `src/features/reports/pages/PharmacistSchedule.tsx` baris 168–170
- **Masalah**: Ada fungsi lokal bernama `Activity` yang men-shadow import lucide-react, menyebabkan icon Activity tidak bisa dipakai secara langsung.
- **Fix**: Hapus fungsi lokal, tambahkan `Activity` ke import dari `lucide-react` di baris 1.
- **Estimasi**: 5 menit

### P1-4 · God Class: Pecah `PharmacistPatientDetail.tsx`
- **Sumber**: Tech Debt #1
- **File**: `src/features/reports/pages/PharmacistPatientDetail.tsx` (275 baris, 16.5 KB)
- **Masalah**: Satu file melakukan 5 responsibilities berbeda.
- **Fix**: Ekstrak ke 4 komponen baru:

  | Komponen Baru | Lokasi |
  |---|---|
  | `<SymptomCardGrid />` | `components/SymptomCardGrid.tsx` |
  | `<SymptomTrendChart />` | `components/SymptomTrendChart.tsx` |
  | `<TriagePanel />` | `components/TriagePanel.tsx` |
  | `<PatientChatPanel />` | `components/PatientChatPanel.tsx` |

- **Estimasi**: 1.5–2 jam

### P1-5 · Hapus Dead Code: `QueueItem.tsx`
- **Sumber**: Tech Debt #4
- **File**: `src/features/reports/components/QueueItem.tsx`
- **Masalah**: Komponen tidak digunakan di mana pun sejak import dihapus dari Dashboard.
- **Fix**: Hapus file. Jika ingin dipakai kembali, reimplementasi dengan design system terbaru.
- **Estimasi**: 2 menit

---

## 🟡 P2 — Medium Priority (Sprint Berikutnya)

> [!NOTE]
> Isu P2 adalah tech debt struktural yang tidak crash di production tapi menghambat pengembangan dan meningkatkan bug risk seiring waktu.

### P2-1 · Hardcode Data di UI Farmasi
- **Sumber**: Code Audit #4
- **File**: `PharmacistDashboard.tsx`, `PharmacistEducation.tsx`, `usePatientDirectory.ts`

  | Lokasi | Nilai Hardcode | Fix |
  |---|---|---|
  | `MajorQueueCard` baris 211 | `"Siklus 3 / 8"` | Ambil dari `report.cycleInfo` atau API |
  | Minor table baris 130 | `"Siklus 1"` | Join dengan data profil pasien |
  | Education cards | `"1.2k Views"`, `"2 Hari Lalu"`, `"12:45"` | Tambahkan kolom `views`, `duration`, `updated_at` ke DB |
  | `usePatientDirectory.ts:74-75` | `scheduledThisWeek: 156`, `completedEducation: 892` | Query dari tabel `schedules` dan `education_progress` |

- **Estimasi**: 2–3 jam (termasuk query DB)

### P2-2 · Unifikasi Styling System
- **Sumber**: Tech Debt #3
- **Masalah**: Portal pasien (4 halaman) pakai `style={{}}` inline dengan hex hardcode. Portal apoteker pakai Tailwind. Ini berarti warna yang sama didefinisikan di 2 tempat.
- **Keputusan yang diperlukan**: Pilih satu approach.
  - **Opsi A** (Direkomendasikan): Migrate portal pasien ke Tailwind + design tokens yang sudah ada
  - **Opsi B**: Biarkan dual-system tapi tambahkan CSS variables di `:root` untuk warna pasien
- **File yang perlu dimigrasi** (Opsi A):
  - `PatientDashboard.tsx` (11.3 KB)
  - `PatientEducation.tsx` (11.4 KB)
  - `PatientHistory.tsx` (5.8 KB)
  - `ReportForm.tsx` (7.2 KB)
- **Estimasi**: 4–6 jam

### P2-3 · Extract Duplikasi Transformasi Data: `mapEducationRow()`
- **Sumber**: Tech Debt #6
- **File**: `src/features/reports/api/useEducation.ts`
- **Masalah**: Logic mapping `snake_case → camelCase` identik ditulis 2x.
- **Fix**:
  ```typescript
  // Tambahkan helper di atas file:
  function mapEducationRow(row: any): EducationMaterial {
    return {
      id: row.id, title: row.title, description: row.description,
      content: row.content, category: row.category,
      imageUrl: row.image_url, videoUrl: row.video_url,
      isFeatured: row.is_featured, createdAt: row.created_at
    }
  }
  // Gunakan di useEducationMaterials() dan useFeaturedMaterial()
  ```
- **Estimasi**: 15 menit

### P2-4 · Unused Imports
- **Sumber**: Code Audit #3
- **File**: `PharmacistEducation.tsx:4`, `PharmacistSchedule.tsx:4`
- **Fix**:
  - Hapus `import type { EducationMaterial } from '../types'` di Education (tidak dipakai)
  - Hapus `isFuture` dari import `date-fns` di Schedule
- **Estimasi**: 5 menit

### P2-5 · Pisahkan Responsibilities di `AppRouter.tsx`
- **Sumber**: Tech Debt #1
- **File**: `src/app/AppRouter.tsx`
- **Masalah**: Router sekaligus menangani auth init, QueryClient config, dan Toaster config.
- **Fix**: Ekstrak 3 hal:
  ```
  src/
  ├── app/
  │   ├── AppRouter.tsx      (rute saja)
  │   ├── queryClient.ts     (QueryClient instance + config)
  │   └── toastConfig.ts     (Toaster options)
  └── hooks/
      └── useAuthInitializer.ts  (getSession + onAuthStateChange)
  ```
- **Estimasi**: 45 menit

---

## 🟢 P3 — Low Priority (Backlog)

> Isu P3 adalah utang arsitektur jangka panjang yang tidak mempengaruhi user saat ini tapi akan menjadi penghalang besar saat aplikasi berkembang.

### P3-1 · God Module: Pindahkan Fitur ke Module yang Tepat
- **Sumber**: Tech Debt #5
- **Masalah**: `features/reports/` menampung semua fitur. Folder `chat/`, `education/`, `schedules/`, `intervent/` kosong.
- **Target struktur**:
  ```
  src/features/
  ├── auth/          ✅ (sudah benar)
  ├── chat/          → pindahkan PatientChat.tsx + useChat.ts
  ├── education/     → pindahkan PatientEducation.tsx + PharmacistEducation.tsx + useEducation.ts
  ├── schedules/     → pindahkan PharmacistSchedule.tsx + usePatientSchedule.ts
  ├── patients/      → pindahkan semua halaman & API pasien
  └── reports/       → hanya laporan (ReportForm, PatientHistory, usePatientReports)
  ```
- **Estimasi**: 3–4 jam (perlu update semua import path)

### P3-2 · Hapus Barrel Export di `app.config.ts`
- **Sumber**: Tech Debt #2
- **Fix**: Update semua consumer untuk import langsung dari domain config:
  ```typescript
  // Sebelum (semua tempat):
  import { ROUTES } from '@configs/app.config'
  // Sesudah:
  import { ROUTES } from '@configs/routes.config'
  ```
- **Estimasi**: 30 menit

### P3-3 · Implementasikan Dead Routes
- **Sumber**: Tech Debt #8
- **Rute yang perlu halaman**: `/doctor/watchlist`, `/admin/dashboard`, `/pharma/chat`, `/patient/schedule`
- **Estimasi**: Per halaman ~2–4 jam

### P3-4 · Tambahkan Vitals ke Database Schema
- **Sumber**: Tech Debt #7 (lanjutan P0-2)
- **Fix**: Buat migration baru untuk kolom `age`, `weight_kg`, `height_cm`, `blood_pressure` di tabel `profiles`, atau buat tabel `patient_vitals` tersendiri.
- **Estimasi**: 1–2 jam (migration + update RLS + update API)

---

## 📅 Roadmap Eksekusi

```
MINGGU INI
├── [P0-1] Fix CSS token (5 menit)                    ← MULAI DARI SINI
├── [P0-2] Fix mock vitals di API (40 menit)
├── [P1-1] Fix class Tailwind invalid (10 menit)
├── [P1-2] Fix layout terbalik Patients (5 menit)
├── [P1-3] Fix ghost Activity component (5 menit)
└── [P1-5] Hapus QueueItem.tsx (2 menit)

SPRINT BERIKUTNYA
├── [P1-4] Pecah PharmacistPatientDetail (2 jam)
├── [P2-1] Fix hardcode data Dashboard (3 jam)
├── [P2-3] Extract mapEducationRow() (15 menit)
├── [P2-4] Hapus unused imports (5 menit)
└── [P2-5] Pecah AppRouter responsibilities (45 menit)

JANGKA MENENGAH
├── [P2-2] Unifikasi styling system (6 jam)
└── [P3-1] Restrukturisasi feature modules (4 jam)

BACKLOG
├── [P3-2] Hapus barrel exports
├── [P3-3] Implementasi dead routes
└── [P3-4] Vitals DB schema
```

---

## Metrik Teknis Saat Ini

| Metrik | Nilai | Target |
|---|---|---|
| File terbesar | `PharmacistPatientDetail.tsx` — 275 baris | < 150 baris |
| File dengan dual-styling | 4 file (portal pasien) | 0 file |
| Token CSS tidak terdefinisi | 2 token | 0 |
| Dead code files | 1 (`QueueItem.tsx`) | 0 |
| Dead routes | 6 dari 21 (28%) | 0 |
| Mock data di API layer | 4 field | 0 |
| Feature modules kosong | 4 dari 5 | 0 |
| Komponen tanpa pemisahan concern | 2 (Detail page, Router) | 0 |
