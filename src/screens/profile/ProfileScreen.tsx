import React from 'react';
import { StyleSheet, Text, View, ScrollView, TouchableOpacity } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuth } from '../../context/AuthContext';
import { Ionicons } from '@expo/vector-icons';

export const ProfileScreen: React.FC = () => {
  const insets = useSafeAreaInsets();
  const { user, signOut } = useAuth();

  return (
    <View style={[styles.container, { paddingTop: Math.max(insets.top, 16) }]}>
      <View style={styles.header}>
        <Ionicons name="person-circle" size={24} color="#10B981" />
        <Text style={styles.headerTitle}>User Profile</Text>
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.profileCard}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>
              {user?.email?.charAt(0).toUpperCase() || 'E'}
            </Text>
          </View>
          <Text style={styles.displayName}>
            {user?.user_metadata?.display_name || user?.email?.split('@')[0] || 'Eco Explorer'}
          </Text>
          <Text style={styles.emailText}>{user?.email || 'explorer@ecoquest.demo'}</Text>
          
          <View style={styles.trustBadge}>
            <Ionicons name="shield-checkmark" size={16} color="#10B981" />
            <Text style={styles.trustText}>Trust Score: 100 (Tier 0 Verified)</Text>
          </View>
        </View>

        <View style={styles.infoCard}>
          <Text style={styles.infoTitle}>Session Info</Text>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>User ID:</Text>
            <Text style={styles.infoVal} numberOfLines={1} ellipsizeMode="middle">
              {user?.id || 'demo-user-id'}
            </Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Auth Provider:</Text>
            <Text style={styles.infoVal}>Supabase Auth</Text>
          </View>
        </View>

        <TouchableOpacity style={styles.signOutBtn} onPress={signOut}>
          <Ionicons name="log-out-outline" size={20} color="#EF4444" />
          <Text style={styles.signOutText}>Sign Out</Text>
        </TouchableOpacity>
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
  profileCard: {
    backgroundColor: '#0F241C',
    borderRadius: 20,
    padding: 24,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#19392B',
  },
  avatar: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: '#10B981',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  avatarText: {
    color: '#042F2E',
    fontSize: 32,
    fontWeight: '800',
  },
  displayName: {
    fontSize: 20,
    fontWeight: '700',
    color: '#F0FDF4',
  },
  emailText: {
    fontSize: 13,
    color: '#9CA3AF',
    marginTop: 2,
  },
  trustBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(16, 185, 129, 0.15)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    marginTop: 16,
    gap: 6,
  },
  trustText: {
    color: '#6EE7B7',
    fontSize: 12,
    fontWeight: '600',
  },
  infoCard: {
    backgroundColor: '#0F241C',
    borderRadius: 16,
    padding: 18,
    borderWidth: 1,
    borderColor: '#19392B',
  },
  infoTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#E5E7EB',
    marginBottom: 12,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  infoLabel: {
    color: '#9CA3AF',
    fontSize: 13,
  },
  infoVal: {
    color: '#D1D5DB',
    fontSize: 13,
    fontWeight: '500',
    maxWidth: '60%',
  },
  signOutBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(239, 68, 68, 0.3)',
    borderRadius: 14,
    height: 48,
    marginTop: 8,
    gap: 8,
  },
  signOutText: {
    color: '#EF4444',
    fontSize: 15,
    fontWeight: '700',
  },
});
