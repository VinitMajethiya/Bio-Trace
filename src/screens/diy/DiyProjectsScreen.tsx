import React, { useState } from 'react';
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation, useRoute } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../providers/ThemeProvider';
import { WarmCard } from '../../components/common/BioCard';
import { FilterPill } from '../../components/common/FilterChip';
import { PrimaryButton } from '../../components/common/PrimaryButton';
import { GreenPointsChip } from '../../components/common/GreenPointsChip';
import { IconButton } from '../../components/common/IconButton';
import { DIY_PROJECTS_CATALOG, openYouTubeTutorial } from '../../lib/diy';
import { WASTE_CATEGORIES } from '../../lib/circular';

export const DiyProjectsScreen: React.FC = () => {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const { colors } = useTheme();

  const initialCategory = route.params?.initialCategoryId || 'all';
  const [selectedCatId, setSelectedCatId] = useState<string>(initialCategory);

  const filteredProjects = DIY_PROJECTS_CATALOG.filter((project) => {
    if (selectedCatId === 'all') return true;
    return project.categoryId === selectedCatId;
  });

  return (
    <View style={[styles.container, { backgroundColor: colors.canvas_airy || '#f4fbf3', paddingTop: Math.max(insets.top, 16) }]}>
      {/* Top Header */}
      <View style={styles.topHeader}>
        <IconButton icon="arrow-back" onPress={() => navigation.goBack()} />
        <Text style={[styles.displayTitle, { color: colors.text_airy_primary || '#161d18' }]}>
          Upcycling Guides
        </Text>
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <Text style={[styles.headingSub, { color: colors.text_airy_secondary || '#3d4a40' }]}>
          Transform waste recyclables into thriving gardens & native feeders.
        </Text>

        {/* Filter Pills Scroll */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterBar}>
          <FilterPill
            label="All Materials"
            active={selectedCatId === 'all'}
            onPress={() => setSelectedCatId('all')}
            canvas="warm"
          />
          {WASTE_CATEGORIES.map((cat) => (
            <FilterPill
              key={cat.id}
              label={cat.name}
              active={selectedCatId === cat.id}
              onPress={() => setSelectedCatId(cat.id)}
              canvas="warm"
            />
          ))}
        </ScrollView>

        {/* Project Cards Grid */}
        <View style={styles.projectsStack}>
          {filteredProjects.map((project) => (
            <WarmCard
              key={project.id}
              padding={20}
              imageSrc="https://images.unsplash.com/photo-1585320806297-9794b3e4eeae?w=800"
              imageHeight={150}
              style={styles.projectCard}
            >
              <View style={styles.cardHeaderRow}>
                <Text style={[styles.projectTitle, { color: colors.text_on_warm_primary || '#142217' }]}>{project.title}</Text>
                <GreenPointsChip points={50} label="DIY XP" />
              </View>

              <Text style={[styles.projectDesc, { color: colors.text_on_warm_secondary || '#3E6B48' }]}>{project.description}</Text>

              <View style={styles.pillTagRow}>
                <FilterPill label={project.difficulty} active={false} onPress={() => {}} canvas="warm" />
                <FilterPill label={`⏱️ ${project.timeEstimate}`} active={false} onPress={() => {}} canvas="warm" />
              </View>

              <PrimaryButton
                title="Watch Tutorial Video"
                icon="logo-youtube"
                onPress={() => openYouTubeTutorial(project.youtubeSearchQuery)}
                style={{ marginTop: 8 }}
              />
            </WarmCard>
          ))}
        </View>
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
    fontSize: 32,
    lineHeight: 38,
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
  filterBar: {
    gap: 8,
    paddingVertical: 2,
  },
  projectsStack: {
    gap: 16,
  },
  projectCard: {
    gap: 10,
  },
  cardHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: 12,
  },
  projectTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#142217',
    flex: 1,
  },
  projectDesc: {
    fontSize: 13,
    color: '#3E6B48',
    lineHeight: 18,
  },
  pillTagRow: {
    flexDirection: 'row',
    gap: 8,
  },
});
