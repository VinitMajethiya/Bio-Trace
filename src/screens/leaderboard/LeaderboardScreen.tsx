import React, { useEffect, useState } from 'react';
import { StyleSheet, Text, View, ScrollView, TouchableOpacity, ActivityIndicator } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../providers/ThemeProvider';
import { useAuth } from '../../context/AuthContext';
import { fetchUserLedgerBalance } from '../../lib/ledger';
import { WarmCard } from '../../components/common/BioCard';
import { FilterPill } from '../../components/common/FilterChip';
import { IconButton } from '../../components/common/IconButton';

export interface LeaderboardUser {
  id: string;
  name: string;
  gp: number;
  wildXP: number;
  circularGP: number;
  avatar: string;
  isCurrentUser?: boolean;
}

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
  const [activeTab, setActiveTab] = useState<'individual' | 'society'>('individual');

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

  const top1 = rankings[0];
  const top2 = rankings[1];
  const top3 = rankings[2];
  const restRankings = rankings.slice(3);

  return (
    <View style={[styles.container, { backgroundColor: colors.canvas_airy || '#f4fbf3', paddingTop: Math.max(insets.top, 16) }]}>
      {/* Header Bar */}
      <View style={styles.headerBar}>
        <IconButton icon="arrow-back" onPress={() => navigation.goBack()} />
        <Text style={[styles.headingTitle, { color: colors.text_airy_primary || '#161d18' }]}>
          Campus Leaderboard
        </Text>
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {/* Mode Switcher FilterPills */}
        <View style={styles.tabRow}>
          <FilterPill
            label="Individual Explorers"
            icon="person-outline"
            active={activeTab === 'individual'}
            onPress={() => setActiveTab('individual')}
            canvas="warm"
          />
          <FilterPill
            label="Eco Societies"
            icon="people-outline"
            active={activeTab === 'society'}
            onPress={() => setActiveTab('society')}
            canvas="warm"
          />
        </View>

        {loading ? (
          <ActivityIndicator size="large" color={colors.green_vivid} style={{ marginTop: 40 }} />
        ) : (
          <>
            {/* Rank 1-3 Podium Display (2 - 1 - 3 hierarchy) */}
            <View style={styles.podiumContainer}>
              {/* Rank 2 (Left, Silver) */}
              {top2 && (
                <View style={[styles.podiumCol, styles.podium2]}>
                  <WarmCard padding={14} style={[styles.podiumCard, { borderColor: colors.podiumSilver || '#94A3B8', borderWidth: 1.5 }]}>
                    <Text style={styles.podiumEmoji}>🥈</Text>
                    <Text style={[styles.podiumName, { color: colors.text_on_warm_primary || '#142217' }]} numberOfLines={1}>{top2.name}</Text>
                    <Text style={[styles.podiumScore, { color: colors.podiumSilver || '#94A3B8' }]}>{top2.gp} GP</Text>
                  </WarmCard>
                </View>
              )}

              {/* Rank 1 (Center, Gold, Taller) */}
              {top1 && (
                <View style={[styles.podiumCol, styles.podium1]}>
                  <WarmCard padding={16} style={[styles.podiumCard, { borderColor: colors.podiumGold || '#E8A920', borderWidth: 2 }]}>
                    <Text style={styles.crownEmoji}>👑</Text>
                    <Text style={styles.podiumEmoji}>🥇</Text>
                    <Text style={[styles.podiumNameGold, { color: colors.text_on_warm_primary || '#142217' }]} numberOfLines={1}>{top1.name}</Text>
                    <Text style={[styles.podiumScoreGold, { color: colors.podiumGold || '#E8A920' }]}>{top1.gp} GP</Text>
                  </WarmCard>
                </View>
              )}

              {/* Rank 3 (Right, Bronze) */}
              {top3 && (
                <View style={[styles.podiumCol, styles.podium3]}>
                  <WarmCard padding={14} style={[styles.podiumCard, { borderColor: colors.podiumBronze || '#D97706', borderWidth: 1.5 }]}>
                    <Text style={styles.podiumEmoji}>🥉</Text>
                    <Text style={[styles.podiumName, { color: colors.text_on_warm_primary || '#142217' }]} numberOfLines={1}>{top3.name}</Text>
                    <Text style={[styles.podiumScore, { color: colors.podiumBronze || '#D97706' }]}>{top3.gp} GP</Text>
                  </WarmCard>
                </View>
              )}
            </View>

            {/* Rest of Rankings List (Ranks 4+) */}
            <Text style={[styles.subHeading, { color: colors.text_on_warm_primary || '#142217' }]}>
              Community Standings
            </Text>

            <View style={styles.rankList}>
              {restRankings.map((item, index) => {
                const rankNum = index + 4;

                return (
                  <WarmCard
                    key={item.id}
                    padding={16}
                    style={[
                      styles.rankRow,
                      item.isCurrentUser && { borderColor: colors.green_vivid, borderWidth: 2 },
                    ]}
                  >
                    <Text style={[styles.rankNumberText, { color: colors.text_on_warm_secondary || '#3E6B48' }]}>{rankNum}</Text>
                    <View style={[styles.avatarCircle, { backgroundColor: colors.amber_subtle || 'rgba(232, 169, 32, 0.15)' }]}>
                      <Text style={{ fontSize: 20 }}>{item.avatar}</Text>
                    </View>

                    <View style={{ flex: 1 }}>
                      <Text style={[styles.rowName, { color: colors.text_on_warm_primary || '#142217' }]}>{item.name}</Text>
                      <Text style={[styles.rowSub, { color: colors.text_on_warm_secondary || '#7A9882' }]}>🌿 {item.wildXP} XP • ♻️ {item.circularGP} GP</Text>
                    </View>

                    <Text style={[styles.rowGp, { color: colors.amber || '#E8A920' }]}>
                      {item.gp} GP
                    </Text>
                  </WarmCard>
                );
              })}
            </View>
          </>
        )}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  headerBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 24,
    gap: 12,
    marginBottom: 8,
  },
  backBtn: {
    padding: 4,
  },
  headingTitle: {
    fontSize: 26,
    lineHeight: 32,
    fontWeight: '700',
    letterSpacing: -0.4,
  },
  content: {
    padding: 24,
    gap: 18,
    paddingBottom: 40,
  },
  tabRow: {
    flexDirection: 'row',
    gap: 8,
  },
  podiumContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'center',
    gap: 10,
    marginVertical: 10,
    height: 180,
  },
  podiumCol: {
    flex: 1,
  },
  podium1: {
    height: 180,
  },
  podium2: {
    height: 150,
  },
  podium3: {
    height: 135,
  },
  podiumCard: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
  },
  goldCard: {
    borderColor: '#E8A920',
    borderWidth: 2,
  },
  silverCard: {
    borderColor: '#94A3B8',
    borderWidth: 1.5,
  },
  bronzeCard: {
    borderColor: '#D97706',
    borderWidth: 1.5,
  },
  crownEmoji: {
    fontSize: 22,
    position: 'absolute',
    top: -12,
  },
  podiumEmoji: {
    fontSize: 28,
  },
  podiumName: {
    fontSize: 13,
    fontWeight: '700',
    color: '#142217',
  },
  podiumScore: {
    fontSize: 12,
    fontWeight: '700',
    color: '#3E6B48',
  },
  podiumNameGold: {
    fontSize: 14,
    fontWeight: '700',
    color: '#142217',
    marginTop: 8,
  },
  podiumScoreGold: {
    fontSize: 14,
    fontWeight: '700',
    color: '#E8A920',
  },
  subHeading: {
    fontSize: 20,
    fontWeight: '700',
    letterSpacing: -0.3,
  },
  rankList: {
    gap: 10,
  },
  rankRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  rankNumberText: {
    fontSize: 28,
    lineHeight: 32,
    fontWeight: '700',
    color: '#3E6B48',
    width: 32,
  },
  avatarCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#FFFDF9',
    alignItems: 'center',
    justifyContent: 'center',
  },
  rowName: {
    fontSize: 15,
    fontWeight: '700',
    color: '#142217',
  },
  rowSub: {
    fontSize: 11,
    color: '#7A9882',
    marginTop: 2,
  },
  rowGp: {
    fontSize: 16,
    fontWeight: '700',
  },
});
