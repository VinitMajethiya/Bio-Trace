import React, { useState } from 'react';
import { StyleSheet, View, Text, TouchableOpacity, Modal } from 'react-native';
import { createBottomTabNavigator, BottomTabBarProps } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { MapScreen } from '../screens/map/MapScreen';
import { WildScreen } from '../screens/wild/WildScreen';
import { CircularScreen } from '../screens/circular/CircularScreen';
import { ProfileScreen } from '../screens/profile/ProfileScreen';

export type MainTabParamList = {
  Map: undefined;
  Wild: { autoScan?: number } | undefined;
  Circular: { autoScan?: number } | undefined;
  Profile: undefined;
};

const Tab = createBottomTabNavigator<MainTabParamList>();

const CustomFloatingDock: React.FC<BottomTabBarProps> = ({ state, descriptors, navigation }) => {
  const insets = useSafeAreaInsets();
  const [scanModalVisible, setScanModalVisible] = useState(false);

  const handleLaunchScan = (target: 'Wild' | 'Circular') => {
    setScanModalVisible(false);
    navigation.navigate(target, { autoScan: Date.now() });
  };

  const mapRoute = state.routes.find((r) => r.name === 'Map');
  const wildRoute = state.routes.find((r) => r.name === 'Wild');
  const circularRoute = state.routes.find((r) => r.name === 'Circular');
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
          style={[styles.tabItem, isFocused && styles.tabItemActive]}
          onPress={onPress}
          activeOpacity={0.7}
        >
          <Ionicons
            name={iconName}
            size={20}
            color={isFocused ? '#047857' : '#64748B'}
          />
          <Text
            style={[
              styles.tabLabel,
              { color: isFocused ? '#047857' : '#64748B', fontWeight: isFocused ? '700' : '500' },
            ]}
          >
            {label}
          </Text>
        </TouchableOpacity>
      </View>
    );
  };

  return (
    <>
      <View style={[styles.dockWrapper, { paddingBottom: Math.max(insets.bottom, 8) }]} pointerEvents="box-none">
        <View style={styles.dockContainer}>
          {/* Slot 1: Map */}
          {renderTabItem(mapRoute, 'map', 'Map')}

          {/* Slot 2: Wild */}
          {renderTabItem(wildRoute, 'leaf', 'Wild')}

          {/* Slot 3: Exact Center Scan FAB */}
          <View style={styles.slot}>
            <TouchableOpacity
              style={styles.fabWrapper}
              onPress={() => setScanModalVisible(true)}
              activeOpacity={0.85}
            >
              <View style={styles.fabCircle}>
                <Ionicons name="qr-code" size={24} color="#FFFFFF" />
              </View>
              <Text style={styles.fabLabel}>Scan</Text>
            </TouchableOpacity>
          </View>

          {/* Slot 4: Circular */}
          {renderTabItem(circularRoute, 'sync-circle', 'Circular')}

          {/* Slot 5: Profile */}
          {renderTabItem(profileRoute, 'person', 'Profile')}
        </View>
      </View>

      {/* Scan Selection Modal */}
      <Modal visible={scanModalVisible} animationType="slide" transparent>
        <View style={styles.modalBackdrop}>
          <View style={styles.modalCard}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Choose Scanner Type</Text>
              <TouchableOpacity onPress={() => setScanModalVisible(false)}>
                <Ionicons name="close" size={24} color="#64748B" />
              </TouchableOpacity>
            </View>

            <Text style={styles.modalSub}>
              Select the AI scanner module you want to launch:
            </Text>

            {/* Option 1: Wild Species AI Scanner */}
            <TouchableOpacity
              style={[styles.optionCard, { backgroundColor: '#E6F4EA', borderColor: '#059669' }]}
              onPress={() => handleLaunchScan('Wild')}
              activeOpacity={0.8}
            >
              <View style={[styles.optionIconBg, { backgroundColor: '#059669' }]}>
                <Ionicons name="leaf" size={22} color="#FFFFFF" />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={[styles.optionTitle, { color: '#047857' }]}>🌿 Avian & Wildlife AI Scan</Text>
                <Text style={styles.optionSub}>Snap bird & native species photos in campus pilot zones.</Text>
              </View>
              <Ionicons name="chevron-forward" size={20} color="#059669" />
            </TouchableOpacity>

            {/* Option 2: Circular Waste AI Scanner */}
            <TouchableOpacity
              style={[styles.optionCard, { backgroundColor: '#EFF6FF', borderColor: '#3B82F6' }]}
              onPress={() => handleLaunchScan('Circular')}
              activeOpacity={0.8}
            >
              <View style={[styles.optionIconBg, { backgroundColor: '#3B82F6' }]}>
                <Ionicons name="sync-circle" size={24} color="#FFFFFF" />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={[styles.optionTitle, { color: '#1E40AF' }]}>♻️ Circular Waste AI Scan</Text>
                <Text style={styles.optionSub}>Scan recyclables, log weight, and get AI upcycling ideas.</Text>
              </View>
              <Ionicons name="chevron-forward" size={20} color="#3B82F6" />
            </TouchableOpacity>
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
      <Tab.Screen name="Wild" component={WildScreen} />
      <Tab.Screen name="Circular" component={CircularScreen} />
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
  },
  dockContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#FFFFFF',
    borderRadius: 28,
    height: 64,
    width: '92%',
    paddingHorizontal: 4,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.1,
    shadowRadius: 16,
    elevation: 8,
  },
  slot: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tabItem: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 14,
    gap: 2,
  },
  tabItemActive: {
    backgroundColor: '#E6F4EA',
  },
  tabLabel: {
    fontSize: 10,
  },
  fabWrapper: {
    alignItems: 'center',
    justifyContent: 'center',
    top: -14,
  },
  fabCircle: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#059669',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 3,
    borderColor: '#FFFFFF',
    shadowColor: '#059669',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.35,
    shadowRadius: 10,
    elevation: 8,
  },
  fabLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: '#047857',
    marginTop: 2,
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.6)',
    justifyContent: 'flex-end',
  },
  modalCard: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 20,
    gap: 12,
    paddingBottom: 32,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#0F172A',
  },
  modalSub: {
    fontSize: 13,
    color: '#64748B',
    marginBottom: 4,
  },
  optionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    borderRadius: 16,
    borderWidth: 1.5,
    gap: 12,
  },
  optionIconBg: {
    width: 42,
    height: 42,
    borderRadius: 21,
    alignItems: 'center',
    justifyContent: 'center',
  },
  optionTitle: {
    fontSize: 15,
    fontWeight: '800',
  },
  optionSub: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 2,
  },
});
