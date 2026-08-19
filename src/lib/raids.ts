import { supabase } from './supabase';
import { recordGreenPointsTransaction } from './ledger';
import { incrementSocietyHealthScore } from './society';
import { PILOT_TERRITORY_ID, incrementHealthScore } from './territory';


export interface CleanRaid {
  id: string;
  society_id: string;
  created_by: string;
  title: string;
  lat: number;
  lng: number;
  scheduled_at: string;
  status: 'active' | 'completed' | 'cancelled';
  created_at?: string;
  participant_count?: number;
}

export interface RaidParticipant {
  id: string;
  raid_id: string;
  user_id: string;
  before_photo_url?: string;
  after_photo_url?: string;
  status: 'joined' | 'before_submitted' | 'submitted' | 'approved' | 'rejected';
  created_at?: string;
}

/**
 * Creates a new Clean Raid.
 * Derive society_id directly from creator's own society_id (userSocietyId) — preventing cross-society raid creation.
 */
export async function createCleanRaid(
  createdByUserId: string,
  userSocietyId: string,
  title: string,
  lat: number,
  lng: number,
  scheduledAt?: string
): Promise<{ success: boolean; raid?: CleanRaid; error?: string }> {
  try {
    if (!userSocietyId) {
      return { success: false, error: 'User does not belong to an active society.' };
    }

    const { data, error } = await supabase
      .from('raids')
      .insert([
        {
          society_id: userSocietyId,
          created_by: createdByUserId,
          title: title.trim(),
          lat,
          lng,
          scheduled_at: scheduledAt || new Date().toISOString(),
          status: 'active',
        },
      ])
      .select()
      .single();

    if (error) {
      console.error('[Raids] Error creating raid:', error.message);
      return { success: false, error: error.message };
    }

    return { success: true, raid: data as CleanRaid };
  } catch (err: any) {
    console.error('[Raids] Exception creating raid:', err);
    return { success: false, error: err.message || 'Failed to create raid' };
  }
}

/**
 * Fetches active raids from Supabase (optionally filtered by society).
 */
export async function fetchActiveRaids(societyId?: string): Promise<CleanRaid[]> {
  try {
    let query = supabase
      .from('raids')
      .select('*')
      .eq('status', 'active')
      .order('scheduled_at', { ascending: true });

    if (societyId) {
      query = query.eq('society_id', societyId);
    }

    const { data: raids, error } = await query;

    if (error || !raids) {
      console.warn('[Raids] Error fetching active raids:', error?.message);
      return [];
    }

    // Fetch participant counts for each raid
    const { data: participants } = await supabase
      .from('raid_participants')
      .select('raid_id');

    const pCounts: Record<string, number> = {};
    (participants || []).forEach((p) => {
      pCounts[p.raid_id] = (pCounts[p.raid_id] || 0) + 1;
    });

    return raids.map((r) => ({
      ...r,
      lat: Number(r.lat),
      lng: Number(r.lng),
      participant_count: pCounts[r.id] || 0,
    })) as CleanRaid[];
  } catch (err) {
    console.error('[Raids] Exception fetching active raids:', err);
    return [];
  }
}

/**
 * Joins a Clean Raid for the current user.
 */
export async function joinCleanRaid(
  raidId: string,
  userId: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const { error } = await supabase
      .from('raid_participants')
      .upsert(
        [
          {
            raid_id: raidId,
            user_id: userId,
            status: 'joined',
          },
        ],
        { onConflict: 'raid_id, user_id' }
      );

    if (error) {
      console.error('[Raids] Error joining raid:', error.message);
      return { success: false, error: error.message };
    }

    return { success: true };
  } catch (err: any) {
    return { success: false, error: err.message || 'Failed to join raid' };
  }
}

/**
 * Checks if user is currently joined/participating in a raid.
 */
export async function getUserRaidParticipantStatus(
  raidId: string,
  userId: string
): Promise<RaidParticipant | null> {
  try {
    const { data, error } = await supabase
      .from('raid_participants')
      .select('*')
      .eq('raid_id', raidId)
      .eq('user_id', userId)
      .maybeSingle();

    if (error || !data) return null;
    return data as RaidParticipant;
  } catch (err) {
    return null;
  }
}

import { uploadRaidPhotoToStorage } from './storage';

/**
 * Submits the pre-cleanup (Before) photo for a raid participant.
 * Uploads file to Supabase Storage and updates before_photo_url & status = 'before_submitted'.
 */
export async function submitRaidBeforePhoto(
  participantId: string,
  base64Photo: string
): Promise<{ success: boolean; photoUrl?: string; error?: string }> {
  try {
    const photoUrl = await uploadRaidPhotoToStorage(participantId, 'before', base64Photo);

    const { error } = await supabase
      .from('raid_participants')
      .update({
        before_photo_url: photoUrl,
        status: 'before_submitted',
      })
      .eq('id', participantId);

    if (error) {
      console.error('[Raids] Error updating before photo:', error.message);
      return { success: false, error: error.message };
    }

    return { success: true, photoUrl };
  } catch (err: any) {
    return { success: false, error: err.message || 'Failed to submit before photo' };
  }
}

/**
 * Submits the post-cleanup (After) photo for a raid participant.
 * Uploads file to Supabase Storage and updates after_photo_url & status = 'submitted'.
 */
export async function submitRaidAfterPhoto(
  participantId: string,
  base64Photo: string
): Promise<{ success: boolean; photoUrl?: string; error?: string }> {
  try {
    const photoUrl = await uploadRaidPhotoToStorage(participantId, 'after', base64Photo);

    const { error } = await supabase
      .from('raid_participants')
      .update({
        after_photo_url: photoUrl,
        status: 'submitted',
      })
      .eq('id', participantId);

    if (error) {
      console.error('[Raids] Error updating after photo:', error.message);
      return { success: false, error: error.message };
    }

    return { success: true, photoUrl };
  } catch (err: any) {
    return { success: false, error: err.message || 'Failed to submit after photo' };
  }
}

export interface PendingRaidSubmission {
  id: string; // raid_participant_id
  raid_id: string;
  raid_title: string;
  user_id: string;
  user_display_name: string;
  before_photo_url: string;
  after_photo_url: string;
  created_at: string;
}

/**
 * Fetches pending photo submissions for raids belonging ONLY to the specified society.
 * Enforces database-level filtering via society_id before fetching participants.
 */
export async function fetchPendingModeratorSubmissions(
  moderatorSocietyId: string
): Promise<PendingRaidSubmission[]> {
  try {
    if (!moderatorSocietyId) return [];

    // 1. Fetch raid IDs belonging strictly to moderator's society at DB level
    const { data: raids, error: raidErr } = await supabase
      .from('raids')
      .select('id, title')
      .eq('society_id', moderatorSocietyId);

    if (raidErr || !raids || raids.length === 0) return [];

    const raidIds = raids.map((r) => r.id);
    const raidTitleMap: Record<string, string> = {};
    raids.forEach((r) => {
      raidTitleMap[r.id] = r.title;
    });

    // 2. Fetch submitted participants for these specific raid IDs at DB level
    const { data: participants, error: partErr } = await supabase
      .from('raid_participants')
      .select('*')
      .in('raid_id', raidIds)
      .eq('status', 'submitted')
      .order('created_at', { ascending: false });

    if (partErr || !participants || participants.length === 0) return [];

    // 3. Fetch user display names
    const userIds = Array.from(new Set(participants.map((p) => p.user_id)));
    const { data: users } = await supabase
      .from('users')
      .select('id, full_name, email')
      .in('id', userIds);

    const userNameMap: Record<string, string> = {};
    (users || []).forEach((u) => {
      userNameMap[u.id] = u.full_name || u.email?.split('@')[0] || 'Eco Quest Participant';
    });

    return participants.map((p) => ({
      id: p.id,
      raid_id: p.raid_id,
      raid_title: raidTitleMap[p.raid_id] || 'Clean Raid',
      user_id: p.user_id,
      user_display_name: userNameMap[p.user_id] || 'Eco Quest Participant',
      before_photo_url: p.before_photo_url || '',
      after_photo_url: p.after_photo_url || '',
      created_at: p.created_at || new Date().toISOString(),
    }));
  } catch (err) {
    console.error('[Raids] Error fetching moderator pending submissions:', err);
    return [];
  }
}

/**
 * Reviews a participant submission: updates status to 'approved' or 'rejected'.
 * Stage 10.5 Extensions:
 * - On 'approved':
 *   1. Writes greenpoints_ledger entry for user with source = 'raid_bonus' and amount = 100
 *   2. Bumps society health score (+15) via atomic increment_society_health_score RPC
 *   3. Bumps global territory health score (+15) via increment_health_score RPC
 * - On 'rejected':
 *   No ledger entry, no health score bump.
 * - Auto-completion:
 *   If no remaining submissions for the raid are in 'submitted' status, updates raid status to 'completed'.
 */
export async function reviewRaidParticipantSubmission(
  participantId: string,
  status: 'approved' | 'rejected'
): Promise<{ success: boolean; error?: string }> {
  try {
    // 1. Fetch participant info before updating
    const { data: part, error: fetchErr } = await supabase
      .from('raid_participants')
      .select('id, raid_id, user_id, status')
      .eq('id', participantId)
      .single();

    if (fetchErr || !part) {
      return { success: false, error: fetchErr?.message || 'Participant submission not found' };
    }

    // 2. Update participant status
    const { error: updateErr } = await supabase
      .from('raid_participants')
      .update({ status })
      .eq('id', participantId);

    if (updateErr) {
      console.error('[Raids] Error reviewing participant submission:', updateErr.message);
      return { success: false, error: updateErr.message };
    }

    // 3. On Approval: Award points & bump Health Scores
    if (status === 'approved') {
      // Award 100 GreenPoints for camera-verified raid participation
      await recordGreenPointsTransaction({
        user_id: part.user_id,
        source: 'raid_bonus',
        amount: 100,
      });

      // Fetch raid's society_id to bump society health score atomically
      const { data: raid } = await supabase
        .from('raids')
        .select('society_id')
        .eq('id', part.raid_id)
        .single();

      if (raid?.society_id) {
        await incrementSocietyHealthScore(raid.society_id, 15);
      }

      // Also bump global map territory health score
      await incrementHealthScore(PILOT_TERRITORY_ID, 15);
    }

    // 4. Check if raid is now resolved (0 pending 'submitted' participants remaining)
    const { data: pendingParts } = await supabase
      .from('raid_participants')
      .select('id')
      .eq('raid_id', part.raid_id)
      .eq('status', 'submitted');

    if (!pendingParts || pendingParts.length === 0) {
      await supabase
        .from('raids')
        .update({ status: 'completed' })
        .eq('id', part.raid_id);
    }

    return { success: true };
  } catch (err: any) {
    return { success: false, error: err.message || 'Failed to update submission decision' };
  }
}

export interface CompletedRaidHistoryItem {
  id: string;
  society_id: string;
  title: string;
  scheduled_at: string;
  total_participants: number;
  approved_count: number;
  rejected_count: number;
}

/**
 * Fetches completed clean raids for a specific society along with participant approval/rejection tallies.
 */
export async function fetchCompletedRaidHistory(
  societyId: string
): Promise<CompletedRaidHistoryItem[]> {
  try {
    if (!societyId) return [];

    // 1. Fetch completed raids for the given society
    const { data: raids, error: raidErr } = await supabase
      .from('raids')
      .select('id, society_id, title, scheduled_at, status')
      .eq('society_id', societyId)
      .eq('status', 'completed')
      .order('scheduled_at', { ascending: false });

    if (raidErr || !raids || raids.length === 0) {
      return [];
    }

    const raidIds = raids.map((r) => r.id);

    // 2. Fetch raid_participants records for these raids
    const { data: participants, error: partErr } = await supabase
      .from('raid_participants')
      .select('raid_id, status')
      .in('raid_id', raidIds);

    const partList = participants || [];

    // 3. Tally total, approved, rejected per raid
    const countsMap: Record<string, { total: number; approved: number; rejected: number }> = {};
    raidIds.forEach((rId) => {
      countsMap[rId] = { total: 0, approved: 0, rejected: 0 };
    });

    partList.forEach((p) => {
      if (countsMap[p.raid_id]) {
        countsMap[p.raid_id].total += 1;
        if (p.status === 'approved') {
          countsMap[p.raid_id].approved += 1;
        } else if (p.status === 'rejected') {
          countsMap[p.raid_id].rejected += 1;
        }
      }
    });

    return raids.map((r) => ({
      id: r.id,
      society_id: r.society_id,
      title: r.title,
      scheduled_at: r.scheduled_at,
      total_participants: countsMap[r.id]?.total || 0,
      approved_count: countsMap[r.id]?.approved || 0,
      rejected_count: countsMap[r.id]?.rejected || 0,
    }));
  } catch (err) {
    console.error('[Raids] Error fetching completed raid history:', err);
    return [];
  }
}

/**
 * Fetches a single raid by ID.
 */
export async function fetchRaidById(raidId: string): Promise<CleanRaid | null> {
  try {
    const { data, error } = await supabase
      .from('raids')
      .select('*')
      .eq('id', raidId)
      .single();

    if (error || !data) return null;
    return {
      ...data,
      lat: Number(data.lat),
      lng: Number(data.lng),
    } as CleanRaid;
  } catch (err) {
    return null;
  }
}

/**
 * Alias for fetching user raid participant.
 */
export async function fetchUserRaidParticipant(raidId: string, userId: string): Promise<RaidParticipant | null> {
  return getUserRaidParticipantStatus(raidId, userId);
}


