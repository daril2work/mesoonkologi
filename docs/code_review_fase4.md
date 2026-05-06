# Code Review: Fase 4 (Refactoring & Pharmacist Workspace)
**Tingkat Analisis: Professional & Scalable Architecture**

Fase 4 berfokus pada pembersihan utang teknis (*God Config*) dan ekspansi peran aplikasi ke arah Tenaga Medis. Berikut adalah bedah mendalam terhadap kode yang dihasilkan.

---

## 1. Modularisasi Konfigurasi (Domain vs UI)

### ✅ Kekuatan (Strengths)
- **Separation of Concerns (SoC):** Pemisahan `symptoms.domain.ts` (Logic) dan `symptoms.ui.ts` (Presentation) adalah langkah krusial. Ini mencegah kontaminasi kode bisnis oleh elemen visual (emoji, label).
- **Tree-Shaking Friendly:** Dengan menghapus barrel import `symptoms.config` dari `app.config.ts`, bundler (Vite) kini dapat membuang kode UI yang tidak terpakai jika kita hanya membutuhkan logika deteksi di sisi tertentu (seperti di worker atau utility murni).

### ⚠️ Observasi Kritis
- **Duplikasi Kunci (Maintenance overhead):** Masih ada sedikit ketergantungan manual antara `SYMPTOM_KEYS` di domain dan urutan di `SYMPTOMS_UI_CONFIG`. 
- *Rekomendasi:* Di masa depan, `SYMPTOMS_UI_CONFIG` bisa divalidasi menggunakan tipe dari `SymptomKey` untuk memastikan tidak ada gejala yang terlewat secara visual.

---

## 2. API Hooks & Data Fetching (`usePharmacistQueue.ts`)

### ✅ Kekuatan (Strengths)
- **Priority Sorting:** Penggunaan `.order('is_sentinel_alert', { ascending: false })` sangat tepat secara klinis. Pasien dengan sinyal bahaya otomatis naik ke atas antrean tanpa intervensi manual.
- **Relational Integrity:** Fetching data profil pasien via `patient:profiles(...)` menggunakan *foreign key join* Supabase adalah cara paling efisien untuk mendapatkan nama lengkap tanpa melakukan query terpisah (menghindari N+1 query di sisi client).

### ⚠️ Observasi Kritis
- **Array vs Object Mapping:** Terdapat penanganan defensif terhadap hasil join profiles: 
  ```typescript
  fullName: Array.isArray(row.patient) ? row.patient[0]?.full_name : ...
  ```
  Ini bagus untuk stabilitas, namun menunjukkan adanya ketidakpastian pada kembalian schema PostgREST. Hal ini sebaiknya distandarisasi pada level tipe data nantinya.

---

## 3. Dinamika Navigasi & Keamanan (`LoginPage.tsx` & `AppRouter.tsx`)

### ✅ Kekuatan (Strengths)
- **Role-Based Redirection:** Logika pemilihan dashboard di `LoginPage` sangat pintar:
  ```typescript
  if (user.role === 'pharmacist' || user.role === 'admin') {
    navigate(ROUTES.PHARMA_DASHBOARD, { replace: true })
  }
  ```
  Ini mencegah user "tersesat" di dashboard yang salah dan memberikan kesan UX yang sangat profesional (*Context-Aware Login*).
- **ProtectedRoute Granularity:** Penggunaan `allowedRoles={['patient']}` dsb di `AppRouter` memberikan perlindungan berlapis di tingkat router, bukan hanya tingkat komponen.

---

## 4. UI Dashboard Apoteker (`PharmacistDashboard.tsx`)

### ✅ Kekuatan (Strengths)
- **KPI-Driven UX:** Penampilan metrik "Butuh Tinjauan" dan "Darurat" di barisan atas mempermudah kognisi Apoteker dalam membagi beban kerja.
- **Visual Feedback:** Warna tag (Red/Yellow/Green) yang sinkron dengan hasil hitung CTCAE Fase 3 memberikan konsistensi visual yang sangat baik.

### ⚠️ Observasi Kritis (Catatan User)
- **Style Inconsistency:** Meskipun fungsional, UI saat ini masih menggunakan *inline styles* yang bersifat pendekatan generik. Belum menyentuh kedalaman detail desain dari "Sahabat Pejuang Mamae" (Stitch), seperti kurva spesifik, bayangan (*shadows*), dan tipografi yang lebih "editorial". 

---

## KESIMPULAN REVIEW

**Grade: A (Architecture Ready)**
Fase 4 secara teknis sangat sukses. Pembersihan "God Config" membuat sistem siap untuk diskalakan ke puluhan gejala baru tanpa kekacauan. Fokus selanjutnya adalah menyinkronkan *Visual Identity* agar setara dengan standar estetika Stitch.
