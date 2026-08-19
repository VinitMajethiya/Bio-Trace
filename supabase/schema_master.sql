-- ========================================================
-- EcoQuest Master Database Schema (Stages 1 through 7)
-- Copy and paste this ENTIRE script into Supabase SQL Editor and click "Run"
-- ========================================================

-- 1. Enable PostGIS Extension for Geography & Spatial queries
CREATE EXTENSION IF NOT EXISTS postgis;

-- 2. Public Societies Table (Multi-society communities)
CREATE TABLE IF NOT EXISTS public.societies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  boundary TEXT,
  health_score NUMERIC DEFAULT 80,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Seed Demo Societies
INSERT INTO public.societies (id, name, boundary, health_score) VALUES
  ('11111111-1111-1111-1111-111111111111', 'SGU Campus Eco-Zone', 'Campus Center, Quad & Botanical Arboretum', 88),
  ('22222222-2222-2222-2222-222222222222', 'Silver Creek Green Heights', 'Residential Towers Block A-D & Community Gardens', 76),
  ('33333333-3333-3333-3333-333333333333', 'Meadowbrook Lake District', 'Lakeside Boardwalk & Wetland Conservation Park', 92)
ON CONFLICT (id) DO UPDATE
SET name = EXCLUDED.name,
    boundary = EXCLUDED.boundary,
    health_score = EXCLUDED.health_score;

-- 3. Public Users Table (Synced with auth.users)
CREATE TABLE IF NOT EXISTS public.users (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  display_name TEXT,
  clan_id UUID,
  trust_score NUMERIC DEFAULT 100,
  society_id UUID REFERENCES public.societies(id) ON DELETE SET NULL,
  moderator_of_society_id UUID REFERENCES public.societies(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Ensure columns exist if users table already existed
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS society_id UUID REFERENCES public.societies(id) ON DELETE SET NULL;
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS moderator_of_society_id UUID REFERENCES public.societies(id) ON DELETE SET NULL;

-- 4. Territories Table (Pilot zone & Ecosystem Health Score)
CREATE TABLE IF NOT EXISTS public.territories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  boundary GEOGRAPHY(POLYGON, 4326),
  health_score NUMERIC DEFAULT 50,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Ensure user columns exist for delivery collector integration & landing onboarding
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS role TEXT NOT NULL DEFAULT 'member';
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS is_available BOOLEAN DEFAULT false;
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS last_known_lat FLOAT;
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS last_known_lng FLOAT;
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS last_location_at TIMESTAMPTZ;
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS onboarding_completed BOOLEAN DEFAULT false;

-- 5. Species Observations Table (Wild module)
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
  taxon_group TEXT DEFAULT 'birds',
  created_at TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE public.species_observations ADD COLUMN IF NOT EXISTS taxon_group TEXT DEFAULT 'birds';

-- 6. Waste Transactions Table (Circular module)
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

-- 6b. Pickup Requests Table (Collector app integration)
CREATE TABLE IF NOT EXISTS public.pickup_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  collector_id UUID REFERENCES public.users(id) ON DELETE SET NULL,
  society_id UUID REFERENCES public.societies(id) ON DELETE SET NULL,
  pickup_lat FLOAT NOT NULL,
  pickup_lng FLOAT NOT NULL,
  pickup_address TEXT,
  total_weight_kg FLOAT,
  items JSONB,
  estimated_value_inr FLOAT,
  status TEXT NOT NULL DEFAULT 'pending',
  requested_at TIMESTAMPTZ DEFAULT NOW(),
  assigned_at TIMESTAMPTZ,
  collected_at TIMESTAMPTZ,
  verified_at TIMESTAMPTZ,
  actual_weight_kg FLOAT,
  actual_value_inr FLOAT,
  payout_status TEXT DEFAULT 'pending',
  mock_eta_seconds INT DEFAULT 120
);

-- 6c. Collector Profiles Table
CREATE TABLE IF NOT EXISTS public.collector_profiles (
  id UUID PRIMARY KEY REFERENCES public.users(id) ON DELETE CASCADE,
  vehicle_type TEXT DEFAULT 'auto',
  service_radius_km FLOAT DEFAULT 3.0,
  rating FLOAT DEFAULT 5.0,
  total_pickups INT DEFAULT 0,
  verified BOOLEAN DEFAULT false
);

-- 7. Missions Table
CREATE TABLE IF NOT EXISTS public.missions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  type TEXT NOT NULL,
  source TEXT DEFAULT 'fixed_template',
  completion_criteria JSONB,
  territory_id UUID REFERENCES public.territories(id) ON DELETE SET NULL
);

-- 8. Mission Progress Table
CREATE TABLE IF NOT EXISTS public.mission_progress (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
  mission_id UUID REFERENCES public.missions(id) ON DELETE CASCADE,
  status TEXT DEFAULT 'in_progress',
  completed_at TIMESTAMPTZ
);

-- 9. GreenPoints Ledger Table (Unified Wild XP & Circular currency)
CREATE TABLE IF NOT EXISTS public.greenpoints_ledger (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
  source TEXT NOT NULL,
  amount NUMERIC NOT NULL,
  zone_tier TEXT DEFAULT 'remote',
  related_observation_id UUID REFERENCES public.species_observations(id) ON DELETE SET NULL,
  related_transaction_id UUID REFERENCES public.waste_transactions(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE public.greenpoints_ledger ADD COLUMN IF NOT EXISTS zone_tier TEXT DEFAULT 'remote';

-- 10. Moderator Votes Table (Simple Election System)
CREATE TABLE IF NOT EXISTS public.moderator_votes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  voter_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  candidate_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  society_id UUID NOT NULL REFERENCES public.societies(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(voter_id, society_id)
);

-- 11. Moderator Candidates Table (Self-Nomination tracking per society)
CREATE TABLE IF NOT EXISTS public.moderator_candidates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  society_id UUID NOT NULL REFERENCES public.societies(id) ON DELETE CASCADE,
  display_name TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, society_id)
);

-- 12. Raids Table (Group Cleanup Events)
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

-- 13. Raid Participants Table
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

-- 12. Automatic User Profile Sync Function & Trigger
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

-- Sync existing auth users into public.users
INSERT INTO public.users (id, display_name)
SELECT id, COALESCE(raw_user_meta_data->>'display_name', split_part(email, '@', 1))
FROM auth.users
ON CONFLICT (id) DO NOTHING;

-- 13. Ecosystem Health Score Update Function (RPC)
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

-- 13b. Society Health Score Update Function (RPC)
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


-- 14. Seed Pilot Territory
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

-- 15. The Locker — Sessions, Items & Rate Table (Migration 06)
CREATE TABLE IF NOT EXISTS public.waste_category_rates (
  category TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  price_per_kg NUMERIC NOT NULL CHECK (price_per_kg >= 0),
  gp_per_kg NUMERIC NOT NULL CHECK (gp_per_kg >= 0),
  default_weight_kg NUMERIC NOT NULL CHECK (default_weight_kg > 0),
  icon TEXT NOT NULL,
  color TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS public.locker_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'active'
    CHECK (status IN ('active', 'scheduled', 'completed', 'cancelled')),
  total_weight_kg FLOAT NOT NULL DEFAULT 0,
  total_payout_inr FLOAT NOT NULL DEFAULT 0,
  total_gp INT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now(),
  closed_at TIMESTAMPTZ
);

CREATE TABLE IF NOT EXISTS public.locker_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID NOT NULL REFERENCES public.locker_sessions(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  category TEXT NOT NULL REFERENCES public.waste_category_rates(category),
  estimated_weight FLOAT NOT NULL CHECK (estimated_weight > 0),
  image_url TEXT,
  source TEXT NOT NULL DEFAULT 'ai' CHECK (source IN ('ai', 'manual')),
  confidence FLOAT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Pickup Requests: add locker_session_id link + scheduling columns
ALTER TABLE public.pickup_requests
  ADD COLUMN IF NOT EXISTS locker_session_id UUID REFERENCES public.locker_sessions(id) ON DELETE RESTRICT,
  ADD COLUMN IF NOT EXISTS scheduled_window TEXT,
  ADD COLUMN IF NOT EXISTS scheduled_time TIMESTAMPTZ;

-- 16. Disable RLS for Hackathon Development
ALTER TABLE public.users DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.societies DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.territories DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.species_observations DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.waste_transactions DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.missions DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.mission_progress DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.greenpoints_ledger DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.moderator_votes DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.moderator_candidates DISABLE ROW LEVEL SECURITY;

-- 16. Force PostgREST schema cache reload
NOTIFY pgrst, 'reload schema';
