import React, { useState, useEffect } from 'react';
import { StyleSheet, Text, View, ScrollView, TouchableOpacity } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../providers/ThemeProvider';
import { useAuth } from '../../context/AuthContext';
import { FilterPill } from '../../components/common/FilterChip';
import { PrimaryButton } from '../../components/common/PrimaryButton';
import { SecondaryButton } from '../../components/common/SecondaryButton';
import { fetchUserProgression, PlayerProgression } from '../../lib/progression';
import { getUserSocietyInfo, UserSocietyInfo } from '../../lib/society';

interface AchievementBadge {
  id: string;
  title: string;
  icon: keyof typeof Ionicons.glyphMap;
  desc: string;
  unlocked: boolean;
  color: string;
}

export const ProfileScreen: React.FC = () => {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<any>();
  const { colors, radii } = useTheme();
  const { user, signOut } = useAuth();

  const [progression, setProgression] = useState<PlayerProgression>({
    totalGP: 0,
    level: 1,
    currentLevelXP: 0,
    xpToNextLevel: 100,
    progressPercent: 0,
    title: 'Eco Novice',
    wildXP: 0,
    circularGP: 0,
  });

  const [societyInfo, setSocietyInfo] = useState<UserSocietyInfo>({
    society_id: null,
    moderator_of_society_id: null,
  });

  const loadData = async () => {
    if (!user) return;
    const [prog, sInfo] = await Promise.all([
      fetchUserProgression(user.id),
      getUserSocietyInfo(user.id),
    ]);
    setProgression(prog);
    setSocietyInfo(sInfo);
  };

  useFocusEffect(
    React.useCallback(() => {
      loadData();
    }, [user])
  );

  useEffect(() => {
    loadData();
  }, [user]);

  const displayName = user?.user_metadata?.display_name || user?.email?.split('@')[0] || 'Eco Explorer';
  const userEmail = user?.email || 'explorer@sgu.edu';

  const badges: AchievementBadge[] = [
    {
      id: 'pioneer',
      title: 'Campus Pioneer',
      icon: 'compass',
      desc: 'Joined SGU Eco-Quest Network',
      unlocked: true,
      color: '#2BB673',
    },
    {
      id: 'wild_observer',
      title: 'Wildlife Observer',
      icon: 'leaf',
      desc: 'Logged species observations',
      unlocked: progression.wildXP > 0,
      color: '#00A86B',
    },
    {
      id: 'zero_waste',
      title: 'Zero Waste',
      icon: 'sync-circle',
      desc: 'Diverted recyclables',
      unlocked: progression.circularGP > 0,
      color: '#FF9966',
    },
    {
      id: 'raid_veteran',
      title: 'Abhiyan Hero',
      icon: 'shield-checkmark',
      desc: 'Completed campus bio raids',
      unlocked: progression.totalGP >= 100,
      color: '#3B82F6',
    },
  ];

  const unlockedCount = badges.filter((b) => b.unlocked).length;

  return (
    <View
      style={[
        styles.container,
        {
          backgroundColor: '#F8FAF8',
          paddingTop: Math.max(insets.top, 16),
        },
      ]}
    >
      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {/* Top Header Bar */}
        <View style={styles.headerBar}>
          <View>
            <Text style={styles.headerTitle}>Explorer Profile</Text>
            <Text style={styles.headerSub}>Campus Steward ID & Progress</Text>
          </View>
        </View>

        {/* Minimalist Profile Identity Card */}
        <View style={styles.profileHeroCard}>
          <View style={styles.heroTopRow}>
            {/* Avatar Circle with subtle emerald border */}
            <View style={styles.avatarWrapper}>
              <View style={styles.avatarCircle}>
                <Text style={styles.avatarInitials}>
                  {displayName.substring(0, 2).toUpperCase()}
                </Text>
              </View>
              <View style={styles.levelTag}>
                <Text style={styles.levelTagText}>LVL {progression.level}</Text>
              </View>
            </View>

            {/* Name, Email, Society */}
            <View style={styles.userInfoCol}>
              <Text style={styles.displayName} numberOfLines={1}>
                {displayName}
              </Text>
              <Text style={styles.userHandle} numberOfLines={1}>
                {userEmail}
              </Text>

              <TouchableOpacity
                style={styles.societyPillBtn}
                onPress={() => navigation.navigate('SocietyPicker')}
                activeOpacity={0.8}
              >
                <Ionicons name="people-outline" size={13} color="#2BB673" />
                <Text style={styles.societyPillText} numberOfLines={1}>
                  {societyInfo.society_name ? societyInfo.society_name : 'Join a Society'}
                </Text>
                <Ionicons name="chevron-forward" size={11} color="#2BB673" />
              </TouchableOpacity>
            </View>
          </View>

          {/* Sleek Linear Level Progress Bar */}
          <View style={styles.progressSection}>
            <View style={styles.progressHeaderRow}>
              <View style={styles.rankBadge}>
                <Ionicons name="sparkles" size={13} color="#00A86B" />
                <Text style={styles.rankTitleText}>{progression.title}</Text>
              </View>
              <Text style={styles.progressPercentText}>
                {Math.round(progression.progressPercent)}%
              </Text>
            </View>

            {/* Clean Progress Track */}
            <View style={styles.progressBarTrack}>
              <View
                style={[
                  styles.progressBarFill,
                  { width: `${Math.min(100, Math.max(5, progression.progressPercent))}%` },
                ]}
              />
            </View>

            <View style={styles.progressFooterRow}>
              <Text style={styles.progressSubtext}>
                {progression.currentLevelXP} / 100 XP
              </Text>
              <Text style={styles.progressNextLevelText}>
                Next: Level {progression.level + 1}
              </Text>
            </View>
          </View>
        </View>

        {/* Minimalist Unified 4-Metric Overview Strip */}
        <View style={styles.metricStripContainer}>
          {/* Col 1: Total GP */}
          <View style={styles.metricCol}>
            <View style={[styles.metricDot, { backgroundColor: '#FFF5E5' }]}>
              <Ionicons name="trophy" size={14} color="#FF9966" />
            </View>
            <Text style={styles.metricValText}>{progression.totalGP}</Text>
            <Text style={styles.metricLabelText}>Total GP</Text>
          </View>

          <View style={styles.metricDivider} />

          {/* Col 2: Species Sightings */}
          <View style={styles.metricCol}>
            <View style={[styles.metricDot, { backgroundColor: '#D9F3E9' }]}>
              <Ionicons name="leaf" size={14} color="#00A86B" />
            </View>
            <Text style={styles.metricValText}>
              {Math.floor(progression.wildXP / 25)}
            </Text>
            <Text style={styles.metricLabelText}>Sightings</Text>
          </View>

          <View style={styles.metricDivider} />

          {/* Col 3: Diverted Recyclables */}
          <View style={styles.metricCol}>
            <View style={[styles.metricDot, { backgroundColor: '#FFDBCC' }]}>
              <Ionicons name="sync-circle" size={14} color="#FF9966" />
            </View>
            <Text style={styles.metricValText}>
              {(progression.circularGP / 10).toFixed(1)}
              <Text style={styles.metricUnitText}> kg</Text>
            </Text>
            <Text style={styles.metricLabelText}>Diverted</Text>
          </View>

          <View style={styles.metricDivider} />

          {/* Col 4: Bio Raids / Abhiyans */}
          <View style={styles.metricCol}>
            <View style={[styles.metricDot, { backgroundColor: '#EFF6FF' }]}>
              <Ionicons name="shield-checkmark" size={14} color="#3B82F6" />
            </View>
            <Text style={styles.metricValText}>
              {Math.max(1, Math.floor(progression.totalGP / 50))}
            </Text>
            <Text style={styles.metricLabelText}>Abhiyans</Text>
          </View>
        </View>

        {/* Minimalist Achievements Strip */}
        <View style={styles.sectionWrap}>
          <View style={styles.sectionHeaderRow}>
            <Text style={styles.sectionHeaderTitle}>Achievements</Text>
            <Text style={styles.badgeCountBadge}>
              {unlockedCount} / {badges.length} Unlocked
            </Text>
          </View>

          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.badgesScrollRow}
          >
            {badges.map((badge) => (
              <View
                key={badge.id}
                style={[
                  styles.badgeItemCard,
                  !badge.unlocked && styles.badgeItemLocked,
                ]}
              >
                <View
                  style={[
                    styles.badgeIconBubble,
                    { backgroundColor: badge.unlocked ? `${badge.color}15` : '#F0F2F0' },
                  ]}
                >
                  <Ionicons
                    name={badge.icon}
                    size={20}
                    color={badge.unlocked ? badge.color : '#9CA3AF'}
                  />
                  {!badge.unlocked && (
                    <View style={styles.badgeMiniLock}>
                      <Ionicons name="lock-closed" size={9} color="#FFFFFF" />
                    </View>
                  )}
                </View>
                <Text
                  style={[
                    styles.badgeItemTitle,
                    !badge.unlocked && { color: '#9CA3AF' },
                  ]}
                  numberOfLines={1}
                >
                  {badge.title}
                </Text>
                <Text style={styles.badgeItemDesc} numberOfLines={2}>
                  {badge.desc}
                </Text>
              </View>
            ))}
          </ScrollView>
        </View>

        {/* Bio Veer Moderator Controls (Conditional) */}
        {!!societyInfo.moderator_of_society_id &&
          societyInfo.moderator_of_society_id === societyInfo.society_id && (
            <View style={styles.modCommandCard}>
              <View style={styles.modHeader}>
                <View style={styles.modIconBubble}>
                  <Ionicons name="shield-checkmark" size={18} color="#00A86B" />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.modTitle}>Bio Veer Command</Text>
                  <Text style={styles.modSub}>Society verification & Abhiyan dispatch</Text>
                </View>
              </View>
              <View style={styles.modBtnRow}>
                <TouchableOpacity
                  style={styles.modPrimaryBtn}
                  onPress={() => navigation.navigate('CreateRaid')}
                  activeOpacity={0.8}
                >
                  <Ionicons name="add-circle-outline" size={16} color="#FFFFFF" />
                  <Text style={styles.modPrimaryBtnText}>New Abhiyan</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.modSecondaryBtn}
                  onPress={() => navigation.navigate('ModeratorReview')}
                  activeOpacity={0.8}
                >
                  <Ionicons name="checkmark-done" size={16} color="#00A86B" />
                  <Text style={styles.modSecondaryBtnText}>Review Logs</Text>
                </TouchableOpacity>
              </View>
            </View>
          )}

        {/* Grouped Navigation 1: Eco Portfolio & Rewards */}
        <View style={styles.sectionWrap}>
          <Text style={styles.groupLabel}>PORTFOLIO & REWARDS</Text>
          <View style={styles.groupedCard}>
            <TouchableOpacity
              onPress={() => navigation.navigate('Wallet')}
              activeOpacity={0.7}
              style={styles.navRow}
            >
              <View style={[styles.navIconDisc, { backgroundColor: '#D9F3E9' }]}>
                <Ionicons name="wallet-outline" size={18} color="#00A86B" />
              </View>
              <View style={styles.navTextCol}>
                <Text style={styles.navTitle}>GreenPoints Wallet</Text>
                <Text style={styles.navSub}>Ledger history & balance</Text>
              </View>
              <Ionicons name="chevron-forward" size={16} color="#BCCABD" />
            </TouchableOpacity>

            <View style={styles.hairlineDivider} />

            <TouchableOpacity
              onPress={() => navigation.navigate('Leaderboard')}
              activeOpacity={0.7}
              style={styles.navRow}
            >
              <View style={[styles.navIconDisc, { backgroundColor: '#FFDBCC' }]}>
                <Ionicons name="trophy-outline" size={18} color="#FF9966" />
              </View>
              <View style={styles.navTextCol}>
                <Text style={styles.navTitle}>Campus Leaderboard</Text>
                <Text style={styles.navSub}>Ranks & steward scores</Text>
              </View>
              <Ionicons name="chevron-forward" size={16} color="#BCCABD" />
            </TouchableOpacity>

            <View style={styles.hairlineDivider} />

            <TouchableOpacity
              onPress={() => navigation.navigate('Rewards')}
              activeOpacity={0.7}
              style={styles.navRow}
            >
              <View style={[styles.navIconDisc, { backgroundColor: '#EFF6FF' }]}>
                <Ionicons name="gift-outline" size={18} color="#3B82F6" />
              </View>
              <View style={styles.navTextCol}>
                <Text style={styles.navTitle}>Rewards Marketplace</Text>
                <Text style={styles.navSub}>Redeem GP for perks</Text>
              </View>
              <Ionicons name="chevron-forward" size={16} color="#BCCABD" />
            </TouchableOpacity>
          </View>
        </View>

        {/* Grouped Navigation 2: Community & Impact */}
        <View style={styles.sectionWrap}>
          <Text style={styles.groupLabel}>COMMUNITY & IMPACT</Text>
          <View style={styles.groupedCard}>
            <TouchableOpacity
              onPress={() => navigation.navigate('SocietyPicker')}
              activeOpacity={0.7}
              style={styles.navRow}
            >
              <View style={[styles.navIconDisc, { backgroundColor: '#D9F3E9' }]}>
                <Ionicons name="people-outline" size={18} color="#2BB673" />
              </View>
              <View style={styles.navTextCol}>
                <Text style={styles.navTitle}>Eco Societies</Text>
                <Text style={styles.navSub}>Pilot zones & campus teams</Text>
              </View>
              <Ionicons name="chevron-forward" size={16} color="#BCCABD" />
            </TouchableOpacity>

            <View style={styles.hairlineDivider} />

            <TouchableOpacity
              onPress={() => navigation.navigate('Dashboard')}
              activeOpacity={0.7}
              style={styles.navRow}
            >
              <View style={[styles.navIconDisc, { backgroundColor: '#EFF6FF' }]}>
                <Ionicons name="analytics-outline" size={18} color="#3B82F6" />
              </View>
              <View style={styles.navTextCol}>
                <Text style={styles.navTitle}>Ecosystem Analytics</Text>
                <Text style={styles.navSub}>Campus biodiversity stats</Text>
              </View>
              <Ionicons name="chevron-forward" size={16} color="#BCCABD" />
            </TouchableOpacity>

            <View style={styles.hairlineDivider} />

            <TouchableOpacity
              onPress={() => navigation.navigate('Donations')}
              activeOpacity={0.7}
              style={styles.navRow}
            >
              <View style={[styles.navIconDisc, { backgroundColor: '#D9F3E9' }]}>
                <Ionicons name="gift-outline" size={18} color="#00A86B" />
              </View>
              <View style={styles.navTextCol}>
                <Text style={styles.navTitle}>Give Back (Donations)</Text>
                <Text style={styles.navSub}>Share saplings, seeds & tools</Text>
              </View>
              <Ionicons name="chevron-forward" size={16} color="#BCCABD" />
            </TouchableOpacity>

            <View style={styles.hairlineDivider} />

            <TouchableOpacity
              onPress={() => navigation.navigate('PartnerExport')}
              activeOpacity={0.7}
              style={styles.navRow}
            >
              <View style={[styles.navIconDisc, { backgroundColor: '#F3E8FF' }]}>
                <Ionicons name="cloud-download-outline" size={18} color="#8B5CF6" />
              </View>
              <View style={styles.navTextCol}>
                <Text style={styles.navTitle}>Open Data Export</Text>
                <Text style={styles.navSub}>Download CSV research logs</Text>
              </View>
              <Ionicons name="chevron-forward" size={16} color="#BCCABD" />
            </TouchableOpacity>
          </View>
        </View>

        {/* Sign Out Button & Version */}
        <View style={styles.footerWrap}>
          <TouchableOpacity
            style={styles.signOutPill}
            onPress={signOut}
            activeOpacity={0.8}
          >
            <Ionicons name="log-out-outline" size={16} color="#BA1A1A" />
            <Text style={styles.signOutText}>Sign Out of Account</Text>
          </TouchableOpacity>

          <Text style={styles.versionLabel}>
            Eco-Quest Campus Steward • v1.0.0 (Release)
          </Text>
        </View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    paddingHorizontal: 20,
    paddingTop: 8,
    gap: 16,
    paddingBottom: 140, // Keeps clear of the floating bottom dock
  },
  headerBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 2,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '800',
    color: '#161D18',
    letterSpacing: -0.4,
  },
  headerSub: {
    fontSize: 13,
    color: '#6D7A6F',
    marginTop: 2,
  },
  headerActionBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: 'rgba(0, 0, 0, 0.08)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  profileHeroCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    padding: 18,
    borderWidth: 1,
    borderColor: 'rgba(0, 0, 0, 0.06)',
    gap: 16,
  },
  heroTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  avatarWrapper: {
    position: 'relative',
    alignItems: 'center',
  },
  avatarCircle: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#154212',
    borderWidth: 2,
    borderColor: '#2BB673',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarInitials: {
    fontSize: 20,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: 0.5,
  },
  levelTag: {
    position: 'absolute',
    bottom: -6,
    backgroundColor: '#00A86B',
    paddingHorizontal: 7,
    paddingVertical: 1.5,
    borderRadius: 8,
    borderWidth: 1.5,
    borderColor: '#FFFFFF',
  },
  levelTagText: {
    fontSize: 9,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: 0.3,
  },
  userInfoCol: {
    flex: 1,
    gap: 3,
  },
  displayName: {
    fontSize: 19,
    fontWeight: '800',
    color: '#161D18',
    letterSpacing: -0.3,
  },
  userHandle: {
    fontSize: 12,
    color: '#6D7A6F',
  },
  societyPillBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    backgroundColor: '#D9F3E9',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 9999,
    gap: 5,
    marginTop: 3,
  },
  societyPillText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#154212',
  },
  progressSection: {
    backgroundColor: '#F4FAF5',
    borderRadius: 16,
    padding: 14,
    gap: 8,
    borderWidth: 1,
    borderColor: 'rgba(43, 182, 115, 0.12)',
  },
  progressHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  rankBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  rankTitleText: {
    fontSize: 13,
    fontWeight: '800',
    color: '#154212',
  },
  progressPercentText: {
    fontSize: 13,
    fontWeight: '800',
    color: '#00A86B',
  },
  progressBarTrack: {
    height: 7,
    backgroundColor: 'rgba(0, 0, 0, 0.06)',
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: '#2BB673',
    borderRadius: 4,
  },
  progressFooterRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  progressSubtext: {
    fontSize: 11,
    fontWeight: '600',
    color: '#6D7A6F',
  },
  progressNextLevelText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#00A86B',
  },
  metricStripContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    paddingVertical: 14,
    paddingHorizontal: 8,
    borderWidth: 1,
    borderColor: 'rgba(0, 0, 0, 0.06)',
  },
  metricCol: {
    flex: 1,
    alignItems: 'center',
    gap: 3,
  },
  metricDot: {
    width: 26,
    height: 26,
    borderRadius: 13,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 2,
  },
  metricValText: {
    fontSize: 16,
    fontWeight: '800',
    color: '#161D18',
    letterSpacing: -0.3,
  },
  metricUnitText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#6D7A6F',
  },
  metricLabelText: {
    fontSize: 10,
    fontWeight: '600',
    color: '#6D7A6F',
  },
  metricDivider: {
    width: 1,
    height: 28,
    backgroundColor: '#F0F4F1',
  },
  sectionWrap: {
    gap: 8,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 2,
  },
  sectionHeaderTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: '#161D18',
    letterSpacing: -0.2,
  },
  badgeCountBadge: {
    fontSize: 12,
    fontWeight: '700',
    color: '#00A86B',
  },
  badgesScrollRow: {
    gap: 10,
    paddingRight: 10,
    paddingVertical: 2,
  },
  badgeItemCard: {
    width: 116,
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    padding: 12,
    alignItems: 'center',
    textAlign: 'center',
    borderWidth: 1,
    borderColor: 'rgba(0, 0, 0, 0.06)',
    gap: 4,
  },
  badgeItemLocked: {
    opacity: 0.6,
    backgroundColor: '#F9FAF9',
  },
  badgeIconBubble: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
    marginBottom: 2,
  },
  badgeMiniLock: {
    position: 'absolute',
    bottom: -2,
    right: -2,
    backgroundColor: '#6B7280',
    width: 14,
    height: 14,
    borderRadius: 7,
    alignItems: 'center',
    justifyContent: 'center',
  },
  badgeItemTitle: {
    fontSize: 11,
    fontWeight: '700',
    color: '#161D18',
    textAlign: 'center',
  },
  badgeItemDesc: {
    fontSize: 9,
    color: '#6D7A6F',
    textAlign: 'center',
    lineHeight: 12,
  },
  modCommandCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 16,
    borderWidth: 1,
    borderColor: 'rgba(43, 182, 115, 0.25)',
    gap: 12,
  },
  modHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  modIconBubble: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: '#D9F3E9',
    alignItems: 'center',
    justifyContent: 'center',
  },
  modTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: '#161D18',
  },
  modSub: {
    fontSize: 11,
    color: '#6D7A6F',
    marginTop: 1,
  },
  modBtnRow: {
    flexDirection: 'row',
    gap: 10,
  },
  modPrimaryBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#2BB673',
    paddingVertical: 10,
    borderRadius: 12,
    gap: 6,
  },
  modPrimaryBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  modSecondaryBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#D9F3E9',
    paddingVertical: 10,
    borderRadius: 12,
    gap: 6,
  },
  modSecondaryBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#154212',
  },
  groupLabel: {
    fontSize: 11,
    fontWeight: '800',
    color: '#6D7A6F',
    letterSpacing: 0.6,
    marginLeft: 4,
  },
  groupedCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    paddingHorizontal: 16,
    borderWidth: 1,
    borderColor: 'rgba(0, 0, 0, 0.06)',
  },
  navRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    gap: 12,
  },
  hairlineDivider: {
    height: 1,
    backgroundColor: '#F0F4F1',
  },
  navIconDisc: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  navTextCol: {
    flex: 1,
    gap: 1,
  },
  navTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#161D18',
  },
  navSub: {
    fontSize: 11,
    color: '#6D7A6F',
  },
  footerWrap: {
    marginTop: 8,
    gap: 10,
    alignItems: 'center',
  },
  signOutPill: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFDAD6',
    borderWidth: 1,
    borderColor: 'rgba(186, 26, 26, 0.15)',
    paddingVertical: 11,
    paddingHorizontal: 24,
    borderRadius: 9999,
    gap: 8,
    width: '100%',
  },
  signOutText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#BA1A1A',
  },
  versionLabel: {
    fontSize: 11,
    fontWeight: '500',
    color: '#6D7A6F',
  },
});
