import React, { useState } from 'react';
import { StyleSheet, View, Text, TouchableOpacity, LayoutAnimation } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { factorColor } from './GaugeRing';

export interface FactorItem {
  id: string;
  name: string;
  weight: string;
  score: number;
  delta: number;
  iconName: keyof typeof MaterialCommunityIcons.glyphMap;
  iconBg: string;
  iconColor: string;
  detail: string;
  subMetricALabel: string;
  subMetricAVal: string;
  subMetricBLabel: string;
  subMetricBVal: string;
}

export const DEFAULT_FACTORS: FactorItem[] = [
  {
    id: 'biodiversity',
    name: 'AI Biodiversity Index',
    weight: '20%',
    score: 72,
    delta: 4,
    iconName: 'leaf',
    iconBg: '#D9F3E9',
    iconColor: '#00A86B',
    detail: 'Evaluates native species observations logged with AI verification across campus territory.',
    subMetricALabel: 'Species Observations',
    subMetricAVal: '142 logged',
    subMetricBLabel: 'Taxon Richness',
    subMetricBVal: '4 categories',
  },
  {
    id: 'diversion',
    name: 'Waste Diversion Rate',
    weight: '20%',
    score: 68,
    delta: 2,
    iconName: 'recycle',
    iconBg: '#D9F3E9',
    iconColor: '#00A86B',
    detail: 'Measures dry waste diverted from landfills via locker collection and kabadiwala pickups.',
    subMetricALabel: 'Diverted Material',
    subMetricAVal: '840 kg',
    subMetricBLabel: 'Locker Velocity',
    subMetricBVal: '12 pickups/wk',
  },
  {
    id: 'carbon',
    name: 'Carbon Impact (CO₂e)',
    weight: '20%',
    score: 80,
    delta: 6,
    iconName: 'molecule-co2',
    iconBg: '#EFF6FF',
    iconColor: '#3B82F6',
    detail: 'Calculates avoided greenhouse gas emissions from organic composting and recycling.',
    subMetricALabel: 'CO₂ Abated',
    subMetricAVal: '62 tonnes',
    subMetricBLabel: 'Equiv. Trees Planted',
    subMetricBVal: '1,420 trees',
  },
  {
    id: 'ewaste',
    name: 'E-Waste Safe Diversion',
    weight: '15%',
    score: 58,
    delta: -1,
    iconName: 'chip',
    iconBg: '#FFDBCC',
    iconColor: '#FF9966',
    detail: 'Tracks hazardous e-waste items turned in to authorized recycling drop-off centers.',
    subMetricALabel: 'E-Waste Collected',
    subMetricAVal: '45 items',
    subMetricBLabel: 'Toxic Metal Safe',
    subMetricBVal: '12.4 kg',
  },
  {
    id: 'institutional',
    name: 'Institutional Compliance',
    weight: '15%',
    score: 50,
    delta: 0,
    iconName: 'office-building',
    iconBg: '#F3E8FF',
    iconColor: '#8B5CF6',
    detail: 'Measures participation across society administration, hostels, and cafeteria units.',
    subMetricALabel: 'Onboarded Units',
    subMetricAVal: '4 of 8 units',
    subMetricBLabel: 'Audit Status',
    subMetricBVal: 'Pending Review',
  },
  {
    id: 'participation',
    name: 'Clan & Community',
    weight: '10%',
    score: 85,
    delta: 8,
    iconName: 'account-group',
    iconBg: '#D9F3E9',
    iconColor: '#2BB673',
    detail: 'Active member count contributing to Clean Raids and weekly eco-challenges.',
    subMetricALabel: 'Active Clan Members',
    subMetricAVal: '184 users',
    subMetricBLabel: 'Clean Raids Done',
    subMetricBVal: '14 events',
  },
];

interface FactorGridProps {
  factors?: FactorItem[];
}

export const FactorGrid: React.FC<FactorGridProps> = ({ factors = DEFAULT_FACTORS }) => {
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const toggleExpand = (id: string) => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setExpandedId(expandedId === id ? null : id);
  };

  return (
    <View style={styles.container}>
      <View style={styles.headerRow}>
        <Text style={styles.headerTitle}>Score Breakdown</Text>
        <Text style={styles.headerBadge}>6 Weighted Factors</Text>
      </View>

      <View style={styles.grid}>
        {factors.map((item) => {
          const isExpanded = expandedId === item.id;
          const strokeColor = factorColor(item.score);

          return (
            <TouchableOpacity
              key={item.id}
              style={[
                styles.card,
                isExpanded && styles.cardExpanded,
              ]}
              onPress={() => toggleExpand(item.id)}
              activeOpacity={0.85}
            >
              {/* Header */}
              <View style={styles.cardTop}>
                <View style={[styles.iconBg, { backgroundColor: item.iconBg }]}>
                  <MaterialCommunityIcons name={item.iconName} size={18} color={item.iconColor} />
                </View>

                <View style={styles.weightPill}>
                  <Text style={styles.weightText}>{item.weight}</Text>
                </View>
              </View>

              {/* Title */}
              <Text style={styles.factorName} numberOfLines={2}>
                {item.name}
              </Text>

              {/* Score & Delta Row */}
              <View style={styles.scoreRow}>
                <View style={styles.scoreTextGroup}>
                  <Text style={styles.scoreVal}>{item.score}</Text>
                  <Text style={styles.scoreMax}>/100</Text>
                </View>

                <View
                  style={[
                    styles.deltaBadge,
                    {
                      backgroundColor:
                        item.delta > 0
                          ? 'rgba(43, 182, 115, 0.12)'
                          : item.delta < 0
                          ? 'rgba(186, 26, 26, 0.12)'
                          : 'rgba(109, 122, 111, 0.12)',
                    },
                  ]}
                >
                  <Text
                    style={[
                      styles.deltaText,
                      { color: item.delta > 0 ? '#15803D' : item.delta < 0 ? '#BA1A1A' : '#6D7A6F' },
                    ]}
                  >
                    {item.delta > 0 ? `+${item.delta}` : item.delta < 0 ? `${item.delta}` : '—'}
                  </Text>
                </View>
              </View>

              {/* Progress Bar */}
              <View style={styles.progressTrack}>
                <View
                  style={[
                    styles.progressFill,
                    { width: `${item.score}%`, backgroundColor: strokeColor },
                  ]}
                />
              </View>

              {/* Expand Toggle */}
              <View style={styles.chevronRow}>
                <MaterialCommunityIcons
                  name={isExpanded ? 'chevron-up' : 'chevron-down'}
                  size={16}
                  color="#6D7A6F"
                />
              </View>

              {/* Expanded Detail */}
              {isExpanded && (
                <View style={styles.expandedContent}>
                  <View style={styles.divider} />
                  <Text style={styles.detailText}>{item.detail}</Text>

                  <View style={styles.subRow}>
                    <Text style={styles.subLabel}>{item.subMetricALabel}</Text>
                    <Text style={styles.subVal}>{item.subMetricAVal}</Text>
                  </View>

                  <View style={styles.subRow}>
                    <Text style={styles.subLabel}>{item.subMetricBLabel}</Text>
                    <Text style={styles.subVal}>{item.subMetricBVal}</Text>
                  </View>
                </View>
              )}
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    gap: 12,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 2,
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#161D18',
    letterSpacing: -0.3,
  },
  headerBadge: {
    fontSize: 11,
    fontWeight: '700',
    color: '#00A86B',
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    gap: 12,
  },
  card: {
    width: '48%',
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    padding: 13,
    borderWidth: 1,
    borderColor: 'rgba(0, 0, 0, 0.06)',
    gap: 7,
  },
  cardExpanded: {
    borderColor: '#2BB673',
    backgroundColor: '#F7FCF7',
  },
  cardTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  iconBg: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  weightPill: {
    backgroundColor: '#FFF5E5',
    paddingVertical: 2,
    paddingHorizontal: 6,
    borderRadius: 8,
  },
  weightText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#97481B',
  },
  factorName: {
    fontSize: 12,
    fontWeight: '700',
    color: '#161D18',
    minHeight: 32,
    lineHeight: 16,
  },
  scoreRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 2,
  },
  scoreTextGroup: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 2,
  },
  scoreVal: {
    fontSize: 19,
    fontWeight: '800',
    color: '#154212',
  },
  scoreMax: {
    fontSize: 10,
    color: '#6D7A6F',
    fontWeight: '600',
  },
  deltaBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  deltaText: {
    fontSize: 11,
    fontWeight: '800',
  },
  progressTrack: {
    height: 5,
    backgroundColor: '#E8F0E8',
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 3,
  },
  chevronRow: {
    alignItems: 'center',
    marginTop: 1,
  },
  expandedContent: {
    gap: 6,
    paddingTop: 2,
  },
  divider: {
    height: 1,
    backgroundColor: '#E2EFE3',
    marginVertical: 3,
  },
  detailText: {
    fontSize: 10,
    color: '#3D4A40',
    lineHeight: 14,
  },
  subRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  subLabel: {
    fontSize: 10,
    color: '#6D7A6F',
  },
  subVal: {
    fontSize: 10,
    fontWeight: '700',
    color: '#161D18',
  },
});
