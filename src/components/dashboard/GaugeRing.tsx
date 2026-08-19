import React from 'react';
import { StyleSheet, View, Text } from 'react-native';
import Svg, { Circle } from 'react-native-svg';

const RADIUS = 84;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;
const SIZE = 220;

export function factorColor(score: number): string {
  if (score >= 75) return '#4CAF72';
  if (score >= 55) return '#E8A920';
  return '#E85454';
}

export function getBandBadge(score: number): { label: string; bg: string; text: string } {
  if (score >= 85) return { label: 'Excellent', bg: '#4CAF72', text: '#FFFFFF' };
  if (score >= 70) return { label: 'Good', bg: '#2A3D2A', text: '#A8D5B5' };
  if (score >= 55) return { label: 'Fair', bg: '#E8A920', text: '#FFFFFF' };
  if (score >= 40) return { label: 'Needs Att.', bg: '#8B6914', text: '#FFFFFF' };
  return { label: 'Critical', bg: '#E85454', text: '#FFFFFF' };
}

interface GaugeRingProps {
  score: number;
}

export const GaugeRing: React.FC<GaugeRingProps> = ({ score }) => {
  const strokeDashoffset = CIRCUMFERENCE - (score / 100) * CIRCUMFERENCE;

  const band = getBandBadge(score);

  return (
    <View style={styles.container}>
      <Svg width={SIZE} height={SIZE} style={{ transform: [{ rotate: '-90deg' }] }}>
        {/* Track */}
        <Circle
          cx={SIZE / 2}
          cy={SIZE / 2}
          r={RADIUS}
          fill="none"
          stroke="#2A3D2A"
          strokeWidth={18}
        />
        {/* Fill Arc */}
        <Circle
          cx={SIZE / 2}
          cy={SIZE / 2}
          r={RADIUS}
          fill="none"
          stroke={factorColor(score)}
          strokeWidth={18}
          strokeDasharray={CIRCUMFERENCE}
          strokeDashoffset={strokeDashoffset}
          strokeLinecap="round"
        />
      </Svg>

      {/* Center Overlay */}
      <View style={styles.gaugeCenter}>
        <Text style={styles.scoreText}>{Math.round(score)}</Text>
        <Text style={styles.maxText}>/ 100</Text>

        <View style={[styles.badge, { backgroundColor: band.bg }]}>
          <Text style={[styles.badgeText, { color: band.text }]}>{band.label}</Text>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: SIZE,
    height: SIZE,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  gaugeCenter: {
    position: 'absolute',
    alignItems: 'center',
    justifyContent: 'center',
  },
  scoreText: {
    fontSize: 48,
    fontWeight: '800',
    color: '#E8F0E8',
  },
  maxText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#9AB09A',
    marginTop: -4,
  },
  badge: {
    paddingVertical: 4,
    paddingHorizontal: 12,
    borderRadius: 12,
    marginTop: 6,
  },
  badgeText: {
    fontSize: 11,
    fontWeight: '800',
  },
});
