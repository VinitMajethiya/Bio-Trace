-- ========================================================
-- BioVerse Demo Data Seed Script (Stage 13.3)
-- Pre-loads realistic societies, clean raids, health scores,
-- species observations, and recycling logs for live judge demo
-- Copy & run in Supabase SQL Editor prior to demo presentation
-- ========================================================

-- 1. Ensure Pilot Territory Exists
INSERT INTO public.territories (id, name, health_score)
VALUES (
  '00000000-0000-0000-0000-000000000001',
  'Green Pioneers Territory',
  88
)
ON CONFLICT (id) DO UPDATE SET health_score = 88;

-- 2. Seed Societies
INSERT INTO public.societies (id, name, health_score, created_at)
VALUES
  ('11111111-1111-1111-1111-111111111111', 'Green Pioneers Society', 88, NOW() - INTERVAL '14 days'),
  ('22222222-2222-2222-2222-222222222222', 'Eco Warriors Club', 92, NOW() - INTERVAL '10 days'),
  ('33333333-3333-3333-3333-333333333333', 'Campus Biodiversity Hub', 78, NOW() - INTERVAL '7 days')
ON CONFLICT (id) DO UPDATE SET health_score = EXCLUDED.health_score;

-- 3. Seed Prior Clean Raids
INSERT INTO public.clean_raids
  (id, society_id, title, description, status, location_name, meeting_point, target_gp_bonus, created_at)
VALUES
  (
    'a1111111-1111-1111-1111-111111111111',
    '11111111-1111-1111-1111-111111111111',
    'Riverside Plastics & Litter Clean Raid',
    'Group cleanup along the campus stream path to collect single-use plastics and restore riparian health.',
    'open',
    'SGU River Path & Wetland',
    'Main Gate Eco-Bench #2',
    150,
    NOW() - INTERVAL '1 day'
  ),
  (
    'a2222222-2222-2222-2222-222222222222',
    '11111111-1111-1111-1111-111111111111',
    'Campus Arboretum Invasive Weeding & Waste Cleanup',
    'Completed community raid to clear litter and invasive weeds around the botanical arboretum.',
    'completed',
    'SGU Botanical Arboretum',
    'Arboretum Information Kiosk',
    100,
    NOW() - INTERVAL '3 days'
  )
ON CONFLICT (id) DO NOTHING;

-- 4. Seed Prior Wild Species Observations
INSERT INTO public.species_observations 
  (territory_id, species_label, confidence, rarity_tier, verification_tier, gps_lat, gps_lng, created_at)
VALUES
  ('00000000-0000-0000-0000-000000000001', 'Indian Peafowl', 96.5, 'Amber', 1, 16.7485, 74.4665, NOW() - INTERVAL '2 days'),
  ('00000000-0000-0000-0000-000000000001', 'Purple Sunbird', 98.2, 'Legendary', 1, 16.7465, 74.4690, NOW() - INTERVAL '1 day'),
  ('00000000-0000-0000-0000-000000000001', 'House Sparrow', 99.0, 'Common', 1, 16.7470, 74.4650, NOW() - INTERVAL '5 hours');

-- 5. Seed Prior Circular Waste Transactions
INSERT INTO public.waste_transactions
  (territory_id, category, ai_confidence, weight_estimate, payout_amount, verification_tier, status, created_at)
VALUES
  ('00000000-0000-0000-0000-000000000001', 'Paper', 94.0, 3.5, 42.0, 1, 'completed', NOW() - INTERVAL '3 days'),
  ('00000000-0000-0000-0000-000000000001', 'Plastic', 91.5, 2.0, 50.0, 1, 'completed', NOW() - INTERVAL '1 day'),
  ('00000000-0000-0000-0000-000000000001', 'E-Waste', 97.8, 1.2, 90.0, 1, 'completed', NOW() - INTERVAL '6 hours');
