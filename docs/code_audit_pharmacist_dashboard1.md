# 🔍 Audit Code — MESO Pharmacist Portal

Audit dilakukan pada: `2026-04-25`  
Scope: Semua file di `src/features/reports/`

---

## 1. Design Token Mismatch (Kritis)

> [!CAUTION]
> Token CSS yang dipakai di TSX **tidak terdaftar** di `index.css`. Tailwind V4 tidak akan men-generate class-nya → tampilan berantakan.

| Token yang Dipakai di TSX | Status di `index.css` | Dampak |
|---|---|---|
| `bg-clinical-teal-soft` | ❌ Tidak ada | Background card tidak muncul |
| `shadow-glow` | ❌ `--shadow-glow` ada tapi tidak didaftarkan sebagai `--shadow-shadow-glow` (key Tailwind V4) | Shadow tidak terapply |
| `shadow-clinical` | ✅ `--shadow-clinical` ada | OK |
| `shadow-clinical-lg` | ✅ `--shadow-clinical-lg` ada | OK |
| `bg-clinical-teal-light` | ✅ `--color-clinical-teal-light` ada | OK |

**Perbaikan**: Tambahkan token yang hilang ke `@theme` di `index.css`.

---

## 2. Non-Standard Tailwind Class (Sedang)

> [!WARNING]
> Beberapa class Tailwind yang dipakai **tidak valid** di versi standar manapun, akan di-ignore oleh compiler.

| Class | File | Catatan |
|---|---|---|
| `pl-13` | `PharmacistLayout.tsx:96`, `PharmacistPatients.tsx:30` | Tidak ada `pl-13` di Tailwind standar (step 4, 8, 12, 16). Ganti ke `pl-12` atau `pl-14` |
| `py-4.5` | `PharmacistPatients.tsx:30`, `PharmacistPatientDetail.tsx:259` | Tidak valid. Ganti ke `py-[18px]` atau `py-4` |

---

## 3. Unused Import (Minor)

> [!NOTE]
> Import yang tidak digunakan dapat menyebabkan warning TypeScript dan mempersulit pembacaan kode.

| File | Import Tidak Terpakai |
|---|---|
| `PharmacistEducation.tsx:4` | `import type { EducationMaterial } from '../types'` — tipe ini tidak digunakan di dalam file |
| `PharmacistSchedule.tsx:4` | `isFuture` dari `date-fns` — tidak dipakai di dalam file |

---

## 4. Hardcoded Data / Data Palsu (Sedang)

> [!WARNING]
> Beberapa data masih hardcode di UI, yang akan membingungkan user di production.

| File | Baris | Masalah |
|---|---|---|
| `PharmacistDashboard.tsx:211` | `MajorQueueCard` | "Siklus 3 / 8" hardcode, seharusnya dari `report` |
| `PharmacistDashboard.tsx:130` | Minor table | "Siklus 1" hardcode untuk semua baris |
| `PharmacistEducation.tsx` | Kartu konten | "1.2k Views", "2 Hari Lalu", "12:45" — semua hardcode |
| `usePatientDirectory.ts:74-75` | stats | `scheduledThisWeek: 156` dan `completedEducation: 892` masih mock |

---

## 5. Masalah Struktur Tata Letak di Dashboard (Penyebab Utama Berantakan)

> [!CAUTION]
> Ini kemungkinan besar **penyebab utama** tampilan berantakan.

Urutan komponen di `PharmacistPatients.tsx` tidak konsisten:
- **Baris 22–44**: Search bar + tombol Filter/Export (di atas)
- **Baris 46–53**: `<header>` dengan `<h1>` (di bawah search bar)

Ini **terbalik** dari konvensi standar — normalnya `<header>` dengan judul ada di atas, search bar di bawahnya.

Di `PharmacistDashboard.tsx`:
- Header tampil dengan `items-end` yang menyebabkan alignment tidak rata jika judul panjang.

---

## 6. `shadow-glow` tidak terdaftar dengan benar (Tailwind V4)

Di `index.css` baris 50:
```css
--shadow-glow: 0 0 20px rgba(8, 131, 116, 0.1);
```

Di Tailwind V4, untuk shadow custom bisa dipakai via `@theme` harus pakai format `--shadow-*` → akan men-generate utility `shadow-*`. Tapi `shadow-glow` akan jadi `var(--shadow-shadow-glow)` bukan `var(--shadow-glow)`. **Ini bug** — shadowing pada logo dan avatar di sidebar tidak terapply.

---

## 7. Ghost Component di `PharmacistSchedule.tsx`

```tsx
// Baris 168-170
function Activity({ size, className }: { size?: number, className?: string }) {
  return <Clock size={size} className={className} />
}
```

Ini adalah **shadowing** dari import `Activity` di baris 2 yang seharusnya dari lucide-react. Karena ada local function bernama `Activity`, icon asli dari lucide tidak bisa diakses. Sebaiknya import `Activity` dari lucide-react secara langsung dan hapus fungsi lokal ini.

---

## Prioritas Perbaikan

| # | Masalah | Dampak Visual | File |
|---|---|---|---|
| 🔴 1 | Token `clinical-teal-soft` tidak ada | Background card hilang | `index.css` |
| 🔴 2 | Token `shadow-glow` tidak valid di V4 | Glow hilang | `index.css` |
| 🟠 3 | Urutan layout `PharmacistPatients.tsx` terbalik | UX membingungkan | `PharmacistPatients.tsx` |
| 🟠 4 | Class `pl-13` dan `py-4.5` tidak valid | Input icon offset | `PharmacistLayout.tsx`, `PharmacistPatients.tsx` |
| 🟡 5 | Hardcode data di Dashboard dan Edu | Misleading di production | `PharmacistDashboard.tsx` |
| 🟡 6 | Ghost `Activity` function di Schedule | Shadow import | `PharmacistSchedule.tsx` |
| 🟢 7 | Unused import `EducationMaterial`, `isFuture` | Warning TS | `PharmacistEducation.tsx`, `PharmacistSchedule.tsx` |
