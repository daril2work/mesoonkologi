# Code Audit — Dashboard (Pharmacist & Patient Portal)

**Tanggal Audit:** 25 April 2026  
**Cakupan:** PharmacistDashboard, PharmacistPatients, PharmacistPatientDetail, PatientDashboard, PatientHistory + terkait

---

## Ringkasan Eksekutif

| Kategori | Jumlah Temuan |
|---|---|
| Fungsionalitas Tidak Bekerja (Tombol Mati) | 14+ |
| Data Hardcoded (Palsu) | 11 |
| Fitur Placeholder / Belum Dikembangkan | 5 |
| Inkonsistensi Kode / Code Smell | 6 |
| Catatan Minor / UX | 4 |

---

## 1. Fungsionalitas Tidak Bekerja (Dead Buttons)

Tombol-tombol ini terlihat aktif di UI namun **tidak memiliki handler apapun**.

### `PharmacistDashboard.tsx`

| Baris | Komponen | Masalah |
|---|---|---|
| L23 | Filter Laporan | Tidak ada onClick, tidak ada state filter. UI dummy. |
| L27 | Export Rekap | Tidak ada onClick, tidak ada logika export PDF/CSV. |
| L122-L125 | Lihat Semua Antrean Rutin | Tidak ada onClick atau paginasi. Tombol dekoratif. |

### `PharmacistPatients.tsx`

| Baris | Komponen | Masalah |
|---|---|---|
| L22 | Filter | Tidak ada handler. Filter tidak bekerja. |
| L26 | Export Data | Tidak ada handler. Export tidak bekerja. |
| L70-L74 | Sort Select | Hanya visual, tidak ada onChange. Urutan tabel tidak berubah. |
| L139-L141 | Tombol chat_bubble per baris | Tidak ada handler. Chat tidak terbuka. |
| L142-L144 | Tombol edit_calendar per baris | Tidak ada handler. Jadwal tidak terbuka. |
| L159-L170 | Pagination (halaman 1, 2, 3) | Pagination adalah dummy. Data tidak berpindah halaman. |

### `PharmacistPatientDetail.tsx`

| Baris | Komponen | Masalah |
|---|---|---|
| L229-L236 | Input Chat + Tombol Send | Send tidak memiliki onClick. **Pesan tidak akan terkirim.** |
| L243 | Eskalasi ke Dokter Onkologi | Tombol kritis klinis tanpa handler apapun. |
| L249 | Catatan Klinis | Tidak ada handler. Modal tidak terbuka. |
| L253 | Ubah Regimen | Tidak ada handler. Fitur tidak tersedia. |

### `PharmacistLayout.tsx`

| Baris | Komponen | Masalah |
|---|---|---|
| L64 | Buat Laporan Baru | Tidak ada onClick atau navigasi. |
| L71-L74 | Bantuan | Tidak ada handler. |
| L87-L93 | Search Bar | Input tanpa onChange, tidak ada logika pencarian. |

### `PatientDashboard.tsx`

| Baris | Komponen | Masalah |
|---|---|---|
| L97-L99 | Atur Pengingat | Tidak ada onClick. Fitur pengingat tidak tersedia. |

---

## 2. Data Hardcoded (Palsu)

Data ini **tidak diambil dari database** dan selalu sama untuk semua pengguna.

### `PharmacistDashboard.tsx`

| Baris | Data Palsu | Dampak |
|---|---|---|
| L94 | "Lelah Ringan" pada kolom Gejala | Setiap laporan minor menampilkan gejala yang sama. |
| L97 | "Siklus 3" pada kolom Siklus | Siklus selalu tertulis "Siklus 3", bukan data aktual. |
| L137 | Tips Empati: "Ibu Sari sedang di siklus kritis..." | Nama pasien dan saran hardcoded, bukan dinamis. |
| L188 | "Siklus 3 (Hari 4)" di MajorCard | Status siklus statis untuk semua laporan berat. |

### `PharmacistPatients.tsx`

| Baris | Data Palsu | Dampak |
|---|---|---|
| L37 | Fallback '1,284' untuk total pasien | Fallback adalah angka besar palsu. |
| L45 | Fallback '24' untuk status kritis | Angka palsu. |
| L50 | Fallback '156' untuk jadwal minggu ini | Palsu. Dikonfirmasi di API: `scheduledThisWeek: 156, // Mock for now`. |
| L55 | Fallback '892' untuk edukasi selesai | Palsu. Dikonfirmasi di API: `completedEducation: 892 // Mock for now`. |
| L198 | Notifikasi: "Jadwal Ibu Dewi Ratnasari berbenturan..." | Notifikasi dummy hardcoded, bukan dari sistem notifikasi. |
| L202 | Notifikasi: "Data pasien Bambang Susilo perlu divalidasi..." | Nama pasien dan pesan fiktif. |

### `PharmacistPatientDetail.tsx`

| Baris | Data Palsu | Dampak |
|---|---|---|
| L87 | "/ 158cm" untuk tinggi badan | Tinggi badan selalu 158cm untuk semua pasien. |
| L103 | "Dilaporkan 2 jam yang lalu" | Waktu laporan hardcoded, tidak menggunakan formatDistanceToNow. |
| L158-L163 | Grafik tren: array hardcoded | Grafik selalu menampilkan data fiktif, bukan riwayat laporan nyata. |
| L209-L219 | Percakapan chat | Pesan chat adalah hardcoded. Bukan data real-time dari database. |
| L263 | Teks Analisis Triase | Analisis ini adalah teks statis, bukan hasil komputasi dinamis. |

### `PatientDashboard.tsx`

| Baris | Data Palsu | Dampak |
|---|---|---|
| L26 | "Selamat pagi" selalu pagi | Salam tidak memperhitungkan waktu aktual (pagi/siang/malam). |
| L65 | Tips: "Manfaat minum air jahe hangat..." | Tips selalu sama, tidak diambil dari education_materials. |
| L115 | "5/8 Gelas hari ini" | Data intake air palsu, tidak ada fitur tracking. |
| L124 | "Cukup baik pagi ini" | Data porsi makan palsu. |
| L155 | Avatar Suster Maya hardcoded | Nama pendamping selalu "Maya", tidak terhubung ke profil apoteker. |

---

## 3. Fitur Placeholder / Belum Dikembangkan

| File | Fitur | Status |
|---|---|---|
| `PharmacistReportDetail.tsx` | Seluruh halaman | Hanya "Sedang dikembangkan...". Route ada tapi halaman kosong. |
| `PharmacistPatientDetail.tsx` | Chat box | UI ada tapi tidak terhubung ke useChatMessages. Chat palsu. |
| `PharmacistPatientDetail.tsx` | Trend Chart | Grafik bar menggunakan data hardcoded, bukan data patient.trends dari API. |
| `PharmacistPatients.tsx` | Pagination | UI ada tapi tidak ada logika offset/limit di query. |
| `PatientDashboard.tsx` | Catatan Nutrisi | Widget statis. Belum ada fitur input tracking nutrisi. |

---

## 4. Inkonsistensi Kode / Code Smell

### Duplikasi Definisi Tipe
`PatientDirectoryItem` didefinisikan di **dua tempat**:
- `src/features/reports/api/usePatientDirectory.ts` (baris 4-11)
- `src/features/reports/types.ts` (baris 82-89)

Salah satunya harus dihapus untuk menghindari konflik tipe.

### Route String Hardcoded
Di `PharmacistPatients.tsx` L182:
```
to="/pharma/education"
```
Seharusnya ROUTES.PHARMA_EDUCATION dari app.config.ts.

Di `PharmacistPatientDetail.tsx` L31:
```
to="/pharma/dashboard"
```
Seharusnya ROUTES.PHARMA_DASHBOARD.

### Avatar Hardcoded di PharmacistLayout
Baris L114 menggunakan URL Google lh3.googleusercontent.com yang spesifik dan tidak dinamis.

### Mock Data di Lapisan API
Di usePatientDirectory.ts baris 61-62:
```
scheduledThisWeek: 156, // Mock for now
completedEducation: 892 // Mock for now
```
Mock data seharusnya tidak berada di lapisan API.

---

## 5. Catatan UX Minor

| File | Masalah |
|---|---|
| `PharmacistDashboard.tsx` | Greeting time selalu "pagi" tanpa memperhitungkan waktu |
| `PatientHistory.tsx` | Masih menggunakan inline styles, belum dimigrasikan ke Tailwind v4 |
| `PharmacistPatientDetail.tsx` | Header top bar menduplikasi header dari PharmacistLayout (dua header fixed) |
| `PharmacistPatients.tsx` | Sort dropdown ada tapi tidak fungsional — menyesatkan pengguna |

---

## Prioritas Perbaikan yang Direkomendasikan

### P0 — Kritis (Fungsional Rusak)
1. **Chat Panel di PharmacistPatientDetail**: Hubungkan ke useChatMessages dan useSendMessage.
2. **Tombol Eskalasi**: Implementasikan mutasi untuk menyimpan data ke tabel interventions.
3. **Duplikasi Tipe PatientDirectoryItem**: Hapus definisi dari usePatientDirectory.ts, biarkan hanya di types.ts.

### P1 — Penting (Data Nyata)
4. **Grafik Tren**: Gunakan patient.trends dari API, gantikan data hardcoded.
5. **Gejala & Siklus di Minor Reports**: Ambil dari data laporan aktual.
6. **Mock Stats**: Ganti fallback '24', '156', '892' menjadi null dengan tampilan loading skeleton.
7. **Avatar PharmacistLayout**: Ganti hardcoded Google URL dengan ui-avatars.com berbasis user.fullName.

### P2 — Standar (Teknis)
8. **Route Constants**: Ganti semua string literal /pharma/... ke konstanta ROUTES.*.
9. **Migrasi PatientHistory.tsx**: Pindahkan inline styles ke Tailwind v4.
10. **Mock API Data**: Pindahkan mock scheduledThisWeek dan completedEducation dari lapisan API ke UI.
