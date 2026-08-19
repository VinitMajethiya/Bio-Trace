import React, { useEffect, useState } from 'react';
import { View, ActivityIndicator, StyleSheet } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useAuth } from '../context/AuthContext';
import { AuthScreen } from '../screens/auth/AuthScreen';
import { MainTabNavigator } from './MainTabNavigator';
import { WalletScreen } from '../screens/wallet/WalletScreen';
import { LeaderboardScreen } from '../screens/leaderboard/LeaderboardScreen';
import { RewardsScreen } from '../screens/rewards/RewardsScreen';
import { SocietyPickerScreen } from '../screens/society/SocietyPickerScreen';
import { ElectionScreen } from '../screens/society/ElectionScreen';
import { DashboardScreen } from '../screens/dashboard/DashboardScreen';
import { DiyProjectsScreen } from '../screens/diy/DiyProjectsScreen';
import { CreateRaidScreen } from '../screens/raids/CreateRaidScreen';
import { RaidDetailScreen } from '../screens/raids/RaidDetailScreen';
import { ModeratorReviewScreen } from '../screens/raids/ModeratorReviewScreen';
import { PartnerExportScreen } from '../screens/export/PartnerExportScreen';
import { OnboardingScreen, ONBOARDING_COMPLETED_KEY } from '../screens/onboarding/OnboardingScreen';
import { AppStoryScreen } from '../screens/onboarding/AppStoryScreen';
import { LandingScreen, LANDING_COMPLETED_KEY } from '../screens/onboarding/LandingScreen';
import { DonationsScreen } from '../features/donations/screens/DonationsScreen';
import { supabase } from '../lib/supabase';

export type RootStackParamList = {
  Landing: undefined;
  Auth: { initialMode?: 'login' | 'signup' } | undefined;
  Onboarding: undefined;
  AppStory: undefined;
  MainTabs: undefined;
  Wallet: undefined;
  Leaderboard: undefined;
  Rewards: undefined;
  SocietyPicker: undefined;
  Election: undefined;
  Dashboard: undefined;
  DiyProjects: { initialCategoryId?: string } | undefined;
  CreateRaid: undefined;
  RaidDetail: { raidId: string };
  ModeratorReview: undefined;
  PartnerExport: undefined;
  Donations: undefined;
};

const Stack = createNativeStackNavigator<RootStackParamList>();

export const RootNavigator: React.FC = () => {
  const { user, loading: authLoading } = useAuth();
  const [hasCompletedOnboarding, setHasCompletedOnboarding] = useState<boolean | null>(null);
  const [hasCompletedLanding, setHasCompletedLanding] = useState<boolean | null>(null);

  useEffect(() => {
    const checkState = async () => {
      try {
        const landingVal = await AsyncStorage.getItem(LANDING_COMPLETED_KEY);
        setHasCompletedLanding(landingVal === 'true');

        const localVal = await AsyncStorage.getItem(ONBOARDING_COMPLETED_KEY);
        if (localVal === 'true') {
          setHasCompletedOnboarding(true);
          return;
        }

        if (user?.id) {
          const { data } = await supabase
            .from('users')
            .select('onboarding_completed')
            .eq('id', user.id)
            .single();

          if (data?.onboarding_completed) {
            await AsyncStorage.setItem(ONBOARDING_COMPLETED_KEY, 'true');
            setHasCompletedOnboarding(true);
            return;
          }
        }
        setHasCompletedOnboarding(false);
      } catch (err) {
        setHasCompletedLanding(false);
        setHasCompletedOnboarding(false);
      }
    };

    checkState();
  }, [user]);

  if (authLoading || hasCompletedLanding === null || (user && hasCompletedOnboarding === null)) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#2BB673" />
      </View>
    );
  }

  return (
    <NavigationContainer>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        {!user ? (
          <>
            {!hasCompletedLanding && (
              <Stack.Screen name="Landing" component={LandingScreen} />
            )}
            <Stack.Screen name="Auth" component={AuthScreen} />
          </>
        ) : (
          <>
            {!hasCompletedOnboarding && (
              <Stack.Screen name="Onboarding" component={OnboardingScreen} />
            )}
            <Stack.Screen name="AppStory" component={AppStoryScreen} />
            <Stack.Screen name="MainTabs" component={MainTabNavigator} />
            <Stack.Screen name="Wallet" component={WalletScreen} />
            <Stack.Screen name="Leaderboard" component={LeaderboardScreen} />
            <Stack.Screen name="Rewards" component={RewardsScreen} />
            <Stack.Screen name="SocietyPicker" component={SocietyPickerScreen} />
            <Stack.Screen name="Election" component={ElectionScreen} />
            <Stack.Screen name="Dashboard" component={DashboardScreen} />
            <Stack.Screen name="DiyProjects" component={DiyProjectsScreen} />
            <Stack.Screen name="CreateRaid" component={CreateRaidScreen} />
            <Stack.Screen name="RaidDetail" component={RaidDetailScreen} />
            <Stack.Screen name="ModeratorReview" component={ModeratorReviewScreen} />
            <Stack.Screen name="PartnerExport" component={PartnerExportScreen} />
            <Stack.Screen name="Donations" component={DonationsScreen} />
          </>
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
};

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    backgroundColor: '#F4F7F5',
    alignItems: 'center',
    justifyContent: 'center',
  },
});
