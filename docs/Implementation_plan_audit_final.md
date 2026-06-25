# Implementation Plan — Audit Final Before Handover
## MESO App — Frontend (React + TypeScript)

Dokumen ini adalah rencana implementasi perbaikan berdasarkan temuan di [`code_audit_final_before_handover.md`](file:///d:/MESO-app/docs/code_audit_final_before_handover.md). Perbaikan dikelompokkan menjadi **4 Sprint** berdasarkan severity dan ketergantungan antar perubahan.

---

## Ringkasan Total Effort

| Sprint | Fokus | Isu | Estimasi |
|---|---|---|---|
| Sprint 1 | 🔴 Security Fixes | SEC-01, SEC-03, SMELL-03, SMELL-04 | ~45 menit |
| Sprint 2 | 🟡 Code Smell & Type Safety | SMELL-01, SMELL-02, SMELL-05, SMELL-06, SMELL-07, DEBT-04, DEBT-05 | ~2.5 jam [DONE] |
| Sprint 3 | 🟠 God Class Refactor | GOD-01, GOD-02 | ~3 jam [DONE] |
| Sprint 4 | 🟢 Tech Debt & Architecture | SEC-02, DEBT-02, DEBT-03 | Backlog / Sprint berikutnya |

**Total Sprint 1–3 (sebelum handover): ~6 jam**

---

## Sprint 1 — 🔴 Security Fixes (WAJIB sebelum handover)

> [!IMPORTANT]
> Semua item Sprint 1 adalah **non-negotiable** dan harus selesai sebelum serah terima kode.

---

### [SEC-01] Tambah `noopener,noreferrer` pada `window.open`

#### [MODIFY] [PharmacistSchedule.tsx](file:///d:/MESO-app/src/features/reports/pages/PharmacistSchedule.tsx#L99)

**Perubahan:** Satu baris — tambah parameter ketiga pada `window.open`.

```diff
- window.open(waUrl, '_blank')
+ window.open(waUrl, '_blank', 'noopener,noreferrer')
```

---

### [SEC-03] Wrap `navigator.clipboard` dengan Try/Catch

Semua pemanggilan `navigator.clipboard.writeText()` harus dibungkus dengan try/catch agar toast error tidak muncul jika clipboard gagal.

#### [MODIFY] [PatientEducation.tsx](file:///d:/MESO-app/src/features/reports/pages/PatientEducation.tsx#L128)

```diff
- navigator.clipboard.writeText(featured.videoUrl);
- toast.success('Tautan disalin!');
+ try {
+   await navigator.clipboard.writeText(featured.videoUrl)
+   toast.success('Tautan disalin!')
+ } catch {
+   toast.error('Gagal menyalin tautan. Coba salin manual.')
+ }
```

Pola yang sama diterapkan di:
- [`PatientEducation.tsx:131`](file:///d:/MESO-app/src/features/reports/pages/PatientEducation.tsx#L131) (fallback `window.location.href`)
- [`PatientEducation.tsx:373`](file:///d:/MESO-app/src/features/reports/pages/PatientEducation.tsx#L373)
- [`PharmacistEducation.tsx:296`](file:///d:/MESO-app/src/features/reports/pages/PharmacistEducation.tsx#L296)

---

### [SMELL-03] Ganti Hardcoded Route di `PharmacistLayout`

#### [MODIFY] [PharmacistLayout.tsx](file:///d:/MESO-app/src/features/reports/components/PharmacistLayout.tsx#L245)

```diff
- onClick={() => navigate('/pharma/settings')}
+ onClick={() => navigate(ROUTES.PHARMA_SETTINGS)}
```

> Pastikan `ROUTES.PHARMA_SETTINGS` sudah terdefinisi di `app.config.ts`. Jika belum, tambahkan.

---

### [SMELL-04] Ganti Magic String di `navItems` PharmacistLayout

#### [MODIFY] [PharmacistLayout.tsx](file:///d:/MESO-app/src/features/reports/components/PharmacistLayout.tsx#L63)

Ganti semua string path hardcoded di array `navItems` dengan nilai dari `ROUTES` constants:

```diff
- { label: 'Antrean Laporan', icon: 'assignment', path: '/pharma/dashboard' },
- { label: 'Data Pasien', icon: 'group', path: '/pharma/patients' },
- { label: 'Jadwal', icon: 'calendar_month', path: '/pharma/schedule' },
- { label: 'Edukasi', icon: 'auto_stories', path: '/pharma/education' },
+ { label: 'Antrean Laporan', icon: 'assignment', path: ROUTES.PHARMA_DASHBOARD },
+ { label: 'Data Pasien', icon: 'group', path: ROUTES.PHARMA_PATIENTS },
+ { label: 'Jadwal', icon: 'calendar_month', path: ROUTES.PHARMA_SCHEDULE },
+ { label: 'Edukasi', icon: 'auto_stories', path: ROUTES.PHARMA_EDUCATION },
```

Tambahkan import `ROUTES` jika belum ada.

---

## Sprint 2 — 🟡 Code Smell & Type Safety

---

### [SMELL-01] Migrasi `console.error` → `logger.error`

Semua `console.error` di luar `logger.ts` sendiri harus diganti dengan `logger.error(...)`.

#### File yang terdampak:

| File | Baris | Perubahan |
|---|---|---|
| [PharmacistSchedule.tsx](file:///d:/MESO-app/src/features/reports/pages/PharmacistSchedule.tsx) | L67, L73 | `console.error(...)` → `logger.error(...)` |
| [PharmacistReportDetail.tsx](file:///d:/MESO-app/src/features/reports/pages/PharmacistReportDetail.tsx) | L39 | `console.error(...)` → `logger.error(...)` |
| [usePatientQolStatus.ts](file:///d:/MESO-app/src/features/reports/hooks/usePatientQolStatus.ts) | L18 | `console.error(...)` → `logger.error(...)` |
| [usePatientActions.ts](file:///d:/MESO-app/src/features/reports/hooks/usePatientActions.ts) | L134 | `console.error(...)` → `logger.error(...)` |
| [useUserManagement.ts](file:///d:/MESO-app/src/features/reports/api/useUserManagement.ts) | L29, L65 | `console.error(...)` → `logger.error(...)` |
| [PatientTopNav.tsx](file:///d:/MESO-app/src/features/reports/components/PatientTopNav.tsx) | L42 | `console.error(...)` → `logger.error(...)` |
| [whatsapp.service.ts](file:///d:/MESO-app/src/services/whatsapp.service.ts) | L32 | `console.error(...)` → `logger.error(...)` |

**Pola perubahan:**
```diff
- console.error('[WhatsAppService Error]', error)
+ import { logger } from '@utils/logger' // tambahkan jika belum ada
+ logger.error('[WhatsAppService] Send failed', error instanceof Error ? error : undefined)
```

---

### [SMELL-02] Ganti `catch (err: any)` dengan Type-safe Error Handling

Standarisasi semua error catch agar tidak menggunakan `: any`.

**Pola baru yang seragam:**
```tsx
} catch (err) {
  const message = err instanceof Error ? err.message : 'Terjadi kesalahan tidak diketahui'
  toast.error(message)
  logger.error('[ContextName] Error', err instanceof Error ? err : undefined)
}
```

#### File yang terdampak (~10 file):
- [ForgotPasswordPage.tsx](file:///d:/MESO-app/src/features/auth/pages/ForgotPasswordPage.tsx) — L113, L144, L186, L209
- [LoginPage.tsx](file:///d:/MESO-app/src/features/auth/pages/LoginPage.tsx) — L77
- [RegisterPage.tsx](file:///d:/MESO-app/src/features/auth/pages/RegisterPage.tsx) — L59
- [ResetPasswordPage.tsx](file:///d:/MESO-app/src/features/auth/pages/ResetPasswordPage.tsx) — L88
- [DeactivatedAccountPage.tsx](file:///d:/MESO-app/src/features/auth/pages/DeactivatedAccountPage.tsx) — L20
- [usePatientActions.ts](file:///d:/MESO-app/src/features/reports/hooks/usePatientActions.ts) — L51, L92
- [useUserManagement.ts](file:///d:/MESO-app/src/features/reports/api/useUserManagement.ts) — L28, L64
- [UserManagementPanel.tsx](file:///d:/MESO-app/src/features/reports/components/UserManagementPanel.tsx) — L21
- [PatientTopNav.tsx](file:///d:/MESO-app/src/features/reports/components/PatientTopNav.tsx) — L41, L333
- [ReportForm.tsx](file:///d:/MESO-app/src/features/reports/pages/ReportForm.tsx) — L62

---

### [SMELL-05] Definisikan Type untuk `profileData` dan `userData`

#### [MODIFY] [PatientTopNav.tsx](file:///d:/MESO-app/src/features/reports/components/PatientTopNav.tsx#L21)

Tambahkan interface di atas komponen:
```tsx
interface PatientProfileData {
  id: string
  full_name: string | null
  cancer_site: string | null
  date_of_birth: string | null
  phone_number: string | null
  hospital_id: string | null
}

// Ganti:
const [profileData, setProfileData] = useState<any>(null)
// Dengan:
const [profileData, setProfileData] = useState<PatientProfileData | null>(null)
```

#### [MODIFY] [ForgotPasswordPage.tsx](file:///d:/MESO-app/src/features/auth/pages/ForgotPasswordPage.tsx#L24)

```tsx
interface ForgotPasswordUserData {
  id: string
  phone_number: string | null
  email: string | null
}

// Ganti:
const [userData, setUserData] = useState<any>(null)
// Dengan:
const [userData, setUserData] = useState<ForgotPasswordUserData | null>(null)
```

---

### [SMELL-06] Fix Unsafe Cast di `PharmacistPatients`

#### [MODIFY] [PharmacistPatients.tsx](file:///d:/MESO-app/src/features/reports/pages/PharmacistPatients.tsx#L85)

```diff
- setStatusFilter(opt.value as any)
+ setStatusFilter(opt.value)
```

Pastikan array filter options sudah di-type dengan `StatusFilter` union type yang sesuai.

---

### [SMELL-07] Ekstrak Duplikasi Status Badge Logic

#### [NEW] Perluasan [StatusBadge.tsx](file:///d:/MESO-app/src/components/ui/StatusBadge.tsx)

Komponen `StatusBadge` yang ada diperluas untuk menerima props `overallStatus`, `isActive`, dan `statusReason`, menggantikan ~30 baris duplikat di `PharmacistPatients.tsx` (desktop table L236-266 dan mobile card L332-362).

```tsx
// Penggunaan baru:
<PatientStatusBadge
  overallStatus={patient.overallStatus}
  isActive={patient.isActive}
  statusReason={patient.statusReason}
/>
```

---

### [DEBT-04] Hapus Widget Cuaca Hardcoded di `PharmacistSchedule`

#### [MODIFY] [PharmacistSchedule.tsx](file:///d:/MESO-app/src/features/reports/pages/PharmacistSchedule.tsx#L460)

Hapus atau ganti widget "Kondisi Lingkungan" (24°C / "Ideal") dengan keterangan yang jelas bahwa ini adalah placeholder:

```diff
- <p className="text-[10px] font-black text-on-surface mt-1">24°C</p>
- <p className="text-stone-400 text-[10px]">Ideal</p>
+ {/* DEBT-04: Widget cuaca dihapus — tidak terhubung ke data nyata */}
+ {/* Akan diimplementasikan di Sprint berikutnya via weather API */}
```

Atau hapus seluruh widget jika tidak ada rencana integrasi API cuaca di near-term.

---

### [DEBT-05] Fix CSV Header Quoting di `exportToCSV`

#### [MODIFY] [helpers.ts](file:///d:/MESO-app/src/utils/helpers.ts#L105)

```diff
- const headers = Object.keys(data[0]).join(',')
+ const headers = Object.keys(data[0]).map(h => `"${h}"`).join(',')
```

---

## Sprint 3 — 🟠 God Class Refactor

> [!NOTE]
> Sprint ini adalah yang paling berisiko dari sisi regresi. Lakukan dengan teliti dan tes manual setiap sub-fitur setelah refactor.

---

### [GOD-02] Refactor Duplikasi di `PharmacistSettings`

#### [MODIFY] [PharmacistSettings.tsx](file:///d:/MESO-app/src/features/reports/pages/PharmacistSettings.tsx)

**Langkah 1:** Ekstrak `handleTestPharma` dan `handleTestDoctor` menjadi satu fungsi generik:

```tsx
const handleTestWA = async (phone: string, recipientLabel: string, setLoading: (v: boolean) => void) => {
  if (!phone) return toast.error(`Nomor WA ${recipientLabel} belum diisi`)
  setLoading(true)
  try {
    await whatsappService.sendMessage({
      target: phone,
      message: `CITO! [TEST] Ini adalah pesan tes untuk ${recipientLabel} dari sistem MESO.`
    })
    toast.success(`Pesan tes berhasil dikirim ke ${recipientLabel}!`)
  } catch {
    toast.error(`Gagal mengirim pesan tes ke ${recipientLabel}.`)
  } finally {
    setLoading(false)
  }
}
```

**Langkah 2:** Konversi `checkFonnteStatusViaServer` menjadi React Query hook di `useSystemSettings.ts`:

```tsx
// Di useSystemSettings.ts — tambahkan:
export function useFonnteStatus() {
  return useQuery({
    queryKey: ['fonnteStatus'],
    queryFn: checkFonnteStatusViaServer,
    staleTime: 60 * 1000, // 1 menit
    refetchOnWindowFocus: false,
  })
}
```

Hapus `useEffect` + manual state `fonnteStatus` di `PharmacistSettings.tsx`, ganti dengan `const { data: fonnteStatus = 'loading' } = useFonnteStatus()`.

---

### [GOD-01] Pecah `PatientTopNav` menjadi Komponen Terpisah

Ini adalah refactor terbesar. Lakukan secara bertahap:

#### Langkah 1 — Ekstrak ke Custom Hook

#### [NEW] `usePatientProfile.ts`

```
src/features/reports/hooks/usePatientProfile.ts
```

Hook ini mengambil alih `fetchProfile()` dan mutasi update `phone_number` dari `PatientTopNav`:

```tsx
export function usePatientProfile(userId: string | undefined) {
  // useQuery untuk fetch profil
  // useMutation untuk update phone_number
  // return: { profileData, isLoading, updatePhone, isSaving }
}
```

#### Langkah 2 — Ekstrak Komponen UI

#### [NEW] `ProfileModal.tsx`

```
src/features/reports/components/ProfileModal.tsx
```

Memindahkan JSX profil modal (baris 209-350 di `PatientTopNav`) ke komponen terpisah. Props: `{ isOpen, onClose, userId }`.

#### [NEW] `NotificationPanel.tsx`

```
src/features/reports/components/NotificationPanel.tsx
```

Memindahkan JSX notification overlay (baris 122-207 di `PatientTopNav`). Props: `{ isOpen, onClose, notifications, onMarkRead, onMarkAllRead }`.

#### Langkah 3 — Sederhanakan `PatientTopNav`

Setelah ekstrak, `PatientTopNav.tsx` hanya berisi ~80 baris: header bar + import + render dua komponen di atas.

---

## Sprint 4 — 🟢 Tech Debt (Backlog)

> [!NOTE]
> Sprint 4 **tidak harus selesai sebelum handover** tetapi sebaiknya di-track di project backlog.

---

### [SEC-02] Mitigasi PII di URL (OTP Deep Link)

**Masalah:** Nomor HP pasien muncul di URL query string `?phone=...` dari WhatsApp deep link.

**Solusi yang direkomendasikan:**
1. Buat Supabase Edge Function `generate-otp-session` yang menerima phone number, menyimpan data sementara di tabel `otp_sessions` (TTL 10 menit), dan mengembalikan short token UUID.
2. Deep link yang dikirim via WhatsApp menggunakan token: `?token=<uuid>` bukan `?phone=...`.
3. Di `ForgotPasswordPage`, resolve token ke data user via API call ke Edge Function.

**Estimasi:** 1-2 hari sprint.

---

### [DEBT-02] Pecah `ForgotPasswordPage` menjadi Multi-Step Components

Setiap `step` (1-4) dalam `ForgotPasswordPage.tsx` diekstrak ke komponen terpisah untuk readability dan testability:

- `Step1PhoneSearch.tsx`
- `Step2OtpVerify.tsx`
- `Step3NewPassword.tsx`
- `Step4Success.tsx`

**Estimasi:** 3-4 jam.

---

### [DEBT-03] Implementasi Notifikasi Real-time via Supabase Realtime

Mengganti placeholder statik notifikasi di `PharmacistPatients.tsx` dengan subscription Supabase Realtime ke tabel `notifications`.

**Estimasi:** 1 sprint penuh (tergantung data model notifikasi).

---

## Verification Plan

### Sprint 1 (Security)
- [ ] Buka URL WA dari `PharmacistSchedule` — pastikan tab baru terbuka tanpa `window.opener` aktif (cek di DevTools)
- [ ] Simulasikan klik tombol copy di halaman edukasi dengan clipboard diblokir — pastikan toast error muncul
- [ ] Navigasi ke `/pharma/settings` via sidebar — pastikan tidak ada 404

### Sprint 2 (Code Smell)
- [ ] Jalankan `tsc --noEmit` untuk memastikan tidak ada error TypeScript baru setelah refactor type
- [ ] Tes export CSV dari `PharmacistDashboard` — buka file di Excel dan pastikan kolom tidak rusak

### Sprint 3 (God Class)
- [ ] Tes profil modal di halaman pasien: buka modal, update nomor WA, pastikan tersimpan
- [ ] Tes notification panel: mark as read, mark all read
- [ ] Tes settings page: simpan token Fonnte, cek status koneksi, test kirim WA ke apoteker dan dokter

### Manual Regression
- [ ] Full login flow (phone, ID, email)
- [ ] Submit laporan gejala (pasien)
- [ ] Eskalasi laporan (apoteker)
- [ ] Export rekap CSV (apoteker)

---

## Open Questions

> [!IMPORTANT]
> **Pertanyaan untuk diklarifikasi sebelum eksekusi Sprint 4:**
> 1. Apakah ada rencana integrasi analytics (GA, Mixpanel) di masa depan? Ini menentukan urgensi SEC-02.
> 2. Apakah widget "Kondisi Lingkungan" (cuaca) akan digantikan data nyata atau dihapus permanen?
> 3. Apakah `DEBT-03` (notifikasi realtime) masuk scope handover atau sprint berikutnya?
