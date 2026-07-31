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
          backgroundColor: colors.surface,
          borderTopLeftRadius: radii['2xl'],
          borderTopRightRadius: radii['2xl'],
          borderColor: colors.surfaceBorder,
        },
        shadows.overlay,
        style,
      ]}
    >
      <View style={styles.handleContainer}>
        <View style={[styles.handle, { backgroundColor: colors.textMuted }]} />
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
