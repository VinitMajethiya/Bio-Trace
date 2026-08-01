import React, { useEffect, useState } from 'react';
import { StyleSheet, Text, View, ScrollView, TouchableOpacity, Modal, Alert } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../providers/ThemeProvider';
import { useAuth } from '../../context/AuthContext';
import { fetchUserLedgerBalance } from '../../lib/ledger';
import { BioCard } from '../../components/common/BioCard';
import { PrimaryButton } from '../../components/common/PrimaryButton';

export interface RewardItem {
  id: string;
  title: string;
  description: string;
  costGP: number;
  icon: keyof typeof Ionicons.glyphMap;
  color: string;
  category: string;
}

const REWARDS_CATALOG: RewardItem[] = [
  {
    id: 'reward-1',
    title: 'Campus Cafe 20% Discount',
    description: 'Get 20% off any organic beverage or eco-snack at SGU Cafe.',
    costGP: 50,
    icon: 'cafe',
    color: '#F59E0B',
    category: 'Voucher',
  },
  {
    id: 'reward-2',
    title: 'Native Flora Sapling',
    description: 'Claim a native plant sapling from the campus botanical nursery.',
    costGP: 80,
    icon: 'leaf',
    color: '#059669',
    category: 'Eco-Item',
  },
  {
    id: 'reward-3',
    title: 'Eco Canvas Tote Bag',
    description: 'Durable 100% recycled organic cotton bag with BioVerse logo.',
    costGP: 100,
    icon: 'bag',
    color: '#10B981',
    category: 'Merchandise',
  },
  {
    id: 'reward-4',
    title: 'Stainless Steel Water Bottle',
    description: 'Insulated 750ml zero-waste refillable bottle for campus hydration.',
    costGP: 150,
    icon: 'water',
    color: '#3B82F6',
    category: 'Merchandise',
  },
  {
    id: 'reward-5',
    title: 'Solar Charging Hub Pass',
    description: 'Unlimited 1-day pass for high-speed solar laptop charging station.',
    costGP: 200,
    icon: 'flash',
    color: '#8B5CF6',
    category: 'Campus Utility',
  },
];

export const RewardsScreen: React.FC = () => {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<any>();
  const { colors, radii } = useTheme();
  const { user } = useAuth();
  const [userGP, setUserGP] = useState<number>(0);
  const [selectedReward, setSelectedReward] = useState<RewardItem | null>(null);
  const [redeemedCode, setRedeemedCode] = useState<string | null>(null);

  const loadBalance = async () => {
    if (user?.id) {
      const summary = await fetchUserLedgerBalance(user.id);
      setUserGP(summary.total_gp);
    }
  };

  useFocusEffect(
    React.useCallback(() => {
      loadBalance();
    }, [user?.id])
  );

  useEffect(() => {
    loadBalance();
  }, [user?.id]);

  const handleRedeemClick = (reward: RewardItem) => {
    if (userGP < reward.costGP) {
      Alert.alert(
        'Insufficient GreenPoints',
        `You need ${reward.costGP} GP for this reward. Keep logging Wild sightings & Circular recycling to earn more!`
      );
      return;
    }

    const mockCode = `ECO-${Math.floor(1000 + Math.random() * 9000)}-${reward.id.split('-')[1].toUpperCase()}`;
    setRedeemedCode(mockCode);
    setSelectedReward(reward);
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background, paddingTop: Math.max(insets.top, 12) }]}>
      {/* Header Bar */}
      <View style={[styles.header, { borderBottomColor: colors.surfaceBorder }]}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn} activeOpacity={0.7}>
          <Ionicons name="arrow-back" size={24} color={colors.textPrimary} />
        </TouchableOpacity>
        <Ionicons name="gift" size={22} color={colors.primary} />
        <Text style={[styles.headerTitle, { color: colors.textPrimary }]}>Eco Rewards Catalogue</Text>
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        {/* User GP Balance Banner */}
        <BioCard variant="elevated" padding={16} style={[styles.balanceBanner, { backgroundColor: colors.primarySubtle }]}>
          <View style={styles.balanceRow}>
            <View>
              <Text style={[styles.balanceSub, { color: colors.textSecondary }]}>Available Balance</Text>
              <Text style={[styles.balanceVal, { color: colors.primaryDark }]}>{userGP} GreenPoints</Text>
            </View>
            <View style={[styles.gpBadgeBg, { backgroundColor: colors.primary }]}>
              <Ionicons name="sparkles" size={18} color="#FFFFFF" />
            </View>
          </View>
        </BioCard>

        <Text style={[styles.catalogHeading, { color: colors.textPrimary }]}>Redeemable Campus Rewards</Text>

        {/* Rewards Grid */}
        <View style={styles.rewardsList}>
          {REWARDS_CATALOG.map((item) => {
            const canAfford = userGP >= item.costGP;

            return (
              <BioCard key={item.id} variant="outlined" padding={14} style={styles.rewardCard}>
                <View style={[styles.iconBox, { backgroundColor: `${item.color}18` }]}>
                  <Ionicons name={item.icon} size={24} color={item.color} />
                </View>

                <View style={{ flex: 1 }}>
                  <View style={styles.rewardTagRow}>
                    <Text style={[styles.categoryTag, { color: colors.textMuted }]}>{item.category}</Text>
                  </View>
                  <Text style={[styles.rewardTitle, { color: colors.textPrimary }]}>{item.title}</Text>
                  <Text style={[styles.rewardDesc, { color: colors.textSecondary }]} numberOfLines={2}>
                    {item.description}
                  </Text>
                </View>

                <View style={styles.actionCol}>
                  <View style={[styles.priceTag, { backgroundColor: canAfford ? colors.primarySubtle : colors.surfaceSecondary }]}>
                    <Text style={[styles.priceText, { color: canAfford ? colors.primaryDark : colors.textMuted }]}>
                      {item.costGP} GP
                    </Text>
                  </View>

                  <TouchableOpacity
                    style={[
                      styles.redeemBtn,
                      { backgroundColor: canAfford ? colors.primary : colors.surfaceSecondary },
                    ]}
                    onPress={() => handleRedeemClick(item)}
                    activeOpacity={0.8}
                  >
                    <Text style={[styles.redeemBtnText, { color: canAfford ? '#FFFFFF' : colors.textMuted }]}>
                      Redeem
                    </Text>
                  </TouchableOpacity>
                </View>
              </BioCard>
            );
          })}
        </View>
      </ScrollView>

      {/* Redemption Confirmation Modal */}
      <Modal visible={!!selectedReward} animationType="slide" transparent>
        <View style={styles.modalBackdrop}>
          <View style={styles.modalCard}>
            <View style={styles.modalHeader}>
              <View style={[styles.modalSuccessIcon, { backgroundColor: colors.primarySubtle }]}>
                <Ionicons name="checkmark-circle" size={32} color={colors.primary} />
              </View>
              <TouchableOpacity onPress={() => setSelectedReward(null)}>
                <Ionicons name="close" size={24} color={colors.textSecondary} />
              </TouchableOpacity>
            </View>

            <Text style={[styles.modalTitle, { color: colors.textPrimary }]}>Reward Redeemed!</Text>
            <Text style={[styles.modalSub, { color: colors.textSecondary }]}>
              Show this digital voucher code or QR pass at the SGU Campus Eco-Kiosk to collect your {selectedReward?.title}.
            </Text>

            <View style={[styles.voucherCard, { backgroundColor: colors.surfaceSecondary, borderRadius: radii.lg }]}>
              <Text style={[styles.voucherLabel, { color: colors.textMuted }]}>REDEEMED VOUCHER CODE</Text>
              <Text style={[styles.voucherCode, { color: colors.primary }]}>{redeemedCode}</Text>
              <View style={styles.qrPlaceholder}>
                <Ionicons name="qr-code" size={72} color={colors.textPrimary} />
              </View>
            </View>

            <PrimaryButton title="Done" onPress={() => setSelectedReward(null)} />
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    height: 52,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    gap: 10,
  },
  backBtn: {
    padding: 4,
    marginRight: 4,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '800',
  },
  content: {
    padding: 16,
    gap: 16,
    paddingBottom: 40,
  },
  balanceBanner: {
    borderColor: 'rgba(5, 150, 105, 0.3)',
  },
  balanceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  balanceSub: {
    fontSize: 12,
    fontWeight: '600',
  },
  balanceVal: {
    fontSize: 24,
    fontWeight: '800',
    marginTop: 2,
  },
  gpBadgeBg: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  catalogHeading: {
    fontSize: 15,
    fontWeight: '700',
  },
  rewardsList: {
    gap: 12,
  },
  rewardCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  iconBox: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rewardTagRow: {
    marginBottom: 2,
  },
  categoryTag: {
    fontSize: 10,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  rewardTitle: {
    fontSize: 14,
    fontWeight: '700',
  },
  rewardDesc: {
    fontSize: 11,
    marginTop: 2,
  },
  actionCol: {
    alignItems: 'flex-end',
    gap: 6,
  },
  priceTag: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  priceText: {
    fontSize: 12,
    fontWeight: '800',
  },
  redeemBtn: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 10,
  },
  redeemBtnText: {
    fontSize: 11,
    fontWeight: '800',
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.6)',
    justifyContent: 'flex-end',
  },
  modalCard: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 20,
    gap: 14,
    paddingBottom: 32,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  modalSuccessIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '800',
  },
  modalSub: {
    fontSize: 13,
  },
  voucherCard: {
    padding: 16,
    alignItems: 'center',
    gap: 8,
  },
  voucherLabel: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 1,
  },
  voucherCode: {
    fontSize: 22,
    fontWeight: '800',
    letterSpacing: 2,
  },
  qrPlaceholder: {
    marginTop: 8,
    padding: 12,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
  },
});
