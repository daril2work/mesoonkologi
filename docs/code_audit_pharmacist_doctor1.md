# Code Audit — Pharmacist & Doctor Portal
**MESO-App · d:/MESO-app**
**Tanggal Audit:** 2026-05-01
**Auditor:** Antigravity AI
**Scope:** `src/features/reports/` (Pharmacist) · `src/features/clinician/` (Doctor)

---

## Ringkasan Eksekutif

| Kategori | Jumlah Temuan |
|---|---|
| 🔴 Critical | 4 |
| 🟠 Major | 8 |
| 🟡 Minor | 9 |
| ℹ️ Rekomendasi | 6 |
| **Total** | **27** |

---

## 🔴 CRITICAL — Wajib Diperbaiki Segera

### C-01 · Inconsistent State Management: `useClinicianWatchlist` & `useClinicianHistory`

**File:** `src/features/clinician/api/useClinicianWatchlist.ts` · `useClinicianHistory.ts`

Kedua hook ini menggunakan pola `useState + useEffect + manual fetch` bukannya `@tanstack/react-query`. Ini inkonsistensi arsitektur yang serius karena:

1. **Tidak ada cache** — setiap render/navigasi memicu network request baru.
2. **State tidak terstandar** — berbeda dari 10+ hooks lain yang sudah pakai TanStack Query.
3. **Race condition** — `fetchWatchlist` bisa dipanggil berulang saat realtime event tiba sebelum response sebelumnya selesai.
4. **`useClinicianHistory` tidak punya realtime listener** — data tidak ter-update otomatis setelah eskalasi diselesaikan.

```typescript
// ❌ CURRENT: useState + useEffect manual
const [watchlist, setWatchlist] = useState<SymptomReport[]>([])
useEffect(() => { fetchWatchlist() }, [])

// ✅ SEHARUSNYA: TanStack Query + invalidation
export function useClinicianWatchlist() {
  const queryClient = useQueryClient()
  const query = useQuery({
    queryKey: ['clinicianWatchlist'],
    queryFn: async () => { /* fetch logic */ },
    refetchInterval: 30000,
  })
  useEffect(() => {
    const channel = supabase.channel('clinician-watchlist')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'symptom_reports' }, () => {
        queryClient.invalidateQueries({ queryKey: ['clinicianWatchlist'] })
      }).subscribe()
    return () => { supabase.removeChannel(channel) }
  }, [queryClient])
  return { watchlist: query.data ?? [], isLoading: query.isLoading }
}
```

> **Dampak:** Memory leak potensial, UX tidak konsisten, data stale setelah intervensi.

---

### C-02 · Cache Invalidation Mismatch: `useClinicianIntervention`

**File:** `src/features/clinician/api/useClinicianIntervention.ts`, baris 40

```typescript
// ❌ Query key salah — tidak ada cache dengan key ini
queryClient.invalidateQueries({ queryKey: ['clinician-watchlist'] })

// ✅ SEHARUSNYA (setelah C-01 diperbaiki):
queryClient.invalidateQueries({ queryKey: ['clinicianWatchlist'] })
```

Karena `useClinicianWatchlist` menggunakan pola manual state (bukan TQ), key `'clinician-watchlist'` tidak ada di cache. Setelah dokter menyelesaikan eskalasi, **watchlist tidak akan ter-refresh**. User harus reload halaman untuk melihat perubahan.

> **Dampak:** UX rusak — data di layar tidak mencerminkan state database setelah aksi dokter.

---

### C-03 · Hardcoded Data Klinis di `ClinicianPatientDetail`

**File:** `src/features/clinician/pages/ClinicianPatientDetail.tsx`, baris 148-153 & 270-281

```tsx
// ❌ Catatan pasien HARDCODED — tidak dari database
<p>"Nyeri pada area dada kiri mulai meningkat di malam hari..."</p>

// ❌ Aktivitas terakhir HARDCODED
<p>Pemberian Kemoterapi</p>
<p>Kemarin, 09:30 • Perawat Maya</p>
```

Data ini tampil sama untuk **semua pasien**. Dalam konteks klinis ini adalah **kesalahan medis potensial** — dokter bisa membaca catatan pasien yang salah.

> **Dampak:** Data klinis menyesatkan. Risk medis tinggi.

---

### C-04 · API Token Fonnte Exposed di Frontend Bundle

**File:** `src/services/fonnte.service.ts`, baris 6

```typescript
// ❌ Token dikompilasi ke dalam bundle JS yang bisa dilihat di DevTools
const FONNTE_API_TOKEN = import.meta.env.VITE_FONNTE_TOKEN || 'YOUR_FONNTE_TOKEN'
headers: { 'Authorization': FONNTE_API_TOKEN }
```

`VITE_*` env variables dikompilasi ke dalam JavaScript bundle yang bisa diinspeksi siapa saja. Token Fonnte yang valid bisa dicuri untuk mengirim pesan WA massal.

**Solusi:** Pindahkan ke Supabase Edge Function:

```typescript
// ✅ supabase/functions/send-whatsapp/index.ts
// Frontend hanya: await supabase.functions.invoke('send-whatsapp', { body: { target, message } })
```

> **Dampak:** Security breach — token API bocor ke publik.

---

## 🟠 MAJOR — Harus Diperbaiki dalam Sprint Berikutnya

### M-01 · `PharmacistReportDetail` Adalah Stub Kosong

**File:** `src/features/reports/pages/PharmacistReportDetail.tsx`

Seluruh file hanya 16 baris berisi:
```tsx
<p className="...">Sedang dikembangkan...</p>
```

Route `PHARMA_REPORT_DETAIL` terdaftar di `AppRouter.tsx` dan tombol "Detail" di beberapa card mengarah ke sini, namun halaman sama sekali tidak fungsional.

> **Dampak:** Fitur inti review laporan tidak bisa diakses lewat satu jalur navigasi.

---

### M-02 · `usePatientStats` — Data Placeholder Tidak Dihapus

**File:** `src/features/reports/api/usePatientDirectory.ts`, baris 53-54

```typescript
return {
  total: total ?? 0,
  critical: critical ?? 0,
  scheduledThisWeek: 0,   // ❌ HARDCODED ZERO
  completedEducation: 0   // ❌ HARDCODED ZERO
}
```

Dua dari empat stats card di `PharmacistPatients.tsx` selalu "0".

---

### M-03 · `usePharmacistSchedules` — Tidak Filter Masa Depan

**File:** `src/features/reports/api/usePatientSchedule.ts`, baris 44-65

Query mengambil **semua jadwal** tanpa filter tanggal. Calendar akan penuh jadwal historis lama, dan `upcomingSchedules` difilter client-side yang tidak efisien.

```typescript
// ✅ Tambahkan filter di query level DB:
.gte('schedule_date', new Date().toISOString())
.limit(50)
```

---

### M-04 · Kapasitas Klinik Hardcoded "85%"

**File:** `src/features/reports/pages/PharmacistSchedule.tsx`, baris 210-213

```tsx
<h4>85%</h4>  // ❌ Tidak dari data riil
<div className="h-full bg-primary w-[85%]"></div>
```

---

### M-05 · Filter Bangsal & Siklus di `ClinicianWatchlist` Non-Fungsional

**File:** `src/features/clinician/pages/ClinicianWatchlist.tsx`, baris 46-59

```tsx
<select>  {/* ❌ Tidak ada value dan onChange */}
  <option>Semua Bangsal</option>
  <option>Paviliun Melati</option>
</select>
```

Filter tidak terhubung ke state apapun.

---

### M-06 · Search & Filter di `ClinicianHistory` Non-Fungsional

**File:** `src/features/clinician/pages/ClinicianHistory.tsx`, baris 30-38

Input pencarian tidak memiliki `value` atau `onChange`. Tombol "Filter Tanggal" tidak berfungsi.

> **Dampak:** Dokter tidak bisa mencari pasien dalam riwayat eskalasi.

---

### M-07 · `QoLTrendChart` Tidak Menggunakan Data Pasien

**File:** `src/features/clinician/pages/ClinicianPatientDetail.tsx`, baris 172

```tsx
<QoLTrendChart />  // ❌ Tidak ada props — chart menampilkan data statis/dummy
```

Chart QoL harus menerima data `trends` dari `patient.trends` yang sudah tersedia.

---

### M-08 · `usePatientDetail` — Vitals Dasar Selalu Placeholder

**File:** `src/features/reports/api/usePatientDetail.ts`, baris 87-89

```typescript
age: 0,      // "Placeholder until DB updated"
weight: '—',
height: '—',
bp: '—',
```

Komentar "until DB updated" menunjukkan ini TODO yang belum diselesaikan. Field ini tampil di `PatientHeaderCard` dan `ClinicianPatientDetail` untuk semua pasien.

---

## 🟡 MINOR — Technical Debt & Code Quality

### N-01 · `console.error` Tersisa di Kode Produksi

**File:** `useClinicianWatchlist.ts` L65, `useClinicianHistory.ts` L50, `PharmacistSchedule.tsx` L44

```typescript
// ❌ 3 lokasi masih pakai console.error
console.error('Error fetching watchlist:', error)

// ✅ Seharusnya menggunakan structured logger yang sudah ada:
logger.error('[ClinicianWatchlist] Fetch Error', error, { feature: 'clinician' })
```

---

### N-02 · `as any` Type Assertion Berulang

**File:** `usePatientSchedule.ts` L54, `PharmacistDashboard.tsx` L81, `PharmacistPatients.tsx` L81, `PharmacistEducation.tsx` L85

```typescript
// ❌ 4+ lokasi menggunakan any:
.map((item: any) => ...)
setFilterStatus(opt.value as any)
const handleToggleFeatured = (item: any) => ...
```

Ini menghilangkan type safety TypeScript.

---

### N-03 · Path Hardcoded di `PharmacistLayout` navItems

**File:** `src/features/reports/components/PharmacistLayout.tsx`, baris 34-38

```typescript
// ❌ Path hardcoded (sementara ClinicianLayout sudah pakai ROUTES)
{ path: '/pharma/dashboard' }
{ path: '/pharma/patients' }

// ✅ Seharusnya:
{ path: ROUTES.PHARMA_DASHBOARD }
{ path: ROUTES.PHARMA_PATIENTS }
```

---

### N-04 · Pagination Dummy di Beberapa Halaman

**File:** `PharmacistPatients.tsx` L257-268, `ClinicianWatchlist.tsx` L207-213

Tombol pagination (1, 2, 3) tidak memiliki state atau logika. Semua data sudah diload sekaligus. Misleading bagi user.

---

### N-05 · `unreadCount` di `useNotifications` Tidak Akurat

**File:** `src/features/reports/hooks/useNotifications.ts`, baris 72

```typescript
// Semua laporan pending dihitung sebagai "baru",
// bahkan yang sudah ada sebelum apoteker login
const totalUnread = (queue?.length || 0) + unreadMessagesCount
```

---

### N-06 · Import Alias Tidak Konsisten di Clinician Feature

**File:** `useClinicianWatchlist.ts` L2, `useClinicianHistory.ts` L2, `useClinicianIntervention.ts` L2

```typescript
// ❌ Path relatif manual (fragile jika folder dipindah):
import { supabase } from '../../../lib/supabase'

// ✅ Seharusnya menggunakan alias seperti fitur lain:
import { supabase } from '@lib/supabase'
```

---

### N-07 · Form `PharmacistSchedule` Tidak Punya Input `notes`

**File:** `src/features/reports/pages/PharmacistSchedule.tsx`, baris 17-24

Field `notes` ada di `formData` state namun tidak ada `<input>` di form modal. `notes` selalu dikirim sebagai `''`.

---

### N-08 · Auto-send Chat Setelah Eskalasi Tanpa Error Handling

**File:** `src/features/reports/components/EscalationActionPanel.tsx`, baris 56-59

```typescript
onSuccess: () => {
  sendMessage.mutate({
    receiverId: patientId,
    content: '...',
  })
  // ❌ Fire-and-forget — jika gagal, pasien tidak mendapat notifikasi chat
}
```

---

### N-09 · `useUpdateEducation` Tidak Mengirim Field `content`

**File:** `src/features/reports/api/useEducation.ts`, baris 76-88

```typescript
.update({
  title: updates.title,
  description: updates.description,
  // content: updates.content,  ← MISSING
  ...
})
```

---

## ℹ️ REKOMENDASI ARSITEKTUR

### R-01 · Supabase RPC untuk `usePatientStats` Aggregate

Buat 1 RPC/View di Supabase untuk aggregate stats daripada 2 query paralel:
```sql
CREATE OR REPLACE VIEW patient_dashboard_stats AS
SELECT
  COUNT(*) FILTER (WHERE role = 'patient') AS total_patients,
  COUNT(*) FILTER (WHERE is_sentinel_alert = true AND status = 'pending') AS critical_count
...
```

### R-02 · Buat Shared `<StatusBadge>` Component

Logika pewarnaan status (`Stabil` → teal, `Observasi` → amber, `Butuh Tindakan` → error) duplikat di minimal 3 file. Ekstrak ke satu komponen.

### R-03 · Fix Inkonsistensi Total Siklus (6 vs 8)

**File:** `ClinicianPatientDetail.tsx`, baris 71 vs 85

```tsx
// Baris 71: "Siklus {patient.currentCycle}/6"  ← Hardcoded 6
// Baris 85: "Siklus {patient.currentCycle}/8"  ← Hardcoded 8
```

Nilai total siklus harus dari data pasien atau satu konstanta global.

### R-04 · Tambahkan Error Boundary di Route Level Klinis

Saat ini tidak ada Error Boundary. Jika `usePatientDetail` throw, seluruh halaman crash tanpa pesan ramah.

### R-05 · Optimistic Update di `useSubmitIntervention`

Setelah apoteker submit intervensi, ada jeda visible menunggu refetch. Gunakan optimistic update TanStack Query untuk UX lebih responsif.

### R-06 · Fonnte — Disable Tombol Jika Token Tidak Terkonfigurasi

Saat ini error hanya muncul setelah user klik. Tombol "Kirim Reminder WA" seharusnya `disabled` dengan tooltip jika token belum dikonfigurasi.

---

## Matriks Prioritas Remediation

| ID | Temuan | Severity | Effort | Impact |
|---|---|---|---|---|
| C-01 | Migrasi useClinicianWatchlist/History ke TanStack Query | 🔴 | Medium | Arsitektur |
| C-02 | Fix cache invalidation key di useClinicianIntervention | 🔴 | Low | UX |
| C-03 | Hapus hardcoded patient notes & activity log | 🔴 | Low | Data Integrity |
| C-04 | Pindahkan Fonnte call ke Supabase Edge Function | 🔴 | High | Security |
| M-01 | Implementasi PharmacistReportDetail | 🟠 | High | Feature |
| M-02 | Isi scheduledThisWeek & completedEducation dari DB | 🟠 | Medium | Data |
| M-03 | Filter schedule_date di usePharmacistSchedules | 🟠 | Low | Performance |
| M-04 | Hapus kapasitas klinik hardcoded 85% | 🟠 | Low | Data |
| M-05 | Implementasi filter bangsal di ClinicianWatchlist | 🟠 | Medium | Feature |
| M-06 | Implementasi search di ClinicianHistory | 🟠 | Low | Feature |
| M-07 | Pass patient data ke QoLTrendChart | 🟠 | Medium | Data |
| M-08 | Fetch age/weight/height/BP dari profil DB | 🟠 | Medium | Data |
| N-01 | Ganti console.error → logger.error (3 lokasi) | 🟡 | Low | Quality |
| N-02 | Eliminasi `as any` assertions (4+ lokasi) | 🟡 | Medium | TypeSafety |
| N-03 | Gunakan ROUTES constants di PharmacistLayout | 🟡 | Low | Quality |
| N-04 | Hapus atau implementasi pagination | 🟡 | Medium | UX |
| N-05 | Fix logika unreadCount di useNotifications | 🟡 | Low | UX |
| N-06 | Gunakan @lib/supabase alias di clinician hooks | 🟡 | Low | Quality |
| N-07 | Tambah input Notes di PharmacistSchedule form | 🟡 | Low | Feature |
| N-08 | Tambah error handling sendMessage post-eskalasi | 🟡 | Low | Reliability |
| N-09 | Tambah `content` ke useUpdateEducation | 🟡 | Low | Data |

---

## Kekuatan Codebase (Hal yang Sudah Baik)

✅ **Arsitektur Modular yang Solid** — Pembagian `pages/`, `api/`, `components/`, `hooks/` konsisten di `features/reports/`.

✅ **God Component Refactored** — `PharmacistPatientDetail` sudah dipecah jadi orchestrator bersih dengan sub-komponen domain-specific (PatientHeaderCard, SymptomReportGrid, EscalationActionPanel, dll).

✅ **Domain-Driven Constants** — `REPORT_SCHEMA` dan `SYMPTOM_KEYS` adalah single source of truth yang sangat baik untuk logika klinis.

✅ **Realtime + TanStack Query Pattern** — `useChat` dan `usePharmacistQueue` menunjukkan pola yang tepat: fetch awal via `useQuery`, update via Supabase Realtime. Perlu dikonsistenkan ke `clinician/api/`.

✅ **Structured Logger** — `logger.debug/info/error` sudah ada dan digunakan di beberapa tempat kritis.

✅ **Sentinel Detection Terpusat** — `detectSentinel()` dan `autoGrade()` dipanggil di layer API, memastikan logika klinis konsisten.

✅ **ConfirmationModal untuk Aksi Destruktif** — Sudah menggunakan modal konfirmasi (bukan `window.confirm`) di eskalasi dan delete education.

✅ **`usePatientFilter` sebagai Custom Hook** — Filter/sort logic sudah diekstrak dari halaman, mengikuti single responsibility principle.

---

*Audit ini dibuat berdasarkan review statis kode. Disarankan melengkapi dengan integration tests dan Supabase RLS audit terpisah.*
