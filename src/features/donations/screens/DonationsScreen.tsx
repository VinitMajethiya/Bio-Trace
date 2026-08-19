import React, { useEffect, useState } from 'react';
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  Alert,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import * as Location from 'expo-location';

import { useTheme } from '../../../providers/ThemeProvider';
import { useAuth } from '../../../context/AuthContext';
import { GreenPointsChip } from '../../../components/common/GreenPointsChip';
import { EmptyState } from '../../../components/common/EmptyState';

import {
  DonationFeedItem,
  DonationRequestItem,
  DonationCategory,
} from '../types';
import { DONATION_CATEGORIES } from '../constants';
import {
  fetchDonationsFeed,
  fetchMyDonations,
  fetchMyClaims,
  cancelDonationRequest,
  subscribeToDonationsRealtime,
} from '../donationsService';

import { DonationCard } from '../components/DonationCard';
import { CreateDonationModal } from '../components/CreateDonationModal';
import { RequestDonationModal } from '../components/RequestDonationModal';
import { ManageClaimsModal } from '../components/ManageClaimsModal';
import { ContactRevealCard } from '../components/ContactRevealCard';

type TabMode = 'feed' | 'my_donations' | 'my_claims';

export const DonationsScreen: React.FC = () => {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<any>();
  const { colors } = useTheme();
  const { user } = useAuth();

  const [activeTab, setActiveTab] = useState<TabMode>('feed');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [maxDistanceKm, setMaxDistanceKm] = useState<number | undefined>(undefined);

  const [userCoords, setUserCoords] = useState<{ lat: number; lng: number } | null>(null);

  // Feed State
  const [feedItems, setFeedItems] = useState<DonationFeedItem[]>([]);
  const [loadingFeed, setLoadingFeed] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // My Activity State
  const [myDonations, setMyDonations] = useState<DonationFeedItem[]>([]);
  const [myIncomingRequests, setMyIncomingRequests] = useState<DonationRequestItem[]>([]);
  const [myClaims, setMyClaims] = useState<DonationRequestItem[]>([]);

  // Modal States
  const [createModalVisible, setCreateModalVisible] = useState(false);
  const [selectedFeedItem, setSelectedFeedItem] = useState<DonationFeedItem | null>(null);
  const [requestModalVisible, setRequestModalVisible] = useState(false);
  const [managingDonation, setManagingDonation] = useState<DonationFeedItem | null>(null);
  const [manageModalVisible, setManageModalVisible] = useState(false);

  useEffect(() => {
    initLocation();
  }, []);

  useEffect(() => {
    loadData();

    const channel = subscribeToDonationsRealtime(() => {
      loadData();
    });

    return () => {
      channel.unsubscribe();
    };
  }, [user, selectedCategory, maxDistanceKm, userCoords]);

  const initLocation = async () => {
    try {
      const perm = await Location.requestForegroundPermissionsAsync();
      if (perm.granted) {
        const loc = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
        setUserCoords({ lat: loc.coords.latitude, lng: loc.coords.longitude });
      }
    } catch {
      // Graceful fallback without location
    }
  };

  const loadData = async () => {
    if (loadingFeed === false) setRefreshing(true);

    const [feed, myDonationsData, myClaimsData] = await Promise.all([
      fetchDonationsFeed(
        selectedCategory,
        userCoords?.lat,
        userCoords?.lng,
        maxDistanceKm
      ),
      user ? fetchMyDonations(user.id) : Promise.resolve({ donations: [], requests: [] }),
      user ? fetchMyClaims(user.id) : Promise.resolve([]),
    ]);

    setFeedItems(feed);
    setMyDonations(myDonationsData.donations);
    setMyIncomingRequests(myDonationsData.requests);
    setMyClaims(myClaimsData);

    setLoadingFeed(false);
    setRefreshing(false);
  };

  const handleCancelClaim = async (req: DonationRequestItem) => {
    Alert.alert('Cancel Claim?', 'Are you sure you want to cancel this claim request?', [
      { text: 'Keep', style: 'cancel' },
      {
        text: 'Cancel Claim',
        style: 'destructive',
        onPress: async () => {
          const res = await cancelDonationRequest(req.id);
          if (res.success) {
            Alert.alert('Claim Cancelled', 'Your claim has been cancelled.');
            loadData();
          } else {
            Alert.alert('Error', res.error || 'Failed to cancel claim.');
          }
        },
      },
    ]);
  };

  return (
    <View style={[styles.container, { paddingTop: Math.max(insets.top, 16) }]}>
      {/* Header Row */}
      <View style={styles.headerRow}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
          <TouchableOpacity
            style={styles.backBtn}
            onPress={() => navigation.goBack()}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            <Ionicons name="arrow-back" size={20} color="#161D18" />
          </TouchableOpacity>
          <View>
            <Text style={styles.headingTitle}>Give Back</Text>
            <Text style={styles.headingSub}>Earth-Healing Item Exchange</Text>
          </View>
        </View>

        <TouchableOpacity
          style={styles.donatePillBtn}
          onPress={() => setCreateModalVisible(true)}
          activeOpacity={0.8}
        >
          <Ionicons name="add" size={16} color="#FFFFFF" />
          <Text style={styles.donatePillText}>Donate Item</Text>
        </TouchableOpacity>
      </View>

      {/* Segmented Navigation Tabs */}
      <View style={styles.tabBarWrap}>
        <TouchableOpacity
          style={[styles.tabBtn, activeTab === 'feed' && styles.tabBtnActive]}
          onPress={() => setActiveTab('feed')}
        >
          <Ionicons
            name="grid-outline"
            size={14}
            color={activeTab === 'feed' ? '#00A86B' : '#64748B'}
          />
          <Text style={[styles.tabText, activeTab === 'feed' && styles.tabTextActive]}>
            Browse Feed ({feedItems.length})
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.tabBtn, activeTab === 'my_donations' && styles.tabBtnActive]}
          onPress={() => setActiveTab('my_donations')}
        >
          <Ionicons
            name="gift-outline"
            size={14}
            color={activeTab === 'my_donations' ? '#00A86B' : '#64748B'}
          />
          <Text style={[styles.tabText, activeTab === 'my_donations' && styles.tabTextActive]}>
            My Donations ({myDonations.length})
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.tabBtn, activeTab === 'my_claims' && styles.tabBtnActive]}
          onPress={() => setActiveTab('my_claims')}
        >
          <Ionicons
            name="hand-left-outline"
            size={14}
            color={activeTab === 'my_claims' ? '#00A86B' : '#64748B'}
          />
          <Text style={[styles.tabText, activeTab === 'my_claims' && styles.tabTextActive]}>
            My Claims ({myClaims.length})
          </Text>
        </TouchableOpacity>
      </View>

      {/* Main Content Area */}
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={loadData} tintColor="#00A86B" />
        }
      >
        {/* ==================== TAB 1: BROWSE FEED ==================== */}
        {activeTab === 'feed' && (
          <View style={{ gap: 12 }}>
            {/* Category Filter Pills */}
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.categoryScroll}
            >
              <TouchableOpacity
                style={[
                  styles.filterPill,
                  selectedCategory === 'all' && styles.filterPillActive,
                ]}
                onPress={() => setSelectedCategory('all')}
              >
                <Text
                  style={[
                    styles.filterPillText,
                    selectedCategory === 'all' && styles.filterPillTextActive,
                  ]}
                >
                  All Items
                </Text>
              </TouchableOpacity>

              {DONATION_CATEGORIES.map((cat) => (
                <TouchableOpacity
                  key={cat.id}
                  style={[
                    styles.filterPill,
                    selectedCategory === cat.id && {
                      backgroundColor: cat.badgeBg,
                      borderColor: cat.color,
                    },
                  ]}
                  onPress={() => setSelectedCategory(cat.id)}
                >
                  <Ionicons name={cat.icon as any} size={13} color={cat.color} />
                  <Text
                    style={[
                      styles.filterPillText,
                      selectedCategory === cat.id && { color: cat.color, fontWeight: '800' },
                    ]}
                  >
                    {cat.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>

            {/* Distance Filter Chips */}
            {userCoords && (
              <View style={styles.distanceFilterRow}>
                <Text style={styles.distanceFilterLabel}>RADIUS:</Text>
                {[
                  { label: 'All', val: undefined },
                  { label: '< 5 km', val: 5 },
                  { label: '< 10 km', val: 10 },
                ].map((d) => (
                  <TouchableOpacity
                    key={d.label}
                    style={[
                      styles.distanceChip,
                      maxDistanceKm === d.val && styles.distanceChipActive,
                    ]}
                    onPress={() => setMaxDistanceKm(d.val)}
                  >
                    <Text
                      style={[
                        styles.distanceChipText,
                        maxDistanceKm === d.val && styles.distanceChipTextActive,
                      ]}
                    >
                      {d.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            )}

            {/* Feed Listings */}
            {loadingFeed ? (
              <View style={styles.loadingWrap}>
                <ActivityIndicator size="large" color="#00A86B" />
                <Text style={styles.loadingSub}>Loading available donations...</Text>
              </View>
            ) : feedItems.length === 0 ? (
              <EmptyState
                icon="leaf-outline"
                title="No Donations in this Category"
                description="Be the first steward or NGO to list saplings, seeds, compost, or tools!"
              />
            ) : (
              feedItems.map((item) => (
                <DonationCard
                  key={item.id}
                  item={item}
                  isOwner={item.donor_id === user?.id}
                  onRequestPress={(i) => {
                    setSelectedFeedItem(i);
                    setRequestModalVisible(true);
                  }}
                  onManagePress={(i) => {
                    setManagingDonation(i);
                    setManageModalVisible(true);
                  }}
                />
              ))
            )}
          </View>
        )}

        {/* ==================== TAB 2: MY DONATIONS ==================== */}
        {activeTab === 'my_donations' && (
          <View style={{ gap: 12 }}>
            <View style={styles.sectionHeaderRow}>
              <Text style={styles.sectionHeadingTitle}>MY PUBLISHED LISTINGS</Text>
              <TouchableOpacity onPress={() => setCreateModalVisible(true)}>
                <Text style={styles.addNewLink}>+ New Listing</Text>
              </TouchableOpacity>
            </View>

            {myDonations.length === 0 ? (
              <EmptyState
                icon="gift-outline"
                title="You Haven't Listed Any Items"
                description="Share extra plants, seeds, compost, or tools with campus stewards to earn GreenPoints!"
              />
            ) : (
              myDonations.map((item) => {
                const incomingForThis = myIncomingRequests.filter((r) => r.donation_id === item.id);
                const pendingCount = incomingForThis.filter((r) => r.status === 'pending').length;

                return (
                  <View key={item.id} style={styles.myDonationWrapper}>
                    <DonationCard
                      item={item}
                      isOwner={true}
                      onRequestPress={() => {}}
                      onManagePress={(i) => {
                        setManagingDonation(i);
                        setManageModalVisible(true);
                      }}
                    />

                    {pendingCount > 0 && (
                      <TouchableOpacity
                        style={styles.pendingAlertBanner}
                        onPress={() => {
                          setManagingDonation(item);
                          setManageModalVisible(true);
                        }}
                      >
                        <Ionicons name="notifications" size={14} color="#FFFFFF" />
                        <Text style={styles.pendingAlertText}>
                          {pendingCount} new claim request{pendingCount > 1 ? 's' : ''} waiting for your review!
                        </Text>
                        <Ionicons name="chevron-forward" size={14} color="#FFFFFF" />
                      </TouchableOpacity>
                    )}
                  </View>
                );
              })
            )}
          </View>
        )}

        {/* ==================== TAB 3: MY CLAIMS ==================== */}
        {activeTab === 'my_claims' && (
          <View style={{ gap: 12 }}>
            <Text style={styles.sectionHeadingTitle}>YOUR ACTIVE CLAIMS & REQUESTS</Text>

            {myClaims.length === 0 ? (
              <EmptyState
                icon="hand-left-outline"
                title="No Active Claims"
                description="Browse the feed to request saplings, seeds, and gardening tools from community donors."
              />
            ) : (
              myClaims.map((claim) => {
                const isAccepted = claim.status === 'accepted' || claim.status === 'scheduled';
                const isCompleted = claim.status === 'completed';
                const isPending = claim.status === 'pending';
                const isRejected = claim.status === 'rejected';

                return (
                  <View key={claim.id} style={styles.claimItemCard}>
                    <View style={styles.claimCardHeader}>
                      <View style={{ flex: 1 }}>
                        <Text style={styles.claimItemTitle}>
                          {claim.donation?.item_name || 'Donation Item'}
                        </Text>
                        <Text style={styles.claimItemSub}>
                          Claimed: {claim.requested_quantity} {claim.donation?.unit || 'items'} ·{' '}
                          {claim.donation?.location_name}
                        </Text>
                      </View>

                      <View
                        style={[
                          styles.claimStatusChip,
                          {
                            backgroundColor: isCompleted
                              ? '#D9F3E9'
                              : isAccepted
                              ? '#EFF6FF'
                              : isRejected
                              ? '#FEE2E2'
                              : '#FEF3C7',
                          },
                        ]}
                      >
                        <Text
                          style={[
                            styles.claimStatusChipText,
                            {
                              color: isCompleted
                                ? '#154212'
                                : isAccepted
                                ? '#1D4ED8'
                                : isRejected
                                ? '#DC2626'
                                : '#92400E',
                            },
                          ]}
                        >
                          {isCompleted
                            ? 'COMPLETED'
                            : isAccepted
                            ? 'ACCEPTED'
                            : isRejected
                            ? 'DECLINED'
                            : 'PENDING'}
                        </Text>
                      </View>
                    </View>

                    {/* Reveal Contact Card if Accepted */}
                    {isAccepted && (
                      <ContactRevealCard
                        donationId={claim.donation_id}
                        requestId={claim.id}
                        isDonorView={false}
                      />
                    )}

                    {/* Pending Action Buttons */}
                    {isPending && (
                      <View style={{ flexDirection: 'row', justifyContent: 'flex-end', marginTop: 4 }}>
                        <TouchableOpacity
                          style={styles.cancelLinkBtn}
                          onPress={() => handleCancelClaim(claim)}
                        >
                          <Ionicons name="trash-outline" size={13} color="#DC2626" />
                          <Text style={styles.cancelLinkText}>Cancel Request</Text>
                        </TouchableOpacity>
                      </View>
                    )}
                  </View>
                );
              })
            )}
          </View>
        )}
      </ScrollView>

      {/* Create Donation Modal */}
      <CreateDonationModal
        visible={createModalVisible}
        onClose={() => setCreateModalVisible(false)}
        onSuccess={() => {
          loadData();
          setActiveTab('my_donations');
        }}
      />

      {/* Request Donation Modal */}
      <RequestDonationModal
        item={selectedFeedItem}
        visible={requestModalVisible}
        onClose={() => {
          setRequestModalVisible(false);
          setSelectedFeedItem(null);
        }}
        onSuccess={() => {
          loadData();
          setActiveTab('my_claims');
        }}
      />

      {/* Manage Claims Modal */}
      <ManageClaimsModal
        donation={managingDonation}
        requests={myIncomingRequests}
        visible={manageModalVisible}
        onClose={() => {
          setManageModalVisible(false);
          setManagingDonation(null);
        }}
        onRefresh={loadData}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAF8',
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    marginBottom: 10,
  },
  backBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.06)',
  },
  headingTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: '#0F172A',
    letterSpacing: -0.4,
  },
  headingSub: {
    fontSize: 12,
    color: '#64748B',
    fontWeight: '500',
  },
  donatePillBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#00A86B',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 9999,
  },
  donatePillText: {
    fontSize: 12,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  tabBarWrap: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    gap: 6,
    marginBottom: 8,
  },
  tabBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    paddingVertical: 8,
    borderRadius: 10,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.06)',
  },
  tabBtnActive: {
    backgroundColor: '#D9F3E9',
    borderColor: 'rgba(0, 168, 107, 0.3)',
  },
  tabText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#64748B',
  },
  tabTextActive: {
    color: '#00A86B',
    fontWeight: '800',
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingBottom: 40,
  },
  categoryScroll: {
    gap: 6,
    paddingVertical: 4,
  },
  filterPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 10,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  filterPillActive: {
    backgroundColor: '#00A86B',
    borderColor: '#00A86B',
  },
  filterPillText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#475569',
  },
  filterPillTextActive: {
    color: '#FFFFFF',
  },
  distanceFilterRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 2,
    marginBottom: 4,
  },
  distanceFilterLabel: {
    fontSize: 10,
    fontWeight: '800',
    color: '#64748B',
    letterSpacing: 0.5,
  },
  distanceChip: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  distanceChipActive: {
    backgroundColor: '#D9F3E9',
    borderColor: '#00A86B',
  },
  distanceChipText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#64748B',
  },
  distanceChipTextActive: {
    color: '#154212',
    fontWeight: '800',
  },
  loadingWrap: {
    paddingVertical: 48,
    alignItems: 'center',
    gap: 8,
  },
  loadingSub: {
    fontSize: 13,
    color: '#64748B',
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 4,
  },
  sectionHeadingTitle: {
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.7,
    color: '#64748B',
  },
  addNewLink: {
    fontSize: 12,
    fontWeight: '800',
    color: '#00A86B',
  },
  myDonationWrapper: {
    marginBottom: 10,
  },
  pendingAlertBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#F59E0B',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
    marginTop: -8,
    marginBottom: 8,
  },
  pendingAlertText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#FFFFFF',
    flex: 1,
    marginLeft: 6,
  },
  claimItemCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.06)',
    gap: 8,
    marginBottom: 10,
  },
  claimCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: 8,
  },
  claimItemTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: '#0F172A',
  },
  claimItemSub: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 2,
  },
  claimStatusChip: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  claimStatusChipText: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.4,
  },
  cancelLinkBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingVertical: 4,
  },
  cancelLinkText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#DC2626',
  },
});
