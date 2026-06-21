# Implementation Plan: OTP Fallback (Admin-in-the-Loop)

Dokumen ini mencatat rencana implementasi sistem *fallback* untuk pemulihan kata sandi (OTP) yang melibatkan intervensi Admin secara manual. Sistem ini dirancang sebagai alternatif jika layanan pengiriman pesan otomatis mengalami kegagalan.

## 1. Tujuan
Menyediakan jalur pemulihan kata sandi yang aman dan andal melalui validasi manual oleh Admin.

## 2. Arsitektur Solusi Terpilih
Sistem menggunakan kombinasi **Telegram (Admin)** dan **WhatsApp (Pasien)**:
1. Pasien meminta OTP melalui halaman Lupa Password.
2. Sistem *generate* 6 digit OTP dan menyimpan status `pending` di Supabase.
3. Sistem mengirimkan *Push Notification* 100% andal via **Telegram Bot** ke Grup Admin. (Dipilih karena jauh lebih andal dari PWA Web Push).
4. Admin mengklik link `wa.me` di Telegram yang otomatis membuka WhatsApp Admin dengan pesan siap kirim.
5. Pasien menerima pesan WA, mengklik *direct link recovery*, dan mereset password.

## 3. Detail Implementasi

### 3.1. Database (Supabase)
Tabel `otp_requests`:
- `id` (UUID, PK)
- `phone_number` (Text)
- `otp_code` (Text)
- `status` (Text: pending, sent, verified, expired)
- `created_at` & `expires_at` (Timestamp)

### 3.2. Notifikasi Telegram Admin
- Menggunakan BotFather untuk membuat bot.
- Supabase Edge Function menembak API Telegram saat ada `insert` di tabel `otp_requests`.
- Format Pesan:
  ```text
  🚨 Request OTP Baru! (+628...)
  
  [Klik untuk Kirim WA ke Pasien](https://wa.me/628...?text=Halo%20ini%20Admin%20MESO.%0AKode%20OTP%20Anda:%20123456.%0AKlik%20link%20berikut%20untuk%20melanjutkan:%20https://domain.com/verify-otp)
  ```

### 3.3. Alur UX Pasien (Telah Divalidasi)
1. **Request:** Pasien input nomor WA di halaman Lupa Password.
2. **Waiting:** Muncul info bahwa Admin akan mengirim WA. (Pasien aman jika menutup browser).
3. **Recovery:** Pasien klik *link* dari WA Admin, halaman web terbuka di form input OTP, pasien tinggal salin nomor dan buat password baru.

## 4. Kesiapan Migrasi (Future-Proofing)
Penting untuk dicatat bahwa sistem ini berstatus sebagai **Sistem Fallback Sementara/Transisi**. 
Arsitektur ini didesain agar sangat modular (Plug-and-Play). Jika suatu saat layanan **WhatsApp Business Official API** atau sistem otomasi berbayar lainnya sudah siap:
- Perubahan hanya perlu dilakukan pada level *Edge Function* di Supabase (mengubah *trigger* dari menembak API Telegram menjadi menembak endpoint WA API Official).
- Skema Database (`otp_requests`) dan Alur UX Pasien di *frontend* tidak perlu dirombak sama sekali.
- Sistem siap untuk transisi yang mulus tanpa *downtime* atau perombakan besar-besaran (bongkar pasang yang sangat minim).
