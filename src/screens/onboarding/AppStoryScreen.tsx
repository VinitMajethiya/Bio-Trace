import React from 'react';
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../providers/ThemeProvider';
import { BioCard } from '../../components/common/BioCard';
import { PrimaryButton } from '../../components/common/PrimaryButton';

export const AppStoryScreen: React.FC = () => {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<any>();
  const { colors, radii, shadows } = useTheme();

  const handleEnterApp = () => {
    navigation.replace('MainTabs');
  };

  return (
    <View
      style={[
        styles.container,
        {
          backgroundColor: colors.canvas_airy || '#f4fbf3',
          paddingTop: Math.max(insets.top, 12),
        },
      ]}
    >
      <ScrollView
        contentContainerStyle={[
          styles.scrollContent,
          { paddingBottom: Math.max(insets.bottom, 24) + 40 },
        ]}
        showsVerticalScrollIndicator={false}
      >
        {/* 1. Lush Eco Hero Banner */}
        <View style={styles.heroWrapper}>
          <View
            style={[
              styles.heroBackground,
              { backgroundColor: colors.forest_green || '#154212' },
            ]}
          >
            {/* Top Brand Header */}
            <View style={styles.heroBrandRow}>
              <View style={styles.logoBadgeCircle}>
                <Ionicons name="leaf" size={20} color="#FFFFFF" />
              </View>
              <Text style={styles.wordmarkText}>BioVerse</Text>
              <View style={styles.heroPillBadge}>
                <Text style={styles.heroPillText}>CITIZEN SCIENCE</Text>
              </View>
            </View>

            <Text style={styles.heroHeadline}>
              Powering Biodiversity & Zero-Waste Impact
            </Text>

            <Text style={styles.heroSubText}>
              Turn your smartphone into an AI tool to protect local wildlife and eliminate urban waste.
            </Text>

            {/* Headline Stats Chips */}
            <View style={styles.heroStatsRow}>
              <View style={styles.heroStatChip}>
                <Text style={styles.statChipNumber}>69%</Text>
                <Text style={styles.statChipLabel}>Wildlife Population Decline</Text>
                <Text style={styles.statChipSource}>WWF Living Planet Report</Text>
              </View>

              <View style={styles.heroStatChip}>
                <Text style={styles.statChipNumber}>62M</Text>
                <Text style={styles.statChipLabel}>Tonnes Waste / Year (India)</Text>
                <Text style={styles.statChipSource}>Govt. of India MoEFCC</Text>
              </View>
            </View>
          </View>
        </View>

        {/* 2. The Crisis We Face (2x2 Impact Grid) */}
        <BioCard padding={18} style={styles.card}>
          <View style={styles.sectionHeaderRow}>
            <View style={[styles.headerIconBg, { backgroundColor: colors.coral_subtle || '#FFDBCC' }]}>
              <Ionicons name="alert-circle" size={18} color={colors.coral || '#FF9966'} />
            </View>
            <Text style={[styles.sectionTitle, { color: colors.text_airy_primary || '#161d18' }]}>
              The Crisis We Face
            </Text>
          </View>

          <View style={styles.problemGrid}>
            <View style={[styles.problemCell, { backgroundColor: '#FFF8F6' }]}>
              <Ionicons name="leaf-outline" size={22} color={colors.coral_dark || '#97481B'} />
              <Text style={[styles.problemCellTitle, { color: colors.text_airy_primary || '#161d18' }]}>
                Habitat Loss
              </Text>
              <Text style={[styles.problemCellDesc, { color: colors.text_airy_secondary || '#3d4a40' }]}>
                Urban expansion destroying corridors
              </Text>
            </View>

            <View style={[styles.problemCell, { backgroundColor: '#FFFDF0' }]}>
              <Ionicons name="search-outline" size={22} color={colors.amber || '#E8A920'} />
              <Text style={[styles.problemCellTitle, { color: colors.text_airy_primary || '#161d18' }]}>
                1M+ Species
              </Text>
              <Text style={[styles.problemCellDesc, { color: colors.text_airy_secondary || '#3d4a40' }]}>
                Extinction risk; unrecorded fauna
              </Text>
            </View>

            <View style={[styles.problemCell, { backgroundColor: '#FFF8F6' }]}>
              <Ionicons name="trash-bin-outline" size={22} color={colors.coral || '#FF9966'} />
              <Text style={[styles.problemCellTitle, { color: colors.text_airy_primary || '#161d18' }]}>
                Waste Pollution
              </Text>
              <Text style={[styles.problemCellDesc, { color: colors.text_airy_secondary || '#3d4a40' }]}>
                Unsegregated recyclables in landfills
              </Text>
            </View>

            <View style={[styles.problemCell, { backgroundColor: '#F4F8FF' }]}>
              <Ionicons name="people-outline" size={22} color="#3B82F6" />
              <Text style={[styles.problemCellTitle, { color: colors.text_airy_primary || '#161d18' }]}>
                Citizen Gap
              </Text>
              <Text style={[styles.problemCellDesc, { color: colors.text_airy_secondary || '#3d4a40' }]}>
                Low public tool participation
              </Text>
            </View>
          </View>
        </BioCard>

        {/* 3. How BioVerse Works (Visual 4-Step Journey) */}
        <BioCard padding={18} style={styles.card}>
          <View style={styles.sectionHeaderRow}>
            <View style={[styles.headerIconBg, { backgroundColor: colors.mint_background || '#D9F3E9' }]}>
              <Ionicons name="sparkles" size={18} color={colors.primary_emerald || '#00A86B'} />
            </View>
            <Text style={[styles.sectionTitle, { color: colors.text_airy_primary || '#161d18' }]}>
              How BioVerse Works
            </Text>
          </View>

          <View style={styles.stepsColumn}>
            {[
              {
                step: '01',
                title: 'AI Species Recognition',
                desc: 'Scan flora & fauna photo observations instantly.',
                icon: 'camera',
                color: colors.primary_emerald || '#00A86B',
                bg: colors.mint_background || '#D9F3E9',
              },
              {
                step: '02',
                title: 'Live Biodiversity Map',
                desc: 'Crowdsource sightings on live territory maps.',
                icon: 'map',
                color: '#3B82F6',
                bg: '#EFF6FF',
              },
              {
                step: '03',
                title: 'Smart Waste Scanner',
                desc: 'Identify recyclable waste for smart pickups.',
                icon: 'sync-circle',
                color: colors.coral || '#FF9966',
                bg: colors.coral_subtle || '#FFDBCC',
              },
              {
                step: '04',
                title: 'DIY Upcycling Assistant',
                desc: 'Turn waste materials into creative reuse projects.',
                icon: 'construct',
                color: '#8B5CF6',
                bg: '#F3E8FF',
              },
            ].map((item) => (
              <View key={item.step} style={styles.stepCardRow}>
                <View style={[styles.stepIconBg, { backgroundColor: item.bg }]}>
                  <Ionicons name={item.icon as any} size={22} color={item.color} />
                </View>
                <View style={styles.stepTextCol}>
                  <Text style={[styles.stepTagText, { color: item.color }]}>STEP {item.step}</Text>
                  <Text style={[styles.stepTitleText, { color: colors.text_airy_primary || '#161d18' }]}>
                    {item.title}
                  </Text>
                  <Text style={[styles.stepDescText, { color: colors.text_airy_secondary || '#3d4a40' }]}>
                    {item.desc}
                  </Text>
                </View>
              </View>
            ))}

            <View style={[styles.outcomeCard, { backgroundColor: colors.mint_background || '#D9F3E9' }]}>
              <Ionicons name="trophy" size={24} color={colors.primary_emerald || '#00A86B'} />
              <View style={{ flex: 1, gap: 2 }}>
                <Text style={[styles.outcomeTitle, { color: colors.forest_green || '#154212' }]}>
                  Earn Green Credits (GP)
                </Text>
                <Text style={[styles.outcomeSub, { color: colors.text_airy_secondary || '#3d4a40' }]}>
                  Boost community health & claim rewards!
                </Text>
              </View>
            </View>
          </View>
        </BioCard>

        {/* 4. Why BioVerse Comparison Feature Badges */}
        <BioCard padding={18} style={styles.card}>
          <View style={styles.sectionHeaderRow}>
            <View style={[styles.headerIconBg, { backgroundColor: colors.mint_background || '#D9F3E9' }]}>
              <Ionicons name="checkmark-done-circle" size={18} color={colors.primary_emerald || '#00A86B'} />
            </View>
            <Text style={[styles.sectionTitle, { color: colors.text_airy_primary || '#161d18' }]}>
              Why BioVerse?
            </Text>
          </View>

          <Text style={[styles.cardSubtitle, { color: colors.text_airy_muted || '#6d7a6f' }]}>
            All-in-one platform capabilities in a single mobile experience:
          </Text>

          <View style={styles.featureGrid}>
            {[
              { label: 'Species AI Scanner', icon: 'leaf' },
              { label: 'Smart Waste AI', icon: 'sync' },
              { label: 'Biodiversity Map', icon: 'planet' },
              { label: 'Green Rewards (GP)', icon: 'trophy' },
              { label: 'Citizen Science Net', icon: 'people' },
              { label: 'AI Analytics', icon: 'stats-chart' },
            ].map((f) => (
              <View key={f.label} style={[styles.featurePill, { backgroundColor: colors.mint_background || '#D9F3E9' }]}>
                <Ionicons name={f.icon as any} size={16} color={colors.primary_emerald || '#00A86B'} />
                <Text style={[styles.featureText, { color: colors.text_airy_primary || '#161d18' }]}>
                  {f.label}
                </Text>
              </View>
            ))}
          </View>
        </BioCard>

        {/* 5. Real-World Impact (UN SDGs) */}
        <BioCard padding={18} style={styles.card}>
          <View style={styles.sectionHeaderRow}>
            <View style={[styles.headerIconBg, { backgroundColor: '#EFF6FF' }]}>
              <Ionicons name="globe" size={18} color="#3B82F6" />
            </View>
            <Text style={[styles.sectionTitle, { color: colors.text_airy_primary || '#161d18' }]}>
              UN Sustainable Development Goals
            </Text>
          </View>

          <View style={styles.sdgGrid}>
            {[
              { code: 'SDG 11', label: 'Sustainable Cities', color: '#FD9D24' },
              { code: 'SDG 12', label: 'Responsible Consumption', color: '#BF8B2E' },
              { code: 'SDG 13', label: 'Climate Action', color: '#3F7E44' },
              { code: 'SDG 15', label: 'Life on Land', color: '#56C02B' },
              { code: 'SDG 17', label: 'Partnerships for Goals', color: '#19486A' },
            ].map((sdg) => (
              <View key={sdg.code} style={[styles.sdgCard, { backgroundColor: `${sdg.color}15`, borderColor: `${sdg.color}40` }]}>
                <View style={[styles.sdgBadge, { backgroundColor: sdg.color }]}>
                  <Text style={styles.sdgBadgeText}>{sdg.code}</Text>
                </View>
                <Text style={[styles.sdgCardLabel, { color: colors.text_airy_primary || '#161d18' }]} numberOfLines={1}>
                  {sdg.label}
                </Text>
              </View>
            ))}
          </View>
        </BioCard>

        {/* 6. The Team Placeholder Block */}
        <BioCard padding={18} style={styles.card}>
          <View style={styles.sectionHeaderRow}>
            <View style={[styles.headerIconBg, { backgroundColor: '#F3F4F6' }]}>
              <Ionicons name="people" size={18} color="#6B7280" />
            </View>
            <Text style={[styles.sectionTitle, { color: colors.text_airy_primary || '#161d18' }]}>
              The Team
            </Text>
            <View style={styles.placeholderTag}>
              <Text style={styles.placeholderTagText}>Placeholder</Text>
            </View>
          </View>

          <View style={styles.teamRow}>
            {[
              { name: 'Team Member 1', role: 'Project Lead', icon: 'person' },
              { name: 'Team Member 2', role: 'AI & Mobile Lead', icon: 'code-slash' },
              { name: 'Team Member 3', role: 'Bio Researcher', icon: 'flask' },
            ].map((m, i) => (
              <View key={i} style={[styles.teamCard, { backgroundColor: colors.canvas_airy || '#f4fbf3' }]}>
                <View style={[styles.teamAvatar, { backgroundColor: colors.mint_background || '#D9F3E9' }]}>
                  <Ionicons name={m.icon as any} size={20} color={colors.primary_emerald || '#00A86B'} />
                </View>
                <Text style={[styles.teamName, { color: colors.text_airy_primary || '#161d18' }]} numberOfLines={1}>
                  {m.name}
                </Text>
                <Text style={[styles.teamRole, { color: colors.text_airy_muted || '#6d7a6f' }]} numberOfLines={1}>
                  {m.role}
                </Text>
              </View>
            ))}
          </View>
        </BioCard>

        {/* 7. CTA Button Container */}
        <View style={styles.ctaWrapper}>
          <PrimaryButton
            title="Enter BioVerse"
            icon="arrow-forward"
            onPress={handleEnterApp}
            style={{ width: '100%', height: 54 }}
          />
        </View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 18,
    gap: 16,
  },
  heroWrapper: {
    borderRadius: 28,
    overflow: 'hidden',
    shadowColor: '#154212',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.18,
    shadowRadius: 16,
    elevation: 4,
  },
  heroBackground: {
    padding: 22,
    gap: 14,
  },
  heroBrandRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  logoBadgeCircle: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: 'rgba(255, 255, 255, 0.20)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  wordmarkText: {
    fontSize: 26,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: -0.4,
  },
  heroPillBadge: {
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    marginLeft: 'auto',
  },
  heroPillText: {
    fontSize: 9,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: 0.8,
  },
  heroHeadline: {
    fontSize: 22,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: -0.4,
    lineHeight: 28,
  },
  heroSubText: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.88)',
    lineHeight: 20,
    fontWeight: '500',
  },
  heroStatsRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 4,
  },
  heroStatChip: {
    flex: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    padding: 12,
    borderRadius: 18,
    gap: 2,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.18)',
  },
  statChipNumber: {
    fontSize: 22,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: -0.5,
  },
  statChipLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: '#FFFFFF',
    lineHeight: 15,
  },
  statChipSource: {
    fontSize: 9,
    color: 'rgba(255, 255, 255, 0.70)',
    fontStyle: 'italic',
    marginTop: 2,
  },
  card: {
    gap: 14,
    borderRadius: 24,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  headerIconBg: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sectionTitle: {
    fontSize: 17,
    fontWeight: '800',
    letterSpacing: -0.3,
  },
  cardSubtitle: {
    fontSize: 12,
    fontWeight: '500',
    marginTop: -4,
  },
  problemGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  problemCell: {
    width: '48%',
    padding: 12,
    borderRadius: 18,
    gap: 6,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.04)',
  },
  problemCellTitle: {
    fontSize: 14,
    fontWeight: '800',
  },
  problemCellDesc: {
    fontSize: 11,
    lineHeight: 15,
  },
  stepsColumn: {
    gap: 12,
  },
  stepCardRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  stepIconBg: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepTextCol: {
    flex: 1,
    gap: 2,
  },
  stepTagText: {
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 0.8,
  },
  stepTitleText: {
    fontSize: 14,
    fontWeight: '700',
  },
  stepDescText: {
    fontSize: 12,
    lineHeight: 16,
  },
  outcomeCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 14,
    borderRadius: 20,
    marginTop: 4,
  },
  outcomeTitle: {
    fontSize: 14,
    fontWeight: '800',
  },
  outcomeSub: {
    fontSize: 12,
  },
  featureGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  featurePill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 16,
    width: '48%',
  },
  featureText: {
    fontSize: 12,
    fontWeight: '700',
    flex: 1,
  },
  sdgGrid: {
    gap: 8,
  },
  sdgCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 10,
    borderRadius: 16,
    borderWidth: 1,
  },
  sdgBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  sdgBadgeText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  sdgCardLabel: {
    fontSize: 13,
    fontWeight: '700',
    flex: 1,
  },
  placeholderTag: {
    backgroundColor: '#E5E7EB',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 8,
    marginLeft: 'auto',
  },
  placeholderTagText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#6B7280',
  },
  teamRow: {
    flexDirection: 'row',
    gap: 10,
  },
  teamCard: {
    flex: 1,
    alignItems: 'center',
    padding: 12,
    borderRadius: 18,
    gap: 6,
  },
  teamAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  teamName: {
    fontSize: 11,
    fontWeight: '700',
    textAlign: 'center',
  },
  teamRole: {
    fontSize: 10,
    textAlign: 'center',
  },
  ctaWrapper: {
    marginTop: 6,
  },
});
