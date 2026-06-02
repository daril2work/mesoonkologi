# Revisi UI/UX Pasca Meeting Klien

Berdasarkan diskusi dan gambar yang diberikan, kita akan melakukan penyesuaian UI agar aplikasi berjalan lebih optimal, terutama di perangkat *mobile*.

## Proposed Changes

### 1. Komponen Layout & Notifikasi
Notifikasi *dropdown* saat ini memaksakan lebar `w-80` yang bisa terpotong atau merusak *layout* di layar HP yang lebih kecil dari ukuran tersebut.

#### [MODIFY] [PharmacistLayout.tsx](file:///d:/MESO-app/src/features/reports/components/PharmacistLayout.tsx)
- Ubah kelas Tailwind pada *dropdown container* notifikasi (baris ~194).
- Dari `w-80` menjadi responsif: `w-[calc(100vw-2rem)] sm:w-80`.
- Tambahkan pergeseran posisi `-right-4 sm:right-0` agar *dropdown* tidak melewati batas kanan layar *mobile*.

### 2. Komponen Card Laporan (MajorCard)
Tampilan `MajorCard` berdesakan di layar HP karena menggunakan `flex items-center justify-between` di parent utamanya. Ini memaksa elemen identitas pasien dan elemen tombol ("BERAT", "Tinjau") tetap berada di satu baris horizontal meski layarnya sempit.

#### [MODIFY] [MajorCard.tsx](file:///d:/MESO-app/src/features/reports/components/MajorCard.tsx)
- Ubah kontainer utama dari `flex` biasa menjadi `flex-col md:flex-row`.
- Ubah letak tombol aksi ("BERAT", "Tinjau") agar menjadi *full-width* dan terpisah ke bawah (stack vertikal) pada layar *mobile*, tetapi kembali ke kanan (sejajar) pada layar *tablet/desktop*.
- Sesuaikan *padding* menjadi `p-4 sm:p-6` agar lebih nyaman di HP.
- Berikan batas pemisah (border atas) samar untuk bagian aksi pada *mobile* agar tidak terlihat menyatu dengan "Gejala Utama".

### 3. Komponen Manajemen Edukasi (PharmacistEducation)
Ada dua kendala di halaman Manajemen Edukasi: tombol salin *link* belum ada, dan modal unggah materi terpotong bagian bawahnya (tidak bisa di-*scroll*).

#### [MODIFY] [PharmacistEducation.tsx](file:///d:/MESO-app/src/features/reports/pages/PharmacistEducation.tsx)
- **Fitur Copy Link**: Tambahkan tombol salin (ikon *content_copy*) di samping tombol "Hapus" pada *card* daftar materi edukasi. Tombol ini akan menjalankan `navigator.clipboard.writeText()` dan memunculkan *toast* pemberitahuan "Tautan disalin!".
- **Modal Upload Kepotong**: Pada modal (baris ~277), ubah pembungkus (`div.bg-white`) agar memiliki batasan tinggi layar: `max-h-[90vh] flex flex-col`.
- Berikan properti `overflow-y-auto` pada bagian `div` isi modal (`p-12`), dan perkecil padding pada *mobile* menjadi `p-6 sm:p-12` agar ruang lebih efisien.

### 4. Perbaikan Tambahan Major Card
- Desain *card* dipadatkan (compact) menyesuaikan estetika minor card agar menghilangkan ruang kosong (void space) yang berlebih.
- Menghapus border merah di sebelah kiri dan mengubah warna tombol "Tinjau Detail" menjadi warna *tertiary* (merah) agar lebih seragam dengan status eskalasinya tanpa menimbulkan kontradiksi visual.

### 5. Perbaikan Lanjutan Dropdown Notifikasi
- Mengubah posisi dari yang tadinya `absolute` mengandalkan posisi ikon, menjadi `fixed` (`fixed top-[70px] inset-x-4`) khusus pada layar *mobile*. Hal ini memastikan *dropdown* terkunci di area aman layar (*viewport*) dan tidak *overflow* memotong batas kiri layar.

### 6. Penyembunyian Fitur Label "Siklus" (Hold)
- Atas permintaan klien, fitur yang menampilkan "Siklus X / 8" sementara waktu **disembunyikan (hide)** dari aplikasi sampai alurnya dipastikan kembali.
- Hal ini mencakup penghapusan/penyembunyian kolom dan badge Siklus pada file `PharmacistPatients.tsx`, `PharmacistDashboard.tsx`, `MajorCard.tsx`, dan `PatientHeaderCard.tsx`.

### 7. Perbaikan Tombol "Eskalasi ke Dokter Onkologi"
- **[MODIFY] EscalationActionPanel.tsx:** Merapikan posisi, padding horizontal, dan ukuran teks agar label saat terpotong menjadi dua baris (*wrap*) tetap rata tengah dan tidak mendorong ikon *alert* keluar kotak.
- Ikon segitiga *alert* diperbesar ukurannya dan dibungkus di dalam kotak transparan (*translucent shadow box*) agar lebih solid.

### 8. Peningkatan Fitur Edit Manajemen Edukasi
- **[MODIFY] PharmacistEducation.tsx:** Menghapus tombol "STATISTIK" yang belum berfungsi pada Materi Unggulan, dan mengubah tombol "EDIT KONTEN" agar dapat memunculkan form Upload Materi yang sudah terisi otomatis (auto-populate) untuk menyimpan perubahan (*Update Data*).
- Menambahkan ikon **Edit** (Pensil) pada setiap *card* materi reguler agar semua kartu mendukung skema CRUD yang sama.
- Memperbaiki isu *overlapping* layout pada bagian aksi *card* (footer) di mode desktop. Implementasi `flex-wrap` dan menghilangkan minimum *width* agar elemen teks dan tombol tidak bertumpuk ketika layar berada pada rasio tablet atau medium-desktop.
