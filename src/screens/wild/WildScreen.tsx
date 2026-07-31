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
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { useAuth } from '../../context/AuthContext';
import { captureTier0Metadata, Tier0Metadata } from '../../lib/trustEngine';
import {
  identifySpeciesWithHuggingFace,
  submitSpeciesObservation,
  fetchUserCollectionBook,
  SpeciesObservation,
  IdentificationResult,
} from '../../lib/wild';

// Set to false right before live demo presentation to hide bypass tools
const SHOW_DEV_TOOLS = true;

export const WildScreen: React.FC = () => {
  const insets = useSafeAreaInsets();
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

  // Initial Load: Check GPS & Load Collection Book
  useEffect(() => {
    runGpsCheck();
    loadCollectionBook();
  }, [user]);

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

  // Launch Camera or Gallery Picker
  const handleLaunchCamera = async () => {
    // 3.1 GPS Boundary check
    const isInside = gpsMetadata?.inside_boundary || (SHOW_DEV_TOOLS && bypassGps);
    if (!isInside) {
      Alert.alert(
        'Outside Pilot Territory',
        'Species sightings must be logged within the SGU Campus Pilot Zone. Enable "Bypass GPS for Testing" below if you are testing off-campus.',
        [{ text: 'OK' }]
      );
      return;
    }

    try {
      const permission = await ImagePicker.requestCameraPermissionsAsync();
      if (!permission.granted) {
        Alert.alert('Camera Permission Required', 'Please grant camera access to capture species photos.');
        return;
      }

      const pickerResult = await ImagePicker.launchCameraAsync({
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
      console.warn('Failed to launch camera, falling back to photo library:', err);
      handleLaunchGallery();
    }
  };

  const handleLaunchGallery = async () => {
    const isInside = gpsMetadata?.inside_boundary || (SHOW_DEV_TOOLS && bypassGps);
    if (!isInside) {
      Alert.alert(
        'Outside Pilot Territory',
        'Species sightings must be logged within the SGU Campus Pilot Zone. Enable "Bypass GPS for Testing" below if you are testing off-campus.'
      );
      return;
    }

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
  };

  // 3.3 Run Hugging Face AI Identification
  const processAiIdentification = async (photoData: string) => {
    setAiAnalyzing(true);
    setAiResult(null);

    const result = await identifySpeciesWithHuggingFace(photoData);
    setAiResult(result);
    setAiAnalyzing(false);
  };

  // 3.6 Submit Sighting & Claim XP / Health Score
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

  const getRarityColor = (tier: string) => {
    if (tier === 'Legendary') return '#A855F7'; // Purple
    if (tier === 'Amber') return '#F59E0B'; // Gold/Amber
    return '#10B981'; // Common Green
  };

  const isInside = gpsMetadata?.inside_boundary || (SHOW_DEV_TOOLS && bypassGps);
  const dailyMissionComplete = observations.length > 0;
  const weeklyMissionCount = Math.min(3, observations.length);

  return (
    <View style={[styles.container, { paddingTop: Math.max(insets.top, 16) }]}>
      {/* Header */}
      <View style={styles.header}>
        <Ionicons name="compass" size={24} color="#10B981" />
        <Text style={styles.headerTitle}>Wild — Avian Biodiversity</Text>
      </View>

      <ScrollView
        contentContainerStyle={styles.content}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#10B981" />
        }
      >
        {/* GPS Check-in Banner */}
        <View style={styles.gpsBanner}>
          <View style={styles.gpsBannerLeft}>
            <Ionicons
              name={isInside ? 'location' : 'location-outline'}
              size={20}
              color={isInside ? '#10B981' : '#EF4444'}
            />
            <View style={{ flex: 1 }}>
              <Text style={styles.gpsBannerTitle}>
                {checkingGps
                  ? 'Checking GPS Check-In...'
                  : isInside
                  ? 'SGU Pilot Zone Verified'
                  : 'Outside Pilot Territory'}
              </Text>
              <Text style={styles.gpsBannerSub}>
                {isInside
                  ? 'You are within bounds for logging species.'
                  : 'Sighting logs require being on campus or enabling testing mode.'}
              </Text>
            </View>
          </View>

          {SHOW_DEV_TOOLS && (
            <View style={styles.switchRow}>
              <Text style={styles.switchLabel}>Bypass GPS Test Mode (DEV Only)</Text>
              <Switch
                value={bypassGps}
                onValueChange={setBypassGps}
                trackColor={{ false: '#374151', true: 'rgba(16, 185, 129, 0.4)' }}
                thumbColor={bypassGps ? '#10B981' : '#9CA3AF'}
              />
            </View>
          )}
        </View>

        {/* Species Sighting Action Card */}
        <View style={styles.heroCard}>
          <Ionicons name="camera" size={42} color="#34D399" />
          <Text style={styles.heroTitle}>Avian AI Identifier</Text>
          <Text style={styles.heroSub}>
            Snap a photo of native birds in the pilot zone. Real-time AI identifies species and awards Wild XP.
          </Text>

          <View style={styles.btnRow}>
            <TouchableOpacity style={styles.actionBtn} onPress={handleLaunchCamera}>
              <Ionicons name="aperture" size={18} color="#042F2E" />
              <Text style={styles.actionBtnText}>Snap Bird Photo</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.secondaryBtn} onPress={handleLaunchGallery}>
              <Ionicons name="images-outline" size={18} color="#34D399" />
              <Text style={styles.secondaryBtnText}>Upload Photo</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* 3.5 Basic Mission Log */}
        <View style={styles.sectionContainer}>
          <Text style={styles.sectionTitle}>Active Avian Quests</Text>
          <View style={styles.missionCard}>
            {/* Daily Quest */}
            <View style={styles.missionRow}>
              <View
                style={[
                  styles.missionBadge,
                  { backgroundColor: dailyMissionComplete ? 'rgba(16, 185, 129, 0.2)' : 'rgba(245, 158, 11, 0.15)' },
                ]}
              >
                <Ionicons
                  name={dailyMissionComplete ? 'checkmark-circle' : 'time-outline'}
                  size={20}
                  color={dailyMissionComplete ? '#10B981' : '#F59E0B'}
                />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.missionTitle}>Daily Quest: Spot 1 Bird Today</Text>
                <Text style={styles.missionSub}>
                  {dailyMissionComplete ? 'Completed! +25 GP Earned' : 'Progress: 0 / 1 Bird'}
                </Text>
              </View>
            </View>

            {/* Weekly Zone Mission */}
            <View style={[styles.missionRow, { borderTopWidth: 1, borderTopColor: '#19392B', paddingTop: 12 }]}>
              <View
                style={[
                  styles.missionBadge,
                  { backgroundColor: weeklyMissionCount >= 3 ? 'rgba(16, 185, 129, 0.2)' : 'rgba(96, 165, 250, 0.15)' },
                ]}
              >
                <Ionicons
                  name={weeklyMissionCount >= 3 ? 'checkmark-circle' : 'ribbon-outline'}
                  size={20}
                  color={weeklyMissionCount >= 3 ? '#10B981' : '#60A5FA'}
                />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.missionTitle}>Weekly Mission: Campus Avian Explorer</Text>
                <Text style={styles.missionSub}>
                  Progress: {weeklyMissionCount} / 3 Species Recorded in SGU Zone
                </Text>
              </View>
            </View>
          </View>
        </View>

        {/* 3.4 Collection Book UI */}
        <View style={styles.sectionContainer}>
          <View style={styles.sectionHeaderRow}>
            <Text style={styles.sectionTitle}>My Collection Book</Text>
            <Text style={styles.sectionCount}>{observations.length} Species Found</Text>
          </View>

          {loadingObservations ? (
            <ActivityIndicator size="small" color="#10B981" style={{ marginTop: 16 }} />
          ) : observations.length === 0 ? (
            <View style={styles.emptyCard}>
              <Ionicons name="book-outline" size={36} color="#4B5563" />
              <Text style={styles.emptyTitle}>Collection Book Empty</Text>
              <Text style={styles.emptySub}>
                Snap a bird photo using the camera button above to log your first verified species!
              </Text>
            </View>
          ) : (
            <View style={styles.collectionGrid}>
              {observations.map((item, index) => {
                const rarityColor = getRarityColor(item.rarity_tier);
                return (
                  <View key={item.id || index.toString()} style={styles.speciesCard}>
                    <Image
                      source={{
                        uri: item.photo_url || 'https://images.unsplash.com/photo-1549608276-5786777e6587?w=400',
                      }}
                      style={styles.speciesThumb}
                    />
                    <View style={styles.speciesCardBody}>
                      <Text style={styles.speciesName} numberOfLines={1}>
                        {item.species_label}
                      </Text>
                      <View style={styles.cardFooter}>
                        <View style={[styles.rarityPill, { borderColor: rarityColor }]}>
                          <Text style={[styles.rarityText, { color: rarityColor }]}>
                            {item.rarity_tier}
                          </Text>
                        </View>
                        <Text style={styles.confText}>{item.confidence}% AI</Text>
                      </View>
                    </View>
                  </View>
                );
              })}
            </View>
          )}
        </View>
      </ScrollView>

      {/* AI Analysis & Submission Modal */}
      <Modal visible={modalVisible} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Avian AI Identification</Text>
              <TouchableOpacity onPress={() => setModalVisible(false)}>
                <Ionicons name="close" size={24} color="#9CA3AF" />
              </TouchableOpacity>
            </View>

            {capturedPhoto && (
              <Image source={{ uri: capturedPhoto }} style={styles.modalPreviewImage} />
            )}

            {aiAnalyzing ? (
              <View style={styles.aiLoadingContainer}>
                <ActivityIndicator size="large" color="#10B981" />
                <Text style={styles.aiLoadingText}>Running Hugging Face AI Vision Model...</Text>
                <Text style={styles.aiLoadingSub}>Classifying species & validating features</Text>
              </View>
            ) : aiResult ? (
              <View style={styles.aiResultContainer}>
                <View style={styles.aiResultHeader}>
                  <Text style={styles.aiSpeciesTitle}>{aiResult.species_label}</Text>
                  <View style={[styles.rarityPill, { borderColor: getRarityColor(aiResult.rarity_tier) }]}>
                    <Text style={[styles.rarityText, { color: getRarityColor(aiResult.rarity_tier) }]}>
                      {aiResult.rarity_tier} Tier
                    </Text>
                  </View>
                </View>

                {aiResult.is_uncertain && (
                  <View style={styles.uncertainBanner}>
                    <Ionicons name="alert-circle" size={18} color="#F59E0B" />
                    <Text style={styles.uncertainText}>
                      Confidence &lt; 60% — Flagged for Community Review
                    </Text>
                  </View>
                )}

                <View style={styles.metaRow}>
                  <View style={styles.metaBadge}>
                    <Ionicons name="checkmark-circle-outline" size={16} color={aiResult.is_uncertain ? '#F59E0B' : '#10B981'} />
                    <Text style={styles.metaText}>{aiResult.confidence}% AI Match</Text>
                  </View>
                  <View style={styles.metaBadge}>
                    <Ionicons name="flash" size={16} color="#F59E0B" />
                    <Text style={styles.metaText}>+{aiResult.xp_reward} Wild XP</Text>
                  </View>
                </View>

                <TouchableOpacity
                  style={styles.claimBtn}
                  onPress={handleConfirmSighting}
                  disabled={submitting}
                >
                  {submitting ? (
                    <ActivityIndicator color="#042F2E" size="small" />
                  ) : (
                    <>
                      <Ionicons name="gift" size={18} color="#042F2E" />
                      <Text style={styles.claimBtnText}>Claim XP & Add to Book</Text>
                    </>
                  )}
                </TouchableOpacity>
              </View>
            ) : null}
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#07120E',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#132A20',
    gap: 8,
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: '#ECFDF5',
  },
  content: {
    padding: 16,
    gap: 16,
  },
  gpsBanner: {
    backgroundColor: '#0F241C',
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: '#19392B',
    gap: 12,
  },
  gpsBannerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  gpsBannerTitle: {
    color: '#ECFDF5',
    fontSize: 14,
    fontWeight: '700',
  },
  gpsBannerSub: {
    color: '#9CA3AF',
    fontSize: 12,
    marginTop: 2,
  },
  switchRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: '#19392B',
    paddingTop: 8,
  },
  switchLabel: {
    color: '#D1D5DB',
    fontSize: 12,
    fontWeight: '600',
  },
  heroCard: {
    backgroundColor: '#0F241C',
    borderRadius: 20,
    padding: 20,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#19392B',
  },
  heroTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#F0FDF4',
    marginTop: 8,
  },
  heroSub: {
    fontSize: 13,
    color: '#9CA3AF',
    textAlign: 'center',
    marginTop: 4,
    lineHeight: 18,
  },
  btnRow: {
    flexDirection: 'row',
    marginTop: 16,
    gap: 10,
    width: '100%',
  },
  actionBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#34D399',
    paddingVertical: 12,
    borderRadius: 12,
    gap: 6,
  },
  actionBtnText: {
    color: '#042F2E',
    fontSize: 14,
    fontWeight: '700',
  },
  secondaryBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(52, 211, 153, 0.12)',
    borderWidth: 1,
    borderColor: 'rgba(52, 211, 153, 0.3)',
    paddingVertical: 12,
    borderRadius: 12,
    gap: 6,
  },
  secondaryBtnText: {
    color: '#34D399',
    fontSize: 14,
    fontWeight: '700',
  },
  sectionContainer: {
    gap: 10,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'baseline',
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#E5E7EB',
  },
  sectionCount: {
    fontSize: 12,
    color: '#10B981',
    fontWeight: '600',
  },
  missionCard: {
    backgroundColor: '#0F241C',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: '#19392B',
    gap: 12,
  },
  missionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  missionBadge: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  missionTitle: {
    color: '#F3F4F6',
    fontSize: 14,
    fontWeight: '700',
  },
  missionSub: {
    color: '#9CA3AF',
    fontSize: 12,
    marginTop: 2,
  },
  collectionGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  speciesCard: {
    width: '48%',
    backgroundColor: '#0F241C',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#19392B',
    overflow: 'hidden',
  },
  speciesThumb: {
    width: '100%',
    height: 110,
    backgroundColor: '#071610',
  },
  speciesCardBody: {
    padding: 10,
    gap: 6,
  },
  speciesName: {
    color: '#ECFDF5',
    fontSize: 13,
    fontWeight: '700',
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  rarityPill: {
    borderWidth: 1,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8,
  },
  rarityText: {
    fontSize: 10,
    fontWeight: '700',
  },
  confText: {
    color: '#9CA3AF',
    fontSize: 11,
  },
  emptyCard: {
    backgroundColor: '#0F241C',
    borderRadius: 16,
    padding: 24,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#19392B',
  },
  emptyTitle: {
    color: '#D1D5DB',
    fontSize: 15,
    fontWeight: '700',
    marginTop: 8,
  },
  emptySub: {
    color: '#9CA3AF',
    fontSize: 12,
    textAlign: 'center',
    marginTop: 4,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#0F241C',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 20,
    borderTopWidth: 1.5,
    borderTopColor: '#10B981',
    gap: 16,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#ECFDF5',
  },
  modalPreviewImage: {
    width: '100%',
    height: 180,
    borderRadius: 16,
    backgroundColor: '#071610',
  },
  aiLoadingContainer: {
    alignItems: 'center',
    paddingVertical: 24,
    gap: 10,
  },
  aiLoadingText: {
    color: '#ECFDF5',
    fontSize: 15,
    fontWeight: '700',
  },
  aiLoadingSub: {
    color: '#9CA3AF',
    fontSize: 13,
  },
  aiResultContainer: {
    gap: 14,
  },
  aiResultHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  aiSpeciesTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: '#34D399',
  },
  metaRow: {
    flexDirection: 'row',
    gap: 12,
  },
  metaBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#071610',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
    gap: 6,
  },
  metaText: {
    color: '#E5E7EB',
    fontSize: 13,
    fontWeight: '600',
  },
  claimBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#34D399',
    height: 48,
    borderRadius: 14,
    marginTop: 8,
    gap: 8,
  },
  claimBtnText: {
    color: '#042F2E',
    fontSize: 15,
    fontWeight: '800',
  },
  uncertainBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(245, 158, 11, 0.15)',
    borderColor: 'rgba(245, 158, 11, 0.4)',
    borderWidth: 1,
    padding: 10,
    borderRadius: 10,
    gap: 8,
  },
  uncertainText: {
    color: '#FBBF24',
    fontSize: 12,
    fontWeight: '600',
    flex: 1,
  },
});
