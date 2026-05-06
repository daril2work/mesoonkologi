# 🔍 MESO App — Code Review (Fase 2)

**Tanggal:** 22 April 2026  
**Scope:** Semua file terimbas Fase 2 (Backend & Authentication Integration)  
**Status:** ✅ Signup → Login → Dashboard → Logout semua berjalan

---

## 📊 Ringkasan Eksekutif

| File | Status | Catatan |
|---|:---:|---|
| `lib/supabase.ts` | ✅ Baik | Guard clause & config solid |
| `features/auth/types.ts` | ⚠️ Minor | Duplikasi `UserRole` dengan `types/index.ts` |
| `features/auth/store.ts` | ⚠️ Perlu Perbaikan | `isLoading` di logout tidak sepenuhnya aman |
| `features/auth/components/ProtectedRoute.tsx` | ✅ Baik | RBAC sudah siap, redirect state terjaga |
| `features/auth/pages/LoginPage.tsx` | ✅ Baik | Semua CR dari Fase 1 terselesaikan |
| `features/auth/pages/RegisterPage.tsx` | ⚠️ Minor | Tidak ada validasi email format client-side |
| `features/reports/pages/PatientDashboard.tsx` | ⚠️ Stub | Masih stub, belum ada data personal pasien |
| `components/ui/Button.tsx` | 🔴 Bug | `type="submit"` hardcoded, merusak `onClick` di Dashboard |
| `components/ui/FormInput.tsx` | ✅ Baik | `forwardRef` benar, micro-animation ada |
| `app/AppRouter.tsx` | ✅ Baik | `onAuthStateChange` listener benar |
| `supabase/migrations/20260416_setup_auth.sql` | ✅ Baik | RLS, Trigger, Enum semua ada |

---

## 🔴 Critical Issues

### CR-1: `Button.tsx` — `type="submit"` Hardcoded (Bug Tersembunyi)
**File:** `src/components/ui/Button.tsx:19`

Tombol **Keluar** di `PatientDashboard.tsx` menggunakan komponen `<Button variant="ghost" onClick={logout}>`. Karena `Button` selalu me-render `type="submit"`, jika di masa depan tombol berada di dalam `<form>`, klik **Keluar akan men-trigger form submission** bukannya logout — ini bug yang sulit dilacak.

```tsx
// ❌ Saat ini — type selalu "submit"
<button type="submit" ... >

// ✅ Fix — gunakan prop, default "button" bukan "submit"
export function Button({ type = 'button', isLoading, ...}: ButtonProps) {
  return <button type={type} ...>
```

Dan di form login/register yang membutuhkan submit, secara explicit set `type="submit"`:
```tsx
<Button type="submit" isLoading={isLoading}>Masuk</Button>
```

---

## 🟡 Warning Issues

### W-1: `store.ts` — Race Condition Potensial saat Logout
**File:** `src/features/auth/store.ts:55-63`

```ts
logout: async () => {
  set({ isLoading: true })
  try {
    await supabase.auth.signOut()
  } finally {
    set({ isLoading: false })  // ⚠️ Listener sudah clear session, ini tidak perlu
  }
}
```

`supabase.auth.signOut()` akan memicu `onAuthStateChange` di `AppRouter` yang memanggil `setSession(null)` — yang sudah set `isLoading: false`. Jadi `finally` block bisa menyebabkan double state update. Tidak berbahaya sekarang, tapi perlu dibersihkan.

**Fix:**
```ts
logout: async () => {
  set({ isLoading: true })
  await supabase.auth.signOut()
  // Biarkan onAuthStateChange listener yang reset state via setSession(null)
}
```

---

### W-2: `types.ts` — Duplikasi Definisi `UserRole`
**File:** `src/features/auth/types.ts:5` vs `src/types/index.ts` (Fase 1)

Ada dua definisi `UserRole` yang terpisah di proyek ini. Jika ada perbedaan di masa depan (misalnya menambah role `nurse`), keduanya harus diubah secara manual.

**Fix:** Hapus dari `features/auth/types.ts` dan impor dari `types/index.ts`:
```ts
// Di features/auth/types.ts
export type { UserRole } from '@types'  // Re-export dari sumber tunggal
```

---

### W-3: `RegisterPage.tsx` — Tidak Ada Validasi Password Strength
**File:** `src/features/auth/pages/RegisterPage.tsx`

Validasi hanya mengecek `password.length < 6`, tapi tidak memberi feedback visual tentang kekuatan kata sandi. Untuk aplikasi medis yang menyimpan data sensitif, minimal ada indikator kekuatan.

**Rekomendasi minimal:**
- Tampilkan pesan hint di bawah field password: *"Gunakan kombinasi huruf & angka"*
- Warna border berubah jika sudah memadai

---

### W-4: `PatientDashboard.tsx` — Hanya Menampilkan Email, Bukan Nama
**File:** `src/features/reports/pages/PatientDashboard.tsx:13`

```tsx
// ❌ Kurang personal
Selamat datang, {user?.email} 👋

// ✅ Lebih hangat dan personal (data full_name sudah ada di profiles)
Selamat datang, {profile?.fullName ?? user?.email} 👋
```

`store.ts` sudah query ke tabel `profiles` untuk mendapatkan `role`, tapi `full_name` tidak diambil dan tidak disimpan di `AuthUser`. Ini perlu diperkaya.

---

### W-5: `ProtectedRoute.tsx` — Loading State Tidak Menggunakan `AppLoader`
**File:** `src/features/auth/components/ProtectedRoute.tsx:17-23`

Ada dua versi loading UI yang dikode manual (di sini dan di `AppLoader`), sementara `AppLoader` sudah bagus. Ini duplikasi visual yang bisa tidak sinkron.

**Fix:** Ekstrak `AppLoader` menjadi komponen yang bisa diimpor:
```tsx
// src/components/ui/AppLoader.tsx — export sebagai komponen mandiri
import { AppLoader } from '@components/ui/AppLoader'
// lalu gunakan di ProtectedRoute
if (!isInitialized) return <AppLoader />
```

---

## 🔵 Improvement Suggestions

### I-1: `store.ts` — `AuthUser` Perlu Menyimpan `fullName`
`setSession` hanya mengambil `role` dari tabel `profiles`. Tambahkan `full_name` agar seluruh aplikasi bisa menggunakannya tanpa query ulang:

```ts
const { data: profile } = await supabase
  .from('profiles')
  .select('role, full_name')  // tambahkan full_name
  .eq('id', session.user.id)
  .single()

const authUser: AuthUser = {
  ...
  fullName: profile?.full_name ?? null,  // tambahkan ke AuthUser type
}
```

### I-2: `LoginPage.tsx` — Tidak Ada Redirect ke `from` Location
Saat user mengakses halaman protected (`/patient/dashboard`) tanpa login, `ProtectedRoute` sudah menyimpan lokasi asal via `state={{ from: location }}`, tapi setelah login `LoginPage` selalu redirect ke `ROUTES.PATIENT_DASHBOARD` alih-alih ke halaman yang awalnya dituju.

```ts
// Di LoginPage.tsx handleSubmit, setelah login berhasil:
const location = useLocation()
const from = (location.state as any)?.from?.pathname ?? ROUTES.PATIENT_DASHBOARD
navigate(from, { replace: true })
```

### I-3: `supabase.ts` — Tidak Ada Error Boundary untuk DB Error
Jika `supabase.from('profiles').select()` gagal (misal timeout), `store.ts` diam-diam fallback ke role `'patient'`. Ini seharusnya di-log minimal di development mode.

```ts
const { data: profile, error } = await supabase.from('profiles')...
if (error) {
  if (import.meta.env.DEV) console.warn('[AuthStore] Profile fetch error:', error)
}
```

---

## 📋 Checklist Prioritas Perbaikan

| # | Item | File | Priority | Estimasi |
|---|---|---|:---:|---|
| 1 | Ubah `type="submit"` ke `type={type}` di Button | `Button.tsx` | 🔴 Critical | 3 menit |
| 2 | Simpan `full_name` di `AuthUser` & store | `store.ts`, `types.ts` | 🟡 High | 10 menit |
| 3 | Redirect ke `from` location setelah login | `LoginPage.tsx` | 🟡 High | 5 menit |
| 4 | Bersihkan race condition di `logout()` | `store.ts` | 🟡 Medium | 3 menit |
| 5 | Dedup `UserRole` ke satu sumber | `auth/types.ts` | 🟡 Medium | 5 menit |
| 6 | Ekstrak `AppLoader` jadi komponen mandiri | baru + `ProtectedRoute.tsx` | 🔵 Low | 10 menit |
| 7 | Tambah dev-mode warning untuk DB error | `store.ts` | 🔵 Low | 3 menit |
| 8 | Password strength hint di Register | `RegisterPage.tsx` | 🔵 Low | 15 menit |

**Total effort: ~54 menit** untuk seluruh perbaikan.

---

## 🚀 Kesiapan untuk Fase 3 (Patient Dashboard & Symptom Reporting)

**Siap dengan catatan:** ✅ (setelah Item #1 dan #2 diperbaiki)
- Autentikasi end-to-end berjalan sempurna
- RLS database aktif — data pasien terlindungi
- RBAC sudah ada di `ProtectedRoute` — siap untuk role `doctor` dan `pharmacist`
- `store.ts` tinggal diperkaya dengan `full_name` untuk personalisasi UI

**Yang disarankan sebelum Fase 3:**
1. Fix `Button.tsx` type bug (3 menit, Critical)
2. Tambah `full_name` ke `AuthUser` (10 menit, akan langsung terpakai di Dashboard)
