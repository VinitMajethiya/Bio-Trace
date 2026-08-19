import React, { useEffect } from 'react';
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  Image,
} from 'react-native';
import Animated, { useSharedValue, useAnimatedStyle, withTiming } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useTheme } from '../../providers/ThemeProvider';
import { useAuth } from '../../context/AuthContext';
import { PrimaryButton } from '../../components/common/PrimaryButton';
import { SecondaryButton } from '../../components/common/SecondaryButton';
import { DarkCard } from '../../components/common/BioCard';

export const LANDING_COMPLETED_KEY = '@has_completed_landing_v1';

export const LandingScreen: React.FC = () => {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<any>();
  const { colors, radii, shadows } = useTheme();
  const { user } = useAuth();

  const opacity = useSharedValue(0);

  useEffect(() => {
    opacity.value = withTiming(1, { duration: 400 });
  }, []);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
  }));

  const handleNext = async () => {
    try {
      await AsyncStorage.setItem(LANDING_COMPLETED_KEY, 'true');
    } catch (err) {
      console.warn('[LandingScreen] Failed to save completion:', err);
    }

    if (user) {
      navigation.reset({
        index: 0,
        routes: [{ name: 'MainTabs' }],
      });
    } else {
      navigation.navigate('Auth', { initialMode: 'signup' });
    }
  };

  const handleAlreadyAccount = async () => {
    try {
      await AsyncStorage.setItem(LANDING_COMPLETED_KEY, 'true');
    } catch (err) {
      console.warn('[LandingScreen] Failed to save completion:', err);
    }
    navigation.navigate('Auth', { initialMode: 'login' });
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.canvas_airy || '#f4fbf3' }]}>
      <Animated.View style={[styles.content, animatedStyle]}>
        <ScrollView
          contentContainerStyle={[
            styles.scrollContent,
            { paddingTop: Math.max(insets.top, 24), paddingBottom: 20 },
          ]}
          showsVerticalScrollIndicator={false}
        >
          {/* Header Badge & Title */}
          <View style={styles.headerBlock}>
            <View
              style={[
                styles.iconBadge,
                {
                  backgroundColor: colors.mint_background || '#D9F3E9',
                  borderColor: colors.outline_variant || '#BCCABD',
                },
              ]}
            >
              <Ionicons name="leaf" size={28} color={colors.green_vivid || '#2BB673'} />
            </View>

            <Text style={[styles.brandTag, { color: colors.green_vivid || '#2BB673' }]}>
              WELCOME TO ECOQUEST
            </Text>
            <Text style={[styles.displayTitle, { color: colors.text_airy_primary || '#161d18' }]}>
              Environmental Stewardship as a Living Adventure
            </Text>
          </View>

          {/* Section 1: Why are we building this? */}
          <DarkCard padding={20} style={styles.sectionCard}>
            <View style={styles.cardHeaderRow}>
              <Ionicons name="earth" size={22} color={colors.green_vivid || '#2BB673'} />
              <Text style={[styles.cardHeaderTitle, { color: colors.text_airy_primary || '#161d18' }]}>
                Why are we building this?
              </Text>
            </View>
            <Text style={[styles.bodyText, { color: colors.text_airy_secondary || '#3d4a40' }]}>
              EcoQuest is built to encourage better daily environmental habits, make responsible waste management accessible, and leverage technology to create measurable local impact in your community.
            </Text>
          </DarkCard>

          {/* Section 2: Why is EcoQuest useful? */}
          <DarkCard padding={20} style={styles.sectionCard}>
            <View style={styles.cardHeaderRow}>
              <Ionicons name="sparkles" size={22} color={colors.coral || '#FF9966'} />
              <Text style={[styles.cardHeaderTitle, { color: colors.text_airy_primary || '#161d18' }]}>
                Why is EcoQuest useful?
              </Text>
            </View>

            <View style={styles.benefitList}>
              <View style={styles.benefitRow}>
                <Ionicons name="checkmark-circle" size={18} color={colors.green_vivid || '#2BB673'} />
                <Text style={[styles.benefitText, { color: colors.text_airy_secondary || '#3d4a40' }]}>
                  <Text style={styles.boldLabel}>Encourage Sustainable Habits:</Text> Turn daily waste logging & species sightings into an engaging habit.
                </Text>
              </View>

              <View style={styles.benefitRow}>
                <Ionicons name="checkmark-circle" size={18} color={colors.green_vivid || '#2BB673'} />
                <Text style={[styles.benefitText, { color: colors.text_airy_secondary || '#3d4a40' }]}>
                  <Text style={styles.boldLabel}>Accessible Waste Locker Service:</Text> Doorstep collection drops & cashback rewards for recyclables.
                </Text>
              </View>

              <View style={styles.benefitRow}>
                <Ionicons name="checkmark-circle" size={18} color={colors.green_vivid || '#2BB673'} />
                <Text style={[styles.benefitText, { color: colors.text_airy_secondary || '#3d4a40' }]}>
                  <Text style={styles.boldLabel}>Measurable Local Impact:</Text> Watch your territory Health Score grow alongside neighborhood Eco Societies.
                </Text>
              </View>
            </View>
          </DarkCard>
        </ScrollView>

        {/* Bottom CTA Block */}
        <View
          style={[
            styles.ctaSection,
            {
              backgroundColor: '#FFFFFF',
              borderTopLeftRadius: radii.card_hero || 36,
              borderTopRightRadius: radii.card_hero || 36,
              paddingBottom: Math.max(insets.bottom, 20) + 12,
              paddingTop: 20,
              paddingHorizontal: 24,
            },
            shadows.airy_float,
          ]}
        >
          <PrimaryButton
            title="Next →"
            onPress={handleNext}
            style={styles.btnFull}
          />

          <SecondaryButton
            title="I already have an account"
            onPress={handleAlreadyAccount}
            style={styles.btnFull}
          />
        </View>
      </Animated.View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 24,
    gap: 16,
  },
  headerBlock: {
    gap: 8,
    marginBottom: 8,
  },
  iconBadge: {
    width: 48,
    height: 48,
    borderRadius: 24,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
  },
  brandTag: {
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 1.0,
  },
  displayTitle: {
    fontSize: 30,
    lineHeight: 36,
    fontWeight: '700',
    letterSpacing: -0.6,
  },
  sectionCard: {
    gap: 12,
  },
  cardHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  cardHeaderTitle: {
    fontSize: 18,
    fontWeight: '700',
  },
  bodyText: {
    fontSize: 14,
    lineHeight: 22,
  },
  benefitList: {
    gap: 10,
    marginTop: 4,
  },
  benefitRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
  },
  benefitText: {
    flex: 1,
    fontSize: 13,
    lineHeight: 18,
  },
  boldLabel: {
    fontWeight: '700',
  },
  ctaSection: {
    gap: 10,
    marginTop: 'auto',
  },
  btnFull: {
    width: '100%',
  },
});
