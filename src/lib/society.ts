import { supabase } from './supabase';

export interface Society {
  id: string;
  name: string;
  boundary: string;
  health_score: number;
  created_at?: string;
}

export interface UserSocietyInfo {
  society_id: string | null;
  moderator_of_society_id: string | null;
  society_name?: string;
  is_moderator?: boolean;
}

export interface ElectionCandidate {
  id: string;
  user_id: string;
  display_name: string;
  society_id: string;
  vote_count: number;
  has_voted_for?: boolean;
}

export const SEED_SOCIETIES: Society[] = [
  {
    id: '11111111-1111-1111-1111-111111111111',
    name: 'SGU Campus Eco-Zone',
    boundary: 'Campus Center, Quad & Botanical Arboretum',
    health_score: 88,
  },
  {
    id: '22222222-2222-2222-2222-222222222222',
    name: 'Silver Creek Green Heights',
    boundary: 'Residential Towers Block A-D & Community Gardens',
    health_score: 76,
  },
  {
    id: '33333333-3333-3333-3333-333333333333',
    name: 'Meadowbrook Lake District',
    boundary: 'Lakeside Boardwalk & Wetland Conservation Park',
    health_score: 92,
  },
];

/**
 * Fetches list of societies from Supabase (or fallback seed list if DB is unpopulated).
 */
export async function fetchSocieties(): Promise<Society[]> {
  try {
    const { data, error } = await supabase
      .from('societies')
      .select('*')
      .order('name', { ascending: true });

    if (error || !data || data.length === 0) {
      console.log('[Society] Supabase societies empty/unpopulated, returning SEED_SOCIETIES');
      return SEED_SOCIETIES;
    }

    return data as Society[];
  } catch (err) {
    console.warn('[Society] Error fetching societies from Supabase:', err);
    return SEED_SOCIETIES;
  }
}

/**
 * Fetches single society by ID.
 */
export async function fetchSocietyById(societyId: string): Promise<Society | null> {
  try {
    const { data, error } = await supabase
      .from('societies')
      .select('*')
      .eq('id', societyId)
      .single();

    if (error || !data) {
      return SEED_SOCIETIES.find((s) => s.id === societyId) || null;
    }
    return data as Society;
  } catch (err) {
    return SEED_SOCIETIES.find((s) => s.id === societyId) || null;
  }
}

/**
 * Updates user's active society in Supabase `users` table.
 * Direct database mutation guarantee.
 */
export async function joinSociety(userId: string, societyId: string): Promise<{ success: boolean; error?: string }> {
  try {
    const { error } = await supabase
      .from('users')
      .update({ society_id: societyId })
      .eq('id', userId);

    if (error) {
      console.error('[Society] Failed to join society in Supabase:', error.message);
      return { success: false, error: error.message };
    }

    console.log(`[Society] User ${userId} successfully joined society ${societyId} in Supabase`);
    return { success: true };
  } catch (err: any) {
    console.error('[Society] Exception joining society:', err);
    return { success: false, error: err.message || 'Failed to update society in database' };
  }
}

/**
 * Fetches user's current society and moderator status directly from Supabase `users` table.
 */
export async function getUserSocietyInfo(userId: string): Promise<UserSocietyInfo> {
  try {
    const { data, error } = await supabase
      .from('users')
      .select('society_id, moderator_of_society_id')
      .eq('id', userId)
      .single();

    if (error || !data) {
      return { society_id: null, moderator_of_society_id: null, is_moderator: false };
    }

    const societyId = data.society_id;
    const moderatorSocietyId = data.moderator_of_society_id;

    let societyName: string | undefined;
    if (societyId) {
      const s = await fetchSocietyById(societyId);
      societyName = s?.name;
    }

    return {
      society_id: societyId,
      moderator_of_society_id: moderatorSocietyId,
      society_name: societyName,
      is_moderator: !!moderatorSocietyId && moderatorSocietyId === societyId,
    };
  } catch (err) {
    console.warn('[Society] Error fetching user society info:', err);
    return { society_id: null, moderator_of_society_id: null, is_moderator: false };
  }
}

/**
 * Self-nominates a user as an election candidate for a specific society in Supabase `moderator_candidates`.
 */
export async function nominateSelfForModerator(
  userId: string,
  societyId: string,
  displayName: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const { error } = await supabase
      .from('moderator_candidates')
      .insert([
        {
          user_id: userId,
          society_id: societyId,
          display_name: displayName,
        },
      ]);

    if (error) {
      if (error.code === '23505') {
        return { success: false, error: 'You are already nominated for this society election.' };
      }
      return { success: false, error: error.message };
    }

    return { success: true };
  } catch (err: any) {
    return { success: false, error: err.message || 'Nomination failed' };
  }
}

/**
 * Fetches nominated candidates and live vote tallies for a society from Supabase.
 */
export async function fetchElectionCandidates(
  societyId: string,
  currentUserId?: string
): Promise<ElectionCandidate[]> {
  try {
    // 1. Fetch candidates for society
    const { data: candidates, error: candError } = await supabase
      .from('moderator_candidates')
      .select('*')
      .eq('society_id', societyId);

    if (candError || !candidates) {
      return [];
    }

    // 2. Fetch all votes cast in this society election
    const { data: votes, error: votesError } = await supabase
      .from('moderator_votes')
      .select('*')
      .eq('society_id', societyId);

    const voteList = votes || [];

    // 3. Map candidates with vote tallies
    const result: ElectionCandidate[] = candidates.map((c) => {
      const count = voteList.filter((v) => v.candidate_id === c.user_id).length;
      const hasVotedFor = currentUserId
        ? voteList.some((v) => v.voter_id === currentUserId && v.candidate_id === c.user_id)
        : false;

      return {
        id: c.id,
        user_id: c.user_id,
        display_name: c.display_name,
        society_id: c.society_id,
        vote_count: count,
        has_voted_for: hasVotedFor,
      };
    });

    return result.sort((a, b) => b.vote_count - a.vote_count);
  } catch (err) {
    console.error('[Society] Error fetching election candidates:', err);
    return [];
  }
}

/**
 * Casts or changes a user's vote for a moderator candidate in Supabase `moderator_votes`.
 */
export async function castModeratorVote(
  voterId: string,
  candidateUserId: string,
  societyId: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const { error } = await supabase
      .from('moderator_votes')
      .upsert(
        [
          {
            voter_id: voterId,
            candidate_id: candidateUserId,
            society_id: societyId,
          },
        ],
        { onConflict: 'voter_id, society_id' }
      );

    if (error) {
      console.error('[Society] Failed to cast vote:', error.message);
      return { success: false, error: error.message };
    }

    return { success: true };
  } catch (err: any) {
    return { success: false, error: err.message || 'Voting failed' };
  }
}

/**
 * Tallies votes and sets top vote-getter as society moderator in Supabase `users`.
 * 
 * GUARDS:
 * 1. Caller Membership Guard: caller's society_id MUST match targetSocietyId.
 * 2. Non-zero Vote Guard: Total votes cast in society MUST be > 0.
 */
export async function closeElectionAndElectModerator(
  callerUserId: string,
  callerSocietyId: string | null,
  targetSocietyId: string
): Promise<{ success: boolean; winnerName?: string; winnerId?: string; error?: string }> {
  try {
    // GUARD 1: Require caller to be a member of the target society
    if (!callerSocietyId || callerSocietyId !== targetSocietyId) {
      return {
        success: false,
        error: 'Permission Denied: Only members of this society can close its election.',
      };
    }

    // Fetch all votes cast for this society
    const { data: votes, error: votesError } = await supabase
      .from('moderator_votes')
      .select('*')
      .eq('society_id', targetSocietyId);

    if (votesError) {
      return { success: false, error: votesError.message };
    }

    const voteList = votes || [];

    // GUARD 2: Reject election close if total votes == 0
    if (voteList.length === 0) {
      return {
        success: false,
        error: 'Cannot Close Election: Zero votes have been cast so far.',
      };
    }

    // Tally votes per candidate_id
    const voteCounts: Record<string, number> = {};
    voteList.forEach((v) => {
      voteCounts[v.candidate_id] = (voteCounts[v.candidate_id] || 0) + 1;
    });

    let topCandidateId = '';
    let maxVotes = -1;

    Object.entries(voteCounts).forEach(([candidateId, count]) => {
      if (count > maxVotes) {
        maxVotes = count;
        topCandidateId = candidateId;
      }
    });

    if (!topCandidateId) {
      return { success: false, error: 'No valid candidate found with votes.' };
    }

    // Fetch winner display name
    const { data: winnerUser } = await supabase
      .from('users')
      .select('display_name')
      .eq('id', topCandidateId)
      .single();

    const winnerName = winnerUser?.display_name || 'Elected Moderator';

    // Update DB setting moderator_of_society_id for the winner
    const { error: updateError } = await supabase
      .from('users')
      .update({ moderator_of_society_id: targetSocietyId })
      .eq('id', topCandidateId);

    if (updateError) {
      return { success: false, error: updateError.message };
    }

    console.log(`[Society] Election closed for society ${targetSocietyId}. Winner: ${winnerName} (${topCandidateId}) with ${maxVotes} votes.`);

    return {
      success: true,
      winnerName,
      winnerId: topCandidateId,
    };
  } catch (err: any) {
    return { success: false, error: err.message || 'Failed to close election' };
  }
}

/**
 * Calls Supabase RPC function to atomically increment/decrement Society Health Score.
 */
export async function incrementSocietyHealthScore(
  societyId: string,
  delta: number
): Promise<number | null> {
  try {
    const { data, error } = await supabase.rpc('increment_society_health_score', {
      s_id: societyId,
      delta,
    });

    if (error) {
      console.warn('[Society] Error calling increment_society_health_score RPC:', error.message);
      return null;
    }
    return data as number;
  } catch (err) {
    console.error('[Society] Failed to update society health score:', err);
    return null;
  }
}

