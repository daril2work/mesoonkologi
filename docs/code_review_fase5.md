# Code Review — Phase 5: Enterprise Hardening

**Tanggal Review**: 23 April 2026  
**Reviewer**: Antigravity AI  
**Scope**: Semua file yang dibuat/dimodifikasi selama Fase 5

---

## Ringkasan Status

| Area | Status | Catatan |
| :--- | :--- | :--- |
| ErrorBoundary | ✅ Solid | Import sudah benar; `handleReset` perlu diperbaiki |
| Unit Testing | ✅ Baik | 11/11 test pass; `type` import & vitest config perlu ditambahkan |
| Logger Utility | ⚠️ Perlu Perbaikan | Ada `any` type pada signature |
| Privacy Policy | ⚠️ Perlu Perbaikan | Unused import React, klaim enkripsi perlu diperhalus |
| AppRouter | ✅ Baik | Routing terstruktur dengan benar |
| Vitest Config | ❌ Missing | Tidak ada `vitest.config.ts` — alias path belum terdaftar eksplisit |
| Login Page | ❌ Bug | Privacy button tanpa `type="button"` → menyebabkan form submit |

---

## Temuan Detail

### F01 — Vitest Config Tidak Ada
**File**: (perlu dibuat) `vitest.config.ts`  
**Severity**: 🔴 High  
**Kategori**: Konfigurasi

Test saat ini berhasil karena menumpang config Vite secara implisit. Alias `@features/...` tidak terdaftar secara eksplisit di Vitest. Jika config dipisahkan (best practice enterprise), semua test akan langsung gagal.

**Perbaikan**: Buat `vitest.config.ts` dengan alias yang mencerminkan `vite.config.ts`.

---

### F02 — Privacy Button Tanpa `type="button"` di LoginPage
**File**: `src/features/auth/pages/LoginPage.tsx`  
**Severity**: 🔴 High  
**Kategori**: Bug Fungsional

Button di dalam `<form>` yang tidak memiliki atribut `type` akan default ke `type="submit"`. Klik tombol "Kebijakan Privasi" akan men-*submit* form login alih-alih navigasi ke halaman privasi.

```diff
 <button
+  type="button"
   onClick={() => navigate(ROUTES.PRIVACY_POLICY)}
```

---

### F03 — Parameter `error` Bertipe `any` di Logger
**File**: `src/utils/logger.ts`  
**Severity**: 🟡 Medium  
**Kategori**: Type Safety

```diff
-public error(message: string, error?: any, context?: LogContext) {
+public error(message: string, error?: Error | unknown, context?: LogContext) {
```

---

### F04 — `LogContext` Index Signature Menggunakan `any`
**File**: `src/utils/logger.ts`  
**Severity**: 🟡 Medium  
**Kategori**: Type Safety / Security

`any` pada index signature membuka kemungkinan object dengan data sensitif masuk ke log tanpa disadari.

```diff
-  [key: string]: any
+  [key: string]: unknown
```

---

### F05 — `import React` Tidak Terpakai di PrivacyPolicy
**File**: `src/features/auth/pages/PrivacyPolicy.tsx`  
**Severity**: 🟡 Low  
**Kategori**: Code Smell

Konsisten dengan fix yang sama di Fase 4 (`PatientEducation.tsx`). Harus dihapus.

---

### F06 — Klaim "AES-256" Terlalu Spesifik di Privacy Policy
**File**: `src/features/auth/pages/PrivacyPolicy.tsx`  
**Severity**: 🟡 Low  
**Kategori**: Compliance / Akurasi Dokumen Legal

Klaim enkripsi spesifik di dokumen legal berpotensi menjadi masalah jika infrastruktur berubah. Sebaiknya gunakan frasa yang lebih umum dan tetap akurat.

```diff
-Kami menggunakan enkripsi standar industri (AES-256)
+Kami menggunakan enkripsi berlapis standar industri
```

---

### F07 — Import `SymptomData` Tanpa `type` di Unit Test
**File**: `src/utils/sentinel.test.ts`  
**Severity**: 🟡 Low  
**Kategori**: TypeScript Best Practice

```diff
-import { SymptomData } from '@features/reports/types'
+import type { SymptomData } from '@features/reports/types'
```

---

### F08 — `handleReset` di ErrorBoundary Menggunakan `window.location.reload()`
**File**: `src/components/ui/ErrorBoundary.tsx`  
**Severity**: 🟡 Low  
**Kategori**: UX / State Management

`window.location.reload()` memaksa full page reload yang memutus semua state React termasuk sesi auth. Cukup lakukan `setState` untuk membiarkan React melakukan re-render bersih. Jika memang perlu reload, biarkan sebagai opsi terakhir.

---

## Tabel Prioritas Perbaikan

| # | ID | Temuan | Severity | Status |
|---|----|--------|----------|--------|
| 1 | F01 | `vitest.config.ts` tidak ada | 🔴 High | Ditindaklanjuti |
| 2 | F02 | Privacy button tanpa `type="button"` | 🔴 High | Ditindaklanjuti |
| 3 | F03 | `logger.error` param `any` | 🟡 Medium | Ditindaklanjuti |
| 4 | F04 | `LogContext` index signature `any` | 🟡 Medium | Ditindaklanjuti |
| 5 | F05 | `import React` unused di PrivacyPolicy | 🟡 Low | Ditindaklanjuti |
| 6 | F06 | Klaim "AES-256" terlalu spesifik | 🟡 Low | Ditindaklanjuti |
| 7 | F07 | `SymptomData` import tanpa `type` | 🟡 Low | Ditindaklanjuti |
| 8 | F08 | `handleReset` pakai `window.location.reload()` | 🟡 Low | Ditindaklanjuti |
