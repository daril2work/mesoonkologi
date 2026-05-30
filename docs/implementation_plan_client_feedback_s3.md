# Rencana Implementasi: Desain Responsif & Mobile-First Portal Apoteker

Rencana ini bertujuan untuk memigrasikan portal apoteker (*Pharmacist Portal*) yang saat ini masih bertema *desktop-only* menjadi *mobile-first* dan sepenuhnya responsif di semua ukuran layar (ponsel, tablet, desktop). Migrasi dilakukan secara bertahap dalam **4 Sprint** terfokus untuk meminimalkan risiko regresi pada tampilan desktop yang saat ini aktif digunakan oleh apoteker.

---

## Keputusan Desain Terpilih (User Review Settled)

> [!IMPORTANT]
> **Keputusan Desain Tabel di Mobile (Opsi A):** 
> Diputuskan untuk menggunakan **Opsi A (Tumpukan Kartu / Card List)** di perangkat mobile (layar ponsel/tablet kecil) dan tetap menggunakan **Tabel Penuh** di perangkat desktop. Pendekatan ini memberikan pengalaman pengguna yang jauh lebih premium, bersih, dan mudah dibaca tanpa perlu melakukan horizontal scroll.

> [!NOTE]
> **Zero Regression on Desktop:** Seluruh perubahan responsif akan diimplementasikan secara *additive* menggunakan utilitas Tailwind CSS (`sm:`, `md:`, `lg:`). Tampilan desktop (`lg` screen atau 1024px ke atas) dijamin **tetap sama persis** seperti saat ini tanpa ada perubahan visual.

---

## Proposed Changes

Rencana kerja dibagi ke dalam 4 Sprint bertahap:

### Sprint 1: Pondasi Layout & Navigasi Responsif

Fokus pada restrukturisasi layout utama portal apoteker agar dapat beradaptasi di layar kecil dengan aman.

#### [MODIFY] [PharmacistLayout.tsx](file:///d:/MESO-app/src/features/reports/components/PharmacistLayout.tsx)
*   Menambahkan state `isSidebarOpen` (boolean) untuk mengontrol visibilitas sidebar drawer pada perangkat mobile/tablet.
*   Mengubah tag `<aside>` (Sidebar) agar menjadi *drawer* yang tersembunyi secara default pada layar mobile (`-translate-x-full lg:translate-x-0 fixed z-50 transition-transform duration-300`) dan memiliki overlay gelap (*backdrop*) saat dibuka di layar kecil.
*   Mengubah margin kontainer utama (`ml-64`) menjadi responsif (`ml-0 lg:ml-64`).
*   Menambahkan tombol hamburger menu di `<header>` yang hanya terlihat pada layar mobile (`block lg:hidden`) untuk memicu/menutup sidebar drawer.
*   Menyempurnakan input pencarian pasien agar tidak melebar melebihi layar ponsel (`w-full max-w-[200px] sm:max-w-xs md:max-w-md`).

---

### Sprint 2: Core Dashboard & Direktori Pasien (Desain Card List Mobile)

Mengubah halaman antrean laporan harian dan data direktori pasien agar ramah layar sentuh ponsel dengan memecah tabel lebar menjadi tumpukan kartu informasi (*Card List*) di mobile.

#### [MODIFY] [PharmacistDashboard.tsx](file:///d:/MESO-app/src/features/reports/pages/PharmacistDashboard.tsx)
*   Menyesuaikan susunan header dashboard agar membungkus secara vertikal di mobile (`flex-col sm:flex-row items-start sm:items-end gap-4`).
*   Mengubah Bento Grid KPI statistik agar fleksibel di layar ponsel.
*   **Implementasi Opsi A (Tabel Laporan Minor):**
    *   Pada layar desktop (`hidden md:block`), tabel "Laporan Rutin (Minor)" akan tetap dirender secara utuh lengkap dengan semua kolom aslinya.
    *   Pada layar ponsel (`block md:hidden`), baris tabel dikonversi menjadi barisan kartu informasi (Card List) responsif yang menampilkan: inisial/foto pasien, nama lengkap, keluhan utama (label gejala), indikator siklus kemo, penunjuk waktu responsif, dan tombol aksi "Detail" yang mudah ditekan dengan ibu jari.

#### [MODIFY] [PharmacistPatients.tsx](file:///d:/MESO-app/src/features/reports/pages/PharmacistPatients.tsx)
*   Mengubah Bento Grid stats di bagian atas agar responsif (`grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4`).
*   **Implementasi Opsi A (Tabel Direktori Pasien):**
    *   Menyembunyikan elemen `<table>` pada layar kecil (`hidden md:table`).
    *   Membuat tumpukan kartu list pasien untuk mobile (`block md:hidden`) yang menonjolkan inisial/foto pasien, nama lengkap, nomor siklus kemoterapi aktif, status kesehatan terbaru (Stabil / Butuh Tindakan / Observasi), dan tombol aksi terintegrasi (Detail Profil, Chat, Jadwal) dalam ikon yang rapi dan mudah diakses.

---

### Sprint 3: Pusat Komando Klinis (Detail Pasien)

Refaktor halaman utama peninjauan detail medis pasien yang kaya informasi.

#### [MODIFY] [PharmacistPatientDetail.tsx](file:///d:/MESO-app/src/features/reports/pages/PharmacistPatientDetail.tsx)
*   Mengubah posisi header halaman detail yang sebelumnya `fixed w-[calc(100%-16rem)]` menjadi responsif: `w-full lg:w-[calc(100%-16rem)] lg:left-64 left-0`.
*   Menyesuaikan padding kontainer utama `<main>` dari `p-10 mt-16` menjadi responsif `p-4 sm:p-6 lg:p-10 mt-16`.
*   Memastikan panel *Quality of Life* (QoL) toggle dan sub-komponen lainnya memiliki margin yang aman di layar kecil.

#### [MODIFY] Sub-Komponen Detail Pasien (`PatientHeaderCard.tsx`, `SymptomReportGrid.tsx`, `PatientTrendChart.tsx`, dsb.)
*   Menyelaraskan grid kartu gejala harian agar beralih ke 1 kolom di ponsel dan tetap multi-kolom di desktop.
*   Menyesuaikan ukuran chart tren mingguan agar fleksibel (*responsive container* recharts).

---

### Sprint 4: Portal Komunikasi & Halaman Sekunder (Chat, Jadwal, Settings)

Menyelesaikan fitur interaktif seperti chat langsung apoteker-pasien dan pengelolaan jadwal.

#### [MODIFY] [PharmacistChat.tsx](file:///d:/MESO-app/src/features/reports/pages/PharmacistChat.tsx)
*   Mengubah layout chat dari dua panel berdampingan menjadi satu panel dinamis di mobile:
    *   Jika tidak ada pasien yang dipilih (`selectedPatientId === null`), tampilkan daftar percakapan secara penuh.
    *   Jika pasien dipilih, tampilkan jendela chat secara penuh dan tambahkan tombol `<- Kembali` di bagian atas header chat untuk kembali ke daftar percakapan (khusus layar mobile).
*   Menjaga agar di layar desktop, kedua panel tetap berdampingan secara konvensional.

#### [MODIFY] [PharmacistSchedule.tsx](file:///d:/MESO-app/src/features/reports/pages/PharmacistSchedule.tsx)
*   Membuat visual kalender jadwal dan form pembuatan jadwal responsif dan rapi pada resolusi kecil.

#### [MODIFY] [PharmacistSettings.tsx](file:///d:/MESO-app/src/features/reports/pages/PharmacistSettings.tsx) & [PharmacistHelp.tsx](file:///d:/MESO-app/src/features/reports/pages/PharmacistHelp.tsx)
*   Mengatur formulir profil, keamanan, dan FAQ dokumentasi bantuan agar tersusun 1 kolom di layar ponsel.

---

## Verification Plan

### Automated Tests
- Menjalankan linting dan build check untuk memastikan tidak ada TypeScript error:
  ```bash
  npm run build
  ```
- Menjalankan test suite yang ada (jika ada):
  ```bash
  npm test
  ```

### Manual Verification
- Melakukan pengujian visual menggunakan Chrome/Edge DevTools Device Toolbar:
  - Dimensi Mobile Portrait (375px - 430px): Menguji iPhone SE/12 Pro, Samsung Galaxy S20.
  - Dimensi Tablet (768px - 1024px): Menguji iPad Air & iPad Mini.
  - Desktop (1280px ke atas): Memastikan layout desktop tidak mengalami perubahan visual (regresi).
- Menguji interaksi kritis apoteker di mobile:
  - Membuka/menutup sidebar menggunakan menu hamburger.
  - Membuka daftar antrean laporan dan mengklik "Detail" pasien.
  - Mengirim saran klinis/chat ke pasien di mobile chat view.
  - Mengubah filter dan melakukan ekspor data di perangkat tablet/mobile.
