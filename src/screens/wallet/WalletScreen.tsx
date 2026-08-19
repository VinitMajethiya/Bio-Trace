import React, { useEffect, useState } from 'react';
import { StyleSheet, Text, View, ScrollView, ActivityIndicator, RefreshControl, TouchableOpacity, Alert } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../providers/ThemeProvider';
import { useAuth } from '../../context/AuthContext';
import { WarmCard } from '../../components/common/BioCard';
import { EmptyState } from '../../components/common/EmptyState';
import { FilterPill } from '../../components/common/FilterChip';
import { GreenPointsChip } from '../../components/common/GreenPointsChip';
import { PrimaryButton } from '../../components/common/PrimaryButton';
import { IconButton } from '../../components/common/IconButton';
import { fetchUserLedgerBalance, UserLedgerSummary } from '../../lib/ledger';

export const WalletScreen: React.FC = () => {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<any>();
  const { colors } = useTheme();
  const { user } = useAuth();

  const [summary, setSummary] = useState<UserLedgerSummary>({
    total_gp: 0,
    wild_xp: 0,
    circular_payout: 0,
    raid_bonus: 0,
    entries: [],
  });
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [activeFilter, setActiveFilter] = useState<string>('All');

  const loadLedger = async () => {
    if (!user) return;
    setLoading(true);
    const data = await fetchUserLedgerBalance(user.id);
    setSummary(data);
    setLoading(false);
    setRefreshing(false);
  };

  useFocusEffect(
    React.useCallback(() => {
      loadLedger();
    }, [user?.id])
  );

  useEffect(() => {
    loadLedger();
  }, [user?.id]);

  const onRefresh = () => {
    setRefreshing(true);
    loadLedger();
  };

  const handleRequestPayout = () => {
    Alert.alert(
      'GreenPoints Payout Request',
      `Your current balance is ${summary.total_gp} GP.\nPayout requests are processed automatically during weekly campus collection drops.`,
      [{ text: 'Got it' }]
    );
  };

  const filteredEntries = summary.entries.filter((entry) => {
    if (activeFilter === 'All') return true;
    if (activeFilter === 'Wild' && entry.source === 'wild_xp') return true;
    if (activeFilter === 'Circular' && entry.source === 'circular_payout') return true;
    if (activeFilter === 'Abhiyans' && entry.source === 'raid_bonus') return true;
    return true;
  });

  return (
    <View style={[styles.container, { backgroundColor: colors.canvas_airy || '#f4fbf3', paddingTop: Math.max(insets.top, 16) }]}>
      {/* Top Header */}
      <View style={styles.topHeader}>
        <IconButton icon="arrow-back" onPress={() => navigation.goBack()} />
        <Text style={[styles.displayTitle, { color: colors.text_airy_primary || '#161d18' }]}>
          Wallet
        </Text>
      </View>

      <ScrollView
        contentContainerStyle={styles.content}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.green_vivid} />}
        showsVerticalScrollIndicator={false}
      >
        {/* Large Balance Display WarmCard */}
        <WarmCard variant="hero" padding={24} style={styles.balanceCard}>
          <Text style={[styles.balanceLabel, { color: colors.text_airy_secondary || '#3d4a40' }]}>
            TOTAL GREENPOINTS BALANCE
          </Text>
          <Text style={[styles.dataLargeVal, { color: colors.coral || '#FF9967' }]}>
            {loading ? '...' : summary.total_gp.toLocaleString()}
          </Text>
          <Text style={[styles.balanceSub, { color: colors.text_on_warm_muted || '#7A9882' }]}>
            Combined earnings from Wild observations, Circular recycling, and Bio Abhiyans.
          </Text>

          <PrimaryButton
            title="Request GreenPoints Payout"
            icon="card-outline"
            onPress={handleRequestPayout}
            style={{ width: '100%', marginTop: 8 }}
          />
        </WarmCard>

        {/* Filter Pills */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterBar}>
          {['All', 'Wild', 'Circular', 'Abhiyans'].map((tab) => (
            <FilterPill
              key={tab}
              label={tab}
              active={activeFilter === tab}
              onPress={() => setActiveFilter(tab)}
              canvas="warm"
            />
          ))}
        </ScrollView>

        {/* Ledger Activity List */}
        <Text style={[styles.subHeading, { color: colors.text_on_warm_secondary || '#3E6B48' }]}>
          UNIFIED LEDGER TRANSACTIONS
        </Text>

        {loading ? (
          <ActivityIndicator size="large" color={colors.green_vivid} style={{ marginTop: 40 }} />
        ) : filteredEntries.length === 0 ? (
          <EmptyState
            icon="receipt-outline"
            title="No Transactions Yet"
            description="Log species sightings or recycling transactions to earn GreenPoints!"
            canvas="warm"
          />
        ) : (
          <View style={styles.ledgerList}>
            {filteredEntries.map((item, index) => {
              const isWild = item.source === 'wild_xp';
              const isCirc = item.source === 'circular_payout';

              return (
                <WarmCard key={item.id || index.toString()} padding={16} style={styles.ledgerRow}>
                  <View style={[styles.iconBg, { backgroundColor: colors.amber_subtle || 'rgba(232, 169, 32, 0.15)' }]}>
                    <Ionicons
                      name={isWild ? 'leaf' : isCirc ? 'sync-circle' : 'shield-checkmark'}
                      size={22}
                      color={colors.amber || '#E8A920'}
                    />
                  </View>

                  <View style={{ flex: 1 }}>
                    <Text style={[styles.rowTitle, { color: colors.text_on_warm_primary || '#142217' }]}>
                      {isWild ? 'Wild Species Sighting' : isCirc ? 'The Locker Recycled' : 'Bio Abhiyan Bonus'}
                    </Text>
                    <Text style={[styles.rowDate, { color: colors.text_on_warm_secondary || '#3E6B48' }]}>
                      {item.created_at ? new Date(item.created_at).toLocaleDateString() : 'Recent'}
                    </Text>
                  </View>

                  <GreenPointsChip points={item.amount} label="GP" />
                </WarmCard>
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
  subHeading: {
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 0.8,
    marginTop: 6,
  },
  ledgerList: {
    gap: 10,
  },
  ledgerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  iconBg: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rowTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#142217',
  },
  rowDate: {
    fontSize: 12,
    color: '#3E6B48',
    marginTop: 2,
  },
});
