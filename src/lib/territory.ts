import { supabase } from './supabase';

export const PILOT_TERRITORY_ID = '00000000-0000-0000-0000-000000000001';

export interface LatLng {
  latitude: number;
  longitude: number;
}

export interface ZoneResult {
  multiplier: number;
  label: string | null;
  tier: 'home' | 'nearby' | 'remote';
}

export const DEFAULT_PILOT_BOUNDARY: LatLng[] = [
  { latitude: 16.7400, longitude: 74.4600 },
  { latitude: 16.7400, longitude: 74.4750 },
  { latitude: 16.7550, longitude: 74.4750 },
  { latitude: 16.7550, longitude: 74.4600 },
];

export interface Territory {
  id: string;
  name: string;
  health_score: number;
  updated_at: string;
}

function deg2rad(deg: number): number {
  return deg * (Math.PI / 180);
}

export function getDistanceFromLatLonInKm(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371; // Earth radius in km
  const dLat = deg2rad(lat2 - lat1);
  const dLon = deg2rad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(deg2rad(lat1)) * Math.cos(deg2rad(lat2)) * Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

export function isInsidePolygon(point: LatLng, polygon: LatLng[]): boolean {
  let inside = false;
  for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
    const xi = polygon[i].latitude, yi = polygon[i].longitude;
    const xj = polygon[j].latitude, yj = polygon[j].longitude;
    const intersect =
      yi > point.longitude !== yj > point.longitude &&
      point.latitude < ((xj - xi) * (point.longitude - yi)) / (yj - yi) + xi;
    if (intersect) inside = !inside;
  }
  return inside;
}

export function getDistanceToBoundaryKm(point: LatLng, polygon: LatLng[]): number {
  let minDistance = Infinity;
  for (const vertex of polygon) {
    const dist = getDistanceFromLatLonInKm(point.latitude, point.longitude, vertex.latitude, vertex.longitude);
    if (dist < minDistance) {
      minDistance = dist;
    }
  }
  return minDistance;
}

/**
 * Calculates zone multiplier based on user GPS coordinates.
 * Home zone (inside boundary) -> 2.0x
 * Nearby zone (<= 5 km) -> 1.25x
 * Remote zone (> 5 km) -> 1.0x
 */
export function getZoneMultiplier(userCoords: LatLng, boundary: LatLng[] = DEFAULT_PILOT_BOUNDARY): ZoneResult {
  const inside = isInsidePolygon(userCoords, boundary);
  if (inside) {
    return { multiplier: 2.0, label: '🏡 Home Zone — 2× points!', tier: 'home' };
  }

  const distanceKm = getDistanceToBoundaryKm(userCoords, boundary);
  if (distanceKm <= 5) {
    return { multiplier: 1.25, label: '📍 Nearby Zone — bonus active', tier: 'nearby' };
  }

  return { multiplier: 1.0, label: null, tier: 'remote' };
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
  const channelName = `territory-changes-${territoryId}`;

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

