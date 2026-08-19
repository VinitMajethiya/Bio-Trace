import { MaterialCommunityIcons } from '@expo/vector-icons';

export type IconName = keyof typeof MaterialCommunityIcons.glyphMap;

export const icons: Record<string, IconName> = {
  // Wild module
  bird: 'bird',
  wildlife: 'paw',
  plant: 'leaf',
  insect: 'bug',
  sighting: 'eye',

  // Circular module
  waste: 'recycle',
  locker: 'archive',
  pickup: 'truck-delivery',

  // Gamification
  greenpoints: 'star-circle',
  xp: 'lightning-bolt',
  rarity_common: 'circle-outline',
  rarity_amber: 'fire',
  rarity_legendary: 'diamond-stone',

  // Health Score
  health: 'heart-pulse',
  territory: 'map-marker-radius',

  // Navigation
  map: 'map',
  collection: 'book-open-variant',
  wallet: 'wallet',
  profile: 'account-circle',
  raid: 'shield-star',
};
