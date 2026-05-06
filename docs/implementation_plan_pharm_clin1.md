# Implementation Plan: Code Audit Remediation
**Sumber:** `docs/code_audit_pharmacist_doctor1.md`
**Scope:** Pharmacist Portal & Doctor (Clinician) Portal
**Total Temuan:** 27 (4 Critical · 8 Major · 9 Minor · 6 Rekomendasi)

---

## Overview Strategi

Remediation dibagi **4 sprint**, dikerjakan secara berurutan karena ada dependency antar temuan (misal: C-01 harus selesai sebelum C-02 bisa difix).

```
Sprint 1 (Critical)  →  Sprint 2 (Major Features)  →  Sprint 3 (Minor/Debt)  →  Sprint 4 (Architecture)
```

---

## Sprint 1 — Critical Fixes (Prioritas Tertinggi)

> [!CAUTION]
> Temuan C-03 (hardcoded data klinis) dan C-04 (token bocor) adalah **risk medis dan security** — harus diselesaikan sebelum sprint lain dimulai.

### C-01 · Migrasi `useClinicianWatchlist` & `useClinicianHistory` ke TanStack Query

**Dependency:** C-02 bergantung pada selesainya C-01.

#### [MODIFY] `useClinicianWatchlist.ts`
- Hapus `useState` + `useEffect` + `fetchWatchlist` manual
- Ganti dengan `useQuery({ queryKey: ['clinicianWatchlist'], ... })`
- Pindahkan realtime subscription ke `useEffect` yang menggunakan `queryClient.invalidateQueries`
- Tambahkan `refetchInterval: 30_000` sebagai fallback

#### [MODIFY] `useClinicianHistory.ts`
- Sama seperti di atas, migrasi ke `useQuery({ queryKey: ['clinicianHistory'], ... })`
- Tidak perlu realtime listener (history adalah data resolved)

---

### C-02 · Fix Cache Invalidation Key

**Dependency:** Selesaikan C-01 terlebih dahulu.

#### [MODIFY] `useClinicianIntervention.ts` baris 40
```typescript
// Ganti:
queryClient.invalidateQueries({ queryKey: ['clinician-watchlist'] })
// Menjadi:
queryClient.invalidateQueries({ queryKey: ['clinicianWatchlist'] })
```

---

### C-03 · Hapus Hardcoded Data Klinis di `ClinicianPatientDetail`

#### [MODIFY] `ClinicianPatientDetail.tsx`

**Catatan Pasien (baris 148-152):**
- Hapus string statis `"Nyeri pada area dada kiri..."`
- Ganti dengan `patient.clinicalNote` (sudah ada di `SymptomReport` type)
- Jika kosong, tampilkan `<p className="italic text-stone-400">Tidak ada catatan pasien.</p>`

**Aktivitas Terakhir (baris 270-281):**
- Hapus seluruh section "Aktivitas Terakhir" yang hardcoded
- Ganti dengan data dari `patient.trends` yang sudah tersedia (tanggal laporan terakhir)
- Atau sembunyikan section jika data belum ada dari DB

---

### C-04 · Pindahkan Fonnte API Call ke Supabase Edge Function

#### [NEW] `supabase/functions/send-whatsapp/index.ts`
```typescript
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'

serve(async (req) => {
  const { target, message } = await req.json()
  const token = Deno.env.get('FONNTE_TOKEN') // Secret, tidak exposed ke client
  
  const form = new FormData()
  form.append('target', target.replace(/\D/g, ''))
  form.append('message', message)
  form.append('countryCode', '62')

  const res = await fetch('https://api.fonnte.com/send', {
    method: 'POST',
    headers: { Authorization: token! },
    body: form,
  })
  const result = await res.json()
  return new Response(JSON.stringify(result), { headers: { 'Content-Type': 'application/json' } })
})
```

#### [MODIFY] `fonnte.service.ts`
- Hapus `FONNTE_API_TOKEN` dan `fetch` langsung ke Fonnte
- Ganti dengan `supabase.functions.invoke('send-whatsapp', { body: { target, message } })`
- Set secret di Supabase Dashboard: `supabase secrets set FONNTE_TOKEN=<value>`

---

## Sprint 2 — Major Feature Fixes

### M-01 · Implementasi `PharmacistReportDetail`

#### [MODIFY] `PharmacistReportDetail.tsx`
Halaman ini seharusnya menampilkan detail laporan berdasarkan `:id` dari params. Implementasikan menggunakan komponen yang sudah ada:

```tsx
export default function PharmacistReportDetail() {
  const { id } = useParams()
  // Gunakan usePatientDetail dengan reportId
  // Tampilkan: PatientHeaderCard, SymptomReportGrid, EscalationActionPanel
}
```

> [!NOTE]
> Ini bisa di-scope ke tampilan read-only (tanpa aksi eskalasi) karena `PharmacistPatientDetail` sudah handle full workflow. Cukup redirect ke `/pharma/patient/:patientId` jika ada reportId.

---

### M-02 · Isi `usePatientStats` dengan Data Nyata

#### [MODIFY] `usePatientDirectory.ts`
```typescript
// Tambahkan query untuk scheduledThisWeek
const startOfWeek = new Date(); startOfWeek.setDate(startOfWeek.getDate() - startOfWeek.getDay())
const { count: scheduledThisWeek } = await supabase
  .from('patient_schedules')
  .select('*', { count: 'exact', head: true })
  .gte('schedule_date', startOfWeek.toISOString())
  .lte('schedule_date', new Date(startOfWeek.getTime() + 7 * 86400000).toISOString())

// completedEducation: pasien yang menerima ≥1 education material
// (bisa dari tabel baru patient_education_logs atau estimasi)
```

---

### M-03 · Filter `schedule_date` di `usePharmacistSchedules`

#### [MODIFY] `usePatientSchedule.ts` fungsi `usePharmacistSchedules`
```typescript
.gte('schedule_date', new Date(Date.now() - 7 * 86400000).toISOString()) // 7 hari lalu
.order('schedule_date', { ascending: true })
.limit(100)
```

---

### M-04 · Hapus Kapasitas Klinik Hardcoded

#### [MODIFY] `PharmacistSchedule.tsx`
- Hitung kapasitas dari `todaySchedules.length` vs kapasitas maksimal (konstanta, misal 20 slot/hari)
- `const capacityPct = Math.min(100, Math.round((todaySchedules.length / MAX_DAILY_CAPACITY) * 100))`
- Tambahkan `const MAX_DAILY_CAPACITY = 20` di atas komponen

---

### M-05 · Implementasi Filter Bangsal di `ClinicianWatchlist`

#### [MODIFY] `ClinicianWatchlist.tsx`
```tsx
const [wardFilter, setWardFilter] = useState('Semua')
const [cycleFilter, setCycleFilter] = useState('Semua')

const filtered = watchlist?.filter(r => {
  const matchWard = wardFilter === 'Semua' || r.patient.ward === wardFilter
  const matchCycle = cycleFilter === 'Semua' || r.patient.currentCycle === Number(cycleFilter)
  return matchWard && matchCycle
})
```
- Isi opsi bangsal dari data unik watchlist (bukan hardcoded)

---

### M-06 · Implementasi Search di `ClinicianHistory`

#### [MODIFY] `ClinicianHistory.tsx`
```tsx
const [searchTerm, setSearchTerm] = useState('')
const filtered = history.filter(r =>
  r.patient.fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
  r.patient.id.slice(0, 5).toLowerCase().includes(searchTerm.toLowerCase())
)
```
- Hubungkan `<input>` ke `searchTerm` state

---

### M-07 · Pass Data ke `QoLTrendChart`

#### [MODIFY] `QoLTrendChart.tsx`
- Tambahkan props: `trends: { date: string; qolScore: number }[]`
- Map dari `patient.trends` (sudah memiliki field yang relevan)

#### [MODIFY] `ClinicianPatientDetail.tsx` baris 172
```tsx
<QoLTrendChart trends={patient.trends} qolScore={patient.qolScore} />
```

---

### M-08 · Fetch Vitals Dasar dari DB

#### [MODIFY] `usePatientDetail.ts`
- Tambahkan kolom `age`, `weight_kg`, `height_cm` ke tabel `profiles` (via migration SQL)
- Update query `.select('id, full_name, cancer_site, current_cycle, age, weight_kg, height_cm')`
- Map ke `PatientDetailData`:
  ```typescript
  age: profile.age ?? 0,
  weight: profile.weight_kg ? `${profile.weight_kg} kg` : '—',
  height: profile.height_cm ? `${profile.height_cm} cm` : '—',
  ```

**SQL Migration yang dibutuhkan:**
```sql
ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS age INTEGER,
  ADD COLUMN IF NOT EXISTS weight_kg NUMERIC(5,2),
  ADD COLUMN IF NOT EXISTS height_cm NUMERIC(5,2);
```

---

## Sprint 3 — Minor Tech Debt

### N-01 · Ganti `console.error` → `logger.error` (3 lokasi)

| File | Baris | Action |
|---|---|---|
| `useClinicianWatchlist.ts` | L65 | Ganti `console.error` → `logger.error(..., { feature: 'clinician' })` |
| `useClinicianHistory.ts` | L50 | Sama seperti di atas |
| `PharmacistSchedule.tsx` | L44 | Ganti `console.error` → `logger.error(..., { feature: 'schedule' })` |

---

### N-02 · Eliminasi `as any` (4+ lokasi)

| File | Lokasi | Fix |
|---|---|---|
| `usePatientSchedule.ts` L54 | `.map((item: any)` | Buat interface `PharmacistScheduleRow` |
| `PharmacistDashboard.tsx` L81 | `opt.value as any` | Gunakan union type literal |
| `PharmacistPatients.tsx` L81 | `opt.value as any` | Sama seperti di atas |
| `PharmacistEducation.tsx` L85 | `(item: any)` | Gunakan `EducationMaterial` type |

---

### N-03 · Gunakan `ROUTES` Constants di `PharmacistLayout`

#### [MODIFY] `PharmacistLayout.tsx` baris 34-38
```typescript
import { ROUTES } from '@configs/app.config'
const navItems = [
  { label: 'Antrean Laporan', icon: 'assignment', path: ROUTES.PHARMA_DASHBOARD },
  { label: 'Data Pasien', icon: 'group', path: ROUTES.PHARMA_PATIENTS },
  { label: 'Manajemen Edukasi', icon: 'school', path: ROUTES.PHARMA_EDUCATION },
  { label: 'Pengaturan Jadwal', icon: 'calendar_today', path: ROUTES.PHARMA_SCHEDULE },
]
```

---

### N-04 · Hapus Pagination Dummy

#### [MODIFY] `PharmacistPatients.tsx` & `ClinicianWatchlist.tsx`
- Hapus tombol pagination statis (1, 2, 3, ...)
- Ganti dengan teks sederhana: `"Menampilkan X dari Y pasien"` (sudah ada, tinggal hapus tombolnya)
- **Catatan:** Implementasi pagination nyata masuk backlog jika jumlah data > 100

---

### N-05 · Fix `unreadCount` Logic di `useNotifications`

#### [MODIFY] `src/features/reports/hooks/useNotifications.ts`
- Gunakan `createdAt` threshold — hanya hitung laporan yang masuk **sejak 24 jam terakhir** sebagai "baru"
- Atau simpan `lastCheckedAt` di `localStorage` dan bandingkan dengan `queue[0].createdAt`

---

### N-06 · Gunakan `@lib/supabase` Alias di Clinician Hooks

#### [MODIFY] 3 file di `src/features/clinician/api/`
```typescript
// Ganti di useClinicianWatchlist.ts, useClinicianHistory.ts, useClinicianIntervention.ts:
import { supabase } from '../../../lib/supabase'
// → menjadi:
import { supabase } from '@lib/supabase'
```

---

### N-07 · Tambah Input `notes` di `PharmacistSchedule` Modal

#### [MODIFY] `PharmacistSchedule.tsx`
- Tambah `<textarea>` untuk `notes` di antara field Lokasi dan tombol Submit
- Pastikan nilai dikirim via `createScheduleMutation.mutateAsync({ ..., notes: formData.notes })`

---

### N-08 · Error Handling untuk Auto-send Chat Post-Eskalasi

#### [MODIFY] `EscalationActionPanel.tsx` baris 56-59
```typescript
sendMessage.mutate(
  { receiverId: patientId, content: '...' },
  {
    onError: () => toast.error('Notifikasi chat ke pasien gagal dikirim.', { duration: 5000 })
  }
)
```

---

### N-09 · Tambah `content` ke `useUpdateEducation`

#### [MODIFY] `useEducation.ts` baris 76-88
```typescript
.update({
  title: updates.title,
  description: updates.description,
  content: updates.content,  // ← tambahkan ini
  category: updates.category,
  ...
})
```

---

## Sprint 4 — Architecture Improvements

### R-01 · Supabase RPC untuk Patient Stats

**[OPTIONAL]** Jika performa mulai menjadi masalah. Buat `patient_dashboard_stats` view di Supabase.

### R-02 · Shared `<StatusBadge>` Component

#### [NEW] `src/components/ui/StatusBadge.tsx`
```tsx
interface StatusBadgeProps {
  status: 'Stabil' | 'Observasi' | 'Butuh Tindakan'
}
export function StatusBadge({ status }: StatusBadgeProps) { ... }
```
Refactor 3 file yang duplikat logika pewarnaan.

### R-03 · Fix Inkonsistensi Total Siklus

#### [NEW] `src/configs/clinical.constants.ts`
```typescript
export const MAX_CHEMO_CYCLES = 8
```
Ganti semua hardcoded `/6` dan `/8` di `ClinicianPatientDetail.tsx`.

### R-04 · Error Boundary di Route Level

#### [MODIFY] `AppRouter.tsx`
Wrap semua route klinis dengan `<ErrorBoundary>`.

### R-05 · Optimistic Update di `useSubmitIntervention`

Implementasikan `onMutate` / `onError` rollback di `useInterventions.ts`.

### R-06 · Disable Tombol WA Jika Token Tidak Ada

#### [MODIFY] `PharmacistSchedule.tsx`
```tsx
const isWAConfigured = !!import.meta.env.VITE_FONNTE_TOKEN
<button disabled={!isWAConfigured} title={!isWAConfigured ? 'Token WA belum dikonfigurasi' : ''}>
  Kirim Reminder WA
</button>
```

---

## Open Questions

> [!IMPORTANT]
> Perlu keputusan dari tim sebelum Sprint 2 dimulai:

1. **M-01 — PharmacistReportDetail:** Apakah perlu halaman baru, atau cukup redirect ke `PharmacistPatientDetail` yang sudah ada? Jika redirect, route ini bisa dihapus.

2. **M-08 — DB Schema:** Apakah kolom `age`, `weight_kg`, `height_cm` akan ditambahkan ke tabel `profiles`, atau dibuat tabel terpisah `patient_medical_profiles`?

3. **M-02 — completedEducation:** Apakah perlu tabel `patient_education_logs` untuk tracking siapa yang sudah membaca materi? Atau cukup estimasi (jumlah education materials × pasien)?

4. **C-04 — Fonnte Edge Function:** Apakah Supabase project sudah disetup untuk Edge Functions? (Perlu verifikasi `supabase/config.toml`)

---

## Verification Plan

### Per Sprint
- **Sprint 1:** Buka `ClinicianWatchlist` → klik "Selesaikan & Deeskalasi" → watchlist harus hilang tanpa reload. Verifikasi DevTools Network tidak ada request ke `api.fonnte.com` dari browser.
- **Sprint 2:** Buka `ClinicianPatientDetail` dengan 2 pasien berbeda → pastikan catatan pasien berbeda untuk masing-masing. Filter bangsal di watchlist berfungsi. Search history berfungsi.
- **Sprint 3:** Tidak ada `console.error` di DevTools. TypeScript compile tanpa `any` warnings. Pagination dummy hilang.
- **Sprint 4:** ErrorBoundary test dengan pasien ID tidak valid.

### Automated
```bash
npm run build  # Pastikan tidak ada TypeScript error setelah setiap sprint
```
