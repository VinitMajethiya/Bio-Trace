-- ========================================================
-- EcoQuest Stage 10 Checkpoint A: Clean Raids & Raid Participants Schema
-- Copy and paste this block into the Supabase SQL Editor and click "Run"
-- ========================================================

-- 1. Raids Table (Group Cleanup Events)
CREATE TABLE IF NOT EXISTS public.raids (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  society_id UUID NOT NULL REFERENCES public.societies(id) ON DELETE CASCADE,
  created_by UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  lat NUMERIC NOT NULL,
  lng NUMERIC NOT NULL,
  scheduled_at TIMESTAMPTZ DEFAULT NOW(),
  status TEXT DEFAULT 'active', -- active / completed / cancelled
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Raid Participants Table
CREATE TABLE IF NOT EXISTS public.raid_participants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  raid_id UUID NOT NULL REFERENCES public.raids(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  before_photo_url TEXT,
  after_photo_url TEXT,
  status TEXT DEFAULT 'joined', -- joined / submitted / approved / rejected
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(raid_id, user_id)
);

-- 3. Ecosystem Health Score Update Function for Societies (RPC)
CREATE OR REPLACE FUNCTION public.increment_society_health_score(s_id UUID, delta NUMERIC)
RETURNS NUMERIC AS $$
DECLARE
  new_score NUMERIC;
BEGIN
  UPDATE public.societies
  SET health_score = GREATEST(0, LEAST(100, health_score + delta))
  WHERE id = s_id
  RETURNING health_score INTO new_score;
  RETURN new_score;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Disable RLS for Hackathon Development Mode
ALTER TABLE public.raids DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.raid_participants DISABLE ROW LEVEL SECURITY;

-- Reload PostgREST schema cache
NOTIFY pgrst, 'reload schema';

