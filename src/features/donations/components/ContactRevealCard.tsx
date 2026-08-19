import React, { useEffect, useState } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  Linking,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { RevealedContactBundle } from '../types';
import { getAcceptedDonationContact } from '../donationsService';

interface ContactRevealCardProps {
  donationId: string;
  requestId: string;
  isDonorView?: boolean;
}

export const ContactRevealCard: React.FC<ContactRevealCardProps> = ({
  donationId,
  requestId,
  isDonorView = false,
}) => {
  const [loading, setLoading] = useState(true);
  const [contact, setContact] = useState<RevealedContactBundle | null>(null);

  useEffect(() => {
    loadContact();
  }, [donationId, requestId]);

  const loadContact = async () => {
    setLoading(true);
    const res = await getAcceptedDonationContact(donationId, requestId);
    if (res.success && res.contact) {
      setContact(res.contact);
    }
    setLoading(false);
  };

  const handleCall = (phone: string) => {
    Linking.openURL(`tel:${phone.replace(/\s+/g, '')}`).catch(() => {
      Alert.alert('Phone Call', `Could not open dialer for ${phone}`);
    });
  };

  const handleEmail = (email: string) => {
    Linking.openURL(`mailto:${email}`).catch(() => {
      Alert.alert('Email', `Could not open email client for ${email}`);
    });
  };

  const handleOpenMaps = (lat: number, lng: number, label: string) => {
    const url = `https://www.google.com/maps/search/?api=1&query=${lat},${lng}`;
    Linking.openURL(url).catch(() => {
      Alert.alert('Map Error', 'Could not open maps application.');
    });
  };

  if (loading) {
    return (
      <View style={styles.loadingBox}>
        <ActivityIndicator size="small" color="#00A86B" />
        <Text style={styles.loadingText}>Unlocking verified contact details...</Text>
      </View>
    );
  }

  if (!contact) {
    return (
      <View style={styles.errorBox}>
        <Ionicons name="information-circle-outline" size={16} color="#64748B" />
        <Text style={styles.errorText}>Contact details reveal once the claim is accepted.</Text>
      </View>
    );
  }

  const { donor, requester } = contact;

  return (
    <View style={styles.container}>
      <View style={styles.headerRow}>
        <View style={styles.verifiedChip}>
          <Ionicons name="checkmark-circle" size={14} color="#00A86B" />
          <Text style={styles.verifiedText}>CLAIM ACCEPTED · CONTACT UNLOCKED</Text>
        </View>
      </View>

      {/* If requester view, show donor's exact pickup instructions */}
      {!isDonorView && (
        <View style={styles.sectionCol}>
          <Text style={styles.sectionTitle}>DONOR PICKUP INSTRUCTIONS</Text>

          <View style={styles.infoRow}>
            <Ionicons name="location" size={16} color="#00A86B" />
            <View style={{ flex: 1 }}>
              <Text style={styles.infoTitle}>Exact Address</Text>
              <Text style={styles.infoVal}>{donor.exact_address}</Text>
            </View>
            <TouchableOpacity
              style={styles.mapBtn}
              onPress={() => handleOpenMaps(donor.exact_lat, donor.exact_lng, donor.exact_address)}
            >
              <Ionicons name="navigate" size={14} color="#FFFFFF" />
              <Text style={styles.mapBtnText}>Map</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.infoRow}>
            <Ionicons name="time-outline" size={16} color="#00A86B" />
            <View style={{ flex: 1 }}>
              <Text style={styles.infoTitle}>Availability Window</Text>
              <Text style={styles.infoVal}>{donor.availability_window}</Text>
            </View>
          </View>

          <View style={styles.contactBtnRow}>
            <TouchableOpacity style={styles.actionBtn} onPress={() => handleCall(donor.phone)}>
              <Ionicons name="call" size={14} color="#154212" />
              <Text style={styles.actionBtnText}>{donor.phone}</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.actionBtn} onPress={() => handleEmail(donor.email)}>
              <Ionicons name="mail" size={14} color="#154212" />
              <Text style={styles.actionBtnText}>Email</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}

      {/* If donor view, show requester's contact & intended purpose */}
      {isDonorView && (
        <View style={styles.sectionCol}>
          <Text style={styles.sectionTitle}>REQUESTER DETAILS</Text>

          <View style={styles.infoRow}>
            <Ionicons name="flower-outline" size={16} color="#00A86B" />
            <View style={{ flex: 1 }}>
              <Text style={styles.infoTitle}>Earth-Healing Purpose</Text>
              <Text style={styles.infoVal}>{requester.intended_use}</Text>
            </View>
          </View>

          <View style={styles.contactBtnRow}>
            <TouchableOpacity style={styles.actionBtn} onPress={() => handleCall(requester.phone)}>
              <Ionicons name="call" size={14} color="#154212" />
              <Text style={styles.actionBtnText}>{requester.phone}</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.actionBtn} onPress={() => handleEmail(requester.email)}>
              <Ionicons name="mail" size={14} color="#154212" />
              <Text style={styles.actionBtnText}>Email</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#F4FAF5',
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: 'rgba(0, 168, 107, 0.3)',
    gap: 10,
    marginTop: 8,
  },
  loadingBox: {
    padding: 14,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  loadingText: {
    fontSize: 12,
    color: '#64748B',
  },
  errorBox: {
    padding: 10,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  errorText: {
    fontSize: 12,
    color: '#64748B',
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  verifiedChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: '#D9F3E9',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  verifiedText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#154212',
    letterSpacing: 0.4,
  },
  sectionCol: {
    gap: 8,
  },
  sectionTitle: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.6,
    color: '#154212',
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#FFFFFF',
    padding: 10,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: 'rgba(0, 168, 107, 0.15)',
  },
  infoTitle: {
    fontSize: 10,
    fontWeight: '700',
    color: '#64748B',
  },
  infoVal: {
    fontSize: 12,
    fontWeight: '700',
    color: '#0F172A',
    marginTop: 1,
  },
  mapBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#00A86B',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
  },
  mapBtnText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  contactBtnRow: {
    flexDirection: 'row',
    gap: 8,
  },
  actionBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: '#D9F3E9',
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(0, 168, 107, 0.25)',
  },
  actionBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#154212',
  },
});
