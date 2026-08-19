export type TaxonGroup = 'birds' | 'wildlife' | 'plants' | 'insects';

export interface RarityRule {
  keyword: string;
  tier: 'common' | 'amber' | 'legendary';
}

export const RARITY_TIERS: Record<TaxonGroup, RarityRule[]> = {
  birds: [
    { keyword: 'sparrow', tier: 'common' },
    { keyword: 'pigeon', tier: 'common' },
    { keyword: 'crow', tier: 'common' },
    { keyword: 'kingfisher', tier: 'amber' },
    { keyword: 'sunbird', tier: 'amber' },
    { keyword: 'owl', tier: 'amber' },
    { keyword: 'hornbill', tier: 'legendary' },
    { keyword: 'eagle', tier: 'legendary' },
    { keyword: 'falcon', tier: 'legendary' },
  ],
  wildlife: [
    { keyword: 'squirrel', tier: 'common' },
    { keyword: 'dog', tier: 'common' },
    { keyword: 'cat', tier: 'common' },
    { keyword: 'monk', tier: 'amber' },
    { keyword: 'lizard', tier: 'amber' },
    { keyword: 'chameleon', tier: 'amber' },
    { keyword: 'leopard', tier: 'legendary' },
    { keyword: 'pangolin', tier: 'legendary' },
  ],
  plants: [
    { keyword: 'grass', tier: 'common' },
    { keyword: 'neem', tier: 'common' },
    { keyword: 'tulsi', tier: 'common' },
    { keyword: 'banyan', tier: 'amber' },
    { keyword: 'orchid', tier: 'amber' },
    { keyword: 'bamboo', tier: 'amber' },
    { keyword: 'cycad', tier: 'legendary' },
    { keyword: 'sandalwood', tier: 'legendary' },
  ],
  insects: [
    { keyword: 'ant', tier: 'common' },
    { keyword: 'fly', tier: 'common' },
    { keyword: 'mosquito', tier: 'common' },
    { keyword: 'butterfly', tier: 'amber' },
    { keyword: 'dragonfly', tier: 'amber' },
    { keyword: 'beetle', tier: 'amber' },
    { keyword: 'atlas moth', tier: 'legendary' },
    { keyword: 'mantis', tier: 'legendary' },
  ],
};

export function getRarityTier(taxonGroup: TaxonGroup, speciesName: string): 'common' | 'amber' | 'legendary' {
  const rules = RARITY_TIERS[taxonGroup] || [];
  const lowerName = speciesName.toLowerCase();

  for (const rule of rules) {
    if (lowerName.includes(rule.keyword.toLowerCase())) {
      return rule.tier;
    }
  }

  return 'common';
}
