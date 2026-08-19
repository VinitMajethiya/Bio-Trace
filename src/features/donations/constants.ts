import { DonationCategory, DonationUnit, DonationCondition } from './types';

export interface CategoryMeta {
  id: DonationCategory;
  label: string;
  icon: string;
  color: string;
  badgeBg: string;
  defaultUnit: DonationUnit;
  gpMultiplier: number; // GP per unit
  impactDescription: string;
}

export const DONATION_CATEGORIES: CategoryMeta[] = [
  {
    id: 'saplings',
    label: 'Saplings',
    icon: 'leaf',
    color: '#00A86B',
    badgeBg: '#D9F3E9',
    defaultUnit: 'saplings',
    gpMultiplier: 25,
    impactDescription: 'Directly expands campus tree canopy & sequester carbon.',
  },
  {
    id: 'seeds',
    label: 'Native Seeds',
    icon: 'flower-outline',
    color: '#D97706',
    badgeBg: '#FEF3C7',
    defaultUnit: 'packets',
    gpMultiplier: 15,
    impactDescription: 'Protects pollinator habitats and native botanical diversity.',
  },
  {
    id: 'compost',
    label: 'Organic Compost',
    icon: 'cube-outline',
    color: '#854D0E',
    badgeBg: '#FEF9C3',
    defaultUnit: 'kg',
    gpMultiplier: 10,
    impactDescription: 'Restores microbial soil fertility without chemical runoff.',
  },
  {
    id: 'tools',
    label: 'Gardening Tools',
    icon: 'construct-outline',
    color: '#3B82F6',
    badgeBg: '#EFF6FF',
    defaultUnit: 'tools',
    gpMultiplier: 40,
    impactDescription: 'Empowers student stewards and community plantation abhiyans.',
  },
  {
    id: 'materials',
    label: 'Upcycled Materials',
    icon: 'refresh-outline',
    color: '#8B5CF6',
    badgeBg: '#F3E8FF',
    defaultUnit: 'items',
    gpMultiplier: 20,
    impactDescription: 'Keeps reusable gardening containers & planters out of landfills.',
  },
  {
    id: 'other',
    label: 'Other Eco Items',
    icon: 'gift-outline',
    color: '#4B5563',
    badgeBg: '#F3F4F6',
    defaultUnit: 'items',
    gpMultiplier: 15,
    impactDescription: 'Supports local greening drives and environmental stewardship.',
  },
];

export const DONATION_UNITS: { id: DonationUnit; label: string }[] = [
  { id: 'saplings', label: 'Saplings' },
  { id: 'packets', label: 'Seed Packets' },
  { id: 'kg', label: 'Kilograms (kg)' },
  { id: 'tools', label: 'Tools' },
  { id: 'items', label: 'Items / Pots' },
  { id: 'units', label: 'Units' },
];

export const DONATION_CONDITIONS: { id: DonationCondition; label: string; description: string }[] = [
  { id: 'healthy', label: 'Thriving / Healthy', description: 'Fresh, root-bound, or active organic condition' },
  { id: 'new', label: 'Brand New', description: 'Unused, sealed, or pristine' },
  { id: 'gently_used', label: 'Gently Used', description: 'Clean, fully functional, ready to plant/use' },
  { id: 'upcycled', label: 'Upcycled / Handmade', description: 'Repurposed bottles, planters, or wooden boxes' },
];

export const INTENDED_USE_OPTIONS = [
  { id: 'campus_plantation', label: '🌳 Campus Plantation Drive' },
  { id: 'society_garden', label: '🏡 Society & Community Garden' },
  { id: 'school_workshop', label: '🎒 School Eco-Club Workshop' },
  { id: 'urban_balcony', label: '🌿 Personal Urban Greening' },
  { id: 'ngo_restoration', label: '🛡️ NGO Habitat Restoration' },
];

export function calculateEstimatedGP(category: DonationCategory, quantity: number): number {
  const meta = DONATION_CATEGORIES.find((c) => c.id === category);
  const rate = meta ? meta.gpMultiplier : 15;
  const raw = Math.round(rate * quantity);
  return Math.max(30, Math.min(500, raw));
}
