import React, { useEffect, useState } from 'react';
import { StyleSheet, Text, View, ScrollView, ActivityIndicator, RefreshControl } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../context/AuthContext';
import { fetchUserLedgerBalance, UserLedgerSummary } from '../../lib/ledger';

export const WalletScreen: React.FC = () => {
  const insets = useSafeAreaInsets();
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
    <View style={[styles.container, { paddingTop: Math.max(insets.top, 16) }]}>
      <View style={styles.header}>
        <Ionicons name="wallet" size={24} color="#F59E0B" />
        <Text style={styles.headerTitle}>GreenPoints & Wallet</Text>
      </View>

      <ScrollView
        contentContainerStyle={styles.content}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#10B981" />
        }
      >
        <View style={styles.balanceCard}>
          <Text style={styles.balanceLabel}>TOTAL GREENPOINTS</Text>
          <Text style={styles.balanceVal}>
            {loading ? '...' : `${summary.total_gp.toLocaleString()} GP`}
          </Text>

          <View style={styles.splitRow}>
            <View style={styles.splitBox}>
              <Ionicons name="leaf" size={16} color="#34D399" />
              <Text style={styles.splitText}>
                {loading ? '...' : `${summary.wild_xp} Wild XP`}
              </Text>
            </View>
            <View style={styles.splitBox}>
              <Ionicons name="cash" size={16} color="#60A5FA" />
              <Text style={styles.splitText}>
                {loading ? '...' : `${summary.circular_payout} Circular Cash`}
              </Text>
            </View>
          </View>
        </View>

        <View style={styles.sectionHeaderRow}>
          <Text style={styles.sectionTitle}>Unified Ledger Activity</Text>
          <Text style={styles.sectionSub}>Live from Supabase</Text>
        </View>

        {loading ? (
          <ActivityIndicator size="large" color="#10B981" style={{ marginTop: 20 }} />
        ) : summary.entries.length === 0 ? (
          <View style={styles.emptyState}>
            <Ionicons name="receipt-outline" size={42} color="#374151" />
            <Text style={styles.emptyStateTitle}>No Transactions Yet</Text>
            <Text style={styles.emptyStateSub}>
              Log species sightings in Wild or recycled items in Circular to earn GreenPoints!
            </Text>
          </View>
        ) : (
          <View style={styles.ledgerList}>
            {summary.entries.map((item, index) => {
              const isWild = item.source === 'wild_xp';
              return (
                <View key={item.id || index.toString()} style={styles.ledgerItem}>
                  <View
                    style={[
                      styles.ledgerIcon,
                      {
                        backgroundColor: isWild
                          ? 'rgba(52, 211, 153, 0.15)'
                          : 'rgba(96, 165, 250, 0.15)',
                      },
                    ]}
                  >
                    <Ionicons
                      name={isWild ? 'leaf' : 'sync-circle'}
                      size={20}
                      color={isWild ? '#34D399' : '#60A5FA'}
                    />
                  </View>
                  <View style={styles.ledgerInfo}>
                    <Text style={styles.ledgerTitle}>
                      {isWild ? 'Species Observation Reward' : 'Waste Recycled Reward'}
                    </Text>
                    <Text style={styles.ledgerSub}>
                      {item.created_at
                        ? new Date(item.created_at).toLocaleDateString()
                        : 'Recent Transaction'}
                    </Text>
                  </View>
                  <Text style={styles.ledgerAmount}>+{item.amount} GP</Text>
                </View>
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
    padding: 20,
    gap: 18,
  },
  balanceCard: {
    backgroundColor: '#271B07',
    borderRadius: 20,
    padding: 24,
    borderWidth: 1,
    borderColor: '#45300B',
  },
  balanceLabel: {
    color: '#FBBF24',
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 1,
  },
  balanceVal: {
    fontSize: 34,
    fontWeight: '800',
    color: '#FEF3C7',
    marginTop: 6,
  },
  splitRow: {
    flexDirection: 'row',
    marginTop: 18,
    gap: 12,
  },
  splitBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
    gap: 6,
  },
  splitText: {
    color: '#FDE68A',
    fontSize: 13,
    fontWeight: '600',
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'baseline',
    marginTop: 8,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#E5E7EB',
  },
  sectionSub: {
    fontSize: 12,
    color: '#10B981',
    fontWeight: '600',
  },
  ledgerList: {
    gap: 10,
  },
  ledgerItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#0F241C',
    padding: 14,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#19392B',
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
    color: '#F3F4F6',
    fontSize: 14,
    fontWeight: '600',
  },
  ledgerSub: {
    color: '#9CA3AF',
    fontSize: 12,
    marginTop: 2,
  },
  ledgerAmount: {
    color: '#34D399',
    fontSize: 14,
    fontWeight: '700',
  },
  emptyState: {
    backgroundColor: '#0F241C',
    borderRadius: 16,
    padding: 32,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#19392B',
  },
  emptyStateTitle: {
    color: '#D1D5DB',
    fontSize: 16,
    fontWeight: '700',
    marginTop: 12,
  },
  emptyStateSub: {
    color: '#9CA3AF',
    fontSize: 13,
    textAlign: 'center',
    marginTop: 4,
    lineHeight: 18,
  },
});
