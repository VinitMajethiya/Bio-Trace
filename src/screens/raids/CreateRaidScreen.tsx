import React, { useEffect, useState } from 'react';
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../providers/ThemeProvider';
import { useAuth } from '../../context/AuthContext';
import { DarkCard } from '../../components/common/BioCard';
import { PrimaryButton } from '../../components/common/PrimaryButton';
import { InputContainer } from '../../components/common/InputContainer';
import { FilterPill } from '../../components/common/FilterChip';
import { IconButton } from '../../components/common/IconButton';
import { getUserSocietyInfo, UserSocietyInfo } from '../../lib/society';
import { createCleanRaid } from '../../lib/raids';

const CAMPUS_LOCATION_PRESETS = [
  { name: 'SGU Quad Center', lat: 16.7475, lng: 74.4675 },
  { name: 'Botanical Arboretum', lat: 16.7485, lng: 74.4665 },
  { name: 'Silver Creek Board Walk', lat: 16.7465, lng: 74.4690 },
];

export const CreateRaidScreen: React.FC = () => {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<any>();
  const { colors } = useTheme();
  const { user } = useAuth();

  const [userInfo, setUserInfo] = useState<UserSocietyInfo>({
    society_id: null,
    moderator_of_society_id: null,
  });
  const [loadingUser, setLoadingUser] = useState<boolean>(true);

  const [title, setTitle] = useState<string>('');
  const [selectedPreset, setSelectedPreset] = useState(CAMPUS_LOCATION_PRESETS[0]);
  const [scheduledAtText, setScheduledAtText] = useState<string>('Today at 4:00 PM');
  const [creating, setCreating] = useState<boolean>(false);

  useEffect(() => {
    loadUser();
  }, [user]);

  const loadUser = async () => {
    if (!user) return;
    setLoadingUser(true);
    const info = await getUserSocietyInfo(user.id);
    setUserInfo(info);
    setLoadingUser(false);
  };

  const isModeratorOfOwnSociety =
    !!userInfo.moderator_of_society_id &&
    userInfo.moderator_of_society_id === userInfo.society_id;

  const handlePublishRaid = async () => {
    if (!user || !userInfo.society_id) return;

    if (!title.trim()) {
      Alert.alert('Title Required', 'Please enter a title for the Bio Abhiyan.');
      return;
    }

    setCreating(true);
    const res = await createCleanRaid(
      user.id,
      userInfo.society_id,
      title,
      selectedPreset.lat,
      selectedPreset.lng,
      new Date().toISOString()
    );
    setCreating(false);

    if (res.success) {
      Alert.alert(
        '🎉 Bio Abhiyan Published!',
        `"${title}" is now active on your society's map! Members can discover and join the campaign.`
      );
      navigation.goBack();
    } else {
      Alert.alert('Publishing Error', res.error || 'Failed to create Bio Abhiyan.');
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.canvas_airy || '#f4fbf3', paddingTop: Math.max(insets.top, 16) }]}>
      {/* Top Header */}
      <View style={styles.topHeader}>
        <IconButton icon="arrow-back" onPress={() => navigation.goBack()} />
        <Text style={[styles.headingTitle, { color: colors.text_airy_primary || '#161d18' }]}>
          Create Bio Abhiyan
        </Text>
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {loadingUser ? (
          <ActivityIndicator size="large" color={colors.green_vivid} style={{ marginTop: 40 }} />
        ) : !isModeratorOfOwnSociety ? (
          <DarkCard padding={20} style={styles.permissionCard}>
            <Ionicons name="lock-closed" size={40} color={colors.danger || '#E05C5C'} />
            <Text style={styles.permTitle}>Bio Veer Permission Required</Text>
            <Text style={styles.permSub}>
              Only elected Bio Veers can publish Bio Abhiyans. Participate in your society election first!
            </Text>
            <PrimaryButton
              title="Go to Elections"
              icon="ribbon-outline"
              onPress={() => navigation.navigate('Election')}
              style={{ marginTop: 8 }}
            />
          </DarkCard>
        ) : (
          <View style={styles.formStack}>
            {/* Title InputContainer */}
            <InputContainer
              label="Bio Abhiyan Event Title"
              icon="shield-checkmark-outline"
              placeholder="e.g. Quad Leaf & Plastic Cleanup"
              value={title}
              onChangeText={setTitle}
              canvas="dark"
            />

            {/* Location Presets */}
            <Text style={[styles.subHeading, { color: colors.text_on_dark_secondary || '#8DB89A' }]}>
              TARGET LOCATION (MAP PIN)
            </Text>
            <View style={styles.presetRow}>
              {CAMPUS_LOCATION_PRESETS.map((preset) => (
                <FilterPill
                  key={preset.name}
                  label={preset.name}
                  active={selectedPreset.name === preset.name}
                  onPress={() => setSelectedPreset(preset)}
                  canvas="dark"
                />
              ))}
            </View>

            {/* Scheduled Time InputContainer */}
            <InputContainer
              label="Scheduled Date & Time"
              icon="calendar-outline"
              value={scheduledAtText}
              onChangeText={setScheduledAtText}
              canvas="dark"
            />

            {/* Submit Button */}
            <PrimaryButton
              title="Publish Bio Abhiyan to Map"
              icon="paper-plane-outline"
              onPress={handlePublishRaid}
              loading={creating}
              disabled={creating}
              style={{ marginTop: 12 }}
            />
          </View>
        )}
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
    paddingHorizontal: 20,
    gap: 12,
    marginBottom: 8,
  },
  backBtn: {
    padding: 4,
  },
  headingTitle: {
    fontSize: 22,
    fontWeight: '700',
    letterSpacing: -0.4,
  },
  content: {
    padding: 24,
    gap: 16,
    paddingBottom: 40,
  },
  permissionCard: {
    alignItems: 'center',
    gap: 12,
    paddingVertical: 24,
  },
  permTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#142217',
  },
  permSub: {
    fontSize: 13,
    color: '#3E6B48',
    textAlign: 'center',
    lineHeight: 18,
  },
  formStack: {
    gap: 16,
  },
  subHeading: {
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 0.8,
    marginTop: 4,
  },
  presetRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
});
