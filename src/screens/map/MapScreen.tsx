import React, { useEffect, useState } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  TextInput,
  ScrollView,
} from 'react-native';
import { WebView } from 'react-native-webview';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Location from 'expo-location';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../providers/ThemeProvider';
import { BioHeader } from '../../components/common/BioHeader';
import { FilterChip } from '../../components/common/FilterChip';
import { MetricCard } from '../../components/common/MetricCard';
import { StatusBadge } from '../../components/common/StatusBadge';
import { BottomSheetContainer } from '../../components/common/BottomSheetContainer';
import {
  fetchPilotTerritory,
  incrementHealthScore,
  subscribeToTerritoryChanges,
  PILOT_TERRITORY_ID,
  Territory,
} from '../../lib/territory';

const SGU_CAMPUS_REGION = {
  latitude: 16.7475,
  longitude: 74.4675,
};

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
        html, body, #map { height: 100%; width: 100%; margin: 0; padding: 0; background: #F4F7F5; }
        .leaflet-tooltip {
          background: #FFFFFF !important;
          border: 1.5px solid #059669 !important;
          color: #0F172A !important;
          font-family: system-ui, -apple-system, sans-serif !important;
          font-weight: 700 !important;
          font-size: 13px !important;
          border-radius: 8px !important;
          padding: 5px 10px !important;
          box-shadow: 0 4px 12px rgba(0,0,0,0.1) !important;
        }
        .leaflet-tooltip-top:before {
          border-top-color: #059669 !important;
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
          color: '#059669',
          weight: 3,
          fillColor: '#059669',
          fillOpacity: 0.2
        }).addTo(map);

        var territoryMarker = L.marker([${territoryCenter.lat}, ${territoryCenter.lng}]).addTo(map);
        territoryMarker.bindTooltip("📍 Green Pioneers Territory", {
          permanent: true,
          direction: 'top',
          offset: [0, -10]
        });

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
  const { colors, radii, shadows } = useTheme();
  const [territory, setTerritory] = useState<Territory | null>(null);
  const [deviceLocation, setDeviceLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [areaName, setAreaName] = useState<string>('Green Pioneers Territory');
  const [loading, setLoading] = useState(true);
  const [boosting, setBoosting] = useState(false);
  const [activeFilter, setActiveFilter] = useState<'Wild' | 'Circular' | 'Both'>('Wild');
  const [isSheetExpanded, setIsSheetExpanded] = useState<boolean>(true);

  useEffect(() => {
    let unsubscribe: (() => void) | undefined;

    const loadTerritoryAndLocation = async () => {
      setLoading(true);
      try {
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status === 'granted') {
          const location = await Location.getCurrentPositionAsync({});
          setDeviceLocation({
            lat: location.coords.latitude,
            lng: location.coords.longitude,
          });
        }
      } catch (err) {
        console.warn('[MapScreen] Device location error:', err);
      }

      const data = await fetchPilotTerritory();
      if (data) {
        setTerritory(data);
      } else {
        setTerritory({
          id: PILOT_TERRITORY_ID,
          name: 'Green Pioneers Territory',
          health_score: 88,
          updated_at: new Date().toISOString(),
        });
      }
      setLoading(false);

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

  const handleTestScoreBoost = async () => {
    setBoosting(true);
    const newScore = await incrementHealthScore(PILOT_TERRITORY_ID, 5);
    setBoosting(false);
    if (newScore !== null) {
      setTerritory((prev) => (prev ? { ...prev, health_score: newScore } : null));
    } else {
      Alert.alert('Database Sync Required', 'Make sure Supabase schema is up to date.');
    }
  };

  const currentScore = territory?.health_score ?? 88;

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Top Header Bar */}
      <View style={{ paddingTop: Math.max(insets.top, 8) }}>
        <BioHeader title="BioVerse" />
      </View>

      {/* Main Map View */}
      <View style={styles.mapWrap}>
        <TerritoryMap
          latitude={deviceLocation?.lat ?? SGU_CAMPUS_REGION.latitude}
          longitude={deviceLocation?.lng ?? SGU_CAMPUS_REGION.longitude}
          polygonCoords={SGU_POLYGON}
          userLocation={deviceLocation}
          territoryCenter={{ lat: SGU_CAMPUS_REGION.latitude, lng: SGU_CAMPUS_REGION.longitude }}
          zoom={17}
        />

        {/* Floating Top Controls Overlay */}
        <View style={styles.floatingControls} pointerEvents="box-none">
          {/* Global Health Pill Tag */}
          <View style={[styles.globalHealthPill, { backgroundColor: colors.surface }, shadows.sm]}>
            <Ionicons name="leaf" size={14} color={colors.primary} />
            <Text style={[styles.globalHealthText, { color: colors.textPrimary }]}>
              Global Health: <Text style={{ color: colors.primary, fontWeight: '800' }}>{currentScore * 9}</Text>
            </Text>
          </View>

          {/* Filter Pills Row */}
          <View style={[styles.filterRow, { backgroundColor: colors.surface }, shadows.sm]}>
            <FilterChip
              label="Wild"
              active={activeFilter === 'Wild'}
              onPress={() => setActiveFilter('Wild')}
              style={styles.chipItem}
            />
            <FilterChip
              label="Circular"
              active={activeFilter === 'Circular'}
              onPress={() => setActiveFilter('Circular')}
              style={styles.chipItem}
            />
            <FilterChip
              label="Both"
              active={activeFilter === 'Both'}
              onPress={() => setActiveFilter('Both')}
              style={styles.chipItem}
            />
          </View>

          {/* Search Bar Overlay */}
          <View style={[styles.searchBar, { backgroundColor: colors.surface }, shadows.sm]}>
            <Ionicons name="search" size={18} color={colors.textSecondary} />
            <TextInput
              placeholder="Search eco-zones..."
              placeholderTextColor={colors.textMuted}
              style={[styles.searchInput, { color: colors.textPrimary }]}
            />
            <Ionicons name="mic" size={18} color={colors.textSecondary} />
          </View>
        </View>

        {/* Draggable & Expandable Bottom Sheet Details */}
        <View style={styles.bottomSheetWrapper} pointerEvents="auto">
          <BottomSheetContainer style={styles.bottomSheetContainer}>
            {/* Interactive Header Bar */}
            <TouchableOpacity
              style={styles.sheetHeaderTouch}
              onPress={() => setIsSheetExpanded(!isSheetExpanded)}
              activeOpacity={0.8}
            >
              <View style={{ flex: 1 }}>
                <Text style={[styles.sheetTitle, { color: colors.textPrimary }]}>{areaName}</Text>
                <View style={styles.statusRow}>
                  <View style={[styles.statusDot, { backgroundColor: colors.primary }]} />
                  <Text style={[styles.statusText, { color: colors.primary }]}>Healthy Status</Text>
                  <Text style={[styles.expandHint, { color: colors.textSecondary }]}>
                    ({isSheetExpanded ? 'Tap to collapse' : 'Tap to expand'})
                  </Text>
                </View>
              </View>

              <View style={styles.scoreCol}>
                <Text style={[styles.scoreNumber, { color: colors.primary }]}>{currentScore}%</Text>
                <Ionicons name={isSheetExpanded ? 'chevron-down' : 'chevron-up'} size={18} color={colors.primary} />
              </View>
            </TouchableOpacity>

            {/* Expandable Content Body */}
            {isSheetExpanded && (
              <ScrollView
                style={{ maxHeight: 280 }}
                contentContainerStyle={styles.expandedContent}
                nestedScrollEnabled
                showsVerticalScrollIndicator={false}
              >
                {/* 2-Column Metric Cards */}
                <View style={styles.metricsGrid}>
                  <MetricCard label="Decay Risk" value="Low" valueColor={colors.primary} />
                  <MetricCard label="Carbon Capture" value="12.4t / yr" valueColor={colors.textPrimary} />
                </View>

                {/* Recent Impact Actions */}
                <View style={styles.recentSection}>
                  <Text style={[styles.recentTitle, { color: colors.textPrimary }]}>Recent Impact Actions</Text>
                  
                  <View style={[styles.actionRow, { backgroundColor: colors.surfaceSecondary, borderRadius: radii.xl }]}>
                    <View style={[styles.actionIconBg, { backgroundColor: colors.primarySubtle }]}>
                      <Ionicons name="bug" size={18} color={colors.primary} />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={[styles.actionTitle, { color: colors.textPrimary }]}>Arjun logged a Monarch</Text>
                      <Text style={[styles.actionSub, { color: colors.textSecondary }]}>Biodiversity Action • 2m ago</Text>
                    </View>
                    <StatusBadge label="+12 XP" variant="success" />
                  </View>
                </View>

                {/* RPC Boost Button */}
                <TouchableOpacity
                  style={[styles.boostBtn, { backgroundColor: colors.accentGoldSubtle, borderColor: 'rgba(245, 158, 11, 0.3)' }]}
                  onPress={handleTestScoreBoost}
                  disabled={boosting}
                >
                  {boosting ? (
                    <ActivityIndicator size="small" color={colors.accentGold} />
                  ) : (
                    <>
                      <Ionicons name="flash" size={16} color={colors.accentGold} />
                      <Text style={[styles.boostText, { color: colors.accentGold }]}>Test RPC Boost (+5 Score)</Text>
                    </>
                  )}
                </TouchableOpacity>
              </ScrollView>
            )}
          </BottomSheetContainer>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  mapWrap: {
    flex: 1,
    position: 'relative',
  },
  mapContainer: {
    flex: 1,
  },
  webview: {
    flex: 1,
    backgroundColor: '#F4F7F5',
  },
  floatingControls: {
    position: 'absolute',
    top: 12,
    left: 16,
    right: 16,
    gap: 10,
    alignItems: 'center',
    zIndex: 20,
  },
  globalHealthPill: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 20,
    gap: 6,
  },
  globalHealthText: {
    fontSize: 13,
    fontWeight: '600',
  },
  filterRow: {
    flexDirection: 'row',
    padding: 4,
    borderRadius: 24,
    gap: 4,
  },
  chipItem: {
    paddingHorizontal: 16,
    paddingVertical: 6,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '100%',
    height: 46,
    borderRadius: 23,
    paddingHorizontal: 16,
    gap: 10,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
  },
  bottomSheetWrapper: {
    position: 'absolute',
    bottom: 65,
    left: 0,
    right: 0,
    zIndex: 50,
  },
  bottomSheetContainer: {
    paddingBottom: 16,
  },
  sheetHeaderTouch: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 6,
  },
  sheetTitle: {
    fontSize: 19,
    fontWeight: '800',
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 2,
    gap: 6,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '700',
  },
  expandHint: {
    fontSize: 11,
    marginLeft: 4,
  },
  scoreCol: {
    alignItems: 'center',
    gap: 2,
  },
  scoreNumber: {
    fontSize: 24,
    fontWeight: '800',
  },
  expandedContent: {
    marginTop: 8,
    gap: 12,
  },
  metricsGrid: {
    flexDirection: 'row',
    gap: 12,
  },
  recentSection: {
    gap: 6,
  },
  recentTitle: {
    fontSize: 13,
    fontWeight: '700',
  },
  actionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 10,
    gap: 10,
  },
  actionIconBg: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionTitle: {
    fontSize: 13,
    fontWeight: '700',
  },
  actionSub: {
    fontSize: 11,
    marginTop: 1,
  },
  boostBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    height: 36,
    borderRadius: 12,
    borderWidth: 1,
    gap: 6,
  },
  boostText: {
    fontSize: 12,
    fontWeight: '700',
  },
});
