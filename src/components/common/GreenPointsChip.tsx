import React from 'react';
import { StyleSheet, Text, View, StyleProp, ViewStyle } from 'react-native';
import { useTheme } from '../../providers/ThemeProvider';

interface GreenPointsChipProps {
  points: number | string;
  label?: string;
  style?: StyleProp<ViewStyle>;
}

export const GreenPointsChip: React.FC<GreenPointsChipProps> = ({
  points,
  label = 'GP',
  style,
}) => {
  const { colors, radii } = useTheme();

  return (
    <View
      style={[
        styles.chip,
        {
          backgroundColor: colors.amber_subtle || 'rgba(232, 169, 32, 0.15)',
          borderRadius: radii.pill,
        },
        style,
      ]}
    >
      <Text style={[styles.hexIcon, { color: colors.amber || '#E8A920' }]}>⬡</Text>
      <Text style={[styles.text, { color: colors.amber || '#E8A920' }]}>
        {points} {label}
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 5,
    gap: 4,
    alignSelf: 'flex-start',
  },
  hexIcon: {
    fontSize: 13,
    fontWeight: '700',
  },
  text: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.3,
  },
});
