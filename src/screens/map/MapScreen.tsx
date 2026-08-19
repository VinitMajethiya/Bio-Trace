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
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { useTheme } from '../../providers/ThemeProvider';
import { FilterPill } from '../../components/common/FilterChip';
import { MetricCard } from '../../components/common/MetricCard';
import { StatusBadge } from '../../components/common/StatusBadge';
import { BottomSheetContainer } from '../../components/common/BottomSheetContainer';
import { HealthRing } from '../../components/common/HealthRing';
import { DarkCard } from '../../components/common/BioCard';
import { useAuth } from '../../context/AuthContext';
import { fetchUserCollectionBook } from '../../lib/wild';
import { fetchUserWasteHistory } from '../../lib/circular';
import {
  fetchPilotTerritory,
  incrementHealthScore,
  subscribeToTerritoryChanges,
  PILOT_TERRITORY_ID,
  Territory,
} from '../../lib/territory';
import { fetchActiveRaids, joinCleanRaid, CleanRaid } from '../../lib/raids';

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

export interface MapMarkerItem {
  id: string;
  lat: number;
  lng: number;
  title: string;
  subtitle?: string;
  type: 'wild' | 'circular' | 'raid';
  badgeIcon?: string;
}

const DEFAULT_WILD_MARKERS: MapMarkerItem[] = [
  {
    id: 'wild-1',
    lat: 16.7485,
    lng: 74.4665,
    title: 'Indian Peafowl Habitat',
    subtitle: 'Restoration Zone • Amber Tier',
    type: 'wild',
    badgeIcon: '🦚',
  },
  {
    id: 'wild-2',
    lat: 16.7465,
    lng: 74.4690,
    title: 'Sunbird Flora Cluster',
    subtitle: 'Active Pollinator Sighting',
    type: 'wild',
    badgeIcon: '🌸',
  },
];

const DEFAULT_CIRCULAR_MARKERS: MapMarkerItem[] = [
  {
    id: 'circ-1',
    lat: 16.7480,
    lng: 74.4685,
    title: 'Smart Eco-Locker #01',
    subtitle: 'Drop-off Station & Scanner',
    type: 'circular',
    badgeIcon: '📦',
  },
  {
    id: 'circ-2',
    lat: 16.7460,
    lng: 74.4670,
    title: 'E-Waste Recycling Hub',
    subtitle: 'Certified Processing Station',
    type: 'circular',
    badgeIcon: '⚡',
  },
  {
    id: 'circ-3',
    lat: 16.7495,
    lng: 74.4655,
    title: 'Organic Composting Pit',
    subtitle: 'Bio-waste Transformation Point',
    type: 'circular',
    badgeIcon: '🌱',
  },
];

interface TerritoryMapProps {
  latitude: number;
  longitude: number;
  polygonCoords: { lat: number; lng: number }[];
  userLocation?: { lat: number; lng: number } | null;
  territoryCenter: { lat: number; lng: number };
  zoom?: number;
  wildMarkers?: MapMarkerItem[];
  circularMarkers?: MapMarkerItem[];
  raidMarkers?: MapMarkerItem[];
  activeFilter: 'Wild' | 'Circular' | 'Raids' | 'Both';
}

export function TerritoryMap({
  latitude,
  longitude,
  polygonCoords,
  userLocation,
  territoryCenter,
  zoom = 17,
  wildMarkers = DEFAULT_WILD_MARKERS,
  circularMarkers = DEFAULT_CIRCULAR_MARKERS,
  raidMarkers = [],
  activeFilter,
}: TerritoryMapProps) {
  const polygonLatLngs = polygonCoords.map(p => `[${p.lat}, ${p.lng}]`).join(',');

  const showWild = activeFilter === 'Wild' || activeFilter === 'Both';
  const showCircular = activeFilter === 'Circular' || activeFilter === 'Both';
  const showRaids = activeFilter === 'Raids' || activeFilter === 'Both';

  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">
      <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" />
      <style>
        * { box-sizing: border-box; }
        html, body, #map { height: 100%; width: 100%; margin: 0; padding: 0; background: #eaf3eb; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; }
        
        /* Modern Leaflet Popup Customization */
        .leaflet-popup-content-wrapper {
          background: rgba(255, 255, 255, 0.98) !important;
          backdrop-filter: blur(16px) !important;
          -webkit-backdrop-filter: blur(16px) !important;
          border-radius: 18px !important;
          padding: 0 !important;
          border: 1.5px solid rgba(43, 182, 115, 0.25) !important;
          box-shadow: 0 12px 28px rgba(20, 34, 23, 0.20), 0 3px 10px rgba(0,0,0,0.06) !important;
        }
        .leaflet-popup-content {
          margin: 14px 16px !important;
          line-height: 1.35 !important;
        }
        .leaflet-popup-tip {
          background: rgba(255, 255, 255, 0.98) !important;
        }
        .leaflet-popup-close-button {
          color: #6d7a6f !important;
          padding: 8px !important;
        }

        /* Marker Pin Base */
        .div-marker {
          background: transparent;
          border: none;
        }
        .eco-marker-wrap {
          position: relative;
          width: 42px;
          height: 48px;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: flex-start;
          cursor: pointer;
          transition: transform 0.2s cubic-bezier(0.34, 1.56, 0.64, 1);
        }
        .eco-marker-wrap:active, .eco-marker-wrap:hover {
          transform: scale(1.22) translateY(-4px);
          z-index: 9999 !important;
        }

        /* 3D Teardrop Pin */
        .eco-pin-bubble {
          width: 38px;
          height: 38px;
          border-radius: 50% 50% 50% 0;
          transform: rotate(-45deg);
          display: flex;
          align-items: center;
          justify-content: center;
          box-shadow: 0 6px 14px rgba(0, 0, 0, 0.22), inset 0 1px 2px rgba(255,255,255,0.6);
          border: 2.5px solid #FFFFFF;
          position: relative;
          z-index: 2;
        }
        .eco-pin-icon {
          transform: rotate(45deg);
          font-size: 18px;
          line-height: 1;
          display: block;
        }

        /* Circular Badge for Landmark HQ */
        .eco-pin-round {
          width: 40px;
          height: 40px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          box-shadow: 0 6px 14px rgba(0, 0, 0, 0.25), inset 0 1px 2px rgba(255,255,255,0.6);
          border: 2.5px solid #FFFFFF;
          position: relative;
          z-index: 2;
        }
        .eco-pin-round-icon {
          font-size: 19px;
          line-height: 1;
        }

        /* Color Gradients */
        .pin-wild {
          background: linear-gradient(135deg, #2BB673 0%, #15803D 100%);
        }
        .pin-circ {
          background: linear-gradient(135deg, #F59E0B 0%, #D97706 100%);
        }
        .pin-raid {
          background: linear-gradient(135deg, #A855F7 0%, #6366F1 100%);
        }
        .pin-hq {
          background: linear-gradient(135deg, #059669 0%, #064E3B 100%);
        }

        /* Pulsing Radar Wave for Clean Raids */
        .raid-radar-ring {
          position: absolute;
          top: 3px;
          left: 5px;
          width: 32px;
          height: 32px;
          border-radius: 50%;
          background: rgba(168, 85, 247, 0.45);
          animation: raid-pulse 2s infinite cubic-bezier(0.215, 0.61, 0.355, 1);
          z-index: 1;
          pointer-events: none;
        }
        @keyframes raid-pulse {
          0% {
            transform: scale(0.9);
            opacity: 0.95;
          }
          100% {
            transform: scale(2.6);
            opacity: 0;
          }
        }

        /* GPS Location Beacon */
        .user-gps-beacon {
          position: relative;
          width: 30px;
          height: 30px;
          display: flex;
          align-items: center;
          justify-content: center;
        }
        .user-gps-dot {
          width: 16px;
          height: 16px;
          border-radius: 50%;
          background: #2563EB;
          border: 3px solid #FFFFFF;
          box-shadow: 0 2px 8px rgba(37, 99, 235, 0.5);
          z-index: 2;
        }
        .user-gps-pulse {
          position: absolute;
          width: 100%;
          height: 100%;
          border-radius: 50%;
          background: rgba(37, 99, 235, 0.35);
          animation: gps-wave 2s infinite ease-out;
          z-index: 1;
        }
        @keyframes gps-wave {
          0% { transform: scale(0.8); opacity: 0.9; }
          100% { transform: scale(3.2); opacity: 0; }
        }

        /* Popup Cards Inside Leaflet */
        .popup-badge {
          display: inline-flex;
          align-items: center;
          gap: 4px;
          padding: 3px 8px;
          border-radius: 99px;
          font-size: 10px;
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: 0.5px;
          margin-bottom: 6px;
        }
        .popup-badge-wild { background: #D9F3E9; color: #15803D; }
        .popup-badge-circ { background: #FEF3C7; color: #B45309; }
        .popup-badge-raid { background: #F3E8FF; color: #7E22CE; }
        
        .popup-title {
          font-size: 14px;
          font-weight: 700;
          color: #161D18;
          margin: 0 0 2px 0;
        }
        .popup-subtitle {
          font-size: 11px;
          color: #6D7A6F;
          margin: 0;
        }
        .popup-footer {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-top: 8px;
          padding-top: 8px;
          border-top: 1px solid rgba(0,0,0,0.06);
          font-size: 11px;
          font-weight: 600;
          color: #2BB673;
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

        // Territory boundary polygon with smooth aesthetics
        L.polygon([${polygonLatLngs}], {
          color: '#2BB673',
          weight: 2.5,
          dashArray: '6, 6',
          fillColor: '#2BB673',
          fillOpacity: 0.12
        }).addTo(map);

        // Territory Landmark HQ Pin
        var territoryIcon = L.divIcon({
          className: 'div-marker',
          html: '<div class="eco-marker-wrap"><div class="eco-pin-round pin-hq"><span class="eco-pin-round-icon">📍</span></div></div>',
          iconSize: [42, 48],
          iconAnchor: [21, 24]
        });
        L.marker([${territoryCenter.lat}, ${territoryCenter.lng}], { icon: territoryIcon })
          .addTo(map)
          .bindPopup("<div class='popup-badge popup-badge-wild'>🌿 Pilot Territory HQ</div><div class='popup-title'>Green Pioneers Territory</div><div class='popup-subtitle'>Campus Ecological Health Zone</div><div class='popup-footer'><span>Active Protection</span><span>Live 88%</span></div>");

        ${
          userLocation
            ? `
          var userGpsIcon = L.divIcon({
            className: 'div-marker',
            html: '<div class="user-gps-beacon"><div class="user-gps-pulse"></div><div class="user-gps-dot"></div></div>',
            iconSize: [30, 30],
            iconAnchor: [15, 15]
          });
          L.marker([${userLocation.lat}, ${userLocation.lng}], { icon: userGpsIcon })
            .addTo(map)
            .bindPopup("<div class='popup-title'>📍 You Are Here</div><div class='popup-subtitle'>GPS Location Synchronized</div>");
        `
            : ''
        }

        ${
          showWild
            ? wildMarkers
                .map(
                  m => `
          (function() {
            var icon = L.divIcon({
              className: 'div-marker',
              html: '<div class="eco-marker-wrap"><div class="eco-pin-bubble pin-wild"><span class="eco-pin-icon">${m.badgeIcon || '🌿'}</span></div></div>',
              iconSize: [42, 48],
              iconAnchor: [21, 44]
            });
            L.marker([${m.lat}, ${m.lng}], { icon: icon })
              .addTo(map)
              .bindPopup("<div class='popup-badge popup-badge-wild'>🌿 Wild Species</div><div class='popup-title'>${m.badgeIcon || '🌿'} ${m.title.replace(/'/g, "\\'")}</div><div class='popup-subtitle'>${(m.subtitle || 'Biodiversity Observation').replace(/'/g, "\\'")}</div><div class='popup-footer'><span>Logged in Collection</span><span>+5 XP</span></div>");
          })();
        `
                )
                .join('\n')
            : ''
        }

        ${
          showCircular
            ? circularMarkers
                .map(
                  m => `
          (function() {
            var icon = L.divIcon({
              className: 'div-marker',
              html: '<div class="eco-marker-wrap"><div class="eco-pin-bubble pin-circ"><span class="eco-pin-icon">${m.badgeIcon || '♻️'}</span></div></div>',
              iconSize: [42, 48],
              iconAnchor: [21, 44]
            });
            L.marker([${m.lat}, ${m.lng}], { icon: icon })
              .addTo(map)
              .bindPopup("<div class='popup-badge popup-badge-circ'>♻️ Circular Hub</div><div class='popup-title'>${m.badgeIcon || '♻️'} ${m.title.replace(/'/g, "\\'")}</div><div class='popup-subtitle'>${(m.subtitle || 'Drop-off & Recycling Point').replace(/'/g, "\\'")}</div><div class='popup-footer'><span>Open for Drop-off</span><span>Earn Green Coins</span></div>");
          })();
        `
                )
                .join('\n')
            : ''
        }

        ${
          showRaids
            ? raidMarkers
                .map(
                  m => `
          (function() {
            var icon = L.divIcon({
              className: 'div-marker',
              html: '<div class="eco-marker-wrap"><div class="raid-radar-ring"></div><div class="eco-pin-bubble pin-raid"><span class="eco-pin-icon">${m.badgeIcon || '🧹'}</span></div></div>',
              iconSize: [42, 48],
              iconAnchor: [21, 44]
            });
            L.marker([${m.lat}, ${m.lng}], { icon: icon })
              .addTo(map)
              .bindPopup("<div class='popup-badge popup-badge-raid'>⚡ Active Raid</div><div class='popup-title'>${m.badgeIcon || '🧹'} ${m.title.replace(/'/g, "\\'")}</div><div class='popup-subtitle'>${(m.subtitle || 'Community Cleanup').replace(/'/g, "\\'")}</div><div class='popup-footer'><span>Raid in Progress</span><span>Join Now</span></div>");
          })();
        `
                )
                .join('\n')
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
  const navigation = useNavigation<any>();
  const { colors, radii, shadows } = useTheme();
  const { user } = useAuth();
  const [territory, setTerritory] = useState<Territory | null>(null);
  const [deviceLocation, setDeviceLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [locationDenied, setLocationDenied] = useState<boolean>(false);
  const [areaName, setAreaName] = useState<string>('Green Pioneers Territory');
  const [loading, setLoading] = useState(true);
  const [boosting, setBoosting] = useState(false);
  const [activeFilter, setActiveFilter] = useState<'Wild' | 'Circular' | 'Raids' | 'Both'>('Both');
  const [isSheetExpanded, setIsSheetExpanded] = useState<boolean>(true);
  const [wildMarkers, setWildMarkers] = useState<MapMarkerItem[]>(DEFAULT_WILD_MARKERS);
  const [circularMarkers, setCircularMarkers] = useState<MapMarkerItem[]>(DEFAULT_CIRCULAR_MARKERS);
  const [raidMarkers, setRaidMarkers] = useState<MapMarkerItem[]>([]);
  const [activeRaids, setActiveRaids] = useState<CleanRaid[]>([]);
  const [joiningRaidId, setJoiningRaidId] = useState<string | null>(null);

  const fetchMarkers = async (userId?: string) => {
    try {
      if (userId) {
        const obs = await fetchUserCollectionBook(userId);
        if (obs && obs.length > 0) {
          const userWild: MapMarkerItem[] = obs.map((item, idx) => ({
            id: item.id || `obs-${idx}`,
            lat: item.gps_lat || 16.7475 + (idx * 0.001 - 0.001),
            lng: item.gps_lng || 74.4675 + (idx * 0.001 - 0.001),
            title: item.species_label,
            subtitle: `Logged Sighting • ${item.rarity_tier || 'Common'}`,
            type: 'wild',
            badgeIcon: item.rarity_tier === 'Legendary' ? '👑' : item.rarity_tier === 'Amber' ? '⭐' : '🌿',
          }));
          setWildMarkers([...userWild, ...DEFAULT_WILD_MARKERS]);
        }

        const txs = await fetchUserWasteHistory(userId);
        if (txs && txs.length > 0) {
          const userCirc: MapMarkerItem[] = txs.map((item, idx) => ({
            id: item.id || `tx-${idx}`,
            lat: 16.7480 + (idx * 0.0008 - 0.0008),
            lng: 74.4685 + (idx * 0.0008 - 0.0008),
            title: `${item.category} Recycled`,
            subtitle: `Waste Log • ${item.weight_estimate}kg (₹${item.payout_amount})`,
            type: 'circular',
            badgeIcon: '♻️',
          }));
          setCircularMarkers([...userCirc, ...DEFAULT_CIRCULAR_MARKERS]);
        }
      }

      const raids = await fetchActiveRaids();
      setActiveRaids(raids);
      const rMarkers: MapMarkerItem[] = raids.map((r) => ({
        id: r.id,
        lat: r.lat,
        lng: r.lng,
        title: r.title,
        subtitle: `Clean Raid • ${r.participant_count || 0} Joined`,
        type: 'raid',
        badgeIcon: '🧹',
      }));
      setRaidMarkers(rMarkers);
    } catch (e) {
      console.warn('[MapScreen] Marker fetch error:', e);
    }
  };

  useFocusEffect(
    React.useCallback(() => {
      let isMounted = true;
      const refetchData = async () => {
        const data = await fetchPilotTerritory();
        if (data && isMounted) {
          setTerritory(data);
        }
        if (user?.id && isMounted) {
          await fetchMarkers(user.id);
        }
      };
      refetchData();
      return () => {
        isMounted = false;
      };
    }, [user?.id])
  );

  useEffect(() => {
    let isMounted = true;
    let unsubscribe: (() => void) | undefined;

    const loadTerritoryAndLocation = async () => {
      setLoading(true);
      try {
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status === 'granted') {
          const location = await Location.getCurrentPositionAsync({});
          if (isMounted) {
            setDeviceLocation({
              lat: location.coords.latitude,
              lng: location.coords.longitude,
            });
          }
        } else if (isMounted) {
          setLocationDenied(true);
        }
      } catch (err) {
        console.warn('[MapScreen] Device location error:', err);
      }

      const data = await fetchPilotTerritory();
      if (!isMounted) return;

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

      if (user?.id && isMounted) {
        fetchMarkers(user.id);
      }

      const sub = subscribeToTerritoryChanges(PILOT_TERRITORY_ID, (updated) => {
        if (isMounted && updated.health_score !== undefined) {
          setTerritory((prev) =>
            prev ? { ...prev, health_score: updated.health_score! } : null
          );
        }
      });

      if (!isMounted) {
        sub();
      } else {
        unsubscribe = sub;
      }
    };

    loadTerritoryAndLocation();

    return () => {
      isMounted = false;
      if (unsubscribe) unsubscribe();
    };
  }, [user?.id]);

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

  if (locationDenied) {
    return (
      <View style={[styles.container, { backgroundColor: colors.canvas_dark || '#142217', padding: 24, justifyContent: 'center' }]}>
        <DarkCard padding={24} style={{ alignItems: 'center', gap: 16 }}>
          <Ionicons name="location-outline" size={56} color={colors.green_vivid || '#4CAF72'} />
          <Text style={{ fontSize: 22, fontWeight: '700', color: colors.text_on_warm_primary || '#142217', textAlign: 'center' }}>
            Location Access Required
          </Text>
          <Text style={{ fontSize: 14, color: colors.text_on_warm_secondary || '#3E6B48', textAlign: 'center', lineHeight: 20 }}>
            EcoQuest needs location access to map your sightings and waste logs to your campus pilot territory.
          </Text>
          <TouchableOpacity
            style={{ backgroundColor: colors.green_vivid || '#4CAF72', paddingHorizontal: 20, paddingVertical: 12, borderRadius: 9999 }}
            onPress={() => setLocationDenied(false)}
          >
            <Text style={{ color: '#FFFFFF', fontWeight: '700', fontSize: 15 }}>Continue to Map</Text>
          </TouchableOpacity>
        </DarkCard>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.canvas_dark || '#142217' }]}>
      {/* 100% Full Bleed Map View */}
      <View style={styles.mapWrap}>
        <TerritoryMap
          latitude={deviceLocation?.lat ?? SGU_CAMPUS_REGION.latitude}
          longitude={deviceLocation?.lng ?? SGU_CAMPUS_REGION.longitude}
          polygonCoords={SGU_POLYGON}
          userLocation={deviceLocation}
          territoryCenter={{ lat: SGU_CAMPUS_REGION.latitude, lng: SGU_CAMPUS_REGION.longitude }}
          zoom={17}
          activeFilter={activeFilter}
          wildMarkers={wildMarkers}
          circularMarkers={circularMarkers}
          raidMarkers={raidMarkers}
        />

        {/* Floating Glass Top Bar */}
        <View style={[styles.floatingTopBar, { paddingTop: Math.max(insets.top, 16) }]} pointerEvents="box-none">
          <View
            style={[
              styles.glassBar,
              {
                backgroundColor: colors.glassBackground || 'rgba(255, 255, 255, 0.88)',
                borderRadius: radii.pill,
                borderWidth: 1,
                borderColor: 'rgba(255, 255, 255, 0.4)',
              },
              shadows.floating,
            ]}
          >
            <HealthRing score={currentScore} size={42} strokeWidth={4} showLabel={false} />
            <View style={{ flex: 1 }}>
              <Text style={[styles.territoryName, { color: colors.text_on_warm_primary || '#142217' }]}>
                {areaName}
              </Text>
              <Text style={[styles.territorySub, { color: colors.text_on_warm_secondary || '#3E6B48' }]}>
                Live Health Score: {currentScore}%
              </Text>
            </View>
          </View>

          {/* Floating Filter Chips ScrollView */}
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.filterChipScroll}
            pointerEvents="auto"
          >
            <FilterPill
              label="Wild Layer"
              icon="leaf-outline"
              active={activeFilter === 'Wild'}
              onPress={() => setActiveFilter('Wild')}
              canvas="warm"
            />
            <FilterPill
              label="Circular Layer"
              icon="sync-outline"
              active={activeFilter === 'Circular'}
              onPress={() => setActiveFilter('Circular')}
              canvas="warm"
            />
            <FilterPill
              label="Clean Raids"
              icon="shield-checkmark-outline"
              active={activeFilter === 'Raids'}
              onPress={() => setActiveFilter('Raids')}
              canvas="warm"
            />
            <FilterPill
              label="All Layers"
              icon="layers-outline"
              active={activeFilter === 'Both'}
              onPress={() => setActiveFilter('Both')}
              canvas="warm"
            />
          </ScrollView>
        </View>

        {/* Bottom Sheet Details */}
        <View
          style={[
            styles.bottomSheetWrapper,
            { bottom: Math.max(insets.bottom, 12) + 76 }
          ]}
          pointerEvents="box-none"
        >
          <BottomSheetContainer style={styles.bottomSheetContainer}>
            <TouchableOpacity
              style={styles.sheetHeaderTouch}
              onPress={() => setIsSheetExpanded(!isSheetExpanded)}
              activeOpacity={0.8}
            >
              <View style={{ flex: 1 }}>
                <Text style={[styles.sheetTitle, { color: colors.text_airy_primary || '#161d18' }]}>{areaName}</Text>
                <View style={styles.statusRow}>
                  <View style={[styles.statusDot, { backgroundColor: colors.green_vivid || '#2BB673' }]} />
                  <Text style={[styles.statusText, { color: colors.green_vivid || '#2BB673' }]}>Active Territory</Text>
                </View>
              </View>

              <View style={styles.scoreCol}>
                <Text style={[styles.scoreNumber, { color: colors.green_vivid || '#2BB673' }]}>{currentScore}%</Text>
                <Ionicons name={isSheetExpanded ? 'chevron-down' : 'chevron-up'} size={18} color={colors.green_vivid || '#2BB673'} />
              </View>
            </TouchableOpacity>

            {isSheetExpanded && (
              <ScrollView
                style={{ maxHeight: 300 }}
                contentContainerStyle={styles.expandedContent}
                nestedScrollEnabled
                showsVerticalScrollIndicator={true}
              >
                <View style={styles.metricsGrid}>
                  <MetricCard label="Decay Risk" value="Low" valueColor={colors.green_vivid || '#2BB673'} />
                  <MetricCard label="Carbon Capture" value="12.4t / yr" valueColor={colors.text_airy_primary || '#161d18'} />
                </View>

                {activeRaids.length > 0 && (
                  <View style={styles.recentSection}>
                    <View style={styles.sectionHeaderRow}>
                      <Text style={[styles.recentTitle, { color: colors.text_on_warm_primary }]}>Active Clean Raids</Text>
                      <Text style={[styles.raidCountBadge, { color: colors.green_vivid || '#2BB673' }]}>
                        {activeRaids.length} Active
                      </Text>
                    </View>
                    {activeRaids.map((raid) => (
                      <TouchableOpacity
                        key={raid.id}
                        style={[
                          styles.actionRow,
                          {
                            backgroundColor: colors.card_warm_soft || '#FFFDF9',
                            borderRadius: radii.lg || 20,
                            borderWidth: 1,
                            borderColor: 'rgba(232, 169, 32, 0.25)',
                          },
                        ]}
                        onPress={() => navigation.navigate('RaidDetail', { raidId: raid.id })}
                        activeOpacity={0.8}
                      >
                        <View style={[styles.actionIconBg, { backgroundColor: colors.amber_subtle || 'rgba(232, 169, 32, 0.15)', borderRadius: 20 }]}>
                          <Ionicons name="shield-checkmark" size={20} color={colors.amber || '#E8A920'} />
                        </View>
                        <View style={{ flex: 1 }}>
                          <Text style={[styles.actionTitle, { color: colors.text_on_warm_primary }]}>{raid.title}</Text>
                          <Text style={[styles.actionSub, { color: colors.text_on_warm_secondary }]}>
                            Group Cleanup • {raid.participant_count || 0} Joined
                          </Text>
                        </View>
                        <StatusBadge label="Details" variant="warning" />
                      </TouchableOpacity>
                    ))}
                  </View>
                )}

                <TouchableOpacity
                  style={[
                    styles.boostBtn,
                    {
                      backgroundColor: colors.green_glow || 'rgba(43, 182, 115, 0.15)',
                      borderColor: colors.green_vivid || '#2BB673',
                      borderWidth: 1.5,
                      borderRadius: radii.pill || 9999,
                    },
                  ]}
                  onPress={handleTestScoreBoost}
                  disabled={boosting}
                  activeOpacity={0.8}
                >
                  {boosting ? (
                    <ActivityIndicator size="small" color={colors.green_vivid || '#2BB673'} />
                  ) : (
                    <>
                      <Ionicons name="flash" size={17} color={colors.green_vivid || '#2BB673'} />
                      <Text style={[styles.boostText, { color: colors.green_vivid || '#2BB673' }]}>
                        Test RPC Boost (+5 Score)
                      </Text>
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
    backgroundColor: '#142217',
  },
  floatingTopBar: {
    position: 'absolute',
    top: 0,
    left: 16,
    right: 16,
    gap: 10,
    zIndex: 20,
  },
  glassBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 9999,
    gap: 12,
  },
  territoryName: {
    fontSize: 16,
    fontWeight: '700',
  },
  territorySub: {
    fontSize: 12,
  },
  filterChipScroll: {
    gap: 8,
    paddingVertical: 4,
  },
  bottomSheetWrapper: {
    position: 'absolute',
    left: 0,
    right: 0,
    zIndex: 50,
  },
  bottomSheetContainer: {
    paddingBottom: 20,
  },
  sheetHeaderTouch: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 6,
  },
  sheetTitle: {
    fontSize: 18,
    fontWeight: '700',
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
    fontWeight: '600',
  },
  scoreCol: {
    alignItems: 'center',
    gap: 2,
  },
  scoreNumber: {
    fontSize: 22,
    fontWeight: '700',
  },
  expandedContent: {
    marginTop: 8,
    paddingBottom: 20,
    gap: 12,
  },
  metricsGrid: {
    flexDirection: 'row',
    gap: 12,
  },
  recentSection: {
    gap: 8,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  recentTitle: {
    fontSize: 13,
    fontWeight: '700',
  },
  raidCountBadge: {
    fontSize: 12,
    fontWeight: '700',
  },
  actionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    gap: 12,
  },
  actionIconBg: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionTitle: {
    fontSize: 14,
    fontWeight: '700',
  },
  actionSub: {
    fontSize: 12,
    marginTop: 1,
  },
  boostBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 13,
    borderRadius: 9999,
    gap: 8,
    marginTop: 6,
    marginBottom: 4,
  },
  boostText: {
    fontSize: 14,
    fontWeight: '700',
  },
});
