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
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { useAuth } from '../../context/AuthContext';
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
  const { user } = useAuth();

  // Category Picker State (4.1)
  const [selectedCat, setSelectedCat] = useState<WasteCategoryInfo>(WASTE_CATEGORIES[0]);
  const [weightKg, setWeightKg] = useState<number>(1.0);

  // Waste Locker State (4.3)
  const [lockerItems, setLockerItems] = useState<WasteLockerItem[]>([]);
  const [history, setHistory] = useState<WasteTransactionRecord[]>([]);
  const [loadingHistory, setLoadingHistory] = useState<boolean>(true);
  const [refreshing, setRefreshing] = useState<boolean>(false);

  // AI Scanner & Pickup Modal State (4.2 & 4.4)
  const [scanModalVisible, setScanModalVisible] = useState<boolean>(false);
  const [pickupModalVisible, setPickupModalVisible] = useState<boolean>(false);
  const [scannedPhoto, setScannedPhoto] = useState<string | null>(null);
  const [aiAnalyzing, setAiAnalyzing] = useState<boolean>(false);
  const [aiScanResult, setAiScanResult] = useState<WasteScanResult | null>(null);
  const [submitting, setSubmitting] = useState<boolean>(false);

  useEffect(() => {
    loadHistory();
  }, [user]);

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

  // 4.1 Offline Manual Picker: Add to Waste Locker
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
    Alert.alert('Item Added to Locker', `Added ${weightKg} kg of ${selectedCat.name} (₹${payout} est. payout)`);
  };

  // Remove single item from locker
  const handleRemoveLockerItem = (id: string) => {
    setLockerItems((prev) => prev.filter((item) => item.id !== id));
  };

  // 4.2 AI Scanner Launch
  const handleLaunchCameraScanner = async () => {
    try {
      const perm = await ImagePicker.requestCameraPermissionsAsync();
      if (!perm.granted) {
        Alert.alert('Camera Permission Required', 'Please grant camera access to scan waste items.');
        return;
      }

      const result = await ImagePicker.launchCameraAsync({
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
    } catch (err) {
      console.warn('Camera failed, launching gallery picker:', err);
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

  // 4.4 & 4.5 Schedule Pickup & Submit to Supabase
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
      Alert.alert('Submission Error', res.error || 'Failed to complete waste transaction.');
    }
  };

  // Calculate Running Locker Totals
  const totalLockerWeight = lockerItems.reduce((acc, item) => acc + item.weightKg, 0);
  const totalLockerPayout = lockerItems.reduce((acc, item) => acc + item.payoutAmount, 0);
  const totalLockerGP = lockerItems.reduce((acc, item) => acc + item.gpReward, 0);

  return (
    <View style={[styles.container, { paddingTop: Math.max(insets.top, 16) }]}>
      {/* Header */}
      <View style={styles.header}>
        <Ionicons name="sync-circle" size={24} color="#3B82F6" />
        <Text style={styles.headerTitle}>Circular — Waste Marketplace</Text>
      </View>

      <ScrollView
        contentContainerStyle={styles.content}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#3B82F6" />
        }
      >
        {/* AI Waste Scanner Hero CTA */}
        <View style={styles.heroCard}>
          <Ionicons name="cube-outline" size={42} color="#60A5FA" />
          <Text style={styles.heroTitle}>AI Waste Scanner & Locker</Text>
          <Text style={styles.heroSub}>
            Scan waste items using AI vision or select categories below to log weight, earn cash payout & boost the Health Score.
          </Text>

          <View style={styles.heroBtnRow}>
            <TouchableOpacity style={styles.scanBtn} onPress={handleLaunchCameraScanner}>
              <Ionicons name="camera-outline" size={18} color="#000000" />
              <Text style={styles.scanBtnText}>AI Waste Scanner</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.uploadBtn} onPress={handleLaunchGalleryScanner}>
              <Ionicons name="images-outline" size={18} color="#60A5FA" />
              <Text style={styles.uploadBtnText}>Upload Photo</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* 4.1 Waste Category Picker */}
        <View style={styles.sectionContainer}>
          <Text style={styles.sectionTitle}>Select Waste Category (Offline-First)</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.pickerScroll}>
            {WASTE_CATEGORIES.map((cat) => {
              const isSelected = selectedCat.id === cat.id;
              return (
                <TouchableOpacity
                  key={cat.id}
                  style={[
                    styles.catCard,
                    isSelected && { borderColor: cat.color, backgroundColor: 'rgba(59, 130, 246, 0.2)' },
                  ]}
                  onPress={() => setSelectedCat(cat)}
                >
                  <Ionicons name={cat.icon as any} size={24} color={cat.color} />
                  <Text style={styles.catName}>{cat.name}</Text>
                  <Text style={styles.catRate}>₹{cat.pricePerKg}/kg</Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>

          {/* Weight Stepper */}
          <View style={styles.weightCard}>
            <View style={{ flex: 1 }}>
              <Text style={styles.weightLabel}>Weight Estimate: {weightKg.toFixed(1)} kg</Text>
              <Text style={styles.payoutEstimate}>
                Est. Payout: ₹{(selectedCat.pricePerKg * weightKg).toFixed(2)} (+
                {Math.round(selectedCat.gpPerKg * weightKg)} GP)
              </Text>
            </View>

            <View style={styles.stepperRow}>
              <TouchableOpacity
                style={styles.stepBtn}
                onPress={() => setWeightKg((prev) => Math.max(0.5, Math.round((prev - 0.5) * 10) / 10))}
              >
                <Ionicons name="remove" size={18} color="#93C5FD" />
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.stepBtn}
                onPress={() => setWeightKg((prev) => Math.round((prev + 0.5) * 10) / 10)}
              >
                <Ionicons name="add" size={18} color="#93C5FD" />
              </TouchableOpacity>

              <TouchableOpacity style={styles.addLockerBtn} onPress={handleAddManualItem}>
                <Ionicons name="bag-add" size={16} color="#0F172A" />
                <Text style={styles.addLockerText}>Add to Locker</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>

        {/* 4.3 Waste Locker Running List */}
        <View style={styles.sectionContainer}>
          <View style={styles.sectionHeaderRow}>
            <Text style={styles.sectionTitle}>My Waste Locker</Text>
            <Text style={styles.sectionSub}>{lockerItems.length} Items Accumulated</Text>
          </View>

          {lockerItems.length === 0 ? (
            <View style={styles.emptyCard}>
              <Ionicons name="archive-outline" size={36} color="#4B5563" />
              <Text style={styles.emptyTitle}>Waste Locker Empty</Text>
              <Text style={styles.emptySub}>
                Select a category above or scan an item with AI to accumulate recyclables in your locker.
              </Text>
            </View>
          ) : (
            <View style={styles.lockerList}>
              <View style={styles.lockerSummaryCard}>
                <View style={styles.summaryBox}>
                  <Text style={styles.summaryVal}>{totalLockerWeight.toFixed(1)} kg</Text>
                  <Text style={styles.summaryLabel}>Total Weight</Text>
                </View>
                <View style={styles.summaryBox}>
                  <Text style={[styles.summaryVal, { color: '#60A5FA' }]}>₹{totalLockerPayout.toFixed(2)}</Text>
                  <Text style={styles.summaryLabel}>Mock Payout</Text>
                </View>
                <View style={styles.summaryBox}>
                  <Text style={[styles.summaryVal, { color: '#34D399' }]}>+{totalLockerGP} GP</Text>
                  <Text style={styles.summaryLabel}>GreenPoints</Text>
                </View>
              </View>

              {lockerItems.map((item) => (
                <View key={item.id} style={styles.lockerItem}>
                  <View style={styles.itemIconBg}>
                    <Ionicons name={item.icon as any} size={20} color="#60A5FA" />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.itemName}>{item.categoryName}</Text>
                    <Text style={styles.itemSub}>
                      {item.weightKg.toFixed(1)} kg • Est. ₹{item.payoutAmount.toFixed(2)}
                    </Text>
                  </View>
                  <TouchableOpacity onPress={() => handleRemoveLockerItem(item.id)}>
                    <Ionicons name="trash-outline" size={18} color="#EF4444" />
                  </TouchableOpacity>
                </View>
              ))}

              {/* 4.4 Schedule Pickup CTA */}
              <TouchableOpacity style={styles.pickupBtn} onPress={() => setPickupModalVisible(true)}>
                <Ionicons name="calendar-outline" size={18} color="#0F172A" />
                <Text style={styles.pickupBtnText}>Schedule Locker Pickup (₹{totalLockerPayout.toFixed(2)})</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>

        {/* Recent Recycling History */}
        <View style={styles.sectionContainer}>
          <Text style={styles.sectionTitle}>Completed Recycling Log</Text>
          {loadingHistory ? (
            <ActivityIndicator size="small" color="#60A5FA" style={{ marginTop: 12 }} />
          ) : history.length === 0 ? (
            <Text style={styles.noHistoryText}>No completed transactions yet.</Text>
          ) : (
            <View style={styles.historyList}>
              {history.map((tx, idx) => (
                <View key={tx.id || idx.toString()} style={styles.historyItem}>
                  <Ionicons name="checkmark-circle" size={18} color="#34D399" />
                  <View style={{ flex: 1 }}>
                    <Text style={styles.historyName}>{tx.category}</Text>
                    <Text style={styles.historySub}>
                      {tx.weight_estimate} kg • {tx.created_at ? new Date(tx.created_at).toLocaleDateString() : 'Recent'}
                    </Text>
                  </View>
                  <Text style={styles.historyPayout}>+₹{Number(tx.payout_amount).toFixed(2)}</Text>
                </View>
              ))}
            </View>
          )}
        </View>
      </ScrollView>

      {/* AI Scanner Modal */}
      <Modal visible={scanModalVisible} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>AI Waste Scanner</Text>
              <TouchableOpacity onPress={() => setScanModalVisible(false)}>
                <Ionicons name="close" size={24} color="#9CA3AF" />
              </TouchableOpacity>
            </View>

            {scannedPhoto && <Image source={{ uri: scannedPhoto }} style={styles.previewImg} />}

            {aiAnalyzing ? (
              <View style={styles.aiLoadingContainer}>
                <ActivityIndicator size="large" color="#60A5FA" />
                <Text style={styles.aiLoadingText}>Running Hugging Face Waste Vision Model...</Text>
                <Text style={styles.aiLoadingSub}>Classifying item category & material composition</Text>
              </View>
            ) : aiScanResult ? (
              <View style={styles.aiResultBox}>
                <Text style={styles.aiDetectedTitle}>{aiScanResult.categoryName}</Text>

                {aiScanResult.isUncertain && (
                  <View style={styles.uncertainBanner}>
                    <Ionicons name="alert-circle" size={16} color="#F59E0B" />
                    <Text style={styles.uncertainText}>Confidence &lt; 60% — Flagged for Sorting Review</Text>
                  </View>
                )}

                <View style={styles.metaRow}>
                  <View style={styles.metaPill}>
                    <Ionicons name="checkmark-circle-outline" size={16} color="#3B82F6" />
                    <Text style={styles.metaText}>{aiScanResult.confidence}% AI Match</Text>
                  </View>
                </View>

                <TouchableOpacity style={styles.confirmScanBtn} onPress={handleAddScannedToLocker}>
                  <Ionicons name="add-circle" size={18} color="#0F172A" />
                  <Text style={styles.confirmScanText}>Add Scanned Item to Locker</Text>
                </TouchableOpacity>
              </View>
            ) : null}
          </View>
        </View>
      </Modal>

      {/* 4.4 Pickup Confirmation Modal */}
      <Modal visible={pickupModalVisible} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Campus Locker Pickup</Text>
              <TouchableOpacity onPress={() => setPickupModalVisible(false)}>
                <Ionicons name="close" size={24} color="#9CA3AF" />
              </TouchableOpacity>
            </View>

            <View style={styles.pickupDetailBox}>
              <View style={styles.hubRow}>
                <Ionicons name="location" size={20} color="#60A5FA" />
                <View>
                  <Text style={styles.hubTitle}>SGU Campus Locker Hub #4</Text>
                  <Text style={styles.hubSub}>Automated Smart Recycling Deposit</Text>
                </View>
              </View>

              <View style={styles.breakdownBox}>
                <Text style={styles.breakdownHeader}>Item Summary ({lockerItems.length} items)</Text>
                {lockerItems.map((item, i) => (
                  <View key={i} style={styles.breakdownRow}>
                    <Text style={styles.breakdownName}>
                      {item.categoryName} ({item.weightKg} kg)
                    </Text>
                    <Text style={styles.breakdownVal}>₹{item.payoutAmount.toFixed(2)}</Text>
                  </View>
                ))}
              </View>

              <View style={styles.payoutTotalRow}>
                <Text style={styles.payoutTotalLabel}>Total Cash Payout:</Text>
                <Text style={styles.payoutTotalVal}>₹{totalLockerPayout.toFixed(2)}</Text>
              </View>
              <Text style={styles.gpEarnSub}>+ {totalLockerGP} GreenPoints awarded upon drop-off</Text>
            </View>

            <TouchableOpacity
              style={styles.confirmPickupBtn}
              onPress={handleConfirmPickupSubmission}
              disabled={submitting}
            >
              {submitting ? (
                <ActivityIndicator color="#0F172A" size="small" />
              ) : (
                <>
                  <Ionicons name="checkmark-done" size={20} color="#0F172A" />
                  <Text style={styles.confirmPickupText}>Confirm Pickup & Claim Payout</Text>
                </>
              )}
            </TouchableOpacity>
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
  heroCard: {
    backgroundColor: '#0A1E36',
    borderRadius: 20,
    padding: 20,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#1D3B60',
  },
  heroTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#EFF6FF',
    marginTop: 8,
  },
  heroSub: {
    fontSize: 13,
    color: '#93C5FD',
    textAlign: 'center',
    marginTop: 4,
    lineHeight: 18,
  },
  heroBtnRow: {
    flexDirection: 'row',
    marginTop: 16,
    gap: 10,
    width: '100%',
  },
  scanBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#60A5FA',
    paddingVertical: 12,
    borderRadius: 12,
    gap: 6,
  },
  scanBtnText: {
    color: '#0F172A',
    fontSize: 14,
    fontWeight: '700',
  },
  uploadBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(96, 165, 250, 0.12)',
    borderWidth: 1,
    borderColor: 'rgba(96, 165, 250, 0.3)',
    paddingVertical: 12,
    borderRadius: 12,
    gap: 6,
  },
  uploadBtnText: {
    color: '#60A5FA',
    fontSize: 14,
    fontWeight: '700',
  },
  sectionContainer: {
    gap: 10,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#E5E7EB',
  },
  sectionSub: {
    fontSize: 12,
    color: '#60A5FA',
    fontWeight: '600',
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
    backgroundColor: '#0F241C',
    borderRadius: 14,
    padding: 14,
    borderWidth: 1.5,
    borderColor: '#19392B',
    alignItems: 'center',
    width: 90,
    gap: 6,
  },
  catName: {
    color: '#ECFDF5',
    fontSize: 12,
    fontWeight: '700',
  },
  catRate: {
    color: '#9CA3AF',
    fontSize: 11,
  },
  weightCard: {
    backgroundColor: '#0F241C',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: '#19392B',
    gap: 12,
  },
  weightLabel: {
    color: '#ECFDF5',
    fontSize: 15,
    fontWeight: '700',
  },
  payoutEstimate: {
    color: '#60A5FA',
    fontSize: 13,
    marginTop: 2,
    fontWeight: '600',
  },
  stepperRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  stepBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#0A1E36',
    borderWidth: 1,
    borderColor: '#1D3B60',
    alignItems: 'center',
    justifyContent: 'center',
  },
  addLockerBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#60A5FA',
    height: 36,
    borderRadius: 10,
    gap: 6,
  },
  addLockerText: {
    color: '#0F172A',
    fontSize: 13,
    fontWeight: '700',
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
  lockerList: {
    gap: 10,
  },
  lockerSummaryCard: {
    flexDirection: 'row',
    backgroundColor: '#0A1E36',
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: '#1D3B60',
  },
  summaryBox: {
    flex: 1,
    alignItems: 'center',
  },
  summaryVal: {
    color: '#ECFDF5',
    fontSize: 16,
    fontWeight: '800',
  },
  summaryLabel: {
    color: '#93C5FD',
    fontSize: 11,
    marginTop: 2,
  },
  lockerItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#0F241C',
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: '#19392B',
    gap: 12,
  },
  itemIconBg: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(96, 165, 250, 0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  itemName: {
    color: '#ECFDF5',
    fontSize: 14,
    fontWeight: '700',
  },
  itemSub: {
    color: '#9CA3AF',
    fontSize: 12,
    marginTop: 2,
  },
  pickupBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#60A5FA',
    height: 48,
    borderRadius: 14,
    marginTop: 6,
    gap: 8,
  },
  pickupBtnText: {
    color: '#0F172A',
    fontSize: 15,
    fontWeight: '800',
  },
  noHistoryText: {
    color: '#9CA3AF',
    fontSize: 13,
    fontStyle: 'italic',
  },
  historyList: {
    gap: 8,
  },
  historyItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#0F241C',
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: '#19392B',
    gap: 10,
  },
  historyName: {
    color: '#E5E7EB',
    fontSize: 13,
    fontWeight: '600',
  },
  historySub: {
    color: '#9CA3AF',
    fontSize: 11,
    marginTop: 2,
  },
  historyPayout: {
    color: '#34D399',
    fontSize: 13,
    fontWeight: '700',
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
    borderTopColor: '#60A5FA',
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
  previewImg: {
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
  aiResultBox: {
    gap: 12,
  },
  aiDetectedTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: '#60A5FA',
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
  metaRow: {
    flexDirection: 'row',
    gap: 10,
  },
  metaPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#071610',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 10,
    gap: 6,
  },
  metaText: {
    color: '#E5E7EB',
    fontSize: 13,
    fontWeight: '600',
  },
  confirmScanBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#60A5FA',
    height: 48,
    borderRadius: 14,
    marginTop: 8,
    gap: 8,
  },
  confirmScanText: {
    color: '#0F172A',
    fontSize: 15,
    fontWeight: '800',
  },
  pickupDetailBox: {
    backgroundColor: '#0A1E36',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: '#1D3B60',
    gap: 14,
  },
  hubRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  hubTitle: {
    color: '#EFF6FF',
    fontSize: 15,
    fontWeight: '700',
  },
  hubSub: {
    color: '#93C5FD',
    fontSize: 12,
  },
  breakdownBox: {
    gap: 8,
    borderTopWidth: 1,
    borderTopColor: '#1D3B60',
    paddingTop: 10,
  },
  breakdownHeader: {
    color: '#9CA3AF',
    fontSize: 12,
    fontWeight: '700',
  },
  breakdownRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  breakdownName: {
    color: '#E5E7EB',
    fontSize: 13,
  },
  breakdownVal: {
    color: '#60A5FA',
    fontSize: 13,
    fontWeight: '700',
  },
  payoutTotalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    borderTopWidth: 1,
    borderTopColor: '#1D3B60',
    paddingTop: 10,
  },
  payoutTotalLabel: {
    color: '#EFF6FF',
    fontSize: 16,
    fontWeight: '800',
  },
  payoutTotalVal: {
    color: '#34D399',
    fontSize: 20,
    fontWeight: '800',
  },
  gpEarnSub: {
    color: '#93C5FD',
    fontSize: 12,
    textAlign: 'center',
  },
  confirmPickupBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#34D399',
    height: 48,
    borderRadius: 14,
    gap: 8,
  },
  confirmPickupText: {
    color: '#0F172A',
    fontSize: 15,
    fontWeight: '800',
  },
});
