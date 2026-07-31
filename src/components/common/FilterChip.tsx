import React from 'react';
import { StyleSheet, Text, TouchableOpacity, ViewStyle } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../providers/ThemeProvider';

interface FilterChipProps {
  label: string;
  active: boolean;
  onPress: () => void;
  icon?: keyof typeof Ionicons.glyphMap;
  style?: ViewStyle;
}

export const FilterChip: React.FC<FilterChipProps> = ({
  label,
  active,
  onPress,
  icon,
  style,
}) => {
  const { colors, radii, shadows } = useTheme();

  return (
    <TouchableOpacity
      style={[
        styles.chip,
        {
          borderRadius: radii.pill,
          backgroundColor: active ? colors.primary : colors.surface,
          borderColor: active ? colors.primary : colors.surfaceBorder,
        },
        !active && shadows.sm,
        style,
      ]}
      onPress={onPress}
      activeOpacity={0.8}
    >
      {icon && (
        <Ionicons
          name={icon}
          size={14}
          color={active ? colors.textInverse : colors.textSecondary}
          style={styles.icon}
        />
      )}
      <Text
        style={[
          styles.label,
          { color: active ? colors.textInverse : colors.textSecondary, fontWeight: active ? '700' : '600' },
        ]}
      >
        {label}
      </Text>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderWidth: 1,
  },
  icon: {
    marginRight: 6,
  },
  label: {
    fontSize: 13,
  },
});
