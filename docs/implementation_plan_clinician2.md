# Implementation Plan — Clinician Phase 2
**Proyek:** MESO App — Dashboard Dokter & Apoteker  
**Fase:** Phase 2 — Hardening, Refactoring & Completeness  
**Dibuat:** 2026-04-26  
**Referensi Audit:** `docs/code_audit_doctor_dashboard1.md`

---

## Latar Belakang

Phase 1 (Clinician1) telah berhasil membangun alur end-to-end:  
**Pasien → Laporan MESO → Apoteker (Eskalasi) → Dokter (Intervensi) → Resolved.**

Phase 2 ini berfokus pada **hardening sistem** berdasarkan temuan code audit: memperbaiki kerentanan keamanan, menghapus hutang teknis (technical debt), menstabilkan alur data, dan melengkapi tampilan dengan data nyata dari database.

> [!IMPORTANT]
> Semua pekerjaan di Sprint 1 (Keamanan) **harus diselesaikan terlebih dahulu** sebelum melanjutkan ke Sprint 2 dan Sprint 3.

---

## Keputusan Desain

> [!NOTE]
> Open questions telah dijawab dan keputusan sudah diambil:
> - **God Class**: ✅ `PharmacistPatientDetail.tsx` **dipecah di Sprint 2** (sprint awal setelah security).
> - **Vitals Data**: Diisi manual oleh perawat/apoteker melalui form input.
> - **Umur Pasien**: Tampilkan `'—'` sementara; `date_of_birth` di-defer ke Phase 3.
> - **Konfirmasi Modal**: Buat komponen baru `ConfirmationModal.tsx` dari awal (tidak ada yang existing).

---

## Proposed Changes

---

### Sprint 1 — Keamanan & Bug Kritis
**Estimasi: 1 hari kerja | WAJIB sebelum Sprint 2**

#### [NEW] SQL — RLS Policies (jalankan di Supabase SQL Editor)
- Aktifkan RLS pada tabel `symptom_reports` dan `profiles`
- Policy pasien: hanya bisa baca laporan milik sendiri (`patient_id = auth.uid()`)
- Policy medis (dokter/apoteker/admin): bisa baca semua laporan
- Policy update: hanya dokter yang bisa mengubah `doctor_notes` dan `escalation_status='resolved'`
- Jalankan migrasi yang tertunda: `suggested_regimen` dan `pharmacist_notes`

```sql
ALTER TABLE public.symptom_reports ENABLE ROW LEVEL SECURITY;

CREATE POLICY "patient_own_reports" ON public.symptom_reports
FOR SELECT TO authenticated
USING (patient_id = auth.uid());

CREATE POLICY "medic_read_reports" ON public.symptom_reports
FOR SELECT TO authenticated
USING (
  (SELECT role FROM public.profiles WHERE id = auth.uid()) 
  IN ('doctor', 'pharmacist', 'admin')
);

CREATE POLICY "doctor_update_reports" ON public.symptom_reports
FOR UPDATE TO authenticated
USING ((SELECT role FROM public.profiles WHERE id = auth.uid()) = 'doctor');

ALTER TABLE public.symptom_reports ADD COLUMN IF NOT EXISTS suggested_regimen TEXT;
ALTER TABLE public.symptom_reports ADD COLUMN IF NOT EXISTS pharmacist_notes TEXT;
```

---

#### [MODIFY] `useClinicianIntervention.ts` — Hapus `any` Type
**Audit Ref: [SEC-02]**

Ganti `const updates: any` dengan interface strict:

```typescript
interface ReportUpdatePayload {
  doctor_notes: string
  suggested_regimen?: string
  updated_at: string
  escalation_status?: 'resolved'
}
const updates: ReportUpdatePayload = { ... }
```

---

#### [MODIFY] `useClinicianWatchlist.ts` — Refaktor ke TanStack Query
**Audit Ref: [DAT-03] + [REF-04]**

Pindahkan dari `useState`/`useEffect` ke TanStack Query agar `invalidateQueries` benar-benar memicu refresh. Gunakan Supabase Realtime hanya sebagai trigger invalidasi:

```typescript
export function useClinicianWatchlist() {
  const queryClient = useQueryClient()

  useEffect(() => {
    const channel = supabase.channel('watchlist-realtime')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'symptom_reports' }, () => {
        queryClient.invalidateQueries({ queryKey: ['clinician-watchlist'] })
      }).subscribe()
    return () => { supabase.removeChannel(channel) }
  }, [queryClient])

  return useQuery({
    queryKey: ['clinician-watchlist'],
    queryFn: fetchEscalatedReports,
  })
}
```

---

#### [MODIFY] `vite.config.ts` — Perbaiki Alias Konflik TypeScript
**Audit Ref: [CONF-03]**

```typescript
// Sebelum
'@types': path.resolve(__dirname, './src/types'),
// Sesudah
'@domain-types': path.resolve(__dirname, './src/types'),
```

> [!WARNING]
> Setelah rename, jalankan `grep -r "@types/"` di src/ untuk memperbarui semua import yang terpengaruh.

---

### Sprint 2 — Arsitektur & Refactoring
**Estimasi: 3–4 hari kerja | Prasyarat: Sprint 1 verified**

---

#### [DECOMPOSE] `PharmacistPatientDetail.tsx` → Sub-komponen & Hook
**Audit Ref: [GOD-01] | Diprioritaskan berdasarkan keputusan user**

File 406-baris ini dipecah menjadi 5 komponen terpisah + 1 hook, menggunakan pola **Orchestrator Pattern**: file utama hanya mengatur state dan mengkomposisi komponen.

**Struktur target:**
```
src/features/reports/
├── pages/
│   └── PharmacistPatientDetail.tsx    ← Orchestrator (~60 baris)
├── components/
│   ├── PatientProfileCard.tsx          ← Profil & identitas pasien (L120-157)
│   ├── SymptomReportPanel.tsx          ← Laporan Klik-Klik harian (L160-212)
│   ├── SymptomTrendChart.tsx           ← Bar chart tren gejala (L214-252)
│   ├── ClinicalChatBox.tsx             ← Live Chat diskusi (L258-328)
│   └── ClinicalActionPanel.tsx         ← Tombol Eskalasi & aksi klinis (L330-399)
└── hooks/
    └── usePharmacistPatientActions.ts  ← State eskalasi, chat, status
```

**Urutan dekomposisi yang aman (untuk hindari regression):**
1. **Ekstrak hook dulu** → `usePharmacistPatientActions.ts` (pindahkan semua `useState`, `mutate`, handler)
2. **Ekstrak `ClinicalChatBox`** → komponen paling terisolasi (state-nya sudah di hook)
3. **Ekstrak `ClinicalActionPanel`** → tombol eskalasi + triage box
4. **Ekstrak `PatientProfileCard`** → murni presentational, tidak ada state
5. **Ekstrak `SymptomReportPanel`** + **`SymptomTrendChart`** → keduanya presentational
6. **Update orchestrator** → `PharmacistPatientDetail.tsx` tinggal `<PharmacistLayout>` + render semua sub-komponen

**[NEW] `src/features/reports/hooks/usePharmacistPatientActions.ts`**
```typescript
export function usePharmacistPatientActions(patientId: string, patient: PatientDetailData | null) {
  const navigate = useNavigate()
  const { user: currentUser } = useAuthStore()
  const [inputValue, setInputValue] = useState('')
  const [showEscalateModal, setShowEscalateModal] = useState(false)
  const chatContainerRef = useRef<HTMLDivElement>(null)

  const { data: messages } = useChatMessages(patientId)
  const sendMessage = useSendMessage()
  const submitIntervention = useSubmitIntervention()
  const updateStatus = useUpdateReportStatus()
  const escalateReport = useReportEscalation()

  const handleSend = () => { ... }
  const handleEscalate = () => setShowEscalateModal(true)
  const confirmEscalate = () => { escalateReport.mutate(...); setShowEscalateModal(false) }

  return {
    messages, inputValue, setInputValue, chatContainerRef, currentUser,
    showEscalateModal, setShowEscalateModal,
    handleSend, handleEscalate, confirmEscalate,
    escalateReport, updateStatus, submitIntervention
  }
}
```

**[NEW] `src/features/reports/components/ClinicalActionPanel.tsx`**
```typescript
interface ClinicalActionPanelProps {
  escalationStatus: 'none' | 'escalated' | 'resolved'
  isPending: boolean
  onEscalate: () => void
  onResolve: () => void
  triageText: string
  grade: GradeColor
}
```

**[NEW] `src/features/reports/components/ClinicalChatBox.tsx`**
```typescript
interface ClinicalChatBoxProps {
  messages: ChatMessage[]
  currentUserId: string
  patientName: string
  inputValue: string
  onInputChange: (v: string) => void
  onSend: () => void
  isPending: boolean
  containerRef: React.RefObject<HTMLDivElement>
}
```

**[MODIFY] `PharmacistPatientDetail.tsx`** → Orchestrator akhir:
```tsx
export default function PharmacistPatientDetail() {
  const { id, reportId } = useParams()
  const { data: patient, isLoading } = usePatientDetail(id, reportId)
  const actions = usePharmacistPatientActions(id!, patient ?? null)

  if (isLoading) return <PharmacistLayout>...</PharmacistLayout>
  if (!patient) return <PharmacistLayout>...</PharmacistLayout>

  return (
    <PharmacistLayout>
      <header>...</header>
      <main>
        <div className="grid grid-cols-12 gap-10">
          <div className="col-span-7 space-y-10">
            <PatientProfileCard patient={patient} />
            <SymptomReportPanel symptoms={patient.latestSymptoms} />
            <SymptomTrendChart trends={patient.trends} />
          </div>
          <div className="col-span-5 space-y-10">
            <ClinicalChatBox {...actions} patientName={patient.fullName} />
            <ClinicalActionPanel
              escalationStatus={patient.escalationStatus}
              onEscalate={actions.handleEscalate}
              onResolve={actions.handleResolve}
              grade={patient.gradeAuto}
            />
          </div>
        </div>
      </main>
      <ConfirmationModal
        isOpen={actions.showEscalateModal}
        title="Konfirmasi Eskalasi Klinis"
        description={`Eskalasikan ${patient.fullName} ke Dokter Onkologi?`}
        onConfirm={actions.confirmEscalate}
        onCancel={() => actions.setShowEscalateModal(false)}
        isLoading={actions.escalateReport.isPending}
        variant="danger"
      />
    </PharmacistLayout>
  )
}
```

---

#### [MODIFY] `ClinicianPatientDetail.tsx` — Ganti `getElementById` dengan `useState`
**Audit Ref: [DAT-01]**

```typescript
const [doctorNotes, setDoctorNotes] = useState(patient?.doctorNotes ?? '')
const [suggestedRegimen, setSuggestedRegimen] = useState(patient?.suggestedRegimen ?? '')
```

Tambahkan loading state dan `disabled` pada tombol intervensi:
```tsx
<button disabled={submitIntervention.isPending}>
  {submitIntervention.isPending ? 'Memproses...' : 'SELESAIKAN & DEESKALASI'}
</button>
```

---

#### [MODIFY] `routes.config.ts` — Tambah Route yang Hilang + `buildRoute` Helper
**Audit Ref: [CONF-02] + [REF-03]**

```typescript
export const ROUTES = {
  // ... existing ...
  DOCTOR_HISTORY: '/doctor/history',   // BARU
} as const

export const buildRoute = {
  doctorPatient: (patientId: string) =>
    `/doctor/patient/${patientId}`,
  pharmacistPatient: (patientId: string, reportId: string) =>
    `/pharma/patient/${patientId}/${reportId}`,
} as const
```

---

#### [MODIFY] `AppRouter.tsx` — Gunakan Konstanta, Hapus String Literal
**Audit Ref: [CONF-02]**

```tsx
<Route path={ROUTES.DOCTOR_PATIENT} element={<ClinicianPatientDetail />} />
<Route path={ROUTES.DOCTOR_HISTORY} element={<ClinicianHistory />} />
```

---

#### [MODIFY] `PharmacistDashboard.tsx`, `ClinicianHistory.tsx`, `ClinicianWatchlist.tsx`
**Audit Ref: [REF-03]**

Ganti semua template literal URL dengan `buildRoute`:
```tsx
// Sebelum
to={`/pharma/patient/${report.patient.id}/${report.id}`}
// Sesudah
to={buildRoute.pharmacistPatient(report.patient.id, report.id)}
```

---

#### [NEW] `src/features/reports/utils/symptomUtils.ts`
**Audit Ref: [REF-01]**

Ekstrak logika transformasi gejala ke utility function yang bisa di-reuse di seluruh app:

```typescript
export function getPrimarySymptom(symptoms: SymptomData): string
export function formatSymptomKey(key: string): string
export function getSymptomGrade(value: number): 'akut' | 'sedang' | 'ringan'
```

---

#### [NEW] `src/components/ui/ConfirmationModal.tsx`
**Audit Ref: [REF-02]**

Ganti `window.confirm()` di `PharmacistPatientDetail.tsx` dengan komponen modal reusable:

```typescript
interface ConfirmationModalProps {
  isOpen: boolean
  title: string
  description: string
  confirmLabel?: string
  onConfirm: () => void
  onCancel: () => void
  variant?: 'danger' | 'warning' | 'info'
  isLoading?: boolean
}
```

---

#### [MODIFY] `useClinicianHistory.ts` — Refaktor ke TanStack Query + Fix Filter
**Audit Ref: [DAT-02] + [UX-04]**

```typescript
export function useClinicianHistory() {
  return useQuery({
    queryKey: ['clinician-history'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('symptom_reports')
        .select(`*, patient:profiles!patient_id(...)`)
        .eq('escalation_status', 'resolved')  // hanya yang benar-benar selesai
        .order('created_at', { ascending: false })
      if (error) throw error
      return mapReports(data)
    },
    refetchOnWindowFocus: true,
  })
}
```

---

#### [MODIFY] `usePatientDetail.ts` — Hapus Import Tidak Terpakai
**Audit Ref: [REF-05]**

```typescript
// Hapus baris ini:
import { useAuthStore } from '@features/auth/store'
```

---

### Sprint 3 — Kelengkapan Data & UX Polish
**Estimasi: 1–2 hari kerja | Prasyarat: Sprint 2 verified**

---

#### [MODIFY] `QoLTrendChart.tsx` — Terima Props, Hapus Data Dummy
**Audit Ref: [ARCH-02]**

```typescript
interface QoLTrendChartProps {
  data: { date: string; score: number; isToday?: boolean }[]
}
export default function QoLTrendChart({ data }: QoLTrendChartProps)
```

Transformasikan dari `patient.trends` di halaman detail:
```tsx
const qolData = patient.trends.map((t, i) => ({
  date: t.date,
  score: Math.round(10 - ((t.mual + t.nyeri + t.lelah) / 3)),
  isToday: i === patient.trends.length - 1
}))
<QoLTrendChart data={qolData} />
```

---

#### [MODIFY] `VitalsCard.tsx` — Tampilkan SpO2
**Audit Ref: [UX-01]**

Destructure `spo2` dari props dan tampilkan sebagai kartu keempat dengan:
- Ikon: `respiratory_rate` atau `air`
- Satuan: `%`
- Warna: hijau jika ≥ 95%, kuning jika 90–94%, merah jika < 90%

---

#### [MODIFY] `ClinicianPatientDetail.tsx` — Hapus Data Statis
**Audit Ref: [ARCH-03]**

```tsx
// Sebelum
<p>54 Tahun</p>
<p>12 Okt 2023</p>

// Sesudah
<p>{patient.age > 0 ? `${patient.age} Tahun` : '—'}</p>
<p>{patient.latestReportId ? format(new Date(patient.createdAt), 'dd MMM yyyy') : '—'}</p>
```

---

#### [NEW] `src/features/reports/utils/triageUtils.ts`
**Audit Ref: [ARCH-04]**

```typescript
export function generateTriageText(symptoms: SymptomData, grade: GradeColor): string {
  const primary = getPrimarySymptom(symptoms)
  if (grade === 'red') return `Berdasarkan laporan ${primary} berat (Grade 3+), pasien memerlukan intervensi segera.`
  if (grade === 'yellow') return `Gejala ${primary} dalam batas observasi. Pantau dan berikan edukasi hidrasi.`
  return `Kondisi pasien stabil. Lanjutkan regimen dan edukasi kepatuhan laporan.`
}
```

---

## Matriks Risiko

| Risk | Likelihood | Impact | Mitigasi |
|---|---|---|---|
| RLS terlalu ketat, blokir query valid | Tinggi | Kritis | Test setiap role di Supabase Studio sebelum push |
| Refaktor watchlist menyebabkan regression | Sedang | Tinggi | Test manual alur eskalasi end-to-end setelah Sprint 1 |
| Alias `@types` rename menyebabkan build error | Sedang | Sedang | Grep dulu, siapkan rollback |
| Dekomposisi PharmacistPatientDetail rusak state chat | Tinggi | Tinggi | Extract hook dulu, baru pecah UI-nya |

---

## Verification Plan

### Sprint 1
- [ ] Login sebagai `patient` → akses `/doctor/watchlist` langsung → redirect ke login
- [ ] Login sebagai `pharmacist` → eskalasikan laporan → muncul di Daftar Pantau Dokter
- [ ] Login sebagai `doctor` → klik "Selesaikan & Deeskalasi" → pasien **langsung hilang** dari antrian tanpa refresh manual
- [ ] Cek kolom `suggested_regimen` dan `pharmacist_notes` muncul di Supabase Table Editor

### Sprint 2
- [ ] `PharmacistPatientDetail` terpecah menjadi 5 komponen + 1 hook, tidak ada regression
- [ ] Live Chat masih berfungsi setelah dekomposisi
- [ ] Tombol eskalasi masih berfungsi dan menggunakan `ConfirmationModal`
- [ ] Alur eskalasi end-to-end masih berjalan tanpa regression
- [ ] Form intervensi dokter menyimpan data dengan benar (verify di Supabase)
- [ ] Semua URL navigasi tidak ada yang 404
- [ ] Tidak ada `console.error` di semua halaman

### Sprint 3
- [ ] QoL Chart menampilkan data dari laporan pasien nyata
- [ ] VitalsCard menampilkan SpO2 (data atau `—`)
- [ ] Halaman Detail tidak menampilkan "54 Tahun" atau "12 Okt 2023"
- [ ] Halaman Riwayat hanya menampilkan laporan `resolved`

---

## File Matrix

| File | Kondisi Saat Ini | Sprint |
|---|---|---|
| `clinician/api/useClinicianWatchlist.ts` | `useState`, invalidasi broken | S1 |
| `clinician/api/useClinicianIntervention.ts` | `any` type | S1 |
| `vite.config.ts` | Alias `@types` konflik | S1 |
| `clinician/pages/ClinicianPatientDetail.tsx` | `getElementById`, data statis | S2 + S3 |
| `clinician/api/useClinicianHistory.ts` | `useState`, filter salah | S2 |
| `configs/routes.config.ts` | Route tidak sinkron | S2 |
| `app/AppRouter.tsx` | String literal | S2 |
| `reports/pages/PharmacistPatientDetail.tsx` | God Class 406 baris, `window.confirm` | **S2 (awal)** |
| `reports/api/usePatientDetail.ts` | Import tidak terpakai | S2 |
| `clinician/components/QoLTrendChart.tsx` | Data dummy statis | S3 |
| `clinician/components/VitalsCard.tsx` | SpO2 tidak tampil | S3 |
| **[NEW]** `reports/hooks/usePharmacistPatientActions.ts` | Belum ada (dari dekomposisi) | **S2 (awal)** |
| **[NEW]** `reports/components/PatientProfileCard.tsx` | Belum ada (dari dekomposisi) | **S2 (awal)** |
| **[NEW]** `reports/components/SymptomReportPanel.tsx` | Belum ada (dari dekomposisi) | **S2 (awal)** |
| **[NEW]** `reports/components/SymptomTrendChart.tsx` | Belum ada (dari dekomposisi) | **S2 (awal)** |
| **[NEW]** `reports/components/ClinicalChatBox.tsx` | Belum ada (dari dekomposisi) | **S2 (awal)** |
| **[NEW]** `reports/components/ClinicalActionPanel.tsx` | Belum ada (dari dekomposisi) | **S2 (awal)** |
| **[NEW]** `reports/utils/symptomUtils.ts` | Belum ada | S2 |
| **[NEW]** `reports/utils/triageUtils.ts` | Belum ada | S3 |
| **[NEW]** `components/ui/ConfirmationModal.tsx` | Belum ada | S2 |
