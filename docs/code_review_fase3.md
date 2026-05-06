# Code Review: Fase 3 (Patient Symptom Reporting)
**Tingkat Analisis: Sangat Kritis & Arsitektural (Mendalam)**

Dokumen ini membedah kode hasil penyelesaian Fase 3 (Reporting Engine, React Query, UI Pasien, dan Algoritma CTCAE). Analisis dilakukan tidak hanya berpusat pada jalan atau tidaknya aplikasi, melainkan stabilitas tipe (Type Safety), performa eksekusi, keamanan Supabase, dan desain *maintainability*.

---

## 1. Analisis Keamanan & Database (Supabase `setup_reports.sql`)

### ✅ Kekuatan (Strengths)
*   **Bypass Isolasi Sempurna:** Row Level Security (RLS) diimplementasikan dengan `auth.uid() = patient_id`. Skema ini menjamin *Zero-Trust Architecture* di mana bahkan jika API publik terekspos, *hacker/user* lain sama sekali tak bisa mencomot *history* keluhan pasien sebelahnya.
*   **Trigger Realtime Waktu:** Penggunaan fungsi *plpgsql* `handle_updated_at()` sangat standar dan mencegah manipulasi stempel waktu dari sisi *frontend*.

### ⚠️ Observasi Kritis (Archietecture Bottleneck / Tech Debt)
*   **Sub-query RLS untuk Tenaga Medis (Performa N+1):**
    Di dalam `setup_reports.sql`, kebijakan (*policy*) Apoteker dipasang seperti ini:
    ```sql
    USING (EXISTS (SELECT 1 FROM public.profiles WHERE profiles.id = auth.uid() AND profiles.role IN ('pharmacist', 'doctor', 'admin')))
    ```
    *Dampak:* Ketika kita menarik (*SELECT*) 10.000 riwayat keluhan, Supabase/PostgreSQL harus memvalidasi `EXISTS` *table join* 10.000 kali. 
    *Saran Refactor Masa Depan:* Di Fase akhir (Optimization), kita sebaiknya menyuntikkan (inject) informasi "Role" ke dalam JWT Token Supabase (`auth.jwt()->>'role'`). Dengan jwt-claim, validasi ini memakan biaya waktu O(1) karena pembacaan memori murni tanpa *query database*.

---

## 2. Manajemen State & Sinkronisasi (React Query)

### ✅ Kekuatan (Strengths)
*   **Cache Invalidation:** Pemanggilan `queryClient.invalidateQueries({ queryKey: ['patientReports', user?.id] })` di dalam hook `useSubmitReport.ts` sangat elegan. Begitu laporan meluncur tanpa galat, halaman Dasbor otomatis akan menarik ulang (refetch) daftar harian secara transparan (tanpa loading berat).
*   **Pencekikan Spam Permintaan (Query Throttling):** Ditanamkan `staleTime: 1000 * 60 * 5` (5 Menit) di root konfigurasi `QueryClient`. Ini mencegah aplikasi menghantam server Supabase terus menerus setiap detik ketika Pasien melakukan navigasi dari *Dashboard* ke *Report Form* dan kembali lagi.

### ⚠️ Observasi Kritis
*   Tidak ditemukan cacat major. Penanaman logika di lapisan *custom hooks* (`usePatientReports` dan `useSubmitReport`) sudah sangat mengikuti standar *Clean Code* ketimbang menulis mutasi API langsung di dalam komponen Visual React.

---

## 3. Resolusi Race Condition Autentikasi (`LoginPage.tsx`)

### ✅ Pembedahan Isu (Root Cause Analysis)
*   *Bug* **Login-Loop** yang terjadi sebelumnya disebabkan karena tabrakan (*race condition*) antara `useNavigate()` yang *synchronous* milik React-Router dengan `onAuthStateChange()` yang bersifat *asynchronous* (karena menunggu hasil tarikan Profil User dari Database).
*   Solusi dengan mengamati *reactive state*:
    ```typescript
    useEffect(() => {
       if (session && user) { navigate(from, { replace: true }) }
    }, [session, user])
    ```
    Merupakan pendekatan paling aman (*bulletproof*). Navigasi hanya dipicu SAAT sistem (*Zustand store*) benar-benar telah menyerap data pengguna hingga tetes terakhir secara organik.

---

## 4. Analisis Front-End & Algoritma Klinis (`ReportForm.tsx` & CTCAE)

### ✅ Kekuatan (Strengths)
*   **Integrity Perlindungan Sentinel:** Penerapan komputasi CTCAE terjadi tepat di perbatasan pergerakan jaringan (`useSubmitReport.ts`), *bukan* di dalam layar `ReportForm.tsx`.
*   **Type Guard pada Literal Union:** 
    Resolusi terhadap celah *type Error* `isSentinel` menggunakan Type Operator Modern:
    ```typescript
    const isSentinel = 'isSentinel' in symptom ? symptom.isSentinel : false;
    ```
    Mencegah bentrokan struktur Data Obyek (*Heterogeneous Object Maps*) dan menciptakan kompilasi bersih TypeScript (Zero `any` cast).

### ⚠️ Observasi Kritis
*   **Agnostik Kosong (Empty Payload Injection):** Bila pasien dengan sengaja tidak memilih/memencet satu pun Level (0 hingga 3) dan menekan "Kirim", aplikasi otomatis akan mengirim state `{}` kosong yang diterjemahkan sebagai Nilai 0. Ini tidak menyebabkan *crash*, namun ada kemungkinan kita butuh *feedback* tegas di masa depan (e.g. *Apakah Anda yakin tidak ada gejala apa-apa hari ini?*).
*   **Inline Styling (Maintainability Debt):** Penulisan desain CSS di `ReportForm.tsx` sangat agresif disuntikkan secara *inline-style* (karena mengadopsi abstraksi Stitch MCP primitif). 
    *Kalkulasi ke depan:* *Inline Style* merusak prinsip DRY (Don't Repeat Yourself) dan sulit diwarnai via *Tailwind Themes*. Sangat disarankan saat Fase 4 - 5 nanti, kita pindahkan properti ini menjadi *utility-classes Tailwind.*

---

## KESIMPULAN REVIEW

Secara Arsitektural dan Kestabilan Sistem: **Sangat Layak & Solid (Grade A-)**
- `A` untuk kestabilan fungsionalitas, *Type-Safety*, dan isolasi alur Autentikasi yang tangguh.
- `B+` (Minus setengah poin) atas penggunaan UI berbentuk Inline-Styles serta celah potensi performa *N+1* dari kebijakan RLS Supabase untuk akun Apoteker di masa depan. Keduanya masuk wajar karena kompensasi terhadap *Development Velocity*.

**Keputusan Akhir:** 
Tidak ada celah fatal atau pembusukan logika (*logic decay*). Skema ini telah memenuhi pilar kokoh yang siap memikul Arsitektur Dasbor Tenaga Medis untuk fase berikutnya!
