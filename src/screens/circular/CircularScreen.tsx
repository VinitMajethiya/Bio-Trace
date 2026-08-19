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
  TextInput,
} from 'react-native';
import Animated, { useSharedValue, useAnimatedStyle, withTiming, Easing } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRoute, useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import * as Location from 'expo-location';
import { subscribeToPickup } from '../../lib/pickupRealtime';
import { supabase } from '../../lib/supabase';
import { uploadLockerPhotoToStorage } from '../../lib/storage';

import { useTheme } from '../../providers/ThemeProvider';
import { useAuth } from '../../context/AuthContext';
import { PrimaryButton } from '../../components/common/PrimaryButton';
import { SecondaryButton } from '../../components/common/SecondaryButton';
import { EmptyState } from '../../components/common/EmptyState';
import { FilterPill } from '../../components/common/FilterChip';
import { GreenPointsChip } from '../../components/common/GreenPointsChip';

import {
  MIN_PICKUP_WEIGHT_KG,
  WasteCategoryRate,
  LockerSession,
  LockerItemRecord,
  LockerItem,
  WasteScanResult,
  identifyWaste,
  fetchCategoryRates,
  getOrCreateActiveLockerSession,
  fetchLockerSessionItems,
  addItemToLockerSession,
  removeItemFromLockerSession,
  refreshLockerSession,
  scheduleLockerPickup,
  cancelOwnPickup,
  sanitizeEstimatedWeight,
  calculateEarthImpact,
} from '../../lib/circular';

import {
  getDynamicDiySuggestions,
  openYouTubeTutorial,
} from '../../lib/diy';

// =============================================
// Pickup Time Slots
// =============================================
const PICKUP_SLOTS = [
  { id: 'today_afternoon', label: 'Today · 4:00 - 6:00 PM' },
  { id: 'tomorrow_morning', label: 'Tomorrow · 9:00 - 11:00 AM' },
  { id: 'tomorrow_afternoon', label: 'Tomorrow · 2:00 - 4:00 PM' },
  { id: 'tomorrow_evening', label: 'Tomorrow · 5:00 - 7:00 PM' },
];

const PICKUP_STEPS = [
  { id: 'pending', label: 'Pending', icon: 'time-outline' },
  { id: 'assigned', label: 'Assigned', icon: 'person-outline' },
  { id: 'in_transit', label: 'In Transit', icon: 'car-outline' },
  { id: 'collected', label: 'Collected', icon: 'checkmark-circle-outline' },
];

export const CircularScreen: React.FC = () => {
  const insets = useSafeAreaInsets();
  const route = useRoute<any>();
  const navigation = useNavigation<any>();
  const { colors, radii } = useTheme();
  const { user } = useAuth();

  // ---- Rate table ----
  const [rates, setRates] = useState<WasteCategoryRate[]>([]);

  // ---- Session state ----
  const [session, setSession] = useState<LockerSession | null>(null);
  const [lockerItems, setLockerItems] = useState<LockerItem[]>([]);
  const [loadingSession, setLoadingSession] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // ---- Scan modal state ----
  const [scanModalVisible, setScanModalVisible] = useState(false);
  const [scannedPhoto, setScannedPhoto] = useState<string | null>(null);
  const [scanResult, setScanResult] = useState<WasteScanResult | null>(null);
  const [aiAnalyzing, setAiAnalyzing] = useState(false);

  // ---- Fallback category selection ----
  const [fallbackCategory, setFallbackCategory] = useState<string | null>(null);

  // ---- Weight micro-stepper ----
  const [adjustedWeight, setAdjustedWeight] = useState<number>(0.1);

  // ---- Pickup modal state ----
  const [pickupModalVisible, setPickupModalVisible] = useState(false);
  const [selectedSlot, setSelectedSlot] = useState<string>(PICKUP_SLOTS[0].id);
  const [pickupAddress, setPickupAddress] = useState<string>('');
  const [submitting, setSubmitting] = useState(false);

  // ---- Active pickup tracking ----
  const [activePickupId, setActivePickupId] = useState<string | null>(null);
  const [pickupStatus, setPickupStatus] = useState<string | null>(null);
  const [pickupEta, setPickupEta] = useState<number | undefined>(undefined);

  // ---- Animation ----
  const progressWidth = useSharedValue(0);
  const progressAnimStyle = useAnimatedStyle(() => ({
    width: `${Math.min(progressWidth.value, 100)}%`,
  }));

  // ---- Computed ----
  const totalWeight = session?.total_weight_kg || 0;
  const totalPayout = session?.total_payout_inr || 0;
  const totalGP = session?.total_gp || 0;
  const isPickupEligible = totalWeight >= MIN_PICKUP_WEIGHT_KG;
  const weightRemaining = Math.max(0, MIN_PICKUP_WEIGHT_KG - totalWeight);
  const progressPercent = Math.min(100, Math.round((totalWeight / MIN_PICKUP_WEIGHT_KG) * 100));

  // ---- Scientific Earth Healing Impact ----
  const earthImpact = calculateEarthImpact(lockerItems);
  const activeScanCategory = scanResult?.status === 'success' ? scanResult.categoryId : fallbackCategory || 'plastic';
  const currentItemImpact = calculateEarthImpact([{ category: activeScanCategory, weightKg: adjustedWeight }]);

  // =============================================
  // Initialization
  // =============================================

  useEffect(() => {
    initLocker();
  }, [user]);

  useEffect(() => {
    if (route.params?.autoScan) {
      handleLaunchCameraScanner();
    }
  }, [route.params?.autoScan]);

  useEffect(() => {
    const pct = Math.min((totalWeight / MIN_PICKUP_WEIGHT_KG) * 100, 100);
    progressWidth.value = withTiming(pct, { duration: 500, easing: Easing.out(Easing.cubic) });
  }, [totalWeight]);

  useEffect(() => {
    if (!activePickupId) return;

    const channel = subscribeToPickup(activePickupId, (status, eta) => {
      setPickupStatus(status);
      setPickupEta(eta);

      if (status === 'collected' || status === 'verified') {
        Alert.alert('🎉 Pickup Completed!', 'Collector has picked up your recyclables. GreenPoints credited!');
        initLocker();
      }
    });

    return () => {
      supabase.removeChannel(channel);
    };
  }, [activePickupId]);

  const initLocker = async () => {
    if (!user) return;
    setLoadingSession(true);

    const [ratesData, sessionData] = await Promise.all([
      fetchCategoryRates(),
      getOrCreateActiveLockerSession(user.id),
    ]);

    setRates(ratesData);
    setSession(sessionData);

    if (sessionData) {
      const items = await fetchLockerSessionItems(sessionData.id);
      const mapped = items.map((item) => mapRecordToLockerItem(item, ratesData));
      setLockerItems(mapped);
    }

    setLoadingSession(false);
    setRefreshing(false);
  };

  const onRefresh = () => {
    setRefreshing(true);
    initLocker();
  };

  const mapRecordToLockerItem = (record: LockerItemRecord, ratesData: WasteCategoryRate[]): LockerItem => {
    const rate = record.waste_category_rates || ratesData.find((r) => r.category === record.category);
    return {
      id: record.id,
      category: record.category,
      categoryName: rate?.name || record.category,
      icon: rate?.icon || 'cube-outline',
      color: rate?.color || '#666',
      weightKg: record.estimated_weight,
      payoutAmount: record.estimated_weight * (rate?.price_per_kg || 0),
      gpReward: Math.round(record.estimated_weight * (rate?.gp_per_kg || 0)),
      photoUri: record.image_url || undefined,
      storagePath: record.image_url || undefined,
      source: record.source,
      confidence: record.confidence || undefined,
    };
  };

  const getRateForCategory = (categorySlug: string): WasteCategoryRate | undefined => {
    return rates.find((r) => r.category === categorySlug);
  };

  // =============================================
  // Camera & AI Scan
  // =============================================

  const handleLaunchCameraScanner = async () => {
    try {
      const perm = await ImagePicker.requestCameraPermissionsAsync();
      if (!perm.granted) {
        Alert.alert('Camera Permission Required', 'Please grant camera access to scan recyclables.');
        return;
      }

      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: ['images'],
        quality: 0.4,
        base64: true,
      });

      if (!result.canceled && result.assets.length > 0) {
        const photo = result.assets[0];
        setScannedPhoto(photo.uri);
        setScanResult(null);
        setFallbackCategory(null);
        setAdjustedWeight(0.1);
        setScanModalVisible(true);
        processAiScan(photo.base64 || photo.uri);
      }
    } catch (err) {
      Alert.alert('Camera Error', 'Could not launch camera for scanning.');
    }
  };

  const processAiScan = async (photoData: string) => {
    setAiAnalyzing(true);
    const result = await identifyWaste(photoData);
    setScanResult(result);

    if (result.status === 'success') {
      const sanitized = sanitizeEstimatedWeight(result.estimatedWeightKg, result.categoryId, rates);
      setAdjustedWeight(sanitized);
    } else if (result.status === 'uncertain') {
      const defaultRate = rates[0];
      setAdjustedWeight(sanitizeEstimatedWeight(result.estimatedWeightKg, defaultRate?.category || 'plastic', rates));
    }

    setAiAnalyzing(false);
  };

  const handleFallbackCategorySelect = (categorySlug: string) => {
    setFallbackCategory(categorySlug);
    const aiWeight = scanResult?.status === 'uncertain' ? scanResult.estimatedWeightKg : 0;
    const reDerived = sanitizeEstimatedWeight(aiWeight, categorySlug, rates);
    setAdjustedWeight(reDerived);
  };

  const handleWeightStep = (delta: number) => {
    setAdjustedWeight((prev) => {
      const next = Math.round((prev + delta) * 100) / 100;
      return Math.min(25.0, Math.max(0.01, next));
    });
  };

  // =============================================
  // Add to Locker
  // =============================================

  const handleAddToLocker = async (scanAnother: boolean = false) => {
    if (!session || !user) return;

    let categorySlug: string;
    let source: 'ai' | 'manual';
    let confidence: number | null = null;

    if (scanResult?.status === 'success') {
      categorySlug = scanResult.categoryId;
      source = 'ai';
      confidence = scanResult.confidence;
    } else if (fallbackCategory) {
      categorySlug = fallbackCategory;
      source = 'manual';
    } else {
      Alert.alert('Select Category', 'Please pick a category before adding.');
      return;
    }

    setScanModalVisible(false);

    const result = await addItemToLockerSession(
      session.id,
      user.id,
      categorySlug,
      adjustedWeight,
      source,
      confidence,
      scannedPhoto || undefined
    );

    if (!result.success) {
      const rate = getRateForCategory(categorySlug);
      const localItem: LockerItem = {
        id: 'local-item-' + Date.now(),
        category: categorySlug,
        categoryName: rate?.name || categorySlug,
        icon: rate?.icon || 'cube-outline',
        color: rate?.color || '#666',
        weightKg: adjustedWeight,
        payoutAmount: adjustedWeight * (rate?.price_per_kg || 0),
        gpReward: Math.round(adjustedWeight * (rate?.gp_per_kg || 0)),
        photoUri: scannedPhoto || undefined,
        source,
        confidence: confidence || undefined,
      };
      setLockerItems((prev) => [localItem, ...prev]);
      setSession((prev) => prev ? {
        ...prev,
        total_weight_kg: prev.total_weight_kg + adjustedWeight,
        total_payout_inr: prev.total_payout_inr + (adjustedWeight * (rate?.price_per_kg || 0)),
        total_gp: prev.total_gp + Math.round(adjustedWeight * (rate?.gp_per_kg || 0)),
      } : null);

      setScannedPhoto(null);
      setScanResult(null);
      setFallbackCategory(null);
      if (scanAnother) setTimeout(() => handleLaunchCameraScanner(), 300);
      return;
    }

    if (scannedPhoto && result.itemId) {
      uploadLockerPhotoToStorage(user.id, session.id, scannedPhoto).then(async (storagePath) => {
        if (storagePath) {
          await supabase
            .from('locker_items')
            .update({ image_url: storagePath })
            .eq('id', result.itemId);
        }
      });
    }

    const updatedSession = await refreshLockerSession(session.id);
    if (updatedSession) setSession(updatedSession);

    const updatedItems = await fetchLockerSessionItems(session.id);
    setLockerItems(updatedItems.map((item) => mapRecordToLockerItem(item, rates)));

    setScannedPhoto(null);
    setScanResult(null);
    setFallbackCategory(null);

    if (scanAnother) {
      setTimeout(() => handleLaunchCameraScanner(), 300);
    }
  };

  // =============================================
  // Remove Item
  // =============================================

  const handleRemoveItem = async (itemId: string) => {
    if (!session) return;

    const success = await removeItemFromLockerSession(itemId);
    if (success) {
      const updatedSession = await refreshLockerSession(session.id);
      if (updatedSession) setSession(updatedSession);
      setLockerItems((prev) => prev.filter((item) => item.id !== itemId));
    }
  };

  // =============================================
  // Schedule Pickup
  // =============================================

  const handleSchedulePickup = async () => {
    if (!session || !user) return;
    setSubmitting(true);

    try {
      let lat: number | null = null;
      let lng: number | null = null;

      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status === 'granted') {
        const loc = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
        lat = loc.coords.latitude;
        lng = loc.coords.longitude;
      }

      const slotLabel = PICKUP_SLOTS.find((s) => s.id === selectedSlot)?.label || selectedSlot;

      const result = await scheduleLockerPickup(
        user.id,
        session.id,
        slotLabel,
        lat,
        lng,
        pickupAddress || undefined
      );

      setSubmitting(false);
      setPickupModalVisible(false);

      if (!result.success) {
        Alert.alert('Pickup Error', result.error || 'Failed to schedule pickup.');
        return;
      }

      if (result.pickupId) {
        setActivePickupId(result.pickupId);
        setPickupStatus('pending');
        setPickupEta(120);

        Alert.alert(
          '🎉 Pickup Scheduled!',
          `Your pickup has been scheduled for ${slotLabel}.\nA collector will be assigned shortly.`
        );

        setLockerItems([]);
        const newSession = await getOrCreateActiveLockerSession(user.id);
        setSession(newSession);
      }
    } catch (err: any) {
      setSubmitting(false);
      Alert.alert('Error', err.message || 'Failed to schedule pickup.');
    }
  };

  const handleCancelPickup = async () => {
    if (!activePickupId) return;

    Alert.alert('Cancel Pickup?', 'Are you sure you want to cancel this pickup request?', [
      { text: 'Keep', style: 'cancel' },
      {
        text: 'Cancel Pickup',
        style: 'destructive',
        onPress: async () => {
          const result = await cancelOwnPickup(activePickupId);
          if (result.success) {
            setActivePickupId(null);
            setPickupStatus(null);
            setPickupEta(undefined);
            initLocker();
          } else {
            Alert.alert('Error', result.error || 'Could not cancel pickup.');
          }
        },
      },
    ]);
  };

  const diySuggestions = getDynamicDiySuggestions(
    lockerItems.map((i) => ({ category: i.category })),
    2
  );

  // =============================================
  // RENDER
  // =============================================

  if (loadingSession) {
    return (
      <View style={[styles.container, { backgroundColor: '#F6FBF7', justifyContent: 'center', alignItems: 'center' }]}>
        <ActivityIndicator size="large" color="#2BB673" />
        <Text style={{ marginTop: 12, color: '#526658', fontSize: 14 }}>Loading The Locker...</Text>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: '#F6FBF7', paddingTop: Math.max(insets.top, 16) }]}>
      {/* ========== HEADER ========== */}
      <View style={styles.headerRow}>
        <View>
          <Text style={styles.headingText}>The Locker</Text>
          <Text style={styles.subHeadingText}>
            {session?.status === 'active' ? '● Active Session' : `Session ${session?.status || ''}`}
          </Text>
        </View>
        <GreenPointsChip points={totalGP} label="GP" />
      </View>

      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#2BB673" />}
      >
        {/* ========== STREAMLINED HERO STATUS CARD ========== */}
        <View style={styles.heroCard}>
          <View style={styles.heroTopRow}>
            <View>
              <Text style={styles.goalLabel}>PICKUP THRESHOLD</Text>
              <Text style={styles.weightBigText}>
                {totalWeight.toFixed(2)} <Text style={styles.weightGoalText}>/ 2.00 kg</Text>
              </Text>
            </View>
            <View style={[styles.pillPercent, { backgroundColor: isPickupEligible ? '#DCFCE7' : '#FEE2E2' }]}>
              <Text style={[styles.percentText, { color: isPickupEligible ? '#15803D' : '#DC2626' }]}>
                {progressPercent}%
              </Text>
            </View>
          </View>

          {/* Slim Progress Bar */}
          <View style={styles.progressBarBg}>
            <Animated.View
              style={[
                styles.progressBarFill,
                progressAnimStyle,
                { backgroundColor: isPickupEligible ? '#2BB673' : '#F97316' },
              ]}
            />
          </View>

          {/* Clean 2-Stat Row */}
          <View style={styles.statRow}>
            <View style={styles.statCol}>
              <Text style={styles.statLabel}>Est. Payout</Text>
              <Text style={[styles.statVal, { color: '#B45309' }]}>₹{totalPayout.toFixed(2)}</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statCol}>
              <Text style={styles.statLabel}>Items In Locker</Text>
              <Text style={styles.statVal}>{lockerItems.length} item{lockerItems.length !== 1 ? 's' : ''}</Text>
            </View>
          </View>

          {/* Single Clear Action Button */}
          {isPickupEligible ? (
            <PrimaryButton
              title="Schedule Doorstep Pickup"
              icon="calendar"
              onPress={() => setPickupModalVisible(true)}
              style={{ marginTop: 2 }}
            />
          ) : (
            <PrimaryButton
              title="Scan Recyclable Item"
              icon="camera"
              onPress={handleLaunchCameraScanner}
              style={{ marginTop: 2 }}
            />
          )}
        </View>

        {/* ========== SCIENTIFIC EARTH HEALING IMPACT CARD ========== */}
        <View style={styles.earthImpactCard}>
          <View style={styles.earthImpactHeader}>
            <View style={styles.earthPulseBadge}>
              <Ionicons name="planet" size={15} color="#00A86B" />
              <Text style={styles.earthBadgeText}>EARTH HEALING ESTIMATE</Text>
            </View>
            <Text style={styles.earthTagline}>Science-Backed</Text>
          </View>

          <View style={styles.earthMetricRow}>
            <View style={styles.earthMetricCol}>
              <Text style={styles.earthMetricValue}>{earthImpact.highlightNumber}</Text>
              <Text style={styles.earthMetricLabel}>Emissions Abated</Text>
            </View>

            <View style={styles.earthMetricDivider} />

            <View style={styles.earthMetricCol}>
              <Text style={styles.earthMetricValue}>{earthImpact.waterSavedLitres.toFixed(1)} L</Text>
              <Text style={styles.earthMetricLabel}>Water Conserved</Text>
            </View>

            <View style={styles.earthMetricDivider} />

            <View style={styles.earthMetricCol}>
              <Text style={styles.earthMetricValue}>{totalWeight.toFixed(2)} kg</Text>
              <Text style={styles.earthMetricLabel}>Landfill Diverted</Text>
            </View>
          </View>

          <View style={styles.earthNarrativeBox}>
            <Ionicons name="sparkles" size={14} color="#00A86B" style={{ marginTop: 1 }} />
            <Text style={styles.earthNarrativeText}>
              {totalWeight > 0
                ? earthImpact.impactNarrative
                : 'Scan and add recyclables to calculate your direct greenhouse gas reduction and freshwater savings.'}
            </Text>
          </View>
        </View>

        {/* ========== ACTIVE PICKUP TRACKER ========== */}
        {activePickupId && (
          <View style={styles.trackerCard}>
            <View style={styles.trackerHeaderRow}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                <Ionicons name="car-outline" size={16} color="#2BB673" />
                <Text style={styles.trackerTitle}>Pickup Status</Text>
              </View>
              {(pickupStatus === 'pending' || pickupStatus === 'assigned') && (
                <TouchableOpacity onPress={handleCancelPickup}>
                  <Text style={styles.cancelLink}>Cancel</Text>
                </TouchableOpacity>
              )}
            </View>

            <View style={styles.stepTrackRow}>
              {PICKUP_STEPS.map((step, idx) => {
                const stepIdx = PICKUP_STEPS.findIndex((s) => s.id === (pickupStatus || 'pending'));
                const isActive = idx === stepIdx;
                const isPast = idx < stepIdx;

                return (
                  <View key={step.id} style={styles.stepCol}>
                    <View
                      style={[
                        styles.stepCircle,
                        {
                          backgroundColor: isActive ? '#2BB673' : isPast ? '#15803D' : '#E2E8F0',
                        },
                      ]}
                    >
                      <Ionicons
                        name={isPast ? 'checkmark' : (step.icon as any)}
                        size={13}
                        color={isActive || isPast ? '#FFFFFF' : '#94A3B8'}
                      />
                    </View>
                    <Text style={[styles.stepLabel, { color: isActive ? '#2BB673' : '#64748B' }]}>
                      {step.label}
                    </Text>
                  </View>
                );
              })}
            </View>
          </View>
        )}

        {/* ========== YOUR LOCKER ITEMS ========== */}
        <View style={styles.sectionContainer}>
          <View style={styles.sectionHeaderRow}>
            <Text style={styles.sectionTitle}>YOUR LOCKER ({lockerItems.length})</Text>
            {lockerItems.length > 0 && !isPickupEligible && (
              <TouchableOpacity onPress={handleLaunchCameraScanner} style={styles.addMoreLink}>
                <Ionicons name="add" size={14} color="#2BB673" />
                <Text style={styles.addMoreText}>Add More</Text>
              </TouchableOpacity>
            )}
          </View>

          {lockerItems.length === 0 ? (
            <EmptyState
              icon="archive-outline"
              title="Locker is Empty"
              description="Tap 'Scan Recyclable Item' above to start adding recyclables toward your 2.0 kg goal."
              canvas="dark"
            />
          ) : (
            <View style={styles.itemsList}>
              {lockerItems.map((item) => (
                <View key={item.id} style={styles.itemCard}>
                  {/* Category Color Icon */}
                  <View style={[styles.itemIconBox, { backgroundColor: item.color + '18' }]}>
                    <Ionicons name={item.icon as any} size={20} color={item.color} />
                  </View>

                  {/* Material Details */}
                  <View style={styles.itemMeta}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                      <Text style={styles.itemName}>{item.categoryName}</Text>
                      <View style={[styles.badge, { backgroundColor: item.source === 'ai' ? '#DCFCE7' : '#FEF3C7' }]}>
                        <Text style={[styles.badgeText, { color: item.source === 'ai' ? '#166534' : '#92400E' }]}>
                          {item.source === 'ai' ? `AI ${item.confidence ? Math.round(item.confidence * 100) + '%' : ''}` : 'MANUAL'}
                        </Text>
                      </View>
                    </View>
                    <Text style={styles.itemSubText}>
                      ~{item.weightKg.toFixed(2)} kg · <Text style={{ color: '#B45309', fontWeight: '700' }}>₹{item.payoutAmount.toFixed(2)}</Text> · +{item.gpReward} GP
                    </Text>
                  </View>

                  {/* Delete Trash Action */}
                  <TouchableOpacity
                    onPress={() => handleRemoveItem(item.id)}
                    style={styles.trashBtn}
                    hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                  >
                    <Ionicons name="trash-outline" size={16} color="#DC2626" />
                  </TouchableOpacity>
                </View>
              ))}
            </View>
          )}
        </View>

        {/* ========== DYNAMIC DIY SUGGESTIONS (CLEAN ROWS) ========== */}
        {lockerItems.length > 0 && !isPickupEligible && (
          <View style={styles.sectionContainer}>
            <View style={styles.sectionHeaderRow}>
              <Text style={styles.sectionTitle}>UPCYCLE SUGGESTIONS</Text>
              <Text style={styles.remainingHint}>{weightRemaining.toFixed(1)} kg to pickup</Text>
            </View>

            <View style={{ gap: 8 }}>
              {diySuggestions.map((suggestion) => (
                <TouchableOpacity
                  key={suggestion.project.id}
                  style={styles.diyCard}
                  onPress={() => openYouTubeTutorial(suggestion.project.youtubeSearchQuery)}
                  activeOpacity={0.7}
                >
                  <View style={styles.diyIconBox}>
                    <Ionicons name={(suggestion.project.iconName || 'hammer') as any} size={16} color="#2BB673" />
                  </View>

                  <View style={styles.diyMeta}>
                    <Text style={styles.diyTitle} numberOfLines={1}>
                      {suggestion.project.title}
                    </Text>
                    <Text style={styles.diySub} numberOfLines={1}>
                      ⏱ {suggestion.project.timeEstimate} · 📊 {suggestion.project.difficulty}
                    </Text>
                  </View>

                  <View style={styles.watchIconPill}>
                    <Ionicons name="play" size={12} color="#FFFFFF" />
                    <Text style={styles.watchText}>Watch</Text>
                  </View>
                </TouchableOpacity>
              ))}

              <TouchableOpacity
                style={styles.exploreLink}
                onPress={() => navigation.navigate('DiyProjects', { initialCategoryId: lockerItems[0]?.category })}
              >
                <Text style={styles.exploreLinkText}>Explore All DIY Projects →</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}
      </ScrollView>

      {/* ========== SCAN RESULT CONFIRMATION MODAL ========== */}
      <Modal visible={scanModalVisible} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalSheet}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>
                {aiAnalyzing ? 'Analyzing Item...' : scanResult?.status === 'success' ? 'Item Identified' : scanResult?.status === 'uncertain' ? 'Select Category' : 'Scan Result'}
              </Text>
              <TouchableOpacity onPress={() => setScanModalVisible(false)}>
                <Ionicons name="close" size={22} color="#64748B" />
              </TouchableOpacity>
            </View>

            {aiAnalyzing ? (
              <View style={{ alignItems: 'center', paddingVertical: 28, gap: 12 }}>
                <ActivityIndicator size="large" color="#2BB673" />
                <Text style={{ fontSize: 14, color: '#64748B' }}>
                  Identifying material & estimating weight...
                </Text>
              </View>
            ) : scanResult?.status === 'network_error' ? (
              <View style={{ gap: 12, paddingVertical: 8 }}>
                <View style={styles.errorBox}>
                  <Ionicons name="cloud-offline-outline" size={18} color="#DC2626" />
                  <Text style={{ flex: 1, fontSize: 13, color: "#DC2626" }}>
                    {scanResult.message || 'Could not connect to AI scanner.'}
                  </Text>
                </View>
                <PrimaryButton title="Retry Scan" icon="refresh" onPress={handleLaunchCameraScanner} />
                <SecondaryButton
                  title="Select Category Manually"
                  icon="hand-left-outline"
                  onPress={() => {
                    setScanResult({ status: 'uncertain', estimatedWeightKg: 0.1, itemDescription: '' });
                  }}
                />
              </View>
            ) : scanResult?.status === 'success' ? (
              <View style={{ gap: 12, paddingVertical: 4 }}>
                {scannedPhoto && (
                  <Image source={{ uri: scannedPhoto }} style={styles.previewThumb} />
                )}

                <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                  <View style={[styles.categoryPill, { backgroundColor: (getRateForCategory(scanResult.categoryId)?.color || '#2BB673') + '20' }]}>
                    <Ionicons name={(getRateForCategory(scanResult.categoryId)?.icon || 'cube') as any} size={16} color={getRateForCategory(scanResult.categoryId)?.color || '#2BB673'} />
                    <Text style={styles.categoryPillText}>{scanResult.categoryName}</Text>
                  </View>
                  <View style={styles.aiConfidenceBadge}>
                    <Text style={styles.aiConfidenceText}>AI {Math.round(scanResult.confidence * 100)}%</Text>
                  </View>
                </View>

                {/* Weight Stepper */}
                <View style={styles.stepperContainer}>
                  <Text style={styles.stepperLabel}>Estimated Weight:</Text>
                  <View style={styles.stepperRow}>
                    <TouchableOpacity onPress={() => handleWeightStep(-0.05)} style={styles.stepBtn}>
                      <Ionicons name="remove" size={16} color="#334155" />
                    </TouchableOpacity>
                    <Text style={styles.stepperValText}>{adjustedWeight.toFixed(2)} kg</Text>
                    <TouchableOpacity onPress={() => handleWeightStep(0.05)} style={styles.stepBtn}>
                      <Ionicons name="add" size={16} color="#334155" />
                    </TouchableOpacity>
                  </View>
                </View>

                {/* Live Planet Impact Preview Chip */}
                <View style={styles.scanImpactPreviewPill}>
                  <Ionicons name="leaf" size={14} color="#00A86B" />
                  <Text style={styles.scanImpactPreviewText}>
                    Planet Benefit: <Text style={{ fontWeight: '800', color: '#154212' }}>~{currentItemImpact.co2SavedKg.toFixed(2)} kg CO₂e</Text> & <Text style={{ fontWeight: '800', color: '#154212' }}>{currentItemImpact.waterSavedLitres.toFixed(1)}L water</Text>
                  </Text>
                </View>

                <PrimaryButton title="Add to Locker" icon="archive-outline" onPress={() => handleAddToLocker(false)} />
                <SecondaryButton title="Add & Scan Next" icon="camera-outline" onPress={() => handleAddToLocker(true)} />
              </View>
            ) : scanResult?.status === 'uncertain' ? (
              <View style={{ gap: 12, paddingVertical: 4 }}>
                {scannedPhoto && (
                  <Image source={{ uri: scannedPhoto }} style={styles.previewThumb} />
                )}

                <Text style={styles.chooseCatTitle}>CHOOSE RECYCLABLE MATERIAL</Text>

                <View style={styles.gridCategories}>
                  {rates.map((rate) => (
                    <TouchableOpacity
                      key={rate.category}
                      onPress={() => handleFallbackCategorySelect(rate.category)}
                      style={[
                        styles.catOptionChip,
                        {
                          backgroundColor: fallbackCategory === rate.category ? rate.color + '20' : '#F8FAFC',
                          borderColor: fallbackCategory === rate.category ? rate.color : '#E2E8F0',
                          borderWidth: fallbackCategory === rate.category ? 2 : 1,
                        },
                      ]}
                    >
                      <Ionicons name={rate.icon as any} size={15} color={rate.color} />
                      <Text style={styles.catOptionText}>{rate.name}</Text>
                    </TouchableOpacity>
                  ))}
                </View>

                <View style={styles.stepperContainer}>
                  <Text style={styles.stepperLabel}>Estimated Weight:</Text>
                  <View style={styles.stepperRow}>
                    <TouchableOpacity onPress={() => handleWeightStep(-0.05)} style={styles.stepBtn}>
                      <Ionicons name="remove" size={16} color="#334155" />
                    </TouchableOpacity>
                    <Text style={styles.stepperValText}>{adjustedWeight.toFixed(2)} kg</Text>
                    <TouchableOpacity onPress={() => handleWeightStep(0.05)} style={styles.stepBtn}>
                      <Ionicons name="add" size={16} color="#334155" />
                    </TouchableOpacity>
                  </View>
                </View>

                {/* Live Planet Impact Preview Chip */}
                {fallbackCategory && (
                  <View style={styles.scanImpactPreviewPill}>
                    <Ionicons name="leaf" size={14} color="#00A86B" />
                    <Text style={styles.scanImpactPreviewText}>
                      Planet Benefit: <Text style={{ fontWeight: '800', color: '#154212' }}>~{currentItemImpact.co2SavedKg.toFixed(2)} kg CO₂e</Text> & <Text style={{ fontWeight: '800', color: '#154212' }}>{currentItemImpact.waterSavedLitres.toFixed(1)}L water</Text>
                    </Text>
                  </View>
                )}

                <PrimaryButton
                  title="Add to Locker"
                  icon="archive-outline"
                  onPress={() => handleAddToLocker(false)}
                  disabled={!fallbackCategory}
                />
              </View>
            ) : null}
          </View>
        </View>
      </Modal>

      {/* ========== PICKUP MODAL ========== */}
      <Modal visible={pickupModalVisible} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalSheet}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Schedule Doorstep Pickup</Text>
              <TouchableOpacity onPress={() => setPickupModalVisible(false)}>
                <Ionicons name="close" size={22} color="#64748B" />
              </TouchableOpacity>
            </View>

            <View style={{ gap: 4 }}>
              <Text style={styles.modalBigMoney}>₹{totalPayout.toFixed(2)}</Text>
              <Text style={styles.modalSubSummary}>
                {totalWeight.toFixed(2)} kg · {lockerItems.length} items · +{totalGP} GreenPoints
              </Text>
              <View style={styles.modalImpactBadge}>
                <Ionicons name="planet-outline" size={14} color="#00A86B" />
                <Text style={styles.modalImpactBadgeText}>
                  Heals Earth: Prevents ~{earthImpact.co2SavedKg.toFixed(1)} kg CO₂e & saves {earthImpact.waterSavedLitres.toFixed(1)}L water
                </Text>
              </View>
            </View>

            <View style={{ gap: 6 }}>
              <Text style={styles.modalFieldLabel}>SELECT TIME WINDOW</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8 }}>
                {PICKUP_SLOTS.map((slot) => (
                  <FilterPill
                    key={slot.id}
                    label={slot.label}
                    active={selectedSlot === slot.id}
                    onPress={() => setSelectedSlot(slot.id)}
                    canvas="dark"
                  />
                ))}
              </ScrollView>
            </View>

            <View style={{ gap: 6 }}>
              <Text style={styles.modalFieldLabel}>PICKUP ADDRESS (OPTIONAL)</Text>
              <TextInput
                style={styles.addressInput}
                placeholder="e.g. Block A, Green Heights Society"
                placeholderTextColor="#94A3B8"
                value={pickupAddress}
                onChangeText={setPickupAddress}
              />
            </View>

            <PrimaryButton
              title="Confirm Pickup Request"
              icon="checkmark-done"
              onPress={handleSchedulePickup}
              loading={submitting}
              disabled={submitting}
            />
          </View>
        </View>
      </Modal>
    </View>
  );
};

// =============================================
// Clean, Ultra-Airy Styles
// =============================================
const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    marginBottom: 8,
  },
  headingText: {
    fontSize: 28,
    fontWeight: '800',
    color: '#0F172A',
    letterSpacing: -0.6,
  },
  subHeadingText: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 2,
  },
  content: {
    paddingHorizontal: 18,
    paddingTop: 6,
    paddingBottom: 130, // Clearance above floating bottom tab bar
    gap: 16,
  },

  // Hero Status Card
  heroCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 22,
    padding: 18,
    gap: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 2,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  heroTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  goalLabel: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.8,
    color: '#64748B',
  },
  weightBigText: {
    fontSize: 22,
    fontWeight: '800',
    color: '#0F172A',
    marginTop: 2,
  },
  weightGoalText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#94A3B8',
  },
  pillPercent: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  percentText: {
    fontSize: 12,
    fontWeight: '800',
  },
  progressBarBg: {
    height: 7,
    backgroundColor: '#F1F5F9',
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    borderRadius: 4,
  },
  statRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    borderRadius: 14,
    paddingVertical: 10,
    paddingHorizontal: 14,
  },
  statCol: {
    flex: 1,
    alignItems: 'center',
    gap: 2,
  },
  statDivider: {
    width: 1,
    height: 24,
    backgroundColor: '#E2E8F0',
  },
  statLabel: {
    fontSize: 11,
    color: '#64748B',
    fontWeight: '500',
  },
  statVal: {
    fontSize: 14,
    fontWeight: '700',
    color: '#0F172A',
  },

  // Tracker Card
  trackerCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    padding: 14,
    gap: 10,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  trackerHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  trackerTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#0F172A',
  },
  cancelLink: {
    fontSize: 12,
    fontWeight: '700',
    color: '#DC2626',
  },
  stepTrackRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingTop: 4,
  },
  stepCol: {
    alignItems: 'center',
    gap: 4,
  },
  stepCircle: {
    width: 26,
    height: 26,
    borderRadius: 13,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepLabel: {
    fontSize: 10,
    fontWeight: '600',
  },

  // Section Headers
  sectionContainer: {
    gap: 8,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 2,
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 0.8,
    color: '#64748B',
  },
  addMoreLink: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
  },
  addMoreText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#2BB673',
  },
  remainingHint: {
    fontSize: 11,
    fontWeight: '600',
    color: '#B45309',
  },

  // Items List
  itemsList: {
    gap: 8,
  },
  itemCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 12,
    gap: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  itemIconBox: {
    width: 38,
    height: 38,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  itemMeta: {
    flex: 1,
    gap: 2,
  },
  itemName: {
    fontSize: 14,
    fontWeight: '700',
    color: '#0F172A',
  },
  badge: {
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: 5,
  },
  badgeText: {
    fontSize: 9,
    fontWeight: '800',
  },
  itemSubText: {
    fontSize: 12,
    color: '#64748B',
  },
  trashBtn: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: '#FEE2E2',
    alignItems: 'center',
    justifyContent: 'center',
  },

  // DIY Rows
  diyCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 12,
    gap: 10,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  diyIconBox: {
    width: 34,
    height: 34,
    borderRadius: 10,
    backgroundColor: '#DCFCE7',
    alignItems: 'center',
    justifyContent: 'center',
  },
  diyMeta: {
    flex: 1,
    gap: 2,
  },
  diyTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#0F172A',
  },
  diySub: {
    fontSize: 11,
    color: '#64748B',
  },
  watchIconPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    backgroundColor: '#2BB673',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 12,
  },
  watchText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  exploreLink: {
    alignItems: 'center',
    paddingVertical: 6,
  },
  exploreLinkText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#2BB673',
  },

  // Modal
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.65)',
    justifyContent: 'flex-end',
  },
  modalSheet: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    padding: 22,
    gap: 14,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#0F172A',
  },
  errorBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#FEE2E2',
    padding: 12,
    borderRadius: 12,
  },
  previewThumb: {
    width: '100%',
    height: 140,
    borderRadius: 14,
    resizeMode: 'cover',
  },
  categoryPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 10,
  },
  categoryPillText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#0F172A',
  },
  aiConfidenceBadge: {
    backgroundColor: '#DCFCE7',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
  },
  aiConfidenceText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#166534',
  },
  stepperContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    padding: 10,
    borderRadius: 12,
  },
  stepperLabel: {
    fontSize: 13,
    color: '#64748B',
    fontWeight: '500',
  },
  stepperRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  stepBtn: {
    width: 28,
    height: 28,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#CBD5E1',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
  },
  stepperValText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#0F172A',
    minWidth: 50,
    textAlign: 'center',
  },
  chooseCatTitle: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.8,
    color: '#64748B',
  },
  gridCategories: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  catOptionChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderRadius: 10,
  },
  catOptionText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#0F172A',
  },
  modalBigMoney: {
    fontSize: 26,
    fontWeight: '800',
    color: '#F97316',
    letterSpacing: -0.6,
  },
  modalSubSummary: {
    fontSize: 12,
    color: '#64748B',
  },
  modalFieldLabel: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.8,
    color: '#64748B',
  },
  addressInput: {
    height: 42,
    borderWidth: 1,
    borderColor: '#CBD5E1',
    borderRadius: 10,
    paddingHorizontal: 12,
    fontSize: 13,
    backgroundColor: '#FFFFFF',
    color: '#0F172A',
  },
  // Earth Healing Styles
  earthImpactCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 16,
    borderWidth: 1,
    borderColor: 'rgba(43, 182, 115, 0.22)',
    gap: 12,
  },
  earthImpactHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  earthPulseBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: '#D9F3E9',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 9999,
  },
  earthBadgeText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#154212',
    letterSpacing: 0.5,
  },
  earthTagline: {
    fontSize: 11,
    fontWeight: '700',
    color: '#00A86B',
  },
  earthMetricRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    backgroundColor: '#F8FAF8',
    borderRadius: 14,
    paddingVertical: 10,
    paddingHorizontal: 6,
    borderWidth: 1,
    borderColor: 'rgba(0, 0, 0, 0.04)',
  },
  earthMetricCol: {
    flex: 1,
    alignItems: 'center',
    gap: 2,
  },
  earthMetricValue: {
    fontSize: 15,
    fontWeight: '800',
    color: '#161D18',
  },
  earthMetricLabel: {
    fontSize: 9,
    fontWeight: '600',
    color: '#6D7A6F',
    textAlign: 'center',
  },
  earthMetricDivider: {
    width: 1,
    height: 22,
    backgroundColor: '#E2E8F0',
  },
  earthNarrativeBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    backgroundColor: '#F4FAF5',
    padding: 10,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(43, 182, 115, 0.15)',
  },
  earthNarrativeText: {
    flex: 1,
    fontSize: 12,
    lineHeight: 16,
    color: '#154212',
    fontWeight: '500',
  },
  scanImpactPreviewPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#D9F3E9',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: 'rgba(43, 182, 115, 0.25)',
  },
  scanImpactPreviewText: {
    fontSize: 12,
    color: '#161D18',
    flex: 1,
  },
  modalImpactBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#D9F3E9',
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 10,
    marginTop: 4,
  },
  modalImpactBadgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#154212',
    flex: 1,
  },
});
