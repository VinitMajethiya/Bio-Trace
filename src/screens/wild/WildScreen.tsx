import React, { useEffect, useState } from 'react';
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  Image,
  Alert,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation, useRoute } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../providers/ThemeProvider';
import { useAuth } from '../../context/AuthContext';
import { PrimaryButton } from '../../components/common/PrimaryButton';
import { EmptyState } from '../../components/common/EmptyState';
import { FilterPill } from '../../components/common/FilterChip';
import { GreenPointsChip } from '../../components/common/GreenPointsChip';
import { RarityBadge } from '../../components/common/RarityBadge';
import { fetchUserCollectionBook, deleteSpeciesObservation, SpeciesObservation } from '../../lib/wild';
import { TaxonGroup } from '../../constants/rarityTiers';

type CollectionFilter = 'all' | TaxonGroup;

export const WildScreen: React.FC = () => {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const { colors, radii } = useTheme();
  const { user } = useAuth();

  const [observations, setObservations] = useState<SpeciesObservation[]>([]);
  const [loadingObservations, setLoadingObservations] = useState<boolean>(true);
  const [refreshing, setRefreshing] = useState<boolean>(false);
  const [activeFilter, setActiveFilter] = useState<CollectionFilter>('all');

  const autoScan = route.params?.autoScan;

  useEffect(() => {
    if (autoScan) {
      handleLaunchTaxonPicker();
    }
  }, [autoScan]);

  useEffect(() => {
    loadCollectionBook();
  }, [user]);

  const loadCollectionBook = async () => {
    if (!user) return;
    setLoadingObservations(true);
    const data = await fetchUserCollectionBook(user.id);
    setObservations(data);
    setLoadingObservations(false);
    setRefreshing(false);
  };

  const onRefresh = () => {
    setRefreshing(true);
    loadCollectionBook();
  };

  const handleLaunchTaxonPicker = () => {
    navigation.navigate('TaxonPickerScreen');
  };

  const handleDeleteObservation = (observationId?: string, speciesName?: string) => {
    if (!observationId) return;

    Alert.alert(
      'Remove Sighting?',
      `Are you sure you want to remove ${speciesName || 'this sighting'} from your collection?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Remove',
          style: 'destructive',
          onPress: async () => {
            const success = await deleteSpeciesObservation(observationId);
            if (success) {
              setObservations((prev) => prev.filter((o) => o.id !== observationId));
            } else {
              // Optimistic local removal
              setObservations((prev) => prev.filter((o) => o.id !== observationId));
            }
          },
        },
      ]
    );
  };

  const filteredObservations = observations.filter((obs) => {
    if (activeFilter === 'all') return true;
    return (obs.taxon_group || 'birds').toLowerCase() === activeFilter.toLowerCase();
  });

  const uniqueSpeciesCount = new Set(observations.map((o) => o.species_label)).size;

  return (
    <View style={[styles.container, { backgroundColor: '#F6FBF7', paddingTop: Math.max(insets.top, 16) }]}>
      {/* Top Header */}
      <View style={styles.headerRow}>
        <View>
          <Text style={styles.headingText}>Wild Vision</Text>
          <Text style={styles.subHeadingText}>Biodiversity Scanner & Citizen Science</Text>
        </View>
        <GreenPointsChip points={observations.length * 50} label="XP" />
      </View>

      <ScrollView
        contentContainerStyle={styles.content}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#2BB673" />}
        showsVerticalScrollIndicator={false}
      >
        {/* Main AI Scanner Hero Card */}
        <View style={styles.heroCard}>
          <View style={styles.heroTopRow}>
            <View style={styles.heroIconBox}>
              <Ionicons name="scan-outline" size={24} color="#2BB673" />
            </View>
            <View style={{ flex: 1, gap: 2 }}>
              <Text style={styles.heroTitle}>Species Vision AI</Text>
              <Text style={styles.heroSubtitle}>
                Identify birds, plants, insects & wildlife to map regional biodiversity.
              </Text>
            </View>
          </View>

          {/* Quick Metrics Bar */}
          <View style={styles.metricsRow}>
            <View style={styles.metricItem}>
              <Text style={styles.metricVal}>{observations.length}</Text>
              <Text style={styles.metricLabel}>Total Sightings</Text>
            </View>
            <View style={styles.metricDivider} />
            <View style={styles.metricItem}>
              <Text style={[styles.metricVal, { color: '#2BB673' }]}>{uniqueSpeciesCount}</Text>
              <Text style={styles.metricLabel}>Unique Species</Text>
            </View>
            <View style={styles.metricDivider} />
            <View style={styles.metricItem}>
              <Text style={[styles.metricVal, { color: '#B45309' }]}>Western Ghats</Text>
              <Text style={styles.metricLabel}>Pilot Zone</Text>
            </View>
          </View>

          <PrimaryButton
            title="Scan Species in Wild"
            icon="camera"
            onPress={handleLaunchTaxonPicker}
            style={{ marginTop: 2 }}
          />
        </View>

        {/* Collection Section Header */}
        <View style={styles.sectionHeaderRow}>
          <Text style={styles.sectionTitle}>YOUR SIGHTINGS ({filteredObservations.length})</Text>
          {observations.length > 0 && (
            <TouchableOpacity onPress={handleLaunchTaxonPicker} style={styles.addMoreLink}>
              <Ionicons name="add" size={14} color="#2BB673" />
              <Text style={styles.addMoreText}>New Scan</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Filter Pills */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterBar}>
          {[
            { id: 'all', label: 'All' },
            { id: 'birds', label: '🐦 Birds' },
            { id: 'plants', label: '🌿 Plants' },
            { id: 'insects', label: '🦋 Insects' },
            { id: 'wildlife', label: '🦎 Wildlife' },
          ].map((tab) => (
            <FilterPill
              key={tab.id}
              label={tab.label}
              active={activeFilter === tab.id}
              onPress={() => setActiveFilter(tab.id as CollectionFilter)}
              canvas="warm"
            />
          ))}
        </ScrollView>

        {/* Sightings Collection Grid */}
        {loadingObservations ? (
          <ActivityIndicator size="small" color="#2BB673" style={{ marginTop: 24 }} />
        ) : filteredObservations.length === 0 ? (
          <EmptyState
            icon="book-outline"
            title="No Sightings Logged"
            description="Snap a bird, plant, insect or wildlife photo to add your first observation to the biodiversity map!"
            actionTitle="Scan Species Now"
            onActionPress={handleLaunchTaxonPicker}
            canvas="warm"
          />
        ) : (
          <View style={styles.collectionGrid}>
            {filteredObservations.map((item, index) => (
              <View key={item.id || index.toString()} style={styles.speciesCard}>
                {/* Photo with delete overlay button */}
                <View style={styles.thumbWrapper}>
                  <Image
                    source={{ uri: item.photo_url || 'https://images.unsplash.com/photo-1549608276-5786777e6587?w=400' }}
                    style={styles.speciesThumb}
                  />
                  <TouchableOpacity
                    style={styles.deleteBadgeBtn}
                    onPress={() => handleDeleteObservation(item.id, item.species_label)}
                    hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                  >
                    <Ionicons name="trash-outline" size={13} color="#DC2626" />
                  </TouchableOpacity>
                </View>

                {/* Sighting Details */}
                <View style={styles.speciesInfo}>
                  <Text style={styles.speciesName} numberOfLines={1}>
                    {item.species_label}
                  </Text>
                  <View style={styles.speciesMetaRow}>
                    <RarityBadge rarity={item.rarity_tier || 'Common'} />
                    <Text style={styles.confidenceText}>
                      {item.confidence || 90}% match
                    </Text>
                  </View>
                </View>
              </View>
            ))}
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
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    marginBottom: 8,
  },
  headingText: {
    fontSize: 28,
    fontWeight: '800',
    color: '#0F172A',
    letterSpacing: -0.6,
  },
  subHeadingText: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 2,
  },
  content: {
    paddingHorizontal: 18,
    paddingTop: 6,
    paddingBottom: 130, // Space above bottom tab navigation
    gap: 16,
  },

  // Hero Card
  heroCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 22,
    padding: 18,
    gap: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 2,
  },
  heroTopRow: {
    flexDirection: 'row',
    gap: 12,
    alignItems: 'center',
  },
  heroIconBox: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: '#DCFCE7',
    alignItems: 'center',
    justifyContent: 'center',
  },
  heroTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#0F172A',
  },
  heroSubtitle: {
    fontSize: 12,
    lineHeight: 16,
    color: '#64748B',
  },
  metricsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    borderRadius: 14,
    paddingVertical: 10,
    paddingHorizontal: 10,
  },
  metricItem: {
    flex: 1,
    alignItems: 'center',
    gap: 2,
  },
  metricDivider: {
    width: 1,
    height: 22,
    backgroundColor: '#E2E8F0',
  },
  metricVal: {
    fontSize: 13,
    fontWeight: '800',
    color: '#0F172A',
  },
  metricLabel: {
    fontSize: 10,
    fontWeight: '600',
    color: '#64748B',
  },

  // Section Headers
  sectionHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 2,
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 0.8,
    color: '#64748B',
  },
  addMoreLink: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
  },
  addMoreText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#2BB673',
  },

  filterBar: {
    gap: 8,
    paddingVertical: 2,
  },

  // Grid
  collectionGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  speciesCard: {
    width: '48%',
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  thumbWrapper: {
    position: 'relative',
    width: '100%',
    height: 110,
  },
  speciesThumb: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  deleteBadgeBtn: {
    position: 'absolute',
    top: 6,
    right: 6,
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: 'rgba(255, 255, 255, 0.92)',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.15,
    shadowRadius: 2,
    elevation: 2,
  },
  speciesInfo: {
    padding: 10,
    gap: 4,
  },
  speciesName: {
    fontSize: 13,
    fontWeight: '700',
    color: '#0F172A',
  },
  speciesMetaRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 2,
  },
  confidenceText: {
    fontSize: 10,
    fontWeight: '600',
    color: '#64748B',
  },
});
