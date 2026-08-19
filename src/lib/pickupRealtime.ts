import { supabase } from './supabase';
import { RealtimeChannel } from '@supabase/supabase-js';

export interface PickupPayload {
  id: string;
  status: string;
  mock_eta_seconds?: number;
  actual_weight_kg?: number;
  actual_value_inr?: number;
}

/**
 * Subscribes to real-time status updates for a given pickup_requests record.
 * Returns the RealtimeChannel instance for cleanup on component unmount.
 */
export function subscribeToPickup(
  pickupId: string,
  onStatusChange: (status: string, eta?: number, updatedRecord?: PickupPayload) => void
): RealtimeChannel {
  const channelName = `pickup-${pickupId}`;

  // Clean up any existing channel with this topic before creating a new one
  const existingChannel = supabase.getChannels().find((c) => c.topic === `realtime:${channelName}`);
  if (existingChannel) {
    supabase.removeChannel(existingChannel);
  }

  const channel = supabase
    .channel(channelName)
    .on(
      'postgres_changes',
      {
        event: 'UPDATE',
        schema: 'public',
        table: 'pickup_requests',
        filter: `id=eq.${pickupId}`,
      },
      (payload) => {
        if (payload.new) {
          const record = payload.new as PickupPayload;
          onStatusChange(record.status, record.mock_eta_seconds, record);
        }
      }
    )
    .subscribe();

  return channel;
}
