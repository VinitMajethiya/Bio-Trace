import React from 'react';
import { StyleSheet, Text, View, ScrollView, TouchableOpacity } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';

export const WildScreen: React.FC = () => {
  const insets = useSafeAreaInsets();

  return (
    <View style={[styles.container, { paddingTop: Math.max(insets.top, 16) }]}>
      <View style={styles.header}>
        <Ionicons name="compass" size={24} color="#10B981" />
        <Text style={styles.headerTitle}>Wild — Biodiversity</Text>
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.heroCard}>
          <Ionicons name="camera" size={48} color="#34D399" />
          <Text style={styles.heroTitle}>Species Sighting & AI Identifier</Text>
          <Text style={styles.heroSub}>
            Spot native birds or flora in the campus pilot zone, log photo, and gain Wild XP.
          </Text>
          <TouchableOpacity style={styles.actionBtn}>
            <Ionicons name="aperture" size={18} color="#042F2E" />
            <Text style={styles.actionBtnText}>Log Sighting (Stage 3)</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.statsRow}>
          <View style={styles.statBox}>
            <Text style={styles.statVal}>0</Text>
            <Text style={styles.statLabel}>Observations</Text>
          </View>
          <View style={styles.statBox}>
            <Text style={styles.statVal}>0 XP</Text>
            <Text style={styles.statLabel}>Wild Rank</Text>
          </View>
        </View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#07120E',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#132A20',
    gap: 8,
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: '#ECFDF5',
  },
  content: {
    padding: 20,
    gap: 16,
  },
  heroCard: {
    backgroundColor: '#0F241C',
    borderRadius: 20,
    padding: 24,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#19392B',
  },
  heroTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#F0FDF4',
    marginTop: 12,
    textAlign: 'center',
  },
  heroSub: {
    fontSize: 13,
    color: '#9CA3AF',
    textAlign: 'center',
    marginTop: 6,
    lineHeight: 18,
  },
  actionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#34D399',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 12,
    marginTop: 18,
    gap: 8,
  },
  actionBtnText: {
    color: '#042F2E',
    fontSize: 14,
    fontWeight: '700',
  },
  statsRow: {
    flexDirection: 'row',
    gap: 12,
  },
  statBox: {
    flex: 1,
    backgroundColor: '#0F241C',
    padding: 16,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#19392B',
    alignItems: 'center',
  },
  statVal: {
    fontSize: 20,
    fontWeight: '800',
    color: '#34D399',
  },
  statLabel: {
    fontSize: 12,
    color: '#9CA3AF',
    marginTop: 4,
  },
});
