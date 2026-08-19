import React, { useState } from 'react';
import {
  StyleSheet,
  Text,
  View,
  Modal,
  ScrollView,
  TextInput,
  TouchableOpacity,
  Image,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import * as Location from 'expo-location';
import {
  DONATION_CATEGORIES,
  DONATION_UNITS,
  DONATION_CONDITIONS,
  calculateEstimatedGP,
} from '../constants';
import { DonationCategory, DonationUnit, DonationCondition } from '../types';
import { createDonationListing, uploadDonationPhoto } from '../donationsService';
import { useAuth } from '../../../context/AuthContext';

interface CreateDonationModalProps {
  visible: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export const CreateDonationModal: React.FC<CreateDonationModalProps> = ({
  visible,
  onClose,
  onSuccess,
}) => {
  const { user } = useAuth();

  const [category, setCategory] = useState<DonationCategory>('saplings');
  const [itemName, setItemName] = useState('');
  const [quantity, setQuantity] = useState('5');
  const [unit, setUnit] = useState<DonationUnit>('saplings');
  const [condition, setCondition] = useState<DonationCondition>('healthy');
  const [description, setDescription] = useState('');
  const [locationName, setLocationName] = useState('Campus Center Garden Hub');
  const [exactAddress, setExactAddress] = useState('Near North Gate Nursery / Botanical Dept');
  const [exactLat, setExactLat] = useState(18.5204);
  const [exactLng, setExactLng] = useState(73.8567);
  const [availabilityWindow, setAvailabilityWindow] = useState('Weekdays · 4:00 PM - 7:00 PM');
  const [donorPhone, setDonorPhone] = useState('+91 98765 43210');
  const [donorEmail, setDonorEmail] = useState(user?.email || '');
  const [photoUri, setPhotoUri] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [detectingLocation, setDetectingLocation] = useState(false);

  const numQuantity = Math.max(1, parseInt(quantity, 10) || 1);
  const estimatedGP = calculateEstimatedGP(category, numQuantity);

  const handlePickImage = async () => {
    try {
      const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!perm.granted) {
        Alert.alert('Permission Required', 'Media library access is needed to upload a photo.');
        return;
      }

      const res = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        quality: 0.7,
      });

      if (!res.canceled && res.assets.length > 0) {
        setPhotoUri(res.assets[0].uri);
      }
    } catch (err) {
      Alert.alert('Error', 'Failed to pick image.');
    }
  };

  const handleDetectLocation = async () => {
    try {
      setDetectingLocation(true);
      const perm = await Location.requestForegroundPermissionsAsync();
      if (!perm.granted) {
        Alert.alert('Location Permission', 'Please enable location permissions.');
        setDetectingLocation(false);
        return;
      }

      const loc = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
      setExactLat(loc.coords.latitude);
      setExactLng(loc.coords.longitude);
      Alert.alert('Location Updated', 'Coordinates detected. Your exact GPS will be fuzzed to ~1km for privacy in the public feed.');
    } catch (err) {
      Alert.alert('Location Error', 'Could not fetch current coordinates.');
    } finally {
      setDetectingLocation(false);
    }
  };

  const handleSubmit = async () => {
    if (!user) {
      Alert.alert('Login Required', 'You must be logged in to donate items.');
      return;
    }

    if (!itemName.trim()) {
      Alert.alert('Missing Field', 'Please enter an item name (e.g. Neem Saplings, Vermicompost).');
      return;
    }

    if (!donorPhone.trim() || !donorEmail.trim()) {
      Alert.alert('Contact Required', 'Please provide a phone number and email for the recipient to contact once approved.');
      return;
    }

    setSubmitting(true);
    try {
      const tempListingId = `${Date.now()}`;
      let uploadedPhotoUrl: string | undefined = undefined;

      if (photoUri) {
        const uploaded = await uploadDonationPhoto(user.id, tempListingId, photoUri);
        if (uploaded) uploadedPhotoUrl = uploaded;
      }

      const result = await createDonationListing({
        category,
        item_name: itemName.trim(),
        quantity: numQuantity,
        unit,
        condition,
        description: description.trim() || undefined,
        photo_url: uploadedPhotoUrl,
        location_name: locationName.trim() || 'Campus Area',
        exact_address: exactAddress.trim() || locationName.trim(),
        exact_lat: exactLat,
        exact_lng: exactLng,
        availability_window: availabilityWindow.trim(),
        donor_phone: donorPhone.trim(),
        donor_email: donorEmail.trim(),
      });

      setSubmitting(false);

      if (result.success) {
        Alert.alert(
          '🎉 Donation Listed!',
          `Your listing is live on the Give Back feed. You will earn +${estimatedGP} GP as stewards claim and utilize these items!`
        );
        onSuccess();
        onClose();
      } else {
        Alert.alert('Listing Failed', result.error || 'Could not create listing.');
      }
    } catch (err: any) {
      setSubmitting(false);
      Alert.alert('Error', err.message || 'Failed to submit donation.');
    }
  };

  return (
    <Modal visible={visible} animationType="slide" transparent>
      <View style={styles.modalOverlay}>
        <View style={styles.modalSheet}>
          {/* Modal Header */}
          <View style={styles.modalHeader}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
              <Ionicons name="gift-outline" size={20} color="#00A86B" />
              <Text style={styles.modalTitle}>List a Donation</Text>
            </View>
            <TouchableOpacity onPress={onClose} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
              <Ionicons name="close" size={22} color="#64748B" />
            </TouchableOpacity>
          </View>

          <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
            {/* Category Selector */}
            <Text style={styles.fieldLabel}>CHOOSE CATEGORY</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8 }}>
              {DONATION_CATEGORIES.map((cat) => (
                <TouchableOpacity
                  key={cat.id}
                  style={[
                    styles.categoryChip,
                    {
                      backgroundColor: category === cat.id ? cat.badgeBg : '#F8FAFC',
                      borderColor: category === cat.id ? cat.color : '#E2E8F0',
                    },
                  ]}
                  onPress={() => {
                    setCategory(cat.id);
                    setUnit(cat.defaultUnit);
                  }}
                  activeOpacity={0.7}
                >
                  <Ionicons name={cat.icon as any} size={15} color={cat.color} />
                  <Text style={[styles.categoryChipText, { color: category === cat.id ? cat.color : '#475569' }]}>
                    {cat.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>

            {/* Photo Picker */}
            <Text style={styles.fieldLabel}>ITEM PHOTO (OPTIONAL)</Text>
            <TouchableOpacity style={styles.photoBox} onPress={handlePickImage} activeOpacity={0.8}>
              {photoUri ? (
                <Image source={{ uri: photoUri }} style={styles.photoPreview} />
              ) : (
                <View style={{ alignItems: 'center', gap: 6 }}>
                  <Ionicons name="camera-outline" size={26} color="#00A86B" />
                  <Text style={styles.photoPromptText}>Tap to add a photo of your donation</Text>
                </View>
              )}
            </TouchableOpacity>

            {/* Item Name */}
            <Text style={styles.fieldLabel}>ITEM NAME</Text>
            <TextInput
              style={styles.textInput}
              placeholder="e.g. 5x Neem Saplings, 10kg Vermicompost"
              placeholderTextColor="#94A3B8"
              value={itemName}
              onChangeText={setItemName}
            />

            {/* Quantity & Unit */}
            <View style={styles.rowInputs}>
              <View style={{ flex: 1 }}>
                <Text style={styles.fieldLabel}>TOTAL QUANTITY</Text>
                <TextInput
                  style={styles.textInput}
                  keyboardType="numeric"
                  value={quantity}
                  onChangeText={setQuantity}
                />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.fieldLabel}>UNIT</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 4 }}>
                  {DONATION_UNITS.map((u) => (
                    <TouchableOpacity
                      key={u.id}
                      style={[
                        styles.unitPill,
                        { backgroundColor: unit === u.id ? '#D9F3E9' : '#F1F5F9' },
                      ]}
                      onPress={() => setUnit(u.id)}
                    >
                      <Text style={[styles.unitText, { color: unit === u.id ? '#154212' : '#64748B' }]}>
                        {u.label}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </View>
            </View>

            {/* Condition */}
            <Text style={styles.fieldLabel}>ITEM CONDITION</Text>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6 }}>
              {DONATION_CONDITIONS.map((cond) => (
                <TouchableOpacity
                  key={cond.id}
                  style={[
                    styles.conditionSelectChip,
                    {
                      backgroundColor: condition === cond.id ? '#D9F3E9' : '#F8FAFC',
                      borderColor: condition === cond.id ? '#00A86B' : '#E2E8F0',
                    },
                  ]}
                  onPress={() => setCondition(cond.id)}
                >
                  <Text style={[styles.condSelectText, { color: condition === cond.id ? '#154212' : '#334155' }]}>
                    {cond.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            {/* Description */}
            <Text style={styles.fieldLabel}>NOTES / DETAILS (OPTIONAL)</Text>
            <TextInput
              style={[styles.textInput, { height: 64, textAlignVertical: 'top' }]}
              placeholder="e.g. Healthy 6-month old saplings with potting soil bag included."
              placeholderTextColor="#94A3B8"
              multiline
              value={description}
              onChangeText={setDescription}
            />

            {/* Public Location Landmark vs Private Exact Address */}
            <Text style={styles.fieldLabel}>PUBLIC LANDMARK (SHOWN IN FEED)</Text>
            <TextInput
              style={styles.textInput}
              placeholder="e.g. North Gate Eco Hub, Hostel 4 Quad"
              placeholderTextColor="#94A3B8"
              value={locationName}
              onChangeText={setLocationName}
            />

            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
              <Text style={styles.fieldLabel}>EXACT PICKUP ADDRESS (REVEALED ON ACCEPT)</Text>
              <TouchableOpacity onPress={handleDetectLocation} disabled={detectingLocation}>
                <Text style={styles.gpsLink}>{detectingLocation ? 'Locating...' : '📍 Auto-Detect GPS'}</Text>
              </TouchableOpacity>
            </View>
            <TextInput
              style={styles.textInput}
              placeholder="e.g. Block C, Flat 302 / Nursery Room 12"
              placeholderTextColor="#94A3B8"
              value={exactAddress}
              onChangeText={setExactAddress}
            />

            {/* Availability Window */}
            <Text style={styles.fieldLabel}>PICKUP AVAILABILITY WINDOW</Text>
            <TextInput
              style={styles.textInput}
              placeholder="e.g. Daily 5:00 - 7:00 PM, Weekends anytime"
              placeholderTextColor="#94A3B8"
              value={availabilityWindow}
              onChangeText={setAvailabilityWindow}
            />

            {/* Private Contact Details */}
            <Text style={styles.fieldLabel}>YOUR CONTACT PHONE (PRIVATE UNTIL ACCEPTED)</Text>
            <TextInput
              style={styles.textInput}
              placeholder="+91 98765 43210"
              placeholderTextColor="#94A3B8"
              keyboardType="phone-pad"
              value={donorPhone}
              onChangeText={setDonorPhone}
            />

            {/* Estimated Gamification Reward Preview */}
            <View style={styles.rewardBanner}>
              <Ionicons name="sparkles" size={16} color="#00A86B" />
              <Text style={styles.rewardBannerText}>
                Impact Reward: <Text style={{ fontWeight: '800' }}>+{estimatedGP} GreenPoints</Text> credited as items are claimed & verified!
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
                  <Ionicons name="checkmark-done" size={18} color="#FFFFFF" />
                  <Text style={styles.submitBtnText}>Publish Donation Listing</Text>
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
    maxHeight: '90%',
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
  fieldLabel: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.6,
    color: '#64748B',
    marginTop: 4,
  },
  categoryChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 12,
    borderWidth: 1,
  },
  categoryChipText: {
    fontSize: 12,
    fontWeight: '700',
  },
  photoBox: {
    height: 100,
    borderWidth: 1.5,
    borderColor: '#CBD5E1',
    borderStyle: 'dashed',
    borderRadius: 14,
    backgroundColor: '#F8FAFC',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  photoPreview: {
    width: '100%',
    height: '100%',
  },
  photoPromptText: {
    fontSize: 12,
    color: '#64748B',
    fontWeight: '500',
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
  rowInputs: {
    flexDirection: 'row',
    gap: 10,
  },
  unitPill: {
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderRadius: 8,
    justifyContent: 'center',
  },
  unitText: {
    fontSize: 11,
    fontWeight: '700',
  },
  conditionSelectChip: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
  },
  condSelectText: {
    fontSize: 11,
    fontWeight: '600',
  },
  gpsLink: {
    fontSize: 11,
    fontWeight: '700',
    color: '#00A86B',
  },
  rewardBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#D9F3E9',
    padding: 10,
    borderRadius: 12,
    marginTop: 6,
  },
  rewardBannerText: {
    fontSize: 12,
    color: '#154212',
    flex: 1,
  },
  submitBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: '#00A86B',
    paddingVertical: 14,
    borderRadius: 14,
    marginTop: 10,
  },
  submitBtnText: {
    fontSize: 15,
    fontWeight: '800',
    color: '#FFFFFF',
  },
});
