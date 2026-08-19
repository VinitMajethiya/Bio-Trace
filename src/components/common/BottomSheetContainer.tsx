import React from 'react';
import { StyleSheet, View, ViewStyle, StyleProp } from 'react-native';
import { useTheme } from '../../providers/ThemeProvider';

interface BottomSheetContainerProps {
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
}

export const BottomSheetContainer: React.FC<BottomSheetContainerProps> = ({ children, style }) => {
  const { colors, radii, shadows } = useTheme();

  return (
    <View
      style={[
        styles.sheet,
        {
          backgroundColor: colors.card_light || '#FFFFFF',
          borderTopLeftRadius: radii.xl || 28,
          borderTopRightRadius: radii.xl || 28,
          borderColor: colors.surfaceBorder,
        },
        shadows.overlay,
        style,
      ]}
    >
      <View style={styles.handleContainer}>
        <View style={[styles.handle, { backgroundColor: colors.text_on_dark_muted || '#4A6852' }]} />
      </View>
      {children}
    </View>
  );
};

const styles = StyleSheet.create({
  sheet: {
    borderTopWidth: 1,
    paddingHorizontal: 20,
    paddingBottom: 24,
  },
  handleContainer: {
    width: '100%',
    alignItems: 'center',
    paddingVertical: 10,
  },
  handle: {
    width: 36,
    height: 4,
    borderRadius: 2,
  },
});
