import React, { useEffect, useState } from 'react';
import { StyleSheet, Text, View, ScrollView, ActivityIndicator, RefreshControl, TouchableOpacity } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../providers/ThemeProvider';
import { useAuth } from '../../context/AuthContext';
import { BioCard } from '../../components/common/BioCard';
import { EmptyState } from '../../components/common/EmptyState';
import { fetchUserLedgerBalance, UserLedgerSummary } from '../../lib/ledger';

export const WalletScreen: React.FC = () => {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<any>();
  const { colors, radii } = useTheme();
  const { user } = useAuth();
  const [summary, setSummary] = useState<UserLedgerSummary>({
    total_gp: 0,
    wild_xp: 0,
    circular_payout: 0,
    entries: [],
  });
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadLedger = async () => {
    if (!user) return;
    const data = await fetchUserLedgerBalance(user.id);
    setSummary(data);
    setLoading(false);
    setRefreshing(false);
  };

  useEffect(() => {
    loadLedger();
  }, [user]);

  const onRefresh = () => {
    setRefreshing(true);
    loadLedger();
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background, paddingTop: Math.max(insets.top, 12) }]}>
      {/* Header with Back Arrow */}
      <View style={[styles.header, { borderBottomColor: colors.surfaceBorder }]}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn} activeOpacity={0.7}>
          <Ionicons name="arrow-back" size={24} color={colors.textPrimary} />
        </TouchableOpacity>
        <Ionicons name="wallet" size={22} color={colors.accentGold} />
        <Text style={[styles.headerTitle, { color: colors.textPrimary }]}>GreenPoints & Wallet</Text>
      </View>

      <ScrollView
        contentContainerStyle={styles.content}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />}
      >
        {/* Balance Card */}
        <BioCard variant="elevated" padding={20} style={[styles.balanceCard, { backgroundColor: colors.primarySubtle }]}>
          <Text style={[styles.balanceLabel, { color: colors.primaryDark }]}>TOTAL GREENPOINTS</Text>
          <Text style={[styles.balanceVal, { color: colors.primaryDark }]}>
            {loading ? '...' : `${summary.total_gp.toLocaleString()} GP`}
          </Text>

          <View style={styles.splitRow}>
            <View style={[styles.splitBox, { backgroundColor: colors.surface, borderRadius: radii.lg }]}>
              <Ionicons name="leaf" size={16} color={colors.primary} />
              <Text style={[styles.splitText, { color: colors.textPrimary }]}>
                {loading ? '...' : `${summary.wild_xp} Wild XP`}
              </Text>
            </View>

            <View style={[styles.splitBox, { backgroundColor: colors.surface, borderRadius: radii.lg }]}>
              <Ionicons name="cash" size={16} color={colors.accentBlue} />
              <Text style={[styles.splitText, { color: colors.textPrimary }]}>
                {loading ? '...' : `₹${summary.circular_payout} Circular Cash`}
              </Text>
            </View>
          </View>
        </BioCard>

        {/* Unified Ledger Activity */}
        <View style={styles.sectionHeaderRow}>
          <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>Unified Ledger Activity</Text>
          <Text style={[styles.sectionSub, { color: colors.primary }]}>Live Sync</Text>
        </View>

        {loading ? (
          <ActivityIndicator size="large" color={colors.primary} style={{ marginTop: 20 }} />
        ) : summary.entries.length === 0 ? (
          <EmptyState
            icon="receipt-outline"
            title="No Transactions Yet"
            description="Log species sightings in Wild or recycled items in Circular to earn GreenPoints!"
          />
        ) : (
          <View style={styles.ledgerList}>
            {summary.entries.map((item, index) => {
              const isWild = item.source === 'wild_xp';
              return (
                <BioCard key={item.id || index.toString()} variant="outlined" padding={12} style={styles.ledgerItem}>
                  <View
                    style={[
                      styles.ledgerIcon,
                      { backgroundColor: isWild ? colors.primarySubtle : colors.accentBlueSubtle },
                    ]}
                  >
                    <Ionicons
                      name={isWild ? 'leaf' : 'sync-circle'}
                      size={20}
                      color={isWild ? colors.primary : colors.accentBlue}
                    />
                  </View>
                  <View style={styles.ledgerInfo}>
                    <Text style={[styles.ledgerTitle, { color: colors.textPrimary }]}>
                      {isWild ? 'Species Observation Reward' : 'Waste Recycled Reward'}
                    </Text>
                    <Text style={[styles.ledgerSub, { color: colors.textSecondary }]}>
                      {item.created_at ? new Date(item.created_at).toLocaleDateString() : 'Recent'}
                    </Text>
                  </View>
                  <Text style={[styles.ledgerAmount, { color: colors.primaryDark }]}>+{item.amount} GP</Text>
                </BioCard>
              );
            })}
          </View>
        )}
      </ScrollView>
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
  balanceCard: {
    gap: 6,
  },
  balanceLabel: {
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  balanceVal: {
    fontSize: 34,
    fontWeight: '800',
  },
  splitRow: {
    flexDirection: 'row',
    marginTop: 10,
    gap: 10,
  },
  splitBox: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    gap: 6,
  },
  splitText: {
    fontSize: 13,
    fontWeight: '700',
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
  sectionSub: {
    fontSize: 12,
    fontWeight: '600',
  },
  ledgerList: {
    gap: 10,
  },
  ledgerItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  ledgerIcon: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  ledgerInfo: {
    flex: 1,
  },
  ledgerTitle: {
    fontSize: 14,
    fontWeight: '700',
  },
  ledgerSub: {
    fontSize: 12,
    marginTop: 2,
  },
  ledgerAmount: {
    fontSize: 14,
    fontWeight: '800',
  },
});
