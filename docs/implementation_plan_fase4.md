# Implementasi Fase 4: Medic Features & Architectural Refactoring

*(Dokumen ini adalah backlog/draft awal yang akan dieksekusi setelah penyelesaian Fase 3).*

Pada fase ini, aplikasi akan mulai melayani dua aktor baru: **Apoteker (Pharmacist)** dan **Dokter (Doctor)**. Karena kerumitan logika klinis akan meningkat tajam untuk kedua role tersebut, ada dua tugas *Refactoring Architectural* yang bersifat **WAJIB** untuk dilakukan sebelum fitur baru dibangun.

## Technical Debt & Refactoring Checklist

### 1. Eliminasi Barrel Export (`app.config.ts`)
- **Masalah:** `app.config.ts` saat ini melakukan `export *` dari semua config. Ini memicu *God Import* path dan berisiko memuat seluruh data ke memori meskipun tidak dibutuhkan (menggagalkan *tree-shaking*).
- **Tindakan:**
  - Ubah pola impor di setiap komponen layar UI dari `import { X } from '@configs/app.config'` menjadi impor spesifik, misalnya: `import { ROUTES } from '@configs/routes.config'`.
  - Hapus re-export *barrel* dari `app.config.ts`.

### 2. Pemisahan Domain Klinis vs Presentasi (UI)
- **Masalah:** Di `symptoms.config.ts`, properti layar (`icon` emoji, `label` human-readable) dicampur dengan aturan medis (`isSentinel`, `SENTINEL_GRADE_THRESHOLD`). Ini berisiko membuat API backend menjadi berat dengan data khusus UI.
- **Tindakan:**
  - Terapkan pola **"Strangler Fig"**.
  - **[NEW]** Buat `src/domain/clinical.ts`: Berisi hanya atribut *pure medical logic* (ID, flag keparahan, scoring threshold).
  - **[MODIFY]** Ubah `symptoms.config.ts` menjadi sekadar **Kamus UI (UI Dictionary)** yang memetakan ID gejala (dari domain klinis) dengan atribut antarmuka (`icon`, `label`).
  - Ikat dengan tipe TypeScript yang ketat agar tidak ada gejala klinis yang lolos dari render UI.

---

## Proposed Changes (Fitur Baru)
*(Akan didetailkan lebih lanjut saat mulai masuk ke tahapan ini)*

- Integrasi Endpoint Apoteker (`/pharma/*`)
- Kueri Dashboard Sentinel
- Dashboard Pengawasan Dokter
