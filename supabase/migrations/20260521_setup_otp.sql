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

-- Buat Policy: Hanya Service Role (Backend Admin) yang dapat mengakses tabel ini
DROP POLICY IF EXISTS "Service role full access" ON public.password_reset_otps;
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
  clean_id TEXT := lower(trim(search_val));
  hex_val TEXT := '';
BEGIN
  -- Jika input sudah berupa email asli, langsung kembalikan aslinya
  IF search_val LIKE '%@%' THEN
    RETURN search_val;
  END IF;

  -- Bersihkan spasi kosong
  search_val := trim(search_val);

  -- Ekstrak kode heksadesimal jika cocok dengan pola ID Pasien
  IF clean_id LIKE '#p-%' AND length(clean_id) = 9 THEN
    hex_val := substring(clean_id from 4);
  ELSIF clean_id LIKE 'p-%' AND length(clean_id) = 8 THEN
    hex_val := substring(clean_id from 3);
  ELSIF length(clean_id) = 6 AND clean_id ~ '^[0-9a-f]{6}$' THEN
    hex_val := clean_id;
  END IF;

  -- Join profiles dan auth.users untuk menemukan email asli (baik email asli lama atau virtual email baru)
  SELECT u.email INTO found_email
  FROM public.profiles p
  JOIN auth.users u ON p.id = u.id
  WHERE p.phone_number = search_val 
     OR p.hospital_id = search_val
     OR (hex_val <> '' AND p.id::text LIKE hex_val || '%')
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

-- 2.5. Buat fungsi pengambil profil lengkap (RPC) untuk verifikasi & pemulihan
CREATE OR REPLACE FUNCTION public.get_user_by_identifier(search_val TEXT)
RETURNS JSON AS $$
DECLARE
  res JSON;
  clean_id TEXT := lower(trim(search_val));
  hex_val TEXT := '';
BEGIN
  -- Bersihkan spasi kosong
  search_val := trim(search_val);

  -- Ekstrak kode heksadesimal jika cocok dengan pola ID Pasien
  IF clean_id LIKE '#p-%' AND length(clean_id) = 9 THEN
    hex_val := substring(clean_id from 4);
  ELSIF clean_id LIKE 'p-%' AND length(clean_id) = 8 THEN
    hex_val := substring(clean_id from 3);
  ELSIF length(clean_id) = 6 AND clean_id ~ '^[0-9a-f]{6}$' THEN
    hex_val := clean_id;
  END IF;

  SELECT json_build_object(
    'id', p.id,
    'email', u.email,
    'phone_number', p.phone_number,
    'full_name', p.full_name,
    'hospital_id', p.hospital_id
  ) INTO res
  FROM public.profiles p
  JOIN auth.users u ON p.id = u.id
  WHERE p.phone_number = search_val 
     OR p.hospital_id = search_val
     OR u.email = search_val
     OR (hex_val <> '' AND p.id::text LIKE hex_val || '%')
     OR p.phone_number = '62' || substring(search_val from 2)
     OR p.phone_number = '0' || substring(search_val from 3)
  LIMIT 1;

  RETURN res;
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
