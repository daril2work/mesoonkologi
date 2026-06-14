# Penambahan Fitur Pengelolaan User

Sesuai permintaan Anda, saat ini menu **Pengaturan Akun** (`PharmacistSettings.tsx`) yang diakses melalui ikon roda gigi menangani 3 fitur utama:
1. **Profil Pengguna**: Menampilkan nama lengkap, peran sistem, dan email dari pengguna yang sedang login.
2. **Integrasi Layanan**: Mengelola Token API Fonnte (untuk integrasi WhatsApp) dan mengatur nomor WhatsApp dinamis untuk petugas jaga darurat (Apoteker & Dokter In-Charge), beserta tombol testing-nya.
3. **Preferensi Notifikasi**: Mengelola pengaturan notifikasi realtime (Toggle on/off).

Sebagai Apoteker (yang sering kali bertindak sebagai Admin dalam sistem seperti ini), menambahkan fitur **Pengelolaan User** di halaman ini adalah langkah yang tepat.

## Proposed Changes

Karena halaman `PharmacistSettings.tsx` saat ini sudah cukup panjang, kita akan memecah tampilannya menjadi **Tab Menu** (contoh: "Profil & Preferensi", "Integrasi Layanan", "Pengelolaan Pengguna").

### `src/features/reports/pages/PharmacistSettings.tsx`
- **[MODIFY]** `PharmacistSettings.tsx`:
  - Menambahkan state untuk `activeTab`.
  - Membuat navigasi Tab di bagian atas (Profil, Integrasi, Pengguna).
  - Mengimpor dan merender komponen baru `UserManagementPanel` saat tab "Pengguna" dipilih.

### `src/features/reports/components/UserManagementPanel.tsx`
- **[NEW]** `UserManagementPanel.tsx`:
  - Menampilkan tabel/daftar pengguna sistem (diambil dari tabel `profiles`).
  - Fitur Pencarian (berdasarkan nama atau email).
  - Fitur Filter (berdasarkan Role: Pharmacist, Clinician, dll).
  - Fitur Aksi: Menonaktifkan pengguna (soft-delete dengan mengubah `is_active = false`), atau mengubah `role` pengguna.

### `src/features/reports/api/useUserManagement.ts`
- **[NEW]** `useUserManagement.ts`:
  - Hook khusus untuk memuat daftar pengguna dari tabel `profiles`.
  - Fungsi untuk memperbarui status `is_active` dan `role`.

---

## User Review Required

> [!WARNING]
> **Terkait Pembuatan Pengguna Baru (Add User):**
> Secara default di Supabase, fungsi untuk mendaftarkan akun baru (`signUp`) akan secara otomatis mengganti sesi pengguna yang sedang login (ter-logout). Jika kita ingin fitur **Tambah Pengguna Baru** dari dalam panel admin tanpa me-logout Apoteker, kita memerlukan **Supabase Edge Function** khusus atau endpoint server untuk melakukan pembuatan akun (menggunakan `supabase-admin` Service Role Key).

## Open Questions

> [!IMPORTANT]
> 1. **Pembuatan Pengguna**: Apakah fitur ini perlu menyertakan tombol **"Tambah Pengguna Baru"**, atau hanya untuk melihat daftar, mengubah status aktif/non-aktif, dan mengedit peran (role) dari pengguna yang sudah mendaftar? Jika iya, kita perlu menyiapkan Edge Function untuk itu.
> 2. **Cakupan Pengguna**: Apakah panel ini hanya untuk mengelola staf medis (Apoteker & Clinician/Dokter), atau juga termasuk pasien?
> 3. **Tampilan Tab**: Apakah Anda setuju dengan pendekatan menggunakan **Tab Menu** agar halaman Pengaturan Akun tidak terlalu panjang ke bawah?

## Verification Plan

### Automated Tests
- Tidak ada automated testing, menggunakan validasi TypeChecking (TypeScript).

### Manual Verification
1. Login sebagai Apoteker, masuk ke Pengaturan Akun.
2. Memastikan navigasi tab berfungsi.
3. Membuka tab "Pengelolaan Pengguna" dan memverifikasi daftar profil termuat dengan benar.
4. Mencoba menonaktifkan akun staf lain dan melihat perubahan `is_active` di database `profiles`.
