-- ============================================================
-- Migration 07: Biodiversity Estimation & Species Database Model
-- Adds scientific taxonomy, native/invasive tags, and Shannon index functions
-- ============================================================

-- 1. Extend species_observations with taxon_group and scientific taxonomy
ALTER TABLE public.species_observations
  ADD COLUMN IF NOT EXISTS taxon_group TEXT DEFAULT 'birds',
  ADD COLUMN IF NOT EXISTS scientific_name TEXT,
  ADD COLUMN IF NOT EXISTS is_native BOOLEAN DEFAULT true,
  ADD COLUMN IF NOT EXISTS eco_role TEXT DEFAULT 'native_wildlife',
  ADD COLUMN IF NOT EXISTS observation_source TEXT DEFAULT 'inaturalist_cv';

-- 2. Extend territories with biodiversity assessment metrics
ALTER TABLE public.territories
  ADD COLUMN IF NOT EXISTS species_richness INT DEFAULT 0,
  ADD COLUMN IF NOT EXISTS shannon_diversity_index NUMERIC DEFAULT 0,
  ADD COLUMN IF NOT EXISTS native_species_ratio NUMERIC DEFAULT 1.0,
  ADD COLUMN IF NOT EXISTS last_bio_assessment_at TIMESTAMPTZ;

-- 3. Stored Procedure: Calculate Territory Biodiversity Score
CREATE OR REPLACE FUNCTION public.calculate_territory_biodiversity(t_id UUID)
RETURNS JSONB
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
DECLARE
  total_obs INT;
  distinct_species INT;
  native_count INT;
  shannon_h NUMERIC := 0;
  trophic_plants INT;
  trophic_insects INT;
  trophic_birds INT;
  trophic_wildlife INT;
  calculated_health NUMERIC;
  result_json JSONB;
BEGIN
  -- Count total and distinct observations in this territory
  SELECT
    COUNT(*),
    COUNT(DISTINCT species_label),
    COUNT(*) FILTER (WHERE is_native = TRUE),
    COUNT(*) FILTER (WHERE taxon_group = 'plants'),
    COUNT(*) FILTER (WHERE taxon_group = 'insects'),
    COUNT(*) FILTER (WHERE taxon_group = 'birds'),
    COUNT(*) FILTER (WHERE taxon_group = 'wildlife')
  INTO
    total_obs, distinct_species, native_count,
    trophic_plants, trophic_insects, trophic_birds, trophic_wildlife
  FROM public.species_observations
  WHERE territory_id = t_id;

  IF total_obs = 0 THEN
    RETURN jsonb_build_object(
      'territory_id', t_id,
      'total_observations', 0,
      'species_richness', 0,
      'shannon_index', 0,
      'health_score', 50
    );
  END IF;

  -- Shannon-Wiener Diversity Index: H' = -SUM( (n/N) * ln(n/N) )
  SELECT COALESCE(SUM(-1.0 * (cnt::NUMERIC / total_obs) * LN(cnt::NUMERIC / total_obs)), 0)
  INTO shannon_h
  FROM (
    SELECT COUNT(*) as cnt
    FROM public.species_observations
    WHERE territory_id = t_id
    GROUP BY species_label
  ) species_counts;

  -- Ecosystem Health Estimation Formula (0-100)
  -- Baseline 50 + (Species Richness * 2.5) + (Shannon H' * 8) + (Trophic Balance Bonus)
  calculated_health := GREATEST(0, LEAST(100,
    40 +
    (distinct_species * 2.5) +
    (shannon_h * 8.0) +
    (CASE WHEN trophic_plants > 0 AND trophic_insects > 0 AND trophic_birds > 0 THEN 10 ELSE 0 END)
  ));

  -- Update territory record
  UPDATE public.territories
  SET
    species_richness = distinct_species,
    shannon_diversity_index = ROUND(shannon_h, 2),
    native_species_ratio = ROUND((native_count::NUMERIC / total_obs), 2),
    health_score = ROUND(calculated_health, 1),
    last_bio_assessment_at = NOW(),
    updated_at = NOW()
  WHERE id = t_id;

  result_json := jsonb_build_object(
    'territory_id', t_id,
    'total_observations', total_obs,
    'species_richness', distinct_species,
    'shannon_index', ROUND(shannon_h, 2),
    'native_ratio', ROUND((native_count::NUMERIC / total_obs), 2),
    'trophic_breakdown', jsonb_build_object(
      'plants', trophic_plants,
      'insects', trophic_insects,
      'birds', trophic_birds,
      'wildlife', trophic_wildlife
    ),
    'health_score', ROUND(calculated_health, 1)
  );

  RETURN result_json;
END;
$$;

-- 4. Trigger to automatically re-assess territory biodiversity on new sightings
CREATE OR REPLACE FUNCTION public.fn_auto_assess_biodiversity()
RETURNS TRIGGER
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
BEGIN
  IF NEW.territory_id IS NOT NULL THEN
    PERFORM public.calculate_territory_biodiversity(NEW.territory_id);
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_auto_assess_biodiversity ON public.species_observations;
CREATE TRIGGER trg_auto_assess_biodiversity
AFTER INSERT OR UPDATE ON public.species_observations
FOR EACH ROW EXECUTE FUNCTION public.fn_auto_assess_biodiversity();

-- Reload PostgREST schema cache
NOTIFY pgrst, 'reload schema';
