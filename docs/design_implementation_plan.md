# Design Implementation Plan: The Editorial Sanctuary (Pharmacist Workspace)

Rencana ini bertujuan untuk merekonstruksi antarmuka **Pharmacist Dashboard** agar sepenuhnya selaras dengan filosofi desain *"The Digital Sanctuary"* dari sistem **Sentuhan Nurani (Stitch MCP)**.

## 1. Prinsip Desain Utama

### 🟢 Aturan "Tanpa Garis" (No-Line Rule)
Sesuai pedoman Stitch, penggunaan `border` solid 1px dilarang keras. 
- **Implementasi:** Seluruh pemisah antar bagian (seperti antara Top Bar dan Main Content) akan menggunakan **Tonal Layering**. 
- **Taktik:** Meletakkan area konten di atas latar belakang `surface-container-low` (#f6f3f2) dengan kartu-kartu berwarna `surface` (#fcf9f8) atau `surface-container-lowest` (#ffffff).

### 🟢 Kelenturan Organik (XL Rounding)
Meningkatkan *corner-radius* dari standar aplikasi (8px-16px) menjadi skala `xl` (3rem/48px) untuk memberikan kesan lembut, tenang, dan premium.

### 🟢 Tipografi Editorial
Mengoptimalkan **Plus Jakarta Sans** untuk headline dengan:
- `letter-spacing: -0.02em`
- `line-height: 1.2`
- Ukuran yang kontras secara asimetris untuk memandu mata petugas medis dengan cepat.

---

## 2. Rencana Perubahan Detail

### [MODIFY] `src/features/reports/pages/PharmacistDashboard.tsx`
- **Header:** Menghapus `border-bottom`. Menggunakan `backdrop-filter: blur(24px)` dengan transparansi 80% untuk efek kaca (*glassmorphism*).
- **Layout:** Menggeser struktur menjadi sedikit asimetris (misal: kartu ringkasan di kiri atas dengan ruang kosong di sisi lain untuk menciptakan "ruang napas").
- **Spacing:** Menambah *vertical padding* antar elemen dari `24px` menjadi `32px - 48px` (Skala *Breath* & *Sanctuary*).

### [MODIFY] `src/features/reports/components/QueueItem.tsx` (Target Refactor)
- Mengekstrak baris antrean menjadi komponen mandiri.
- Menggunakan `box-shadow: 0 12px 32px rgba(27, 28, 28, 0.06)` (Ambient Shadow) alih-alih garis pembatas.

---

## 3. Skema Warna (Sentuhan Nurani Tokens)
| Token | Hex | Penggunaan |
| :--- | :--- | :--- |
| **Surface** | `#fcf9f8` | Latar belakang dasar komponen |
| **Surface Container Low** | `#f6f3f2` | Latar belakang halaman (Page background) |
| **Primary** | `#046b5e` | Brand Identity & Aksi Utama |
| **Tertiary Container** | `#ffe9ec` | Penanda laporan sentinel (Darurat) - Empati Rose |
| **On Surface Variant** | `#424848` | Teks sekunder/metadata |

---

## 4. Struktur Navigasi (Keputusan Final)
Sesuai arahan, kita menggunakan pola **Sidebar Column** berdasarkan desain *Stitch* (mengambil inspirasi ritme asimetris dari "Daftar Pantau Mobile" yang diadaptasi ke desktop).

**Langkah Implementasi Navigasi:**
- **[NEW] `src/features/reports/components/PharmacistLayout.tsx`**: Membuat layout dasar khusus tenaga medis yang memiliki *Sidebar Column* statis di sebelah kiri (menyimpan Avatar, Info Petugas, dan tombol Logout) dan *Main Content Area* di sebelah kanan. Layout ini akan menjadi pembungkus halaman-halaman `Pharmacist` lainnya.
- **[MODIFY] `src/features/reports/pages/PharmacistDashboard.tsx`**: Menghapus `header` *Top Bar* lama dan menggunakan `<PharmacistLayout>` sebagai wadah utamanya, menciptakan ruang asimetris di mana daftar Pasien menempati proporsi ruang yang lebih leluasa.

## 5. Rencana Verifikasi
- Melakukan audit visual terhadap kriteria: **"Apakah UI ini terasa seperti dashboard medis yang kaku, atau seperti jurnal kesehatan premium?"**
- Memastikan gradasi warna `#046b5e` ke `#acfeed` (135°) diaplikasikan pada tombol "Tindak Lanjuti".
