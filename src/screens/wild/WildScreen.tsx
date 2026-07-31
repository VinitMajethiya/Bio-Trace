import React, { useEffect, useState } from 'react';
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  TouchableOpacity,
  Image,
  ActivityIndicator,
  Modal,
  Alert,
  RefreshControl,
  Switch,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRoute } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';

import { useTheme } from '../../providers/ThemeProvider';
import { useAuth } from '../../context/AuthContext';
import { BioHeader } from '../../components/common/BioHeader';
import { BioCard } from '../../components/common/BioCard';
import { HeroImage } from '../../components/common/HeroImage';
import { RewardBanner } from '../../components/common/RewardBanner';
import { EcoCard } from '../../components/common/EcoCard';
import { StatusBadge } from '../../components/common/StatusBadge';
import { PrimaryButton } from '../../components/common/PrimaryButton';
import { SecondaryButton } from '../../components/common/SecondaryButton';
import { ScannerOverlay } from '../../components/common/ScannerOverlay';
import { GlassBanner } from '../../components/common/GlassBanner';
import { EmptyState } from '../../components/common/EmptyState';

import { captureTier0Metadata, Tier0Metadata } from '../../lib/trustEngine';
import {
  identifySpeciesWithHuggingFace,
  submitSpeciesObservation,
  fetchUserCollectionBook,
  SpeciesObservation,
  IdentificationResult,
} from '../../lib/wild';

const SHOW_DEV_TOOLS = true;

export const WildScreen: React.FC = () => {
  const insets = useSafeAreaInsets();
  const route = useRoute<any>();
  const { colors, radii } = useTheme();
  const { user } = useAuth();

  // GPS & Location Check State
  const [gpsMetadata, setGpsMetadata] = useState<Tier0Metadata | null>(null);
  const [checkingGps, setCheckingGps] = useState<boolean>(true);
  const [bypassGps, setBypassGps] = useState<boolean>(false);

  // Sightings & Collection Book State
  const [observations, setObservations] = useState<SpeciesObservation[]>([]);
  const [loadingObservations, setLoadingObservations] = useState<boolean>(true);
  const [refreshing, setRefreshing] = useState<boolean>(false);

  // Capture & AI Modal State
  const [capturedPhoto, setCapturedPhoto] = useState<string | null>(null);
  const [aiAnalyzing, setAiAnalyzing] = useState<boolean>(false);
  const [aiResult, setAiResult] = useState<IdentificationResult | null>(null);
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [modalVisible, setModalVisible] = useState<boolean>(false);
  const [showCameraScannerUI, setShowCameraScannerUI] = useState<boolean>(false);

  useEffect(() => {
    runGpsCheck();
    loadCollectionBook();
  }, [user]);

  useEffect(() => {
    if (route.params?.autoScan) {
      handleLaunchCamera();
    }
  }, [route.params?.autoScan]);

  const runGpsCheck = async () => {
    setCheckingGps(true);
    const res = await captureTier0Metadata();
    if (res.success && res.metadata) {
      setGpsMetadata(res.metadata);
    } else {
      setGpsMetadata(null);
    }
    setCheckingGps(false);
  };

  const loadCollectionBook = async () => {
    if (!user) return;
    setLoadingObservations(true);
    const data = await fetchUserCollectionBook(user.id);
    setObservations(data);
    setLoadingObservations(false);
    setRefreshing(false);
  };

  const onRefresh = () => {
    setRefreshing(true);
    runGpsCheck();
    loadCollectionBook();
  };

  const handleLaunchCamera = async () => {
    const isInside = gpsMetadata?.inside_boundary || (SHOW_DEV_TOOLS && bypassGps);

    if (!isInside) {
      Alert.alert(
        'Outside Pilot Zone',
        'Species sightings must be logged within the SGU Campus Pilot Zone. Enable "Bypass GPS Test Mode" to test off-campus.'
      );
      return;
    }

    try {
      const cameraPerm = await ImagePicker.requestCameraPermissionsAsync();
      if (!cameraPerm.granted) {
        Alert.alert('Camera Permission Required', 'Please grant camera access to snap species photos.');
        return;
      }

      setShowCameraScannerUI(true);
      const pickerResult = await ImagePicker.launchCameraAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        quality: 0.8,
        base64: true,
      });

      setShowCameraScannerUI(false);
      if (!pickerResult.canceled && pickerResult.assets.length > 0) {
        const photo = pickerResult.assets[0];
        setCapturedPhoto(photo.uri);
        setModalVisible(true);
        processAiIdentification(photo.base64 || photo.uri);
      }
    } catch (err) {
      console.warn('[WildScreen] Camera launch error, opening gallery:', err);
      setShowCameraScannerUI(false);
      handleLaunchGallery();
    }
  };

  const handleLaunchGallery = async () => {
    const isInside = gpsMetadata?.inside_boundary || (SHOW_DEV_TOOLS && bypassGps);

    if (!isInside) {
      Alert.alert(
        'Outside Pilot Zone',
        'Species sightings must be logged within the SGU Campus Pilot Zone. Enable "Bypass GPS Test Mode" to test off-campus.'
      );
      return;
    }

    try {
      const pickerResult = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        quality: 0.8,
        base64: true,
      });

      if (!pickerResult.canceled && pickerResult.assets.length > 0) {
        const photo = pickerResult.assets[0];
        setCapturedPhoto(photo.uri);
        setModalVisible(true);
        processAiIdentification(photo.base64 || photo.uri);
      }
    } catch (err) {
      Alert.alert('Image Picker Error', 'Could not open image gallery.');
    }
  };

  const processAiIdentification = async (photoData: string) => {
    setAiAnalyzing(true);
    setAiResult(null);

    const result = await identifySpeciesWithHuggingFace(photoData);
    setAiResult(result);
    setAiAnalyzing(false);
  };

  const handleConfirmSighting = async () => {
    if (!user || !aiResult) return;

    setSubmitting(true);
    const res = await submitSpeciesObservation(
      user.id,
      aiResult,
      gpsMetadata?.gps_lat,
      gpsMetadata?.gps_lng,
      capturedPhoto || undefined
    );

    setSubmitting(false);

    if (res.success) {
      Alert.alert(
        '🎉 Sighting Verified!',
        `Identified: ${aiResult.species_label}\nReward: +${aiResult.xp_reward} Wild XP & +3 Territory Health Score!`
      );
      setModalVisible(false);
      setCapturedPhoto(null);
      setAiResult(null);
      loadCollectionBook();
    } else {
      Alert.alert('Submission Error', res.error || 'Failed to record species observation.');
    }
  };

  const isInside = gpsMetadata?.inside_boundary || (SHOW_DEV_TOOLS && bypassGps);

  return (
    <View style={[styles.container, { backgroundColor: colors.background, paddingTop: Math.max(insets.top, 8) }]}>
      {/* Top Header */}
      <BioHeader title="BioVerse" />

      <ScrollView
        contentContainerStyle={styles.content}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />}
      >
        {/* GPS Check-in Banner */}
        <BioCard variant="outlined" padding={12} style={styles.gpsBanner}>
          <View style={styles.gpsRow}>
            <Ionicons name={isInside ? 'location' : 'location-outline'} size={20} color={isInside ? colors.primary : colors.textDanger} />
            <View style={{ flex: 1 }}>
              <Text style={[styles.gpsTitle, { color: colors.textPrimary }]}>
                {checkingGps ? 'Checking Location...' : isInside ? 'SGU Pilot Zone Verified' : 'Outside Pilot Zone'}
              </Text>
              <Text style={[styles.gpsSub, { color: colors.textSecondary }]}>
                {isInside ? 'You are within bounds to log native species.' : 'Requires being on campus or test mode.'}
              </Text>
            </View>
          </View>

          {SHOW_DEV_TOOLS && (
            <View style={[styles.switchRow, { borderTopColor: colors.surfaceBorder }]}>
              <Text style={[styles.switchLabel, { color: colors.textSecondary }]}>Bypass GPS Test Mode (DEV Only)</Text>
              <Switch
                value={bypassGps}
                onValueChange={setBypassGps}
                trackColor={{ false: '#CBD5E1', true: colors.primaryLight }}
                thumbColor={bypassGps ? colors.primary : '#94A3B8'}
              />
            </View>
          )}
        </BioCard>

        {/* Featured Species Identified Card View (Matches Reference Image 2 Right Side) */}
        <BioCard variant="elevated" padding={16} style={styles.heroCard}>
          <HeroImage
            uri={capturedPhoto || 'https://images.unsplash.com/photo-1549608276-5786777e6587?w=800'}
            badgeLabel="VERIFIED"
            moduleLabel="WILD MODULE"
            height={190}
          />
          <Text style={[styles.speciesIdentifiedTitle, { color: colors.primaryDark }]}>
            Species Identified: {aiResult?.species_label || 'Monarch Butterfly'}
          </Text>

          {/* Reward Banner */}
          <RewardBanner gpAmount={50} xpAmount={aiResult?.xp_reward || 120} />

          {/* 2 Grid Cards Side-by-Side */}
          <View style={styles.gridRow}>
            <EcoCard
              title="HEALTH IMPACT"
              type="health"
              valueText="+0.5%"
              subText="Territory Health progress in Silver Creek Park."
            />
            <EcoCard
              title="ECO ROLE"
              type="role"
              valueText="Vital pollinator for local wildflower diversity and ecosystem stability."
            />
          </View>

          {/* Conservation Note */}
          <BioCard variant="subtle" padding={14} style={styles.noteCard}>
            <Text style={[styles.noteTitle, { color: colors.textPrimary }]}>Conservation Note</Text>
            <Text style={[styles.noteText, { color: colors.textSecondary }]}>
              The Monarch Butterfly (Danaus plexippus) is a flagship species for conservation. Its presence indicates a healthy habitat rich in native flora.
            </Text>
          </BioCard>

          {/* Action CTAs */}
          <View style={styles.btnRow}>
            <PrimaryButton title="Snap Species Photo" icon="aperture" onPress={handleLaunchCamera} style={{ flex: 1 }} />
            <SecondaryButton title="Upload Photo" icon="images-outline" onPress={handleLaunchGallery} style={{ flex: 1 }} />
          </View>
        </BioCard>

        {/* Collection Book */}
        <View style={styles.sectionHeaderRow}>
          <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>My Collection Book</Text>
          <Text style={[styles.sectionCount, { color: colors.primary }]}>{observations.length} Found</Text>
        </View>

        {loadingObservations ? (
          <ActivityIndicator size="small" color={colors.primary} style={{ marginTop: 16 }} />
        ) : observations.length === 0 ? (
          <EmptyState
            icon="book-outline"
            title="Collection Book Empty"
            description="Snap a bird photo using the camera button above to log your first verified species!"
            actionTitle="Snap Photo Now"
            onActionPress={handleLaunchCamera}
          />
        ) : (
          <View style={styles.collectionGrid}>
            {observations.map((item, index) => (
              <BioCard key={item.id || index.toString()} variant="outlined" padding={8} style={styles.collectionCard}>
                <Image source={{ uri: item.photo_url || 'https://images.unsplash.com/photo-1549608276-5786777e6587?w=400' }} style={styles.collectionThumb} />
                <Text style={[styles.collectionName, { color: colors.textPrimary }]} numberOfLines={1}>
                  {item.species_label}
                </Text>
                <View style={styles.collectionFooter}>
                  <StatusBadge label={item.rarity_tier || 'Common'} variant="success" />
                  <Text style={[styles.confText, { color: colors.textSecondary }]}>{item.confidence}%</Text>
                </View>
              </BioCard>
            ))}
          </View>
        )}
      </ScrollView>

      {/* Camera Viewfinder Overlay (Scanner Mode matching Image 2 Left) */}
      {showCameraScannerUI && (
        <Modal visible={showCameraScannerUI} animationType="fade" transparent>
          <View style={styles.cameraOverlayContainer}>
            <GlassBanner title="ACTIVE MISSION" subtitle="Log 3 different pollinators (2/3)" />
            <ScannerOverlay detectedLabel="Monarch Butterfly" confidence={98} />
          </View>
        </Modal>
      )}

      {/* AI Analysis & Result Modal */}
      <Modal visible={modalVisible} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <BioCard variant="elevated" padding={20} style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: colors.textPrimary }]}>Species Identified</Text>
              <TouchableOpacity onPress={() => setModalVisible(false)}>
                <Ionicons name="close" size={24} color={colors.textSecondary} />
              </TouchableOpacity>
            </View>

            {capturedPhoto && <Image source={{ uri: capturedPhoto }} style={styles.previewImg} />}

            {aiAnalyzing ? (
              <View style={styles.loadingBox}>
                <ActivityIndicator size="large" color={colors.primary} />
                <Text style={[styles.loadingTitle, { color: colors.textPrimary }]}>Running Vision AI...</Text>
              </View>
            ) : aiResult ? (
              <View style={styles.resultBox}>
                <Text style={[styles.speciesNameText, { color: colors.primaryDark }]}>{aiResult.species_label}</Text>
                <RewardBanner gpAmount={50} xpAmount={aiResult.xp_reward} />
                <PrimaryButton title="Claim XP & Save to Collection" icon="gift" onPress={handleConfirmSighting} loading={submitting} />
              </View>
            ) : null}
          </BioCard>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    padding: 16,
    gap: 16,
    paddingBottom: 80,
  },
  gpsBanner: {
    gap: 8,
  },
  gpsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  gpsTitle: {
    fontSize: 14,
    fontWeight: '700',
  },
  gpsSub: {
    fontSize: 12,
    marginTop: 2,
  },
  switchRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderTopWidth: 1,
    paddingTop: 8,
    marginTop: 4,
  },
  switchLabel: {
    fontSize: 12,
    fontWeight: '600',
  },
  heroCard: {
    gap: 12,
  },
  speciesIdentifiedTitle: {
    fontSize: 18,
    fontWeight: '800',
  },
  gridRow: {
    flexDirection: 'row',
    gap: 12,
  },
  noteCard: {
    gap: 4,
  },
  noteTitle: {
    fontSize: 13,
    fontWeight: '700',
  },
  noteText: {
    fontSize: 12,
    lineHeight: 16,
  },
  btnRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 4,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'baseline',
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
  },
  sectionCount: {
    fontSize: 13,
    fontWeight: '700',
  },
  collectionGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  collectionCard: {
    width: '48%',
    gap: 6,
  },
  collectionThumb: {
    width: '100%',
    height: 100,
    borderRadius: 12,
  },
  collectionName: {
    fontSize: 13,
    fontWeight: '700',
  },
  collectionFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  confText: {
    fontSize: 11,
  },
  cameraOverlayContainer: {
    flex: 1,
    backgroundColor: '#000000',
    paddingTop: 50,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.6)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    gap: 14,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '800',
  },
  previewImg: {
    width: '100%',
    height: 180,
    borderRadius: 16,
  },
  loadingBox: {
    alignItems: 'center',
    paddingVertical: 20,
    gap: 10,
  },
  loadingTitle: {
    fontSize: 14,
    fontWeight: '700',
  },
  resultBox: {
    gap: 12,
  },
  speciesNameText: {
    fontSize: 20,
    fontWeight: '800',
  },
});
