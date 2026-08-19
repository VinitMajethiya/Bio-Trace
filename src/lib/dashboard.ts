import { supabase } from './supabase';
import { fetchSocieties, SEED_SOCIETIES, Society } from './society';

export interface SocietyDashboardItem extends Society {
  rank: number;
}

export interface SocietyBreakdown {
  societyId: string;
  wildXP: number;
  circularGP: number;
  totalGP: number;
  wildPercent: number; // 0 - 100
  circularPercent: number; // 0 - 100
  memberCount: number;
}

export interface SocietyInsight {
  type: 'wild_dominant' | 'balanced' | 'circular_dominant';
  title: string;
  suggestion: string;
  badgeLabel: string;
  badgeVariant: 'warning' | 'success' | 'info';
}

export interface SocietyMemberContribution {
  userId: string;
  displayName: string;
  totalGP: number;
  wildXP: number;
  circularGP: number;
  rank: number;
}

/**
 * Fetches all societies aggregated and ranked by Health Score.
 */
export async function fetchMultiSocietyDashboard(): Promise<SocietyDashboardItem[]> {
  try {
    const list = await fetchSocieties();
    const sorted = [...list].sort((a, b) => b.health_score - a.health_score);
    return sorted.map((item, idx) => ({
      ...item,
      rank: idx + 1,
    }));
  } catch (err) {
    console.error('[Dashboard] Error fetching multi-society dashboard:', err);
    return SEED_SOCIETIES.map((s, idx) => ({ ...s, rank: idx + 1 }));
  }
}

/**
 * Fetches Wild vs. Circular health score contribution breakdown for a specific society.
 * Scoped strictly to users where `society_id = societyId` (excluding any users with society_id IS NULL).
 */
export async function fetchSocietyBreakdown(societyId: string): Promise<SocietyBreakdown> {
  try {
    // 1. Fetch user IDs belonging exclusively to this society (ignoring NULL society_id users)
    const { data: members, error: memError } = await supabase
      .from('users')
      .select('id')
      .eq('society_id', societyId);

    if (memError || !members || members.length === 0) {
      return {
        societyId,
        wildXP: 0,
        circularGP: 0,
        totalGP: 0,
        wildPercent: 50,
        circularPercent: 50,
        memberCount: 0,
      };
    }

    const memberIds = members.map((m) => m.id);

    // 2. Fetch ledger transactions for member IDs
    const { data: ledger, error: ledgerError } = await supabase
      .from('greenpoints_ledger')
      .select('source, amount')
      .in('user_id', memberIds);

    if (ledgerError || !ledger || ledger.length === 0) {
      return {
        societyId,
        wildXP: 0,
        circularGP: 0,
        totalGP: 0,
        wildPercent: 50,
        circularPercent: 50,
        memberCount: memberIds.length,
      };
    }

    let wildXP = 0;
    let circularGP = 0;

    ledger.forEach((item) => {
      const amt = Number(item.amount || 0);
      if (item.source === 'wild_xp') {
        wildXP += amt;
      } else if (item.source === 'circular_payout') {
        circularGP += amt;
      }
    });

    const totalGP = wildXP + circularGP;

    if (totalGP === 0) {
      return {
        societyId,
        wildXP: 0,
        circularGP: 0,
        totalGP: 0,
        wildPercent: 50,
        circularPercent: 50,
        memberCount: memberIds.length,
      };
    }

    const wildPercent = Math.round((wildXP / totalGP) * 100);
    const circularPercent = 100 - wildPercent;

    return {
      societyId,
      wildXP,
      circularGP,
      totalGP,
      wildPercent,
      circularPercent,
      memberCount: memberIds.length,
    };
  } catch (err) {
    console.error('[Dashboard] Error calculating society breakdown:', err);
    return {
      societyId,
      wildXP: 0,
      circularGP: 0,
      totalGP: 0,
      wildPercent: 50,
      circularPercent: 50,
      memberCount: 0,
    };
  }
}

/**
 * Generates rule-based improvement insights based on Wild vs. Circular percentages.
 * 
 * BOUNDARY CONDITIONS:
 * - wildPercent > 60: Wild-Dominant
 * - wildPercent >= 40 && wildPercent <= 60: Balanced (inclusive of 40% and 60%)
 * - wildPercent < 40: Circular-Dominant (circularPercent > 60)
 * 
 * Mutually exclusive, gapless coverage over [0%, 100%].
 */
export function generateSocietyInsight(wildPercent: number, circularPercent: number): SocietyInsight {
  if (wildPercent > 60) {
    const diff = wildPercent - circularPercent;
    return {
      type: 'wild_dominant',
      title: 'Diverted Waste Deficit',
      suggestion: `Wild species sightings lead by ${diff}%! Schedule a campus waste pickup & locker drop-off campaign to boost Circular health.`,
      badgeLabel: 'Needs Circular Focus',
      badgeVariant: 'warning',
    };
  }

  if (wildPercent >= 40 && wildPercent <= 60) {
    return {
      type: 'balanced',
      title: 'Optimal Ecosystem Balance',
      suggestion: `Excellent stewardship! Both Wild biodiversity observations (${wildPercent}%) and Circular recycling (${circularPercent}%) are actively thriving.`,
      badgeLabel: 'Balanced Ecosystem',
      badgeVariant: 'success',
    };
  }

  // wildPercent < 40 (i.e. circularPercent > 60)
  const diff = circularPercent - wildPercent;
  return {
    type: 'circular_dominant',
    title: 'Biodiversity Observation Deficit',
    suggestion: `Circular waste recycling leads by ${diff}%! Organize a weekend native bird and flora walk to increase Wild species documentation.`,
    badgeLabel: 'Needs Wild Focus',
    badgeVariant: 'info',
  };
}

/**
 * Fetches top contributing members for a specific society.
 * Scoped strictly to users where `society_id = societyId` (excluding any users with society_id IS NULL).
 */
export async function fetchSocietyTopContributors(societyId: string): Promise<SocietyMemberContribution[]> {
  try {
    // 1. Fetch society members
    const { data: members, error: memError } = await supabase
      .from('users')
      .select('id, display_name')
      .eq('society_id', societyId);

    if (memError || !members || members.length === 0) {
      return [];
    }

    const memberIds = members.map((m) => m.id);
    const memberNameMap: Record<string, string> = {};
    members.forEach((m) => {
      memberNameMap[m.id] = m.display_name || 'Eco Member';
    });

    // 2. Fetch ledger entries for society members
    const { data: ledger, error: ledgerError } = await supabase
      .from('greenpoints_ledger')
      .select('user_id, source, amount')
      .in('user_id', memberIds);

    if (ledgerError || !ledger || ledger.length === 0) {
      return members.map((m, idx) => ({
        userId: m.id,
        displayName: m.display_name || 'Eco Member',
        totalGP: 0,
        wildXP: 0,
        circularGP: 0,
        rank: idx + 1,
      }));
    }

    const totalsMap: Record<string, { wild: number; circ: number; total: number }> = {};
    memberIds.forEach((id) => {
      totalsMap[id] = { wild: 0, circ: 0, total: 0 };
    });

    ledger.forEach((tx) => {
      const uId = tx.user_id;
      if (totalsMap[uId]) {
        const amt = Number(tx.amount || 0);
        if (tx.source === 'wild_xp') {
          totalsMap[uId].wild += amt;
        } else if (tx.source === 'circular_payout') {
          totalsMap[uId].circ += amt;
        }
        totalsMap[uId].total += amt;
      }
    });

    const list: SocietyMemberContribution[] = Object.entries(totalsMap).map(([uId, data]) => ({
      userId: uId,
      displayName: memberNameMap[uId] || 'Eco Member',
      totalGP: data.total,
      wildXP: data.wild,
      circularGP: data.circ,
      rank: 0,
    }));

    const sorted = list.sort((a, b) => b.totalGP - a.totalGP);
    return sorted.map((item, idx) => ({
      ...item,
      rank: idx + 1,
    }));
  } catch (err) {
    console.error('[Dashboard] Error fetching society top contributors:', err);
    return [];
  }
}
