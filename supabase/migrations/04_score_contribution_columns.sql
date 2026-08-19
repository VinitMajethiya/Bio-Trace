-- Migration 04: Add FLOAT score contribution breakdown columns to societies and territories
ALTER TABLE public.societies
  ADD COLUMN IF NOT EXISTS wild_score_contribution FLOAT DEFAULT 0,
  ADD COLUMN IF NOT EXISTS circular_score_contribution FLOAT DEFAULT 0;

ALTER TABLE public.territories
  ADD COLUMN IF NOT EXISTS wild_score_contribution FLOAT DEFAULT 0,
  ADD COLUMN IF NOT EXISTS circular_score_contribution FLOAT DEFAULT 0;
