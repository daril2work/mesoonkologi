# Walkthrough: Fitur Pengelolaan User

Sesuai dengan kesepakatan rencana implementasi yang disetujui, fitur pengelolaan pengguna (Apoteker & Dokter) kini telah diintegrasikan ke dalam halaman **Pengaturan Akun** (`PharmacistSettings`).

## Perubahan Utama

### 1. Struktur Tab Navigation
Halaman pengaturan akun Apoteker kini memiliki navigasi berbasis **Tab** di bagian atas untuk membagi informasi yang padat:
- **Profil & Integrasi**: Menampilkan profil dasar dan konfigurasi API/WhatsApp yang sudah ada sebelumnya.
- **Pengelolaan User**: *Tab baru* untuk panel manajemen staf.

### 2. Panel Daftar Staf (`UserManagementPanel`)
Tampilan default pada tab "Pengelolaan User" akan memuat seluruh pengguna yang sudah memiliki peran sebagai **Dokter** (`clinician`) atau **Apoteker** (`pharmacist`).

### 3. Fitur Pencarian Profil (Global Search)
Terdapat kolom input pencarian di bagian kanan atas daftar. Saat Anda mengetik minimal 3 huruf nama (misal nama pasien yang baru mendaftar), tabel secara dinamis akan menampilkan daftar profil tersebut.

### 4. Role Toggling
Setiap baris pengguna pada tabel memiliki tombol kontrol: `Apoteker` dan `Dokter`.
- **Assign Role**: Anda cukup mengeklik tombol "Apoteker" atau "Dokter" untuk menetapkan status staf kepada pengguna tersebut (walaupun ia asalnya pasien).
- **Revoke Role**: Jika Anda mengeklik tombol yang *sudah aktif*, peran tersebut akan dilepas dan profil dikembalikan ke role default (`patient`).

## File yang Diperbarui/Dibuat

- **[NEW]** `src/features/reports/api/useUserManagement.ts`: Menyediakan hooks untuk memuat daftar staf, mencari secara global (termasuk *debounce* search), dan memperbarui tabel profil (`updateUserRole`).
- **[NEW]** `src/features/reports/components/UserManagementPanel.tsx`: Komponen UI untuk list, search, dan role toggles.
- **[MODIFY]** `src/features/reports/pages/PharmacistSettings.tsx`: Di-refactor agar merender layout dalam dua mode (Tab "Profile" vs Tab "Users").

## Verifikasi
- Validasi strict TypeScript telah berjalan (`tsc --noEmit` sukses) memastikan tidak ada error saat kompilasi.
- UI dirender menggunakan standar style desain app yang sudah ada. Silakan Anda coba dan periksa perubahan melalui UI aplikasi.
