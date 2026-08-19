-- Migration 03: Pickup Requests, Collector Profiles & Realtime Setup

-- 1. Societies Table (Created first to satisfy FK references in pickup_requests)
CREATE TABLE IF NOT EXISTS public.societies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  city TEXT NOT NULL DEFAULT 'Pune',
  health_score NUMERIC DEFAULT 50,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 2. Extend Users Table with Collector Role & Geo fields
ALTER TABLE public.users
  ADD COLUMN IF NOT EXISTS role TEXT NOT NULL DEFAULT 'member',
  ADD COLUMN IF NOT EXISTS is_available BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS last_known_lat FLOAT,
  ADD COLUMN IF NOT EXISTS last_known_lng FLOAT,
  ADD COLUMN IF NOT EXISTS last_location_at TIMESTAMPTZ;

-- 3. Pickup Requests Table
CREATE TABLE IF NOT EXISTS public.pickup_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.users(id),
  collector_id UUID REFERENCES public.users(id),
  society_id UUID REFERENCES public.societies(id),

  -- Location
  pickup_lat FLOAT NOT NULL,
  pickup_lng FLOAT NOT NULL,
  pickup_address TEXT,

  -- Waste Details
  total_weight_kg FLOAT,
  items JSONB,
  estimated_value_inr FLOAT,

  -- Status Machine ('pending' -> 'assigned' -> 'in_transit' -> 'collected' -> 'verified' | 'cancelled')
  status TEXT NOT NULL DEFAULT 'pending',

  -- Timing
  requested_at TIMESTAMPTZ DEFAULT now(),
  assigned_at TIMESTAMPTZ,
  collected_at TIMESTAMPTZ,
  verified_at TIMESTAMPTZ,

  -- Payout
  actual_weight_kg FLOAT,
  actual_value_inr FLOAT,
  payout_status TEXT DEFAULT 'pending',

  -- Demo Mock ETA
  mock_eta_seconds INT DEFAULT 120
);

-- Enable full WAL replica identity for Supabase Realtime update payloads
ALTER TABLE public.pickup_requests REPLICA IDENTITY FULL;

-- 4. Collector Profiles Table
CREATE TABLE IF NOT EXISTS public.collector_profiles (
  id UUID PRIMARY KEY REFERENCES public.users(id),
  vehicle_type TEXT,
  service_radius_km FLOAT DEFAULT 3.0,
  rating FLOAT DEFAULT 5.0,
  total_pickups INT DEFAULT 0,
  verified BOOLEAN DEFAULT false
);

-- 5. Row Level Security Policies
ALTER TABLE public.pickup_requests ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "users_own_pickups" ON public.pickup_requests;
CREATE POLICY "users_own_pickups" ON public.pickup_requests
  FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "users_insert_own_pickups" ON public.pickup_requests;
CREATE POLICY "users_insert_own_pickups" ON public.pickup_requests
  FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "collectors_see_pending" ON public.pickup_requests;
CREATE POLICY "collectors_see_pending" ON public.pickup_requests
  FOR SELECT USING (
    (SELECT role FROM public.users WHERE id = auth.uid()) = 'collector'
    AND (status = 'pending' OR collector_id = auth.uid())
  );

DROP POLICY IF EXISTS "collector_update_own" ON public.pickup_requests;
CREATE POLICY "collector_update_own" ON public.pickup_requests
  FOR UPDATE USING (collector_id = auth.uid());

-- 6. Add pickup_requests to Supabase Realtime Publication
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_publication WHERE pubname = 'supabase_realtime'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.pickup_requests;
  END IF;
EXCEPTION
  WHEN duplicate_object THEN
    NULL;
END $$;
