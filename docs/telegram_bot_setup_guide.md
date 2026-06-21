# Panduan Setup Telegram Bot untuk OTP Fallback

Dokumen ini berisi langkah-langkah untuk membuat Telegram Bot, memasukkannya ke dalam grup Admin, dan mendapatkan kredensial (`TELEGRAM_BOT_TOKEN` & `TELEGRAM_CHAT_ID`) yang dibutuhkan oleh sistem MESO.

## Tahap 1: Membuat Telegram Bot (BotFather)
1. Buka aplikasi Telegram Anda.
2. Di kolom pencarian, cari **@BotFather** (pastikan akunnya memiliki centang biru resmi) dan mulai *chat* (`/start`).
3. Ketik perintah `/newbot` untuk membuat bot baru.
4. BotFather akan meminta **Nama Bot**. Masukkan nama yang jelas, contoh: `MESO System Alert`.
5. BotFather akan meminta **Username Bot**. Username ini harus berakhiran dengan kata "bot" dan tidak boleh ada spasi, contoh: `meso_alert_bot`.
6. Jika berhasil, BotFather akan memberikan sebuah pesan berisi **HTTP API Token**.
   - Contoh Token: `1234567890:ABCDefGhIjKlMnOpQrStUvWxYz_123456`
   - **Simpan token ini!** Ini adalah `TELEGRAM_BOT_TOKEN` Anda.

## Tahap 2: Membuat Grup & Menambahkan Bot
1. Di Telegram, buat **Grup Baru** (contoh nama: "Admin MESO - OTP Requests").
2. Tambahkan staf/Admin yang bertugas menangani OTP ke dalam grup tersebut.
3. **Penting:** Tambahkan juga Bot yang baru saja Anda buat ke dalam grup tersebut sebagai anggota biasa. (Cari berdasarkan Username Bot yang dibuat di langkah 1.5).

## Tahap 3: Mendapatkan Chat ID Grup
Agar sistem tahu ke grup mana pesan harus dikirim, kita membutuhkan `TELEGRAM_CHAT_ID`.
1. Kirim sebuah pesan teks apa saja ke dalam grup tersebut (contoh: "Halo bot, testing").
2. Buka tab baru di Browser internet Anda, dan akses URL berikut (ganti `<TOKEN_ANDA>` dengan token dari Tahap 1):
   ```text
   https://api.telegram.org/bot<TOKEN_ANDA>/getUpdates
   ```
   *(Contoh: `https://api.telegram.org/bot1234567890:ABCDef.../getUpdates`)*
3. Anda akan melihat respon teks berupa JSON. Cari bagian yang bertuliskan `"chat":{"id": -100xxxxxxxx, ...}`.
4. Salin angka tersebut **termasuk tanda minus (`-`)** jika ada.
   - Contoh ID Grup: `-1001234567890`
   - **Simpan ID ini!** Ini adalah `TELEGRAM_CHAT_ID` Anda.

> [!TIP]
> Jika URL `getUpdates` mengembalikan hasil kosong `{"ok":true,"result":[]}`, hapus bot dari grup, lalu undang kembali ke grup, dan kirim pesan lagi. Lalu muat ulang halaman URL `getUpdates`.

## Tahap 4: Memasukkan Kredensial ke Supabase
Setelah mendapatkan Token dan Chat ID, masukkan ke *environment variables* (Secrets) di Supabase.

**Via Supabase CLI (Local Development):**
Buka terminal di folder proyek Anda dan jalankan:
```bash
supabase secrets set TELEGRAM_BOT_TOKEN="TOKEN_DARI_TAHAP_1"
supabase secrets set TELEGRAM_CHAT_ID="ID_DARI_TAHAP_3"
```

**Via Supabase Dashboard (Production):**
1. Buka Proyek Anda di Dasbor Supabase.
2. Masuk ke menu **Project Settings** -> **Edge Functions**.
3. Di bagian **Secrets**, tambahkan variabel baru:
   - Name: `TELEGRAM_BOT_TOKEN`, Value: `TOKEN_DARI_TAHAP_1`
   - Name: `TELEGRAM_CHAT_ID`, Value: `ID_DARI_TAHAP_3`

## Tahap 5: Pengujian
Lakukan proses "Lupa Password" dari aplikasi web. Jika konfigurasi sudah benar, pesan permohonan OTP secara otomatis akan masuk ke dalam grup Telegram yang telah Anda buat.
