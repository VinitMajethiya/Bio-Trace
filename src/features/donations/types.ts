export type DonationCategory = 'saplings' | 'seeds' | 'compost' | 'tools' | 'materials' | 'other';

export type DonationUnit = 'saplings' | 'packets' | 'kg' | 'items' | 'tools' | 'units';

export type DonationCondition = 'new' | 'healthy' | 'gently_used' | 'upcycled';

export type DonationStatus = 'listed' | 'scheduled' | 'completed' | 'cancelled';

export type ClaimRequestStatus = 'pending' | 'accepted' | 'scheduled' | 'completed' | 'rejected' | 'cancelled';

export interface DonationFeedItem {
  id: string;
  donor_id: string;
  ngo_verified: boolean;
  ngo_organization_name?: string | null;
  donor_display_name?: string | null;
  category: DonationCategory;
  item_name: string;
  quantity_total: number;
  quantity_remaining: number;
  unit: DonationUnit;
  condition: DonationCondition;
  description?: string | null;
  photo_url?: string | null;
  location_name: string;
  fuzzed_lat: number;
  fuzzed_lng: number;
  availability_window: string;
  status: DonationStatus;
  expires_at: string;
  created_at: string;
  distanceKm?: number;
}

export interface DonationRequestItem {
  id: string;
  donation_id: string;
  requester_id: string;
  requested_quantity: number;
  intended_use: string;
  message?: string | null;
  status: ClaimRequestStatus;
  requested_at: string;
  updated_at: string;
  donation?: DonationFeedItem;
  requester_display_name?: string;
}

export interface DonorRevealedContact {
  phone: string;
  email: string;
  exact_address: string;
  exact_lat: number;
  exact_lng: number;
  availability_window: string;
}

export interface RequesterRevealedContact {
  phone: string;
  email: string;
  intended_use: string;
  requested_quantity: number;
}

export interface RevealedContactBundle {
  donor: DonorRevealedContact;
  requester: RequesterRevealedContact;
}

export interface CreateDonationPayload {
  category: DonationCategory;
  item_name: string;
  quantity: number;
  unit: DonationUnit;
  condition: DonationCondition;
  description?: string;
  photo_url?: string;
  location_name: string;
  exact_address: string;
  exact_lat: number;
  exact_lng: number;
  availability_window: string;
  donor_phone: string;
  donor_email: string;
}

export interface SubmitRequestPayload {
  donation_id: string;
  requested_quantity: number;
  intended_use: string;
  message?: string;
  requester_phone: string;
  requester_email: string;
}
