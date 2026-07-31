import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../providers/ThemeProvider';

interface RewardBannerProps {
  gpAmount: number;
  xpAmount: number;
}

export const RewardBanner: React.FC<RewardBannerProps> = ({ gpAmount, xpAmount }) => {
  const { colors, radii } = useTheme();

  return (
    <View style={[styles.container, { backgroundColor: colors.primarySubtle, borderRadius: radii.xl }]}>
      <View style={styles.leftCol}>
        <Text style={[styles.headerText, { color: colors.textSecondary }]}>REWARDS EARNED</Text>
        <View style={styles.rewardsRow}>
          <View style={styles.rewardPill}>
            <Ionicons name="leaf" size={16} color={colors.primary} />
            <Text style={[styles.rewardText, { color: colors.primaryDark }]}>+{gpAmount} GP</Text>
          </View>

          <View style={styles.rewardPill}>
            <Ionicons name="flash" size={16} color={colors.accentBlue} />
            <Text style={[styles.rewardText, { color: colors.accentBlue }]}>+{xpAmount} XP</Text>
          </View>
        </View>
      </View>

      <View style={[styles.giftBox, { backgroundColor: colors.surface, borderRadius: radii.lg }]}>
        <Ionicons name="gift-outline" size={24} color={colors.primary} />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderWidth: 1,
    borderColor: 'rgba(5, 150, 105, 0.15)',
  },
  leftCol: {
    gap: 6,
  },
  headerText: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  rewardsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  rewardPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  rewardText: {
    fontSize: 18,
    fontWeight: '800',
  },
  giftBox: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
