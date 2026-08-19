import React from 'react';
import { StyleSheet, TouchableOpacity, ViewStyle, StyleProp } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../providers/ThemeProvider';

interface IconButtonProps {
  icon: keyof typeof Ionicons.glyphMap;
  onPress?: () => void;
  size?: number;
  style?: StyleProp<ViewStyle>;
}

export const IconButton: React.FC<IconButtonProps> = ({
  icon,
  onPress,
  size = 20,
  style,
}) => {
  const { colors, radii } = useTheme();

  return (
    <TouchableOpacity
      style={[
        styles.btn,
        {
          backgroundColor: colors.surface_white || '#FFFFFF',
          borderColor: colors.outline_variant || '#BCCABD',
          borderRadius: radii.pill || 9999,
        },
        style,
      ]}
      onPress={onPress}
      activeOpacity={0.7}
    >
      <Ionicons name={icon} size={size} color={colors.forest_green || '#154212'} />
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  btn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
