import React, { useEffect, useState } from 'react';
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  TouchableOpacity,
  Modal,
  FlatList,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';

import { TrendChart } from '../../components/dashboard/TrendChart';
import { FactorGrid, FactorItem } from '../../components/dashboard/FactorGrid';
import { HealthRing } from '../../components/common/HealthRing';
import { FilterPill } from '../../components/common/FilterChip';
import { useTheme } from '../../providers/ThemeProvider';
import { supabase } from '../../lib/supabase';

interface SocietyItem {
  id: string;
  name: string;
  health_score: number;
  participation?: string;
  kg_diverted?: string;
}

interface InstitutionItem {
  name: string;
  status: 'Onboarded' | 'Pending' | 'Not started';
}

export const DashboardScreen: React.FC = () => {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<any>();
  const { colors } = useTheme();

  const [loading, setLoading] = useState<boolean>(true);
  const [refreshing, setRefreshing] = useState<boolean>(false);

  const [period, setPeriod] = useState<'monthly' | 'quarterly'>('monthly');
  const [areaModalVisible, setAreaModalVisible] = useState<boolean>(false);
  const [selectedSociety, setSelectedSociety] = useState<SocietyItem>({
    id: '11111111-1111-1111-1111-111111111111',
    name: 'SGU Campus Eco-Zone',
    health_score: 78,
  });

  const [score, setScore] = useState<number>(78);
  const [delta, setDelta] = useState<number>(6);
  const [rank, setRank] = useState<string>('#3 of 18');
  const [speciesCount, setSpeciesCount] = useState<number>(1420);
  const [co2Tonnes, setCo2Tonnes] = useState<number>(62);
  const [factors, setFactors] = useState<FactorItem[]>([]);
  const [trendData, setTrendData] = useState<number[]>([62, 65, 68, 72, 70, 78]);
  const [cityAvg, setCityAvg] = useState<number>(71);
  const [bestScore, setBestScore] = useState<number>(90);
  const [positives, setPositives] = useState<string[]>([
    'Peafowl habitat corridor restored near north lake.',
    'Dry waste diversion up 18% through smart lockers.',
    'Campus clean raid participation crossed 180 stewards.',
  ]);
  const [negatives, setNegatives] = useState<string[]>([
    'E-waste collection pit requires routine maintenance.',
    'Cafeteria bio-waste separation adherence at 50%.',
  ]);
  const [societiesList, setSocietiesList] = useState<SocietyItem[]>([
    { id: '1', name: 'SGU Campus Eco-Zone', health_score: 78, participation: '184 Stewards' },
    { id: '2', name: 'Green Valley Enclave', health_score: 84, participation: '210 Stewards' },
    { id: '3', name: 'Bio-Tech Park Zone', health_score: 72, participation: '95 Stewards' },
  ]);
  const [institutions, setInstitutions] = useState<InstitutionItem[]>([]);

  useEffect(() => {
    fetchDashboardData();
  }, [selectedSociety.id, period]);

  const fetchDashboardData = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('get-dashboard-data', {
        body: { society_id: selectedSociety.id, period },
      });

      if (!error && data) {
        setScore(data.score || 78);
        setDelta(data.delta || 6);
        setRank(data.rank || '#3 of 18');
        setSpeciesCount(data.species || 1420);
        setCo2Tonnes(data.co2_tonnes || 62);
        if (Array.isArray(data.factors)) setFactors(data.factors);
        if (Array.isArray(data.trend)) setTrendData(data.trend);
        if (data.cityAvg) setCityAvg(data.cityAvg);
        if (data.best?.score) setBestScore(data.best.score);
        if (data.insights?.positives) setPositives(data.insights.positives);
        if (data.insights?.negatives) setNegatives(data.insights.negatives);
        if (Array.isArray(data.societies)) setSocietiesList(data.societies);
        if (Array.isArray(data.institutions)) setInstitutions(data.institutions);
      }
    } catch (err) {
      console.warn('Fallback to local state due to Edge Function error:', err);
    }
    setLoading(false);
    setRefreshing(false);
  };

  const onRefresh = () => {
    setRefreshing(true);
    fetchDashboardData();
  };

  return (
    <View style={[styles.container, { backgroundColor: '#F8FAF8', paddingTop: Math.max(insets.top, 16) }]}>
      {/* Top Header Bar */}
      <View style={styles.headerBar}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn} activeOpacity={0.7}>
          <Ionicons name="arrow-back" size={22} color="#161D18" />
        </TouchableOpacity>
        <View style={styles.headerTextGroup}>
          <Text style={styles.headingTitle}>Ecosystem Analytics</Text>
          <Text style={styles.headingSub}>Territory Ecological Health Metrics</Text>
        </View>
      </View>

      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#2BB673" />}
      >
        {/* Filter Pills */}
        <View style={styles.filterRow}>
          <FilterPill
            label={selectedSociety.name}
            icon="location-outline"
            active
            onPress={() => setAreaModalVisible(true)}
            canvas="warm"
          />
          <FilterPill
            label={period === 'monthly' ? 'This Month' : 'Quarterly'}
            icon="calendar-outline"
            active
            onPress={() => setPeriod(period === 'monthly' ? 'quarterly' : 'monthly')}
            canvas="warm"
          />
        </View>

        {loading && !refreshing ? (
          <ActivityIndicator size="large" color="#2BB673" style={{ marginVertical: 40 }} />
        ) : (
          <>
            {/* Minimalist Hero Health Card */}
            <View style={styles.heroCard}>
              <View style={styles.heroTopSection}>
                <HealthRing
                  score={score}
                  size={104}
                  strokeWidth={8}
                  trackColor="rgba(43, 182, 115, 0.15)"
                />
                <View style={styles.heroScoreMeta}>
                  <View style={styles.statusPill}>
                    <View style={styles.statusDot} />
                    <Text style={styles.statusText}>Active Pilot Zone</Text>
                  </View>
                  <Text style={styles.heroScoreLabel}>Overall Health Score</Text>
                  <Text style={styles.heroSubNotice}>
                    {score >= 75 ? 'Healthy & Thriving' : 'Moderate Intervention Needed'}
                  </Text>
                </View>
              </View>

              {/* 2x2 Aligned Flat Metric Grid */}
              <View style={styles.statsGrid}>
                {/* Box 1: Delta */}
                <View style={styles.statBox}>
                  <View style={[styles.statIconCircle, { backgroundColor: delta >= 0 ? '#D9F3E9' : '#FFDAD6' }]}>
                    <Ionicons
                      name={delta >= 0 ? 'trending-up' : 'trending-down'}
                      size={14}
                      color={delta >= 0 ? '#00A86B' : '#BA1A1A'}
                    />
                  </View>
                  <Text style={[styles.statVal, { color: delta >= 0 ? '#00A86B' : '#BA1A1A' }]}>
                    {delta >= 0 ? `+${delta} pts` : `${delta} pts`}
                  </Text>
                  <Text style={styles.statLabel}>vs Last Period</Text>
                </View>

                {/* Box 2: Rank */}
                <View style={styles.statBox}>
                  <View style={[styles.statIconCircle, { backgroundColor: '#FFF5E5' }]}>
                    <Ionicons name="trophy" size={14} color="#FF9966" />
                  </View>
                  <Text style={styles.statVal}>{rank}</Text>
                  <Text style={styles.statLabel}>Campus Rank</Text>
                </View>

                {/* Box 3: Species Count */}
                <View style={styles.statBox}>
                  <View style={[styles.statIconCircle, { backgroundColor: '#D9F3E9' }]}>
                    <Ionicons name="leaf" size={14} color="#00A86B" />
                  </View>
                  <Text style={styles.statVal}>{speciesCount}</Text>
                  <Text style={styles.statLabel}>Species Logged</Text>
                </View>

                {/* Box 4: CO₂ Tonnes */}
                <View style={styles.statBox}>
                  <View style={[styles.statIconCircle, { backgroundColor: '#EFF6FF' }]}>
                    <Ionicons name="cloud" size={14} color="#3B82F6" />
                  </View>
                  <Text style={styles.statVal}>{co2Tonnes}t</Text>
                  <Text style={styles.statLabel}>CO₂ Abated</Text>
                </View>
              </View>
            </View>

            {/* 6-Factor Health Breakdown */}
            <FactorGrid factors={factors.length > 0 ? factors : undefined} />

            {/* Trend Chart */}
            <TrendChart data={trendData} />

            {/* Society Health Leaderboard */}
            <View style={styles.sectionContainer}>
              <View style={styles.sectionHeaderRow}>
                <Text style={styles.subHeading}>Society Health Leaderboard</Text>
                <Text style={styles.subBadge}>{societiesList.length} Zones</Text>
              </View>

              <View style={styles.societyList}>
                {(societiesList.length > 0 ? societiesList : [selectedSociety]).map((soc, idx) => (
                  <View key={soc.id} style={styles.socCard}>
                    <View style={[styles.rankTag, idx === 0 && styles.rankTagGold, idx === 1 && styles.rankTagSilver]}>
                      <Text style={[styles.rankTagText, (idx === 0 || idx === 1) && { color: '#FFFFFF' }]}>
                        #{idx + 1}
                      </Text>
                    </View>

                    <HealthRing
                      score={soc.health_score}
                      size={44}
                      strokeWidth={4.5}
                      showLabel={false}
                      trackColor="rgba(43, 182, 115, 0.15)"
                    />

                    <View style={{ flex: 1 }}>
                      <Text style={styles.socName}>{soc.name}</Text>
                      <Text style={styles.socSub}>{soc.participation || 'Active Community Zone'}</Text>
                    </View>

                    <Text style={styles.socScoreVal}>{soc.health_score}%</Text>
                  </View>
                ))}
              </View>
            </View>

            {/* Ecosystem Insights Card */}
            <View style={styles.insightsCard}>
              <View style={styles.insightHeaderRow}>
                <Ionicons name="bulb-outline" size={18} color="#00A86B" />
                <Text style={styles.insightTitle}>Ecosystem Insights & Audit</Text>
              </View>

              <View style={styles.insightList}>
                {positives.map((item, idx) => (
                  <View key={`pos-${idx}`} style={styles.insightRow}>
                    <View style={[styles.insightDot, { backgroundColor: '#D9F3E9' }]}>
                      <Ionicons name="checkmark" size={12} color="#00A86B" />
                    </View>
                    <Text style={styles.insightText}>{item}</Text>
                  </View>
                ))}
                {negatives.map((item, idx) => (
                  <View key={`neg-${idx}`} style={styles.insightRow}>
                    <View style={[styles.insightDot, { backgroundColor: '#FFF5E5' }]}>
                      <Ionicons name="alert" size={12} color="#FF9966" />
                    </View>
                    <Text style={styles.insightText}>{item}</Text>
                  </View>
                ))}
              </View>
            </View>
          </>
        )}
      </ScrollView>

      {/* Society Picker Modal */}
      <Modal visible={areaModalVisible} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Select Eco Society</Text>
              <TouchableOpacity onPress={() => setAreaModalVisible(false)}>
                <Ionicons name="close" size={22} color="#6D7A6F" />
              </TouchableOpacity>
            </View>

            <FlatList
              data={societiesList.length > 0 ? societiesList : [selectedSociety]}
              keyExtractor={(item) => item.id}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={styles.modalRow}
                  onPress={() => {
                    setSelectedSociety(item);
                    setAreaModalVisible(false);
                  }}
                >
                  <Text style={styles.modalItemName}>{item.name}</Text>
                  <Text style={styles.modalItemScore}>{item.health_score}%</Text>
                </TouchableOpacity>
              )}
            />
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  headerBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    gap: 12,
    marginBottom: 6,
  },
  backBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: 'rgba(0, 0, 0, 0.08)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTextGroup: {
    flex: 1,
  },
  headingTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: '#161D18',
    letterSpacing: -0.3,
  },
  headingSub: {
    fontSize: 12,
    color: '#6D7A6F',
    marginTop: 1,
  },
  content: {
    paddingHorizontal: 20,
    paddingTop: 8,
    gap: 16,
    paddingBottom: 48,
  },
  filterRow: {
    flexDirection: 'row',
    gap: 8,
  },
  heroCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 22,
    padding: 18,
    borderWidth: 1,
    borderColor: 'rgba(0, 0, 0, 0.06)',
    gap: 16,
  },
  heroTopSection: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  heroScoreMeta: {
    flex: 1,
    gap: 3,
  },
  statusPill: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    backgroundColor: '#D9F3E9',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 9999,
    gap: 5,
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#00A86B',
  },
  statusText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#154212',
  },
  heroScoreLabel: {
    fontSize: 15,
    fontWeight: '800',
    color: '#161D18',
    marginTop: 2,
  },
  heroSubNotice: {
    fontSize: 12,
    color: '#6D7A6F',
    fontWeight: '500',
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    gap: 10,
  },
  statBox: {
    width: '48.5%',
    padding: 12,
    borderRadius: 14,
    backgroundColor: '#F8FAF8',
    borderWidth: 1,
    borderColor: 'rgba(0, 0, 0, 0.04)',
    alignItems: 'center',
    gap: 2,
  },
  statIconCircle: {
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 2,
  },
  statVal: {
    fontSize: 16,
    fontWeight: '800',
    color: '#161D18',
    letterSpacing: -0.3,
  },
  statLabel: {
    fontSize: 10,
    fontWeight: '600',
    color: '#6D7A6F',
  },
  sectionContainer: {
    gap: 10,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 2,
  },
  subHeading: {
    fontSize: 15,
    fontWeight: '800',
    color: '#161D18',
    letterSpacing: -0.2,
  },
  subBadge: {
    fontSize: 11,
    fontWeight: '700',
    color: '#2BB673',
  },
  societyList: {
    gap: 8,
  },
  socCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    padding: 12,
    borderWidth: 1,
    borderColor: 'rgba(0, 0, 0, 0.06)',
    gap: 12,
  },
  rankTag: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: '#F0F2F0',
    alignItems: 'center',
    justifyContent: 'center',
  },
  rankTagGold: {
    backgroundColor: '#E8A920',
  },
  rankTagSilver: {
    backgroundColor: '#94A3B8',
  },
  rankTagText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#6D7A6F',
  },
  socName: {
    fontSize: 13,
    fontWeight: '700',
    color: '#161D18',
  },
  socSub: {
    fontSize: 11,
    color: '#6D7A6F',
    marginTop: 1,
  },
  socScoreVal: {
    fontSize: 16,
    fontWeight: '800',
    color: '#00A86B',
  },
  insightsCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 16,
    borderWidth: 1,
    borderColor: 'rgba(0, 0, 0, 0.06)',
    gap: 12,
  },
  insightHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  insightTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: '#161D18',
  },
  insightList: {
    gap: 8,
  },
  insightRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
  },
  insightDot: {
    width: 20,
    height: 20,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 1,
  },
  insightText: {
    fontSize: 12,
    color: '#3D4A40',
    flex: 1,
    lineHeight: 17,
  },
  modalOverlay: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
  },
  modalCard: {
    backgroundColor: '#FFFFFF',
    maxHeight: '60%',
    gap: 12,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    padding: 20,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  modalTitle: {
    fontSize: 17,
    fontWeight: '800',
    color: '#161D18',
  },
  modalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F4F1',
  },
  modalItemName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#161D18',
  },
  modalItemScore: {
    fontSize: 14,
    fontWeight: '800',
    color: '#00A86B',
  },
});
