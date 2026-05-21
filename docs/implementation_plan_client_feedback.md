# Client Feedback Implementation Plan: Auth Revamp, Reporting Enhancements & QoL Survey

This implementation plan outlines the technical architecture and necessary code changes to incorporate the client feedback into the MESO application.

---

## 1. User Review Required

> [!IMPORTANT]
> **Auth Virtual Email Formatting:** We will transition authentication to use `${phone_number_or_id}@meso.id` under the hood. If an existing patient signed up with a real email, they will no longer be accessible via this new ID-based system without database migration of their existing accounts, OR we keep support for both. We propose forcing this standard for all new users moving forward.
> 
> **Fonnte Token Security:** The Edge Functions require the `FONNTE_TOKEN` and `SUPABASE_SERVICE_ROLE_KEY` (Supabase Admin Key) to be set in your Supabase environment secrets.

---

## 2. Open Questions

> [!CAUTION]
> 1. **Item Penambahan (Req 2):** Item spesifik apa saja yang ingin ditambahkan ke card MESO? (Saat ini sudah ada Mual, Muntah, Diare, Kelelahan, Nyeri, Sariawan, Kesemutan, Reaksi Kulit, Nafsu Makan, Demam, Sesak). Silakan sebutkan daftar barunya agar bisa langsung dimasukkan ke Master Schema.
> 2. **Daftar Pertanyaan QoL (Req 4):** Bagaimana daftar kuesioner Quality of Life (QoL) yang diinginkan? Apakah menggunakan standar baku EORTC QLQ-C30, EQ-5D, atau pertanyaan kustom dari Rumah Sakit?

---

## 3. Proposed Changes

### A. Revamp Auth: WhatsApp / Patient ID & Fonnte OTP Recovery

#### 🟢 [NEW] [20260513_setup_otp.sql](file:///d:/MESO-app/supabase/migrations/20260513_setup_otp.sql)
Database migration to store WhatsApp OTPs and to add a QoL activation flag to user profiles.
```sql
-- 1. Tambah status QoL di profiles agar Apoteker bisa mengaktifkan per pasien
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS is_qol_active BOOLEAN DEFAULT FALSE;

-- 2. Buat tabel penyimpanan OTP
CREATE TABLE IF NOT EXISTS public.password_reset_otps (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  phone_number TEXT NOT NULL,
  otp_code TEXT NOT NULL,
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  used BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

ALTER TABLE public.password_reset_otps ENABLE ROW LEVEL SECURITY;
-- Hanya Service Role (Backend Admin) yang bisa mengakses tabel ini
```

#### 🟢 [NEW] [request-reset-otp Edge Function](file:///d:/MESO-app/supabase/functions/request-reset-otp/index.ts)
Function to generate and send the OTP code via Fonnte.
- Verifies if the user with that WhatsApp number exists in `profiles`.
- Generates 6-digit numeric OTP.
- Inserts record into `password_reset_otps` with 5 min expiration.
- Calls Fonnte API `https://api.fonnte.com/send` to dispatch code.

#### 🟢 [NEW] [verify-and-reset-otp Edge Function](file:///d:/MESO-app/supabase/functions/verify-and-reset-otp/index.ts)
Function to validate OTP and securely reset password.
- Validates existence of active, non-expired, matching OTP.
- Marks OTP as `used = true`.
- Looks up matching profile user UUID.
- Performs admin-level update using `supabaseClient.auth.admin.updateUserById(userId, { password: new_password })`.

#### 🟡 [MODIFY] [LoginPage.tsx](file:///d:/MESO-app/src/features/auth/pages/LoginPage.tsx)
- Update UI to explicitly ask for "Nomor WhatsApp atau ID Pasien".
- In `handleSubmit`, format the string internally:
  ```typescript
  const formattedEmail = email.includes('@') ? email : `${email.trim().replace(/\s+/g, '')}@meso.id`
  await supabase.auth.signInWithPassword({ email: formattedEmail, password })
  ```

#### 🟡 [MODIFY] [RegisterPage.tsx](file:///d:/MESO-app/src/features/auth/pages/RegisterPage.tsx)
- Remove the visible Email Input field.
- Add explicit "ID Pasien (jika ada)" and "Nomor WhatsApp" inputs.
- In `handleSubmit`, construct internal virtual email: `${whatsAppNumber}@meso.id` and pass it to `signUp`.

#### 🟡 [MODIFY] [ForgotPasswordPage.tsx](file:///d:/MESO-app/src/features/auth/pages/ForgotPasswordPage.tsx)
- Revamp UI into a multi-step state machine:
  - **Step 1**: Input Phone Number.
  - **Step 2**: Input OTP Code + New Password.
- Connect directly to the two new Supabase Edge Functions instead of default email-recovery.

---

### B. Reporting Expansion & Customized Scale Labels

#### 🟡 [MODIFY] [symptoms.domain.ts](file:///d:/MESO-app/src/features/reports/constants/symptoms.domain.ts)
- Add new reporting items to the `REPORT_SCHEMA` array based on the client's list.

#### 🟡 [MODIFY] [symptoms.ui.ts](file:///d:/MESO-app/src/features/reports/constants/symptoms.ui.ts)
- Expand `SymptomUIDefinition` to include custom scale labels.
  ```typescript
  export interface SymptomUIDefinition {
    // ... existing fields
    scaleLabels?: string[] // e.g. ['Tidak Ada', 'Ringan (< 5x)', 'Sedang (5-10x)', 'Berat (> 10x)']
  }
  ```
- Populate specific `scaleLabels` for key cards (like 'vomiting').

#### 🟡 [MODIFY] [ScaleInputs.tsx](file:///d:/MESO-app/src/features/reports/components/ScaleInputs.tsx)
- Allow `EmoticonScale` to receive dynamic labels:
  ```typescript
  interface EmoticonScaleProps {
    value: number | null
    onChange: (val: number) => void
    customLabels?: string[]
  }
  ```
- Fallback to standard `['Tidak Ada', 'Ringan', 'Sedang', 'Berat']` if `customLabels` is undefined.

---

### C. The "Others (Lain-lain)" Custom Card

#### 🟡 [MODIFY] [ReportForm.tsx](file:///d:/MESO-app/src/features/reports/pages/ReportForm.tsx)
- At the bottom of the Symptoms section, inject a static card labeled **"Gejala Lain-lain"**.
- Form UI elements:
  - Text Input: *"Ada efek samping lain yang Ibu rasakan?"* (Updates `formData.otherSymptomName`).
  - EmoticonScale component (Updates `formData.otherSymptomGrade`).
- Because `symptoms` is saved as a `JSONB` field in postgres, these extra attributes will be stored automatically without schema modification.

---

### D. QoL Survey Activation & Reporting Tabs

#### 🟡 [MODIFY] [PharmacistPatientDetail.tsx](file:///d:/MESO-app/src/features/reports/pages/PharmacistPatientDetail.tsx)
- Add a "Status Survey QoL" panel or action button in the Admin view.
- Pharmacist can toggle `is_qol_active = true/false` for the patient profile to activate the accidental survey.

#### 🟡 [MODIFY] [ReportForm.tsx](file:///d:/MESO-app/src/features/reports/pages/ReportForm.tsx)
- **Step 1: Fetch active state:** In `useEffect`, fetch current patient's `is_qol_active` flag.
- **Step 2: Tab View Layout:**
  - If `is_qol_active === true`, display a tab bar at the top: `[ Gejala MESO ] [ Survey Kualitas Hidup (QoL) ]`.
  - If `false`, render the default view directly (hiding the QoL tab).
- **Step 3: State Capture:** Save QoL responses inside the existing `formData` under a sub-object or discrete fields (e.g. `qol_q1`, `qol_q2`) stored into the flexible `symptoms` JSONB object.

---

## 4. Verification Plan

### Automated Verification
- None. Will verify visually in the workspace.

### Manual Verification (Local Dev & Browser Testing)
1. **Auth Testing**: Attempt signup using Phone, check PostgreSQL via Supabase dashboard to ensure email is saved as `08xxxx@meso.id`.
2. **Verification of OTP Reset**: Request Reset -> Check table `password_reset_otps` to confirm OTP is created -> Invoke Verify -> Login with the newly set password.
3. **Emoticon Labels**: Verify "Muntah" card displays custom numerical scale descriptors below each emoji.
4. **Custom Symptom Card**: Type "Pusing" and select "Berat" in "Lain-lain". Save and check that the payload inside `symptom_reports.symptoms` captures `{"otherSymptomName": "Pusing", "otherSymptomGrade": 3}`.
5. **QoL Activation**: Toggle QoL status in Pharmacist view -> Relogin/refresh as patient -> Verify tabs appear on reporting form.
