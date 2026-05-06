# Code Audit — Dashboard Dokter & Apoteker
**Tanggal Audit:** 2026-04-26  
**Auditor:** Antigravity AI  
**Scope:** Dashboard Dokter (`/doctor/*`) & Dashboard Apoteker (`/pharma/*`)  
**Status Proyek:** Development / Post-MVP Sprint

---

## Ringkasan Eksekutif

Secara keseluruhan, arsitektur sudah terbentuk dengan baik dan alur **"Lempar-Tangkap Data"** (eskalasi → intervensi → resolusi) sudah berfungsi end-to-end. Namun, ada beberapa temuan yang perlu ditangani sebelum produksi untuk menjamin **keamanan data klinis, keandalan sistem, dan kualitas kode jangka panjang.**

| Kategori | Severity | Jumlah Temuan |
|---|---|---|
| Keamanan (Security) | 🔴 Kritis | 2 |
| Keandalan Data (Data Integrity) | 🟠 Tinggi | 3 |
| Arsitektur & Maintainability | 🟡 Sedang | 5 |
| UI/UX & Aksesibilitas | 🟢 Rendah | 4 |

---

## 🔴 Temuan Kritis (Security)

### [SEC-01] Tidak Ada RLS (Row Level Security) Guard di Query Dokter

**File:** `useClinicianWatchlist.ts`, `useClinicianHistory.ts`, `useClinicianIntervention.ts`  
**Severity:** 🔴 KRITIS

Query ke Supabase dilakukan **tanpa memvalidasi role pengguna** di level aplikasi. Siapapun yang memiliki token valid (termasuk pasien yang tahu URL) secara teori dapat memanggil hook ini dan mengakses data klinis sensitif.

```typescript
// SEKARANG — Tidak ada filter berdasarkan role
const { data, error } = await supabase
  .from('symptom_reports')
  .select(`*, patient:profiles!patient_id (...)`)
  .eq('escalation_status', 'escalated')
```

**Rekomendasi:**
1. Pastikan **Supabase RLS** diaktifkan untuk tabel `symptom_reports` dengan policy:
   - Dokter hanya bisa `SELECT` laporan yang `escalation_status = 'escalated'` atau milik pasiennya.
   - Pasien hanya bisa `SELECT` laporan milik mereka sendiri (`patient_id = auth.uid()`).
2. Tambahkan guard di level aplikasi pada `AppRouter.tsx` untuk memastikan route `/doctor/*` hanya dapat diakses oleh `role === 'doctor'`.

```sql
-- Contoh RLS Policy yang diperlukan
CREATE POLICY "Dokter bisa baca laporan eskalasi"
ON public.symptom_reports
FOR SELECT
TO authenticated
USING (
  (SELECT role FROM profiles WHERE id = auth.uid()) IN ('doctor', 'pharmacist')
);
```

---

### [SEC-02] Penggunaan `any` Type di Mutation Hook

**File:** `useClinicianIntervention.ts` L19  
**Severity:** 🔴 KRITIS (Keamanan Data)

```typescript
// BERMASALAH
const updates: any = {
  doctor_notes: doctorNotes,
  suggested_regimen: suggestedRegimen,
  updated_at: new Date().toISOString()
}
```

Menggunakan `any` menghilangkan proteksi TypeScript. Seseorang yang memodifikasi kode ini bisa secara tidak sengaja menyuntikkan field berbahaya ke dalam payload update (misal: `patient_id`, `is_sentinel_alert`).

**Rekomendasi:**

```typescript
// SOLUSI — Gunakan interface yang strict
interface ReportUpdatePayload {
  doctor_notes: string
  suggested_regimen?: string
  updated_at: string
  escalation_status?: 'resolved'
}

const updates: ReportUpdatePayload = { ... }
```

---

## 🟠 Temuan Tinggi (Data Integrity)

### [DAT-01] Form Intervensi Menggunakan `document.getElementById` (Anti-Pattern React)

**File:** `ClinicianPatientDetail.tsx` L20-21  
**Severity:** 🟠 TINGGI

```typescript
// ANTI-PATTERN — Manipulasi DOM langsung, bukan cara React
const doctorNotes = (document.getElementById('doctorNotes') as HTMLTextAreaElement).value
const suggestedRegimen = (document.getElementById('suggestedRegimen') as HTMLTextAreaElement).value
```

Ini adalah **anti-pattern serius** di React karena:
- Tidak ada validasi sebelum submit (form bisa kosong dan tetap dikirim).
- Jika ada dua instance komponen, `getElementById` akan mengambil elemen yang salah.
- Tidak reaktif — nilai bisa stale.

**Rekomendasi:** Gunakan `useState` atau `react-hook-form`:

```typescript
// SOLUSI — State-driven form
const [doctorNotes, setDoctorNotes] = useState(patient.doctorNotes ?? '')
const [suggestedRegimen, setSuggestedRegimen] = useState(patient.suggestedRegimen ?? '')

// Lalu di handleIntervention:
submitIntervention.mutate({ reportId: patient.latestReportId, doctorNotes, suggestedRegimen, ... })
```

---

### [DAT-02] `useClinicianHistory` Tidak Me-refresh Data Secara Real-Time

**File:** `useClinicianHistory.ts`  
**Severity:** 🟠 TINGGI

`useClinicianWatchlist` sudah memiliki **Supabase Realtime Subscription** yang akan refresh otomatis saat ada perubahan. Namun `useClinicianHistory` **hanya fetch sekali saat mount** (`useEffect` tanpa subscription).

Akibatnya, setelah dokter menyelesaikan eskalasi, halaman **Riwayat Pasien** tidak akan otomatis menampilkan entri baru tanpa refresh manual.

```typescript
// SEKARANG — Hanya fetch sekali
useEffect(() => {
  fetchHistory()
}, [])
```

**Rekomendasi:** Refaktor ke `useQuery` dari TanStack Query (konsisten dengan `usePatientDetail`) dan tambahkan `refetchOnWindowFocus`:

```typescript
// SOLUSI
import { useQuery } from '@tanstack/react-query'

export function useClinicianHistory() {
  return useQuery({
    queryKey: ['clinician-history'],
    queryFn: fetchHistory,
    refetchOnWindowFocus: true,
  })
}
```

---

### [DAT-03] `useClinicianIntervention` Invalidasi Query Key yang Salah

**File:** `useClinicianIntervention.ts` L40  
**Severity:** 🟠 TINGGI

```typescript
// BERMASALAH — Key tidak sesuai
onSuccess: () => {
  queryClient.invalidateQueries({ queryKey: ['patientDetail'] })
  queryClient.invalidateQueries({ queryKey: ['clinician-watchlist'] }) // ← key ini tidak terdaftar di useClinicianWatchlist
}
```

`useClinicianWatchlist` menggunakan custom state (`useState`), bukan TanStack Query. Maka `invalidateQueries({ queryKey: ['clinician-watchlist'] })` **tidak akan pernah memicu refresh** pada watchlist tersebut.

Inilah penyebab utama mengapa antrian tidak langsung hilang setelah tombol de-eskalasi diklik — invalidasi tidak menyentuh hook yang benar.

**Rekomendasi:** Ada dua opsi:
1. Refaktor `useClinicianWatchlist` ke TanStack Query dengan key `['clinician-watchlist']` agar `invalidateQueries` bekerja.
2. Atau expose fungsi `refresh` dari `useClinicianWatchlist` dan panggil secara langsung dari `handleIntervention`.

---

## 🟡 Temuan Sedang (Arsitektur & Maintainability)

### [ARCH-01] Duplikasi Data Mapping (snake_case → camelCase)

**File:** `useClinicianWatchlist.ts`, `useClinicianHistory.ts`  
**Severity:** 🟡 SEDANG

Kedua hook melakukan mapping yang hampir identik secara manual:
```typescript
// Duplikasi di dua file berbeda
patient: {
  id: item.patient.id,
  fullName: item.patient.full_name, // ← sama persis
  ward: item.patient.ward,
  ...
}
```

**Rekomendasi:** Buat fungsi mapper yang bisa digunakan bersama:

```typescript
// src/features/reports/utils/reportMapper.ts
export function mapPatientProfile(raw: any) {
  return {
    id: raw.id,
    fullName: raw.full_name,
    ward: raw.ward,
    bedNumber: raw.bed_number,
    currentCycle: raw.current_cycle
  }
}
```

---

### [ARCH-02] `QoLTrendChart` Menggunakan Data Statis (Dummy)

**File:** `QoLTrendChart.tsx` L3-11  
**Severity:** 🟡 SEDANG

```typescript
// DATA DUMMY — Tidak terhubung ke Supabase
const data = [
  { date: 'SEN', score: 4 },
  { date: 'SEL', score: 5 },
  ...
]
```

Chart ini tidak menerima props apapun dan menampilkan data yang sama untuk semua pasien, tanpa mempedulikan siapa pasiennya.

**Rekomendasi:** Terima props `data` dan `patientId`:

```typescript
interface QoLTrendChartProps {
  data: { date: string; score: number; isToday?: boolean }[]
}
export default function QoLTrendChart({ data }: QoLTrendChartProps)
```

Kemudian mapping dari `patient.trends` yang sudah ada di `usePatientDetail`.

---

### [ARCH-03] Data Pasien Statis di `ClinicianPatientDetail`

**File:** `ClinicianPatientDetail.tsx` L72, L76  
**Severity:** 🟡 SEDANG

```tsx
{/* DATA HARDCODED */}
<p>54 Tahun</p>        {/* Umur tidak dari database */}
<p>12 Okt 2023</p>    {/* Tanggal tidak dari database */}
```

Dua kotak info (Umur & Tanggal Terakhir) masih menggunakan nilai statis yang sama untuk semua pasien.

**Rekomendasi:** Field `age` sudah ada di `PatientDetailData` (nilainya 0 sebagai placeholder). Harus diisi dari database (`date_of_birth` di profil) dan dihitung. Untuk sementara, tampilkan `'—'` daripada nilai palsu.

---

### [ARCH-04] Analisis Triase di Apoteker Masih Statis

**File:** `PharmacistPatientDetail.tsx` L379  
**Severity:** 🟡 SEDANG

```tsx
{/* HARDCODED — Tidak kontekstual terhadap data pasien */}
<p>Berdasarkan laporan mual <span>GRADE 3</span> dan frekuensi muntah berulang...</p>
```

Teks analisis triase tidak dinamis. Ini menyesatkan karena tampak seperti analisis AI berbasis data, padahal hanya teks statis.

**Rekomendasi:** Buat fungsi `generateTriageAnalysis(symptoms, gradeAuto)` yang menghasilkan teks berdasarkan data aktual pasien.

---

### [ARCH-05] `usePharmacistQueue` Memiliki Interval Refresh yang Terlalu Lambat

**File:** `usePharmacistQueue.ts` L67  
**Severity:** 🟡 SEDANG

```typescript
refetchInterval: 1000 * 60, // Auto refresh queue every 60s
```

Untuk antrian medis yang bersifat kritis, interval 60 detik terlalu lambat. Jika ada eskalasi baru, apoteker baru melihatnya satu menit kemudian.

**Rekomendasi:** Tambahkan Supabase Realtime Subscription seperti yang sudah dilakukan di `useClinicianWatchlist`, atau turunkan interval ke 15 detik sebagai solusi jangka pendek.

---

## 🟢 Temuan Rendah (UI/UX & Aksesibilitas)

### [UX-01] `VitalsCard` Tidak Menampilkan SpO2

**File:** `VitalsCard.tsx` L11  
**Severity:** 🟢 RENDAH

```typescript
// spo2 ada di interface tapi tidak ditampilkan di UI
export default function VitalsCard({ systolic, diastolic, heartRate, temperature }: VitalsCardProps) {
```

`spo2` didefinisikan di `VitalsCardProps` namun tidak di-destructure dan tidak ditampilkan. Untuk pasien onkologi, SpO2 adalah indikator penting.

---

### [UX-02] Tombol "Catatan Klinis" & "Ubah Regimen" di Apoteker Tidak Berfungsi

**File:** `PharmacistPatientDetail.tsx` L358-370  
**Severity:** 🟢 RENDAH

Kedua tombol ini tidak memiliki `onClick` handler dan tidak mengarah ke mana pun. Ini adalah UI placeholder yang berpotensi membingungkan pengguna.

---

### [UX-03] Tidak Ada Loading State pada Tombol Intervensi Dokter

**File:** `ClinicianPatientDetail.tsx` L193-206  
**Severity:** 🟢 RENDAH

Tombol "Selesaikan & Deeskalasi" tidak menampilkan indikator loading saat proses berjalan. Dokter bisa mengklik berulang kali karena tidak ada feedback visual.

```tsx
// Tambahkan disabled dan loading indicator
<button
  onClick={() => handleIntervention(true)}
  disabled={submitIntervention.isPending}
  className="... disabled:opacity-70 disabled:scale-100"
>
  {submitIntervention.isPending ? 'Memproses...' : 'SELESAIKAN & DEESKALASI'}
</button>
```

---

### [UX-04] Halaman Riwayat Pasien Menampilkan Laporan yang Masih "Escalated"

**File:** `useClinicianHistory.ts` L24  
**Severity:** 🟢 RENDAH

```typescript
// SEKARANG — Mengambil semua yang pernah dieskalasi, termasuk yang masih aktif
.neq('escalation_status', 'none')
```

Halaman "Riwayat" idealnya hanya menampilkan kasus yang sudah `resolved`. Kasus yang masih `escalated` sebaiknya hanya muncul di "Daftar Pantau".

**Rekomendasi:**
```typescript
// Hanya tampilkan yang sudah selesai
.eq('escalation_status', 'resolved')
```

---

---

## 🏛️ God Class — Komponen yang Terlalu Banyak Tanggung Jawab

God Class adalah kelas/komponen yang mengetahui terlalu banyak hal dan melakukan terlalu banyak pekerjaan. Ini adalah pelanggaran **Single Responsibility Principle (SRP)** yang paling sering mengakibatkan bug sulit dilacak dan code yang susah diuji.

---

### [GOD-01] `PharmacistPatientDetail.tsx` — God Component (406 baris)

**File:** `src/features/reports/pages/PharmacistPatientDetail.tsx`  
**Baris:** 406 | **Severity:** 🔴 KRITIS

Ini adalah God Class paling parah dalam codebase saat ini. Satu file ini mengelola **7 tanggung jawab berbeda** sekaligus:

| # | Tanggung Jawab | Baris |
|---|---|---|
| 1 | State chat (input, scroll) | L25-44 |
| 2 | Logika eskalasi | L46-66 |
| 3 | Render profil pasien | L120-157 |
| 4 | Render laporan gejala | L160-212 |
| 5 | Render chart tren | L214-252 |
| 6 | UI Live Chat | L258-328 |
| 7 | UI Panel Aksi Klinis | L330-399 |

**Dampak:** Setiap kali ada bug di chat, developer harus membaca 400 baris untuk menemukannya. Perubahan di logika eskalasi bisa secara tidak sengaja merusak UI chat.

**Rekomendasi Dekomposisi:**
```
PharmacistPatientDetail.tsx (orchestrator, ~50 baris)
├── components/
│   ├── PatientProfileCard.tsx          (Profil & identitas)
│   ├── SymptomReportPanel.tsx          (Laporan Klik-Klik)
│   ├── SymptomTrendChart.tsx           (Chart tren gejala)
│   ├── ClinicalChatBox.tsx             (Live Chat)
│   └── ClinicalActionPanel.tsx         (Tombol Eskalasi & Aksi)
└── hooks/
    └── usePharmacistPatientActions.ts  (State + logika gabungan)
```

---

### [GOD-02] `ClinicianWatchlist.tsx` — God Page (238 baris, 2 View Modes)

**File:** `src/features/clinician/pages/ClinicianWatchlist.tsx`  
**Baris:** 238 | **Severity:** 🟠 TINGGI

Halaman ini merender **dua representasi data yang berbeda** (Desktop Table dan Mobile Cards) untuk dataset yang sama, ditambah logika filter dan stats:

```tsx
{/* Desktop Table View — ~60 baris JSX */}
<div className="hidden md:block">
  <table>...</table>
</div>

{/* Mobile Card View — ~50 baris JSX yang sama sekali berbeda */}
<div className="md:hidden space-y-6">
  {watchlist?.map(report => <Link ...>...kompleks...</Link>)}
</div>
```

**Masalah:** Jika ada perubahan data (misal: tambah kolom "Ruangan"), developer harus mengubah dua tempat berbeda yang bisa saja terlupakan.

**Rekomendasi:**
```tsx
// Ekstrak ke komponen terpisah
<WatchlistTable data={watchlist} />    // Desktop only
<WatchlistCards data={watchlist} />    // Mobile only

// Atau lebih baik: satu komponen adaptif
<WatchlistItem report={report} viewMode={isMobile ? 'card' : 'row'} />
```

---

### [GOD-03] `usePatientDetail.ts` — God Hook (Dual Purpose)

**File:** `src/features/reports/api/usePatientDetail.ts`  
**Baris:** 117 | **Severity:** 🟡 SEDANG

Hook ini digunakan oleh **dua domain yang berbeda** (Apoteker dan Dokter) namun me-return data yang di-shape untuk keduanya sekaligus, dengan beberapa field yang hanya relevan untuk satu pihak:

```typescript
// Field untuk DOKTER
vitals: { systolic, diastolic, heartRate, temperature, spo2 }
suggestedRegimen: string
pharmacistNotes: string

// Field untuk APOTEKER  
latestSymptoms: [...]
trends: [...]
bp: string  // ← sudah ada di vitals, duplikat
```

Lebih parah lagi, hook ini melakukan **2 query terpisah ke Supabase** dalam satu fungsi (Profile + Reports) tanpa memanfaatkan Supabase join yang tersedia.

**Rekomendasi:**
```typescript
// Pisahkan berdasarkan consumer
usePatientDetailForDoctor(patientId)   // Vital signs, intervensi, log
usePatientDetailForPharmacist(id, rid) // Gejala, tren, chat context

// Atau gunakan single join query:
.from('symptom_reports')
.select('*, profiles!patient_id(full_name, cancer_site, current_cycle)')
```

---

## ⚙️ God Config — Konfigurasi yang Terlalu Besar atau Salah Tempatnya

God Config terjadi ketika satu file konfigurasi menanggung terlalu banyak beban, atau ketika konfigurasi tersebar tidak konsisten dan menciptakan ambiguitas.

---

### [CONF-01] `app.config.ts` — Barrel yang Ambigu

**File:** `src/configs/app.config.ts`  
**Severity:** 🟡 SEDANG

```typescript
// Di vite.config.ts:
'@configs': path.resolve(__dirname, './src/configs'),

// Di ClinicianPatientDetail.tsx:
import { ROUTES } from '../../../configs/routes.config'  // ← Path relatif 3 level

// Di AppRouter.tsx:
import { ROUTES } from '@configs/app.config'  // ← Via barrel

// Di ClinicianLayout.tsx:
import { ROUTES } from '@configs/app.config'  // ← Via barrel
```

Tiga pola import berbeda untuk mengambil `ROUTES` dari sumber yang sama. Ini menciptakan **inkonsistensi** di seluruh codebase — developer baru tidak tahu mana yang "benar".

**Dampak:** `app.config.ts` adalah barrel yang melakukan `export *` dari semua domain config, berpotensi menjadi God Config seiring bertambahnya fitur. Re-export tanpa diskriminasi juga merusak *tree-shaking*.

**Rekomendasi:**
```typescript
// Standardisasi: selalu gunakan alias spesifik
import { ROUTES } from '@configs/routes.config'   // ✅ Konsisten
// Hapus re-export dari app.config.ts
```

---

### [CONF-02] `routes.config.ts` — Route String Tidak Selaras dengan Router

**File:** `src/configs/routes.config.ts` L34-36  
**Severity:** 🟡 SEDANG

```typescript
// Di routes.config.ts — Route terdefinisi
DOCTOR_PATIENT: '/doctor/patient/:id',

// Di AppRouter.tsx L75 — Route didefinisikan ULANG sebagai string literal
<Route path="/doctor/patient/:id" element={<ClinicianPatientDetail />} />

// Di AppRouter.tsx L76 — Route TIDAK terdaftar di routes.config.ts sama sekali
<Route path="/doctor/history" element={<ClinicianHistory />} />
```

Ada **tiga inkonsistensi** sekaligus:
1. `DOCTOR_PATIENT` didefinisikan di config tapi tidak dipakai di Router (pakai string literal).
2. `/doctor/history` ada di Router tapi tidak punya konstanta di `routes.config.ts`.
3. `PHARMA_REPORT_DETAIL`, `PHARMA_QUEUE`, `PHARMA_CHAT` ada di config tapi tidak ada route-nya di Router.

**Rekomendasi:**
```typescript
// routes.config.ts — Tambahkan yang hilang
DOCTOR_HISTORY: '/doctor/history',

// AppRouter.tsx — Gunakan konstanta, hapus string literal
<Route path={ROUTES.DOCTOR_PATIENT} element={<ClinicianPatientDetail />} />
<Route path={ROUTES.DOCTOR_HISTORY} element={<ClinicianHistory />} />
```

---

### [CONF-03] `vite.config.ts` — Alias `@types` Berbenturan dengan TypeScript Built-in

**File:** `vite.config.ts` L18  
**Severity:** 🟠 TINGGI

```typescript
// vite.config.ts
'@types': path.resolve(__dirname, './src/types'),
```

Alias `@types` adalah **namespace yang digunakan TypeScript** untuk definisi tipe (`@types/react`, `@types/node`, dll). Mendefinisikan ulang `@types` sebagai alias path dapat menyebabkan konflik resolusi module yang sulit di-debug, terutama saat menambahkan dependensi baru atau upgrade TypeScript.

**Rekomendasi:**
```typescript
// Ganti alias yang aman
'@domain-types': path.resolve(__dirname, './src/types'),
// Atau hapus jika tidak ada file di src/types/ yang aktif digunakan
```

---

## 🔧 Refactoring-Prone Code — Kode Rawan Perlu Direfaktor

Kode yang berfungsi sekarang, namun memiliki hutang teknis (*technical debt*) yang akan menyulitkan pengembangan di masa depan.

---

### [REF-01] Inline Logika Bisnis di JSX

**File:** `PharmacistDashboard.tsx` L182, `ClinicianWatchlist.tsx` L119, L121  
**Severity:** 🟠 TINGGI

```tsx
// PharmacistDashboard.tsx L182 — Logika ekstraksi gejala inline di JSX
const symptomName = Object.entries(report.symptoms)
  .find(([_, v]) => (v as number) > 2)?.[0]
  ?.replace(/([A-Z])/g, ' $1') ?? 'Mual Berat'

// ClinicianWatchlist.tsx L121 — Transformasi teks langsung di render
{k.replace(/([A-Z])/g, ' $1')} {v > 2 ? 'Akut' : ''}
```

Logika ini diulang di beberapa tempat dan terikat pada representasi data internal (`camelCase` field names). Jika nama field `symptoms` berubah, semua tempat ini harus diupdate manual.

**Rekomendasi:**
```typescript
// src/features/reports/utils/symptomUtils.ts
export function getPrimarySymptom(symptoms: SymptomData): string {
  return Object.entries(symptoms)
    .find(([_, v]) => (v as number) > 2)?.[0]
    ?.replace(/([A-Z])/g, ' $1') ?? 'Keluhan Ringan'
}

export function getSymptomLabel(key: string, value: number): string {
  return `${key.replace(/([A-Z])/g, ' $1')} ${value > 2 ? '(Akut)' : ''}`
}
```

---

### [REF-02] `window.confirm()` untuk Konfirmasi Eskalasi Klinis

**File:** `PharmacistPatientDetail.tsx` L49  
**Severity:** 🟠 TINGGI

```typescript
const confirmEscalation = window.confirm(
  `Apakah Anda yakin ingin melakukan eskalasi untuk ${patient.fullName}?...`
)
```

Penggunaan `window.confirm()` adalah anti-pattern serius untuk aplikasi medis karena:
- Tampilan dialog tidak bisa dikustomisasi (bertentangan dengan desain "Sentuhan Nurani").
- Tidak bisa di-test secara unit.
- Diblokir di beberapa browser/environment (PWA, iframe).
- Tidak ada cara untuk menambahkan field tambahan (misal: "catatan eskalasi darurat") tanpa refaktor total.

**Rekomendasi:** Buat komponen `ConfirmationModal` yang bisa di-reuse:

```tsx
<ConfirmationModal
  isOpen={showEscalateModal}
  title="Konfirmasi Eskalasi Klinis"
  description={`Eskalasi ${patient.fullName} ke Dokter Onkologi?`}
  confirmLabel="Ya, Eskalasi Sekarang"
  onConfirm={handleEscalate}
  onCancel={() => setShowEscalateModal(false)}
  variant="danger"
/>
```

---

### [REF-03] Duplikasi Pola URL di `Link` tanpa Fungsi Helper

**File:** `PharmacistDashboard.tsx` L125, L225 / `ClinicianHistory.tsx` L51  
**Severity:** 🟡 SEDANG

```tsx
// Pola URL dikonstruksi manual di 5+ tempat berbeda
to={`/pharma/patient/${report.patient.id}/${report.id}`}   // PharmacistDashboard L125
to={`/pharma/patient/${report.patient.id}/${report.id}`}   // PharmacistDashboard L225
to={`/doctor/patient/${report.patient.id}`}               // ClinicianHistory L51
to={`/doctor/patient/${report.patient.id}`}               // ClinicianWatchlist L101
```

Jika struktur URL berubah, developer harus melakukan pencarian manual ke seluruh codebase untuk memperbaruinya.

**Rekomendasi:** Buat route builder functions:

```typescript
// src/configs/routes.config.ts
export const buildRoute = {
  pharmacistPatient: (patientId: string, reportId: string) =>
    `/pharma/patient/${patientId}/${reportId}`,
  doctorPatient: (patientId: string) =>
    `/doctor/patient/${patientId}`,
}

// Penggunaan:
to={buildRoute.pharmacistPatient(report.patient.id, report.id)}
```

---

### [REF-04] State Management Terpecah Antara `useState` dan TanStack Query

**File:** `useClinicianWatchlist.ts`, `useClinicianHistory.ts` vs semua hook lainnya  
**Severity:** 🟡 SEDANG

Aplikasi ini menggunakan **dua paradigma state management yang berbeda** secara tidak konsisten:

| Hook | Paradigma | Real-time? | Cache? |
|---|---|---|---|
| `useClinicianWatchlist` | `useState` + `useEffect` | ✅ (Supabase subscription) | ❌ |
| `useClinicianHistory` | `useState` + `useEffect` | ❌ | ❌ |
| `usePatientDetail` | TanStack Query | ❌ | ✅ |
| `usePharmacistQueue` | TanStack Query | ❌ (polling 60s) | ✅ |
| `useReportEscalation` | TanStack Mutation | N/A | N/A |

Ketidakkonsistenan ini menyebabkan masalah [DAT-03] (invalidasi tidak bekerja) dan membuat kode sulit dipelihara.

**Rekomendasi:** Standarisasi semua data fetching menggunakan **TanStack Query** dan gunakan Supabase Realtime hanya untuk `invalidateQueries`:

```typescript
// Pattern yang direkomendasikan
export function useClinicianWatchlist() {
  const queryClient = useQueryClient()

  // Real-time subscription hanya untuk trigger invalidasi
  useEffect(() => {
    const channel = supabase.channel('watchlist-changes')
      .on('postgres_changes', { ... }, () => {
        queryClient.invalidateQueries({ queryKey: ['clinician-watchlist'] })
      }).subscribe()
    return () => supabase.removeChannel(channel)
  }, [queryClient])

  // TanStack Query untuk fetching & caching
  return useQuery({
    queryKey: ['clinician-watchlist'],
    queryFn: fetchEscalatedReports,
  })
}
```

---

### [REF-05] `useAuthStore` Diakses Tapi Tidak Digunakan di `usePatientDetail`

**File:** `src/features/reports/api/usePatientDetail.ts` L3  
**Severity:** 🟢 RENDAH

```typescript
import { useAuthStore } from '@features/auth/store'  // ← Diimport
// ... tapi tidak pernah digunakan di seluruh file
```

Import yang tidak terpakai ini kemungkinan adalah sisa dari refaktor sebelumnya. Selain menambah ukuran bundle (kecil), ini juga membingungkan developer yang membaca kode dan mengira ada logika auth yang tersembunyi di sini.

**Rekomendasi:** Hapus import tersebut.

---

## Roadmap Perbaikan yang Disarankan

### Sprint 1 — Keamanan & Bug Kritis (Estimasi: 1 hari)

| Prioritas | ID | Tindakan |
|---|---|---|
| 1 | SEC-01 | Aktifkan RLS di Supabase untuk semua tabel sensitif |
| 2 | SEC-02 | Hapus `any` type di mutation payload |
| 3 | DAT-03 | Refaktor `useClinicianWatchlist` ke TanStack Query |
| 4 | CONF-03 | Ganti alias `@types` di `vite.config.ts` |

### Sprint 2 — Arsitektur & Kualitas Kode (Estimasi: 2-3 hari)

| Prioritas | ID | Tindakan |
|---|---|---|
| 5 | DAT-01 | Ganti `document.getElementById` dengan React state |
| 6 | GOD-01 | Pecah `PharmacistPatientDetail` menjadi sub-komponen |
| 7 | CONF-02 | Sinkronkan `routes.config.ts` dengan `AppRouter.tsx` |
| 8 | REF-04 | Standarisasi semua hooks ke TanStack Query |
| 9 | REF-02 | Ganti `window.confirm()` dengan `ConfirmationModal` |
| 10 | REF-03 | Buat `buildRoute` helper functions |

### Sprint 3 — Kelengkapan Data & UX (Estimasi: 1-2 hari)

| Prioritas | ID | Tindakan |
|---|---|---|
| 11 | ARCH-02 | Koneksikan `QoLTrendChart` ke data nyata pasien |
| 12 | ARCH-03 | Hapus data statis (umur: 54, tanggal: 12 Okt 2023) |
| 13 | UX-03 | Tambah loading state di tombol intervensi dokter |
| 14 | UX-04 | Filter Riwayat hanya `resolved` |
| 15 | UX-01 | Tampilkan SpO2 di `VitalsCard` |
| 16 | REF-05 | Hapus import `useAuthStore` yang tidak terpakai |

---

## Catatan Migrasi Database

Beberapa kolom baru telah ditambahkan selama sprint ini namun **belum dijalankan di Supabase**:

| File Migrasi | Kolom | Status |
|---|---|---|
| `20260426_add_regimen_to_reports.sql` | `suggested_regimen TEXT` | ⚠️ Perlu dijalankan |
| `20260426_add_pharmacist_notes.sql` | `pharmacist_notes TEXT` | ⚠️ Perlu dijalankan |
| `20260426_add_vitals_to_reports.sql` | Kolom vital signs | ⚠️ Perlu diverifikasi |
| `20260426_add_ward_info.sql` | `ward`, `bed_number` di profiles | ⚠️ Perlu diverifikasi |
| `20260426_add_escalation_status.sql` | `escalation_status` | ✅ Sudah berjalan |

> [!CAUTION]
> Jangan lupa jalankan semua migrasi di atas melalui **Supabase SQL Editor** sebelum melanjutkan pengembangan fitur baru. Kolom yang belum ada di database akan menyebabkan silent error atau data yang selalu `undefined`.

---

*Audit ini dibuat secara otomatis berdasarkan review kode pada 2026-04-26. Temuan harus divalidasi ulang sebelum diimplementasikan.*
