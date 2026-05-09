# Code Review: Fitur Manajemen Jadwal Klinis Apoteker
**Tanggal Review:** 9 Mei 2026  
**Scope:** `PharmacistSchedule.tsx`, `usePatientSchedule.ts`, `usePatientDirectory.ts`, `fonnte.service.ts`, `send-whatsapp/index.ts`, `reportMapper.ts`, `types.ts`  
**Status Keseluruhan:** ✅ Lolos TypeScript — 0 Error

---

## 1. Ringkasan Fitur yang Diimplementasikan

| # | Fitur | Status |
|---|-------|--------|
| 1 | Kalender Bulanan & Mingguan interaktif (toggle + navigasi) | ✅ Aktif |
| 2 | Klik sel kalender → sinkronisasi panel Timeline | ✅ Aktif |
| 3 | Pre-fill tanggal modal berdasarkan sel yang diklik | ✅ Aktif |
| 4 | Query jadwal dinamis berdasarkan bulan aktif | ✅ Aktif |
| 5 | Otomatisasi WA Reminder H-1 via Fonnte Scheduled API | ✅ Aktif |
| 6 | Edge Function `send-whatsapp` mendukung parameter `schedule` | ✅ Aktif |
| 7 | Model data pasien menyertakan `phoneNumber` | ✅ Aktif |

---

## 2. File-by-File Review

---

### 📄 `PharmacistSchedule.tsx`
**Path:** `src/features/reports/pages/PharmacistSchedule.tsx` (560 baris)

#### ✅ Hal yang Baik

- **Pemisahan Logika Cerdas:** Penambahan blok `try-catch` independen untuk otomatisasi WA memastikan kegagalan WA tidak mematikan alur simpan jadwal — ini adalah pola *failsafe* yang tepat dan sangat disarankan.
- **Kalkulasi H-1 Akurat:** Logika hitung `reminderTime = appointmentTime - 24 jam` sudah benar, beserta fallback ke `+5 menit` jika waktu sudah lewat.
- **Pembagian State yang Rapi:** State `viewType`, `currentDate`, dan `selectedDate` saling independen sehingga tidak ada risiko mutasi silang.
- **Kalender Dinamis:** Penggunaan `eachDayOfInterval` dari `date-fns` dengan kondisi `viewType` menghasilkan grid yang responsif dan benar secara kalender.

#### ⚠️ Temuan & Rekomendasi

**[M-01] — `schedule_date` menggunakan suffix `Z` (UTC) tanpa konversi zona waktu**
```typescript
// Baris 42 — Saat ini
schedule_date: `${formData.date}T${formData.time}:00Z`,

// Risiko: Pasien di WIB (GMT+7) mendaftar jam 09:00 WIB, disimpan sebagai 09:00Z (= 16:00 WIB)
// Kalender akan menampilkan jam yang berbeda dari yang diketik apoteker
```
> [!WARNING]
> **Tingkat Keparahan: Medium.** Data waktu disimpan seolah-olah UTC padahal apoteker memasukkan waktu lokal WIB. Ini dapat menyebabkan jadwal yang muncul di kalender (dan pesan WA) memiliki jam yang salah.
>
> **Rekomendasi:** Gunakan `new Date(`${formData.date}T${formData.time}:00`).toISOString()` atau tambahkan offset: `` `${formData.date}T${formData.time}:00+07:00` ``.

---

**[M-02] — Tipe `any` pada `useCreateSchedule.mutationFn`**
```typescript
// usePatientSchedule.ts baris 100
mutationFn: async (schedule: any) => {
```
> [!NOTE]
> **Tingkat Keparahan: Low.** Penggunaan `any` menghilangkan manfaat type-safety pada payload mutasi insert. Disarankan membuat interface `CreateSchedulePayload` yang eksplisit.
>
> **Rekomendasi:**
> ```typescript
> interface CreateSchedulePayload {
>   patient_id: string
>   title: string
>   schedule_date: string
>   location: string
>   notes?: string
> }
> mutationFn: async (schedule: CreateSchedulePayload) => { ... }
> ```

---

**[M-03] — Tipe `any` pada `usePharmacistSchedules` mapper**
```typescript
// usePatientSchedule.ts baris 65
return (data || []).map((item: any) => ({
```
> [!NOTE]
> **Tingkat Keparahan: Low.** Sudah dipakai dengan benar secara fungsional, namun idealnya dibuat interface internal `PharmacistScheduleRow` untuk memperjelas kontrak data dari Supabase.

---

**[M-04] — Tombol "Kirim Reminder WA" menggunakan `VITE_FONNTE_TOKEN` sebagai flag aktif**
```typescript
// PharmacistSchedule.tsx baris 398
const isWAConfigured = !!import.meta.env.VITE_FONNTE_TOKEN
```
> [!CAUTION]
> **Tingkat Keparahan: Medium-Security.** Variabel `VITE_*` masuk ke dalam bundle JavaScript dan dapat diinspeksi oleh siapa saja di DevTools browser. Meskipun ini hanya digunakan sebagai flag boolean, sebaiknya flag ini diubah menjadi variabel terpisah (misal `VITE_WA_ENABLED=true`) yang tidak mengekspos nilai token itu sendiri.
>
> **Catatan:** Token sebenarnya sudah aman disimpan di Supabase Secrets. Hanya penggunaannya sebagai pengecekan UI yang perlu diperhatikan.

---

**[M-05] — `handleSendReminder` tidak ada tipe eksplisit pada parameter `schedule`**
```typescript
// Baris 86 — saat ini
const handleSendReminder = async (schedule: any) => {
```
> [!NOTE]
> **Tingkat Keparahan: Low.** Disarankan menggunakan tipe yang lebih spesifik agar autocomplete IDE bekerja dengan benar.

---

**[M-06] — Kapasitas Klinik Hard-coded**
```typescript
// Baris 327 — saat ini
{Math.min(100, Math.round((todaySchedules.length / 10) * 100))}%
```
> [!NOTE]
> **Tingkat Keparahan: Low.** Nilai kapasitas maksimum `10` ditulis secara hard-coded. Untuk skalabilitas dan fleksibilitas klinik, nilai ini sebaiknya dipindahkan ke konfigurasi (env variable atau pengaturan database).

---

### 📄 `usePatientSchedule.ts`
**Path:** `src/features/reports/api/usePatientSchedule.ts`

#### ✅ Hal yang Baik

- `queryKey` menggunakan `[year, month]` yang memastikan cache ter-isolasi per bulan — ini desain caching yang sangat tepat dan efisien untuk kalender.
- Query mengambil rentang dari awal minggu pertama hingga akhir minggu terakhir bulan, mencegah jadwal "terpotong" di sel batas kalender.
- Cache invalidation pada `useCreateSchedule.onSuccess` dan `useUpdateScheduleStatus.onSuccess` sudah diterapkan dengan benar — UI akan otomatis ter-refresh setelah perubahan data.

#### ⚠️ Temuan

**[S-01] — Tidak ada tipe eksplisit pada hasil mapping `usePharmacistSchedules`**
> [!NOTE]
> Disarankan membuat interface lokal atau mengekspornya sebagai tipe (misalnya `PharmacistScheduleItem`) dan menjadikannya return type eksplisit dari hook tersebut.

---

### 📄 `fonnte.service.ts`
**Path:** `src/services/fonnte.service.ts`

#### ✅ Hal yang Baik

- Seluruh komunikasi dengan Fonnte API sudah dialihkan melalui Supabase Edge Function (tidak ada panggilan langsung ke `api.fonnte.com` dari browser).
- Parameter `schedule` ditambahkan dengan benar sebagai opsional agar tidak mengubah perilaku fitur pengiriman manual yang sudah ada.

#### ⚠️ Temuan

**[F-01] — `delay` pada interface `WAOptions` tidak digunakan**
```typescript
delay?: number    // Delay in seconds
```
> [!NOTE]
> Field `delay` di interface `WAOptions` tidak pernah dikirim ke Edge Function. Jika tidak direncanakan untuk digunakan, sebaiknya dihapus atau digantikan sepenuhnya oleh `schedule`.

---

### 📄 `send-whatsapp/index.ts` (Supabase Edge Function)

#### ✅ Hal yang Baik

- Token Fonnte diambil dari `Deno.env.get('FONNTE_TOKEN')` (Supabase Secrets) — tidak pernah terekspos ke frontend.
- Normalisasi nomor telepon sudah ditangani (prefix `0` → `62`).
- Parameter `schedule` ditambahkan dengan kondisional (`if (schedule)`) sehingga tidak mengubah perilaku pengiriman instan yang sudah ada.

#### ⚠️ Temuan

**[E-01] — Validasi Input Minimal**
> [!WARNING]
> Saat ini tidak ada validasi apakah `target` dan `message` adalah string non-kosong sebelum dikirim ke API Fonnte. Sebaiknya tambahkan guard:
> ```typescript
> if (!target || !message) {
>   return new Response(JSON.stringify({ error: 'target and message are required' }), { status: 400 })
> }
> ```

**[E-02] — `schedule` dapat menerima nilai masa lalu**
> [!NOTE]
> Tidak ada validasi bahwa nilai `schedule` yang diterima Edge Function adalah timestamp di masa depan. Jika klien mengirim timestamp yang sudah lewat, Fonnte mungkin menolak atau mengabaikan pesan tersebut. Validasi sebaiknya dilakukan di sisi frontend (sudah sebagian ditangani oleh logika fallback di `PharmacistSchedule.tsx`) maupun di Edge Function.

---

### 📄 `reportMapper.ts` & `types.ts` & `usePatientDirectory.ts`

#### ✅ Hal yang Baik

- Penambahan `phone_number` ke query dan mapper dilakukan dengan minimal dan non-breaking — tidak mengubah perilaku komponen lain yang sudah menggunakan `usePatientDirectory`.
- Field `phoneNumber` dibuat opsional (`phoneNumber?: string`) di `PatientDirectoryItem` sehingga komponen yang tidak membutuhkan field ini tidak perlu dimodifikasi.
- Interface `SupabaseProfileRow` internal di `reportMapper.ts` juga diperbarui secara konsisten.

---

## 3. Matriks Prioritas Temuan

| ID | File | Kategori | Keparahan | Prioritas Perbaikan |
|----|------|----------|-----------|---------------------|
| M-01 | `PharmacistSchedule.tsx` | Bug Logika (Zona Waktu) | 🟠 Medium | Segera |
| M-04 | `PharmacistSchedule.tsx` | Keamanan (Security) | 🟠 Medium | Segera |
| E-01 | `send-whatsapp/index.ts` | Validasi Input | 🟠 Medium | Sprint Berikutnya |
| E-02 | `send-whatsapp/index.ts` | Robustness | 🟡 Low-Medium | Sprint Berikutnya |
| M-02 | `usePatientSchedule.ts` | Type Safety | 🟡 Low | Improvement |
| M-03 | `usePatientSchedule.ts` | Type Safety | 🟡 Low | Improvement |
| M-05 | `PharmacistSchedule.tsx` | Type Safety | 🟡 Low | Improvement |
| M-06 | `PharmacistSchedule.tsx` | Maintainability | 🟡 Low | Improvement |
| F-01 | `fonnte.service.ts` | Code Cleanliness | 🟢 Trivial | Opsional |
| S-01 | `usePatientSchedule.ts` | Type Safety | 🟢 Trivial | Opsional |

---

## 4. Ringkasan Kualitas Kode

```
Keamanan (Security)   : ██████████░  90% — Token aman di Supabase Secrets. Minor: flag WA di env.
Type Safety           : ████████░░░  80% — Beberapa `any` tersisa, non-blocking.
Logika Bisnis         : █████████░░  85% — Kritis: zona waktu UTC vs WIB perlu diperhatikan.
Robustness / Error    : ████████░░░  80% — Failsafe WA sudah ada. Edge Function butuh lebih validasi.
Maintainability       : █████████░░  90% — Struktur rapi, cache strategy sudah tepat.
```

**Kesimpulan:** Fitur Manajemen Jadwal Klinis dan Otomatisasi WA Reminder H-1 ini secara keseluruhan sudah diimplementasikan dengan standar produksi yang baik. Satu-satunya temuan yang disarankan untuk segera ditangani adalah **[M-01] Zona Waktu UTC** dan **[M-04] Flag Env Security**.
