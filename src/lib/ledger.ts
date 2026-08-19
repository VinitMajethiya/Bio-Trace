import { supabase } from './supabase';

export interface LedgerEntry {
  id?: string;
  user_id: string;
  source: 'wild_xp' | 'circular_payout' | 'raid_bonus' | 'species_observation' | 'waste_pickup';
  amount: number;
  zone_tier?: 'home' | 'nearby' | 'remote';
  related_observation_id?: string | null;
  related_transaction_id?: string | null;
  created_at?: string;
}

export interface UserLedgerSummary {
  total_gp: number;
  wild_xp: number;
  circular_payout: number;
  raid_bonus: number;
  entries: LedgerEntry[];
}

/**
 * Fetches user's GreenPoints ledger history and calculates totals.
 */
export async function fetchUserLedgerBalance(userId: string): Promise<UserLedgerSummary> {
  try {
    const { data, error } = await supabase
      .from('greenpoints_ledger')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) {
      console.warn('Error fetching user ledger:', error.message);
      return { total_gp: 0, wild_xp: 0, circular_payout: 0, raid_bonus: 0, entries: [] };
    }

    const entries = (data || []) as LedgerEntry[];
    let wild_xp = 0;
    let circular_payout = 0;
    let raid_bonus = 0;

    entries.forEach((e) => {
      if (e.source === 'wild_xp') {
        wild_xp += Number(e.amount || 0);
      } else if (e.source === 'circular_payout') {
        circular_payout += Number(e.amount || 0);
      } else if (e.source === 'raid_bonus') {
        raid_bonus += Number(e.amount || 0);
      }
    });

    return {
      total_gp: wild_xp + circular_payout + raid_bonus,
      wild_xp,
      circular_payout,
      raid_bonus,
      entries,
    };
  } catch (err) {
    console.error('Failed to fetch ledger balance:', err);
    return { total_gp: 0, wild_xp: 0, circular_payout: 0, raid_bonus: 0, entries: [] };
  }
}

/**
 * Adds a new GreenPoints transaction entry to greenpoints_ledger.
 */
export async function recordGreenPointsTransaction(entry: LedgerEntry): Promise<LedgerEntry | null> {
  try {
    const payload = {
      ...entry,
      zone_tier: entry.zone_tier || 'remote',
    };
    const { data, error } = await supabase
      .from('greenpoints_ledger')
      .insert([payload])
      .select()
      .single();

    if (error) {
      console.warn('Error inserting ledger transaction:', error.message);
      return null;
    }

    return data as LedgerEntry;
  } catch (err) {
    console.error('Failed to record greenpoints transaction:', err);
    return null;
  }
}
