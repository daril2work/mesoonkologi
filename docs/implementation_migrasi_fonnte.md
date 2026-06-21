# Implementation Migrasi Fonnte (Rollback dari Kirimdev)

Dokumen ini mencatat rencana dan eksekusi pengembalian (rollback) sistem pengiriman pesan WhatsApp dari **Kirimdev (Official WhatsApp Cloud API)** kembali menggunakan **Fonnte**. Keputusan ini diambil karena adanya kendala dalam pengurusan API resmi dan untuk menghindari konflik jika kedua sistem dijalankan bersamaan.

## 1. Tujuan
Mengembalikan fungsionalitas pengiriman notifikasi dan OTP pada aplikasi MESO agar menggunakan layanan Fonnte secara eksklusif.

## 2. Area Perubahan (Supabase Edge Functions)

Terdapat dua fungsi utama di sisi _backend_ (Supabase Edge Functions) yang akan diubah:

### 2.1. `send-whatsapp/index.ts`
Fungsi ini sebelumnya menggunakan _endpoint_ `https://api.kirimdev.com/v1/...` dengan payload format Meta (Cloud API).
**Perubahan yang dilakukan:**
- Menghapus pemanggilan _environment variable_ `KIRIMDEV_TOKEN` dan `KIRIMDEV_PHONE_ID`.
- Menggunakan `FONNTE_TOKEN` dari Supabase Secrets.
- Mengubah _endpoint_ pengiriman menjadi `https://api.fonnte.com/send`.
- Menyederhanakan payload dari bentuk `template` atau `messaging_product: 'whatsapp'` menjadi parameter standar Fonnte (`target` dan `message`).

### 2.2. `request-reset-otp/index.ts`
Fungsi ini menangani pengiriman kode OTP untuk *reset password*.
**Perubahan yang dilakukan:**
- Menghapus penggunaan `KIRIMDEV_TOKEN` dan `KIRIMDEV_PHONE_ID`.
- Menghapus penyusunan format WABA template (`otp_verification`).
- Mengubah payload menjadi teks sederhana, contoh: `"Kode OTP Anda untuk reset password adalah: {otp}"`.
- Mengirim POST request langsung ke `https://api.fonnte.com/send` menggunakan `FONNTE_TOKEN`.
- Fitur keamanan seperti rate-limiting dan invalidasi OTP lama tetap dipertahankan.

## 3. Lingkungan dan Variabel (Environment Variables)

- Pastikan `FONNTE_TOKEN` tersedia dan aktif di konfigurasi *Supabase Edge Function Secrets*.
- Variabel `KIRIMDEV_TOKEN` dan `KIRIMDEV_PHONE_ID` sudah tidak lagi relevan dan aman jika dihapus dari _secrets_ di kemudian hari.

## 4. Pengujian (Testing)
1. **Request Reset OTP**: Lakukan simulasi lupa _password_ dari aplikasi. Pastikan pengguna menerima pesan WhatsApp berisi OTP dari nomor Fonnte.
2. **Kirim Pesan Umum**: Lakukan pemicu *reminder* atau notifikasi sistem dan pantau _log_ di Supabase Edge Functions untuk memastikan respon dari API Fonnte mengembalikan status sukses (200 OK).

---
*Dokumen ini dibuat sebagai panduan sebelum dan saat dilakukannya proses migrasi kembali ke Fonnte.*
