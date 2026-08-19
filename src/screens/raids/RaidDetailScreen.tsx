import React, { useEffect, useState } from 'react';
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  TouchableOpacity,
  Image,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { WebView } from 'react-native-webview';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRoute, useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { useTheme } from '../../providers/ThemeProvider';
import { useAuth } from '../../context/AuthContext';
import { DarkCard } from '../../components/common/BioCard';
import { StatusBadge } from '../../components/common/StatusBadge';
import { PrimaryButton } from '../../components/common/PrimaryButton';
import { SecondaryButton } from '../../components/common/SecondaryButton';
import { GreenPointsChip } from '../../components/common/GreenPointsChip';
import { IconButton } from '../../components/common/IconButton';
import {
  fetchRaidById,
  fetchUserRaidParticipant,
  joinCleanRaid,
  submitRaidBeforePhoto,
  submitRaidAfterPhoto,
  CleanRaid,
  RaidParticipant,
} from '../../lib/raids';

export const RaidDetailScreen: React.FC = () => {
  const insets = useSafeAreaInsets();
  const route = useRoute<any>();
  const navigation = useNavigation<any>();
  const { colors, radii } = useTheme();
  const { user } = useAuth();

  const raidId: string = route.params?.raidId;

  const [raid, setRaid] = useState<CleanRaid | null>(null);
  const [participant, setParticipant] = useState<RaidParticipant | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [joining, setJoining] = useState<boolean>(false);
  const [submittingPhoto, setSubmittingPhoto] = useState<boolean>(false);

  useEffect(() => {
    loadRaidData();
  }, [raidId, user]);

  const loadRaidData = async () => {
    if (!raidId) return;
    setLoading(true);
    const r = await fetchRaidById(raidId);
    setRaid(r);

    if (user?.id) {
      const p = await fetchUserRaidParticipant(raidId, user.id);
      setParticipant(p);
    }
    setLoading(false);
  };

  const handleJoin = async () => {
    if (!user || !raidId) return;
    setJoining(true);
    const res = await joinCleanRaid(raidId, user.id);
    setJoining(false);

    if (res.success) {
      Alert.alert('🎉 Joined Clean Raid!', 'You are now a registered participant.');
      loadRaidData();
    } else {
      Alert.alert('Error', res.error || 'Failed to join raid.');
    }
  };

  const captureLiveCameraPhoto = async (): Promise<string | null> => {
    const perm = await ImagePicker.requestCameraPermissionsAsync();
    if (!perm.granted) {
      Alert.alert('Camera Permission Required', 'Please grant camera access to snap live raid photos.');
      return null;
    }

    const pickerResult = await ImagePicker.launchCameraAsync({
      mediaTypes: ['images'],
      quality: 0.5,
      base64: true,
      exif: true,
      allowsEditing: true,
    });

    if (pickerResult.canceled || pickerResult.assets.length === 0) {
      return null;
    }

    return pickerResult.assets[0].uri;
  };

  const handleCaptureBeforePhoto = async () => {
    if (!participant?.id) return;
    setSubmittingPhoto(true);
    const photoUri = await captureLiveCameraPhoto();
    if (!photoUri) {
      setSubmittingPhoto(false);
      return;
    }

    const res = await submitRaidBeforePhoto(participant.id, photoUri);
    setSubmittingPhoto(false);

    if (res.success) {
      Alert.alert('Before Photo Uploaded', 'Live pre-cleanup photo saved. Now clean the area and snap the After photo!');
      loadRaidData();
    } else {
      Alert.alert('Upload Failed', res.error || 'Failed to submit before photo.');
    }
  };

  const handleCaptureAfterPhoto = async () => {
    if (!participant?.id) return;
    setSubmittingPhoto(true);
    const photoUri = await captureLiveCameraPhoto();
    if (!photoUri) {
      setSubmittingPhoto(false);
      return;
    }

    const res = await submitRaidAfterPhoto(participant.id, photoUri);
    setSubmittingPhoto(false);

    if (res.success) {
      Alert.alert('🎉 Cleanup Submitted!', 'Before & After photos submitted to society Bio Veer for verification.');
      loadRaidData();
    } else {
      Alert.alert('Upload Failed', res.error || 'Failed to submit after photo.');
    }
  };

  if (loading) {
    return (
      <View style={[styles.container, styles.center, { backgroundColor: colors.canvas_dark || '#142217' }]}>
        <ActivityIndicator size="large" color={colors.green_vivid} />
      </View>
    );
  }

  if (!raid) {
    return (
      <View style={[styles.container, styles.center, { backgroundColor: colors.canvas_dark || '#142217' }]}>
        <Text style={{ color: colors.text_on_dark_primary || '#F0F7F1', fontSize: 16 }}>Raid not found.</Text>
      </View>
    );
  }

  const mapHtml = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" />
      <style>
        html, body, #map { height: 100%; width: 100%; margin: 0; padding: 0; background: #142217; }
      </style>
    </head>
    <body>
      <div id="map"></div>
      <script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
      <script>
        var map = L.map('map', { zoomControl: false, attributionControl: false }).setView([${raid.lat}, ${raid.lng}], 16);
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png').addTo(map);
        L.marker([${raid.lat}, ${raid.lng}]).addTo(map).bindPopup("<b>${raid.title.replace(/'/g, "\\'")}</b>").openPopup();
      </script>
    </body>
    </html>
  `;

  return (
    <View style={[styles.container, { backgroundColor: colors.canvas_airy || '#f4fbf3', paddingTop: Math.max(insets.top, 16) }]}>
      {/* Header Bar */}
      <View style={styles.topHeader}>
        <IconButton icon="arrow-back" onPress={() => navigation.goBack()} />
        <Text style={[styles.headingTitle, { color: colors.text_airy_primary || '#161d18' }]}>
          Bio Abhiyan Event
        </Text>
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {/* Raid Overview Hero Card */}
        <DarkCard variant="hero" padding={20} style={styles.raidHero}>
          <View style={styles.badgeRow}>
            <StatusBadge
              label={raid.status === 'completed' ? 'Completed' : 'Active Bio Abhiyan'}
              variant={raid.status === 'completed' ? 'success' : 'warning'}
            />
            <GreenPointsChip points={150} label="Bonus GP" />
          </View>

          <Text style={[styles.raidTitle, { color: colors.text_on_warm_primary || '#142217' }]}>{raid.title}</Text>
          <Text style={[styles.raidSub, { color: colors.text_on_warm_secondary || '#3E6B48' }]}>
            Scheduled: {new Date(raid.scheduled_at).toLocaleString()}
          </Text>
          <Text style={[styles.participantCount, { color: colors.green_vivid || '#4CAF72' }]}>
            👥 {raid.participant_count || 1} Community Volunteers Joined
          </Text>
        </DarkCard>

        {/* Leaflet Map Preview */}
        <View style={styles.mapPreviewCard}>
          <WebView originWhitelist={['*']} source={{ html: mapHtml }} style={styles.miniMap} />
        </View>

        {/* Participant Flow Section */}
        {!participant ? (
          <DarkCard padding={20} style={styles.joinCard}>
            <Text style={[styles.joinTitle, { color: colors.text_on_warm_primary || '#142217' }]}>Join This Bio Abhiyan</Text>
            <Text style={[styles.joinSub, { color: colors.text_on_warm_secondary || '#3E6B48' }]}>
              Register as a volunteer to log before/after photos and earn bonus GreenPoints for your territory.
            </Text>
            <PrimaryButton
              title="Join Bio Abhiyan Now"
              icon="add-circle-outline"
              onPress={handleJoin}
              loading={joining}
              style={{ marginTop: 8 }}
            />
          </DarkCard>
        ) : (
          <View style={styles.workflowStack}>
            <Text style={[styles.subHeading, { color: colors.text_on_dark_secondary || '#8DB89A' }]}>
              CLEANUP WORKFLOW
            </Text>

            {participant.status === 'joined' && (
              <DarkCard padding={20} style={styles.stepCard}>
                <Text style={[styles.stepTitle, { color: colors.text_on_warm_primary || '#142217' }]}>1. Snap Pre-Cleanup Photo</Text>
                <Text style={[styles.stepSub, { color: colors.text_on_warm_secondary || '#3E6B48' }]}>Take a live photo of the waste site before cleanup begins.</Text>
                <PrimaryButton
                  title="Take Live Before Photo"
                  icon="camera"
                  onPress={handleCaptureBeforePhoto}
                  loading={submittingPhoto}
                  style={{ marginTop: 8 }}
                />
              </DarkCard>
            )}

            {participant.status === 'before_submitted' && (
              <DarkCard padding={20} style={styles.stepCard}>
                <Text style={[styles.stepTitle, { color: colors.text_on_warm_primary || '#142217' }]}>2. Snap Post-Cleanup Photo</Text>
                <Text style={[styles.stepSub, { color: colors.text_on_warm_secondary || '#3E6B48' }]}>Clean the zone, then capture the restored area.</Text>
                {participant.before_photo_url && (
                  <Image source={{ uri: participant.before_photo_url }} style={styles.thumbImage} />
                )}
                <PrimaryButton
                  title="Take Live After Photo"
                  icon="camera"
                  onPress={handleCaptureAfterPhoto}
                  loading={submittingPhoto}
                  style={{ marginTop: 8 }}
                />
              </DarkCard>
            )}

            {(participant.status === 'submitted' || participant.status === 'approved') && (
              <DarkCard padding={20} style={styles.stepCard}>
                <Text style={[styles.stepTitle, { color: colors.text_on_warm_primary || '#142217' }]}>
                  {participant.status === 'approved' ? '🎉 Cleanup Verified!' : '⏳ Submitted for Review'}
                </Text>
                <Text style={[styles.stepSub, { color: colors.text_on_warm_secondary || '#3E6B48' }]}>
                  Before & After photos submitted to society Bio Veer for points allocation.
                </Text>

                <View style={styles.pairRow}>
                  {participant.before_photo_url && (
                    <Image source={{ uri: participant.before_photo_url }} style={styles.halfPhoto} />
                  )}
                  {participant.after_photo_url && (
                    <Image source={{ uri: participant.after_photo_url }} style={styles.halfPhoto} />
                  )}
                </View>
              </DarkCard>
            )}
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
  center: {
    justifyContent: 'center',
    alignItems: 'center',
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
  raidHero: {
    gap: 10,
  },
  badgeRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  raidTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: '#142217',
  },
  raidSub: {
    fontSize: 13,
    color: '#3E6B48',
  },
  participantCount: {
    fontSize: 13,
    fontWeight: '700',
    color: '#2D6A4F',
  },
  mapPreviewCard: {
    height: 160,
    borderRadius: 20,
    overflow: 'hidden',
  },
  miniMap: {
    flex: 1,
  },
  joinCard: {
    gap: 8,
  },
  joinTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#142217',
  },
  joinSub: {
    fontSize: 13,
    color: '#3E6B48',
    lineHeight: 18,
  },
  workflowStack: {
    gap: 12,
  },
  subHeading: {
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 0.8,
  },
  stepCard: {
    gap: 8,
  },
  stepTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#142217',
  },
  stepSub: {
    fontSize: 13,
    color: '#3E6B48',
    lineHeight: 18,
  },
  thumbImage: {
    width: '100%',
    height: 120,
    borderRadius: 12,
    marginVertical: 4,
  },
  pairRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 6,
  },
  halfPhoto: {
    flex: 1,
    height: 110,
    borderRadius: 10,
  },
});
