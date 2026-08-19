import React, { useEffect, useState } from 'react';
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  TouchableOpacity,
  Image,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../providers/ThemeProvider';
import { useAuth } from '../../context/AuthContext';
import { DarkCard } from '../../components/common/BioCard';
import { PrimaryButton } from '../../components/common/PrimaryButton';
import { SecondaryButton } from '../../components/common/SecondaryButton';
import { IconButton } from '../../components/common/IconButton';
import { getUserSocietyInfo, UserSocietyInfo } from '../../lib/society';
import {
  PendingRaidSubmission,
  fetchPendingModeratorSubmissions,
  reviewRaidParticipantSubmission,
} from '../../lib/raids';

export const ModeratorReviewScreen: React.FC = () => {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<any>();
  const { colors, radii } = useTheme();
  const { user } = useAuth();

  const [userInfo, setUserInfo] = useState<UserSocietyInfo>({
    society_id: null,
    moderator_of_society_id: null,
  });
  const [loadingUser, setLoadingUser] = useState<boolean>(true);
  const [loadingSubmissions, setLoadingSubmissions] = useState<boolean>(true);
  const [submissions, setSubmissions] = useState<PendingRaidSubmission[]>([]);
  const [processingId, setProcessingId] = useState<string | null>(null);

  useEffect(() => {
    loadUserAndSubmissions();
  }, [user]);

  const loadUserAndSubmissions = async () => {
    if (!user) return;
    setLoadingUser(true);
    const info = await getUserSocietyInfo(user.id);
    setUserInfo(info);
    setLoadingUser(false);

    if (info.society_id && info.moderator_of_society_id === info.society_id) {
      setLoadingSubmissions(true);
      const items = await fetchPendingModeratorSubmissions(info.society_id);
      setSubmissions(items);
      setLoadingSubmissions(false);
    }
  };

  const isModeratorOfOwnSociety =
    !!userInfo.moderator_of_society_id &&
    userInfo.moderator_of_society_id === userInfo.society_id;

  const handleReviewDecision = async (
    submission: PendingRaidSubmission,
    decision: 'approved' | 'rejected'
  ) => {
    setProcessingId(submission.id);
    setSubmissions((prev) => prev.filter((s) => s.id !== submission.id));

    const res = await reviewRaidParticipantSubmission(submission.id, decision);
    setProcessingId(null);

    if (res.success) {
      Alert.alert(
        decision === 'approved' ? '🎉 Submission Approved' : 'Submission Rejected',
        `Decision saved for ${submission.user_display_name}.`
      );
    } else {
      Alert.alert('Review Error', res.error || 'Failed to save decision.');
      if (userInfo.society_id) {
        const items = await fetchPendingModeratorSubmissions(userInfo.society_id);
        setSubmissions(items);
      }
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.canvas_airy || '#f4fbf3', paddingTop: Math.max(insets.top, 16) }]}>
      {/* Top Header */}
      <View style={styles.topHeader}>
        <IconButton icon="arrow-back" onPress={() => navigation.goBack()} />
        <Text style={[styles.headingTitle, { color: colors.text_airy_primary || '#161d18' }]}>
          Bio Veer Review Queue
        </Text>
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {loadingUser || loadingSubmissions ? (
          <ActivityIndicator size="large" color={colors.green_vivid} style={{ marginTop: 40 }} />
        ) : !isModeratorOfOwnSociety ? (
          <DarkCard padding={20} style={styles.emptyCard}>
            <Ionicons name="lock-closed" size={40} color={colors.danger || '#E05C5C'} />
            <Text style={styles.emptyTitle}>Bio Veer Access Only</Text>
            <Text style={styles.emptySub}>Only elected Bio Veers can access the photo review queue.</Text>
          </DarkCard>
        ) : submissions.length === 0 ? (
          <DarkCard padding={24} style={styles.emptyCard}>
            <Ionicons name="checkmark-done-circle" size={48} color={colors.green_vivid || '#4CAF72'} />
            <Text style={styles.emptyTitle}>Review Queue Empty 🎉</Text>
            <Text style={styles.emptySub}>All Bio Abhiyan photo submissions for your society have been reviewed.</Text>
          </DarkCard>
        ) : (
          <View style={styles.queueList}>
            {submissions.map((sub) => {
              const isProcessing = processingId === sub.id;

              return (
                <DarkCard key={sub.id} padding={20} style={styles.subCard}>
                  <Text style={[styles.volunteerName, { color: colors.text_on_warm_primary || '#142217' }]}>Volunteer: {sub.user_display_name}</Text>
                  <Text style={[styles.raidName, { color: colors.text_on_warm_secondary || '#3E6B48' }]}>Event: {sub.raid_title}</Text>

                  {/* Side-by-side photos */}
                  <View style={styles.photoRow}>
                    <View style={styles.photoCol}>
                      <Text style={[styles.photoTag, { color: colors.text_on_warm_secondary || '#3E6B48' }]}>Before Cleanup</Text>
                      {sub.before_photo_url ? (
                        <Image source={{ uri: sub.before_photo_url }} style={[styles.photoImg, { borderRadius: radii.md || 16 }]} />
                      ) : (
                        <View style={[styles.placeholderImg, { borderRadius: radii.md || 16 }]}><Text style={{ color: '#7A9882', fontSize: 10 }}>No Photo</Text></View>
                      )}
                    </View>

                    <View style={styles.photoCol}>
                      <Text style={[styles.photoTag, { color: colors.text_on_warm_secondary || '#3E6B48' }]}>After Cleanup</Text>
                      {sub.after_photo_url ? (
                        <Image source={{ uri: sub.after_photo_url }} style={[styles.photoImg, { borderRadius: radii.md || 16 }]} />
                      ) : (
                        <View style={[styles.placeholderImg, { borderRadius: radii.md || 16 }]}><Text style={{ color: '#7A9882', fontSize: 10 }}>No Photo</Text></View>
                      )}
                    </View>
                  </View>

                  <View style={styles.btnRow}>
                    <PrimaryButton
                      title="Approve Sighting"
                      icon="checkmark-circle"
                      onPress={() => handleReviewDecision(sub, 'approved')}
                      loading={isProcessing}
                      style={{ flex: 1 }}
                    />
                    <SecondaryButton
                      title="Reject"
                      icon="close-circle"
                      onPress={() => handleReviewDecision(sub, 'rejected')}
                      disabled={isProcessing}
                      style={{ flex: 1, borderColor: colors.danger || '#E05C5C', backgroundColor: colors.danger_subtle || 'rgba(224, 92, 92, 0.10)' }}
                      textStyle={{ color: colors.danger || '#E05C5C' }}
                    />
                  </View>
                </DarkCard>
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
  queueList: {
    gap: 16,
  },
  subCard: {
    gap: 10,
  },
  volunteerName: {
    fontSize: 16,
    fontWeight: '700',
    color: '#142217',
  },
  raidName: {
    fontSize: 13,
    color: '#3E6B48',
  },
  photoRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 4,
  },
  photoCol: {
    flex: 1,
    gap: 4,
  },
  photoTag: {
    fontSize: 11,
    fontWeight: '700',
    color: '#3E6B48',
  },
  photoImg: {
    width: '100%',
    height: 100,
    borderRadius: 8,
  },
  placeholderImg: {
    width: '100%',
    height: 100,
    borderRadius: 8,
    backgroundColor: '#FFFDF9',
    alignItems: 'center',
    justifyContent: 'center',
  },
  btnRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 8,
  },
});
