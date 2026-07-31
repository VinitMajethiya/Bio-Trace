import React from 'react';
import { StyleSheet, Text, View, Image, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../providers/ThemeProvider';

interface BioHeaderProps {
  avatarUrl?: string;
  userInitial?: string;
  title?: string;
  onNotificationPress?: () => void;
  onAvatarPress?: () => void;
  hasNotification?: boolean;
}

export const BioHeader: React.FC<BioHeaderProps> = ({
  avatarUrl,
  userInitial = 'B',
  title = 'BioVerse',
  onNotificationPress,
  onAvatarPress,
  hasNotification = true,
}) => {
  const { colors, typography, spacing, radii } = useTheme();

  return (
    <View style={[styles.header, { backgroundColor: colors.background, borderBottomColor: colors.surfaceBorder }]}>
      <TouchableOpacity style={styles.avatarBtn} onPress={onAvatarPress} activeOpacity={0.8}>
        {avatarUrl ? (
          <Image source={{ uri: avatarUrl }} style={[styles.avatarImg, { borderRadius: radii.pill }]} />
        ) : (
          <View style={[styles.avatarFallback, { backgroundColor: colors.primarySubtle, borderRadius: radii.pill }]}>
            <Text style={[styles.avatarText, { color: colors.primaryDark }]}>{userInitial.toUpperCase()}</Text>
          </View>
        )}
      </TouchableOpacity>

      <Text style={[styles.title, { color: colors.primaryDark }]}>{title}</Text>

      <TouchableOpacity style={styles.iconBtn} onPress={onNotificationPress} activeOpacity={0.7}>
        <Ionicons name="notifications-outline" size={22} color={colors.textPrimary} />
        {hasNotification && <View style={[styles.notifDot, { backgroundColor: colors.textDanger }]} />}
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  header: {
    height: 56,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    borderBottomWidth: 1,
  },
  avatarBtn: {
    width: 38,
    height: 38,
  },
  avatarImg: {
    width: 38,
    height: 38,
  },
  avatarFallback: {
    width: 38,
    height: 38,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    fontSize: 16,
    fontWeight: '800',
  },
  title: {
    fontSize: 22,
    fontWeight: '800',
    letterSpacing: -0.3,
  },
  iconBtn: {
    width: 38,
    height: 38,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  notifDot: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 7,
    height: 7,
    borderRadius: 4,
  },
});
