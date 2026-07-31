import * as Location from 'expo-location';

export interface Tier0Metadata {
  gps_lat: number;
  gps_lng: number;
  accuracy: number | null;
  timestamp: string;
  inside_boundary: boolean;
}

export interface Tier1Result {
  approved: boolean;
  verification_tier: number;
  confidence: number;
  reason?: string;
}

// Bounding box for Sanjay Ghodawat University (SGU) Campus Pilot Zone
const SGU_BOUNDS = {
  minLat: 16.7350,
  maxLat: 16.7600,
  minLng: 74.4550,
  maxLng: 74.4800,
};

/**
 * Checks whether given lat/lng falls within the pilot territory bounds.
 */
export function isInsidePilotTerritory(lat: number, lng: number): boolean {
  return (
    lat >= SGU_BOUNDS.minLat &&
    lat <= SGU_BOUNDS.maxLat &&
    lng >= SGU_BOUNDS.minLng &&
    lng <= SGU_BOUNDS.maxLng
  );
}

/**
 * Captures Tier 0 metadata: current GPS location + ISO timestamp.
 */
export async function captureTier0Metadata(): Promise<{
  success: boolean;
  metadata?: Tier0Metadata;
  error?: string;
}> {
  try {
    const { status } = await Location.requestForegroundPermissionsAsync();
    if (status !== 'granted') {
      return {
        success: false,
        error: 'Location permission was denied. GPS validation requires location access.',
      };
    }

    const location = await Location.getCurrentPositionAsync({
      accuracy: Location.Accuracy.Balanced,
    });

    const lat = location.coords.latitude;
    const lng = location.coords.longitude;
    const inside = isInsidePilotTerritory(lat, lng);

    return {
      success: true,
      metadata: {
        gps_lat: lat,
        gps_lng: lng,
        accuracy: location.coords.accuracy,
        timestamp: new Date(location.timestamp).toISOString(),
        inside_boundary: inside,
      },
    };
  } catch (err: any) {
    return {
      success: false,
      error: err.message || 'Failed to capture GPS location.',
    };
  }
}

/**
 * Tier 1 Verification Stub — Auto-approves submissions for hackathon MVP.
 */
export async function runTier1PreCheck(_photoUri?: string): Promise<Tier1Result> {
  // Stubbed pre-check for MVP
  return {
    approved: true,
    verification_tier: 1,
    confidence: 0.95,
  };
}
