# Implementation Plan: Client Feedback S3.1 (Form MESO & QoL)

Dokumen ini berisi rangkuman teknis dari perbaikan dan pengembangan fitur Formulir Pemantauan MESO serta kuesioner Pemantauan Kualitas Hidup (QoL).

## 1. Latar Belakang
Berdasarkan umpan balik klien, perlu ada pemisahan yang lebih jelas antara pelaporan gejala harian rutin (MESO) dan kuesioner mendalam (QoL/EORTC QLQ-C30). Kuesioner QoL tidak selalu muncul dan kemunculannya dikendalikan oleh tim klinis (Apoteker).

## 2. Implementasi Teknis
- **Pemisahan Tab UI**: Pembuatan _tab_ antarmuka terpisah antara "Gejala MESO" dan "Kualitas Hidup (QoL)" dalam `ReportForm.tsx`.
- **Database Column**: Memanfaatkan kolom `is_qol_active` bertipe boolean di tabel `profiles`.
- **Realtime Listener**: Menggunakan `supabase.channel()` dalam _hook_ `usePatientQolStatus` untuk mendengarkan perubahan pada baris profil pengguna, sehingga pasien langsung mendapat notifikasi (Toast) apabila Apoteker mengaktifkan survei.
- **Notifikasi Otomatis**: Ketika Apoteker menekan _toggle_ QoL di halaman detail pasien, sebuah pesan `[SISTEM]` otomatis terkirim melalui tabel `chat_messages` agar tercatat di rekam komunikasi.

## 3. Optimasi Code (Sprint 2)
- Mengurangi _code smell_ berupa pemanggilan _fetch_ sekuensial _inline_ di dalam komponen formulir dengan mengekstraknya ke _custom hook_ terpusat `usePatientQolStatus`.
- Menghilangkan *console.log* di mode _production_ untuk menghemat memori klien.
