import { supabase } from './supabase';

export const PILOT_TERRITORY_ID = '00000000-0000-0000-0000-000000000001';

export interface Territory {
  id: string;
  name: string;
  health_score: number;
  updated_at: string;
}

/**
 * Fetches the pilot territory record (SGU Campus) from Supabase.
 */
export async function fetchPilotTerritory(): Promise<Territory | null> {
  try {
    const { data, error } = await supabase
      .from('territories')
      .select('id, name, health_score, updated_at')
      .eq('id', PILOT_TERRITORY_ID)
      .single();

    if (error) {
      console.warn('Error fetching pilot territory:', error.message);
      return null;
    }
    return data as Territory;
  } catch (err) {
    console.error('Failed to fetch territory:', err);
    return null;
  }
}

/**
 * Calls Supabase RPC function to increment/decrement Ecosystem Health Score.
 */
export async function incrementHealthScore(
  territoryId: string = PILOT_TERRITORY_ID,
  delta: number
): Promise<number | null> {
  try {
    const { data, error } = await supabase.rpc('increment_health_score', {
      t_id: territoryId,
      delta,
    });

    if (error) {
      console.warn('Error calling increment_health_score RPC:', error.message);
      return null;
    }
    return data as number;
  } catch (err) {
    console.error('Failed to update health score:', err);
    return null;
  }
}

/**
 * Subscribes to real-time changes on the territories table.
 */
export function subscribeToTerritoryChanges(
  territoryId: string,
  onUpdate: (updatedTerritory: Partial<Territory>) => void
) {
  const channel = supabase
    .channel(`territory-changes-${territoryId}`)
    .on(
      'postgres_changes',
      {
        event: 'UPDATE',
        schema: 'public',
        table: 'territories',
        filter: `id=eq.${territoryId}`,
      },
      (payload) => {
        if (payload.new) {
          onUpdate(payload.new as Partial<Territory>);
        }
      }
    )
    .subscribe();

  return () => {
    supabase.removeChannel(channel);
  };
}
