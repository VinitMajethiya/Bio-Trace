import React from 'react';
import { StyleSheet, Text, View, ScrollView } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../providers/ThemeProvider';
import { useAuth } from '../../context/AuthContext';
import { BioHeader } from '../../components/common/BioHeader';
import { BioCard } from '../../components/common/BioCard';
import { StatusBadge } from '../../components/common/StatusBadge';
import { PrimaryButton } from '../../components/common/PrimaryButton';
import { SecondaryButton } from '../../components/common/SecondaryButton';

export const ProfileScreen: React.FC = () => {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<any>();
  const { colors, radii } = useTheme();
  const { user, signOut } = useAuth();

  const userInitial = user?.email?.charAt(0).toUpperCase() || 'E';
  const displayName = user?.user_metadata?.display_name || user?.email?.split('@')[0] || 'Eco Explorer';

  return (
    <View style={[styles.container, { backgroundColor: colors.background, paddingTop: Math.max(insets.top, 8) }]}>
      <BioHeader title="BioVerse" />

      <ScrollView contentContainerStyle={styles.content}>
        {/* User Card */}
        <BioCard variant="elevated" padding={20} style={styles.profileCard}>
          <View style={[styles.avatarCircle, { backgroundColor: colors.primarySubtle }]}>
            <Text style={[styles.avatarText, { color: colors.primaryDark }]}>{userInitial}</Text>
          </View>
          <Text style={[styles.displayName, { color: colors.textPrimary }]}>{displayName}</Text>
          <Text style={[styles.emailText, { color: colors.textSecondary }]}>{user?.email || 'explorer@ecoquest.demo'}</Text>
          
          <StatusBadge label="Trust Score: 100 (Tier 0 Verified)" variant="success" icon="shield-checkmark" style={styles.trustBadge} />
        </BioCard>

        {/* GreenPoints & Wallet Access Widget */}
        <BioCard variant="elevated" padding={18} style={[styles.walletWidgetCard, { backgroundColor: colors.primarySubtle }]}>
          <View style={styles.walletWidgetHeader}>
            <View style={[styles.walletIconBg, { backgroundColor: colors.primary }]}>
              <Ionicons name="wallet" size={20} color={colors.textInverse} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={[styles.walletWidgetTitle, { color: colors.primaryDark }]}>GreenPoints & Wallet</Text>
              <Text style={[styles.walletWidgetSub, { color: colors.textSecondary }]}>Track earnings, XP, & unified activity log</Text>
            </View>
          </View>

          <PrimaryButton
            title="View GreenPoints & Activity Wallet"
            icon="receipt-outline"
            onPress={() => navigation.navigate('Wallet')}
            style={styles.walletBtn}
          />
        </BioCard>

        {/* Session Info */}
        <BioCard variant="outlined" padding={18} style={styles.infoCard}>
          <Text style={[styles.infoTitle, { color: colors.textPrimary }]}>Session Information</Text>
          <View style={styles.infoRow}>
            <Text style={[styles.infoLabel, { color: colors.textSecondary }]}>User ID:</Text>
            <Text style={[styles.infoVal, { color: colors.textPrimary }]} numberOfLines={1} ellipsizeMode="middle">
              {user?.id || 'demo-user-id'}
            </Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={[styles.infoLabel, { color: colors.textSecondary }]}>Auth Provider:</Text>
            <Text style={[styles.infoVal, { color: colors.textPrimary }]}>Supabase Auth</Text>
          </View>
        </BioCard>

        <SecondaryButton title="Sign Out" icon="log-out-outline" onPress={signOut} style={{ borderColor: 'rgba(239, 68, 68, 0.3)' }} textStyle={{ color: colors.textDanger }} />
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    padding: 16,
    gap: 16,
    paddingBottom: 80,
  },
  profileCard: {
    alignItems: 'center',
  },
  avatarCircle: {
    width: 72,
    height: 72,
    borderRadius: 36,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  avatarText: {
    fontSize: 32,
    fontWeight: '800',
  },
  displayName: {
    fontSize: 20,
    fontWeight: '800',
  },
  emailText: {
    fontSize: 13,
    marginTop: 2,
  },
  trustBadge: {
    marginTop: 14,
  },
  walletWidgetCard: {
    gap: 14,
    borderColor: 'rgba(5, 150, 105, 0.25)',
  },
  walletWidgetHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  walletIconBg: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  walletWidgetTitle: {
    fontSize: 16,
    fontWeight: '800',
  },
  walletWidgetSub: {
    fontSize: 12,
    marginTop: 2,
  },
  walletBtn: {
    height: 44,
  },
  infoCard: {
    gap: 12,
  },
  infoTitle: {
    fontSize: 14,
    fontWeight: '700',
    marginBottom: 4,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  infoLabel: {
    fontSize: 13,
  },
  infoVal: {
    fontSize: 13,
    fontWeight: '600',
    maxWidth: '60%',
  },
});
