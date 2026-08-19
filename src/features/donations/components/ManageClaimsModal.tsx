import React, { useState } from 'react';
import {
  StyleSheet,
  Text,
  View,
  Modal,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { DonationFeedItem, DonationRequestItem } from '../types';
import {
  acceptDonationRequest,
  rejectDonationRequest,
  completeDonation,
} from '../donationsService';
import { ContactRevealCard } from './ContactRevealCard';

interface ManageClaimsModalProps {
  donation: DonationFeedItem | null;
  requests: DonationRequestItem[];
  visible: boolean;
  onClose: () => void;
  onRefresh: () => void;
}

export const ManageClaimsModal: React.FC<ManageClaimsModalProps> = ({
  donation,
  requests,
  visible,
  onClose,
  onRefresh,
}) => {
  const [loadingId, setLoadingId] = useState<string | null>(null);

  if (!donation) return null;

  const listingRequests = requests.filter((r) => r.donation_id === donation.id);

  const handleAccept = async (req: DonationRequestItem) => {
    setLoadingId(req.id);
    const res = await acceptDonationRequest(req.id);
    setLoadingId(null);

    if (res.success) {
      Alert.alert(
        '🎉 Claim Accepted!',
        `You have approved ${req.requested_quantity} ${donation.unit}. The recipient's contact details have unlocked below so you can coordinate pickup!`
      );
      onRefresh();
    } else {
      Alert.alert('Could Not Accept', res.error || 'Request processing failed.');
    }
  };

  const handleReject = async (req: DonationRequestItem) => {
    Alert.alert('Decline Claim?', 'Are you sure you want to decline this request?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Decline',
        style: 'destructive',
        onPress: async () => {
          setLoadingId(req.id);
          const res = await rejectDonationRequest(req.id);
          setLoadingId(null);
          if (res.success) {
            onRefresh();
          } else {
            Alert.alert('Error', res.error || 'Failed to reject.');
          }
        },
      },
    ]);
  };

  const handleComplete = async (req: DonationRequestItem) => {
    Alert.alert(
      'Complete Handover?',
      `Confirm that the steward has collected the ${req.requested_quantity} ${donation.unit}? This will credit your GreenPoints!`,
      [
        { text: 'Not Yet', style: 'cancel' },
        {
          text: 'Confirm Handover',
          onPress: async () => {
            setLoadingId(req.id);
            const res = await completeDonation(donation.id, req.id);
            setLoadingId(null);

            if (res.success) {
              Alert.alert(
                '🌟 Earth Healing Completed!',
                `Congratulations! You earned +${res.donorGpAwarded} GreenPoints, the recipient earned +${res.requesterGpAwarded} GP, and your territory health score received a boost!`
              );
              onRefresh();
            } else {
              Alert.alert('Error', res.error || 'Failed to complete donation.');
            }
          },
        },
      ]
    );
  };

  return (
    <Modal visible={visible} animationType="slide" transparent>
      <View style={styles.modalOverlay}>
        <View style={styles.modalSheet}>
          <View style={styles.modalHeader}>
            <View>
              <Text style={styles.modalTitle}>Manage Claims</Text>
              <Text style={styles.modalSub}>
                {donation.item_name} · {donation.quantity_remaining} of {donation.quantity_total}{' '}
                {donation.unit} left
              </Text>
            </View>
            <TouchableOpacity onPress={onClose} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
              <Ionicons name="close" size={22} color="#64748B" />
            </TouchableOpacity>
          </View>

          <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
            {listingRequests.length === 0 ? (
              <View style={styles.emptyWrap}>
                <Ionicons name="mail-open-outline" size={36} color="#94A3B8" />
                <Text style={styles.emptyTitle}>No Claims Yet</Text>
                <Text style={styles.emptySub}>
                  When campus stewards or NGOs request items from this listing, they will appear here for your review.
                </Text>
              </View>
            ) : (
              listingRequests.map((req) => {
                const isPending = req.status === 'pending';
                const isAccepted = req.status === 'accepted' || req.status === 'scheduled';
                const isCompleted = req.status === 'completed';
                const isRejected = req.status === 'rejected';

                return (
                  <View key={req.id} style={styles.claimCard}>
                    {/* Status Header */}
                    <View style={styles.claimHeader}>
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                        <Ionicons
                          name={
                            isCompleted
                              ? 'checkmark-circle'
                              : isAccepted
                              ? 'time-outline'
                              : isRejected
                              ? 'close-circle'
                              : 'hand-left'
                          }
                          size={16}
                          color={
                            isCompleted
                              ? '#00A86B'
                              : isAccepted
                              ? '#3B82F6'
                              : isRejected
                              ? '#DC2626'
                              : '#F59E0B'
                          }
                        />
                        <Text style={styles.claimStatusText}>
                          {isCompleted
                            ? 'HANDOVER COMPLETED'
                            : isAccepted
                            ? 'ACCEPTED · READY FOR PICKUP'
                            : isRejected
                            ? 'DECLINED'
                            : 'NEW CLAIM REQUEST'}
                        </Text>
                      </View>
                      <Text style={styles.qtyTag}>
                        {req.requested_quantity} {donation.unit}
                      </Text>
                    </View>

                    {/* Purpose & Note */}
                    <View style={styles.claimBody}>
                      <Text style={styles.purposeLabel}>PURPOSE:</Text>
                      <Text style={styles.purposeVal}>{req.intended_use}</Text>

                      {req.message ? (
                        <>
                          <Text style={[styles.purposeLabel, { marginTop: 4 }]}>NOTE FROM STEWARD:</Text>
                          <Text style={styles.noteVal}>"{req.message}"</Text>
                        </>
                      ) : null}
                    </View>

                    {/* Contact Reveal on Accepted */}
                    {isAccepted && (
                      <ContactRevealCard
                        donationId={donation.id}
                        requestId={req.id}
                        isDonorView={true}
                      />
                    )}

                    {/* Action Buttons */}
                    {isPending && (
                      <View style={styles.btnRow}>
                        <TouchableOpacity
                          style={styles.rejectBtn}
                          onPress={() => handleReject(req)}
                          disabled={loadingId === req.id}
                        >
                          <Ionicons name="close" size={16} color="#DC2626" />
                          <Text style={styles.rejectBtnText}>Decline</Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                          style={styles.acceptBtn}
                          onPress={() => handleAccept(req)}
                          disabled={loadingId === req.id}
                        >
                          {loadingId === req.id ? (
                            <ActivityIndicator size="small" color="#FFFFFF" />
                          ) : (
                            <>
                              <Ionicons name="checkmark" size={16} color="#FFFFFF" />
                              <Text style={styles.acceptBtnText}>Accept Claim</Text>
                            </>
                          )}
                        </TouchableOpacity>
                      </View>
                    )}

                    {isAccepted && (
                      <TouchableOpacity
                        style={styles.completeBtn}
                        onPress={() => handleComplete(req)}
                        disabled={loadingId === req.id}
                      >
                        {loadingId === req.id ? (
                          <ActivityIndicator size="small" color="#FFFFFF" />
                        ) : (
                          <>
                            <Ionicons name="checkmark-done" size={16} color="#FFFFFF" />
                            <Text style={styles.completeBtnText}>
                              Confirm Handover (+GP Reward)
                            </Text>
                          </>
                        )}
                      </TouchableOpacity>
                    )}
                  </View>
                );
              })
            )}
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
  modalSub: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 2,
  },
  scrollContent: {
    gap: 12,
    paddingBottom: 24,
  },
  emptyWrap: {
    alignItems: 'center',
    paddingVertical: 36,
    gap: 8,
  },
  emptyTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#334155',
  },
  emptySub: {
    fontSize: 12,
    color: '#64748B',
    textAlign: 'center',
    lineHeight: 17,
    paddingHorizontal: 20,
  },
  claimCard: {
    backgroundColor: '#F8FAFC',
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    gap: 8,
  },
  claimHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  claimStatusText: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.5,
    color: '#334155',
  },
  qtyTag: {
    fontSize: 11,
    fontWeight: '800',
    color: '#00A86B',
    backgroundColor: '#D9F3E9',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  claimBody: {
    backgroundColor: '#FFFFFF',
    padding: 10,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  purposeLabel: {
    fontSize: 9,
    fontWeight: '800',
    color: '#64748B',
    letterSpacing: 0.5,
  },
  purposeVal: {
    fontSize: 12,
    fontWeight: '700',
    color: '#0F172A',
    marginTop: 1,
  },
  noteVal: {
    fontSize: 12,
    color: '#475569',
    fontStyle: 'italic',
    marginTop: 1,
  },
  btnRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 4,
  },
  rejectBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    backgroundColor: '#FEE2E2',
    paddingVertical: 10,
    borderRadius: 10,
  },
  rejectBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#DC2626',
  },
  acceptBtn: {
    flex: 2,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: '#00A86B',
    paddingVertical: 10,
    borderRadius: 10,
  },
  acceptBtnText: {
    fontSize: 13,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  completeBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: '#00A86B',
    paddingVertical: 12,
    borderRadius: 10,
    marginTop: 4,
  },
  completeBtnText: {
    fontSize: 13,
    fontWeight: '800',
    color: '#FFFFFF',
  },
});
