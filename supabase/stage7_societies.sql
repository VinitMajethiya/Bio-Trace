-- ========================================================
-- EcoQuest Stage 7: Community / Society Infrastructure Schema
-- Copy and paste this block into the Supabase SQL Editor and click "Run"
-- ========================================================

-- 1. Societies Table (Multi-society communities)
CREATE TABLE IF NOT EXISTS public.societies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  boundary TEXT,
  health_score NUMERIC DEFAULT 80,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Seed 3 Demo Societies
INSERT INTO public.societies (id, name, boundary, health_score) VALUES
  ('11111111-1111-1111-1111-111111111111', 'SGU Campus Eco-Zone', 'Campus Center, Quad & Botanical Arboretum', 88),
  ('22222222-2222-2222-2222-222222222222', 'Silver Creek Green Heights', 'Residential Towers Block A-D & Community Gardens', 76),
  ('33333333-3333-3333-3333-333333333333', 'Meadowbrook Lake District', 'Lakeside Boardwalk & Wetland Conservation Park', 92)
ON CONFLICT (id) DO UPDATE
SET name = EXCLUDED.name,
    boundary = EXCLUDED.boundary,
    health_score = EXCLUDED.health_score;

-- 2. Extend Users Table with Society & Moderator References
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS society_id UUID REFERENCES public.societies(id) ON DELETE SET NULL;
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS moderator_of_society_id UUID REFERENCES public.societies(id) ON DELETE SET NULL;

-- 3. Moderator Votes Table (Simple Election System)
CREATE TABLE IF NOT EXISTS public.moderator_votes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  voter_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  candidate_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  society_id UUID NOT NULL REFERENCES public.societies(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(voter_id, society_id)
);

-- 4. Moderator Candidates Table (Self-Nomination tracking per society)
CREATE TABLE IF NOT EXISTS public.moderator_candidates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  society_id UUID NOT NULL REFERENCES public.societies(id) ON DELETE CASCADE,
  display_name TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, society_id)
);

-- Disable RLS for Hackathon Development
ALTER TABLE public.societies DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.moderator_votes DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.moderator_candidates DISABLE ROW LEVEL SECURITY;
