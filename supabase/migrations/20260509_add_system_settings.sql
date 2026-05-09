-- ============================================================
-- SQL Migration: Create system_settings table for dynamic WA
-- ============================================================

CREATE TABLE IF NOT EXISTS system_settings (
    key TEXT PRIMARY KEY,
    value TEXT NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Seed initial row values for Pharmacist & Doctor In-Charge and Fonnte Token
INSERT INTO system_settings (key, value) VALUES 
('pharmacist_wa', ''),
('doctor_wa', ''),
('fonnte_token', '')
ON CONFLICT (key) DO NOTHING;

-- Enable Row Level Security
ALTER TABLE system_settings ENABLE ROW LEVEL SECURITY;

-- Allow all authenticated users (patients, pharmacists, doctors, admins) to select/read settings
CREATE POLICY "Allow read access for authenticated users" ON system_settings
    FOR SELECT USING (auth.role() = 'authenticated');

-- Allow pharmacists and admins to perform all CRUD operations on settings
CREATE POLICY "Allow all access for pharmacists and admins" ON system_settings
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM profiles
            WHERE id = auth.uid() AND (role = 'pharmacist' OR role = 'admin')
        )
    );
