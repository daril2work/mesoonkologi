# Fase 6: Pharmacist Clinical Dashboard — Master Plan

**Design System**: Sentuhan Nurani (Stitch MCP)  
**Prinsip**: Dev speed without quality code base is nonsense.  
**Ritme**: Setiap sub-fase dikerjakan di sesi terpisah → code review → approval → lanjut.

---

## Keputusan Arsitektur (Finalized)

| Pertanyaan | Keputusan |
| :--- | :--- |
| Ritme kerja | Satu sub-fase per sesi, terdokumentasi di `docs/` |
| Chat di Detail Pasien | **Read-only** — lihat riwayat chat, navigasi ke halaman chat untuk balas |
| Kalender (6E) | **Display-only** — tampilkan jadwal existing, tombol "Tambah" = placeholder |

---

## Design Token (Sentuhan Nurani)

| Token | Hex | Penggunaan |
| :--- | :--- | :--- |
| Page Background | `#f6f3f2` | Latar halaman |
| Card Surface | `#ffffff` | Kartu konten |
| Sidebar/Footer surface | `#fcf9f8` | Sidebar footer |
| Primary | `#046b5e` | Brand & CTA utama |
| Sentinel/Accent | `#b90c55` | Laporan prioritas |
| Warning | `#b36b00` | Status perhatian |
| Muted text | `#727878` | Meta & label sekunder |

---

## Aturan Quality (Berlaku di Semua Sub-Fase)

1. **No `any` type** — semua data dari Supabase di-map ke domain types
2. **No hardcoded routes** — selalu gunakan `ROUTES.*`
3. **No chart/calendar library** — bangun dengan SVG/CSS Grid native
4. **No `import React`** kecuali diperlukan secara eksplisit
5. **Semua button di dalam form** wajib `type="button"` atau `type="submit"` eksplisit
6. **Setiap sub-fase wajib code review** sebelum lanjut ke sub-fase berikutnya

---

## Sub-Fase 6A — Queue Redesign + Layout Fix
**Status**: 🔲 Belum Dimulai  
**Sesi**: Terpisah  

### Lingkup
Perbaiki code smell existing, redesign halaman Antrean sesuai mockup Stitch.

#### Design Target (Mockup: Antrean Laporan)
- Header: judul + tombol "Filter Laporan" + "Export Rekap"
- **Seksi 1 — Laporan Prioritas (Major)**: kartu besar dengan foto avatar pasien, nama, gejala utama, status siklus, waktu lapor, badge "BERAT", tombol "Tinjau" → navigasi ke detail
- **Seksi 2 — Laporan Rutin (Minor)**: tabel compact, kolom Nama | Gejala | Siklus | Waktu | Status | Aksi (link "Detail")
- Footer: "Tips Respon Empati" card + "Statistik Hari Ini"

#### Files
| Aksi | File | Detail |
|------|------|--------|
| MODIFY | `PharmacistLayout.tsx` | Hapus `import React`, pakai `ROUTES.*`, toast feedback logout |
| MODIFY | `PharmacistDashboard.tsx` | Redesign total sesuai mockup |
| MODIFY | `QueueItem.tsx` | Wire up navigasi ke detail |
| NEW | `components/MajorQueueCard.tsx` | Kartu khusus laporan prioritas |
| NEW | `components/MinorQueueRow.tsx` | Baris tabel laporan rutin |

---

## Sub-Fase 6B — Patient Detail + Intervention
**Status**: 🔲 Belum Dimulai  
**Sesi**: Terpisah (setelah 6A selesai + review)  

### Lingkup
Halaman detail laporan pasien lengkap dengan panel intervensi klinis.

#### Design Target (Mockup: Detail Pasien)
- **Header**: breadcrumb "← Kembali ke Antrean | Detail Pasien | ID: ..." + notif + profil
- **Patient Card**: avatar, nama, diagnosis, siklus badge, vital signs (usia, BB/TB, tensi)
- **Symptom Score Grid**: setiap gejala aktif tampil sebagai card dengan score X/5 + progress bar
- **Tren Gejala**: mini bar chart 4 laporan terakhir (SVG native, tanpa library)
- **Panel Kanan**:
  - Riwayat chat read-only + link "Buka Chat Penuh"
  - "ANALISIS SISTEM (TRIASE)": auto-generated dari `detectSentinel()` + `autoGrade()`
  - Tombol: "Eskalasi ke Dokter Onkologi", "Catatan Klinis" (form intervensi), "Ubah Regimen" (placeholder)

#### Files
| Aksi | File |
|------|------|
| NEW | `api/useReportDetail.ts` |
| NEW | `api/useSubmitIntervention.ts` |
| NEW | `components/PatientProfileCard.tsx` |
| NEW | `components/SymptomScoreGrid.tsx` |
| NEW | `components/SymptomTrendChart.tsx` (SVG native) |
| NEW | `components/InterventionPanel.tsx` |
| NEW | `pages/PharmacistReportDetail.tsx` |
| MODIFY | `AppRouter.tsx` | Daftarkan route `/pharma/report/:id` |

---

## Sub-Fase 6C — Patient Directory
**Status**: 🔲 Belum Dimulai  
**Sesi**: Terpisah (setelah 6B selesai + review)  

### Lingkup
Direktori semua pasien aktif dengan KPI dan status klinis.

#### Design Target (Mockup: Direktori Data Pasien)
- Search bar global di header
- **4 KPI Cards**: Total Pasien, Status Kritis, Jadwal Minggu Ini, Edukasi Selesai
- **Tabel Daftar Pasien**: ID | Nama + avatar | Siklus | Laporan Terakhir | Status | Aksi (→ navigasi ke 6B)
- Status badge: Stabil (hijau), Butuh Tindakan (merah), Observasi (kuning)
- Bottom panel: link ke Manajemen Edukasi + Notifikasi penting
- Pagination (UI saja, data pagination di Fase berikutnya jika diperlukan)

#### Files
| Aksi | File |
|------|------|
| NEW | `api/usePatientDirectory.ts` |
| NEW | `components/PatientStatusBadge.tsx` |
| NEW | `pages/PharmacistPatients.tsx` |
| MODIFY | `AppRouter.tsx` | Daftarkan route `/pharma/patients` |

---

## Sub-Fase 6D — Education Management
**Status**: 🔲 Belum Dimulai  
**Sesi**: Terpisah (setelah 6C selesai + review)  

### Lingkup
Halaman kelola materi edukasi untuk apoteker.

#### Design Target (Mockup: Manajemen Edukasi)
- Header: judul + tombol "Upload Materi Baru" (FAB, placeholder modal)
- Filter tab: Semua Materi, Nutrisi, Mental Health, Terapi + search bar
- Counter "Total Konten: X Materi"
- **Grid kartu**: gambar + category badge + judul + snippet + tombol edit (ikon pensil) + "Lihat Detail"
- **Featured card** (Materi Unggulan): kartu besar dengan tombol "Edit Konten" + "Analitik" (placeholder)

#### Files
| Aksi | File |
|------|------|
| NEW | `api/usePharmacistEducation.ts` | Re-use tabel `education_materials` |
| NEW | `components/EducationManagerCard.tsx` |
| NEW | `components/FeaturedEducationCard.tsx` |
| NEW | `pages/PharmacistEducation.tsx` |
| MODIFY | `AppRouter.tsx` | Daftarkan route `/pharma/education` |

---

## Sub-Fase 6E — Schedule (Display-Only)
**Status**: 🔲 Belum Dimulai  
**Sesi**: Terpisah (setelah 6D selesai + review)  

### Lingkup (Disederhanakan — Display Only)
Tampilkan jadwal yang sudah ada. Tombol tambah = placeholder.

#### Design Target (Mockup: Pengaturan Jadwal — Disederhanakan)
- Toggle Bulanan/Mingguan (hanya UI toggle, tidak merubah data)
- **Calendar Grid CSS**: tampilkan bulan saat ini dengan dot indikator per hari jika ada jadwal
- "Tambah Jadwal Baru" → disabled button dengan tooltip "Fitur segera hadir"
- **Panel Kanan (Timeline Hari Ini)**: daftar jadwal hari ini urut waktu, dengan badge SEDANG / MENDATANG
- Stats bawah: Total jadwal hari ini, slot kemoterapi, kapasitas (kalkulasi sederhana)

> **Catatan**: Fungsi add/edit/delete jadwal dipindahkan ke Fase 7.

#### Files
| Aksi | File |
|------|------|
| NEW | `api/usePharmacistSchedules.ts` | Re-use tabel `patient_schedules` |
| NEW | `components/CalendarGrid.tsx` | Pure CSS Grid, tanpa library |
| NEW | `components/DayTimeline.tsx` | Timeline panel kanan |
| NEW | `pages/PharmacistSchedule.tsx` |
| MODIFY | `AppRouter.tsx` | Daftarkan route `/pharma/schedule` |

---

## Status Tracker

| Sub-Fase | Halaman | Sesi | Status | Review |
|----------|---------|------|--------|--------|
| **6A** | Antrean Laporan (Redesign) | — | 🔲 Belum | — |
| **6B** | Detail Pasien + Intervensi | — | 🔲 Belum | — |
| **6C** | Direktori Data Pasien | — | 🔲 Belum | — |
| **6D** | Manajemen Edukasi | — | 🔲 Belum | — |
| **6E** | Pengaturan Jadwal (Display) | — | 🔲 Belum | — |
