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
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRoute, useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';

import { identifySpecies, SpeciesResult } from '../../lib/inaturalist';
import { TaxonGroup, getRarityTier } from '../../constants/rarityTiers';
import { LowConfidenceCard } from '../../components/wild/LowConfidenceCard';
import { useAuth } from '../../context/AuthContext';
import { supabase } from '../../lib/supabase';
import { PrimaryButton } from '../../components/common/PrimaryButton';
import { SecondaryButton } from '../../components/common/SecondaryButton';
import { RarityBadge } from '../../components/common/RarityBadge';
import { GreenPointsChip } from '../../components/common/GreenPointsChip';
import { IconButton } from '../../components/common/IconButton';

export const ScanResultsScreen: React.FC = () => {
  const insets = useSafeAreaInsets();
  const route = useRoute<any>();
  const navigation = useNavigation<any>();
  const { user } = useAuth();

  const photoUri: string = route.params?.photoUri;
  const imageBase64: string = route.params?.imageBase64;
  const taxonGroup: TaxonGroup = route.params?.taxonGroup || 'birds';
  const zoneMultiplier: number = route.params?.zoneMultiplier || 1.0;

  const [loading, setLoading] = useState<boolean>(true);
  const [results, setResults] = useState<SpeciesResult[]>([]);
  const [selectedIndex, setSelectedIndex] = useState<number>(0);
  const [submitting, setSubmitting] = useState<boolean>(false);

  useEffect(() => {
    runAiInference();
  }, []);

  const runAiInference = async () => {
    setLoading(true);
    const inputPhoto = imageBase64 || photoUri;
    if (!inputPhoto) {
      setLoading(false);
      return;
    }

    const species = await identifySpecies(inputPhoto, 16.7475, 74.4675, taxonGroup);
    setResults(species);
    setLoading(false);
  };

  const handleConfirmSighting = async () => {
    if (!user || results.length === 0) return;

    const selected = results[selectedIndex];
    const rarity = getRarityTier(taxonGroup, selected.commonName);

    let basePoints = 50;
    if (rarity === 'amber') basePoints = 100;
    if (rarity === 'legendary') basePoints = 250;

    const finalPoints = Math.round(basePoints * zoneMultiplier);
    const zoneTier = zoneMultiplier === 2.0 ? 'home' : zoneMultiplier === 1.25 ? 'nearby' : 'remote';

    setSubmitting(true);
    try {
      const { data: obs, error: obsErr } = await supabase.from('species_observations').insert({
        user_id: user.id,
        species_label: selected.commonName,
        confidence: Math.round(selected.confidence * 100),
        rarity_tier: rarity,
        photo_url: photoUri,
        taxon_group: taxonGroup,
      }).select().single();

      let obsResult = obs;
      if (obsErr) {
        // Fallback insert without taxon_group if column is not yet migrated
        const { data: fallbackObs } = await supabase.from('species_observations').insert({
          user_id: user.id,
          species_label: selected.commonName,
          confidence: Math.round(selected.confidence * 100),
          rarity_tier: rarity,
          photo_url: photoUri,
        }).select().maybeSingle();
        obsResult = fallbackObs;
      }

      await supabase.from('greenpoints_ledger').insert({
        user_id: user.id,
        source: 'species_observation',
        amount: finalPoints,
        zone_tier: zoneTier,
        related_observation_id: obs?.id || null,
      });

      setSubmitting(false);

      Alert.alert(
        '🎉 Sighting Logged!',
        `Added ${selected.commonName} (${rarity.toUpperCase()}) to your collection book!\n+${finalPoints} XP awarded (${zoneMultiplier}× zone boost).`,
        [
          {
            text: 'View Collection',
            onPress: () => navigation.navigate('Wild'),
          },
        ]
      );
    } catch (err) {
      setSubmitting(false);
      Alert.alert('Error', 'Failed to save sighting to database.');
    }
  };

  const topResult = results[0];
  const isLowConfidence = !loading && (!topResult || topResult.confidence < 0.25);
  const currentSelection = results[selectedIndex];
  const currentRarity = currentSelection ? getRarityTier(taxonGroup, currentSelection.commonName) : 'common';

  return (
    <View style={[styles.container, { backgroundColor: '#F6FBF7', paddingTop: Math.max(insets.top, 12) }]}>
      {/* Header */}
      <View style={styles.topHeader}>
        <IconButton icon="arrow-back" onPress={() => navigation.goBack()} />
        <Text style={styles.headerTitle}>Identification Result</Text>
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {/* Photo Preview */}
        {photoUri && (
          <View style={styles.photoWrapper}>
            <Image source={{ uri: photoUri }} style={styles.heroPhoto} />
          </View>
        )}

        {loading ? (
          <View style={styles.loadingBox}>
            <ActivityIndicator size="large" color="#2BB673" />
            <Text style={styles.loadingText}>Running iNaturalist Vision Model...</Text>
            <Text style={styles.loadingSub}>Scoring matches against Western Ghats flora & fauna</Text>
          </View>
        ) : isLowConfidence ? (
          <LowConfidenceCard onRetake={() => navigation.goBack()} />
        ) : (
          <View style={styles.resultsContainer}>
            {/* Top Match Result Card */}
            <View style={styles.matchCard}>
              <View style={styles.matchTopRow}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.commonNameText}>{currentSelection?.commonName}</Text>
                  <Text style={styles.scientificText}>{currentSelection?.scientificName}</Text>
                </View>
                <RarityBadge rarity={currentRarity} />
              </View>

              {/* Confidence & XP Strip */}
              <View style={styles.matchStrip}>
                <View style={styles.confidenceRow}>
                  <Text style={styles.confLabel}>Match Confidence</Text>
                  <Text style={styles.confValue}>
                    {Math.round((currentSelection?.confidence || 0.9) * 100)}%
                  </Text>
                </View>

                <View style={styles.progressBarBg}>
                  <View
                    style={[
                      styles.progressBarFill,
                      { width: `${Math.min(100, Math.round((currentSelection?.confidence || 0.9) * 100))}%` },
                    ]}
                  />
                </View>

                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 4 }}>
                  <Text style={styles.zoneBoostText}>
                    📍 Zone Multiplier: <Text style={{ fontWeight: '700', color: '#16A34A' }}>{zoneMultiplier}x</Text>
                  </Text>
                  <GreenPointsChip points={Math.round(50 * zoneMultiplier)} label="XP" />
                </View>
              </View>
            </View>

            {/* Alternative Candidate Matches */}
            {results.length > 1 && (
              <View style={styles.alternativesBox}>
                <Text style={styles.alternativesTitle}>ALTERNATIVE AI CANDIDATES</Text>
                {results.map((item, idx) => (
                  <TouchableOpacity
                    key={idx}
                    onPress={() => setSelectedIndex(idx)}
                    activeOpacity={0.8}
                    style={[
                      styles.altRow,
                      selectedIndex === idx && styles.altRowSelected,
                    ]}
                  >
                    <View style={{ flex: 1, gap: 1 }}>
                      <Text style={[styles.altCommonName, selectedIndex === idx && { color: '#15803D' }]}>
                        {item.commonName}
                      </Text>
                      <Text style={styles.altScientific}>{item.scientificName}</Text>
                    </View>
                    <Text style={[styles.altScore, selectedIndex === idx && { color: '#16A34A' }]}>
                      {Math.round(item.confidence * 100)}%
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            )}

            {/* Confirmation & Retake Buttons */}
            <View style={styles.btnStack}>
              <PrimaryButton
                title="Save Sighting to Collection"
                icon="checkmark-circle"
                onPress={handleConfirmSighting}
                loading={submitting}
                disabled={submitting}
              />
              <SecondaryButton
                title="Retake Photo"
                icon="camera-outline"
                onPress={() => navigation.goBack()}
                disabled={submitting}
              />
            </View>
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
  photoWrapper: {
    width: '100%',
    height: 180,
    borderRadius: 20,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  heroPhoto: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  loadingBox: {
    paddingVertical: 40,
    alignItems: 'center',
    gap: 10,
  },
  loadingText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#0F172A',
  },
  loadingSub: {
    fontSize: 12,
    color: '#64748B',
  },
  resultsContainer: {
    gap: 14,
  },
  matchCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 16,
    gap: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
  },
  matchTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: 10,
  },
  commonNameText: {
    fontSize: 20,
    fontWeight: '800',
    color: '#0F172A',
  },
  scientificText: {
    fontSize: 13,
    fontStyle: 'italic',
    color: '#64748B',
    marginTop: 2,
  },
  matchStrip: {
    backgroundColor: '#F8FAFC',
    borderRadius: 14,
    padding: 12,
    gap: 8,
  },
  confidenceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  confLabel: {
    fontSize: 11,
    color: '#64748B',
    fontWeight: '600',
  },
  confValue: {
    fontSize: 13,
    fontWeight: '800',
    color: '#16A34A',
  },
  progressBarBg: {
    height: 6,
    backgroundColor: '#E2E8F0',
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: '#2BB673',
    borderRadius: 3,
  },
  zoneBoostText: {
    fontSize: 11,
    color: '#64748B',
  },

  // Alternatives
  alternativesBox: {
    gap: 8,
  },
  alternativesTitle: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.8,
    color: '#64748B',
    paddingHorizontal: 2,
  },
  altRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  altRowSelected: {
    borderColor: '#2BB673',
    backgroundColor: '#F0FDF4',
    borderWidth: 1.5,
  },
  altCommonName: {
    fontSize: 13,
    fontWeight: '700',
    color: '#0F172A',
  },
  altScientific: {
    fontSize: 11,
    fontStyle: 'italic',
    color: '#64748B',
  },
  altScore: {
    fontSize: 12,
    fontWeight: '700',
    color: '#64748B',
  },
  btnStack: {
    gap: 8,
    marginTop: 4,
  },
});
