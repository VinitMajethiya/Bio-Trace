import React from 'react';
import { StyleSheet, Text, TouchableOpacity, ViewStyle } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../providers/ThemeProvider';

export interface FilterPillProps {
  label: string;
  active: boolean;
  onPress: () => void;
  icon?: keyof typeof Ionicons.glyphMap;
  canvas?: 'dark' | 'warm';
  style?: ViewStyle;
}

export const FilterPill: React.FC<FilterPillProps> = ({
  label,
  active,
  onPress,
  icon,
  canvas = 'dark',
  style,
}) => {
  const { colors, radii } = useTheme();

  const isDark = canvas === 'dark';

  const getBackgroundColor = () => {
    return active ? colors.green_vivid || '#2BB673' : colors.mint_background || '#D9F3E9';
  };

  const getTextColor = () => {
    return active ? '#FFFFFF' : colors.forest_green || '#154212';
  };

  const bgColor = getBackgroundColor();
  const textColor = getTextColor();

  return (
    <TouchableOpacity
      style={[
        styles.chip,
        {
          borderRadius: radii.pill,
          backgroundColor: bgColor,
        },
        style,
      ]}
      onPress={onPress}
      activeOpacity={0.8}
    >
      {icon && (
        <Ionicons
          name={icon}
          size={14}
          color={textColor}
          style={styles.icon}
        />
      )}
      <Text style={[styles.label, { color: textColor, fontWeight: active ? '700' : '600' }]}>
        {label}
      </Text>
    </TouchableOpacity>
  );
};

export const FilterChip: React.FC<FilterPillProps> = (props) => <FilterPill {...props} />;

const styles = StyleSheet.create({
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 8,
  },
  icon: {
    marginRight: 6,
  },
  label: {
    fontSize: 13,
  },
});
