import { fetchUserLedgerBalance, UserLedgerSummary } from './ledger';

export interface PlayerProgression {
  totalGP: number;
  level: number;
  currentLevelXP: number;
  xpToNextLevel: number;
  progressPercent: number;
  title: string;
  wildXP: number;
  circularGP: number;
}

export function calculateProgressionFromTotal(totalGP: number): Omit<PlayerProgression, 'totalGP' | 'wildXP' | 'circularGP'> {
  const level = Math.floor(totalGP / 100) + 1;
  const currentLevelXP = totalGP % 100;
  const xpToNextLevel = 100 - currentLevelXP;
  const progressPercent = currentLevelXP;

  let title = 'Eco Novice';
  if (level === 2) title = 'Bio-Guardian';
  else if (level === 3) title = 'Territory Ranger';
  else if (level >= 4) title = 'Legendary Steward';

  return {
    level,
    currentLevelXP,
    xpToNextLevel,
    progressPercent,
    title,
  };
}

/**
 * Derives user level, level title, and XP progress bar state using 
 * the single source of truth helper: fetchUserLedgerBalance.
 */
export async function fetchUserProgression(userId: string): Promise<PlayerProgression> {
  const summary: UserLedgerSummary = await fetchUserLedgerBalance(userId);
  const prog = calculateProgressionFromTotal(summary.total_gp);

  return {
    totalGP: summary.total_gp,
    wildXP: summary.wild_xp,
    circularGP: summary.circular_payout,
    ...prog,
  };
}
