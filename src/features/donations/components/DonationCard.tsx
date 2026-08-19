import React from 'react';
import { StyleSheet, Text, View, Image, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { DonationFeedItem } from '../types';
import { DONATION_CATEGORIES, calculateEstimatedGP } from '../constants';

interface DonationCardProps {
  item: DonationFeedItem;
  onRequestPress: (item: DonationFeedItem) => void;
  isOwner?: boolean;
  onManagePress?: (item: DonationFeedItem) => void;
}

export const DonationCard: React.FC<DonationCardProps> = ({
  item,
  onRequestPress,
  isOwner = false,
  onManagePress,
}) => {
  const categoryMeta = DONATION_CATEGORIES.find((c) => c.id === item.category);
  const gpReward = calculateEstimatedGP(item.category, item.quantity_remaining);

  return (
    <View style={styles.card}>
      {/* Top Banner / Photo */}
      {item.photo_url ? (
        <View style={styles.imageContainer}>
          <Image source={{ uri: item.photo_url }} style={styles.itemImage} resizeMode="cover" />
          {item.ngo_verified && (
            <View style={styles.ngoFloatingBadge}>
              <Ionicons name="shield-checkmark" size={13} color="#FFFFFF" />
              <Text style={styles.ngoBadgeText}>
                {item.ngo_organization_name || 'Verified NGO'}
              </Text>
            </View>
          )}
        </View>
      ) : (
        <View
          style={[
            styles.placeholderBanner,
            { backgroundColor: (categoryMeta?.color || '#00A86B') + '15' },
          ]}
        >
          <Ionicons
            name={(categoryMeta?.icon || 'gift') as any}
            size={36}
            color={categoryMeta?.color || '#00A86B'}
          />
          {item.ngo_verified && (
            <View style={styles.ngoFloatingBadge}>
              <Ionicons name="shield-checkmark" size={13} color="#FFFFFF" />
              <Text style={styles.ngoBadgeText}>
                {item.ngo_organization_name || 'Verified NGO'}
              </Text>
            </View>
          )}
        </View>
      )}

      {/* Main Content Area */}
      <View style={styles.cardBody}>
        {/* Category & Condition Badges */}
        <View style={styles.tagRow}>
          <View
            style={[
              styles.categoryPill,
              { backgroundColor: categoryMeta?.badgeBg || '#D9F3E9' },
            ]}
          >
            <Ionicons
              name={(categoryMeta?.icon || 'leaf') as any}
              size={12}
              color={categoryMeta?.color || '#00A86B'}
            />
            <Text style={[styles.categoryPillText, { color: categoryMeta?.color || '#00A86B' }]}>
              {categoryMeta?.label || item.category}
            </Text>
          </View>

          <View style={styles.conditionPill}>
            <Text style={styles.conditionText}>
              {item.condition === 'healthy'
                ? '🌱 Thriving'
                : item.condition === 'new'
                ? '✨ New'
                : item.condition === 'gently_used'
                ? '🪴 Ready'
                : '♻️ Upcycled'}
            </Text>
          </View>

          {item.distanceKm !== undefined && (
            <View style={styles.distancePill}>
              <Ionicons name="navigate-outline" size={11} color="#64748B" />
              <Text style={styles.distanceText}>~{item.distanceKm} km</Text>
            </View>
          )}
        </View>

        {/* Title & Quantity */}
        <Text style={styles.itemTitle} numberOfLines={2}>
          {item.item_name}
        </Text>

        {item.description ? (
          <Text style={styles.itemDescription} numberOfLines={2}>
            {item.description}
          </Text>
        ) : null}

        {/* Stock & Donor Meta */}
        <View style={styles.stockRow}>
          <View style={styles.stockBadge}>
            <Ionicons name="cube-outline" size={13} color="#154212" />
            <Text style={styles.stockText}>
              <Text style={{ fontWeight: '800', color: '#154212' }}>
                {item.quantity_remaining}
              </Text>{' '}
              of {item.quantity_total} {item.unit} left
            </Text>
          </View>

          <View style={styles.gpBadge}>
            <Ionicons name="sparkles" size={12} color="#00A86B" />
            <Text style={styles.gpBadgeText}>+{gpReward} GP</Text>
          </View>
        </View>

        {/* Location & Availability info */}
        <View style={styles.metaRow}>
          <View style={styles.metaItem}>
            <Ionicons name="location-outline" size={13} color="#64748B" />
            <Text style={styles.metaText} numberOfLines={1}>
              {item.location_name}
            </Text>
          </View>
          <View style={styles.metaItem}>
            <Ionicons name="time-outline" size={13} color="#64748B" />
            <Text style={styles.metaText} numberOfLines={1}>
              {item.availability_window}
            </Text>
          </View>
        </View>

        {/* Action Button */}
        {isOwner ? (
          <TouchableOpacity
            style={styles.manageBtn}
            onPress={() => onManagePress && onManagePress(item)}
            activeOpacity={0.8}
          >
            <Ionicons name="list" size={15} color="#00A86B" />
            <Text style={styles.manageBtnText}>Manage Listings & Claims</Text>
          </TouchableOpacity>
        ) : (
          <TouchableOpacity
            style={[
              styles.claimBtn,
              { opacity: item.quantity_remaining > 0 ? 1 : 0.6 },
            ]}
            disabled={item.quantity_remaining <= 0}
            onPress={() => onRequestPress(item)}
            activeOpacity={0.8}
          >
            <Ionicons name="hand-left-outline" size={15} color="#FFFFFF" />
            <Text style={styles.claimBtnText}>
              {item.quantity_remaining > 0 ? 'Request & Claim This' : 'Fully Reserved'}
            </Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(0, 0, 0, 0.06)',
    overflow: 'hidden',
    marginBottom: 14,
  },
  imageContainer: {
    height: 160,
    width: '100%',
    position: 'relative',
    backgroundColor: '#E2E8F0',
  },
  itemImage: {
    width: '100%',
    height: '100%',
  },
  placeholderBanner: {
    height: 110,
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  ngoFloatingBadge: {
    position: 'absolute',
    top: 10,
    left: 10,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(21, 66, 18, 0.9)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 9999,
  },
  ngoBadgeText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: 0.3,
  },
  cardBody: {
    padding: 16,
    gap: 10,
  },
  tagRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 6,
  },
  categoryPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
  },
  categoryPillText: {
    fontSize: 11,
    fontWeight: '700',
  },
  conditionPill: {
    backgroundColor: '#F1F5F9',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
  },
  conditionText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#475569',
  },
  distancePill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    backgroundColor: '#F8FAFC',
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  distanceText: {
    fontSize: 10,
    fontWeight: '600',
    color: '#64748B',
  },
  itemTitle: {
    fontSize: 17,
    fontWeight: '800',
    color: '#0F172A',
    lineHeight: 22,
  },
  itemDescription: {
    fontSize: 13,
    color: '#64748B',
    lineHeight: 18,
  },
  stockRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#F8FAF8',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(43, 182, 115, 0.15)',
  },
  stockBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  stockText: {
    fontSize: 12,
    color: '#334155',
  },
  gpBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#D9F3E9',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 9999,
  },
  gpBadgeText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#154212',
  },
  metaRow: {
    gap: 4,
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  metaText: {
    fontSize: 12,
    color: '#64748B',
    flex: 1,
  },
  claimBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: '#00A86B',
    paddingVertical: 12,
    borderRadius: 14,
    marginTop: 4,
  },
  claimBtnText: {
    fontSize: 14,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  manageBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: '#D9F3E9',
    paddingVertical: 12,
    borderRadius: 14,
    marginTop: 4,
    borderWidth: 1,
    borderColor: 'rgba(0, 168, 107, 0.3)',
  },
  manageBtnText: {
    fontSize: 14,
    fontWeight: '800',
    color: '#00A86B',
  },
});
