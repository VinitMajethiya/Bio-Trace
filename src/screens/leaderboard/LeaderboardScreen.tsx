import React, { useEffect, useState } from 'react';
import { StyleSheet, Text, View, ScrollView, TouchableOpacity, ActivityIndicator } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../providers/ThemeProvider';
import { useAuth } from '../../context/AuthContext';
import { fetchUserLedgerBalance } from '../../lib/ledger';
import { BioCard } from '../../components/common/BioCard';

export interface LeaderboardUser {
  id: string;
  name: string;
  gp: number;
  wildXP: number;
  circularGP: number;
  avatar: string;
  isCurrentUser?: boolean;
}

// DEMO_SEED_USERS: Synthetic competitor records for single-tester demo
const DEMO_SEED_USERS: LeaderboardUser[] = [
  { id: 'seed-1', name: 'EcoRanger_42', gp: 240, wildXP: 140, circularGP: 100, avatar: '🌿' },
  { id: 'seed-2', name: 'GreenScout99', gp: 180, wildXP: 90, circularGP: 90, avatar: '⚡' },
  { id: 'seed-3', name: 'TerritoryDefender7', gp: 130, wildXP: 80, circularGP: 50, avatar: '🦊' },
  { id: 'seed-4', name: 'BioPioneer_X', gp: 95, wildXP: 55, circularGP: 40, avatar: '🌸' },
];

export const LeaderboardScreen: React.FC = () => {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<any>();
  const { colors, radii } = useTheme();
  const { user } = useAuth();
  const [rankings, setRankings] = useState<LeaderboardUser[]>([]);
  const [loading, setLoading] = useState(true);

  const loadLeaderboard = async () => {
    setLoading(true);
    let userGP = 0;
    let userWild = 0;
    let userCirc = 0;

    if (user?.id) {
      const summary = await fetchUserLedgerBalance(user.id);
      userGP = summary.total_gp;
      userWild = summary.wild_xp;
      userCirc = summary.circular_payout;
    }

    const userName = user?.user_metadata?.display_name || user?.email?.split('@')[0] || 'You (Explorer)';

    const currentUserEntry: LeaderboardUser = {
      id: user?.id || 'current-user',
      name: userName,
      gp: userGP,
      wildXP: userWild,
      circularGP: userCirc,
      avatar: '👑',
      isCurrentUser: true,
    };

    const combined = [...DEMO_SEED_USERS, currentUserEntry].sort((a, b) => b.gp - a.gp);
    setRankings(combined);
    setLoading(false);
  };

  useFocusEffect(
    React.useCallback(() => {
      loadLeaderboard();
    }, [user?.id])
  );

  useEffect(() => {
    loadLeaderboard();
  }, [user?.id]);

  const userRankIndex = rankings.findIndex(r => r.isCurrentUser);
  const userRank = userRankIndex !== -1 ? userRankIndex + 1 : '-';

  return (
    <View style={[styles.container, { backgroundColor: colors.background, paddingTop: Math.max(insets.top, 12) }]}>
      {/* Header Bar */}
      <View style={[styles.header, { borderBottomColor: colors.surfaceBorder }]}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn} activeOpacity={0.7}>
          <Ionicons name="arrow-back" size={24} color={colors.textPrimary} />
        </TouchableOpacity>
        <Ionicons name="trophy" size={22} color="#F59E0B" />
        <Text style={[styles.headerTitle, { color: colors.textPrimary }]}>Campus Leaderboard</Text>
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        {/* Your Rank Banner */}
        <BioCard variant="elevated" padding={16} style={[styles.userRankBanner, { backgroundColor: colors.primarySubtle }]}>
          <View style={styles.userRankHeader}>
            <View style={[styles.rankBadgeCircle, { backgroundColor: colors.primary }]}>
              <Text style={styles.rankBadgeText}>#{userRank}</Text>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={[styles.userRankTitle, { color: colors.primaryDark }]}>Your Campus Standing</Text>
              <Text style={[styles.userRankSub, { color: colors.textSecondary }]}>
                Ranked by combined GreenPoints from Wild & Circular actions
              </Text>
            </View>
          </View>
        </BioCard>

        {loading ? (
          <ActivityIndicator size="large" color={colors.primary} style={{ marginTop: 24 }} />
        ) : (
          <View style={styles.listContainer}>
            <Text style={[styles.sectionHeading, { color: colors.textPrimary }]}>Top Eco Champions</Text>

            {rankings.map((item, index) => {
              const rank = index + 1;
              const isTop3 = rank <= 3;
              const crownEmoji = rank === 1 ? '🥇' : rank === 2 ? '🥈' : rank === 3 ? '🥉' : `#${rank}`;

              return (
                <BioCard
                  key={item.id}
                  variant={item.isCurrentUser ? 'elevated' : 'outlined'}
                  padding={14}
                  style={[
                    styles.rankRow,
                    item.isCurrentUser && {
                      borderColor: colors.primary,
                      borderWidth: 2,
                      backgroundColor: colors.surface,
                    },
                  ]}
                >
                  <View style={styles.rankNumCol}>
                    <Text style={styles.crownText}>{crownEmoji}</Text>
                  </View>

                  <View style={[styles.avatarBg, { backgroundColor: item.isCurrentUser ? colors.primarySubtle : colors.surfaceSecondary }]}>
                    <Text style={{ fontSize: 18 }}>{item.avatar}</Text>
                  </View>

                  <View style={{ flex: 1 }}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                      <Text style={[styles.userName, { color: colors.textPrimary }]}>{item.name}</Text>
                      {item.isCurrentUser && (
                        <View style={[styles.youBadge, { backgroundColor: colors.primary }]}>
                          <Text style={styles.youBadgeText}>YOU</Text>
                        </View>
                      )}
                    </View>
                    <Text style={[styles.userSub, { color: colors.textSecondary }]}>
                      🌿 {item.wildXP} XP • ♻️ {item.circularGP} GP
                    </Text>
                  </View>

                  <View style={{ alignItems: 'flex-end' }}>
                    <Text style={[styles.scoreVal, { color: colors.primary }]}>{item.gp} GP</Text>
                  </View>
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
  userRankBanner: {
    borderColor: 'rgba(5, 150, 105, 0.3)',
  },
  userRankHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  rankBadgeCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rankBadgeText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '800',
  },
  userRankTitle: {
    fontSize: 16,
    fontWeight: '800',
  },
  userRankSub: {
    fontSize: 12,
    marginTop: 2,
  },
  listContainer: {
    gap: 10,
  },
  sectionHeading: {
    fontSize: 15,
    fontWeight: '700',
    marginBottom: 4,
  },
  rankRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  rankNumCol: {
    width: 32,
    alignItems: 'center',
  },
  crownText: {
    fontSize: 18,
    fontWeight: '800',
  },
  avatarBg: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: 'center',
    justifyContent: 'center',
  },
  userName: {
    fontSize: 15,
    fontWeight: '700',
  },
  userSub: {
    fontSize: 12,
    marginTop: 2,
  },
  youBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  youBadgeText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '800',
  },
  scoreVal: {
    fontSize: 16,
    fontWeight: '800',
  },
});
