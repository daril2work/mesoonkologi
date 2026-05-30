# Code Audit & Bug Fixes Report

Dokumen ini merangkum proses audit, refactoring, dan penyelesaian masalah arsitektural yang masif di sisi Front-end (React) maupun Back-end (Supabase RLS). Audit dibagi menjadi 4 iterasi (_sprint_).

## Sprint 1: Security & RLS Hardening
**Isu Ditemukan:** Kerentanan pada *Row Level Security* (RLS) di Supabase yang rawan dimanipulasi melalui akses `user_metadata` _client-side_, penggunaan sub-kueri N+1, dan resiko _Infinite Recursion_.
**Penyelesaian:**
- Membuat fungsi kustom `public.get_jwt_role()` bertipe `STABLE` di Supabase untuk membaca level *role* langsung dari _JWT Claims_ (Anti _Spoofing_).
- Mendaur ulang seluruh *policy* pada tabel kritikal (`profiles`, `symptom_reports`, `system_settings`, `patient_education_tracking`, `chat_messages`) menggunakan `get_jwt_role()`.
- Mengganti operasi sub-kueri `EXISTS (SELECT 1 FROM...)` dengan operator klausa sederhana (O(1)).
- Memperbaiki `UPDATE` _policy_ pada profil agar Apoteker terhindar dari _lockout_ saat melakukan deaktivasi pasien.

## Sprint 2: "Code Smell" & God Class Refactoring
**Isu Ditemukan:** Berbagai komponen dengan tanggung jawab yang menumpuk (_God Class_), perulangan kode konversi label yang kotor, hingga sisa log debugging.
**Penyelesaian:**
- Memecah _God Class_ pada `PharmacistPatientDetail.tsx` dengan mengekstrak seluruh mutasi/fungsi (seperti QoL Toggle, Deactivate, Reactivate) ke _custom hook_ baru bernama `usePatientActions.ts`.
- Sentralisasi _Label Formatter_ dengan menambahkan fungsi `getDeactivationLabel()` di _helpers_ untuk menghindari kondisional ternary yang terduplikasi.
- Mencabut _console.log_ dan pagination statis palsu yang membingungkan.

## Sprint 3: Refactoring & Optimization (Performa)
**Isu Ditemukan:** Operasi asinkron yang dipanggil secara berurutan (*blocking*) dan muat ulang halaman kasar memakan *load time*.
**Penyelesaian:**
- Mengimplementasikan `Promise.all()` di `usePatientStats.ts` untuk memanggil 4 jenis statistik dasbor Apoteker (Total, Kritis, Jadwal, Edukasi) secara konkuren (paralel).
- Mengganti seluruh sintaks kuno `window.location.reload()` di UI dasbor menjadi metode reaktif murni menggunakan `queryClient.invalidateQueries()`.
- DRY (Don't Repeat Yourself) kode invalidasi dengan menghilangkan array kunci spesifik, cukup menggunakan _query key prefixes_ secara masif.

## Sprint 4: Polish (Finishing Touch)
**Isu Ditemukan:** _Warning_ TypeScript akibat tipe _any_ implisit, penarikan data `SELECT *` yang tidak beraturan, dan *unused variables*.
**Penyelesaian:**
- Menghapus _variables_ mati (`TS6133`).
- Memasang _explicit types_ pada argumen di utilitas seperti `mapEducationRow`.
- Memperbaiki prop yang hilang `isPending` vs `isLoading` pada modal dialog.
- Mengonversi `SELECT *` dalam antrean laporan (`usePharmacistQueue.ts`) menjadi kolom data selektif untuk memperkecil ukuran *payload* jaringan.
