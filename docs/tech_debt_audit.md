# 🔬 Tech Debt Deep Audit — MESO App

Audit tanggal: `2026-04-25` | Scope: Seluruh `src/`

---

## 1. 🧨 God Class / God Page (Kritis)

### `PharmacistPatientDetail.tsx` — 275 baris, 16.5 KB

File ini melakukan **5 hal berbeda dalam 1 komponen**:

| Responsibility | Seharusnya di |
|---|---|
| Fetching data pasien | ✅ sudah di `usePatientDetail` |
| Fetching + rendering chat | ❌ Harus jadi komponen `<PatientChatPanel>` |
| Rendering symptom cards (4 item) | ❌ Harus jadi komponen `<SymptomCardGrid>` |
| Rendering Recharts trend chart | ❌ Harus jadi komponen `<SymptomTrendChart>` |
| Rendering triage box + intervensi | ❌ Harus jadi komponen `<TriagePanel>` |

**Dampak**: Setiap perubahan kecil (misal: ubah warna chat bubble) memerlukan buka file 275 baris. Sangat sulit di-test dan di-maintain.

---

### `AppRouter.tsx` — 124 baris, 5.3 KB

Router ini melakukan **4 hal berbeda**:

| Responsibility | Seharusnya di |
|---|---|
| Auth state initialization + listener | ❌ Harus di `useAuthInitializer()` hook terpisah |
| `QueryClient` creation + configuration | ❌ Harus di file `queryClient.ts` terpisah |
| `Toaster` global config | ❌ Harus di file `toastConfig.ts` terpisah |
| Route definitions (semua rute) | ✅ OK tapi bisa dipecah ke `PatientRoutes`, `PharmacistRoutes` |

**Dampak**: Setiap kali ada perubahan auth logic, developer harus buka file router → coupling yang tidak perlu.

---

## 2. 🏗️ God Config / Barrel Masalah

### `app.config.ts` — Barrel re-export berbahaya

```typescript
// Saat ini:
export * from './routes.config'   // re-export ROUTES
export * from './grade.config'    // re-export GRADE_CONFIG
```

Ini adalah **barrel export anti-pattern**. Dampak:
- Tree-shaking terganggu — semua config diload sekaligus
- Import di seluruh app bergantung pada satu titik (`@configs/app.config`) yang harus diubah saat ada refactor
- Komentar di file sendiri sudah mengatakan "import langsung dari domain config" — tapi praktek sebenarnya tidak mengikuti ini

**Bukti**: `AppRouter.tsx:4` mengimport dari `@configs/app.config`, bukan `@configs/routes.config`.

---

## 3. 🎨 Architectural Split: Dua Styling System (Kritis)

Ini adalah **tech debt terbesar dari sisi visual**. Dua sistem styling hidup berdampingan:

| File | Approach |
|---|---|
| `PatientDashboard.tsx` | 100% inline `style={{}}` dengan hardcoded hex values |
| `PatientHistory.tsx` | 100% inline `style={{}}` |
| `PatientEducation.tsx` | 100% inline `style={{}}` |
| `ReportForm.tsx` | 100% inline `style={{}}` |
| `PharmacistDashboard.tsx` | 100% Tailwind classes |
| `PharmacistPatients.tsx` | 100% Tailwind classes |
| `PharmacistPatientDetail.tsx` | 100% Tailwind classes |

**Dampak**:
- `#046b5e` (teal pasien) dan `clinical-teal` (apoteker) adalah warna yang sama tapi didefinisikan 2x di 2 tempat berbeda
- Perubahan brand color harus dilakukan di 2 tempat
- Tidak ada konsistensi visual antara portal pasien dan portal apoteker
- Warna seperti `#b90c55`, `#8e24aa`, `#424848` tidak pernah didefinisikan di design system

---

## 4. 🗑️ Orphan Components (Mubazir)

### `QueueItem.tsx` — 3.1 KB, tidak dipakai

Komponen `QueueItem` di `src/features/reports/components/QueueItem.tsx` **tidak digunakan di mana pun** dalam codebase. Sebelumnya digunakan di `PharmacistDashboard.tsx` tapi sudah dihapus dari import. File ini sekarang dead code.

---

## 5. 🏚️ Feature Module Boundary Violation

Semua fitur (`education`, `chat`, `schedules`, `intervent`, `reports`) ada sebagai folder di `src/features/`, **namun seluruh implementasinya ada di dalam `features/reports/`**:

```
src/features/
├── auth/           ✅ — punya pages/, components/, store.ts, types.ts
├── chat/           ❌ — KOSONG (0 file)
├── education/      ❌ — KOSONG (0 file)  
├── intervent/      ❌ — KOSONG (0 file)
├── reports/        ⚠️  — menampung SEMUA fitur lain
└── schedules/      ❌ — KOSONG (0 file)
```

`features/reports/` bukan lagi "reports feature" — dia adalah **God Module** yang berisi:
- Halaman pasien (dashboard, history, education, chat)
- Halaman apoteker (dashboard, patients, detail, education, schedule)
- Semua API hooks untuk semua domain
- Semua shared components

**Dampak**: Penambahan fitur baru selalu masuk ke `/reports/` yang terus membesar.

---

## 6. 🔁 Duplicate Data Transformation Logic

### `useEducation.ts` — Transformasi data duplikat

Fungsi `useEducationMaterials()` (baris 22–32) dan `useFeaturedMaterial()` (baris 93–103) melakukan mapping `snake_case → camelCase` yang **identik**:

```typescript
// Di useEducationMaterials — baris 22-32
return (data || []).map(row => ({
  id: row.id, title: row.title, imageUrl: row.image_url,
  videoUrl: row.video_url, isFeatured: row.is_featured, ...
}))

// Di useFeaturedMaterial — baris 93-103  
return { id: data.id, title: data.title, imageUrl: data.image_url,
  videoUrl: data.video_url, isFeatured: data.is_featured, ... }
```

Harus di-extract ke `mapEducationRow(row)` utility function.

---

## 7. 💉 Mock Data Tertanam di API Layer (Sedang)

`usePatientDetail.ts` baris 56–64 memiliki data mock yang **tertanam di dalam query function** (bukan di level komponen/storybook):

```typescript
age: 52,        // Mock for now
weight: '58kg', // hardcode
height: '158cm',// hardcode
bp: '124/82',   // hardcode
```

**Dampak**: Jika ada pasien nyata yang login, mereka akan melihat berat badan "58kg" bukan berat badan mereka. Ini **potensi data integrity bug** di production.

---

## 8. 🚫 Dead Routes — Fitur Tidak Selesai

`routes.config.ts` mendefinisikan rute yang **tidak ada implementasinya**:

| Route | Path | Status |
|---|---|---|
| `DOCTOR_WATCHLIST` | `/doctor/watchlist` | ❌ Tidak ada halaman |
| `DOCTOR_PATIENT` | `/doctor/patient/:id` | ❌ Tidak ada halaman |
| `ADMIN_DASHBOARD` | `/admin/dashboard` | ❌ Tidak ada halaman |
| `PHARMA_QUEUE` | `/pharma/queue` | ❌ Tidak ada halaman (duplikat dari dashboard?) |
| `PHARMA_CHAT` | `/pharma/chat` | ❌ Tidak ada halaman |
| `PATIENT_SCHEDULE` | `/patient/schedule` | ❌ Tidak ada halaman |

6 dari 21 rute yang terdefinisi adalah dead routes.

---

## Ringkasan Prioritas Refactoring

```
SEGERA (Blocking Production Quality)
├── [P0] Mock vital signs di usePatientDetail → bisa misleading di production
└── [P0] Token CSS hilang (clinical-teal-soft) → visual berantakan

JANGKA PENDEK (Sprint 1-2)
├── [P1] Pecah PharmacistPatientDetail → 4 sub-komponen
├── [P1] Pindahkan auth initializer keluar dari AppRouter
└── [P1] Hapus QueueItem.tsx (dead code)

JANGKA MENENGAH (Sprint 3-4)
├── [P2] Unifikasi styling system (pilih: Tailwind ATAU inline style)
├── [P2] Extract mapEducationRow() utility
└── [P2] Pindahkan fitur ke module yang tepat (chat/, education/, schedules/)

JANGKA PANJANG (Backlog)
├── [P3] Implementasikan dead routes (Doctor, Admin)
├── [P3] Hapus barrel export dari app.config.ts
└── [P3] Tambahkan vitals table ke database schema
```
