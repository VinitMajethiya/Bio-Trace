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
import { DarkCard } from '../../components/common/BioCard';
import { PrimaryButton } from '../../components/common/PrimaryButton';
import { FilterPill } from '../../components/common/FilterChip';
import { GreenPointsChip } from '../../components/common/GreenPointsChip';
import { IconButton } from '../../components/common/IconButton';
import {
  fetchVerifiedPartnerObservations,
  exportVerifiedObservationsToCSV,
  VerifiedPartnerObservation,
} from '../../lib/export';

export const PartnerExportScreen: React.FC = () => {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<any>();
  const { colors } = useTheme();

  const [loading, setLoading] = useState<boolean>(true);
  const [exporting, setExporting] = useState<boolean>(false);
  const [observations, setObservations] = useState<VerifiedPartnerObservation[]>([]);
  const [selectedTaxon, setSelectedTaxon] = useState<string>('All');

  useEffect(() => {
    loadVerifiedObservations();
  }, []);

  const loadVerifiedObservations = async () => {
    setLoading(true);
    const data = await fetchVerifiedPartnerObservations();
    setObservations(data);
    setLoading(false);
  };

  const handleExportCSV = async () => {
    if (observations.length === 0) {
      Alert.alert('No Data', 'There are no verified observations available to export.');
      return;
    }

    setExporting(true);
    const res = await exportVerifiedObservationsToCSV(observations);
    setExporting(false);

    if (!res.success && res.error) {
      Alert.alert('Export Error', res.error);
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.canvas_airy || '#f4fbf3', paddingTop: Math.max(insets.top, 16) }]}>
      {/* Top Header */}
      <View style={styles.topHeader}>
        <IconButton icon="arrow-back" onPress={() => navigation.goBack()} />
        <Text style={[styles.headingTitle, { color: colors.text_airy_primary || '#161d18' }]}>
          Open Data Export
        </Text>
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <Text style={[styles.headingSub, { color: colors.text_airy_secondary || '#3d4a40' }]}>
          Verified biodiversity data formatted for research partners & policy reporting.
        </Text>

        {/* Schema & Export Preview Card */}
        <DarkCard padding={20} style={styles.previewCard}>
          <View style={styles.cardHeaderRow}>
            <View style={{ flex: 1 }}>
              <Text style={[styles.previewTitle, { color: colors.text_on_warm_primary || '#142217' }]}>Verified Observation Records</Text>
              <Text style={[styles.previewSub, { color: colors.text_on_warm_secondary || '#3E6B48' }]}>Filter: Confidence ≥ 60% (Tier 1 Verified)</Text>
            </View>
            <GreenPointsChip points={observations.length} label="Records" />
          </View>

          {/* Filter Pills */}
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterBar}>
            {['All', 'Birds', 'Wildlife', 'Plants', 'Insects'].map((tab) => (
              <FilterPill
                key={tab}
                label={tab}
                active={selectedTaxon === tab}
                onPress={() => setSelectedTaxon(tab)}
                canvas="dark"
              />
            ))}
          </ScrollView>

          <PrimaryButton
            title="Generate & Download CSV"
            icon="cloud-download-outline"
            onPress={handleExportCSV}
            loading={exporting}
            style={{ marginTop: 8 }}
          />
        </DarkCard>

        {/* Data Records List */}
        <Text style={[styles.subHeading, { color: colors.text_on_dark_secondary || '#8DB89A' }]}>
          SAMPLE VERIFIED DATASET
        </Text>

        {loading ? (
          <ActivityIndicator size="large" color={colors.green_vivid} style={{ marginTop: 40 }} />
        ) : (
          <View style={styles.recordsList}>
            {observations.map((item) => (
              <DarkCard key={item.id} padding={16} style={styles.recordItem}>
                <View style={styles.recordTopRow}>
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.speciesName, { color: colors.text_on_warm_primary || '#142217' }]}>{item.species_label}</Text>
                    <Text style={[styles.locationText, { color: colors.text_on_warm_secondary || '#3E6B48' }]}>{item.location}</Text>
                  </View>
                  <Text style={[styles.confText, { color: colors.green_vivid || '#4CAF72' }]}>
                    {item.confidence}% Match
                  </Text>
                </View>
              </DarkCard>
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
  headingSub: {
    fontSize: 14,
    lineHeight: 20,
  },
  previewCard: {
    gap: 14,
  },
  cardHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: 12,
  },
  previewTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#142217',
  },
  previewSub: {
    fontSize: 12,
    color: '#3E6B48',
    marginTop: 2,
  },
  filterBar: {
    gap: 8,
    paddingVertical: 2,
  },
  subHeading: {
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 0.8,
    marginTop: 6,
  },
  recordsList: {
    gap: 10,
  },
  recordItem: {
    gap: 4,
  },
  recordTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  speciesName: {
    fontSize: 15,
    fontWeight: '700',
    color: '#142217',
  },
  locationText: {
    fontSize: 12,
    color: '#3E6B48',
    marginTop: 2,
  },
  confText: {
    fontSize: 13,
    fontWeight: '700',
  },
});
