import React from 'react';
import { StyleSheet, Text, View, ScrollView, TouchableOpacity } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';

export const CircularScreen: React.FC = () => {
  const insets = useSafeAreaInsets();

  return (
    <View style={[styles.container, { paddingTop: Math.max(insets.top, 16) }]}>
      <View style={styles.header}>
        <Ionicons name="refresh-circle" size={24} color="#3B82F6" />
        <Text style={styles.headerTitle}>Circular — Waste Marketplace</Text>
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.heroCard}>
          <Ionicons name="cube-outline" size={48} color="#60A5FA" />
          <Text style={styles.heroTitle}>AI Waste Scanner & Locker</Text>
          <Text style={styles.heroSub}>
            Scan or pick waste categories (Paper, Metal, E-Waste, Glass) to log weight, earn cash payout & boost the Health Score.
          </Text>
          <TouchableOpacity style={styles.actionBtn}>
            <Ionicons name="add-circle" size={18} color="#000000" />
            <Text style={styles.actionBtnText}>Open Waste Locker (Stage 4)</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.statsRow}>
          <View style={styles.statBox}>
            <Text style={styles.statVal}>0.0 kg</Text>
            <Text style={styles.statLabel}>Waste Recycled</Text>
          </View>
          <View style={styles.statBox}>
            <Text style={styles.statVal}>₹ 0.00</Text>
            <Text style={styles.statLabel}>Mock Payout</Text>
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
    backgroundColor: '#0A1E36',
    borderRadius: 20,
    padding: 24,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#1D3B60',
  },
  heroTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#EFF6FF',
    marginTop: 12,
    textAlign: 'center',
  },
  heroSub: {
    fontSize: 13,
    color: '#93C5FD',
    textAlign: 'center',
    marginTop: 6,
    lineHeight: 18,
  },
  actionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#60A5FA',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 12,
    marginTop: 18,
    gap: 8,
  },
  actionBtnText: {
    color: '#0F172A',
    fontSize: 14,
    fontWeight: '700',
  },
  statsRow: {
    flexDirection: 'row',
    gap: 12,
  },
  statBox: {
    flex: 1,
    backgroundColor: '#0A1E36',
    padding: 16,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#1D3B60',
    alignItems: 'center',
  },
  statVal: {
    fontSize: 20,
    fontWeight: '800',
    color: '#60A5FA',
  },
  statLabel: {
    fontSize: 12,
    color: '#93C5FD',
    marginTop: 4,
  },
});
