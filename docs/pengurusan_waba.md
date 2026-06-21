# Panduan Registrasi WABA Official - Jalur Perorangan (Unverified Business)

Panduan ini ditargetkan khusus untuk **pengembang perorangan (individual)** yang tidak memiliki badan hukum resmi (PT/CV) dan ingin mengaktifkan **WhatsApp Business API (WABA) Official** secara gratis & cepat dengan limit **250 penerima pesan unik per hari**.

---

## FASE 1: Persiapan Domain & Email Kustom (Waktu: 15 Menit)

Meta memerlukan email dengan domain sendiri saat pembuatan akun bisnis. Kita akan menggunakan domain murah `.my.id` dan layanan penerusan (*forwarding*) email gratis.

1. **Beli Domain `.my.id`**:
   * Beli domain di penyedia lokal (Niagahoster, Domainesia, Rumahweb, Dewaweb, dll.).
   * Cari domain dengan nama Anda atau nama aplikasi, misal: `meso-app.my.id` atau `daril-meso.my.id` (Harga: ± Rp 12.000 - Rp 15.000 per tahun).
2. **Setup Cloudflare (Gratis)**:
   * Buat akun gratis di **[Cloudflare](https://www.cloudflare.com/)**.
   * Tambahkan domain `.my.id` Anda ke Cloudflare.
   * Ganti Nameserver di panel registrar domain Anda ke Nameserver yang diberikan Cloudflare.
3. **Aktifkan Cloudflare Email Routing**:
   * Di dashboard Cloudflare, buka menu **Email** -> **Email Routing**.
   * Tambahkan alamat email kustom baru, misalnya: `admin@meso-app.my.id`.
   * Setel alamat tujuan pengalihan ke Gmail pribadi Anda (misalnya: `nama.anda@gmail.com`).
   * Cloudflare akan otomatis mengkonfigurasi DNS records (MX) untuk domain Anda.
   * Lakukan verifikasi di inbox Gmail Anda. Sekarang, semua email ke `admin@meso-app.my.id` akan otomatis masuk ke Gmail Anda.

---

## FASE 2: Registrasi Akun Bisnis & Aktivasi WhatsApp (Waktu: 15 Menit)

1. **Siapkan Nomor WhatsApp**:
   * Siapkan nomor HP aktif yang belum pernah terdaftar di aplikasi WhatsApp/WhatsApp Business HP. Jika nomor sudah terdaftar, lakukan **Hapus Akun (Delete Account)** melalui aplikasi WhatsApp di HP terlebih dahulu.
2. **Masuk ke Meta for Developers**:
   * Buka portal **[Meta for Developers](https://developers.facebook.com/)** dan login menggunakan akun Facebook pribadi Anda.
3. **Buat Aplikasi Baru**:
   * Klik **My Apps** -> **Create App**.
   * Pilih opsi **Other** -> Klik **Next** -> Pilih tipe **Business**.
   * Masukkan nama aplikasi (misal: `MESO App Gateway`).
   * Isi kolom email kontak dengan email kustom Anda: `admin@meso-app.my.id`.
   * Klik **Create App**.
4. **Setup WhatsApp**:
   * Di halaman Dashboard aplikasi Anda, scroll ke bawah dan temukan produk **WhatsApp**, lalu klik **Set up**.
   * Pilih atau buat akun **Meta Business Account** baru.
5. **Tambahkan & Verifikasi Nomor Telepon**:
   * Di panel WhatsApp, klik **Start using the API** -> Klik **Add Phone Number**.
   * Isi profil bisnis WhatsApp Anda:
     * *Display Name* (Nama tampilan di WA, misal: `MESO App Alert`).
     * Kategori: *Medical and Health*.
     * Alamat Website: `http://nama-domain-anda.my.id` (Anda bisa membuat website profil gratis menggunakan Google Sites / Carrd.co yang diarahkan ke domain Anda nanti).
   * Masukkan nomor HP baru Anda -> Pilih metode verifikasi (**SMS** atau **Phone Call**) -> Klik **Next**.
   * Masukkan kode verifikasi 6 digit yang masuk ke HP Anda.
   * **Selesai!** Nomor Anda sekarang sudah aktif dan dapat mengirimkan pesan.

---

## FASE 3: Membuat Token Akses Permanen (Waktu: 10 Menit)

*Secara default, token uji coba dari Meta akan kedaluwarsa setelah 24 jam. Kita wajib membuat Token Akses Permanen di Meta Business Suite.*

1. Buka **[Meta Business Suite Settings](https://business.facebook.com/settings)**.
2. Di sidebar kiri, masuk ke menu **Pengguna (Users)** -> **Pengguna Sistem (System Users)**.
3. Klik **Tambahkan (Add)**:
   * Masukkan nama pengguna (misal: `meso-api-user`).
   * Pilih peran sebagai **Admin**.
   * Klik **Buat Pengguna Sistem**.
4. Klik tombol **Tetapkan Aset (Assign Assets)**:
   * Pilih menu **Aplikasi (Apps)**.
   * Pilih aplikasi `MESO App Gateway` Anda.
   * Aktifkan toggle **Full Control (Kelola Aplikasi)**.
   * Klik **Simpan Perubahan**.
5. Klik tombol **Buat Token Baru (Generate New Token)**:
   * Pilih aplikasi `MESO App Gateway`.
   * Centang dua izin berikut:
     * **`whatsapp_business_messaging`** (untuk mengirim pesan ke pasien)
     * **`whatsapp_business_management`** (untuk mengelola template pesan)
   * Klik **Generate Token**.
6. **Simpan Token Ini**: Salin token panjang yang muncul dan simpan di tempat yang aman. Token ini bersifat permanen dan tidak akan kedaluwarsa. Token inilah yang akan kita pasang sebagai variabel rahasia (`WHATSAPP_ACCESS_TOKEN`) di backend Supabase.

---

## FASE 4: Membuat Template Pesan (Waktu: 5 Menit)

*Karena akun kita tidak melalui verifikasi bisnis (Unverified), kita dibatasi membuat maksimal 10 template pesan.*

1. Di Meta Business Suite, buka menu **WhatsApp Manager** -> **Message Templates**.
2. Klik **Create Template**.
3. **Buat Template OTP (Kategori: Authentication)**:
   * Beri nama: `otp_verification` (atau sejenisnya).
   * Pilih bahasa: Indonesian.
   * Gunakan opsi layout otomatis Meta untuk OTP (pesan yang memiliki tombol sekali klik "Salin Kode"). AI Meta biasanya menyetujui template ini secara instan (1 menit).
4. **Buat Template Peringatan Darurat CITO (Kategori: Utility)**:
   * Beri nama: `cito_alert`.
   * Tulis pesan template dengan parameter variabel `{{1}}` dan `{{2}}` agar dinamis. Contoh:
     > *CITO! Terdeteksi laporan efek samping berat (Sentinel Alert) dari pasien {{1}} (Grade {{2}}). Mohon segera periksa dashboard MESO Anda.*
5. **Buat Template Pengingat Jadwal Pasien (Kategori: Utility)**:
   * Beri nama: `schedule_reminder`.
   * Contoh pesan:
     > *Halo Ibu/Bapak {{1}}, ini adalah pengingat jadwal {{2}} Anda pada tanggal {{3}} pukul {{4}}.*
6. Klik **Submit**. Status template akan berubah menjadi *Approved* dalam beberapa menit.
