-- ====================================================================================
-- MESO App - Database Schema & Auth Setup
-- This script creates the foundational user profiles linked to Supabase Auth.
-- ====================================================================================

-- 1. Create custom enum type for User Roles
CREATE TYPE public.app_role AS ENUM ('patient', 'pharmacist', 'doctor', 'admin');

-- 2. Create the Profiles table 
-- References auth.users on UUID. Covers both PatientProfile and MedicProfile needs.
CREATE TABLE public.profiles (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  role public.app_role NOT NULL DEFAULT 'patient',
  full_name TEXT,
  
  -- Patient Specific Fields
  cancer_site TEXT,
  current_cycle INTEGER DEFAULT 1,
  date_of_birth DATE,
  
  -- Medic Specific Fields
  specialization TEXT,
  employee_id TEXT,
  
  -- Shared Fields
  hospital_id TEXT,
  phone_number TEXT,
  avatar_url TEXT,
  
  -- Metadata
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 3. Enable Row Level Security
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- 4. Create Security Policies
-- Anyone can read medics, but patients can only read their own profile.
-- (Simplified for initial scope: Users can select their own profile)
CREATE POLICY "Users can read own profile." 
  ON public.profiles FOR SELECT 
  USING (auth.uid() = id);

-- Users can update their own profile
CREATE POLICY "Users can update own profile." 
  ON public.profiles FOR UPDATE 
  USING (auth.uid() = id);

-- 5. Auto-Profile Creation Trigger
-- When a user registers via Supabase Auth, automatically create a row in public.profiles
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  -- Extract raw_user_meta_data fields passed during sign up
  INSERT INTO public.profiles (
    id, 
    role,
    full_name,
    cancer_site,
    date_of_birth,
    phone_number
  )
  VALUES (
    new.id,
    COALESCE((new.raw_user_meta_data->>'role')::public.app_role, 'patient'),
    new.raw_user_meta_data->>'full_name',
    new.raw_user_meta_data->>'cancer_site',
    (new.raw_user_meta_data->>'date_of_birth')::DATE,
    new.raw_user_meta_data->>'phone_number'
  );
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Bind trigger to auth.users table
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ====================================================================================
-- NOTE FOR USER: Run this script inside your Supabase Project -> SQL Editor
-- ====================================================================================
