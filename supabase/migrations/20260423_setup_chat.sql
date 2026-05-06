-- ============================================================
-- MESO App — Chat System Schema
-- ============================================================

-- Table for storing chat messages
CREATE TABLE IF NOT EXISTS public.chat_messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    sender_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    receiver_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    content TEXT NOT NULL,
    is_read BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable RLS
ALTER TABLE public.chat_messages ENABLE ROW LEVEL SECURITY;

-- Policy: Users can see messages where they are either sender or receiver
CREATE POLICY "Users can view their own messages" ON public.chat_messages
    FOR SELECT USING (
        auth.uid() = sender_id OR auth.uid() = receiver_id
    );

-- Policy: Users can insert messages where they are the sender
CREATE POLICY "Users can send messages" ON public.chat_messages
    FOR INSERT WITH CHECK (
        auth.uid() = sender_id
    );

-- Policy: Users can update messages they received (to mark as read)
CREATE POLICY "Users can update received messages" ON public.chat_messages
    FOR UPDATE USING (
        auth.uid() = receiver_id
    );

-- Grant access to authenticated users
GRANT ALL ON public.chat_messages TO authenticated;

-- Function to get the latest pharmacist ID (simplified for this demo)
-- In a real app, this would be based on an assigned pharmacist
CREATE OR REPLACE FUNCTION get_active_pharmacist_id()
RETURNS UUID AS $$
BEGIN
    RETURN (SELECT id FROM public.profiles WHERE role = 'pharmacist' LIMIT 1);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
