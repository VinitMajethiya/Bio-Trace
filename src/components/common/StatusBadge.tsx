import React from 'react';
import { StyleSheet, Text, View, StyleProp, ViewStyle } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../providers/ThemeProvider';

interface StatusBadgeProps {
  label: string;
  variant?: 'success' | 'info' | 'warning' | 'module';
  icon?: keyof typeof Ionicons.glyphMap;
  style?: StyleProp<ViewStyle>;
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({
  label,
  variant = 'success',
  icon,
  style,
}) => {
  const { colors, radii } = useTheme();

  const getColors = () => {
    switch (variant) {
      case 'info':
        return { bg: colors.accentBlueSubtle, text: colors.accentBlue, border: 'transparent' };
      case 'warning':
        return { bg: colors.accentGoldSubtle, text: colors.accentGold, border: 'transparent' };
      case 'module':
        return { bg: 'rgba(15, 23, 42, 0.65)', text: colors.textInverse, border: 'transparent' };
      case 'success':
      default:
        return { bg: colors.primarySubtle, text: colors.primaryDark, border: colors.primaryBorder };
    }
  };

  const badgeColors = getColors();

  return (
    <View
      style={[
        styles.badge,
        {
          backgroundColor: badgeColors.bg,
          borderColor: badgeColors.border,
          borderRadius: radii.pill,
        },
        style,
      ]}
    >
      {icon && (
        <Ionicons
          name={icon}
          size={12}
          color={badgeColors.text}
          style={styles.icon}
        />
      )}
      <Text style={[styles.text, { color: badgeColors.text }]}>{label}</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderWidth: 1,
    alignSelf: 'flex-start',
  },
  icon: {
    marginRight: 4,
  },
  text: {
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.2,
    textTransform: 'uppercase',
  },
});
