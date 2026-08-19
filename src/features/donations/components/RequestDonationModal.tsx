import React, { useState } from 'react';
import {
  StyleSheet,
  Text,
  View,
  Modal,
  ScrollView,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { DonationFeedItem } from '../types';
import { INTENDED_USE_OPTIONS } from '../constants';
import { submitDonationRequest } from '../donationsService';
import { useAuth } from '../../../context/AuthContext';

interface RequestDonationModalProps {
  item: DonationFeedItem | null;
  visible: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export const RequestDonationModal: React.FC<RequestDonationModalProps> = ({
  item,
  visible,
  onClose,
  onSuccess,
}) => {
  const { user } = useAuth();

  const [requestedQty, setRequestedQty] = useState(1);
  const [intendedUse, setIntendedUse] = useState(INTENDED_USE_OPTIONS[0].label);
  const [message, setMessage] = useState('');
  const [phone, setPhone] = useState('+91 98123 45678');
  const [email, setEmail] = useState(user?.email || '');
  const [submitting, setSubmitting] = useState(false);

  if (!item) return null;

  const maxQty = item.quantity_remaining || 1;

  const handleStep = (delta: number) => {
    setRequestedQty((prev) => Math.max(1, Math.min(maxQty, prev + delta)));
  };

  const handleSubmit = async () => {
    if (!user) {
      Alert.alert('Login Required', 'You must be logged in to request items.');
      return;
    }

    if (!phone.trim() || !email.trim()) {
      Alert.alert('Contact Details Required', 'Please provide a phone and email for pickup coordination.');
      return;
    }

    setSubmitting(true);
    try {
      const res = await submitDonationRequest({
        donation_id: item.id,
        requested_quantity: requestedQty,
        intended_use: intendedUse,
        message: message.trim() || undefined,
        requester_phone: phone.trim(),
        requester_email: email.trim(),
      });

      setSubmitting(false);

      if (res.success) {
        Alert.alert(
          '🌱 Claim Submitted!',
          `Your request for ${requestedQty} ${item.unit} of ${item.item_name} has been sent to the donor. Once accepted, pickup contact details will unlock automatically.`
        );
        onSuccess();
        onClose();
      } else {
        Alert.alert('Request Failed', res.error || 'Could not submit claim request.');
      }
    } catch (err: any) {
      setSubmitting(false);
      Alert.alert('Error', err.message || 'Network error');
    }
  };

  return (
    <Modal visible={visible} animationType="slide" transparent>
      <View style={styles.modalOverlay}>
        <View style={styles.modalSheet}>
          <View style={styles.modalHeader}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
              <Ionicons name="hand-left-outline" size={20} color="#00A86B" />
              <Text style={styles.modalTitle}>Request & Claim Item</Text>
            </View>
            <TouchableOpacity onPress={onClose} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
              <Ionicons name="close" size={22} color="#64748B" />
            </TouchableOpacity>
          </View>

          <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
            {/* Item Mini Card */}
            <View style={styles.miniItemCard}>
              <View style={{ flex: 1 }}>
                <Text style={styles.miniItemTitle} numberOfLines={1}>
                  {item.item_name}
                </Text>
                <Text style={styles.miniItemSub}>
                  {item.location_name} · {item.quantity_remaining} {item.unit} available
                </Text>
              </View>
              {item.ngo_verified && (
                <View style={styles.ngoMiniBadge}>
                  <Ionicons name="shield-checkmark" size={12} color="#154212" />
                  <Text style={styles.ngoMiniText}>NGO</Text>
                </View>
              )}
            </View>

            {/* Quantity Stepper */}
            <View style={styles.stepperBox}>
              <Text style={styles.stepperLabel}>How many {item.unit} do you need?</Text>
              <View style={styles.stepperRow}>
                <TouchableOpacity
                  style={[styles.stepBtn, { opacity: requestedQty > 1 ? 1 : 0.5 }]}
                  onPress={() => handleStep(-1)}
                  disabled={requestedQty <= 1}
                >
                  <Ionicons name="remove" size={18} color="#0F172A" />
                </TouchableOpacity>
                <Text style={styles.stepCountText}>
                  {requestedQty} <Text style={{ fontSize: 13, color: '#64748B' }}>/ {maxQty}</Text>
                </Text>
                <TouchableOpacity
                  style={[styles.stepBtn, { opacity: requestedQty < maxQty ? 1 : 0.5 }]}
                  onPress={() => handleStep(1)}
                  disabled={requestedQty >= maxQty}
                >
                  <Ionicons name="add" size={18} color="#0F172A" />
                </TouchableOpacity>
              </View>
            </View>

            {/* Intended Earth-Healing Use */}
            <Text style={styles.fieldLabel}>INTENDED EARTH-HEALING PURPOSE</Text>
            <View style={{ gap: 6 }}>
              {INTENDED_USE_OPTIONS.map((opt) => (
                <TouchableOpacity
                  key={opt.id}
                  style={[
                    styles.useOptionChip,
                    {
                      backgroundColor: intendedUse === opt.label ? '#D9F3E9' : '#F8FAFC',
                      borderColor: intendedUse === opt.label ? '#00A86B' : '#E2E8F0',
                    },
                  ]}
                  onPress={() => setIntendedUse(opt.label)}
                >
                  <Text
                    style={[
                      styles.useOptionText,
                      { color: intendedUse === opt.label ? '#154212' : '#334155' },
                    ]}
                  >
                    {opt.label}
                  </Text>
                  {intendedUse === opt.label && (
                    <Ionicons name="checkmark-circle" size={16} color="#00A86B" />
                  )}
                </TouchableOpacity>
              ))}
            </View>

            {/* Notes to Donor */}
            <Text style={styles.fieldLabel}>NOTE TO DONOR (OPTIONAL)</Text>
            <TextInput
              style={[styles.textInput, { height: 50, textAlignVertical: 'top' }]}
              placeholder="e.g. Planning to plant these along the hostel botanical walkway."
              placeholderTextColor="#94A3B8"
              multiline
              value={message}
              onChangeText={setMessage}
            />

            {/* Requester Contact Details (Segregated) */}
            <Text style={styles.fieldLabel}>YOUR CONTACT PHONE (PRIVATE UNTIL ACCEPTED)</Text>
            <TextInput
              style={styles.textInput}
              placeholder="+91 98123 45678"
              placeholderTextColor="#94A3B8"
              keyboardType="phone-pad"
              value={phone}
              onChangeText={setPhone}
            />

            <View style={styles.infoNotice}>
              <Ionicons name="lock-closed-outline" size={14} color="#00A86B" />
              <Text style={styles.infoNoticeText}>
                Your contact info is strictly hidden and will only be shared with the donor once your claim is accepted.
              </Text>
            </View>

            {/* Submit Button */}
            <TouchableOpacity
              style={styles.submitBtn}
              onPress={handleSubmit}
              disabled={submitting}
              activeOpacity={0.8}
            >
              {submitting ? (
                <ActivityIndicator color="#FFFFFF" />
              ) : (
                <>
                  <Ionicons name="paper-plane-outline" size={16} color="#FFFFFF" />
                  <Text style={styles.submitBtnText}>Submit Claim Request</Text>
                </>
              )}
            </TouchableOpacity>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.45)',
    justifyContent: 'flex-end',
  },
  modalSheet: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingTop: 16,
    paddingHorizontal: 20,
    paddingBottom: 32,
    maxHeight: '85%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#0F172A',
  },
  scrollContent: {
    gap: 10,
    paddingBottom: 24,
  },
  miniItemCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#F8FAF8',
    padding: 12,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'rgba(43, 182, 115, 0.2)',
  },
  miniItemTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: '#0F172A',
  },
  miniItemSub: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 2,
  },
  ngoMiniBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    backgroundColor: '#D9F3E9',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  ngoMiniText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#154212',
  },
  stepperBox: {
    backgroundColor: '#F8FAFC',
    padding: 12,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    alignItems: 'center',
    gap: 8,
  },
  stepperLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: '#334155',
  },
  stepperRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  stepBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#CBD5E1',
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepCountText: {
    fontSize: 18,
    fontWeight: '800',
    color: '#0F172A',
    minWidth: 60,
    textAlign: 'center',
  },
  fieldLabel: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.6,
    color: '#64748B',
    marginTop: 4,
  },
  useOptionChip: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 12,
    borderWidth: 1,
  },
  useOptionText: {
    fontSize: 13,
    fontWeight: '600',
  },
  textInput: {
    height: 42,
    borderWidth: 1,
    borderColor: '#CBD5E1',
    borderRadius: 10,
    paddingHorizontal: 12,
    fontSize: 13,
    backgroundColor: '#FFFFFF',
    color: '#0F172A',
  },
  infoNotice: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#F4FAF5',
    padding: 10,
    borderRadius: 10,
  },
  infoNoticeText: {
    fontSize: 11,
    color: '#154212',
    flex: 1,
    lineHeight: 15,
  },
  submitBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: '#00A86B',
    paddingVertical: 14,
    borderRadius: 14,
    marginTop: 6,
  },
  submitBtnText: {
    fontSize: 15,
    fontWeight: '800',
    color: '#FFFFFF',
  },
});
