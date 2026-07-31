import React, { useEffect, useState } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { WebView } from 'react-native-webview';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Location from 'expo-location';
import { Ionicons } from '@expo/vector-icons';
import {
  fetchPilotTerritory,
  incrementHealthScore,
  subscribeToTerritoryChanges,
  PILOT_TERRITORY_ID,
  Territory,
} from '../../lib/territory';

// Sanjay Ghodawat University (SGU) Campus Coordinates
const SGU_CAMPUS_REGION = {
  latitude: 16.7475,
  longitude: 74.4675,
};

// SGU Campus Pilot Territory Polygon Boundary
const SGU_POLYGON = [
  { lat: 16.7400, lng: 74.4600 },
  { lat: 16.7400, lng: 74.4750 },
  { lat: 16.7550, lng: 74.4750 },
  { lat: 16.7550, lng: 74.4600 },
];

interface TerritoryMapProps {
  latitude: number;
  longitude: number;
  polygonCoords: { lat: number; lng: number }[];
  userLocation?: { lat: number; lng: number } | null;
  territoryCenter: { lat: number; lng: number };
  zoom?: number;
}

export function TerritoryMap({
  latitude,
  longitude,
  polygonCoords,
  userLocation,
  territoryCenter,
  zoom = 17,
}: TerritoryMapProps) {
  const polygonLatLngs = polygonCoords.map(p => `[${p.lat}, ${p.lng}]`).join(',');

  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">
      <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" />
      <style>
        html, body, #map { height: 100%; width: 100%; margin: 0; padding: 0; background: #07120E; }
        .leaflet-tooltip {
          background: #0F241C !important;
          border: 1.5px solid #10B981 !important;
          color: #ECFDF5 !important;
          font-family: system-ui, -apple-system, sans-serif !important;
          font-weight: 700 !important;
          font-size: 13px !important;
          border-radius: 8px !important;
          padding: 5px 10px !important;
          box-shadow: 0 4px 12px rgba(0,0,0,0.4) !important;
        }
        .leaflet-tooltip-top:before {
          border-top-color: #10B981 !important;
        }
      </style>
    </head>
    <body>
      <div id="map"></div>
      <script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
      <script>
        var map = L.map('map', {
          zoomControl: false,
          attributionControl: false
        }).setView([${latitude}, ${longitude}], ${zoom});

        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
          subdomains: ['a', 'b', 'c'],
          maxZoom: 19
        }).addTo(map);

        L.polygon([${polygonLatLngs}], {
          color: '#10B981',
          weight: 3,
          fillColor: '#10B981',
          fillOpacity: 0.25
        }).addTo(map);

        // Pilot Territory Marker
        var territoryMarker = L.marker([${territoryCenter.lat}, ${territoryCenter.lng}]).addTo(map);
        territoryMarker.bindTooltip("📍 SGU Campus Pilot Zone", {
          permanent: true,
          direction: 'top',
          offset: [0, -10]
        });

        // User Live Location Marker (if available)
        ${
          userLocation
            ? `
          L.marker([${userLocation.lat}, ${userLocation.lng}], {
            icon: L.icon({
              iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
              iconSize: [25, 41],
              iconAnchor: [12, 41],
            })
          }).addTo(map).bindPopup('You are here').openPopup();
        `
            : ''
        }
      </script>
    </body>
    </html>
  `;

  return (
    <View style={styles.mapContainer}>
      <WebView
        originWhitelist={['*']}
        source={{ html }}
        style={styles.webview}
      />
    </View>
  );
}

export const MapScreen: React.FC = () => {
  const insets = useSafeAreaInsets();
  const [territory, setTerritory] = useState<Territory | null>(null);
  const [deviceLocation, setDeviceLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [areaName, setAreaName] = useState<string>('Locating...');
  const [loading, setLoading] = useState(true);
  const [boosting, setBoosting] = useState(false);

  useEffect(() => {
    console.log('[MapScreen] Mounted with Leaflet WebView. Initial region:', JSON.stringify(SGU_CAMPUS_REGION));

    let unsubscribe: (() => void) | undefined;

    const loadTerritoryAndLocation = async () => {
      setLoading(true);

      // 1. Fetch real device location
      try {
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status === 'granted') {
          const location = await Location.getCurrentPositionAsync({});
          setDeviceLocation({
            lat: location.coords.latitude,
            lng: location.coords.longitude,
          });
        } else {
          setAreaName('Location access denied');
        }
      } catch (err) {
        console.warn('[MapScreen] Could not fetch device location:', err);
        setAreaName('Unable to locate');
      }

      // 2. Fetch pilot territory data
      const data = await fetchPilotTerritory();
      if (data) {
        setTerritory(data);
      } else {
        setTerritory({
          id: PILOT_TERRITORY_ID,
          name: 'SGU Campus Pilot Zone',
          health_score: 50,
          updated_at: new Date().toISOString(),
        });
      }
      setLoading(false);

      // Subscribe to Realtime score updates from Supabase
      unsubscribe = subscribeToTerritoryChanges(PILOT_TERRITORY_ID, (updated) => {
        if (updated.health_score !== undefined) {
          setTerritory((prev) =>
            prev ? { ...prev, health_score: updated.health_score! } : null
          );
        }
      });
    };

    loadTerritoryAndLocation();

    return () => {
      if (unsubscribe) unsubscribe();
    };
  }, []);

  // Reverse Geocode device location to get actual location label
  useEffect(() => {
    if (!deviceLocation) return;

    (async () => {
      try {
        const results = await Location.reverseGeocodeAsync({
          latitude: deviceLocation.lat,
          longitude: deviceLocation.lng,
        });
        if (results.length > 0) {
          const place = results[0];
          const label =
            place.district ||
            place.subregion ||
            place.name ||
            place.city ||
            'Unknown area';
          setAreaName(label);
        } else {
          setAreaName('Unknown area');
        }
      } catch (err) {
        console.log('[MapScreen] Reverse geocode failed:', err);
        setAreaName('Unable to locate');
      }
    })();
  }, [deviceLocation]);

  const handleTestScoreBoost = async () => {
    setBoosting(true);
    const newScore = await incrementHealthScore(PILOT_TERRITORY_ID, 5);
    setBoosting(false);
    if (newScore !== null) {
      setTerritory((prev) => (prev ? { ...prev, health_score: newScore } : null));
    } else {
      Alert.alert(
        'Database Sync Required',
        'Make sure you have run the updated supabase/schema.sql in your Supabase SQL Editor.'
      );
    }
  };

  const getHealthColor = (score: number) => {
    if (score >= 75) return '#10B981'; // Flourishing Green
    if (score >= 40) return '#F59E0B'; // Restoring Amber
    return '#EF4444'; // Degraded Red
  };

  const getHealthStatus = (score: number) => {
    if (score >= 75) return 'Flourishing Ecosystem';
    if (score >= 40) return 'Restoring Territory';
    return 'Degraded Zone';
  };

  const currentScore = territory?.health_score ?? 50;

  return (
    <View style={styles.container}>
      {/* Top Floating Ecosystem Health Score Card */}
      <View style={[styles.topCardContainer, { top: Math.max(insets.top + 8, 16) }]}>
        <View style={styles.topCard}>
          <View style={styles.scoreRow}>
            <View style={styles.scoreMain}>
              <Text style={styles.territoryName}>
                {areaName}
              </Text>
              <View style={styles.statusRow}>
                <View
                  style={[
                    styles.statusDot,
                    { backgroundColor: getHealthColor(currentScore) },
                  ]}
                />
                <Text style={styles.statusText}>{getHealthStatus(currentScore)}</Text>
              </View>
            </View>

            <View
              style={[
                styles.scoreBadge,
                { borderColor: getHealthColor(currentScore) },
              ]}
            >
              <Text
                style={[
                  styles.scoreValue,
                  { color: getHealthColor(currentScore) },
                ]}
              >
                {currentScore}
              </Text>
              <Text style={styles.scoreMax}>/ 100</Text>
            </View>
          </View>

          <View style={styles.progressBarBg}>
            <View
              style={[
                styles.progressBarFill,
                {
                  width: `${Math.min(100, Math.max(0, currentScore))}%`,
                  backgroundColor: getHealthColor(currentScore),
                },
              ]}
            />
          </View>

          {/* Test Health Score RPC Trigger */}
          <TouchableOpacity
            style={styles.testBoostBtn}
            onPress={handleTestScoreBoost}
            disabled={boosting}
          >
            {boosting ? (
              <ActivityIndicator size="small" color="#10B981" />
            ) : (
              <>
                <Ionicons name="flash" size={14} color="#F59E0B" />
                <Text style={styles.testBoostText}>Test RPC Boost (+5 Score)</Text>
              </>
            )}
          </TouchableOpacity>
        </View>
      </View>

      {/* Leaflet WebView Map */}
      <TerritoryMap
        latitude={deviceLocation?.lat ?? SGU_CAMPUS_REGION.latitude}
        longitude={deviceLocation?.lng ?? SGU_CAMPUS_REGION.longitude}
        polygonCoords={SGU_POLYGON}
        userLocation={deviceLocation}
        territoryCenter={{ lat: SGU_CAMPUS_REGION.latitude, lng: SGU_CAMPUS_REGION.longitude }}
        zoom={17}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#07120E',
  },
  mapContainer: {
    flex: 1,
  },
  webview: {
    flex: 1,
    backgroundColor: '#07120E',
  },
  topCardContainer: {
    position: 'absolute',
    left: 16,
    right: 16,
    zIndex: 10,
  },
  topCard: {
    backgroundColor: 'rgba(15, 36, 28, 0.95)',
    borderRadius: 20,
    padding: 16,
    borderWidth: 1.5,
    borderColor: 'rgba(16, 185, 129, 0.3)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  scoreRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  scoreMain: {
    flex: 1,
  },
  territoryName: {
    fontSize: 17,
    fontWeight: '800',
    color: '#ECFDF5',
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
    gap: 6,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  statusText: {
    fontSize: 12,
    color: '#9CA3AF',
    fontWeight: '600',
  },
  scoreBadge: {
    flexDirection: 'row',
    alignItems: 'baseline',
    backgroundColor: '#071610',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 14,
    borderWidth: 1.5,
  },
  scoreValue: {
    fontSize: 24,
    fontWeight: '800',
  },
  scoreMax: {
    fontSize: 12,
    color: '#6B7280',
    marginLeft: 3,
  },
  progressBarBg: {
    height: 6,
    backgroundColor: '#071610',
    borderRadius: 3,
    marginTop: 12,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    borderRadius: 3,
  },
  testBoostBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(245, 158, 11, 0.12)',
    borderWidth: 1,
    borderColor: 'rgba(245, 158, 11, 0.3)',
    borderRadius: 10,
    paddingVertical: 6,
    marginTop: 10,
    gap: 6,
  },
  testBoostText: {
    color: '#FBBF24',
    fontSize: 12,
    fontWeight: '700',
  },
});
