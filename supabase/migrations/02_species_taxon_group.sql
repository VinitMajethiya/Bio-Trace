-- Migration 02: Add taxon_group column to species_observations
ALTER TABLE public.species_observations
  ADD COLUMN IF NOT EXISTS taxon_group TEXT DEFAULT 'birds';
