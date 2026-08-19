import React, { useEffect, useState } from 'react';
import { StyleSheet, Text, View, TouchableOpacity, Alert, ActivityIndicator } from 'react-native';
import Animated, { useSharedValue, useAnimatedStyle, withSpring } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRoute, useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import * as Location from 'expo-location';

import { TaxonGroup } from '../../constants/rarityTiers';
import { getZoneMultiplier, DEFAULT_PILOT_BOUNDARY } from '../../lib/territory';
import { useTheme } from '../../providers/ThemeProvider';
import { FilterPill } from '../../components/common/FilterChip';

export const CameraScreen: React.FC = () => {
  const insets = useSafeAreaInsets();
  const route = useRoute<any>();
  const navigation = useNavigation<any>();
  const { colors, radii } = useTheme();

  const taxonGroup: TaxonGroup = route.params?.taxonGroup || 'birds';
  const guidance: string = route.params?.guidance || 'Point camera at target species.';

  const [launching, setLaunching] = useState<boolean>(false);
  const [zoneBanner, setZoneBanner] = useState<{ label: string | null; multiplier: number } | null>(null);

  const shutterScale = useSharedValue(1);

  const shutterAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: shutterScale.value }],
  }));

  useEffect(() => {
    checkLocationZone();
  }, []);

  const checkLocationZone = async () => {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status === 'granted') {
        const loc = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
        const userCoords = { latitude: loc.coords.latitude, longitude: loc.coords.longitude };
        const zone = getZoneMultiplier(userCoords, DEFAULT_PILOT_BOUNDARY);
        setZoneBanner({ label: zone.label, multiplier: zone.multiplier });
      } else {
        setZoneBanner({ label: null, multiplier: 1.0 });
      }
    } catch (err) {
      setZoneBanner({ label: null, multiplier: 1.0 });
    }
  };

  const handleOpenCamera = async () => {
    try {
      shutterScale.value = withSpring(0.9, { damping: 12 }, () => {
        shutterScale.value = withSpring(1);
      });

      setLaunching(true);
      const cameraPerm = await ImagePicker.requestCameraPermissionsAsync();
      if (!cameraPerm.granted) {
        Alert.alert('Camera Permission Required', 'Please grant camera access to snap species photos.');
        setLaunching(false);
        return;
      }

      const pickerResult = await ImagePicker.launchCameraAsync({
        mediaTypes: ['images'],
        quality: 0.8,
        base64: true,
        exif: true,
      });

      setLaunching(false);
      if (!pickerResult.canceled && pickerResult.assets.length > 0) {
        const photo = pickerResult.assets[0];
        navigation.navigate('ScanResultsScreen', {
          photoUri: photo.uri,
          imageBase64: photo.base64,
          taxonGroup,
          zoneMultiplier: zoneBanner?.multiplier || 1.0,
          zoneLabel: zoneBanner?.label,
        });
      }
    } catch (err) {
      setLaunching(false);
      Alert.alert('Camera Error', 'Could not launch device camera.');
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.canvas_dark || '#142217', paddingTop: Math.max(insets.top, 16) }]}>
      {/* Top Bar */}
      <View style={styles.topBar}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.closeBtn}>
          <Ionicons name="close" size={28} color={colors.text_on_dark_primary || '#F0F7F1'} />
        </TouchableOpacity>
        <Text style={[styles.topTitle, { color: colors.green_vivid || '#4CAF72' }]}>
          {taxonGroup.toUpperCase()} SCANNER
        </Text>
        <View style={{ width: 40 }} />
      </View>

      {/* Zone Multiplier Floating Pill */}
      {zoneBanner?.label && (
        <View style={styles.zonePillWrapper}>
          <FilterPill
            label={`${zoneBanner.label} (${zoneBanner.multiplier}x Multiplier)`}
            icon="location-outline"
            active
            onPress={() => {}}
            canvas="dark"
          />
        </View>
      )}

      {/* Viewfinder Center Frame */}
      <View style={styles.viewfinderContainer}>
        <View style={[styles.viewfinderFrame, { borderColor: colors.green_vivid || '#4CAF72' }]}>
          <Ionicons name="scan-outline" size={80} color="rgba(76, 175, 114, 0.6)" />
        </View>
        <Text style={[styles.guidanceText, { color: colors.text_on_dark_secondary || '#8DB89A' }]}>
          {guidance}
        </Text>
      </View>

      {/* Bottom Shutter Button */}
      <View style={[styles.bottomBar, { paddingBottom: Math.max(insets.bottom, 24) }]}>
        <Animated.View style={shutterAnimatedStyle}>
          <TouchableOpacity
            style={[styles.shutterBtn, { backgroundColor: colors.green_vivid || '#4CAF72' }]}
            onPress={handleOpenCamera}
            disabled={launching}
            activeOpacity={0.85}
          >
            {launching ? (
              <ActivityIndicator size="large" color="#FFFFFF" />
            ) : (
              <View style={styles.shutterInner} />
            )}
          </TouchableOpacity>
        </Animated.View>
        <Text style={[styles.shutterText, { color: colors.text_on_dark_secondary || '#8DB89A' }]}>
          Tap to Launch Camera
        </Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'space-between',
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
  },
  closeBtn: {
    padding: 8,
  },
  topTitle: {
    fontSize: 14,
    fontWeight: '700',
    letterSpacing: 1.2,
  },
  zonePillWrapper: {
    alignSelf: 'center',
    marginTop: 8,
  },
  viewfinderContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 30,
    gap: 20,
  },
  viewfinderFrame: {
    width: 260,
    height: 260,
    borderRadius: 36,
    borderWidth: 2,
    borderStyle: 'dashed',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(20, 34, 23, 0.4)',
  },
  guidanceText: {
    fontSize: 14,
    textAlign: 'center',
    paddingHorizontal: 20,
    lineHeight: 20,
  },
  bottomBar: {
    alignItems: 'center',
    gap: 10,
  },
  shutterBtn: {
    width: 72,
    height: 72,
    borderRadius: 36,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 4,
    borderColor: '#FFFFFF',
  },
  shutterInner: {
    width: 54,
    height: 54,
    borderRadius: 27,
    backgroundColor: '#FFFFFF',
  },
  shutterText: {
    fontSize: 12,
    fontWeight: '600',
  },
});
