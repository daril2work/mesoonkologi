# Rencana Implementasi: Penyesuaian Gejala & Tab QoL (Fase 1)

Rencana implementasi ini menjelaskan rancangan teknis dan perubahan kode untuk menanggapi umpan balik klien pada aplikasi MESO di **Fase 1 (S1)**, yang berfokus pada pembaruan checklist gejala fisik, label skala kustom, penambahan gejala baru, serta antarmuka tab pelaporan.

> [!NOTE]
> **Pemisahan Fase:** Perombakan sistem Autentikasi (WhatsApp / ID Pasien & Fonnte OTP Recovery) beserta verifikasi manualnya telah dipisahkan ke dalam **Fase 2 (S2)** agar pengerjaan lebih terfokus dan aman.

---

## 1. Persetujuan & Penyesuaian Analisis (Approved Decisions)

Berdasarkan diskusi sebelumnya, berikut keputusan yang telah disetujui untuk **Fase 1**:
1. **Koreksi Typo/Mismatch:** Kami menukar deskripsi keparahan untuk **Gangguan Tidur** dan **Nafsu Makan Turun** agar sesuai secara klinis.
2. **Penggabungan "Nyeri Kesemutan":** Menggabungkan `pain` ("Nyeri") dan `neuropathy` ("Kesemutan") menjadi satu kartu UI bernama **"Nyeri Kesemutan"** dengan key database `neuropathy`.
3. **Pertahankan Gejala Kritis:** Tetap mempertahankan **Demam** (`fever`), **Sesak Napas** (`dyspnea`), dan **Reaksi Kulit** (`skinReaction`) sebagai bagian dari pelaporan utama karena perannya yang vital dalam Triase Sentinel.
4. **Layout Tab Pelaporan & QoL:** Bila status QoL pasien aktif, form pelaporan akan terbagi menjadi 2 tab: **[ Gejala MESO ]** dan **[ Survey Kualitas Hidup (QoL) ]**. Untuk sementara waktu, isi di dalam **Tab QoL dikosongkan** (berupa placeholder kosong/kontainer bersih) sesuai instruksi.

---

## 2. Detail Perubahan Kode (Proposed Changes)

### A. Master Schema Pelaporan Gejala (Symptom Schema)
#### [MODIFY] [symptoms.domain.ts](file:///d:/MESO-app/src/features/reports/constants/symptoms.domain.ts)
* Menambahkan key gejala baru ke `SymptomKey`: `constipation` (Sembelit), `alopecia` (Rambut rontok), dan `insomnia` (Gangguan tidur).
* Menonaktifkan kartu `pain` terpisah dari `REPORT_SCHEMA` untuk mengonsolidasikan pelaporannya ke `neuropathy` (Nyeri Kesemutan) di tingkat UI.
* Menambahkan item baru ke `REPORT_SCHEMA`:
  ```typescript
  { key: 'constipation', label: 'Sembelit', domain: 'CLINICAL', isClinical: true, isSentinelEligible: false },
  { key: 'alopecia', label: 'Rambut Rontok', domain: 'CLINICAL', isClinical: true, isSentinelEligible: false },
  { key: 'insomnia', label: 'Gangguan Tidur', domain: 'CLINICAL', isClinical: true, isSentinelEligible: false },
  ```

#### [MODIFY] [symptoms.ui.ts](file:///d:/MESO-app/src/features/reports/constants/symptoms.ui.ts)
* Memperbarui `SymptomUIDefinition` untuk mendukung `scaleLabels?: string[]`.
* Memperbarui entri gejala yang ada dan menambahkan gejala baru dengan deskripsi dan ikon kustom:
  * **`nausea` (Mual):** `icon: '🤢'`, label skala kustom: `['Tidak Ada', 'Ringan (tidak mengganggu aktivitas)', 'Sedang (mengganggu aktivitas, butuh obat)', 'Berat (tidak bisa makan/minum, rawat inap)']`
  * **`vomiting` (Muntah):** `icon: '🤮'`, label skala kustom: `['Tidak Ada', 'Ringan (1-2 kali/hari)', 'Sedang (3-5 kali/hari)', 'Berat (>5 kali/hari, dehidrasi)']`
  * **`diarrhea` (Diare):** `icon: '🚽'`, label skala kustom: `['Tidak Ada', 'Ringan (≤4 kali/hari)', 'Sedang (5-6 kali/hari)', 'Berat (≥7 kali/hari, dehidrasi)']`
  * **`constipation` (Sembelit):** `icon: '💩'`, label skala kustom: `['Tidak Ada', 'Ringan (1-2 hari tidak BAB)', 'Sedang (3-4 hari tidak BAB)', 'Berat (>5 hari, perlu tindakan medis)']`
  * **`mucositis` (Sariawan):** `icon: '👄'`, label skala kustom: `['Tidak Ada', 'Ringan (sedikit nyeri, bisa makan)', 'Sedang (nyeri, sulit makan padat)', 'Berat (tidak bisa makan/minum, butuh cairan IV)']`
  * **`alopecia` (Rambut Rontok):** `icon: '👩‍🦲'`, label skala kustom: `['Tidak Ada', 'Ringan (penipisan)', 'Sedang (rontok jelas, perlu penutup kepala)', 'Berat (rontok total)']`
  * **`fatigue` (Lelah):** `icon: '😴'`, label skala kustom: `['Tidak Ada', 'Ringan (sedikit lelah, bisa aktivitas)', 'Sedang (butuh istirahat sering)', 'Berat (tidak mampu aktivitas dasar)']`
  * **`neuropathy` (Nyeri Kesemutan):** `icon: '⚡'`, label skala kustom: `['Tidak Ada', 'Ringan (tidak mengganggu aktivitas)', 'Sedang (mengganggu aktivitas sehari-hari)', 'Berat (tidak bisa berjalan/aktivitas)']`
  * **`appetiteLoss` (Nafsu Makan Turun):** `icon: '🍽️'`, label skala kustom: `['Tidak Ada', 'Ringan (makan berkurang sedikit)', 'Sedang (berkurang banyak, BB menurun)', 'Berat (tidak mau makan sama sekali)']`
  * **`insomnia` (Gangguan Tidur):** `icon: '🌙'`, label skala kustom: `['Tidak Ada', 'Ringan (kadang sulit tidur)', 'Sedang (sering terbangun, butuh obat)', 'Berat (tidak bisa tidur sama sekali)']`

#### [MODIFY] [ScaleInputs.tsx](file:///d:/MESO-app/src/features/reports/components/ScaleInputs.tsx)
* Memperbarui `EmoticonScaleProps` untuk menerima opsi `customLabels?: string[]`.
* Melakukan render deskripsi kustom di bawah emoticon secara dinamis bila tersedia.

#### [MODIFY] [types.ts](file:///d:/MESO-app/src/features/reports/types.ts)
* Memperbarui `SymptomData` untuk mencakup kolom gejala baru:
  ```typescript
  constipation?: number
  alopecia?: number
  insomnia?: number
  ```

---

### B. Kartu Kustom "Lain-lain" (Others)
#### [MODIFY] [ReportForm.tsx](file:///d:/MESO-app/src/features/reports/pages/ReportForm.tsx)
* Menambahkan satu kartu statis **"Gejala Lain-lain"** di bagian bawah daftar gejala klinis.
* Menggunakan input teks untuk nama gejala lain (menyimpan ke `otherSymptomName`) dan komponen `EmoticonScale` (menyimpan ke `otherSymptomGrade`) di bawah properti fleksibel `symptoms` di database JSONB.

---

### C. Aktivasi Survey QoL & Antarmuka Tab (Dikosongkan Sementara)
#### [MODIFY] [PharmacistPatientDetail.tsx](file:///d:/MESO-app/src/features/reports/pages/PharmacistPatientDetail.tsx)
* Menambahkan panel manajemen status survei klinis pasien. Apoteker dapat mengaktifkan `is_qol_active` dengan satu klik.

#### [MODIFY] [ReportForm.tsx](file:///d:/MESO-app/src/features/reports/pages/ReportForm.tsx)
* Mengambil status `is_qol_active` pasien pada saat inisialisasi form.
* Jika aktif (`true`), tampilkan layout Tab Bar di bagian atas halaman:
  * **Tab 1: [ Gejala MESO ]** (Form gejala klinis dan nutrisi).
  * **Tab 2: [ Survey Kualitas Hidup (QoL) ]** (Untuk sementara **dikosongkan / berupa kontainer kosong/placeholder** sesuai instruksi Anda, siap diisi kuesioner di fase berikutnya).

---

## 3. Verification Plan

### Automated Verification
* None.

### Manual Verification
1. **Tampilan Skala Gejala:** Membuka form pelaporan, memastikan gejala baru (Sembelit, Rambut Rontok, Gangguan Tidur) tampil, dan label deskripsi skala kustom di bawah emoticon ter-render dengan akurat.
2. **Validasi Penggabungan:** Mengisi kartu "Nyeri Kesemutan" dan memverifikasi nilai tersimpan dengan benar di balik layar pada kunci `neuropathy`.
3. **Gejala Lain-lain:** Mengisi kolom kustom "Lain-lain" dengan nilai kustom dan memeriksa bahwa data tersimpan di kolom JSONB `symptoms` dalam format yang diharapkan.
4. **Aktivasi QoL & Layout Tab:** Sebagai Apoteker, aktifkan status QoL untuk pasien → login kembali sebagai pasien → pastikan layout Tab muncul, dengan isi Tab 1 (Gejala MESO) lengkap, dan Tab 2 (Survey QoL) bersih/kosong sebagai placeholder.
