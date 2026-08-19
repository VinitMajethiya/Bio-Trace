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
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../providers/ThemeProvider';
import { useAuth } from '../../context/AuthContext';
import { DarkCard } from '../../components/common/BioCard';
import { PrimaryButton } from '../../components/common/PrimaryButton';
import { IconButton } from '../../components/common/IconButton';
import { HealthRing } from '../../components/common/HealthRing';
import { GreenPointsChip } from '../../components/common/GreenPointsChip';
import {
  fetchSocieties,
  joinSociety,
  getUserSocietyInfo,
  Society,
  UserSocietyInfo,
} from '../../lib/society';

export const SocietyPickerScreen: React.FC = () => {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<any>();
  const { colors } = useTheme();
  const { user } = useAuth();

  const [societies, setSocieties] = useState<Society[]>([]);
  const [userInfo, setUserInfo] = useState<UserSocietyInfo>({
    society_id: null,
    moderator_of_society_id: null,
  });
  const [loading, setLoading] = useState<boolean>(true);
  const [joiningId, setJoiningId] = useState<string | null>(null);

  const loadData = async () => {
    setLoading(true);
    const [socList, info] = await Promise.all([
      fetchSocieties(),
      user?.id ? getUserSocietyInfo(user.id) : Promise.resolve({ society_id: null, moderator_of_society_id: null }),
    ]);
    setSocieties(socList);
    setUserInfo(info);
    setLoading(false);
  };

  useFocusEffect(
    React.useCallback(() => {
      loadData();
    }, [user?.id])
  );

  useEffect(() => {
    loadData();
  }, [user?.id]);

  const handleJoinSociety = async (society: Society) => {
    if (!user) return;
    if (userInfo.society_id === society.id) {
      Alert.alert('Already Joined', `You are already a member of ${society.name}.`);
      return;
    }

    setJoiningId(society.id);
    const res = await joinSociety(user.id, society.id);
    setJoiningId(null);

    if (res.success) {
      Alert.alert(
        '🎉 Society Joined!',
        `You have joined ${society.name}! Your eco-actions now directly boost this community's Health Score.`,
        [
          {
            text: 'Continue to App',
            onPress: () => {
              navigation.reset({
                index: 0,
                routes: [{ name: 'MainTabs' }],
              });
            },
          },
        ]
      );
      loadData();
    } else {
      Alert.alert('Database Sync Required', res.error || 'Failed to update society in database.');
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.canvas_airy || '#f4fbf3', paddingTop: Math.max(insets.top, 16) }]}>
      {/* Header */}
      <View style={styles.topHeader}>
        <IconButton icon="arrow-back" onPress={() => navigation.goBack()} />
        <Text style={[styles.displayTitle, { color: colors.text_airy_primary || '#161d18' }]}>
          Eco Societies
        </Text>
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <Text style={[styles.headingSub, { color: colors.text_airy_secondary || '#3d4a40' }]}>
          Select a campus territory or local society. Your actions boost its Health Score.
        </Text>

        {loading ? (
          <ActivityIndicator size="large" color={colors.green_vivid} style={{ marginTop: 40 }} />
        ) : (
          <View style={styles.societyList}>
            {societies.map((item) => {
              const isCurrent = userInfo.society_id === item.id;
              const isJoining = joiningId === item.id;

              return (
                <DarkCard
                  key={item.id}
                  padding={20}
                  style={[
                    styles.societyCard,
                    isCurrent && { borderColor: colors.green_vivid, borderWidth: 2 },
                  ]}
                >
                  <View style={styles.cardTopRow}>
                    <HealthRing score={item.health_score} size={50} strokeWidth={5} showLabel={false} />
                    <View style={{ flex: 1 }}>
                      <Text style={[styles.societyTitle, { color: colors.text_on_warm_primary || '#142217' }]}>{item.name}</Text>
                      <Text style={[styles.societySub, { color: colors.text_on_warm_secondary || '#3E6B48' }]}>{item.boundary}</Text>
                    </View>
                    <GreenPointsChip points={item.health_score} label="Score" />
                  </View>

                  <PrimaryButton
                    title={isCurrent ? 'Current Society Active' : 'Join Society'}
                    icon={isCurrent ? 'checkmark-circle' : 'person-add-outline'}
                    onPress={() => handleJoinSociety(item)}
                    loading={isJoining}
                    disabled={isCurrent}
                    style={{ marginTop: 8 }}
                  />
                </DarkCard>
              );
            })}
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
  displayTitle: {
    fontSize: 34,
    lineHeight: 40,
    fontWeight: '700',
    letterSpacing: -0.8,
  },
  content: {
    padding: 24,
    gap: 16,
    paddingBottom: 40,
  },
  headingSub: {
    fontSize: 14,
    lineHeight: 20,
  },
  societyList: {
    gap: 14,
  },
  societyCard: {
    gap: 12,
  },
  cardTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  societyTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#142217',
  },
  societySub: {
    fontSize: 12,
    color: '#3E6B48',
    marginTop: 2,
  },
});
