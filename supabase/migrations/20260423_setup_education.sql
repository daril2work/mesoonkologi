-- ============================================================
-- MESO App — Education System Schema
-- ============================================================

-- Table for storing education materials
CREATE TABLE IF NOT EXISTS public.education_materials (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT NOT NULL,
    description TEXT,
    content TEXT, -- Markdown content
    category TEXT NOT NULL, -- 'Nutrisi', 'Mental Health', 'Terapi', 'Aktivitas'
    image_url TEXT,
    is_featured BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable RLS
ALTER TABLE public.education_materials ENABLE ROW LEVEL SECURITY;

-- Policy: Everyone (authenticated) can read education materials
CREATE POLICY "Anyone can view education materials" ON public.education_materials
    FOR SELECT USING (true);

-- Policy: Only admins/pharmacists can insert/update/delete
CREATE POLICY "Only admins can manage education" ON public.education_materials
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE id = auth.uid() AND role IN ('admin', 'pharmacist')
        )
    );

-- Grant access
GRANT SELECT ON public.education_materials TO authenticated;

-- Insert real data from the "Sahabat Pejuang Mamae" mockup
INSERT INTO public.education_materials (title, description, category, image_url, is_featured)
VALUES 
('Pusat Edukasi & Perawatan Diri', 'Temukan panduan penuh kasih untuk menemani perjalanan kesembuhan Anda, dari nutrisi hingga ketenangan batin.', 'Semua Topik', 'https://images.unsplash.com/photo-1633332755192-727a05c4013d?auto=format&fit=crop&w=800&q=80', true),
('Resep Sup Sehat untuk Pemulihan Kemo', 'Nutrisi cair yang lembut dan kaya protein untuk membantu menjaga energi tubuh selama masa pemulihan.', 'Nutrisi', 'https://images.unsplash.com/photo-1547592166-23ac45744acd?auto=format&fit=crop&w=800&q=80', false),
('Menjaga Kelembapan Kulit saat Terapi', 'Langkah sederhana untuk mengatasi kulit kering dan sensitif dengan bahan-bahan alami yang aman.', 'Perawatan Kulit', 'https://images.unsplash.com/photo-1556228578-0d85b1a4d571?auto=format&fit=crop&w=800&q=80', false),
('5 Menit Meditasi Napas', 'Teknik pernapasan sederhana untuk menenangkan sistem saraf di tengah kesibukan.', 'Psikologi', 'https://images.unsplash.com/photo-1518310383802-640c2de311b2?auto=format&fit=crop&w=800&q=80', false),
('Rutinitas Tidur yang Berkualitas', 'Cara mengatur lingkungan kamar agar istirahat Anda lebih optimal dan restoratif.', 'Psikologi', 'https://images.unsplash.com/photo-1541781774459-bb2af2f05b55?auto=format&fit=crop&w=800&q=80', false);
