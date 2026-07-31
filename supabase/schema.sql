-- ========================================================
-- EcoQuest Complete Supabase Database Schema (Stage 1 & 2)
-- Copy and paste this ENTIRE block into the Supabase SQL Editor and click "Run"
-- ========================================================

-- 1. Enable PostGIS Extension for Geography & Spatial queries
CREATE EXTENSION IF NOT EXISTS postgis;

-- 2. Public Users table (synced with auth.users)
CREATE TABLE IF NOT EXISTS public.users (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  display_name TEXT,
  clan_id UUID,
  trust_score NUMERIC DEFAULT 100,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Territories table (pilot zone & Ecosystem Health Score)
CREATE TABLE IF NOT EXISTS public.territories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  boundary GEOGRAPHY(POLYGON, 4326),
  health_score NUMERIC DEFAULT 50,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. Species Observations table (Wild module)
CREATE TABLE IF NOT EXISTS public.species_observations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
  territory_id UUID REFERENCES public.territories(id) ON DELETE CASCADE,
  photo_url TEXT,
  species_label TEXT NOT NULL,
  confidence NUMERIC,
  rarity_tier TEXT DEFAULT 'Common',
  verification_tier INT DEFAULT 0,
  gps_lat NUMERIC,
  gps_lng NUMERIC,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. Waste Transactions table (Circular module)
CREATE TABLE IF NOT EXISTS public.waste_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
  territory_id UUID REFERENCES public.territories(id) ON DELETE CASCADE,
  category TEXT NOT NULL,
  photo_url TEXT,
  ai_confidence NUMERIC,
  weight_estimate NUMERIC,
  payout_amount NUMERIC,
  verification_tier INT DEFAULT 0,
  status TEXT DEFAULT 'logged',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 6. Missions table
CREATE TABLE IF NOT EXISTS public.missions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  type TEXT NOT NULL, -- daily / weekly / legendary
  source TEXT DEFAULT 'fixed_template',
  completion_criteria JSONB,
  territory_id UUID REFERENCES public.territories(id) ON DELETE SET NULL
);

-- 7. Mission Progress table
CREATE TABLE IF NOT EXISTS public.mission_progress (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
  mission_id UUID REFERENCES public.missions(id) ON DELETE CASCADE,
  status TEXT DEFAULT 'in_progress', -- in_progress / complete
  completed_at TIMESTAMPTZ
);

-- 8. GreenPoints Ledger table (unified Wild XP & Circular currency)
CREATE TABLE IF NOT EXISTS public.greenpoints_ledger (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
  source TEXT NOT NULL, -- wild_xp / circular_payout
  amount NUMERIC NOT NULL,
  related_observation_id UUID REFERENCES public.species_observations(id) ON DELETE SET NULL,
  related_transaction_id UUID REFERENCES public.waste_transactions(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 9. Automatic User Profile Sync Function & Trigger
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.users (id, display_name)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'display_name', split_part(NEW.email, '@', 1))
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 10. Ecosystem Health Score Update Function (RPC)
CREATE OR REPLACE FUNCTION public.increment_health_score(t_id UUID, delta NUMERIC)
RETURNS NUMERIC AS $$
DECLARE
  new_score NUMERIC;
BEGIN
  UPDATE public.territories
  SET health_score = GREATEST(0, LEAST(100, health_score + delta)),
      updated_at = NOW()
  WHERE id = t_id
  RETURNING health_score INTO new_score;
  RETURN new_score;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 11. Seed Pilot Territory (Sanjay Ghodawat University Campus)
INSERT INTO public.territories (id, name, health_score, boundary)
VALUES (
  '00000000-0000-0000-0000-000000000001',
  'SGU Campus Pilot Zone',
  50,
  ST_GeomFromText('POLYGON((74.4600 16.7400, 74.4750 16.7400, 74.4750 16.7550, 74.4600 16.7550, 74.4600 16.7400))', 4326)
)
ON CONFLICT (id) DO UPDATE 
SET name = EXCLUDED.name,
    health_score = EXCLUDED.health_score,
    boundary = EXCLUDED.boundary;

-- 12. Enable Supabase Realtime Replication on territories table
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables 
    WHERE pubname = 'supabase_realtime' AND tablename = 'territories'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.territories;
  END IF;
END $$;

-- 13. Disable RLS for Hackathon Development (Allows direct client queries)
ALTER TABLE public.users DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.territories DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.species_observations DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.waste_transactions DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.missions DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.mission_progress DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.greenpoints_ledger DISABLE ROW LEVEL SECURITY;
