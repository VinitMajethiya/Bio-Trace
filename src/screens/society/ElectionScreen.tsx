import React, { useEffect, useState } from 'react';
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../providers/ThemeProvider';
import { useAuth } from '../../context/AuthContext';
import { DarkCard } from '../../components/common/BioCard';
import { PrimaryButton } from '../../components/common/PrimaryButton';
import { SecondaryButton } from '../../components/common/SecondaryButton';
import { GreenPointsChip } from '../../components/common/GreenPointsChip';
import { IconButton } from '../../components/common/IconButton';
import {
  getUserSocietyInfo,
  fetchSocietyById,
  fetchElectionCandidates,
  nominateSelfForModerator,
  castModeratorVote,
  closeElectionAndElectModerator,
  ElectionCandidate,
  UserSocietyInfo,
  Society,
} from '../../lib/society';

export const ElectionScreen: React.FC = () => {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<any>();
  const { colors } = useTheme();
  const { user } = useAuth();

  const [userInfo, setUserInfo] = useState<UserSocietyInfo>({
    society_id: null,
    moderator_of_society_id: null,
  });
  const [society, setSociety] = useState<Society | null>(null);
  const [candidates, setCandidates] = useState<ElectionCandidate[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [nominating, setNominating] = useState<boolean>(false);
  const [votingForId, setVotingForId] = useState<string | null>(null);
  const [closing, setClosing] = useState<boolean>(false);

  const loadElectionData = async () => {
    if (!user) return;
    setLoading(true);
    const info = await getUserSocietyInfo(user.id);
    setUserInfo(info);

    if (info.society_id) {
      const [soc, candList] = await Promise.all([
        fetchSocietyById(info.society_id),
        fetchElectionCandidates(info.society_id, user.id),
      ]);
      setSociety(soc);
      setCandidates(candList);
    }
    setLoading(false);
  };

  useFocusEffect(
    React.useCallback(() => {
      loadElectionData();
    }, [user?.id])
  );

  useEffect(() => {
    loadElectionData();
  }, [user?.id]);

  const handleNominateSelf = async () => {
    if (!user || !userInfo.society_id) return;
    const displayName = user.user_metadata?.display_name || user.email?.split('@')[0] || 'Eco Candidate';
    setNominating(true);
    const res = await nominateSelfForModerator(user.id, userInfo.society_id, displayName);
    setNominating(false);

    if (res.success) {
      Alert.alert('🎉 Nominated!', 'You are registered as a candidate for your society!');
      loadElectionData();
    } else {
      Alert.alert('Nomination Error', res.error || 'Failed to register candidate.');
    }
  };

  const handleCastVote = async (candidate: ElectionCandidate) => {
    if (!user || !userInfo.society_id) return;

    setVotingForId(candidate.user_id);
    const res = await castModeratorVote(user.id, candidate.user_id, userInfo.society_id);
    setVotingForId(null);

    if (res.success) {
      Alert.alert('Vote Registered!', `You voted for ${candidate.display_name}.`);
      loadElectionData();
    } else {
      Alert.alert('Voting Error', res.error || 'Failed to register vote.');
    }
  };

  const handleCloseElection = async () => {
    if (!user || !userInfo.society_id) return;
    const totalVotesCast = candidates.reduce((acc, c) => acc + c.vote_count, 0);
    if (totalVotesCast === 0) {
      Alert.alert('Election Open', 'Zero votes cast so far.');
      return;
    }

    setClosing(true);
    const res = await closeElectionAndElectModerator(user.id, userInfo.society_id, userInfo.society_id);
    setClosing(false);

    if (res.success && res.winnerName) {
      Alert.alert('🏆 Election Closed!', `Winner: ${res.winnerName}`);
      loadElectionData();
    } else {
      Alert.alert('Action Blocked', res.error || 'Failed to close election.');
    }
  };

  const isUserNominated = candidates.some((c) => c.user_id === user?.id);
  const totalVotes = candidates.reduce((acc, c) => acc + c.vote_count, 0);

  return (
    <View style={[styles.container, { backgroundColor: colors.canvas_airy || '#f4fbf3', paddingTop: Math.max(insets.top, 16) }]}>
      {/* Top Header */}
      <View style={styles.topHeader}>
        <IconButton icon="arrow-back" onPress={() => navigation.goBack()} />
        <Text style={[styles.headingTitle, { color: colors.text_airy_primary || '#161d18' }]}>
          Society Bio Veer Elections
        </Text>
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <Text style={[styles.headingSub, { color: colors.text_airy_secondary || '#3d4a40' }]}>
          Vote for your society Bio Veer to manage Bio Abhiyans & review queues.
        </Text>

        {!userInfo.society_id ? (
          <DarkCard padding={20} style={styles.emptyCard}>
            <Text style={styles.emptyTitle}>No Active Society</Text>
            <Text style={styles.emptySub}>Join a society first to participate in elections.</Text>
            <PrimaryButton
              title="Select / Join Society"
              icon="people-outline"
              onPress={() => navigation.navigate('SocietyPicker')}
              style={{ marginTop: 8 }}
            />
          </DarkCard>
        ) : loading ? (
          <ActivityIndicator size="large" color={colors.green_vivid} style={{ marginTop: 40 }} />
        ) : (
          <View style={styles.candStack}>
            {!isUserNominated && (
              <PrimaryButton
                title="Nominate Myself as Bio Veer"
                icon="hand-right-outline"
                onPress={handleNominateSelf}
                loading={nominating}
              />
            )}

            <Text style={[styles.subHeading, { color: colors.text_on_dark_secondary || '#8DB89A' }]}>
              REGISTERED CANDIDATES ({totalVotes} VOTES CAST)
            </Text>

            {candidates.map((cand) => {
              const isVoting = votingForId === cand.user_id;

              return (
                <DarkCard key={cand.id} padding={20} style={styles.candCard}>
                  <View style={styles.candHeader}>
                    <View style={[styles.candIconBg, { backgroundColor: colors.amber_subtle || 'rgba(232, 169, 32, 0.15)' }]}>
                      <Text style={{ fontSize: 22 }}>👑</Text>
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={[styles.candName, { color: colors.text_on_warm_primary || '#142217' }]}>{cand.display_name}</Text>
                      <Text style={[styles.candPitch, { color: colors.text_on_warm_secondary || '#3E6B48' }]}>
                        "Dedicated to restoring native species and organizing weekly campus Bio Abhiyans."
                      </Text>
                    </View>
                    <GreenPointsChip points={cand.vote_count} label="Votes" />
                  </View>

                  <PrimaryButton
                    title={cand.has_voted_for ? 'Voted ✓' : 'Cast Vote'}
                    icon="checkmark-circle-outline"
                    onPress={() => handleCastVote(cand)}
                    loading={isVoting}
                    disabled={cand.has_voted_for}
                    style={{ marginTop: 8 }}
                  />
                </DarkCard>
              );
            })}

            <SecondaryButton
              title="Close Election & Elect Winner"
              icon="checkmark-done"
              onPress={handleCloseElection}
              loading={closing}
              disabled={totalVotes === 0}
              style={{ marginTop: 12 }}
            />
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
  headingTitle: {
    fontSize: 22,
    fontWeight: '700',
    letterSpacing: -0.4,
  },
  content: {
    padding: 24,
    gap: 16,
    paddingBottom: 40,
  },
  headingSub: {
    fontSize: 14,
    lineHeight: 20,
  },
  emptyCard: {
    alignItems: 'center',
    gap: 8,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#142217',
  },
  emptySub: {
    fontSize: 13,
    color: '#3E6B48',
    textAlign: 'center',
  },
  candStack: {
    gap: 14,
  },
  subHeading: {
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 0.8,
    marginTop: 6,
  },
  candCard: {
    gap: 12,
  },
  candHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
  },
  candIconBg: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  candName: {
    fontSize: 18,
    fontWeight: '700',
    color: '#142217',
  },
  candPitch: {
    fontSize: 12,
    color: '#3E6B48',
    fontStyle: 'italic',
    marginTop: 2,
  },
});
