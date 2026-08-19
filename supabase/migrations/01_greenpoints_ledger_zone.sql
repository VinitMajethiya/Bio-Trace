-- Migration 01: Add zone_tier column to greenpoints_ledger
ALTER TABLE public.greenpoints_ledger
  ADD COLUMN IF NOT EXISTS zone_tier TEXT DEFAULT 'remote';
