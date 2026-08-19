import React, { useEffect } from 'react';
import { StyleSheet, Text, View, TouchableOpacity, ScrollView } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withDelay,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { TaxonGroup } from '../../constants/rarityTiers';
import { IconButton } from '../../components/common/IconButton';

interface TaxonOption {
  id: TaxonGroup;
  title: string;
  subtitle: string;
  icon: keyof typeof Ionicons.glyphMap;
  badgeBg: string;
  iconColor: string;
  guidance: string;
}

const TAXON_OPTIONS: TaxonOption[] = [
  {
    id: 'birds',
    title: 'Birds',
    subtitle: 'Aves & Raptors',
    icon: 'leaf-outline',
    badgeBg: '#DCFCE7',
    iconColor: '#16A34A',
    guidance: 'Point at plumage, beak, or in flight for regional scoring.',
  },
  {
    id: 'plants',
    title: 'Plants',
    subtitle: 'Trees & Wildflowers',
    icon: 'flower-outline',
    badgeBg: '#FEF3C7',
    iconColor: '#D97706',
    guidance: 'Focus closely on leaves, flowers, or bark.',
  },
  {
    id: 'insects',
    title: 'Insects',
    subtitle: 'Butterflies & Pollinators',
    icon: 'bug-outline',
    badgeBg: '#E0F2FE',
    iconColor: '#0284C7',
    guidance: 'Hold steady close to flowers or natural habitats.',
  },
  {
    id: 'wildlife',
    title: 'Wildlife',
    subtitle: 'Mammals & Reptiles',
    icon: 'paw-outline',
    badgeBg: '#F3E8FF',
    iconColor: '#9333EA',
    guidance: 'Focus on body shape, scales, or facial features.',
  },
];

const AnimatedCard: React.FC<{
  option: TaxonOption;
  index: number;
  onSelect: (option: TaxonOption) => void;
}> = ({ option, index, onSelect }) => {
  const opacity = useSharedValue(0);
  const translateY = useSharedValue(15);

  useEffect(() => {
    opacity.value = withDelay(index * 60, withTiming(1, { duration: 250 }));
    translateY.value = withDelay(index * 60, withTiming(0, { duration: 250 }));
  }, [index]);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ translateY: translateY.value }],
  }));

  return (
    <Animated.View style={[styles.cardCol, animatedStyle]}>
      <TouchableOpacity
        onPress={() => onSelect(option)}
        activeOpacity={0.8}
        style={styles.gridCard}
      >
        <View style={[styles.iconBadge, { backgroundColor: option.badgeBg }]}>
          <Ionicons name={option.icon} size={22} color={option.iconColor} />
        </View>
        <Text style={styles.cardTitle}>{option.title}</Text>
        <Text style={styles.cardSub}>{option.subtitle}</Text>
        <Text style={styles.guidanceText}>{option.guidance}</Text>
      </TouchableOpacity>
    </Animated.View>
  );
};

export const TaxonPickerScreen: React.FC = () => {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<any>();

  const handleSelectTaxon = (option: TaxonOption) => {
    navigation.navigate('CameraScreen', {
      taxonGroup: option.id,
      guidance: option.guidance,
    });
  };

  return (
    <View style={[styles.container, { backgroundColor: '#F6FBF7', paddingTop: Math.max(insets.top, 16) }]}>
      {/* Top Header */}
      <View style={styles.topHeader}>
        <IconButton icon="arrow-back" onPress={() => navigation.goBack()} />
        <Text style={styles.headerTitle}>Select Species Taxon</Text>
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={{ gap: 4 }}>
          <Text style={styles.headingText}>What are you scanning?</Text>
          <Text style={styles.headingSub}>
            Tuning the taxon filter helps iNaturalist AI focus on regional species models.
          </Text>
        </View>

        {/* 2x2 Grid */}
        <View style={styles.gridContainer}>
          {TAXON_OPTIONS.map((option, idx) => (
            <AnimatedCard
              key={option.id}
              option={option}
              index={idx}
              onSelect={handleSelectTaxon}
            />
          ))}
        </View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  topHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    gap: 8,
    marginBottom: 4,
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: '#0F172A',
  },
  content: {
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 40,
    gap: 16,
  },
  headingText: {
    fontSize: 24,
    fontWeight: '800',
    color: '#0F172A',
    letterSpacing: -0.4,
  },
  headingSub: {
    fontSize: 13,
    lineHeight: 18,
    color: '#64748B',
  },
  gridContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  cardCol: {
    width: '48%',
  },
  gridCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    padding: 16,
    gap: 4,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    minHeight: 160,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 1,
  },
  iconBadge: {
    width: 42,
    height: 42,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 6,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#0F172A',
  },
  cardSub: {
    fontSize: 11,
    fontWeight: '600',
    color: '#64748B',
  },
  guidanceText: {
    fontSize: 10,
    lineHeight: 14,
    color: '#94A3B8',
    marginTop: 4,
  },
});
