# Rencana Persiapan Migrasi API WhatsApp Business (Meta)

Saat ini sistem pengiriman WhatsApp mengandalkan pihak ketiga (Fonnte) melalui *edge function* `send-whatsapp`. Untuk mempersiapkan sistem agar mudah beralih ke WhatsApp Business API resmi (Meta) ketika sewaktu-waktu siap, kita perlu menerapkan **Adapter Pattern** secara sederhana pada sisi *Edge Function* serta layanan *frontend*.

## Proposed Changes

### Supabase Edge Functions

#### [MODIFY] supabase/functions/send-whatsapp/index.ts
- Me-refactor kode yang ada menjadi modular dengan pendekatan *provider*.
- Mengambil *environment variable* baru `WA_PROVIDER` (default ke `'fonnte'`).
- Memisahkan logika pengiriman pesan ke dalam dua fungsi terpisah:
  1. `sendViaFonnte(target, message, schedule, token)`: Logika eksisting yang menggunakan API Fonnte.
  2. `sendViaMeta(target, message, token, phoneId)`: Implementasi rangka (*stub*) lengkap untuk Meta Graph API. Endpoint menggunakan `https://graph.facebook.com/v17.0/{phoneId}/messages` dengan payload JSON standar Meta.
- Jika suatu saat ingin beralih, tim hanya perlu mengatur *Supabase Secrets*:
  - `WA_PROVIDER="meta"`
  - `META_WA_TOKEN="<token_meta>"`
  - `META_PHONE_ID="<id_nomor_meta>"`

### Frontend Service

#### [MODIFY] src/services/fonnte.service.ts
- Mengganti nama file ini tidak wajib karena masih digunakan secara ekstensif, namun kita dapat me-refactor *interface*-nya agar lebih agnostik.
- Kita akan mengubah sedikit strukturnya atau minimal memberi *comment* dan *naming* agar tidak lagi terkesan "hanya untuk fonnte" di level fungsinya, meskipun nama objeknya mungkin dipertahankan demi *backward compatibility*.

## Verification Plan
1. Mengubah kode `send-whatsapp`.
2. Mengeksekusi pemanggilan tes untuk memastikan fungsi Fonnte yang sekarang (default) masih bekerja secara normal tanpa *breaking change*.
