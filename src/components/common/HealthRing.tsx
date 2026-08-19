import React, { useEffect } from 'react';
import { StyleSheet, View, Text } from 'react-native';
import Svg, { Circle } from 'react-native-svg';
import Animated, {
  useSharedValue,
  useAnimatedProps,
  withTiming,
  Easing,
} from 'react-native-reanimated';
import { useTheme } from '../../providers/ThemeProvider';

const AnimatedCircle = Animated.createAnimatedComponent(Circle);

interface HealthRingProps {
  score: number;
  size?: number;
  strokeWidth?: number;
  showLabel?: boolean;
  showValue?: boolean;
  label?: string;
  trackColor?: string;
}

export const HealthRing: React.FC<HealthRingProps> = ({
  score,
  size = 120,
  strokeWidth = 10,
  showLabel = true,
  showValue = true,
  label,
  trackColor,
}) => {
  const { colors } = useTheme();
  const clampedScore = Math.min(100, Math.max(0, score));

  const center = size / 2;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;

  const progress = useSharedValue(0);

  useEffect(() => {
    progress.value = withTiming(clampedScore / 100, {
      duration: 1000,
      easing: Easing.out(Easing.cubic),
    });
  }, [clampedScore]);

  const animatedProps = useAnimatedProps(() => {
    const strokeDashoffset = circumference * (1 - progress.value);
    return {
      strokeDashoffset,
    };
  });

  const getHealthColor = (val: number) => {
    if (val >= 70) return colors.green_vivid || '#4CAF72';
    if (val >= 40) return colors.amber || '#E8A920';
    return colors.danger || '#E05C5C';
  };

  const ringColor = getHealthColor(clampedScore);
  const bandText = label || (clampedScore >= 70 ? 'Healthy' : clampedScore >= 40 ? 'Moderate' : 'Critical');

  const isMini = size <= 48;
  const strokeTrackColor = trackColor || 'rgba(43, 182, 115, 0.12)';

  return (
    <View style={[styles.container, { width: size, height: size }]}>
      <Svg width={size} height={size}>
        {/* Track */}
        <Circle
          cx={center}
          cy={center}
          r={radius}
          stroke={strokeTrackColor}
          strokeWidth={strokeWidth}
          fill="transparent"
        />
        {/* Fill */}
        <AnimatedCircle
          cx={center}
          cy={center}
          r={radius}
          stroke={ringColor}
          strokeWidth={strokeWidth}
          strokeDasharray={circumference}
          animatedProps={animatedProps}
          strokeLinecap="round"
          fill="transparent"
          transform={`rotate(-90 ${center} ${center})`}
        />
      </Svg>

      {(showValue || showLabel) && (
        <View style={styles.centerContent}>
          {showValue && (
            <Text
              style={[
                styles.scoreText,
                { color: colors.text_on_dark_primary || '#F0F7F1', fontSize: isMini ? size * 0.35 : size * 0.28 },
              ]}
            >
              {Math.round(clampedScore)}
            </Text>
          )}
          {showLabel && !isMini && (
            <Text style={[styles.labelText, { color: ringColor }]}>
              {bandText}
            </Text>
          )}
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  centerContent: {
    position: 'absolute',
    alignItems: 'center',
    justifyContent: 'center',
  },
  scoreText: {
    fontWeight: '700',
    letterSpacing: -0.5,
  },
  labelText: {
    fontSize: 11,
    fontWeight: '600',
    letterSpacing: 0.4,
    textTransform: 'uppercase',
    marginTop: 2,
  },
});
