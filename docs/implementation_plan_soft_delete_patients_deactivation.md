# Implementation Plan: Soft Delete & Patients Deactivation

Dokumen ini mendeskripsikan spesifikasi dan alur teknis mengenai fitur penonaktifan pasien (Soft Delete).

## 1. Latar Belakang
Apoteker perlu menutup akun pasien yang telah selesai menjalani masa terapi, keluar dari program, atau telah meninggal dunia, tanpa menghapus rekam medis historisnya dari sistem demi keperluan audit (Soft Delete).

## 2. Modifikasi Database Schema
Sebuah file migrasi `20260530_add_patient_deactivation.sql` diterapkan ke Supabase untuk menambahkan kolom di tabel `profiles`:
- `is_active` (BOOLEAN DEFAULT true)
- `status_reason` (TEXT)
- `deactivated_at` (TIMESTAMP)

## 3. Antarmuka Pengguna (UI)
- Dibuat sebuah komponen modular `DeactivationModal.tsx` yang bersifat premium dengan 3 opsi pemutusan administratif yang diatur ketat:
  1. **Discharged**: Selesai Terapi
  2. **Dismissed**: Keluar Program
  3. **Deceased**: Meninggal Dunia
- Tombol _toggle_ reaktivasi dan deaktivasi diatur dalam halaman `PharmacistPatientDetail.tsx`.

## 4. Keamanan dan RLS (Row Level Security)
- Seluruh mutasi _soft delete_ dibatasi menggunakan RLS `UPDATE` `profiles` untuk _user_ dengan _role_ `pharmacist`, `doctor`, atau `admin`.
- RLS diamankan (Hardening) dengan `public.get_jwt_role()` untuk memastikan operasi penonaktifan bisa dijalankan dengan performa _O(1)_ dan tanpa _infinite recursion loop_.

## 5. Audit Trail & Log Komunikasi
- Sama halnya dengan pengaktifan QoL, setiap kali pasien dinonaktifkan atau diaktifkan ulang, mutasi juga membuat _insert_ baru ke tabel `chat_messages` dari sisi Apoteker berisikan notifikasi Sistem otomatis.
- _Query Invalidation_ dari _React Query_ digunakan agar perubahan status _Active/Deactive_ pada pasien seketika itu juga mengubah tampilan di Dasbor Utama.
