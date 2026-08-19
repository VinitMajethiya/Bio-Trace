import React, { useState } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TextInput,
  TextInputProps,
  ViewStyle,
  TextStyle,
} from 'react-native';
import Animated, { useSharedValue, useAnimatedStyle, withTiming } from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../providers/ThemeProvider';

export interface InputContainerProps extends TextInputProps {
  label?: string;
  icon?: keyof typeof Ionicons.glyphMap;
  rightLabel?: string;
  error?: string;
  containerStyle?: ViewStyle;
  inputStyle?: TextStyle;
  canvas?: 'dark' | 'warm';
}

export const InputContainer: React.FC<InputContainerProps> = ({
  label,
  icon,
  rightLabel,
  error,
  containerStyle,
  inputStyle,
  canvas = 'dark',
  onFocus,
  onBlur,
  ...rest
}) => {
  const { colors, radii } = useTheme();
  const [isFocused, setIsFocused] = useState(false);
  const focusProgress = useSharedValue(0);

  const isDark = canvas === 'dark';
  const activeColor = colors.green_vivid || '#2BB673';
  const dangerColor = colors.danger || '#BA1A1A';
  const inactiveColor = colors.outline_variant || '#BCCABD';
  const hasError = !!error;

  const borderAnimatedStyle = useAnimatedStyle(() => {
    return {
      borderColor: focusProgress.value === 1
        ? activeColor
        : (hasError ? dangerColor : inactiveColor),
    };
  });

  const handleFocus = (e: any) => {
    setIsFocused(true);
    focusProgress.value = withTiming(1, { duration: 200 });
    onFocus?.(e);
  };

  const handleBlur = (e: any) => {
    setIsFocused(false);
    focusProgress.value = withTiming(0, { duration: 200 });
    onBlur?.(e);
  };

  const bg = colors.surface_white || '#FFFFFF';
  const textColor = colors.text_airy_primary || '#161d18';
  const placeholderColor = colors.text_airy_muted || '#6d7a6f';
  const labelColor = colors.text_airy_secondary || '#3d4a40';

  return (
    <View style={[styles.wrapper, containerStyle]}>
      {label && <Text style={[styles.label, { color: labelColor }]}>{label}</Text>}

      <Animated.View
        style={[
          styles.inputBox,
          {
            backgroundColor: bg,
            borderRadius: radii.input || 16,
          },
          borderAnimatedStyle,
        ]}
      >
        {icon && (
          <Ionicons
            name={icon}
            size={20}
            color={isFocused ? colors.green_vivid : labelColor}
            style={styles.icon}
          />
        )}
        <TextInput
          style={[styles.input, { color: textColor }, inputStyle]}
          placeholderTextColor={placeholderColor}
          onFocus={handleFocus}
          onBlur={handleBlur}
          {...rest}
        />
        {rightLabel && <Text style={[styles.rightLabel, { color: labelColor }]}>{rightLabel}</Text>}
      </Animated.View>

      {!!error && <Text style={[styles.errorText, { color: colors.danger || '#E05C5C' }]}>{error}</Text>}
    </View>
  );
};

const styles = StyleSheet.create({
  wrapper: {
    gap: 6,
  },
  label: {
    fontSize: 12,
    fontWeight: '600',
    letterSpacing: 0.3,
    textTransform: 'uppercase',
  },
  inputBox: {
    height: 52,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    borderWidth: 1.5,
  },
  icon: {
    marginRight: 10,
  },
  input: {
    flex: 1,
    height: '100%',
    fontSize: 15,
  },
  rightLabel: {
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 8,
  },
  errorText: {
    fontSize: 12,
    marginTop: 2,
  },
});
