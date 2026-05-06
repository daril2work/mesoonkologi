# Implementation Plan - Clinician Portal (Dashboard Dokter)

Membangun ekosistem pemantauan klinis untuk Dokter Onkologi yang berfokus pada prioritas pasien (Watchlist), data vitalitas, dan tren kualitas hidup (QoL).

## User Review Required

> [!IMPORTANT]
> **Skema Data Vitalitas**: Desain menunjukkan data Tekanan Darah, Detak Jantung, Suhu, dan SpO2. Kita perlu memutuskan apakah data ini diinput oleh pasien via mobile (klik-klik) atau diintegrasikan dari sistem RS. Untuk fase ini, kita akan asumsikan data ini opsional di tabel `symptom_reports`.

> [!TIP]
> **Alur Eskalasi**: Dashboard ini akan menjadi "penerima" dari tombol eskalasi yang ditekan apoteker sebelumnya. Pasien dengan `escalation_status = 'escalated'` akan muncul di urutan paling atas.

## Proposed Changes

### 1. Database & Schema Extension
Menambahkan kolom vitalitas ke tabel laporan jika belum ada, untuk mendukung tampilan "Statistik Vitalitas".

#### [MODIFY] [20260426_add_vitals_to_reports.sql](file:///d:/MESO-app/supabase/migrations/20260426_add_vitals_to_reports.sql) [NEW]
- Menambahkan kolom `blood_pressure`, `heart_rate`, `temperature`, `spo2` ke `symptom_reports`.
- Menambahkan kolom `qol_score` (1-10) untuk melacak Tren Kualitas Hidup.

---

### 2. API Layer (Clinician Features)
Membuat hooks khusus untuk kebutuhan dokter.

#### [NEW] [useClinicianWatchlist.ts](file:///d:/MESO-app/src/features/clinician/api/useClinicianWatchlist.ts)
- Fetch laporan dengan filter `escalation_status`.
- Support filter berdasarkan "Bangsal" dan "Siklus".

#### [MODIFY] [usePatientDetail.ts](file:///d:/MESO-app/src/features/reports/api/usePatientDetail.ts)
- Update untuk mengembalikan data vitalitas dan skor QoL untuk chart.

---

### 3. UI Components (Shared & Specific)
Membangun layout dan komponen berdasarkan desain "Sentuhan Nurani Clinical Portal".

#### [NEW] [ClinicianLayout.tsx](file:///d:/MESO-app/src/features/clinician/components/ClinicianLayout.tsx)
- Sidebar/Navbar khusus dengan menu: Daftar Pantau, Riwayat Pasien.
- Background nuansa hijau medis yang sangat soft (`#f6fbf9`).

#### [NEW] [VitalsCard.tsx](file:///d:/MESO-app/src/features/clinician/components/VitalsCard.tsx)
- Komponen grid untuk menampilkan BP, HR, Temp, dan SpO2 dengan icon medis.

#### [NEW] [QoLTrendChart.tsx](file:///d:/MESO-app/src/features/clinician/components/QoLTrendChart.tsx)
- Chart menggunakan Recharts untuk memvisualisasikan skor QoL 14 hari terakhir.

---

### 4. Pages Implementation

#### [NEW] [ClinicianWatchlist.tsx](file:///d:/MESO-app/src/features/clinician/pages/ClinicianWatchlist.tsx)
- Menampilkan "Daftar Pantau Prioritas".
- Tabel dengan kolom: ID, Nama, Bangsal/Siklus, Status Terakhir (Symptom Pills), Waktu, dan Prioritas Badge (Magenta untuk Major).

#### [NEW] [ClinicianPatientDetail.tsx](file:///d:/MESO-app/src/features/clinician/pages/ClinicianPatientDetail.tsx)
- Header pasien dengan Diagnosis & Siklus.
- Integrasi VitalsCard, ClinicalNotes, Klik-Klik Summary, dan QoLTrendChart.

## Verification Plan

### Automated Tests
- `npm run test` (jika tersedia) untuk memvalidasi pemetaan data vitalitas.
- Browser test: Memastikan filter "Bangsal" menyaring data tabel dengan benar.

### Manual Verification
1. Login sebagai Dokter.
2. Buka "Daftar Pantau" dan pastikan pasien yang dieskalasi oleh apoteker muncul di sana.
3. Klik salah satu pasien, verifikasi chart QoL merender data 14 hari terakhir.
4. Coba input "Catatan Klinis" dan simpan.
