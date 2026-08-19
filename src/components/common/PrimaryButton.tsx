import React from 'react';
import { StyleSheet, Text, Pressable, ActivityIndicator, ViewStyle, TextStyle } from 'react-native';
import Animated, { useSharedValue, useAnimatedStyle, withSpring } from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../providers/ThemeProvider';

interface PrimaryButtonProps {
  title: string;
  onPress: () => void;
  icon?: keyof typeof Ionicons.glyphMap;
  loading?: boolean;
  disabled?: boolean;
  size?: 'sm' | 'md';
  style?: ViewStyle;
  textStyle?: TextStyle;
}

export const PrimaryButton: React.FC<PrimaryButtonProps> = ({
  title,
  onPress,
  icon,
  loading = false,
  disabled = false,
  size = 'md',
  style,
  textStyle,
}) => {
  const { colors, radii, shadows, animation } = useTheme();
  const scale = useSharedValue(1);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const handlePressIn = () => {
    scale.value = withSpring(animation.pressScale || 0.96, animation.spring.bouncy);
  };

  const handlePressOut = () => {
    scale.value = withSpring(1, animation.spring.bouncy);
  };

  const height = size === 'sm' ? 40 : 52;
  const paddingHorizontal = size === 'sm' ? 16 : 24;

  return (
    <Animated.View style={[animatedStyle, style]}>
      <Pressable
        style={[
          styles.button,
          {
            height,
            paddingHorizontal,
            backgroundColor: disabled ? colors.text_on_dark_muted : colors.green_vivid,
            borderRadius: radii.pill,
          },
          !disabled && shadows.fab,
        ]}
        onPress={onPress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        disabled={disabled || loading}
      >
        {loading ? (
          <ActivityIndicator color={colors.textInverse} size="small" />
        ) : (
          <>
            {icon && <Ionicons name={icon} size={size === 'sm' ? 16 : 18} color={colors.textInverse} style={styles.icon} />}
            <Text style={[styles.text, size === 'sm' && { fontSize: 13 }, { color: colors.textInverse }, textStyle]}>
              {title}
            </Text>
          </>
        )}
      </Pressable>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  icon: {
    marginRight: 8,
  },
  text: {
    fontSize: 15,
    fontWeight: '700',
  },
});
