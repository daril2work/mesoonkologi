# Implementation Plan — Pharmacist Dashboard Phase 2.1 (Fixes & Dynamic Data)

Rencana ini bertujuan untuk membereskan temuan audit pada Fase 2.1, mengubah dashboard dari statis/mock menjadi sistem dinamis yang terhubung sepenuhnya dengan data Supabase, serta memperbaiki navigasi dan fungsionalitas yang terputus.

## User Review Required

> [!IMPORTANT]
> **P0 - Integrasi Chat**: Kita akan menghubungkan UI chat di detail pasien ke sistem `chat_messages` yang sudah ada. Mohon pastikan kebijakan RLS Supabase sudah mengizinkan apoteker membaca pesan.
> **P0 - Eskalasi Klinik**: Tombol "Eskalasi ke Dokter" akan mengaktifkan mutasi data ke tabel `interventions`. Kita perlu memastikan struktur tabel tersebut siap menerima data eskalasi.
> **UI Updates**: Beberapa fitur (Export, Filter) akan diimplementasikan sebagai fungsi nyata menggunakan data dari TanStack Query.

---

## Proposed Changes

### 1. Perbaikan Kritis (P0 - Fungsionalitas)

#### [MODIFY] [PharmacistPatientDetail.tsx](file:///d:/MESO-app/src/features/reports/pages/PharmacistPatientDetail.tsx)
- **Integrasi Chat**: Gunakan `useChatMessages` dan `useSendMessage` untuk menghubungkan UI Chat. Ganti pesan hardcoded dengan data real-time.
- **Eskalasi Klinik**: Tambahkan handler pada tombol "Eskalasi ke Dokter" menggunakan mutasi `useSubmitIntervention` (akan dibuat jika belum ada).
- **Trend Chart**: Ganti data array hardcoded dengan data `patient.trends` yang sudah tersedia dari hook `usePatientDetail`.

#### [DELETE] [usePatientDirectory.ts](file:///d:/MESO-app/src/features/reports/api/usePatientDirectory.ts)
- Hapus definisi interface `PatientDirectoryItem` dari file ini (baris 4-11) untuk menghilangkan duplikasi. Gunakan import dari `src/features/reports/types.ts`.

---

### 2. Dinamisasi Data (P1 - Real Data)

#### [MODIFY] [PharmacistDashboard.tsx](file:///d:/MESO-app/src/features/reports/pages/PharmacistDashboard.tsx)
- **Queue Details**: Ganti teks `"Lelah Ringan"` dan `"Siklus 3"` dengan data dinamis dari objek `report.symptoms` dan `report.patient.currentCycle`.
- **Dynamic Stats**: Pastikan angka statistik (Kritis/Rutin) selalu sinkron dengan panjang data `majorReports` dan `minorReports`.

#### [MODIFY] [PharmacistLayout.tsx](file:///d:/MESO-app/src/features/reports/components/PharmacistLayout.tsx)
- **Dynamic Avatar**: Ganti URL Google hardcoded dengan `ui-avatars.com` yang menggunakan nama apoteker yang sedang login (`user.fullName`).
- **Search Logic**: Implementasikan pencarian lokal sederhana pada daftar pasien/antrean (atau filter query).

#### [MODIFY] [usePatientDirectory.ts](file:///d:/MESO-app/src/features/reports/api/usePatientDirectory.ts)
- Pindahkan data mock (156, 892) keluar dari API layer. Kembalikan `null` jika data belum siap agar UI bisa menampilkan skeleton/state kosong yang benar.

---

### 3. Standarisasi & UX (P2)

#### [MODIFY] [PharmacistPatients.tsx](file:///d:/MESO-app/src/features/reports/pages/PharmacistPatients.tsx)
- **Route Constants**: Ganti link hardcoded `/pharma/education` dengan `ROUTES.PHARMA_EDUCATION`.
- **Sorting & Filter**: Implementasikan logika `sort` dasar (A-Z, Status) pada tabel pasien.

#### [MODIFY] [PatientHistory.tsx](file:///d:/MESO-app/src/features/reports/pages/PatientHistory.tsx)
- Migrasikan sisa inline styles ke Tailwind v4 agar konsisten dengan halaman dashboard pasien lainnya.

---

## Verification Plan

### Automated & Technical Tests
- **Chat Test**: Kirim pesan dari dashboard apoteker dan pastikan muncul di portal pasien secara real-time.
- **Data Integrity**: Verifikasi di DevTools bahwa grafik tren di detail pasien benar-benar berasal dari `symptom_reports` pasien tersebut.
- **Type Check**: Jalankan `tsc` untuk memastikan tidak ada lagi error duplikasi tipe `PatientDirectoryItem`.

### Manual Verification
- **Visual Check**: Pastikan avatar apoteker berubah sesuai nama (misal: "Apoteker Ahmad" -> Avatar "A").
- **Escalation Flow**: Klik tombol eskalasi dan verifikasi di database bahwa record intervensi baru telah tercipta.
- **Patient Search**: Ketik nama di search bar sidebar dan pastikan hasil antrean terfilter dengan benar.
