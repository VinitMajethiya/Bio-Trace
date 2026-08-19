# CHANGE-04-DELIVERY-CLIENT.md — Delivery Client App Integration Prep

## What this is

A **separate collector app** (built later, not in this change) will allow waste collectors to:
- See pending pickup requests near them on a map
- Accept and claim a pickup
- Navigate to the user's location
- Mark the pickup as completed and trigger payout

This document defines the **data model, API surface, and Supabase Realtime setup** that the main EcoQuest app must implement NOW so the collector app can be built later and connects seamlessly — no schema migrations, no breaking changes.

The main EcoQuest app gets **no visible UI changes** from this document (the pickup flow UI already exists from Stage 4.4). What changes is the data layer underneath it.

---

## Collector app architecture (for context — not built here)

```
EcoQuest User App                    Collector App (future)
      │                                      │
      │  creates pickup_requests             │  reads pickup_requests
      │  status: 'pending'                   │  filters by proximity
      │                                      │  claims → status: 'assigned'
      │  receives realtime status updates    │  navigates to user location
      │  shows ETA                           │  completes → status: 'collected'
      ▼                                      ▼
           Supabase (shared backend — same project, separate RLS policies)
```

Both apps connect to the **same Supabase project**. Collectors have a different `role` in the `users` table which gates access to collector-only tables and functions.

---

## Schema changes

### 1. Extend `users` table

```sql
ALTER TABLE users
  ADD COLUMN IF NOT EXISTS role TEXT NOT NULL DEFAULT 'member',
  -- values: 'member' | 'collector' | 'moderator' | 'admin'
  ADD COLUMN IF NOT EXISTS is_available BOOLEAN DEFAULT false,
  -- collectors toggle this to go on/off duty
  ADD COLUMN IF NOT EXISTS last_known_lat FLOAT,
  ADD COLUMN IF NOT EXISTS last_known_lng FLOAT,
  ADD COLUMN IF NOT EXISTS last_location_at TIMESTAMPTZ;
  -- collectors update their location periodically while on duty
```

### 2. Redesign `pickups` table (breaking change — migrate existing rows)

The existing `pickups` table was a simple demo mock. Replace it with a production-ready structure:

```sql
CREATE TABLE pickup_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id),
  collector_id UUID REFERENCES users(id),   -- null until a collector claims it
  society_id UUID REFERENCES societies(id),

  -- location
  pickup_lat FLOAT NOT NULL,
  pickup_lng FLOAT NOT NULL,
  pickup_address TEXT,

  -- waste details (aggregate of locker items being picked up)
  total_weight_kg FLOAT,
  items JSONB,                               -- snapshot of locker_items at request time
  estimated_value_inr FLOAT,

  -- status machine
  status TEXT NOT NULL DEFAULT 'pending',
  -- 'pending' → 'assigned' → 'in_transit' → 'collected' → 'verified' | 'cancelled'

  -- timing
  requested_at TIMESTAMPTZ DEFAULT now(),
  assigned_at TIMESTAMPTZ,
  collected_at TIMESTAMPTZ,
  verified_at TIMESTAMPTZ,

  -- payout (after verification)
  actual_weight_kg FLOAT,
  actual_value_inr FLOAT,
  payout_status TEXT DEFAULT 'pending',     -- 'pending' | 'initiated' | 'completed'

  -- for the demo: a mock collector arrival delay
  mock_eta_seconds INT DEFAULT 120
);
```

> **Migration note:** If existing `pickups` rows exist from Stage 4.4, write a migration that maps old rows to the new `pickup_requests` schema. Old `status: 'completed'` rows become `status: 'verified'` with `collector_id: null` (they were mocked). Do not drop the old table until the migration is confirmed.

### 3. New: `collector_profiles` table

```sql
CREATE TABLE collector_profiles (
  id UUID PRIMARY KEY REFERENCES users(id),
  vehicle_type TEXT,              -- 'cycle' | 'auto' | 'truck'
  service_radius_km FLOAT DEFAULT 3.0,
  rating FLOAT DEFAULT 5.0,
  total_pickups INT DEFAULT 0,
  verified BOOLEAN DEFAULT false  -- admin-verified collector
);
```

### 4. Supabase Row Level Security (RLS) for collector data

```sql
-- Collectors can see pending requests within their service radius
-- (radius filtering is done client-side or via a PostGIS query — add policy below)

-- Users can only see their own pickup_requests
CREATE POLICY "users_own_pickups" ON pickup_requests
  FOR SELECT USING (auth.uid() = user_id);

-- Collectors can see all 'pending' requests + their own 'assigned' ones
CREATE POLICY "collectors_see_pending" ON pickup_requests
  FOR SELECT USING (
    (SELECT role FROM users WHERE id = auth.uid()) = 'collector'
    AND (status = 'pending' OR collector_id = auth.uid())
  );

-- Only the assigned collector can update a request they own
CREATE POLICY "collector_update_own" ON pickup_requests
  FOR UPDATE USING (collector_id = auth.uid());
```

---

## Supabase Realtime channels

The user app needs to **subscribe to status changes** on their pickup request so they can show live status updates ("Collector on the way", "Arrived", etc.) without polling.

```ts
// lib/pickupRealtime.ts
export function subscribeToPickup(
  pickupId: string,
  onStatusChange: (status: string, eta?: number) => void
) {
  return supabase
    .channel(`pickup-${pickupId}`)
    .on(
      "postgres_changes",
      {
        event: "UPDATE",
        schema: "public",
        table: "pickup_requests",
        filter: `id=eq.${pickupId}`,
      },
      (payload) => {
        onStatusChange(payload.new.status, payload.new.mock_eta_seconds);
      }
    )
    .subscribe();
}
```

The **collector app** will subscribe to a separate channel for new pending pickups near their location. Define the channel name convention now so both apps use the same string:
- User pickup status: `pickup-{pickup_id}`
- New requests broadcast (collector-side): `new-pickups-{society_id}` or `new-pickups-{city}` (decide based on how the collector app scopes discovery — start with society)

---

## Mock flow changes in the user app (Stage 4.4 update)

The existing "Schedule Pickup" → instant mock completion flow needs to be updated to use the new status machine, so the demo behavior matches real future behavior:

1. User taps "Schedule Pickup" → creates a `pickup_requests` row with `status: 'pending'`
2. User sees a status screen: "Waiting for a collector..." with a spinner
3. After `mock_eta_seconds` (default: 120 seconds, can be shortened to 5s for demo mode), a **Supabase Edge Function** auto-progresses the status: `pending` → `assigned` → `in_transit` → `collected`
4. On `collected`, GreenPoints and Health Score are awarded (same logic as before, just triggered by the status update instead of a button tap)

```ts
// supabase/functions/mock-pickup-progression/index.ts
// Called by a scheduled cron or by the client after a delay
// For demo: client calls this function after 5s to simulate instant pickup
```

The "Simulate Collector Arrival" dev-only button from Stage 4.4 can call this function directly — keep it but gate it behind `__DEV__` so it only shows in development.

---

## What the collector app will need (document for future reference)

When the collector app is built, it will be a **separate Expo project** connecting to the same Supabase project. It needs:
- Auth with `role: 'collector'` (manual role assignment by admin for now)
- A map showing `pending` pickup_requests
- Claim + navigate flow
- Location update loop (`supabase.from('users').update({last_known_lat, last_known_lng})` every 30s while on duty)
- Photo upload for verification (before/after, similar to Clean Raids)
- Mark-complete → triggers GreenPoints for user

Everything above is already supported by the schema defined in this document.

---

## Testing checklist (in the user app)

- [ ] "Schedule Pickup" creates a row in `pickup_requests` with `status: 'pending'`
- [ ] Status screen subscribes to the Realtime channel and updates when status changes
- [ ] Mock progression function advances status correctly through the state machine
- [ ] GreenPoints and Health Score are awarded when status reaches `'collected'` (not before)
- [ ] `user_id` can only see their own pickup records (RLS test)
- [ ] `role: 'collector'` user can see `pending` records (RLS test)
