-- Migration 05: Add onboarding_completed column to users
ALTER TABLE public.users
  ADD COLUMN IF NOT EXISTS onboarding_completed BOOLEAN DEFAULT false;
