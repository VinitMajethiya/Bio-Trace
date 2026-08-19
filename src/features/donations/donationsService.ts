import { supabase } from '../../lib/supabase';
import { base64ToArrayBuffer } from '../../lib/storage';
import {
  DonationFeedItem,
  DonationRequestItem,
  CreateDonationPayload,
  SubmitRequestPayload,
  RevealedContactBundle,
} from './types';
import * as FileSystem from 'expo-file-system';

/**
 * Calculates Haversine distance in km between two GPS coordinates
 */
export function calculateHaversineDistance(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 6371; // Earth radius in km
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return Math.round(R * c * 10) / 10;
}

/**
 * Fetches public active listings from v_donations_feed
 */
export async function fetchDonationsFeed(
  categoryFilter?: string,
  userLat?: number,
  userLng?: number,
  maxDistanceKm?: number
): Promise<DonationFeedItem[]> {
  try {
    let query = supabase
      .from('v_donations_feed')
      .select('*')
      .order('created_at', { ascending: false });

    if (categoryFilter && categoryFilter !== 'all') {
      query = query.eq('category', categoryFilter);
    }

    const { data, error } = await query;
    if (error) {
      console.warn('Error fetching donations feed:', error.message);
      return [];
    }

    let items: DonationFeedItem[] = (data || []).map((row: any) => {
      let distanceKm: number | undefined = undefined;
      if (userLat !== undefined && userLng !== undefined && row.fuzzed_lat && row.fuzzed_lng) {
        distanceKm = calculateHaversineDistance(userLat, userLng, row.fuzzed_lat, row.fuzzed_lng);
      }
      return {
        ...row,
        distanceKm,
      };
    });

    // Distance filter if requested
    if (maxDistanceKm !== undefined && userLat !== undefined && userLng !== undefined) {
      items = items.filter((item) => (item.distanceKm ?? 999) <= maxDistanceKm);
    }

    // Sort: NGO verified first, then closest distance, then newest
    items.sort((a, b) => {
      if (a.ngo_verified && !b.ngo_verified) return -1;
      if (!a.ngo_verified && b.ngo_verified) return 1;
      if (a.distanceKm !== undefined && b.distanceKm !== undefined) {
        return a.distanceKm - b.distanceKm;
      }
      return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
    });

    return items;
  } catch (err) {
    console.error('Failed to fetch donations feed:', err);
    return [];
  }
}

/**
 * Fetches listings created by the logged-in user with incoming requests
 */
export async function fetchMyDonations(donorId: string): Promise<{
  donations: DonationFeedItem[];
  requests: DonationRequestItem[];
}> {
  try {
    const [donationsRes, requestsRes] = await Promise.all([
      supabase
        .from('donations')
        .select('*')
        .eq('donor_id', donorId)
        .order('created_at', { ascending: false }),
      supabase
        .from('donation_requests')
        .select('*, donations!inner(*)')
        .eq('donations.donor_id', donorId)
        .order('requested_at', { ascending: false }),
    ]);

    const donations = (donationsRes.data || []) as DonationFeedItem[];
    const requests = (requestsRes.data || []).map((row: any) => ({
      id: row.id,
      donation_id: row.donation_id,
      requester_id: row.requester_id,
      requested_quantity: row.requested_quantity,
      intended_use: row.intended_use,
      message: row.message,
      status: row.status,
      requested_at: row.requested_at,
      updated_at: row.updated_at,
      donation: row.donations,
    })) as DonationRequestItem[];

    return { donations, requests };
  } catch (err) {
    console.error('Failed to fetch my donations:', err);
    return { donations: [], requests: [] };
  }
}

/**
 * Fetches claims requested by the logged-in user
 */
export async function fetchMyClaims(requesterId: string): Promise<DonationRequestItem[]> {
  try {
    const { data, error } = await supabase
      .from('donation_requests')
      .select('*, donations(*)')
      .eq('requester_id', requesterId)
      .order('requested_at', { ascending: false });

    if (error) {
      console.warn('Error fetching my claims:', error.message);
      return [];
    }

    return (data || []).map((row: any) => ({
      id: row.id,
      donation_id: row.donation_id,
      requester_id: row.requester_id,
      requested_quantity: row.requested_quantity,
      intended_use: row.intended_use,
      message: row.message,
      status: row.status,
      requested_at: row.requested_at,
      updated_at: row.updated_at,
      donation: row.donations,
    }));
  } catch (err) {
    console.error('Failed to fetch my claims:', err);
    return [];
  }
}

/**
 * Uploads a photo to the donations bucket with folder path scoped to auth donor ID
 */
export async function uploadDonationPhoto(
  donorId: string,
  donationTempId: string,
  localUri: string
): Promise<string | null> {
  try {
    const fileExt = localUri.split('.').pop()?.toLowerCase() || 'jpg';
    const fileName = `${Date.now()}.${fileExt}`;
    const filePath = `${donorId}/${donationTempId}/${fileName}`;

    const base64 = await FileSystem.readAsStringAsync(localUri, {
      encoding: FileSystem.EncodingType.Base64,
    });

    const arrayBuffer = base64ToArrayBuffer(base64);

    const { error: uploadError } = await supabase.storage
      .from('donations')
      .upload(filePath, arrayBuffer, {
        contentType: `image/${fileExt === 'png' ? 'png' : fileExt === 'webp' ? 'webp' : 'jpeg'}`,
        upsert: true,
      });

    if (uploadError) {
      console.warn('Storage upload error:', uploadError.message);
      return null;
    }

    const { data: publicData } = supabase.storage.from('donations').getPublicUrl(filePath);
    return publicData?.publicUrl || null;
  } catch (err) {
    console.error('Failed to upload donation photo:', err);
    return null;
  }
}

/**
 * Calls RPC create_donation_listing
 */
export async function createDonationListing(
  payload: CreateDonationPayload
): Promise<{ success: boolean; donationId?: string; error?: string }> {
  try {
    const { data, error } = await supabase.rpc('create_donation_listing', {
      p_category: payload.category,
      p_item_name: payload.item_name,
      p_quantity: payload.quantity,
      p_unit: payload.unit,
      p_condition: payload.condition,
      p_description: payload.description || '',
      p_photo_url: payload.photo_url || '',
      p_location_name: payload.location_name,
      p_exact_address: payload.exact_address,
      p_exact_lat: payload.exact_lat,
      p_exact_lng: payload.exact_lng,
      p_availability_window: payload.availability_window,
      p_donor_phone: payload.donor_phone,
      p_donor_email: payload.donor_email,
    });

    if (error) {
      return { success: false, error: error.message };
    }

    if (data?.success) {
      return { success: true, donationId: data.donation_id };
    }

    return { success: false, error: data?.message || 'Failed to create listing' };
  } catch (err: any) {
    return { success: false, error: err.message || 'Network error' };
  }
}

/**
 * Calls RPC update_donation_listing
 */
export async function updateDonationListing(
  donationId: string,
  description: string,
  photoUrl: string,
  availabilityWindow: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const { data, error } = await supabase.rpc('update_donation_listing', {
      p_donation_id: donationId,
      p_description: description,
      p_photo_url: photoUrl,
      p_availability_window: availabilityWindow,
    });

    if (error) return { success: false, error: error.message };
    return { success: data?.success, error: data?.message };
  } catch (err: any) {
    return { success: false, error: err.message };
  }
}

/**
 * Calls RPC submit_donation_request
 */
export async function submitDonationRequest(
  payload: SubmitRequestPayload
): Promise<{ success: boolean; requestId?: string; error?: string }> {
  try {
    const { data, error } = await supabase.rpc('submit_donation_request', {
      p_donation_id: payload.donation_id,
      p_requested_quantity: payload.requested_quantity,
      p_intended_use: payload.intended_use,
      p_message: payload.message || '',
      p_requester_phone: payload.requester_phone,
      p_requester_email: payload.requester_email,
    });

    if (error) {
      return { success: false, error: error.message };
    }

    if (data?.success) {
      return { success: true, requestId: data.request_id };
    }

    return { success: false, error: data?.message || 'Failed to submit request' };
  } catch (err: any) {
    return { success: false, error: err.message || 'Network error' };
  }
}

/**
 * Calls RPC accept_donation_request
 */
export async function acceptDonationRequest(
  requestId: string
): Promise<{ success: boolean; quantityRemaining?: number; error?: string }> {
  try {
    const { data, error } = await supabase.rpc('accept_donation_request', {
      p_request_id: requestId,
    });

    if (error) return { success: false, error: error.message };
    if (data?.success) {
      return { success: true, quantityRemaining: data.quantity_remaining };
    }
    return { success: false, error: data?.message || 'Could not accept request' };
  } catch (err: any) {
    return { success: false, error: err.message };
  }
}

/**
 * Calls RPC reject_donation_request
 */
export async function rejectDonationRequest(
  requestId: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const { data, error } = await supabase.rpc('reject_donation_request', {
      p_request_id: requestId,
    });

    if (error) return { success: false, error: error.message };
    return { success: data?.success, error: data?.message };
  } catch (err: any) {
    return { success: false, error: err.message };
  }
}

/**
 * Calls RPC cancel_donation_request
 */
export async function cancelDonationRequest(
  requestId: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const { data, error } = await supabase.rpc('cancel_donation_request', {
      p_request_id: requestId,
    });

    if (error) return { success: false, error: error.message };
    return { success: data?.success, error: data?.message };
  } catch (err: any) {
    return { success: false, error: err.message };
  }
}

/**
 * Calls RPC get_accepted_donation_contact
 */
export async function getAcceptedDonationContact(
  donationId: string,
  requestId: string
): Promise<{ success: boolean; contact?: RevealedContactBundle; error?: string }> {
  try {
    const { data, error } = await supabase.rpc('get_accepted_donation_contact', {
      p_donation_id: donationId,
      p_request_id: requestId,
    });

    if (error) return { success: false, error: error.message };
    if (data?.success) {
      return {
        success: true,
        contact: {
          donor: data.donor,
          requester: data.requester,
        },
      };
    }
    return { success: false, error: data?.message || 'Contact not revealed' };
  } catch (err: any) {
    return { success: false, error: err.message };
  }
}

/**
 * Calls RPC complete_donation
 */
export async function completeDonation(
  donationId: string,
  requestId: string
): Promise<{
  success: boolean;
  donorGpAwarded?: number;
  requesterGpAwarded?: number;
  claimedQuantity?: number;
  error?: string;
}> {
  try {
    const { data, error } = await supabase.rpc('complete_donation', {
      p_donation_id: donationId,
      p_request_id: requestId,
    });

    if (error) return { success: false, error: error.message };
    if (data?.success) {
      return {
        success: true,
        donorGpAwarded: data.donor_gp_awarded,
        requesterGpAwarded: data.requester_gp_awarded,
        claimedQuantity: data.claimed_quantity,
      };
    }
    return { success: false, error: data?.message || 'Failed to complete donation' };
  } catch (err: any) {
    return { success: false, error: err.message };
  }
}

/**
 * Subscribes to realtime updates for the donations feed
 */
export function subscribeToDonationsRealtime(onUpdate: () => void) {
  const channel = supabase
    .channel('public:donations_realtime')
    .on(
      'postgres_changes',
      { event: '*', schema: 'public', table: 'donations' },
      () => onUpdate()
    )
    .on(
      'postgres_changes',
      { event: '*', schema: 'public', table: 'donation_requests' },
      () => onUpdate()
    )
    .subscribe();

  return channel;
}
