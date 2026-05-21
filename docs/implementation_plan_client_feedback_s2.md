# Rencana Implementasi: Autentikasi WhatsApp / ID Pasien & Integrasi Kuesioner QoL (Fase 2 - S2)

Rencana implementasi ini menjelaskan detail teknis, perubahan kode, dan rancangan basis data untuk menyelesaikan target **Fase 2 (S2)** pada aplikasi MESO. Pengerjaan Fase 2 ini berfokus pada **perombakan sistem autentikasi** (menggunakan nomor WhatsApp / ID Pasien), **pemulihan kata sandi via OTP WhatsApp (Fonnte)**, serta **integrasi fungsional kuesioner Quality of Life (QoL) standar EQ-5D**.

---

## 1. Persetujuan & Penyesuaian Analisis (Design Decisions)

1. **Virtual Email & Kompatibilitas Mundur (Backward Compatibility):**
   - Di balik layar, Supabase Auth membutuhkan pengenal berbentuk email. Kita akan mentransformasikan login pasien menjadi email virtual dengan format `${whatsAppNumber}@meso.id` saat pendaftaran baru.
   - Untuk login, pasien dapat memasukkan **Nomor WhatsApp** atau **ID Pasien**. Sebuah fungsi database RPC `get_login_identifier(search_val)` berkinerja tinggi akan mencocokkan input tersebut.
   - **Solusi Akun Lama (Legacy Accounts):** RPC ini dirancang super-cerdas dengan men-join tabel `public.profiles` ke `auth.users`. Jika ada pasien lama yang terdaftar dengan email asli (misal `budi@gmail.com`) mencoba masuk dengan mengetikkan nomor WhatsApp atau ID Pasien mereka, sistem akan secara otomatis menemukan email asli `budi@gmail.com` dari tabel `auth.users` dan mengembalikannya ke frontend untuk otentikasi. Dengan demikian, **tidak diperlukan migrasi data akun lama** dan semua pengguna lama dijamin 100% tidak akan terdampak atau terkunci dari sistem!
   - **Penanganan Pasien Lama Tanpa Nomor WhatsApp (Legacy Patients without WA):**
     - **Bypass Email Asli:** Pasien lama tetap bisa masuk menggunakan alamat email asli mereka (`contoh@email.com`) karena input mengandung karakter `@` secara otomatis melompati pencarian nomor WA dan memproses login email langsung.
     - **Pelengkapan Mandiri via Profil (Self-Serve Profile):** Setelah berhasil masuk dengan email asli, pasien dapat membuka **Profil Modal** dengan mengetuk avatar mereka untuk melengkapi nomor WhatsApp aktif secara mandiri.
     - **Pemulihan Kata Sandi Otomatis (No Pharmacist Overhead):** Jika pasien lama lupa password sebelum melengkapi nomor WhatsApp, mereka dapat memulihkannya menggunakan alamat email asli mereka. Sistem akan secara otomatis mengirimkan tautan pemulihan sandi klasik ke kotak masuk email mereka secara mandiri (melalui `supabase.auth.resetPasswordForEmail`). Apoteker tidak dibebani pekerjaan manual untuk mereset atau mengupdate akun pasien.
   - Akun staf klinis (Apoteker/Dokter) yang menggunakan email asli (mengandung karakter `@`) akan dilewati (bypass) secara otomatis dan tetap masuk menggunakan email asli mereka.

2. **Supabase Edge Functions & OTP WhatsApp (Fonnte):**
   - Kita akan mengimplementasikan dua Edge Function: `request-reset-otp` dan `verify-and-reset-otp`.
   - Kode OTP berupa 6-digit angka acak yang aman dengan masa kedaluwarsa 5 menit.
   - Pengiriman WhatsApp memanfaatkan API gateway **Fonnte** (`https://api.fonnte.com/send`) menggunakan rahasia `FONNTE_TOKEN` yang disimpan di environment secret Supabase.

3. **Integrasi Kuesioner QoL (EQ-5D-3L Standard):**
   - Ketika Apoteker mengaktifkan survei QoL untuk pasien (`is_qol_active = true`), pasien akan dipandu mengisi kuesioner **EQ-5D-3L** di Tab 2 pada halaman pelaporan.
   - Struktur data QoL akan disimpan secara fleksibel dan rapi dalam format bersarang (nested) di dalam kolom JSONB `symptoms` pada tabel `symptom_reports`, sehingga tidak memerlukan modifikasi skema tabel utama dan meminimalkan biaya query.

---

## 2. Rencana Perubahan Kode (Proposed Changes)

### A. Skema Basis Data & Konfigurasi Supabase
#### 🟢 [NEW] [20260521_setup_otp.sql](file:///d:/MESO-app/supabase/migrations/20260521_setup_otp.sql)
Membuat tabel penyimpanan OTP WhatsApp, fungsi pencari email virtual, dan memperbarui pemicu profil baru untuk menyimpan ID Pasien.

```sql
-- 1. Buat tabel penyimpanan OTP jika belum ada
CREATE TABLE IF NOT EXISTS public.password_reset_otps (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  phone_number TEXT NOT NULL,
  otp_code TEXT NOT NULL,
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  used BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Aktifkan RLS
ALTER TABLE public.password_reset_otps ENABLE ROW LEVEL SECURITY;

-- Hanya Service Role (Backend Admin) yang dapat mengakses tabel ini
CREATE POLICY "Service role full access" 
  ON public.password_reset_otps 
  TO service_role 
  USING (true) 
  WITH CHECK (true);

-- 2. Buat fungsi pencari email virtual (RPC) untuk login multi-identifier
CREATE OR REPLACE FUNCTION public.get_login_identifier(search_val TEXT)
RETURNS TEXT AS $$
DECLARE
  found_email TEXT;
BEGIN
  -- Jika input sudah berupa email asli, langsung kembalikan aslinya
  IF search_val LIKE '%@%' THEN
    RETURN search_val;
  END IF;

  -- Bersihkan spasi kosong
  search_val := trim(search_val);

  -- Join profiles dan auth.users untuk menemukan email asli (baik email asli lama atau virtual email baru)
  SELECT u.email INTO found_email
  FROM public.profiles p
  JOIN auth.users u ON p.id = u.id
  WHERE p.phone_number = search_val 
     OR p.hospital_id = search_val
     OR p.phone_number = '62' || substring(search_val from 2)
     OR p.phone_number = '0' || substring(search_val from 3)
  LIMIT 1;

  -- Kembalikan email asli/virtual jika ditemukan
  IF found_email IS NOT NULL AND found_email <> '' THEN
    RETURN found_email;
  END IF;

  -- Fallback demi keamanan (menghindari username enumeration)
  RETURN search_val || '@meso.id';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 3. Perbarui fungsi handle_new_user agar menyimpan hospital_id (ID Pasien)
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.profiles (
    id, 
    role,
    full_name,
    cancer_site,
    date_of_birth,
    phone_number,
    hospital_id
  )
  VALUES (
    new.id,
    COALESCE((new.raw_user_meta_data->>'role')::public.app_role, 'patient'),
    new.raw_user_meta_data->>'full_name',
    new.raw_user_meta_data->>'cancer_site',
    (new.raw_user_meta_data->>'date_of_birth')::DATE,
    new.raw_user_meta_data->>'phone_number',
    new.raw_user_meta_data->>'hospital_id'
  );
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

---

### B. Supabase Edge Functions (Deno / TypeScript)
#### 🟢 [NEW] [request-reset-otp](file:///d:/MESO-app/supabase/functions/request-reset-otp/index.ts)
Fungsi untuk memvalidasi nomor telepon pasien, menghasilkan kode OTP 6-angka, menyimpannya di DB, dan mengirimkan pesan via Fonnte API.

```typescript
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req: Request) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: CORS_HEADERS })

  try {
    const { phone_number } = await req.json()
    if (!phone_number) throw new Error('Nomor telepon harus diisi')

    const cleanPhone = phone_number.replace(/\D/g, '')
    
    // Inisialisasi Supabase client dengan Service Role Key
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    // Periksa apakah pengguna dengan nomor tersebut ada di profil
    const { data: profile, error: profileError } = await supabaseAdmin
      .from('profiles')
      .select('id, full_name')
      .eq('phone_number', cleanPhone)
      .limit(1)
      .maybeSingle()

    if (profileError || !profile) {
      return new Response(
        JSON.stringify({ error: 'Nomor WhatsApp tidak terdaftar di sistem' }),
        { status: 404, headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' } }
      )
    }

    // Buat OTP 6-digit angka
    const otp = Math.floor(100000 + Math.random() * 900000).toString()
    const expiresAt = new Date(Date.now() + 5 * 60 * 1000).toISOString() // 5 menit

    // Simpan OTP ke DB
    const { error: otpError } = await supabaseAdmin
      .from('password_reset_otps')
      .insert({ phone_number: cleanPhone, otp_code: otp, expires_at: expiresAt })

    if (otpError) throw otpError

    // Kirim via Fonnte
    const fonnteToken = Deno.env.get('FONNTE_TOKEN')
    if (!fonnteToken) throw new Error('FONNTE_TOKEN belum dikonfigurasi')

    let fonntePhone = cleanPhone
    if (fonntePhone.startsWith('0')) {
      fonntePhone = '62' + fonntePhone.slice(1)
    }

    const form = new FormData()
    form.append('target', fonntePhone)
    form.append('message', `Halo Ibu/Bapak *${profile.full_name}*,\n\nKode OTP untuk mengatur ulang kata sandi Anda adalah *${otp}*.\n\nKode ini berlaku selama *5 menit*. Jangan berikan kode ini kepada siapa pun demi keamanan akun Anda. Terima kasih.`)
    form.append('countryCode', '62')

    const fonnteRes = await fetch('https://api.fonnte.com/send', {
      method: 'POST',
      headers: { 'Authorization': fonnteToken },
      body: form
    })

    const fonnteResult = await fonnteRes.json()

    return new Response(
      JSON.stringify({ success: true, message: 'OTP dikirim ke WhatsApp Anda', debug: fonnteResult }),
      { status: 200, headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' } }
    )
  } catch (err: any) {
    return new Response(
      JSON.stringify({ error: err.message }),
      { status: 400, headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' } }
    )
  }
})
```

#### 🟢 [NEW] [verify-and-reset-otp](file:///d:/MESO-app/supabase/functions/verify-and-reset-otp/index.ts)
Fungsi untuk memverifikasi OTP dan langsung memperbarui kata sandi pengguna menggunakan hak admin.

```typescript
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req: Request) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: CORS_HEADERS })

  try {
    const { phone_number, otp_code, new_password } = await req.json()
    if (!phone_number || !otp_code || !new_password) throw new Error('Data tidak lengkap')

    const cleanPhone = phone_number.replace(/\D/g, '')

    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    // Cari OTP aktif yang sesuai dan belum kadaluarsa
    const { data: otpData, error: otpError } = await supabaseAdmin
      .from('password_reset_otps')
      .select('*')
      .eq('phone_number', cleanPhone)
      .eq('otp_code', otp_code)
      .eq('used', false)
      .gt('expires_at', new Date().toISOString())
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle()

    if (otpError || !otpData) {
      return new Response(
        JSON.stringify({ error: 'Kode OTP tidak valid atau telah kedaluwarsa' }),
        { status: 400, headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' } }
      )
    }

    // Ambil user ID dari profiles
    const { data: profile, error: profileError } = await supabaseAdmin
      .from('profiles')
      .select('id')
      .eq('phone_number', cleanPhone)
      .single()

    if (profileError || !profile) throw new Error('Akun pengguna tidak ditemukan')

    // Tandai OTP telah digunakan
    await supabaseAdmin
      .from('password_reset_otps')
      .update({ used: true })
      .eq('id', otpData.id)

    // Reset password user menggunakan Auth Admin API
    const { error: resetError } = await supabaseAdmin.auth.admin.updateUserById(
      profile.id,
      { password: new_password }
    )

    if (resetError) throw resetError

    return new Response(
      JSON.stringify({ success: true, message: 'Kata sandi berhasil diperbarui' }),
      { status: 200, headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' } }
    )
  } catch (err: any) {
    return new Response(
      JSON.stringify({ error: err.message }),
      { status: 400, headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' } }
    )
  }
})
```

---

### C. Revamp Halaman Autentikasi Frontend
#### 🟡 [MODIFY] [LoginPage.tsx](file:///d:/MESO-app/src/features/auth/pages/LoginPage.tsx)
- Memperbarui label input agar meminta **"Nomor WhatsApp atau ID Pasien"**.
- Di bagian penyerahan form (`handleSubmit`), kita panggil fungsi RPC database `get_login_identifier` terlebih dahulu secara asinkron sebelum memanggil `signInWithPassword`.

```typescript
// Di dalam handleSubmit
setIsLoading(true)
try {
  // Panggil RPC database untuk menerjemahkan WhatsApp / ID Pasien menjadi email virtual
  const { data: formattedEmail, error: rpcError } = await supabase.rpc('get_login_identifier', {
    search_val: email
  })

  if (rpcError) throw rpcError

  const { error } = await supabase.auth.signInWithPassword({
    email: formattedEmail || email,
    password,
  })
  
  if (error) {
    toast.error('Gagal masuk: ' + error.message)
    setIsLoading(false)
    return
  }
  
  toast.success('Berhasil masuk!')
} catch (err: any) {
  toast.error(err.message || 'Terjadi kesalahan tidak terduga.')
  setIsLoading(false)
}
```

#### 🟡 [MODIFY] [RegisterPage.tsx](file:///d:/MESO-app/src/features/auth/pages/RegisterPage.tsx)
- Menghapus input "Alamat Email" dari antarmuka pengguna.
- Menambahkan input **"Nomor WhatsApp"** (wajib) dan **"ID Pasien (jika ada)"** (opsional).
- Di bagian submit, hasilkan email virtual `${whatsAppNumber}@meso.id` di balik layar dan simpan data meta-data:

```typescript
// Di dalam handleSubmit
const formattedEmail = `${whatsApp.trim()}@meso.id`
const { error } = await supabase.auth.signUp({
  email: formattedEmail,
  password,
  options: {
    data: {
      full_name: fullName,
      role: 'patient',
      phone_number: whatsApp,
      hospital_id: patientId || null
    }
  }
})
```

#### 🟡 [MODIFY] [ForgotPasswordPage.tsx](file:///d:/MESO-app/src/features/auth/pages/ForgotPasswordPage.tsx)
- Merombak total halaman lupa kata sandi menjadi alur pemulihan otomatis yang mandiri dan tidak merepotkan Apoteker:
  - **Step 1 (Permintaan Pemulihan):** 
    - Input dapat menerima **Nomor WhatsApp**, **ID Pasien**, atau **Alamat Email**.
    - **Kasus Pengguna dengan WhatsApp:** Mengirimkan kode OTP 6-digit via WhatsApp (Fonnte Edge Function) lalu lanjut ke Step 2.
    - **Kasus Pasien Lama (Belum Mengisi WA tapi memiliki Email Asli):** Jika input berupa email asli atau profil yang dicocokkan memiliki email asli, sistem akan langsung mengirimkan tautan pemulihan kata sandi secara otomatis ke email terdaftar menggunakan `supabase.auth.resetPasswordForEmail`. Layanan ini berjalan 100% mandiri dan otomatis tanpa merepotkan Apoteker.
  - **Step 2 (Verifikasi OTP WhatsApp - Bagi yang menggunakan WA):** Pengguna memasukkan kode 6-digit OTP yang diterima via WhatsApp Fonnte dan Kata Sandi Baru. Setelah menekan tombol, panggil Edge Function `verify-and-reset-otp`.
  - **Step 3 (Sukses):** Pesan sukses visual premium dengan tombol pintas kembali ke halaman masuk.

#### 🟡 [MODIFY] [PatientTopNav.tsx](file:///d:/MESO-app/src/features/reports/components/PatientTopNav.tsx)
- Membungkus avatar/inisial pengguna dengan tombol interaktif yang membuka **Profil Modal** premium.
- Di dalam modal profil:
  - Menampilkan informasi lengkap pasien: Nama Lengkap, **ID Pasien / Nomor Rekam Medis (`hospital_id`)**, **Nomor WhatsApp**, **Lokasi Kanker**, dan **Tanggal Lahir**.
  - Menyediakan tombol **"Salin ID"** dengan umpan balik visual instan (micro-animation "Tersalin!") dan petunjuk jelas: *"ID Pasien ini dapat Anda gunakan sebagai username/login."*
  - Menyediakan formulir edit nomor WhatsApp yang elegan. Jika nomor WhatsApp kosong (misalnya pada pasien lama), sistem akan memberikan penekanan visual (teal glow) dan pesan pembimbing agar pasien segera melengkapinya untuk mengaktifkan pemulihan kata sandi WhatsApp OTP dan login cepat.
  - Memperbarui data profil secara aman langsung ke Supabase dengan status loading spinner dan toast pemberitahuan yang premium.

---

### D. Pengisian Kuesioner QoL Standar EQ-5D
#### 🟡 [MODIFY] [types.ts](file:///d:/MESO-app/src/features/reports/types.ts)
Menambahkan tipe kuesioner QoL ke dalam interface `SymptomData`:

```typescript
export interface SymptomData {
  // ... gejala klinis sebelumnya ...
  qol?: {
    mobility?: number             // 1-3 (Mobilitas)
    selfCare?: number             // 1-3 (Perawatan Diri)
    usualActivities?: number      // 1-3 (Kegiatan Utama)
    painDiscomfort?: number       // 1-3 (Rasa Nyeri / Tidak Nyaman)
    anxietyDepression?: number    // 1-3 (Cemas / Depresi)
  }
}
```

#### 🟡 [MODIFY] [ReportForm.tsx](file:///d:/MESO-app/src/features/reports/pages/ReportForm.tsx)
- **Desain UI Kuesioner EQ-5D:** Rancang Tab 2 **[ Survey QoL ]** dengan 5 buah panel kuesioner eksklusif bergaya Premium Lumina Healing. Setiap pertanyaan memiliki 3 pilihan skala yang jelas, interaktif, dan responsif dengan micro-animations.
- **Daftar Pertanyaan EQ-5D-3L Bahasa Indonesia:**
  1. **Mobilitas (Kemampuan Berjalan):**
     - `1` - Saya tidak mempunyai kesulitan untuk berjalan.
     - `2` - Saya mempunyai beberapa kesulitan untuk berjalan.
     - `3` - Saya hanya bisa berbaring di tempat tidur.
  2. **Perawatan Diri (Self-care):**
     - `1` - Saya tidak mempunyai kesulitan untuk merawat diri sendiri.
     - `2` - Saya mempunyai beberapa kesulitan untuk membasuh diri atau berpakaian sendiri.
     - `3` - Saya tidak mampu membasuh diri atau berpakaian sendiri.
  3. **Kegiatan Utama (Usual Activities):**
     - `1` - Saya tidak mempunyai kesulitan untuk melakukan kegiatan sehari-hari (bekerja, belajar, pekerjaan rumah).
     - `2` - Saya mempunyai beberapa kesulitan untuk melakukan kegiatan sehari-hari.
     - `3` - Saya tidak mampu melakukan kegiatan sehari-hari.
  4. **Rasa Nyeri / Tidak Nyaman:**
     - `1` - Saya tidak merasa nyeri atau tidak nyaman.
     - `2` - Saya merasa nyeri atau tidak nyaman yang sedang.
     - `3` - Saya merasa nyeri atau tidak nyaman yang sangat hebat.
  5. **Rasa Cemas / Depresi:**
     - `1` - Saya tidak merasa cemas atau depresi.
     - `2` - Saya merasa cemas atau depresi yang sedang.
     - `3` - Saya merasa cemas atau depresi yang sangat hebat.

- **Alur Pengisian Form Pasien (Premium UX Flow):**
  - Bungkus formulir pelaporan dalam satu kesatuan state.
  - Jika QoL aktif untuk pasien tersebut:
    - Di bagian bawah Tab 1 (Gejala MESO), ubah tombol kirim menjadi tombol **"Lanjut ke Survei Kualitas Hidup (QoL) →"** yang memicu perpindahan tab ke Tab 2 secara otomatis.
    - Di dalam Tab 2, pengguna mengisi 5 survei EQ-5D, dan tombol **"Kirim Laporan"** yang sebenarnya baru akan muncul di bagian paling bawah Tab 2 untuk mengirimkan seluruh data laporan (Gejala MESO + Data QoL) sekaligus.
    - Ini akan memvalidasi agar kedua tab terisi lengkap sebelum dikirim secara resmi ke sistem!

---

## 3. Rencana Verifikasi (Verification Plan)

### A. Verifikasi Otomatis (Automated Build & Unit Tests)
- Menjalankan `npm run build` untuk memastikan tidak ada kesalahan kompilasi TypeScript atau CSS setelah pembaruan kode.
- Menjalankan suite pengujian modular dengan `npm run test` (jika tersedia).

### B. Verifikasi Manual (Manual Walkthrough)
1. **Pendaftaran (Signup) Pasien:**
   - Melakukan pendaftaran pengguna baru di `RegisterPage.tsx` menggunakan Nama, Nomor WhatsApp, dan ID Pasien kustom.
   - Memeriksa database melalui PostgreSQL untuk memastikan alamat email terdaftar sebagai virtual `${whatsAppNumber}@meso.id` dan field `hospital_id` pada profil telah terisi secara akurat sesuai input.
2. **Login Multi-Identifier:**
   - Mencoba login menggunakan Nomor WhatsApp & Kata Sandi → Berhasil.
   - Mencoba login menggunakan ID Pasien & Kata Sandi → Berhasil.
   - Mencoba login klinis dengan Email Asli (misal: `apoteker@meso.com`) → Berhasil.
3. **Alur Pemulihan Lupa Kata Sandi (WhatsApp OTP):**
   - Menuju `ForgotPasswordPage.tsx`, isi nomor WhatsApp, ajukan kode OTP.
   - Periksa tabel `password_reset_otps` untuk melihat pembuatan kode OTP dan waktu kedaluwarsanya.
   - Masukkan kode OTP tersebut beserta kata sandi baru, selesaikan setel ulang.
   - Coba login menggunakan kata sandi baru untuk memastikan pembaruan berhasil.
4. **Survei Kualitas Hidup (QoL):**
   - Aktifkan status survei pasien melalui dashboard Apoteker.
   - Masuk sebagai pasien, buka form pelaporan, pastikan Tab 2 aktif dan memuat kuesioner EQ-5D-3L dengan visualisasi yang premium.
   - Isi form lengkap dari Tab 1, lanjut ke Tab 2, isi kuesioner, lalu kirim laporan.
   - Periksa database di tabel `symptom_reports` kolom `symptoms` untuk melihat struktur data `qol` tersimpan secara sempurna.
