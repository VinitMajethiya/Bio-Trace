-- ========================================================
-- BioVerse Demo Data Seed Script (Stage 7.3)
-- Pre-loads realistic prior activity into Supabase
-- Copy & run in Supabase SQL Editor prior to judge demo
-- ========================================================

-- 1. Ensure Pilot Territory Exists
INSERT INTO public.territories (id, name, health_score)
VALUES (
  '00000000-0000-0000-0000-000000000001',
  'Green Pioneers Territory',
  88
)
ON CONFLICT (id) DO UPDATE SET health_score = 88;

-- 2. Seed Prior Wild Species Observations
INSERT INTO public.species_observations 
  (territory_id, species_label, confidence, rarity_tier, verification_tier, gps_lat, gps_lng, created_at)
VALUES
  ('00000000-0000-0000-0000-000000000001', 'Indian Peafowl', 96.5, 'Amber', 1, 16.7485, 74.4665, NOW() - INTERVAL '2 days'),
  ('00000000-0000-0000-0000-000000000001', 'Purple Sunbird', 98.2, 'Legendary', 1, 16.7465, 74.4690, NOW() - INTERVAL '1 day'),
  ('00000000-0000-0000-0000-000000000001', 'House Sparrow', 99.0, 'Common', 1, 16.7470, 74.4650, NOW() - INTERVAL '5 hours');

-- 3. Seed Prior Circular Waste Transactions
INSERT INTO public.waste_transactions
  (territory_id, category, ai_confidence, weight_estimate, payout_amount, verification_tier, status, created_at)
VALUES
  ('00000000-0000-0000-0000-000000000001', 'Paper', 94.0, 3.5, 42.0, 1, 'completed', NOW() - INTERVAL '3 days'),
  ('00000000-0000-0000-0000-000000000001', 'Plastic', 91.5, 2.0, 50.0, 1, 'completed', NOW() - INTERVAL '1 day'),
  ('00000000-0000-0000-0000-000000000001', 'E-Waste', 97.8, 1.2, 90.0, 1, 'completed', NOW() - INTERVAL '6 hours');
