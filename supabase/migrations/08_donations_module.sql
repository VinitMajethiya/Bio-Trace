-- ============================================================
-- Migration 08: Give Back (Donations) Module
-- Complete Schema, Zero-Grant Contact Segregation, Server-Side Fuzzing,
-- Concurrency-Safe RPCs, Atomic State Transitions & Storage Policies
-- ============================================================

-- 1. Extend Users table for authoritative NGO verification
ALTER TABLE public.users
  ADD COLUMN IF NOT EXISTS ngo_verified BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS ngo_organization_name TEXT;

-- 2. Donations Listing Table (Public metadata only, NO raw contact info, NO exact GPS)
CREATE TABLE IF NOT EXISTS public.donations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  donor_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  category TEXT NOT NULL CHECK (category IN ('saplings', 'seeds', 'compost', 'tools', 'materials', 'other')),
  item_name TEXT NOT NULL,
  quantity_total INT NOT NULL CHECK (quantity_total > 0),
  quantity_remaining INT NOT NULL CHECK (quantity_remaining >= 0),
  unit TEXT NOT NULL DEFAULT 'items' CHECK (unit IN ('saplings', 'packets', 'kg', 'items', 'tools', 'units')),
  condition TEXT NOT NULL DEFAULT 'healthy' CHECK (condition IN ('new', 'healthy', 'gently_used', 'upcycled')),
  description TEXT,
  photo_url TEXT,
  location_name TEXT NOT NULL,
  fuzzed_lat FLOAT NOT NULL,
  fuzzed_lng FLOAT NOT NULL,
  availability_window TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'listed' CHECK (status IN ('listed', 'scheduled', 'completed', 'cancelled')),
  expires_at TIMESTAMPTZ NOT NULL DEFAULT (now() + INTERVAL '30 days'),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 3. Private Donor Contacts (Strict Zero-Grant RLS Table)
CREATE TABLE IF NOT EXISTS public.donation_contacts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  donation_id UUID NOT NULL UNIQUE REFERENCES public.donations(id) ON DELETE CASCADE,
  donor_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  exact_address TEXT NOT NULL,
  exact_lat FLOAT NOT NULL,
  exact_lng FLOAT NOT NULL,
  donor_phone TEXT NOT NULL,
  donor_email TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 4. Donation Requests Table (NO plain contact info in public columns)
CREATE TABLE IF NOT EXISTS public.donation_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  donation_id UUID NOT NULL REFERENCES public.donations(id) ON DELETE CASCADE,
  requester_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  requested_quantity INT NOT NULL DEFAULT 1 CHECK (requested_quantity > 0),
  intended_use TEXT NOT NULL,
  message TEXT,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'scheduled', 'completed', 'rejected', 'cancelled')),
  requested_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 5. Private Requester Contacts (Strict Zero-Grant RLS Table)
CREATE TABLE IF NOT EXISTS public.donation_request_contacts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  request_id UUID NOT NULL UNIQUE REFERENCES public.donation_requests(id) ON DELETE CASCADE,
  requester_phone TEXT NOT NULL,
  requester_email TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 6. Indexes & Constraints
CREATE INDEX IF NOT EXISTS idx_donations_feed ON public.donations(status, category, created_at DESC) WHERE status = 'listed';
CREATE INDEX IF NOT EXISTS idx_donations_donor ON public.donations(donor_id);
CREATE INDEX IF NOT EXISTS idx_donation_requests_donation ON public.donation_requests(donation_id, status);
CREATE INDEX IF NOT EXISTS idx_donation_requests_requester ON public.donation_requests(requester_id, status);
CREATE UNIQUE INDEX IF NOT EXISTS idx_unique_pending_request ON public.donation_requests (donation_id, requester_id) WHERE status = 'pending';

-- 7. Public Feed View (Always joins live users.ngo_verified to prevent stale badges)
-- NOTE ON EXPIRY: Expiry is enforced at query-time via (d.expires_at > now()) to guarantee zero-latency filtering
-- without strictly mandating background pg_cron extensions.
CREATE OR REPLACE VIEW public.v_donations_feed AS
SELECT 
  d.id,
  d.donor_id,
  u.ngo_verified,
  u.ngo_organization_name,
  COALESCE(u.display_name, 'Community Donor') as donor_display_name,
  d.category,
  d.item_name,
  d.quantity_total,
  d.quantity_remaining,
  d.unit,
  d.condition,
  d.description,
  d.photo_url,
  d.location_name,
  d.fuzzed_lat,
  d.fuzzed_lng,
  d.availability_window,
  d.status,
  d.expires_at,
  d.created_at
FROM public.donations d
JOIN public.users u ON d.donor_id = u.id
WHERE d.status = 'listed' AND d.expires_at > now();

-- ============================================================
-- 8. Row Level Security Configuration
-- ============================================================

-- Security Definer Helpers to break cross-table RLS infinite recursion
CREATE OR REPLACE FUNCTION public.fn_is_donation_donor(p_donation_id UUID, p_user_id UUID)
RETURNS BOOLEAN
SECURITY DEFINER
SET search_path = public
LANGUAGE sql
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.donations WHERE id = p_donation_id AND donor_id = p_user_id
  );
$$;

CREATE OR REPLACE FUNCTION public.fn_has_requested_donation(p_donation_id UUID, p_user_id UUID)
RETURNS BOOLEAN
SECURITY DEFINER
SET search_path = public
LANGUAGE sql
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.donation_requests WHERE donation_id = p_donation_id AND requester_id = p_user_id
  );
$$;

ALTER TABLE public.donations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.donation_contacts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.donation_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.donation_request_contacts ENABLE ROW LEVEL SECURITY;

-- Drop previous policies
DROP POLICY IF EXISTS "Donors can update own listings" ON public.donations;
DROP POLICY IF EXISTS "Requesters can update own pending requests" ON public.donation_requests;
DROP POLICY IF EXISTS "Public can view active listed donations" ON public.donations;
DROP POLICY IF EXISTS "Donors can view their own listings" ON public.donations;
DROP POLICY IF EXISTS "Requesters can view donations they requested" ON public.donations;
DROP POLICY IF EXISTS "Donors can delete own listings" ON public.donations;
DROP POLICY IF EXISTS "Donors can view requests for their donations" ON public.donation_requests;
DROP POLICY IF EXISTS "Requesters can view own requests" ON public.donation_requests;

-- Donations table policies (Read & Delete only; all mutations routed through secure RPCs)
CREATE POLICY "Public can view active listed donations" ON public.donations
  FOR SELECT USING (status = 'listed' AND expires_at > now());

CREATE POLICY "Donors can view their own listings" ON public.donations
  FOR SELECT USING (auth.uid() = donor_id);

CREATE POLICY "Requesters can view donations they requested" ON public.donations
  FOR SELECT USING (public.fn_has_requested_donation(id, auth.uid()));

CREATE POLICY "Donors can delete own listings" ON public.donations
  FOR DELETE USING (auth.uid() = donor_id);

-- Donation Requests policies (Read only; all updates/cancel/reject routed through secure RPCs)
CREATE POLICY "Donors can view requests for their donations" ON public.donation_requests
  FOR SELECT USING (public.fn_is_donation_donor(donation_id, auth.uid()));

CREATE POLICY "Requesters can view own requests" ON public.donation_requests
  FOR SELECT USING (auth.uid() = requester_id);

-- ZERO-GRANT RLS TABLES:
-- public.donation_contacts and public.donation_request_contacts have ZERO client SELECT/INSERT/UPDATE grants.
-- All access is mediated strictly through the SECURITY DEFINER RPCs below.

-- ============================================================
-- 9. Authoritative RPCs (Concurrency, Authorization & Privacy)
-- ============================================================

-- RPC 1: Create Donation Listing with Server-Side Coordinate Fuzzing
CREATE OR REPLACE FUNCTION public.create_donation_listing(
  p_category TEXT,
  p_item_name TEXT,
  p_quantity INT,
  p_unit TEXT,
  p_condition TEXT,
  p_description TEXT,
  p_photo_url TEXT,
  p_location_name TEXT,
  p_exact_address TEXT,
  p_exact_lat FLOAT,
  p_exact_lng FLOAT,
  p_availability_window TEXT,
  p_donor_phone TEXT,
  p_donor_email TEXT
)
RETURNS JSONB
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
DECLARE
  v_donor_id UUID;
  v_donation_id UUID;
  v_fuzzed_lat FLOAT;
  v_fuzzed_lng FLOAT;
BEGIN
  v_donor_id := auth.uid();
  IF v_donor_id IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'unauthorized', 'message', 'Authentication required.');
  END IF;

  IF p_quantity <= 0 THEN
    RETURN jsonb_build_object('success', false, 'error', 'invalid_quantity', 'message', 'Quantity must be at least 1.');
  END IF;

  -- Server-Side Fuzzing: Round to 2 decimal places (~1.1 km precision)
  v_fuzzed_lat := ROUND(p_exact_lat::numeric, 2)::float;
  v_fuzzed_lng := ROUND(p_exact_lng::numeric, 2)::float;

  -- Insert public donation metadata
  INSERT INTO public.donations (
    donor_id, category, item_name, quantity_total, quantity_remaining,
    unit, condition, description, photo_url, location_name,
    fuzzed_lat, fuzzed_lng, availability_window, status
  ) VALUES (
    v_donor_id, p_category, p_item_name, p_quantity, p_quantity,
    p_unit, p_condition, p_description, p_photo_url, p_location_name,
    v_fuzzed_lat, v_fuzzed_lng, p_availability_window, 'listed'
  ) RETURNING id INTO v_donation_id;

  -- Insert private contact record (isolated in zero-grant table)
  INSERT INTO public.donation_contacts (
    donation_id, donor_id, exact_address, exact_lat, exact_lng, donor_phone, donor_email
  ) VALUES (
    v_donation_id, v_donor_id, p_exact_address, p_exact_lat, p_exact_lng, p_donor_phone, p_donor_email
  );

  RETURN jsonb_build_object('success', true, 'donation_id', v_donation_id);
END;
$$;

-- RPC 2: Update Donation Listing (Restricted to editable presentation fields only)
CREATE OR REPLACE FUNCTION public.update_donation_listing(
  p_donation_id UUID,
  p_description TEXT,
  p_photo_url TEXT,
  p_availability_window TEXT
)
RETURNS JSONB
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
DECLARE
  v_donor_id UUID;
BEGIN
  v_donor_id := auth.uid();
  IF v_donor_id IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'unauthorized', 'message', 'Authentication required.');
  END IF;

  UPDATE public.donations
  SET 
    description = COALESCE(p_description, description),
    photo_url = COALESCE(p_photo_url, photo_url),
    availability_window = COALESCE(p_availability_window, availability_window),
    updated_at = now()
  WHERE id = p_donation_id AND donor_id = v_donor_id;

  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'error', 'not_found_or_forbidden', 'message', 'Donation not found or not owned by you.');
  END IF;

  RETURN jsonb_build_object('success', true, 'donation_id', p_donation_id);
END;
$$;

-- RPC 3: Submit Donation Request with Segregated Contact Storage
CREATE OR REPLACE FUNCTION public.submit_donation_request(
  p_donation_id UUID,
  p_requested_quantity INT,
  p_intended_use TEXT,
  p_message TEXT,
  p_requester_phone TEXT,
  p_requester_email TEXT
)
RETURNS JSONB
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
DECLARE
  v_requester_id UUID;
  v_request_id UUID;
  v_donation RECORD;
BEGIN
  v_requester_id := auth.uid();
  IF v_requester_id IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'unauthorized', 'message', 'Authentication required.');
  END IF;

  SELECT * INTO v_donation FROM public.donations WHERE id = p_donation_id;
  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'error', 'not_found', 'message', 'Donation not found.');
  END IF;

  IF v_donation.donor_id = v_requester_id THEN
    RETURN jsonb_build_object('success', false, 'error', 'self_request', 'message', 'You cannot request your own donation.');
  END IF;

  IF v_donation.status != 'listed' OR v_donation.expires_at <= now() THEN
    RETURN jsonb_build_object('success', false, 'error', 'unavailable', 'message', 'This donation is no longer active or has expired.');
  END IF;

  IF p_requested_quantity <= 0 OR p_requested_quantity > v_donation.quantity_remaining THEN
    RETURN jsonb_build_object('success', false, 'error', 'insufficient_stock', 'message', format('Requested quantity exceeds available stock (%s remaining).', v_donation.quantity_remaining));
  END IF;

  -- Insert public request row
  INSERT INTO public.donation_requests (
    donation_id, requester_id, requested_quantity, intended_use, message, status
  ) VALUES (
    p_donation_id, v_requester_id, p_requested_quantity, p_intended_use, p_message, 'pending'
  ) RETURNING id INTO v_request_id;

  -- Insert segregated private contact row
  INSERT INTO public.donation_request_contacts (
    request_id, requester_phone, requester_email
  ) VALUES (
    v_request_id, p_requester_phone, p_requester_email
  );

  RETURN jsonb_build_object('success', true, 'request_id', v_request_id);
END;
$$;

-- RPC 4: Accept Donation Request (Atomic Request Claim + Row Lock + Explicit Status Rollback)
CREATE OR REPLACE FUNCTION public.accept_donation_request(p_request_id UUID)
RETURNS JSONB
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
DECLARE
  v_donor_id UUID;
  v_request RECORD;
  v_donation RECORD;
  v_new_remaining INT;
BEGIN
  v_donor_id := auth.uid();
  IF v_donor_id IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'unauthorized', 'message', 'Authentication required.');
  END IF;

  -- 1. Atomic conditional claim of the request to prevent double-accept races
  UPDATE public.donation_requests
  SET status = 'accepted', updated_at = now()
  WHERE id = p_request_id AND status = 'pending'
  RETURNING * INTO v_request;

  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'error', 'already_processed', 'message', 'This request was already accepted, rejected, or cancelled.');
  END IF;

  -- 2. Atomic Row Lock on Donation
  SELECT * INTO v_donation FROM public.donations WHERE id = v_request.donation_id FOR UPDATE;
  
  -- 3. Verify Ownership & Lifecycle state with explicit rollback to pending
  IF v_donation.donor_id != v_donor_id THEN
    UPDATE public.donation_requests SET status = 'pending', updated_at = now() WHERE id = p_request_id;
    RETURN jsonb_build_object('success', false, 'error', 'forbidden', 'message', 'Only the donor can accept this request.');
  END IF;

  IF v_donation.status != 'listed' OR v_donation.expires_at <= now() THEN
    UPDATE public.donation_requests SET status = 'pending', updated_at = now() WHERE id = p_request_id;
    RETURN jsonb_build_object('success', false, 'error', 'unavailable', 'message', 'This donation is no longer active or has expired.');
  END IF;

  -- 4. Check remaining stock gracefully with explicit rollback to pending
  IF v_donation.quantity_remaining < v_request.requested_quantity THEN
    UPDATE public.donation_requests SET status = 'pending', updated_at = now() WHERE id = p_request_id;
    RETURN jsonb_build_object('success', false, 'error', 'insufficient_stock', 'message', format('Not enough stock remaining (Only %s available).', v_donation.quantity_remaining));
  END IF;

  v_new_remaining := v_donation.quantity_remaining - v_request.requested_quantity;

  -- Deduct inventory and update status if depleted
  UPDATE public.donations
  SET 
    quantity_remaining = v_new_remaining,
    status = (CASE WHEN v_new_remaining = 0 THEN 'scheduled' ELSE 'listed' END),
    updated_at = now()
  WHERE id = v_donation.id;

  RETURN jsonb_build_object(
    'success', true,
    'request_id', p_request_id,
    'quantity_remaining', v_new_remaining,
    'donation_status', (CASE WHEN v_new_remaining = 0 THEN 'scheduled' ELSE 'listed' END)
  );
END;
$$;

-- RPC 5: Reject Donation Request (Donor Only, Pending Requests Only)
CREATE OR REPLACE FUNCTION public.reject_donation_request(p_request_id UUID)
RETURNS JSONB
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
DECLARE
  v_donor_id UUID;
  v_request RECORD;
  v_donation RECORD;
BEGIN
  v_donor_id := auth.uid();
  IF v_donor_id IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'unauthorized', 'message', 'Authentication required.');
  END IF;

  SELECT * INTO v_request FROM public.donation_requests WHERE id = p_request_id;
  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'error', 'not_found', 'message', 'Request not found.');
  END IF;

  SELECT * INTO v_donation FROM public.donations WHERE id = v_request.donation_id;
  IF v_donation.donor_id != v_donor_id THEN
    RETURN jsonb_build_object('success', false, 'error', 'forbidden', 'message', 'Only the donor can reject this request.');
  END IF;

  UPDATE public.donation_requests
  SET status = 'rejected', updated_at = now()
  WHERE id = p_request_id AND status = 'pending'
  RETURNING * INTO v_request;

  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'error', 'already_processed', 'message', 'Request is no longer pending.');
  END IF;

  RETURN jsonb_build_object('success', true, 'request_id', p_request_id);
END;
$$;

-- RPC 6: Cancel Donation Request (Requester Only, with inventory restoration on locked donation row)
CREATE OR REPLACE FUNCTION public.cancel_donation_request(p_request_id UUID)
RETURNS JSONB
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
DECLARE
  v_requester_id UUID;
  v_request RECORD;
  v_donation RECORD;
  v_original_status TEXT;
  v_new_remaining INT;
BEGIN
  v_requester_id := auth.uid();
  IF v_requester_id IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'unauthorized', 'message', 'Authentication required.');
  END IF;

  -- 1. Atomically lock request and check original status
  SELECT * INTO v_request FROM public.donation_requests
  WHERE id = p_request_id AND requester_id = v_requester_id FOR UPDATE;

  IF NOT FOUND OR v_request.status NOT IN ('pending', 'accepted') THEN
    RETURN jsonb_build_object('success', false, 'error', 'cannot_cancel', 'message', 'Request not found or already completed/cancelled.');
  END IF;

  v_original_status := v_request.status;

  -- 2. Flip request status to cancelled
  UPDATE public.donation_requests
  SET status = 'cancelled', updated_at = now()
  WHERE id = p_request_id;

  -- 3. If request was already accepted, restore inventory on locked donation row
  IF v_original_status = 'accepted' THEN
    SELECT * INTO v_donation FROM public.donations WHERE id = v_request.donation_id FOR UPDATE;
    v_new_remaining := v_donation.quantity_remaining + v_request.requested_quantity;
    
    UPDATE public.donations
    SET 
      quantity_remaining = v_new_remaining,
      status = (CASE WHEN status = 'scheduled' AND v_new_remaining > 0 THEN 'listed' ELSE status END),
      updated_at = now()
    WHERE id = v_donation.id;
  END IF;

  RETURN jsonb_build_object('success', true, 'request_id', p_request_id, 'cancelled_status', v_original_status);
END;
$$;

-- RPC 7: Get Accepted Donation Contact Info (Strict Dual-Party Authorization)
CREATE OR REPLACE FUNCTION public.get_accepted_donation_contact(p_donation_id UUID, p_request_id UUID)
RETURNS JSONB
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
DECLARE
  v_user_id UUID;
  v_request RECORD;
  v_donation RECORD;
  v_d_contact RECORD;
  v_r_contact RECORD;
BEGIN
  v_user_id := auth.uid();
  IF v_user_id IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'unauthorized');
  END IF;

  SELECT * INTO v_request FROM public.donation_requests WHERE id = p_request_id AND donation_id = p_donation_id;
  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'error', 'not_found');
  END IF;

  SELECT * INTO v_donation FROM public.donations WHERE id = p_donation_id;

  -- Authorization check: user must be donor or requester, and request must be accepted/scheduled/completed
  IF (v_user_id != v_donation.donor_id AND v_user_id != v_request.requester_id) THEN
    RETURN jsonb_build_object('success', false, 'error', 'forbidden');
  END IF;

  IF v_request.status NOT IN ('accepted', 'scheduled', 'completed') THEN
    RETURN jsonb_build_object('success', false, 'error', 'not_accepted', 'message', 'Contact details are revealed once the request is accepted.');
  END IF;

  SELECT * INTO v_d_contact FROM public.donation_contacts WHERE donation_id = p_donation_id;
  SELECT * INTO v_r_contact FROM public.donation_request_contacts WHERE request_id = p_request_id;

  RETURN jsonb_build_object(
    'success', true,
    'donor', jsonb_build_object(
      'phone', v_d_contact.donor_phone,
      'email', v_d_contact.donor_email,
      'exact_address', v_d_contact.exact_address,
      'exact_lat', v_d_contact.exact_lat,
      'exact_lng', v_d_contact.exact_lng,
      'availability_window', v_donation.availability_window
    ),
    'requester', jsonb_build_object(
      'phone', v_r_contact.requester_phone,
      'email', v_r_contact.requester_email,
      'intended_use', v_request.intended_use,
      'requested_quantity', v_request.requested_quantity
    )
  );
END;
$$;

-- RPC 8: Complete Donation (Atomic Request Transition, Locked Donation Check & Per-Claim GP Award)
CREATE OR REPLACE FUNCTION public.complete_donation(p_donation_id UUID, p_request_id UUID)
RETURNS JSONB
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
DECLARE
  v_user_id UUID;
  v_request RECORD;
  v_donation RECORD;
  v_gp_earned INT := 50;
  v_requester_bonus INT := 15;
  v_territory_id UUID;
  v_has_active_claims BOOLEAN;
BEGIN
  v_user_id := auth.uid();
  IF v_user_id IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'unauthorized');
  END IF;

  -- 1. Atomic row lock on the donation
  SELECT * INTO v_donation FROM public.donations WHERE id = p_donation_id FOR UPDATE;
  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'error', 'not_found');
  END IF;

  -- Authorization check: user must be donor or requester on this request
  IF (v_user_id != v_donation.donor_id AND NOT EXISTS (
      SELECT 1 FROM public.donation_requests WHERE id = p_request_id AND requester_id = v_user_id
  )) THEN
    RETURN jsonb_build_object('success', false, 'error', 'forbidden');
  END IF;

  -- 2. Atomic state transition: flip request to completed ONLY if currently accepted or scheduled
  UPDATE public.donation_requests
  SET status = 'completed', updated_at = now()
  WHERE id = p_request_id AND donation_id = p_donation_id AND status IN ('accepted', 'scheduled')
  RETURNING * INTO v_request;

  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'error', 'already_completed', 'message', 'This request has already been completed or is not accepted.');
  END IF;

  -- 3. Check for any remaining accepted/scheduled claims in the locked transaction
  SELECT EXISTS (
    SELECT 1 FROM public.donation_requests 
    WHERE donation_id = p_donation_id 
      AND status IN ('accepted', 'scheduled') 
      AND id != p_request_id
  ) INTO v_has_active_claims;

  -- Only close out the whole donation listing if inventory is 0 AND zero other claims are in-flight
  IF v_donation.quantity_remaining = 0 AND NOT v_has_active_claims THEN
    UPDATE public.donations SET status = 'completed', updated_at = now() WHERE id = p_donation_id;
  END IF;

  -- 4. Dynamic GP Formula calculated strictly from the specific claim's requested_quantity
  v_gp_earned := CASE v_donation.category
    WHEN 'saplings'  THEN v_request.requested_quantity * 25
    WHEN 'seeds'     THEN v_request.requested_quantity * 15
    WHEN 'compost'   THEN v_request.requested_quantity * 10
    WHEN 'tools'     THEN v_request.requested_quantity * 40
    WHEN 'materials' THEN v_request.requested_quantity * 20
    ELSE v_request.requested_quantity * 15
  END;

  -- Clamp between 30 and 500 GP per batch
  v_gp_earned := GREATEST(30, LEAST(500, v_gp_earned));

  -- 5. Credit Donor GreenPoints
  INSERT INTO public.greenpoints_ledger (user_id, source, amount, note)
  VALUES (v_donation.donor_id, 'donation_give_back', v_gp_earned, format('Donated %s %s of %s', v_request.requested_quantity, v_donation.unit, v_donation.item_name));

  -- 6. Credit Requester Green Steward Claim Bonus
  INSERT INTO public.greenpoints_ledger (user_id, source, amount, note)
  VALUES (v_request.requester_id, 'donation_claim_bonus', v_requester_bonus, format('Claimed and planted/utilized %s %s of %s', v_request.requested_quantity, v_donation.unit, v_donation.item_name));

  -- 7. Boost Territory Health Score
  SELECT id INTO v_territory_id FROM public.territories LIMIT 1;
  IF v_territory_id IS NOT NULL THEN
    UPDATE public.territories SET health_score = LEAST(100, health_score + 2), updated_at = now() WHERE id = v_territory_id;
  END IF;

  RETURN jsonb_build_object(
    'success', true,
    'donor_gp_awarded', v_gp_earned,
    'requester_gp_awarded', v_requester_bonus,
    'claimed_quantity', v_request.requested_quantity
  );
END;
$$;

-- ============================================================
-- 10. Storage Bucket & Scoped Policies (5MB limit for photos)
-- Naming convention: donations/{donor_id}/{donation_id}/{filename}
-- ============================================================

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES ('donations', 'donations', true, 5242880, ARRAY['image/jpeg', 'image/png', 'image/webp'])
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "Authenticated users can upload donation photos" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'donations' AND 
    auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "Donors can update own donation photos" ON storage.objects
  FOR UPDATE USING (
    bucket_id = 'donations' AND 
    auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "Donors can delete own donation photos" ON storage.objects
  FOR DELETE USING (
    bucket_id = 'donations' AND 
    auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "Public read access for donation photos" ON storage.objects
  FOR SELECT USING (bucket_id = 'donations');

NOTIFY pgrst, 'reload schema';
