import React from 'react';
import { StyleSheet, Text, View, Image, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../providers/ThemeProvider';
import { useNavigation } from '@react-navigation/native';
import { IconButton } from './IconButton';

interface BioHeaderProps {
  avatarUrl?: string;
  userInitial?: string;
  title?: string;
  onNotificationPress?: () => void;
  onAvatarPress?: () => void;
  hasNotification?: boolean;
  showBack?: boolean;
  onBackPress?: () => void;
  showInfoBtn?: boolean;
}

export const BioHeader: React.FC<BioHeaderProps> = ({
  avatarUrl,
  userInitial = 'B',
  title = 'BioVerse',
  onNotificationPress,
  onAvatarPress,
  hasNotification = true,
  showBack = false,
  onBackPress,
  showInfoBtn = true,
}) => {
  const { colors, radii } = useTheme();
  const navigation = useNavigation<any>();

  return (
    <View style={[styles.header, { backgroundColor: colors.background, borderBottomColor: colors.surfaceBorder }]}>
      {showBack ? (
        <IconButton icon="arrow-back" onPress={onBackPress} />
      ) : (
        <TouchableOpacity style={styles.avatarBtn} onPress={onAvatarPress} activeOpacity={0.8}>
          {avatarUrl ? (
            <Image source={{ uri: avatarUrl }} style={[styles.avatarImg, { borderRadius: radii.pill }]} />
          ) : (
            <View style={[styles.avatarFallback, { backgroundColor: colors.primarySubtle, borderRadius: radii.pill }]}>
              <Text style={[styles.avatarText, { color: colors.primaryDark }]}>{userInitial.toUpperCase()}</Text>
            </View>
          )}
        </TouchableOpacity>
      )}

      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
        <Text style={[styles.title, { color: colors.forest_green || colors.primaryDark }]}>{title}</Text>
      </View>

      <View style={styles.notifWrapper}>
        <IconButton icon="notifications-outline" onPress={onNotificationPress} />
        {hasNotification && <View style={[styles.notifDot, { backgroundColor: colors.textDanger }]} />}
      </View>
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
  notifWrapper: {
    position: 'relative',
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
    top: 4,
    right: 4,
    width: 7,
    height: 7,
    borderRadius: 4,
  },
});
