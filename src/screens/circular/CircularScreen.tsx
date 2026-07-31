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
import { StatusBadge } from '../../components/common/StatusBadge';
import { PrimaryButton } from '../../components/common/PrimaryButton';
import { SecondaryButton } from '../../components/common/SecondaryButton';
import { ScannerOverlay } from '../../components/common/ScannerOverlay';
import { EmptyState } from '../../components/common/EmptyState';

import {
  WASTE_CATEGORIES,
  WasteCategoryInfo,
  WasteLockerItem,
  identifyWasteWithHuggingFace,
  submitWasteTransaction,
  fetchUserWasteHistory,
  WasteTransactionRecord,
  WasteScanResult,
} from '../../lib/circular';

export const CircularScreen: React.FC = () => {
  const insets = useSafeAreaInsets();
  const route = useRoute<any>();
  const { colors, radii, shadows } = useTheme();
  const { user } = useAuth();

  // Category Picker State
  const [selectedCat, setSelectedCat] = useState<WasteCategoryInfo>(WASTE_CATEGORIES[0]);
  const [weightKg, setWeightKg] = useState<number>(1.0);

  // Waste Locker State
  const [lockerItems, setLockerItems] = useState<WasteLockerItem[]>([]);
  const [history, setHistory] = useState<WasteTransactionRecord[]>([]);
  const [loadingHistory, setLoadingHistory] = useState<boolean>(true);
  const [refreshing, setRefreshing] = useState<boolean>(false);

  // AI Scanner & Modal State
  const [scanModalVisible, setScanModalVisible] = useState<boolean>(false);
  const [pickupModalVisible, setPickupModalVisible] = useState<boolean>(false);
  const [scannedPhoto, setScannedPhoto] = useState<string | null>(null);
  const [aiAnalyzing, setAiAnalyzing] = useState<boolean>(false);
  const [aiScanResult, setAiScanResult] = useState<WasteScanResult | null>(null);
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [showWasteScannerUI, setShowWasteScannerUI] = useState<boolean>(false);

  useEffect(() => {
    loadHistory();
  }, [user]);

  useEffect(() => {
    if (route.params?.autoScan) {
      handleLaunchCameraScanner();
    }
  }, [route.params?.autoScan]);

  const loadHistory = async () => {
    if (!user) return;
    setLoadingHistory(true);
    const data = await fetchUserWasteHistory(user.id);
    setHistory(data);
    setLoadingHistory(false);
    setRefreshing(false);
  };

  const onRefresh = () => {
    setRefreshing(true);
    loadHistory();
  };

  const handleAddManualItem = () => {
    const payout = Math.round(selectedCat.pricePerKg * weightKg * 100) / 100;
    const gp = Math.round(selectedCat.gpPerKg * weightKg);

    const newItem: WasteLockerItem = {
      id: Date.now().toString(),
      category: selectedCat.id,
      categoryName: selectedCat.name,
      icon: selectedCat.icon,
      weightKg,
      payoutAmount: payout,
      gpReward: gp,
    };

    setLockerItems((prev) => [newItem, ...prev]);
    Alert.alert('Added to Waste Locker', `Added ${weightKg} kg of ${selectedCat.name} (₹${payout} est. payout)`);
  };

  const handleRemoveLockerItem = (id: string) => {
    setLockerItems((prev) => prev.filter((item) => item.id !== id));
  };

  const handleLaunchCameraScanner = async () => {
    try {
      const perm = await ImagePicker.requestCameraPermissionsAsync();
      if (!perm.granted) {
        Alert.alert('Camera Permission Required', 'Please grant camera access to scan waste.');
        return;
      }

      setShowWasteScannerUI(true);
      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        quality: 0.8,
        base64: true,
      });

      setShowWasteScannerUI(false);
      if (!result.canceled && result.assets.length > 0) {
        const photo = result.assets[0];
        setScannedPhoto(photo.uri);
        setScanModalVisible(true);
        processAiWasteScan(photo.base64 || photo.uri);
      }
    } catch (err) {
      console.warn('Camera failed, opening gallery:', err);
      setShowWasteScannerUI(false);
      handleLaunchGalleryScanner();
    }
  };

  const handleLaunchGalleryScanner = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 0.8,
      base64: true,
    });

    if (!result.canceled && result.assets.length > 0) {
      const photo = result.assets[0];
      setScannedPhoto(photo.uri);
      setScanModalVisible(true);
      processAiWasteScan(photo.base64 || photo.uri);
    }
  };

  const processAiWasteScan = async (photoData: string) => {
    setAiAnalyzing(true);
    setAiScanResult(null);

    const result = await identifyWasteWithHuggingFace(photoData);
    setAiScanResult(result);
    setAiAnalyzing(false);
  };

  const handleAddScannedToLocker = () => {
    if (!aiScanResult) return;

    const matchedCat = WASTE_CATEGORIES.find((c) => c.id === aiScanResult.categoryId) || selectedCat;
    const payout = Math.round(matchedCat.pricePerKg * weightKg * 100) / 100;
    const gp = Math.round(matchedCat.gpPerKg * weightKg);

    const newItem: WasteLockerItem = {
      id: Date.now().toString(),
      category: matchedCat.id,
      categoryName: aiScanResult.categoryName,
      icon: matchedCat.icon,
      weightKg,
      payoutAmount: payout,
      gpReward: gp,
      photoUrl: scannedPhoto || undefined,
      confidence: aiScanResult.confidence,
      isUncertain: aiScanResult.isUncertain,
    };

    setLockerItems((prev) => [newItem, ...prev]);
    setScanModalVisible(false);
    setScannedPhoto(null);
    setAiScanResult(null);
    Alert.alert('Scanned Item Added', `Added ${matchedCat.name} to your Waste Locker!`);
  };

  const handleConfirmPickupSubmission = async () => {
    if (!user || lockerItems.length === 0) return;

    setSubmitting(true);
    const res = await submitWasteTransaction(user.id, lockerItems);
    setSubmitting(false);

    if (res.success) {
      Alert.alert(
        '🎉 Pickup Scheduled!',
        `Mock Payout: ₹${res.totalPayout.toFixed(2)}\nEarned: +${res.totalGP} GreenPoints\nTerritory Health Score Boosted!`
      );
      setLockerItems([]);
      setPickupModalVisible(false);
      loadHistory();
    } else {
      Alert.alert('Submission Error', res.error || 'Failed to complete transaction.');
    }
  };

  const totalLockerWeight = lockerItems.reduce((acc, item) => acc + item.weightKg, 0);
  const totalLockerPayout = lockerItems.reduce((acc, item) => acc + item.payoutAmount, 0);
  const totalLockerGP = lockerItems.reduce((acc, item) => acc + item.gpReward, 0);

  return (
    <View style={[styles.container, { backgroundColor: colors.background, paddingTop: Math.max(insets.top, 8) }]}>
      {/* Header */}
      <BioHeader title="BioVerse" />

      <ScrollView
        contentContainerStyle={styles.content}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />}
      >
        {/* Upcycling Idea Hero Card (Matches Reference Image 3 Right Side) */}
        <BioCard variant="elevated" padding={16} style={styles.upcyclingHeroCard}>
          <View style={styles.cardHeaderRow}>
            <Ionicons name="arrow-back" size={20} color={colors.primaryDark} />
            <Text style={[styles.cardHeaderTitle, { color: colors.primaryDark }]}>Upcycling Idea</Text>
            <Ionicons name="share-social-outline" size={20} color={colors.primaryDark} />
          </View>

          <HeroImage
            uri="https://images.unsplash.com/photo-1585320806297-9794b3e4eeae?w=800"
            badgeLabel="AI SUGGESTED"
            moduleLabel=""
            height={220}
          />

          <Text style={[styles.planterTitle, { color: colors.textPrimary }]}>Vertical Self-Watering Planter</Text>
          <Text style={[styles.planterBody, { color: colors.textSecondary }]}>
            Give your plastic bottles a second life as a thriving herb garden. This innovative design uses capillary action to keep your plants perfectly hydrated while reducing domestic plastic waste.
          </Text>

          {/* Project Impact Card */}
          <View style={[styles.projectImpactCard, { backgroundColor: colors.primarySubtle, borderRadius: radii.xl }]}>
            <View style={[styles.impactIconBg, { backgroundColor: colors.primary }]}>
              <Ionicons name="leaf" size={18} color={colors.textInverse} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={[styles.impactLabel, { color: colors.primaryDark }]}>PROJECT IMPACT</Text>
              <Text style={[styles.impactValue, { color: colors.primaryDark }]}>Saves 2.5kg of plastic waste</Text>
            </View>
          </View>

          {/* AI Scanner CTAs */}
          <View style={styles.btnRow}>
            <PrimaryButton title="AI Waste Scanner" icon="camera-outline" onPress={handleLaunchCameraScanner} style={{ flex: 1 }} />
            <SecondaryButton title="Upload Photo" icon="images-outline" onPress={handleLaunchGalleryScanner} style={{ flex: 1 }} />
          </View>
        </BioCard>

        {/* Waste Category Selector (Offline-First) */}
        <View style={styles.sectionContainer}>
          <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>Select Waste Category (Offline-First)</Text>
          
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.pickerScroll}>
            {WASTE_CATEGORIES.map((cat) => {
              const isSelected = selectedCat.id === cat.id;
              return (
                <TouchableOpacity
                  key={cat.id}
                  style={[
                    styles.catCard,
                    {
                      backgroundColor: isSelected ? colors.primarySubtle : colors.surface,
                      borderColor: isSelected ? colors.primary : colors.surfaceBorder,
                      borderRadius: radii.xl,
                    },
                    !isSelected && shadows.sm,
                  ]}
                  onPress={() => setSelectedCat(cat)}
                  activeOpacity={0.8}
                >
                  <Ionicons name={cat.icon as any} size={24} color={isSelected ? colors.primaryDark : colors.textSecondary} />
                  <Text style={[styles.catName, { color: isSelected ? colors.primaryDark : colors.textPrimary }]}>{cat.name}</Text>
                  <Text style={[styles.catRate, { color: colors.textSecondary }]}>₹{cat.pricePerKg}/kg</Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>

          {/* Weight Stepper Card */}
          <BioCard variant="outlined" padding={16} style={styles.weightCard}>
            <View style={styles.weightTextCol}>
              <Text style={[styles.weightLabel, { color: colors.textPrimary }]}>Weight Estimate: {weightKg.toFixed(1)} kg</Text>
              <Text style={[styles.payoutEstimate, { color: colors.primary }]}>
                Est. Payout: ₹{(selectedCat.pricePerKg * weightKg).toFixed(2)} (+{Math.round(selectedCat.gpPerKg * weightKg)} GP)
              </Text>
            </View>

            <View style={styles.stepperRow}>
              <TouchableOpacity
                style={[styles.stepBtn, { backgroundColor: colors.surfaceSecondary, borderColor: colors.surfaceBorder }]}
                onPress={() => setWeightKg((prev) => Math.max(0.5, Math.round((prev - 0.5) * 10) / 10))}
              >
                <Ionicons name="remove" size={18} color={colors.textPrimary} />
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.stepBtn, { backgroundColor: colors.surfaceSecondary, borderColor: colors.surfaceBorder }]}
                onPress={() => setWeightKg((prev) => Math.round((prev + 0.5) * 10) / 10)}
              >
                <Ionicons name="add" size={18} color={colors.textPrimary} />
              </TouchableOpacity>

              <PrimaryButton title="Add to Locker" icon="bag-add-outline" onPress={handleAddManualItem} style={{ flex: 1, height: 38 }} />
            </View>
          </BioCard>
        </View>

        {/* Waste Locker Running List */}
        <View style={styles.sectionContainer}>
          <View style={styles.sectionHeaderRow}>
            <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>My Waste Locker</Text>
            <Text style={[styles.sectionSub, { color: colors.primary }]}>{lockerItems.length} Accumulated</Text>
          </View>

          {lockerItems.length === 0 ? (
            <EmptyState
              icon="archive-outline"
              title="Waste Locker Empty"
              description="Select a category above or scan an item with AI to accumulate recyclables in your locker."
            />
          ) : (
            <View style={styles.lockerList}>
              <BioCard variant="subtle" padding={14} style={styles.lockerSummaryCard}>
                <View style={styles.summaryBox}>
                  <Text style={[styles.summaryVal, { color: colors.textPrimary }]}>{totalLockerWeight.toFixed(1)} kg</Text>
                  <Text style={[styles.summaryLabel, { color: colors.textSecondary }]}>Total Weight</Text>
                </View>
                <View style={styles.summaryBox}>
                  <Text style={[styles.summaryVal, { color: colors.accentBlue }]}>₹{totalLockerPayout.toFixed(2)}</Text>
                  <Text style={[styles.summaryLabel, { color: colors.textSecondary }]}>Est. Payout</Text>
                </View>
                <View style={styles.summaryBox}>
                  <Text style={[styles.summaryVal, { color: colors.primary }]}>+{totalLockerGP} GP</Text>
                  <Text style={[styles.summaryLabel, { color: colors.textSecondary }]}>GreenPoints</Text>
                </View>
              </BioCard>

              {lockerItems.map((item) => (
                <BioCard key={item.id} variant="outlined" padding={12} style={styles.lockerItem}>
                  <View style={[styles.itemIconBg, { backgroundColor: colors.primarySubtle }]}>
                    <Ionicons name={item.icon as any} size={20} color={colors.primary} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.itemName, { color: colors.textPrimary }]}>{item.categoryName}</Text>
                    <Text style={[styles.itemSub, { color: colors.textSecondary }]}>
                      {item.weightKg.toFixed(1)} kg • Est. ₹{item.payoutAmount.toFixed(2)}
                    </Text>
                  </View>
                  <TouchableOpacity onPress={() => handleRemoveLockerItem(item.id)}>
                    <Ionicons name="trash-outline" size={18} color={colors.textDanger} />
                  </TouchableOpacity>
                </BioCard>
              ))}

              <PrimaryButton
                title={`Schedule Locker Pickup (₹${totalLockerPayout.toFixed(2)})`}
                icon="calendar-outline"
                onPress={() => setPickupModalVisible(true)}
              />
            </View>
          )}
        </View>

        {/* Recycling History */}
        <View style={styles.sectionContainer}>
          <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>Completed Recycling Log</Text>
          {loadingHistory ? (
            <ActivityIndicator size="small" color={colors.primary} style={{ marginTop: 12 }} />
          ) : history.length === 0 ? (
            <Text style={[styles.noHistoryText, { color: colors.textSecondary }]}>No completed recycling transactions yet.</Text>
          ) : (
            <View style={styles.historyList}>
              {history.map((tx, idx) => (
                <BioCard key={tx.id || idx.toString()} variant="outlined" padding={12} style={styles.historyItem}>
                  <Ionicons name="checkmark-circle" size={18} color={colors.primary} />
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.historyName, { color: colors.textPrimary }]}>{tx.category}</Text>
                    <Text style={[styles.historySub, { color: colors.textSecondary }]}>
                      {tx.weight_estimate} kg • {tx.created_at ? new Date(tx.created_at).toLocaleDateString() : 'Recent'}
                    </Text>
                  </View>
                  <Text style={[styles.historyPayout, { color: colors.primaryDark }]}>+₹{Number(tx.payout_amount).toFixed(2)}</Text>
                </BioCard>
              ))}
            </View>
          )}
        </View>
      </ScrollView>

      {/* Waste Scanner Viewfinder Overlay (Matches Image 3 Left) */}
      {showWasteScannerUI && (
        <Modal visible={showWasteScannerUI} animationType="fade" transparent>
          <View style={styles.cameraOverlayContainer}>
            <View style={styles.topStatusTag}>
              <StatusBadge label="Finding Upcycling Ideas..." variant="success" icon="leaf" />
            </View>
            <ScannerOverlay detectedLabel="Plastic Bottle Detected" confidence={95} />
          </View>
        </Modal>
      )}

      {/* AI Scanner Result Modal */}
      <Modal visible={scanModalVisible} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <BioCard variant="elevated" padding={20} style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: colors.textPrimary }]}>AI Waste Scanner</Text>
              <TouchableOpacity onPress={() => setScanModalVisible(false)}>
                <Ionicons name="close" size={24} color={colors.textSecondary} />
              </TouchableOpacity>
            </View>

            {scannedPhoto && <Image source={{ uri: scannedPhoto }} style={styles.previewImg} />}

            {aiAnalyzing ? (
              <View style={styles.loadingBox}>
                <ActivityIndicator size="large" color={colors.primary} />
                <Text style={[styles.loadingTitle, { color: colors.textPrimary }]}>Classifying waste material...</Text>
              </View>
            ) : aiScanResult ? (
              <View style={styles.resultBox}>
                <Text style={[styles.detectedCatText, { color: colors.primaryDark }]}>{aiScanResult.categoryName}</Text>
                <StatusBadge label={`${aiScanResult.confidence}% AI Match`} variant="success" />
                <PrimaryButton title="Add Scanned Item to Locker" icon="add-circle-outline" onPress={handleAddScannedToLocker} />
              </View>
            ) : null}
          </BioCard>
        </View>
      </Modal>

      {/* Schedule Pickup Confirmation Modal */}
      <Modal visible={pickupModalVisible} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <BioCard variant="elevated" padding={20} style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: colors.textPrimary }]}>Campus Locker Pickup</Text>
              <TouchableOpacity onPress={() => setPickupModalVisible(false)}>
                <Ionicons name="close" size={24} color={colors.textSecondary} />
              </TouchableOpacity>
            </View>

            <View style={styles.pickupDetailBox}>
              <Text style={[styles.pickupHubTitle, { color: colors.textPrimary }]}>SGU Campus Locker Hub #4</Text>
              <Text style={[styles.pickupTotalVal, { color: colors.primaryDark }]}>Cash Payout: ₹{totalLockerPayout.toFixed(2)}</Text>
              <Text style={[styles.pickupGpSub, { color: colors.textSecondary }]}>+ {totalLockerGP} GreenPoints awarded upon drop-off</Text>
            </View>

            <PrimaryButton title="Confirm Pickup & Claim Payout" icon="checkmark-done" onPress={handleConfirmPickupSubmission} loading={submitting} />
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
  upcyclingHeroCard: {
    gap: 12,
  },
  cardHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  cardHeaderTitle: {
    fontSize: 16,
    fontWeight: '800',
  },
  planterTitle: {
    fontSize: 20,
    fontWeight: '800',
  },
  planterBody: {
    fontSize: 13,
    lineHeight: 18,
  },
  projectImpactCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    gap: 12,
  },
  impactIconBg: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  impactLabel: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  impactValue: {
    fontSize: 15,
    fontWeight: '800',
    marginTop: 2,
  },
  btnRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 4,
  },
  sectionContainer: {
    gap: 10,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
  },
  sectionSub: {
    fontSize: 13,
    fontWeight: '700',
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'baseline',
  },
  pickerScroll: {
    gap: 10,
    paddingVertical: 4,
  },
  catCard: {
    padding: 14,
    borderWidth: 1,
    alignItems: 'center',
    width: 96,
    gap: 6,
  },
  catName: {
    fontSize: 12,
    fontWeight: '700',
  },
  catRate: {
    fontSize: 11,
  },
  weightCard: {
    gap: 12,
  },
  weightTextCol: {},
  weightLabel: {
    fontSize: 15,
    fontWeight: '700',
  },
  payoutEstimate: {
    fontSize: 13,
    fontWeight: '600',
    marginTop: 2,
  },
  stepperRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  stepBtn: {
    width: 38,
    height: 38,
    borderRadius: 10,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  lockerList: {
    gap: 10,
  },
  lockerSummaryCard: {
    flexDirection: 'row',
  },
  summaryBox: {
    flex: 1,
    alignItems: 'center',
  },
  summaryVal: {
    fontSize: 16,
    fontWeight: '800',
  },
  summaryLabel: {
    fontSize: 11,
    marginTop: 2,
  },
  lockerItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  itemIconBg: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  itemName: {
    fontSize: 14,
    fontWeight: '700',
  },
  itemSub: {
    fontSize: 12,
    marginTop: 2,
  },
  noHistoryText: {
    fontSize: 13,
    fontStyle: 'italic',
  },
  historyList: {
    gap: 8,
  },
  historyItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  historyName: {
    fontSize: 13,
    fontWeight: '600',
  },
  historySub: {
    fontSize: 11,
    marginTop: 2,
  },
  historyPayout: {
    fontSize: 13,
    fontWeight: '700',
  },
  cameraOverlayContainer: {
    flex: 1,
    backgroundColor: '#000000',
    paddingTop: 50,
  },
  topStatusTag: {
    alignItems: 'center',
    marginVertical: 10,
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
  detectedCatText: {
    fontSize: 20,
    fontWeight: '800',
  },
  pickupDetailBox: {
    gap: 6,
    paddingVertical: 8,
  },
  pickupHubTitle: {
    fontSize: 16,
    fontWeight: '700',
  },
  pickupTotalVal: {
    fontSize: 22,
    fontWeight: '800',
  },
  pickupGpSub: {
    fontSize: 13,
  },
});
