import React from 'react';
import { StyleSheet, Text, View, StyleProp, ViewStyle } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../providers/ThemeProvider';

export interface IconBadgeProps {
  icon: keyof typeof Ionicons.glyphMap;
  size?: number;
  iconSize?: number;
  color?: string;
  backgroundColor?: string;
  style?: StyleProp<ViewStyle>;
}

export const IconBadge: React.FC<IconBadgeProps> = ({
  icon,
  size = 20,
  iconSize = 11,
  color,
  backgroundColor,
  style,
}) => {
  return (
    <View
      style={[
        {
          width: size,
          height: size,
          borderRadius: size / 2,
          backgroundColor: backgroundColor || 'rgba(76, 175, 114, 0.15)',
          alignItems: 'center',
          justifyContent: 'center',
        },
        style,
      ]}
    >
      <Ionicons name={icon} size={iconSize} color={color || '#4CAF72'} />
    </View>
  );
};

export interface RarityBadgeProps {
  rarity?: 'common' | 'amber' | 'legendary' | string;
  label?: string;
  icon?: keyof typeof Ionicons.glyphMap;
  style?: StyleProp<ViewStyle>;
}

export const RarityBadge: React.FC<RarityBadgeProps> = ({
  rarity = 'common',
  label,
  icon,
  style,
}) => {
  const { colors, radii } = useTheme();

  const getStyle = () => {
    const key = rarity.toLowerCase();
    switch (key) {
      case 'amber':
      case 'rare':
        return {
          bg: colors.amber_subtle || 'rgba(232, 169, 32, 0.15)',
          text: colors.amber || '#E8A920',
          defaultLabel: 'Amber Tier',
          defaultIcon: 'star' as keyof typeof Ionicons.glyphMap,
        };
      case 'legendary':
      case 'epic':
        return {
          bg: colors.legendary_subtle || 'rgba(196, 125, 255, 0.15)',
          text: colors.legendary || '#C47DFF',
          defaultLabel: 'Legendary',
          defaultIcon: 'sparkles' as keyof typeof Ionicons.glyphMap,
        };
      case 'common':
      default:
        return {
          bg: colors.green_glow || 'rgba(76, 175, 114, 0.15)',
          text: colors.green_vivid || '#4CAF72',
          defaultLabel: 'Common',
          defaultIcon: 'leaf' as keyof typeof Ionicons.glyphMap,
        };
    }
  };

  const config = getStyle();
  const displayLabel = label || config.defaultLabel;
  const activeIcon = icon || config.defaultIcon;

  return (
    <View
      style={[
        styles.badge,
        {
          backgroundColor: config.bg,
          borderRadius: radii.pill,
        },
        style,
      ]}
    >
      <IconBadge
        icon={activeIcon}
        size={18}
        iconSize={10}
        color={config.text}
        backgroundColor="rgba(255, 255, 255, 0.3)"
        style={styles.iconBadgeStyle}
      />
      <Text style={[styles.text, { color: config.text }]}>{displayLabel}</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 3,
    alignSelf: 'flex-start',
    gap: 5,
  },
  iconBadgeStyle: {
    marginRight: 1,
  },
  text: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.4,
    textTransform: 'uppercase',
  },
});

