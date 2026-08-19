import React, { useState, useRef } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  FlatList,
  Dimensions,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useTheme } from '../../providers/ThemeProvider';
import { PrimaryButton } from '../../components/common/PrimaryButton';
import { useAuth } from '../../context/AuthContext';
import { supabase } from '../../lib/supabase';

export const ONBOARDING_COMPLETED_KEY = '@has_completed_onboarding_v1';
const { width: SCREEN_WIDTH } = Dimensions.get('window');

interface OnboardingSlide {
  id: string;
  title: string;
  subtitle: string;
  icon: keyof typeof Ionicons.glyphMap;
  description: string;
}

const SLIDES: OnboardingSlide[] = [
  {
    id: 'slide-1',
    title: 'One Territory Score,\nTwo Ways to Help it Grow',
    subtitle: 'WILD & CIRCULAR ECOSYSTEM',
    icon: 'leaf-outline',
    description:
      'Log native bird species with AI species recognition or scan recyclables for campus locker pickups. Both actions directly boost your community Health Score!',
  },
  {
    id: 'slide-2',
    title: 'Community Societies &\nCamera-Verified Bio Abhiyans',
    subtitle: 'DEMOCRATIC GOVERNANCE',
    icon: 'shield-checkmark-outline',
    description:
      'Join local neighborhood societies, vote in quarterly democratic elections for Bio Veers, and participate in camera-verified group Bio Abhiyans for bonus GreenPoints!',
  },
  {
    id: 'slide-3',
    title: 'Join Your Society &\nStart Your Eco Journey',
    subtitle: 'LOCAL IMPACT',
    icon: 'planet-outline',
    description:
      'Select your local society to view live territory health overlay maps, claim GreenPoints rewards, and upcycle waste with DIY community projects.',
  },
];

export const OnboardingScreen: React.FC = () => {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<any>();
  const { colors, radii } = useTheme();
  const { user } = useAuth();
  const [currentIndex, setCurrentIndex] = useState<number>(0);
  const flatListRef = useRef<FlatList>(null);

  const completeOnboarding = async () => {
    try {
      await AsyncStorage.setItem(ONBOARDING_COMPLETED_KEY, 'true');
      if (user?.id) {
        await supabase.from('users').update({ onboarding_completed: true }).eq('id', user.id);
      }
    } catch (err) {
      console.warn('[Onboarding] Error persisting completion flag:', err);
    }
    navigation.replace('AppStory');
  };

  const handleScroll = (event: any) => {
    const slideSize = event.nativeEvent.layoutMeasurement.width;
    const index = Math.round(event.nativeEvent.contentOffset.x / slideSize);
    if (index !== currentIndex) {
      setCurrentIndex(index);
    }
  };

  const handleNext = () => {
    if (currentIndex < SLIDES.length - 1) {
      flatListRef.current?.scrollToIndex({ index: currentIndex + 1, animated: true });
    } else {
      completeOnboarding();
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.canvas_airy || '#f4fbf3', paddingTop: Math.max(insets.top, 16) }]}>
      {/* Header Row */}
      <View style={styles.headerRow}>
        <View style={styles.brandRow}>
          <Ionicons name="leaf" size={24} color={colors.green_vivid || '#2BB673'} />
          <Text style={[styles.brandText, { color: colors.text_airy_primary || '#161d18' }]}>EcoQuest</Text>
        </View>

        <TouchableOpacity onPress={() => completeOnboarding()} activeOpacity={0.7} style={styles.skipBtn}>
          <Text style={[styles.skipText, { color: colors.text_airy_muted || '#6d7a6f' }]}>Skip</Text>
        </TouchableOpacity>
      </View>

      {/* 3-Slide Pager */}
      <FlatList
        ref={flatListRef}
        data={SLIDES}
        keyExtractor={(item) => item.id}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onScroll={handleScroll}
        scrollEventThrottle={16}
        renderItem={({ item }) => (
          <View style={[styles.slide, { width: SCREEN_WIDTH }]}>
            <View style={[styles.iconCircle, { backgroundColor: colors.mint_background || '#D9F3E9', borderColor: colors.outline_variant || '#BCCABD', borderWidth: 1.5 }]}>
              <Ionicons name={item.icon} size={58} color={colors.green_vivid || '#2BB673'} />
            </View>

            <Text style={[styles.subtitle, { color: colors.green_vivid || '#2BB673' }]}>{item.subtitle}</Text>
            <Text style={[styles.title, { color: colors.text_airy_primary || '#161d18' }]}>{item.title}</Text>
            <Text style={[styles.description, { color: colors.text_airy_secondary || '#3d4a40' }]}>
              {item.description}
            </Text>
          </View>
        )}
      />

      {/* Footer Navigation */}
      <View style={[styles.footer, { paddingBottom: Math.max(insets.bottom, 24) }]}>
        <View style={styles.dotsRow}>
          {SLIDES.map((_, idx) => (
            <View
              key={idx}
              style={[
                styles.dot,
                {
                  backgroundColor: idx === currentIndex ? (colors.green_vivid || '#2BB673') : (colors.outline_variant || '#BCCABD'),
                  width: idx === currentIndex ? 28 : 8,
                  opacity: idx === currentIndex ? 1.0 : 0.5,
                },
              ]}
            />
          ))}
        </View>

        <PrimaryButton
          title={currentIndex === SLIDES.length - 1 ? 'Join Local Society & Start' : 'Next'}
          icon={currentIndex === SLIDES.length - 1 ? 'arrow-forward' : 'chevron-forward'}
          onPress={handleNext}
          style={{ width: '100%' }}
        />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'space-between',
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 24,
  },
  brandRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  brandText: {
    fontSize: 20,
    fontWeight: '700',
  },
  skipBtn: {
    padding: 8,
  },
  skipText: {
    fontSize: 14,
    fontWeight: '600',
  },
  slide: {
    paddingHorizontal: 28,
    justifyContent: 'center',
    alignItems: 'center',
    textAlign: 'center',
    gap: 16,
  },
  iconCircle: {
    width: 110,
    height: 110,
    borderRadius: 55,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 0.8,
    textAlign: 'center',
  },
  title: {
    fontSize: 26,
    lineHeight: 32,
    fontWeight: '700',
    textAlign: 'center',
    letterSpacing: -0.4,
  },
  description: {
    fontSize: 15,
    lineHeight: 22,
    textAlign: 'center',
    maxWidth: 320,
  },
  footer: {
    paddingHorizontal: 24,
    gap: 20,
  },
  dotsRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
  },
  dot: {
    height: 8,
    borderRadius: 4,
  },
});
