-- ============================================================
-- Migration 06: The Locker — Sessions, Items, Triggers, RPCs, RLS, Storage
-- Completely self-contained: ensures all prerequisite tables exist
-- ============================================================

-- ============================================================
-- 0. Prerequisites & Base Extensions
-- ============================================================

-- Societies
CREATE TABLE IF NOT EXISTS public.societies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  city TEXT NOT NULL DEFAULT 'Pune',
  health_score NUMERIC DEFAULT 50,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Users extension
ALTER TABLE public.users
  ADD COLUMN IF NOT EXISTS role TEXT NOT NULL DEFAULT 'member',
  ADD COLUMN IF NOT EXISTS is_available BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS last_known_lat FLOAT,
  ADD COLUMN IF NOT EXISTS last_known_lng FLOAT,
  ADD COLUMN IF NOT EXISTS last_location_at TIMESTAMPTZ;

-- Collector Profiles
CREATE TABLE IF NOT EXISTS public.collector_profiles (
  id UUID PRIMARY KEY REFERENCES public.users(id),
  vehicle_type TEXT,
  service_radius_km FLOAT DEFAULT 3.0,
  rating FLOAT DEFAULT 5.0,
  total_pickups INT DEFAULT 0,
  verified BOOLEAN DEFAULT false
);


-- ============================================================
-- 1. Authoritative Rate Table
-- ============================================================
CREATE TABLE IF NOT EXISTS public.waste_category_rates (
  category TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  price_per_kg NUMERIC NOT NULL CHECK (price_per_kg >= 0),
  gp_per_kg NUMERIC NOT NULL CHECK (gp_per_kg >= 0),
  default_weight_kg NUMERIC NOT NULL CHECK (default_weight_kg > 0),
  icon TEXT NOT NULL,
  color TEXT NOT NULL
);

INSERT INTO public.waste_category_rates (category, name, price_per_kg, gp_per_kg, default_weight_kg, icon, color) VALUES
  ('paper',     'Paper',     12, 15, 0.10, 'document-text', '#F59E0B'),
  ('plastic',   'Plastic',   25, 25, 0.05, 'beaker',        '#3B82F6'),
  ('metal',     'Metal',     40, 40, 0.20, 'hardware-chip', '#10B981'),
  ('glass',     'Glass',      8, 10, 0.30, 'wine',          '#8B5CF6'),
  ('ewaste',    'E-Waste',   75, 80, 0.50, 'laptop',        '#EC4899'),
  ('textiles',  'Textiles',  18, 20, 0.30, 'shirt',         '#14B8A6'),
  ('organic',   'Organic',    5, 10, 0.20, 'leaf',          '#84CC16')
ON CONFLICT (category) DO UPDATE
SET price_per_kg = EXCLUDED.price_per_kg,
    gp_per_kg = EXCLUDED.gp_per_kg,
    default_weight_kg = EXCLUDED.default_weight_kg,
    name = EXCLUDED.name,
    icon = EXCLUDED.icon,
    color = EXCLUDED.color;


-- ============================================================
-- 2. Locker Sessions
-- ============================================================
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


-- ============================================================
-- 3. Locker Items
-- ============================================================
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


-- ============================================================
-- 4. Pickup Requests Table (Created if not exists, then altered)
-- ============================================================
CREATE TABLE IF NOT EXISTS public.pickup_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.users(id),
  collector_id UUID REFERENCES public.users(id),
  society_id UUID REFERENCES public.societies(id),
  locker_session_id UUID REFERENCES public.locker_sessions(id) ON DELETE RESTRICT,

  -- Location (nullable for society geocode / address fallback)
  pickup_lat FLOAT,
  pickup_lng FLOAT,
  pickup_address TEXT,

  -- Waste Details
  total_weight_kg FLOAT,
  items JSONB,
  estimated_value_inr FLOAT,

  -- Status Machine
  status TEXT NOT NULL DEFAULT 'pending',

  -- Timing & Scheduling
  scheduled_window TEXT,
  scheduled_time TIMESTAMPTZ,
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

-- Ensure columns exist if table was already created in prior migration
ALTER TABLE public.pickup_requests
  ADD COLUMN IF NOT EXISTS locker_session_id UUID REFERENCES public.locker_sessions(id) ON DELETE RESTRICT,
  ADD COLUMN IF NOT EXISTS scheduled_window TEXT,
  ADD COLUMN IF NOT EXISTS scheduled_time TIMESTAMPTZ;

-- Clean up any legacy rows without locker session
DELETE FROM public.pickup_requests WHERE locker_session_id IS NULL;

-- Enforce NOT NULL on locker_session_id
ALTER TABLE public.pickup_requests ALTER COLUMN locker_session_id SET NOT NULL;

-- Relax lat/lng to nullable if previously NOT NULL
DO $$ BEGIN
  ALTER TABLE public.pickup_requests ALTER COLUMN pickup_lat DROP NOT NULL;
EXCEPTION WHEN others THEN NULL;
END $$;
DO $$ BEGIN
  ALTER TABLE public.pickup_requests ALTER COLUMN pickup_lng DROP NOT NULL;
EXCEPTION WHEN others THEN NULL;
END $$;

-- Status domain: drop any existing check constraints on status, then add strict domain
DO $$
DECLARE
  cname TEXT;
BEGIN
  FOR cname IN
    SELECT con.conname FROM pg_constraint con
    JOIN pg_class rel ON rel.oid = con.conrelid
    JOIN pg_namespace nsp ON nsp.oid = rel.relnamespace
    WHERE rel.relname = 'pickup_requests'
      AND nsp.nspname = 'public'
      AND con.contype = 'c'
      AND pg_get_constraintdef(con.oid) LIKE '%status%'
  LOOP
    EXECUTE format('ALTER TABLE public.pickup_requests DROP CONSTRAINT %I', cname);
  END LOOP;
END $$;

ALTER TABLE public.pickup_requests ADD CONSTRAINT pickup_requests_status_domain
  CHECK (status IN ('pending', 'assigned', 'in_transit', 'collected', 'verified', 'cancelled'));

-- Idempotency: one non-cancelled pickup per locker session
CREATE UNIQUE INDEX IF NOT EXISTS idx_unique_active_pickup_per_session
  ON public.pickup_requests (locker_session_id)
  WHERE status NOT IN ('cancelled');

-- Realtime
ALTER TABLE public.pickup_requests REPLICA IDENTITY FULL;
DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM pg_publication WHERE pubname = 'supabase_realtime') THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.pickup_requests;
  END IF;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;


-- ============================================================
-- 5. TRIGGER: Recalculate Session Totals (SECURITY DEFINER)
-- Fires on INSERT/UPDATE/DELETE of locker_items.
-- ============================================================
CREATE OR REPLACE FUNCTION public.fn_recalc_locker_session_totals()
RETURNS TRIGGER
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
DECLARE
  sid UUID;
BEGIN
  sid := COALESCE(NEW.session_id, OLD.session_id);

  -- Guard: skip if session row was already cascade-deleted
  IF NOT EXISTS (SELECT 1 FROM public.locker_sessions WHERE id = sid) THEN
    RETURN NULL;
  END IF;

  UPDATE public.locker_sessions SET
    total_weight_kg = COALESCE((
      SELECT SUM(li.estimated_weight)
      FROM public.locker_items li
      WHERE li.session_id = sid
    ), 0),
    total_payout_inr = COALESCE((
      SELECT SUM(li.estimated_weight * r.price_per_kg)
      FROM public.locker_items li
      JOIN public.waste_category_rates r ON li.category = r.category
      WHERE li.session_id = sid
    ), 0),
    total_gp = COALESCE((
      SELECT ROUND(SUM(li.estimated_weight * r.gp_per_kg))
      FROM public.locker_items li
      JOIN public.waste_category_rates r ON li.category = r.category
      WHERE li.session_id = sid
    ), 0)
  WHERE id = sid;

  RETURN NULL;
END;
$$;

DROP TRIGGER IF EXISTS trg_recalc_locker_session_totals ON public.locker_items;
CREATE TRIGGER trg_recalc_locker_session_totals
AFTER INSERT OR UPDATE OR DELETE ON public.locker_items
FOR EACH ROW EXECUTE FUNCTION public.fn_recalc_locker_session_totals();


-- ============================================================
-- 6. TRIGGER: Enforce 2kg Minimum + Stamp Items + Lock Session (SECURITY DEFINER)
-- ============================================================
CREATE OR REPLACE FUNCTION public.fn_enforce_min_pickup_weight()
RETURNS TRIGGER
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
DECLARE
  sess_weight FLOAT;
  sess_status TEXT;
  sess_payout FLOAT;
  sess_items JSONB;
BEGIN
  -- Row lock for concurrency safety
  SELECT total_weight_kg, status, total_payout_inr
  INTO sess_weight, sess_status, sess_payout
  FROM public.locker_sessions
  WHERE id = NEW.locker_session_id
  FOR UPDATE;

  IF sess_status IS NULL THEN
    RAISE EXCEPTION 'Locker session % not found', NEW.locker_session_id;
  END IF;

  IF sess_status != 'active' THEN
    RAISE EXCEPTION 'Cannot schedule pickup: session status is "%" (must be "active")', sess_status;
  END IF;

  IF sess_weight < 2.0 THEN
    RAISE EXCEPTION 'Minimum 2.0 kg required for pickup (session has % kg)', sess_weight;
  END IF;

  -- Derive items snapshot server-side
  SELECT COALESCE(jsonb_agg(jsonb_build_object(
    'category', li.category,
    'category_name', r.name,
    'estimated_weight', li.estimated_weight,
    'source', li.source,
    'image_url', li.image_url
  )), '[]'::jsonb)
  INTO sess_items
  FROM public.locker_items li
  JOIN public.waste_category_rates r ON li.category = r.category
  WHERE li.session_id = NEW.locker_session_id;

  -- Stamp authoritative values
  NEW.total_weight_kg := sess_weight;
  NEW.estimated_value_inr := sess_payout;
  NEW.items := sess_items;

  -- Lock session
  UPDATE public.locker_sessions
  SET status = 'scheduled'
  WHERE id = NEW.locker_session_id;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_enforce_min_pickup_weight ON public.pickup_requests;
CREATE TRIGGER trg_enforce_min_pickup_weight
BEFORE INSERT ON public.pickup_requests
FOR EACH ROW EXECUTE FUNCTION public.fn_enforce_min_pickup_weight();


-- ============================================================
-- 7. TRIGGER: Bidirectional Status Sync (SECURITY DEFINER)
-- ============================================================
CREATE OR REPLACE FUNCTION public.fn_sync_pickup_to_locker_session()
RETURNS TRIGGER
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
BEGIN
  IF OLD.status IS DISTINCT FROM NEW.status THEN
    IF NEW.status IN ('collected', 'verified') THEN
      UPDATE public.locker_sessions
      SET status = 'completed', closed_at = NOW()
      WHERE id = NEW.locker_session_id;
    ELSIF NEW.status = 'cancelled' THEN
      UPDATE public.locker_sessions
      SET status = 'active', closed_at = NULL
      WHERE id = NEW.locker_session_id;
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_sync_pickup_to_locker_session ON public.pickup_requests;
CREATE TRIGGER trg_sync_pickup_to_locker_session
AFTER UPDATE OF status ON public.pickup_requests
FOR EACH ROW EXECUTE FUNCTION public.fn_sync_pickup_to_locker_session();


-- ============================================================
-- 8. RPC: claim_pickup — Collector claims a pending request
-- ============================================================
CREATE OR REPLACE FUNCTION public.claim_pickup(p_id UUID)
RETURNS void
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
DECLARE
  caller_role TEXT;
  cur_status TEXT;
BEGIN
  SELECT role INTO caller_role FROM public.users WHERE id = auth.uid();
  IF caller_role != 'collector' THEN
    RAISE EXCEPTION 'Only collectors can claim pickups';
  END IF;

  SELECT status INTO cur_status
  FROM public.pickup_requests WHERE id = p_id FOR UPDATE;

  IF cur_status IS NULL THEN
    RAISE EXCEPTION 'Pickup % not found', p_id;
  END IF;
  IF cur_status != 'pending' THEN
    RAISE EXCEPTION 'Pickup is already "%" — cannot claim', cur_status;
  END IF;

  UPDATE public.pickup_requests
  SET status = 'assigned', collector_id = auth.uid(), assigned_at = NOW()
  WHERE id = p_id;
END;
$$;


-- ============================================================
-- 9. RPC: update_pickup_status — Collector advances status
-- ============================================================
CREATE OR REPLACE FUNCTION public.update_pickup_status(p_id UUID, p_status TEXT)
RETURNS void
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
DECLARE
  caller_role TEXT;
  cur_collector UUID;
  cur_status TEXT;
  valid BOOLEAN := FALSE;
  transitions TEXT[][] := ARRAY[
    ARRAY['assigned',   'in_transit'],
    ARRAY['in_transit', 'collected'],
    ARRAY['collected',  'verified'],
    ARRAY['assigned',   'cancelled']
  ];
BEGIN
  SELECT role INTO caller_role FROM public.users WHERE id = auth.uid();
  IF caller_role != 'collector' THEN
    RAISE EXCEPTION 'Only collectors can update pickup status';
  END IF;

  SELECT status, collector_id INTO cur_status, cur_collector
  FROM public.pickup_requests WHERE id = p_id FOR UPDATE;

  IF cur_status IS NULL THEN
    RAISE EXCEPTION 'Pickup % not found', p_id;
  END IF;

  IF cur_collector IS DISTINCT FROM auth.uid() THEN
    RAISE EXCEPTION 'This pickup is not assigned to you';
  END IF;

  FOR i IN 1..array_length(transitions, 1) LOOP
    IF transitions[i][1] = cur_status AND transitions[i][2] = p_status THEN
      valid := TRUE;
      EXIT;
    END IF;
  END LOOP;

  IF NOT valid THEN
    RAISE EXCEPTION 'Invalid status transition: % → %', cur_status, p_status;
  END IF;

  UPDATE public.pickup_requests
  SET status = p_status,
      collected_at = CASE WHEN p_status = 'collected' THEN NOW() ELSE collected_at END,
      verified_at  = CASE WHEN p_status = 'verified'  THEN NOW() ELSE verified_at END
  WHERE id = p_id;
END;
$$;


-- ============================================================
-- 10. RPC: cancel_own_pickup — User cancels their own pickup
-- ============================================================
CREATE OR REPLACE FUNCTION public.cancel_own_pickup(p_id UUID)
RETURNS void
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
DECLARE
  cur_user UUID;
  cur_status TEXT;
BEGIN
  SELECT user_id, status INTO cur_user, cur_status
  FROM public.pickup_requests WHERE id = p_id FOR UPDATE;

  IF cur_user IS NULL THEN
    RAISE EXCEPTION 'Pickup % not found', p_id;
  END IF;
  IF cur_user != auth.uid() THEN
    RAISE EXCEPTION 'You can only cancel your own pickups';
  END IF;
  IF cur_status NOT IN ('pending', 'assigned') THEN
    RAISE EXCEPTION 'Cannot cancel pickup with status "%"', cur_status;
  END IF;

  UPDATE public.pickup_requests SET status = 'cancelled' WHERE id = p_id;
END;
$$;


-- ============================================================
-- 11. RPC: get_pickup_item_paths — Collector retrieves photo storage paths
-- ============================================================
CREATE OR REPLACE FUNCTION public.get_pickup_item_paths(p_id UUID)
RETURNS TABLE(item_category TEXT, item_weight FLOAT, image_path TEXT)
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
DECLARE
  caller_role TEXT;
  cur_collector UUID;
  sess_id UUID;
BEGIN
  SELECT role INTO caller_role FROM public.users WHERE id = auth.uid();
  IF caller_role != 'collector' THEN
    RAISE EXCEPTION 'Only collectors can access pickup item data';
  END IF;

  SELECT collector_id, locker_session_id INTO cur_collector, sess_id
  FROM public.pickup_requests WHERE id = p_id;

  IF cur_collector IS DISTINCT FROM auth.uid() THEN
    RAISE EXCEPTION 'This pickup is not assigned to you';
  END IF;

  RETURN QUERY
  SELECT
    li.category,
    li.estimated_weight::FLOAT,
    li.image_url
  FROM public.locker_items li
  WHERE li.session_id = sess_id;
END;
$$;


-- ============================================================
-- 12. Row-Level Security Policies
-- ============================================================
ALTER TABLE public.waste_category_rates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.locker_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.locker_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pickup_requests ENABLE ROW LEVEL SECURITY;

-- Rates: public read
DROP POLICY IF EXISTS "rates_read" ON public.waste_category_rates;
CREATE POLICY "rates_read" ON public.waste_category_rates
  FOR SELECT USING (true);

-- Sessions: user-scoped
DROP POLICY IF EXISTS "user_sessions" ON public.locker_sessions;
CREATE POLICY "user_sessions" ON public.locker_sessions
  FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- Items: user-scoped
DROP POLICY IF EXISTS "user_items" ON public.locker_items;
CREATE POLICY "user_items" ON public.locker_items
  FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- Pickup Requests: user SELECT/INSERT own rows
DROP POLICY IF EXISTS "users_own_pickups" ON public.pickup_requests;
DROP POLICY IF EXISTS "users_insert_own_pickups" ON public.pickup_requests;
DROP POLICY IF EXISTS "collectors_see_pending" ON public.pickup_requests;
DROP POLICY IF EXISTS "collector_update_own" ON public.pickup_requests;
DROP POLICY IF EXISTS "user_select_pickups" ON public.pickup_requests;
DROP POLICY IF EXISTS "user_insert_pickups" ON public.pickup_requests;
DROP POLICY IF EXISTS "collector_select_pickups" ON public.pickup_requests;

CREATE POLICY "user_select_pickups" ON public.pickup_requests
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "user_insert_pickups" ON public.pickup_requests
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Collector SELECT: pending (available to claim) + own claimed
CREATE POLICY "collector_select_pickups" ON public.pickup_requests
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'collector')
    AND (status = 'pending' OR collector_id = auth.uid())
  );


-- ============================================================
-- 13. Storage: Private waste-scans bucket + object policies
-- ============================================================
INSERT INTO storage.buckets (id, name, public)
VALUES ('waste-scans', 'waste-scans', false)
ON CONFLICT (id) DO NOTHING;

DROP POLICY IF EXISTS "user_upload_scans" ON storage.objects;
CREATE POLICY "user_upload_scans" ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (
    bucket_id = 'waste-scans'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

DROP POLICY IF EXISTS "user_read_scans" ON storage.objects;
CREATE POLICY "user_read_scans" ON storage.objects
  FOR SELECT TO authenticated
  USING (
    bucket_id = 'waste-scans'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

-- Reload PostgREST schema cache
NOTIFY pgrst, 'reload schema';
