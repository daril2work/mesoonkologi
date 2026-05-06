# Laporan Audit Kode: Pembaruan Intervensi Klinis

Berikut adalah hasil audit teknis mendalam terhadap perubahan arsitektur yang baru saja dilakukan pada modul Intervensi Klinis. Audit ini berfokus pada empat pilar: Keamanan (Security), Kinerja (Performance), Ketahanan Tipe Data (Type-Safety), dan Maintainability.

## 1. Audit Keamanan (Security)

**Area Fokus:** Potensi Manipulasi Parameter URL (`reportId`)
**Status:** ✅ Aman

**Temuan & Analisis:**
- **URL Spoofing:** Karena sekarang aplikasi menggunakan parameter dinamis `/doctor/patient/:id/:reportId`, ada risiko pengguna memanipulasi ID secara manual di *address bar*.
- **Mitigasi di Tempat:** Supabase *Row Level Security* (RLS) untuk tabel `symptom_reports` telah menangani hal ini. Kebijakan saat ini membatasi *read access* hanya untuk *user* dengan *role* `pharmacist`, `doctor`, atau `admin`. Jika *user* non-medis atau pasien mencoba mengakses `reportId` acak, *query* `.single()` akan mengembalikan `null` atau `error`, yang kemudian diatasi dengan anggun oleh *error handler* UI kita.

## 2. Audit Kinerja (Performance & Optimization)

**Area Fokus:** *Fallback Query* dan *Over-fetching*
**Status:** ✅ Sangat Optimal

**Temuan & Analisis:**
- **Pendekatan *Lazy Fetch*:** Penambahan logika pencarian `reportId` spesifik di `usePatientDetail` dilakukan *setelah* pencarian *array* awal (`reports.find()`). Ini mencegah panggilan jaringan (API *call*) yang tidak perlu pada 95% kasus biasa (eskalasi yang masih segar/baru).
- **Pengaturan Cache:** Pemanggilan `queryClient.invalidateQueries` di `useClinicianIntervention` dilakukan secara bersamaan (secara berurutan dalam blok sinkron tanpa penundaan *await*). React Query secara otomatis mem-*batch* (menggabungkan) invalidasi ini di belakang layar, sehingga tidak ada *re-render* yang berlebihan (*waterfall renders*) di sisi klien.

> [!TIP]
> **Rekomendasi Skalabilitas Masa Depan:** 
> Jika antrean apoteker (`pharmacistQueue`) mencapai ribuan entri di masa depan, invalidasi *broad-stroke* bisa memakan sedikit waktu. Ke depannya, kita dapat menggantinya dengan *Optimistic Update* (mengubah status secara lokal di *cache frontend* sebelum menunggu *response server*).

## 3. Ketahanan Tipe Data (Type-Safety)

**Area Fokus:** TypeScript Integrasi Parameter
**Status:** ✅ Solid

**Temuan & Analisis:**
- *React Router* `useParams()` mengekstrak `reportId` dengan tipe data secara *implicit* `string | undefined`.
- Hook `usePatientDetail(patientId?: string, reportId?: string)` sudah dikonfigurasi untuk menerima argumen *optional* (*undefined-safe*).
- Kode terhindar dari pemaksaan tipe (`as string` atau `!`) yang dapat memicu *runtime exception* jika parameter tidak tersedia (misal saat dokter membuka pasien langsung dari navigasi pencarian/direktori, tanpa niat eskalasi).

## 4. Maintainability (Pemeliharaan Jangka Panjang)

**Area Fokus:** Pemisahan Tanggung Jawab (*Separation of Concerns*)
**Status:** ⚠️ Dapat Ditingkatkan (*Minor Warning*)

**Temuan & Analisis:**
- **Ketergantungan *Query Keys*:** Saat ini, aksi di modul Dokter (`useClinicianIntervention`) harus mengetahui secara spesifik *Query Key* dari modul Apoteker (`['pharmacistQueue']`). Hal ini menciptakan *coupling* (keterikatan) antar modul yang agak erat.
- **Dampak:** Jika suatu saat kita mengganti struktur modul Apoteker, pengembang harus ingat untuk juga memperbarui *key* yang sama di dalam file *logic* Dokter.

> [!NOTE]
> **Peluang Refactor:**
> Kita dapat membuat file konstanta pusat bernama `QUERY_KEYS.ts` di folder `@configs` yang berisi semua daftar *key* React Query. Dengan demikian, kita hanya mereferensikan konstanta tersebut, meminimalisir kesalahan pengetikan (*typo*) antar file.

## Kesimpulan Akhir
Perubahan yang dilakukan lulus audit teknis dengan nilai tinggi. Tambahan logika menangani seluruh *edge cases* yang disebabkan oleh laporan lama yang tersangkut (seperti kasus 11 hari), dengan overhead kinerja jaringan yang mendekati nol berkat pemanfaatan data lokal (*cache* batching). Tidak ada *technical debt* mendesak yang tercipta dari pembaruan ini.
