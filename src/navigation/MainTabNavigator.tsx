import React, { useState } from 'react';
import { StyleSheet, View, Text, TouchableOpacity, Modal } from 'react-native';
import { createBottomTabNavigator, BottomTabBarProps } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { MapScreen } from '../screens/map/MapScreen';
import { WildScreen } from '../screens/wild/WildScreen';
import { TaxonPickerScreen } from '../screens/wild/TaxonPickerScreen';
import { CameraScreen } from '../screens/wild/CameraScreen';
import { ScanResultsScreen } from '../screens/wild/ScanResultsScreen';
import { CircularScreen } from '../screens/circular/CircularScreen';
import { ProfileScreen } from '../screens/profile/ProfileScreen';
import { useTheme } from '../providers/ThemeProvider';
import { DarkCard } from '../components/common/BioCard';

export type MainTabParamList = {
  Map: undefined;
  Wild: { autoScan?: number } | undefined;
  TheLocker: { autoScan?: number } | undefined;
  Profile: undefined;
};

const Tab = createBottomTabNavigator<MainTabParamList>();
const WildStack = createNativeStackNavigator();

const WildStackNavigator: React.FC = () => (
  <WildStack.Navigator screenOptions={{ headerShown: false }}>
    <WildStack.Screen name="WildScreen" component={WildScreen} />
    <WildStack.Screen name="TaxonPickerScreen" component={TaxonPickerScreen} />
    <WildStack.Screen name="CameraScreen" component={CameraScreen} />
    <WildStack.Screen name="ScanResultsScreen" component={ScanResultsScreen} />
  </WildStack.Navigator>
);

const CustomFloatingDock: React.FC<BottomTabBarProps> = ({ state, descriptors, navigation }) => {
  const insets = useSafeAreaInsets();
  const { colors, radii, shadows } = useTheme();
  const [scanModalVisible, setScanModalVisible] = useState(false);

  const handleLaunchScan = (target: 'Wild' | 'TheLocker') => {
    setScanModalVisible(false);
    navigation.navigate(target, { autoScan: Date.now() });
  };

  const handleLaunchDonations = () => {
    setScanModalVisible(false);
    navigation.navigate('Donations');
  };

  const mapRoute = state.routes.find((r) => r.name === 'Map');
  const wildRoute = state.routes.find((r) => r.name === 'Wild');
  const circularRoute = state.routes.find((r) => r.name === 'TheLocker');
  const profileRoute = state.routes.find((r) => r.name === 'Profile');

  const renderTabItem = (route: typeof state.routes[0] | undefined, iconBaseName: string, label: string) => {
    if (!route) return <View style={styles.slot} />;

    const isFocused = state.routes[state.index]?.key === route.key;

    const onPress = () => {
      const event = navigation.emit({
        type: 'tabPress',
        target: route.key,
        canPreventDefault: true,
      });

      if (!isFocused && !event.defaultPrevented) {
        navigation.navigate(route.name);
      }
    };

    const iconName = (isFocused ? iconBaseName : `${iconBaseName}-outline`) as keyof typeof Ionicons.glyphMap;

    return (
      <View style={styles.slot}>
        <TouchableOpacity
          style={styles.tabItem}
          onPress={onPress}
          activeOpacity={0.7}
        >
          <Ionicons
            name={iconName}
            size={22}
            color={isFocused ? (colors.green_vivid || '#2BB673') : (colors.text_airy_muted || '#6d7a6f')}
          />
          {isFocused && <View style={[styles.activeDot, { backgroundColor: colors.green_vivid || '#2BB673' }]} />}
        </TouchableOpacity>
      </View>
    );
  };

  return (
    <>
      <View
        style={[styles.dockWrapper, { paddingBottom: Math.max(insets.bottom, 8) + 12 }]}
        pointerEvents="box-none"
      >
        <View
          style={[
            styles.dockContainer,
            {
              backgroundColor: '#FFFFFF',
              borderRadius: radii.pill,
              borderWidth: 1,
              borderColor: colors.outline_variant || '#BCCABD',
            },
            shadows.floating_dock || shadows.floating,
          ]}
        >
          {/* Slot 1: Map */}
          {renderTabItem(mapRoute, 'map', 'Map')}

          {/* Slot 2: Wild */}
          {renderTabItem(wildRoute, 'leaf', 'Wild')}

          {/* Slot 3: Exact Center 56px Scan FAB */}
          <View style={styles.slot}>
            <TouchableOpacity
              style={styles.fabWrapper}
              onPress={() => setScanModalVisible(true)}
              activeOpacity={0.85}
            >
              <View
                style={[
                  styles.fabCircle,
                  {
                    backgroundColor: colors.green_vivid || '#2BB673',
                  },
                  shadows.fab,
                ]}
              >
                <Ionicons name="add" size={30} color="#FFFFFF" />
              </View>
            </TouchableOpacity>
          </View>

          {/* Slot 4: The Locker */}
          {renderTabItem(circularRoute, 'archive', 'Locker')}

          {/* Slot 5: Profile */}
          {renderTabItem(profileRoute, 'person', 'Profile')}
        </View>
      </View>

      {/* Scan Selection Modal */}
      <Modal visible={scanModalVisible} animationType="slide" transparent>
        <View style={[styles.modalBackdrop, { backgroundColor: 'rgba(22, 29, 24, 0.40)' }]}>
          <View
            style={[
              styles.modalCard,
              {
                backgroundColor: '#FFFFFF',
                borderTopLeftRadius: radii.card_hero || 36,
                borderTopRightRadius: radii.card_hero || 36,
              },
            ]}
          >
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: colors.text_airy_primary || '#161d18' }]}>
                Choose AI Scanner
              </Text>
              <TouchableOpacity onPress={() => setScanModalVisible(false)}>
                <Ionicons name="close" size={24} color={colors.text_airy_muted || '#6d7a6f'} />
              </TouchableOpacity>
            </View>

            <Text style={[styles.modalSub, { color: colors.text_airy_secondary || '#3d4a40' }]}>
              Select the intelligence module to launch:
            </Text>

            {/* Option 1: Wild Species AI Scanner */}
            <DarkCard padding={16} style={styles.optionCard}>
              <TouchableOpacity
                style={styles.optionRow}
                onPress={() => handleLaunchScan('Wild')}
                activeOpacity={0.8}
              >
                <View style={[styles.optionIconBg, { backgroundColor: colors.mint_background || '#D9F3E9' }]}>
                  <Ionicons name="leaf" size={24} color={colors.green_vivid || '#2BB673'} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.optionTitle, { color: colors.text_airy_primary || '#161d18' }]}>
                    🌿 Avian & Wildlife AI Scan
                  </Text>
                  <Text style={[styles.optionSub, { color: colors.text_airy_secondary || '#3d4a40' }]}>
                    Snap species photos in campus pilot zones.
                  </Text>
                </View>
                <Ionicons name="chevron-forward" size={20} color={colors.green_vivid || '#2BB673'} />
              </TouchableOpacity>
            </DarkCard>

            {/* Option 2: The Locker AI Scanner */}
            <DarkCard padding={16} style={styles.optionCard}>
              <TouchableOpacity
                style={styles.optionRow}
                onPress={() => handleLaunchScan('TheLocker')}
                activeOpacity={0.8}
              >
                <View style={[styles.optionIconBg, { backgroundColor: colors.coral_subtle || '#FFDBCC' }]}>
                  <Ionicons name="archive" size={26} color={colors.coral || '#FF9967'} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.optionTitle, { color: colors.text_airy_primary || '#161d18' }]}>
                    ♻️ The Locker AI Scanner
                  </Text>
                  <Text style={[styles.optionSub, { color: colors.text_airy_secondary || '#3d4a40' }]}>
                    Scan recyclables for pickup or DIY upcycling.
                  </Text>
                </View>
                <Ionicons name="chevron-forward" size={20} color={colors.coral || '#FF9967'} />
              </TouchableOpacity>
            </DarkCard>

            {/* Option 3: Give Back & Donations */}
            <DarkCard padding={16} style={styles.optionCard}>
              <TouchableOpacity
                style={styles.optionRow}
                onPress={handleLaunchDonations}
                activeOpacity={0.8}
              >
                <View style={[styles.optionIconBg, { backgroundColor: '#D9F3E9' }]}>
                  <Ionicons name="gift" size={24} color="#00A86B" />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.optionTitle, { color: colors.text_airy_primary || '#161d18' }]}>
                    🌱 Give Back & Donate
                  </Text>
                  <Text style={[styles.optionSub, { color: colors.text_airy_secondary || '#3d4a40' }]}>
                    Share saplings, seeds, compost & tools.
                  </Text>
                </View>
                <Ionicons name="chevron-forward" size={20} color="#00A86B" />
              </TouchableOpacity>
            </DarkCard>
          </View>
        </View>
      </Modal>
    </>
  );
};

export const MainTabNavigator: React.FC = () => {
  return (
    <Tab.Navigator
      tabBar={(props) => <CustomFloatingDock {...props} />}
      screenOptions={{
        headerShown: false,
      }}
    >
      <Tab.Screen name="Map" component={MapScreen} />
      <Tab.Screen name="Wild" component={WildStackNavigator} />
      <Tab.Screen name="TheLocker" component={CircularScreen} />
      <Tab.Screen name="Profile" component={ProfileScreen} />
    </Tab.Navigator>
  );
};

const styles = StyleSheet.create({
  dockWrapper: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'transparent',
    alignItems: 'center',
    paddingHorizontal: 24,
  },
  dockContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    height: 64,
    width: '100%',
    paddingHorizontal: 12,
  },
  slot: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tabItem: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  activeDot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    marginTop: 2,
  },
  fabWrapper: {
    alignItems: 'center',
    justifyContent: 'center',
    top: -12,
  },
  fabCircle: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalBackdrop: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  modalCard: {
    padding: 24,
    gap: 14,
    paddingBottom: 36,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  modalTitle: {
    fontSize: 22,
    fontWeight: '700',
  },
  modalSub: {
    fontSize: 14,
    marginBottom: 4,
  },
  optionCard: {
    borderRadius: 20,
  },
  optionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  optionIconBg: {
    width: 46,
    height: 46,
    borderRadius: 23,
    alignItems: 'center',
    justifyContent: 'center',
  },
  optionTitle: {
    fontSize: 16,
    fontWeight: '700',
  },
  optionSub: {
    fontSize: 12,
    marginTop: 2,
  },
});
