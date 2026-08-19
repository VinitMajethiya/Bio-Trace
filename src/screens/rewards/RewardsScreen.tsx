import React, { useEffect, useState } from 'react';
import { StyleSheet, Text, View, ScrollView, TouchableOpacity, Modal, Alert } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../providers/ThemeProvider';
import { useAuth } from '../../context/AuthContext';
import { fetchUserLedgerBalance } from '../../lib/ledger';
import { WarmCard } from '../../components/common/BioCard';
import { PrimaryButton } from '../../components/common/PrimaryButton';
import { FilterPill } from '../../components/common/FilterChip';
import { GreenPointsChip } from '../../components/common/GreenPointsChip';
import { IconButton } from '../../components/common/IconButton';

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
    color: '#D97706',
    category: 'Voucher',
  },
  {
    id: 'reward-2',
    title: 'Native Flora Sapling',
    description: 'Claim a native plant sapling from the campus botanical nursery.',
    costGP: 80,
    icon: 'leaf',
    color: '#3E6B48',
    category: 'Eco-Item',
  },
  {
    id: 'reward-3',
    title: 'Eco Canvas Tote Bag',
    description: 'Durable 100% recycled organic cotton bag with BioVerse logo.',
    costGP: 100,
    icon: 'bag',
    color: '#2D4F34',
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
    color: '#D97706',
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
  const [activeCategory, setActiveCategory] = useState<string>('All');

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

  const filteredCatalog = REWARDS_CATALOG.filter((item) => {
    if (activeCategory === 'All') return true;
    return item.category === activeCategory;
  });

  return (
    <View style={[styles.container, { backgroundColor: colors.canvas_airy || '#f4fbf3', paddingTop: Math.max(insets.top, 16) }]}>
      {/* Top Header */}
      <View style={styles.topHeader}>
        <IconButton icon="arrow-back" onPress={() => navigation.goBack()} />
        <Text style={[styles.displayTitle, { color: colors.text_airy_primary || '#161d18' }]}>
          Rewards
        </Text>
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {/* Large Balance Display WarmCard */}
        <WarmCard variant="hero" padding={24} style={styles.balanceCard}>
          <Text style={[styles.balanceLabel, { color: colors.text_on_warm_secondary || '#3E6B48' }]}>AVAILABLE BALANCE</Text>
          <Text style={[styles.dataLargeVal, { color: colors.amber || '#E8A920' }]}>
            {userGP} <Text style={{ fontSize: 24 }}>GP</Text>
          </Text>
          <Text style={[styles.balanceSub, { color: colors.text_on_warm_muted || '#7A9882' }]}>
            Redeem GreenPoints for campus discounts, saplings, and eco-gear.
          </Text>
        </WarmCard>

        {/* Filter Pills */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterBar}>
          {['All', 'Voucher', 'Eco-Item', 'Merchandise', 'Campus Utility'].map((cat) => (
            <FilterPill
              key={cat}
              label={cat}
              active={activeCategory === cat}
              onPress={() => setActiveCategory(cat)}
              canvas="warm"
            />
          ))}
        </ScrollView>

        {/* 2x2 Grid of Rewards */}
        <View style={styles.rewardsGrid}>
          {filteredCatalog.map((item) => {
            const canAfford = userGP >= item.costGP;

            return (
              <WarmCard key={item.id} padding={16} style={styles.rewardCol}>
                <View style={[styles.iconBg, { backgroundColor: colors.amber_subtle || 'rgba(232, 169, 32, 0.15)' }]}>
                  <Ionicons name={item.icon} size={26} color={colors.amber || '#E8A920'} />
                </View>

                <Text style={[styles.rewardTitle, { color: colors.text_on_warm_primary || '#142217' }]} numberOfLines={1}>{item.title}</Text>
                <Text style={[styles.rewardDesc, { color: colors.text_on_warm_secondary || '#3E6B48' }]} numberOfLines={2}>{item.description}</Text>

                <View style={styles.cardFooterRow}>
                  <GreenPointsChip points={item.costGP} label="Cost" />
                </View>

                <PrimaryButton
                  title={canAfford ? 'Redeem' : 'Locked'}
                  onPress={() => handleRedeemClick(item)}
                  disabled={!canAfford}
                  size="sm"
                  style={{ width: '100%', marginTop: 6 }}
                />
              </WarmCard>
            );
          })}
        </View>
      </ScrollView>

      {/* Voucher Code Modal */}
      <Modal visible={!!selectedReward} animationType="slide" transparent>
        <View style={[styles.modalOverlay, { backgroundColor: 'rgba(20, 34, 23, 0.60)' }]}>
          <WarmCard padding={24} style={[styles.modalCard, { borderTopLeftRadius: radii.card_hero || 36, borderTopRightRadius: radii.card_hero || 36 }]}>
            <View style={styles.modalHeader}>
              <Text style={{ fontSize: 20, fontWeight: '700', color: colors.text_on_warm_primary || '#142217' }}>Voucher Claimed!</Text>
              <TouchableOpacity onPress={() => setSelectedReward(null)}>
                <Ionicons name="close" size={24} color={colors.text_on_warm_secondary || '#7A9882'} />
              </TouchableOpacity>
            </View>

            <Text style={{ fontSize: 13, color: colors.text_on_warm_secondary || '#3E6B48' }}>
              Show this digital code at the SGU Kiosk to claim {selectedReward?.title}.
            </Text>

            <View style={[styles.voucherBox, { backgroundColor: colors.card_warm_soft || '#FFFDF9' }]}>
              <Text style={[styles.codeText, { color: colors.green_vivid || '#4CAF72' }]}>{redeemedCode}</Text>
              <Ionicons name="qr-code" size={80} color={colors.text_on_warm_primary || '#142217'} style={{ marginTop: 8 }} />
            </View>

            <PrimaryButton title="Done" onPress={() => setSelectedReward(null)} />
          </WarmCard>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  topHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    gap: 12,
    marginBottom: 8,
  },
  backBtn: {
    padding: 4,
  },
  displayTitle: {
    fontSize: 34,
    lineHeight: 40,
    fontWeight: '700',
    letterSpacing: -0.8,
  },
  content: {
    padding: 24,
    gap: 16,
    paddingBottom: 40,
  },
  balanceCard: {
    alignItems: 'center',
    gap: 6,
  },
  balanceLabel: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 1,
    color: '#3E6B48',
  },
  dataLargeVal: {
    fontSize: 48,
    lineHeight: 52,
    fontWeight: '700',
    letterSpacing: -1,
  },
  balanceSub: {
    fontSize: 12,
    color: '#7A9882',
    textAlign: 'center',
    marginTop: 4,
  },
  filterBar: {
    gap: 8,
    paddingVertical: 2,
  },
  rewardsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 14,
  },
  rewardCol: {
    width: '47.5%',
    gap: 8,
    alignItems: 'flex-start',
  },
  iconBg: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rewardTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#142217',
  },
  rewardDesc: {
    fontSize: 11,
    color: '#3E6B48',
    lineHeight: 15,
  },
  cardFooterRow: {
    marginTop: 2,
  },
  modalOverlay: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  modalCard: {
    padding: 24,
    gap: 16,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  voucherBox: {
    padding: 20,
    backgroundColor: '#FFFDF9',
    borderRadius: 16,
    alignItems: 'center',
  },
  codeText: {
    fontSize: 24,
    fontWeight: '700',
    color: '#4CAF72',
    letterSpacing: 2,
  },
});
