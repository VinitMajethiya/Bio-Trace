import React, { useState } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  SafeAreaView,
  Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../providers/ThemeProvider';
import { BioCard } from '../../components/common/BioCard';
import { PrimaryButton } from '../../components/common/PrimaryButton';

const { width } = Dimensions.get('window');

export interface OnboardingSlide {
  id: string;
  title: string;
  subtitle: string;
  description: string;
  icon: keyof typeof Ionicons.glyphMap;
  color: string;
  bgSubtle: string;
}

const SLIDES: OnboardingSlide[] = [
  {
    id: 'slide-1',
    title: 'Welcome to BioVerse',
    subtitle: 'One score. Two ways to help it grow.',
    description: 'Restore campus ecosystems by connecting wildlife biodiversity observation with local circular waste recycling.',
    icon: 'earth',
    color: '#059669',
    bgSubtle: '#E6F4EA',
  },
  {
    id: 'slide-2',
    title: 'Wild AI Identification',
    subtitle: 'Snap & ID Birds & Wildlife',
    description: 'Spot species in campus pilot zones to record GPS observations, earn Wild XP, and boost Ecosystem Health Score.',
    icon: 'camera',
    color: '#059669',
    bgSubtle: '#E6F4EA',
  },
  {
    id: 'slide-3',
    title: 'Circular Waste Marketplace',
    subtitle: 'Scan & Upcycle Recyclables',
    description: 'Log recyclable waste drop-offs at Smart Eco-Lockers to earn GreenPoints, cash payouts, and protect the territory.',
    icon: 'sync-circle',
    color: '#2563EB',
    bgSubtle: '#EFF6FF',
  },
];

interface OnboardingScreenProps {
  onComplete: () => void;
}

export const OnboardingScreen: React.FC<OnboardingScreenProps> = ({ onComplete }) => {
  const { colors, radii } = useTheme();
  const [currentIndex, setCurrentIndex] = useState(0);

  const currentSlide = SLIDES[currentIndex];
  const isLastSlide = currentIndex === SLIDES.length - 1;

  const handleNext = () => {
    if (isLastSlide) {
      onComplete();
    } else {
      setCurrentIndex(prev => prev + 1);
    }
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Top Bar with Skip */}
      <View style={styles.topBar}>
        <View style={{ flex: 1 }} />
        <TouchableOpacity onPress={onComplete} style={styles.skipBtn} activeOpacity={0.7}>
          <Text style={[styles.skipText, { color: colors.textSecondary }]}>Skip</Text>
        </TouchableOpacity>
      </View>

      {/* Main Slide Display */}
      <View style={styles.slideContainer}>
        <View style={[styles.iconWrapper, { backgroundColor: currentSlide.bgSubtle, borderColor: currentSlide.color }]}>
          <Ionicons name={currentSlide.icon} size={64} color={currentSlide.color} />
        </View>

        <View style={styles.textGroup}>
          <Text style={[styles.slideTitle, { color: colors.textPrimary }]}>{currentSlide.title}</Text>
          <Text style={[styles.slideSubtitle, { color: currentSlide.color }]}>{currentSlide.subtitle}</Text>
          <Text style={[styles.slideDesc, { color: colors.textSecondary }]}>{currentSlide.description}</Text>
        </View>
      </View>

      {/* Pagination & Footer Controls */}
      <View style={styles.footer}>
        {/* Step Indicator Dots */}
        <View style={styles.paginationRow}>
          {SLIDES.map((slide, idx) => {
            const isActive = idx === currentIndex;
            return (
              <View
                key={slide.id}
                style={[
                  styles.dot,
                  {
                    backgroundColor: isActive ? currentSlide.color : colors.surfaceBorder,
                    width: isActive ? 24 : 8,
                  },
                ]}
              />
            );
          })}
        </View>

        {/* Primary Action Button */}
        <PrimaryButton
          title={isLastSlide ? 'Get Started' : 'Next'}
          icon={isLastSlide ? 'rocket-outline' : 'arrow-forward-outline'}
          onPress={handleNext}
          style={styles.actionBtn}
        />
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'space-between',
  },
  topBar: {
    height: 48,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  skipBtn: {
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  skipText: {
    fontSize: 14,
    fontWeight: '700',
  },
  slideContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 32,
    gap: 28,
  },
  iconWrapper: {
    width: 140,
    height: 140,
    borderRadius: 70,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  textGroup: {
    alignItems: 'center',
    gap: 8,
  },
  slideTitle: {
    fontSize: 26,
    fontWeight: '800',
    textAlign: 'center',
  },
  slideSubtitle: {
    fontSize: 15,
    fontWeight: '800',
    textAlign: 'center',
  },
  slideDesc: {
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
    marginTop: 4,
  },
  footer: {
    paddingHorizontal: 24,
    paddingBottom: 32,
    gap: 20,
    alignItems: 'center',
  },
  paginationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  dot: {
    height: 8,
    borderRadius: 4,
  },
  actionBtn: {
    width: '100%',
  },
});
