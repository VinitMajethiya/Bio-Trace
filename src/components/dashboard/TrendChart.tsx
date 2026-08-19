import React, { useState } from 'react';
import { StyleSheet, View, Text, TouchableOpacity, LayoutChangeEvent } from 'react-native';
import Svg, { Path, Circle, Defs, LinearGradient, Stop, Line } from 'react-native-svg';

interface TrendChartProps {
  data?: number[];
  labels?: string[];
}

const DEFAULT_DATA = [62, 65, 68, 72, 70, 78];
const DEFAULT_LABELS = ['Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul'];

export const TrendChart: React.FC<TrendChartProps> = ({
  data = DEFAULT_DATA,
  labels = DEFAULT_LABELS,
}) => {
  const [width, setWidth] = useState<number>(320);
  const [activeDot, setActiveDot] = useState<number | null>(null);

  const height = 160;
  const paddingX = 24;
  const paddingY = 20;

  const onLayout = (e: LayoutChangeEvent) => {
    const w = e.nativeEvent.layout.width;
    if (w > 0) setWidth(w);
  };

  const minVal = Math.min(...data) - 5;
  const maxVal = Math.max(...data) + 5;

  const points = data.map((val, idx) => {
    const divisor = data.length > 1 ? data.length - 1 : 1;
    const x = paddingX + (idx / divisor) * (width - paddingX * 2);
    const y = height - paddingY - ((val - minVal) / Math.max(maxVal - minVal, 1)) * (height - paddingY * 2);
    return { x, y, val, label: labels[idx] };
  });

  const linePath = points.reduce((acc, pt, idx) => {
    return idx === 0 ? `M ${pt.x} ${pt.y}` : `${acc} L ${pt.x} ${pt.y}`;
  }, '');

  const areaPath = `${linePath} L ${points[points.length - 1].x} ${height - paddingY} L ${points[0].x} ${height - paddingY} Z`;

  return (
    <View style={styles.card} onLayout={onLayout}>
      <View style={styles.headerRow}>
        <Text style={styles.chartTitle}>6-Month Health Score Trend</Text>
        <Text style={styles.chartSubBadge}>Monthly Trajectory</Text>
      </View>

      <View style={{ height, width }}>
        <Svg width={width} height={height}>
          <Defs>
            <LinearGradient id="trendGradient" x1="0" y1="0" x2="0" y2="1">
              <Stop offset="0%" stopColor="#2BB673" stopOpacity="0.25" />
              <Stop offset="100%" stopColor="#2BB673" stopOpacity="0.0" />
            </LinearGradient>
          </Defs>

          {/* Baseline */}
          <Line
            x1={paddingX}
            y1={height - paddingY}
            x2={width - paddingX}
            y2={height - paddingY}
            stroke="#E8F0E8"
            strokeWidth={1.5}
            strokeDasharray="4,4"
          />

          {/* Gradient Fill */}
          <Path d={areaPath} fill="url(#trendGradient)" />

          {/* Trend Line */}
          <Path d={linePath} fill="none" stroke="#2BB673" strokeWidth={3} strokeLinecap="round" />

          {/* Interactive Dots */}
          {points.map((pt, idx) => (
            <Circle
              key={idx.toString()}
              cx={pt.x}
              cy={pt.y}
              r={activeDot === idx ? 6.5 : 4.5}
              fill="#FFFFFF"
              stroke="#2BB673"
              strokeWidth={2.5}
              onPress={() => setActiveDot(activeDot === idx ? null : idx)}
            />
          ))}
        </Svg>
      </View>

      {/* Synchronized X-Axis Labels */}
      <View style={[styles.labelsContainer, { width, paddingHorizontal: paddingX }]}>
        {points.map((pt, idx) => (
          <TouchableOpacity
            key={idx.toString()}
            onPress={() => setActiveDot(activeDot === idx ? null : idx)}
            style={styles.labelTouch}
          >
            <Text
              style={[
                styles.axisLabel,
                activeDot === idx && styles.axisLabelActive,
              ]}
            >
              {pt.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Tooltip Card */}
      {activeDot !== null && (
        <View style={styles.tooltipCard}>
          <Text style={styles.tooltipText}>
            {points[activeDot].label} · {points[activeDot].val}% Health Score
          </Text>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 16,
    borderWidth: 1,
    borderColor: 'rgba(0, 0, 0, 0.06)',
    gap: 8,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  chartTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: '#161D18',
    letterSpacing: -0.2,
  },
  chartSubBadge: {
    fontSize: 11,
    fontWeight: '700',
    color: '#2BB673',
  },
  labelsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: -10,
    alignSelf: 'center',
  },
  labelTouch: {
    paddingVertical: 4,
    alignItems: 'center',
  },
  axisLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: '#6D7A6F',
  },
  axisLabelActive: {
    color: '#00A86B',
    fontWeight: '800',
  },
  tooltipCard: {
    alignSelf: 'center',
    backgroundColor: '#D9F3E9',
    paddingVertical: 5,
    paddingHorizontal: 12,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: 'rgba(43, 182, 115, 0.3)',
    marginTop: 4,
  },
  tooltipText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#154212',
  },
});
