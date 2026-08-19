import { Linking, Alert } from 'react-native';

export interface DiyProjectItem {
  id: string;
  categoryId: string;
  categoryName: string;
  title: string;
  description: string;
  iconName: string;
  difficulty: 'Easy' | 'Medium' | 'Creative';
  timeEstimate: string;
  youtubeSearchQuery: string;
}

export const DIY_PROJECTS_CATALOG: DiyProjectItem[] = [
  // 1. PLASTIC
  {
    id: 'diy-plastic-1',
    categoryId: 'plastic',
    categoryName: 'Plastic',
    title: 'Vertical Self-Watering Herb Planter',
    description: 'Turn 2L plastic soda bottles into self-watering capillary planters for green chili & mint herbs.',
    iconName: 'beaker',
    difficulty: 'Easy',
    timeEstimate: '15 mins',
    youtubeSearchQuery: 'DIY self watering planter plastic bottle tutorial',
  },
  {
    id: 'diy-plastic-2',
    categoryId: 'plastic',
    categoryName: 'Plastic',
    title: 'Hanging Wild Bird Feeder',
    description: 'Upcycle plastic juice bottles with wooden spoons into weather-resistant outdoor bird seed feeders.',
    iconName: 'beaker',
    difficulty: 'Easy',
    timeEstimate: '20 mins',
    youtubeSearchQuery: 'DIY plastic bottle bird feeder wooden spoon',
  },

  // 2. PAPER & CARDBOARD
  {
    id: 'diy-paper-1',
    categoryId: 'paper',
    categoryName: 'Paper',
    title: 'Wildflower Seed Bomb Balls',
    description: 'Blend waste paper scrap into pulp with native wildflower seeds to restore local butterfly habitats.',
    iconName: 'document-text',
    difficulty: 'Easy',
    timeEstimate: '25 mins',
    youtubeSearchQuery: 'how to make seed bombs recycled paper pulp',
  },
  {
    id: 'diy-paper-2',
    categoryId: 'paper',
    categoryName: 'Paper',
    title: 'Woven Newspaper Desk Organizer',
    description: 'Roll old newspapers into durable woven tubes to craft rustic desk storage baskets.',
    iconName: 'document-text',
    difficulty: 'Medium',
    timeEstimate: '45 mins',
    youtubeSearchQuery: 'newspaper weaving storage basket tutorial',
  },

  // 3. METAL
  {
    id: 'diy-metal-1',
    categoryId: 'metal',
    categoryName: 'Metal',
    title: 'Tin Can Solar Candle Lantern',
    description: 'Punch decorative hole patterns into empty food tins to craft solar & tealight garden lanterns.',
    iconName: 'hardware-chip',
    difficulty: 'Medium',
    timeEstimate: '30 mins',
    youtubeSearchQuery: 'tin can lantern punch hole DIY tutorial',
  },
  {
    id: 'diy-metal-2',
    categoryId: 'metal',
    categoryName: 'Metal',
    title: 'Soda Can Plant Labels & Markers',
    description: 'Emboss aluminum soda cans into waterproof, rust-proof garden plant markers.',
    iconName: 'hardware-chip',
    difficulty: 'Easy',
    timeEstimate: '15 mins',
    youtubeSearchQuery: 'DIY aluminum soda can garden plant markers',
  },

  // 4. GLASS
  {
    id: 'diy-glass-1',
    categoryId: 'glass',
    categoryName: 'Glass',
    title: 'Glass Jar Hydroponic Sprouter',
    description: 'Transform glass sauce jars into windowsill hydroponic water propagation stations.',
    iconName: 'wine',
    difficulty: 'Easy',
    timeEstimate: '10 mins',
    youtubeSearchQuery: 'glass mason jar water propagation hydroponics',
  },
  {
    id: 'diy-glass-2',
    categoryId: 'glass',
    categoryName: 'Glass',
    title: 'Stained Glass Twinkle Fairy Lamp',
    description: 'Paint glass bottles with frosted glass paint and insert fairy LED lights for warm eco-lighting.',
    iconName: 'wine',
    difficulty: 'Creative',
    timeEstimate: '35 mins',
    youtubeSearchQuery: 'DIY glass bottle fairy LED light lamp tutorial',
  },

  // 5. E-WASTE
  {
    id: 'diy-ewaste-1',
    categoryId: 'ewaste',
    categoryName: 'E-Waste',
    title: 'Circuit Board Tech Keychain & Coasters',
    description: 'Upcycle obsolete motherboards & RAM sticks into stylish cyberpunk keychains and desk coasters.',
    iconName: 'laptop',
    difficulty: 'Creative',
    timeEstimate: '25 mins',
    youtubeSearchQuery: 'DIY circuit board resin coasters tech craft',
  },

  // 6. TEXTILES
  {
    id: 'diy-textiles-1',
    categoryId: 'textiles',
    categoryName: 'Textiles',
    title: 'No-Sew T-Shirt Grocery Tote Bag',
    description: 'Cut and knot old cotton T-shirts into heavy-duty plastic-free grocery carry bags.',
    iconName: 'shirt',
    difficulty: 'Easy',
    timeEstimate: '15 mins',
    youtubeSearchQuery: 'no sew t shirt tote bag tutorial',
  },

  // 7. ORGANIC
  {
    id: 'diy-organic-1',
    categoryId: 'organic',
    categoryName: 'Organic',
    title: 'Kitchen Scrap Bio-Compost Tea',
    description: 'Steep vegetable peels and coffee grounds to make natural liquid fertilizer for campus flora.',
    iconName: 'leaf',
    difficulty: 'Easy',
    timeEstimate: '10 mins',
    youtubeSearchQuery: 'how to make kitchen scrap compost tea fertilizer',
  },
];

/**
 * Deep-links directly to YouTube app or browser search results using $0 external API cost.
 */
export async function openYouTubeTutorial(searchQuery: string): Promise<void> {
  try {
    const url = `https://www.youtube.com/results?search_query=${encodeURIComponent(searchQuery)}`;
    const supported = await Linking.canOpenURL(url);

    if (supported) {
      await Linking.openURL(url);
    } else {
      Alert.alert('Cannot Open Link', 'Unable to open YouTube search URL on this device.');
    }
  } catch (err) {
    console.warn('[DIY] Error opening YouTube deep-link:', err);
    Alert.alert('Link Error', 'Could not launch YouTube tutorial.');
  }
}


// =============================================
// Multi-Material Combo DIY Projects
// =============================================

export interface DiyComboProject {
  id: string;
  requiredCategories: string[]; // category slugs that must ALL be present
  title: string;
  description: string;
  iconName: string;
  difficulty: 'Easy' | 'Medium' | 'Creative';
  timeEstimate: string;
  youtubeSearchQuery: string;
}

export const DIY_COMBO_PROJECTS: DiyComboProject[] = [
  {
    id: 'combo-plastic-paper-1',
    requiredCategories: ['plastic', 'paper'],
    title: 'Upcycled Hanging Herb Planter with Seed Collar',
    description: 'Combine plastic bottles as self-watering planters with cardboard seed germination collars for a vertical herb garden.',
    iconName: 'leaf',
    difficulty: 'Easy',
    timeEstimate: '25 mins',
    youtubeSearchQuery: 'DIY plastic bottle cardboard herb planter vertical garden',
  },
  {
    id: 'combo-plastic-metal-1',
    requiredCategories: ['plastic', 'metal'],
    title: 'Wind-Powered Garden Spinner',
    description: 'Cut plastic bottles into vanes and mount on a tin can axle to create a colourful wind spinner for your balcony or garden.',
    iconName: 'flash',
    difficulty: 'Medium',
    timeEstimate: '30 mins',
    youtubeSearchQuery: 'DIY plastic bottle tin can wind spinner garden craft',
  },
  {
    id: 'combo-glass-metal-1',
    requiredCategories: ['glass', 'metal'],
    title: 'Industrial Terrarium Lantern',
    description: 'Place succulents inside glass jars, topped with punched-tin-can lantern frames for an industrial-chic terrarium light.',
    iconName: 'bulb',
    difficulty: 'Creative',
    timeEstimate: '40 mins',
    youtubeSearchQuery: 'DIY glass jar tin can terrarium lantern industrial',
  },
  {
    id: 'combo-paper-textiles-1',
    requiredCategories: ['paper', 'textiles'],
    title: 'Fabric-Wrapped Journal & Desk Organizer',
    description: 'Bind waste paper sheets with old fabric strips to create handmade eco journals and woven desk organizers.',
    iconName: 'book',
    difficulty: 'Medium',
    timeEstimate: '35 mins',
    youtubeSearchQuery: 'DIY recycled paper fabric journal handmade book binding',
  },
  {
    id: 'combo-plastic-glass-1',
    requiredCategories: ['plastic', 'glass'],
    title: 'Hydroponic Propagation Station',
    description: 'Use glass jars as water chambers with plastic bottle funnels as drip-feed holders for a zero-cost hydroponic plant starter.',
    iconName: 'water',
    difficulty: 'Easy',
    timeEstimate: '15 mins',
    youtubeSearchQuery: 'DIY glass jar plastic bottle hydroponic propagation station',
  },
  {
    id: 'combo-metal-ewaste-1',
    requiredCategories: ['metal', 'ewaste'],
    title: 'Cyberpunk Desk Lamp',
    description: 'Combine old circuit boards, RAM sticks, and tin cans to build a retro-futuristic desk lamp with LED strip lighting.',
    iconName: 'bulb',
    difficulty: 'Creative',
    timeEstimate: '45 mins',
    youtubeSearchQuery: 'DIY circuit board tin can desk lamp cyberpunk LED craft',
  },
  {
    id: 'combo-organic-paper-1',
    requiredCategories: ['organic', 'paper'],
    title: 'Compost Seed Starter Pots',
    description: 'Mix kitchen scraps with shredded paper pulp to mould biodegradable seed starter pots that decompose right into the soil.',
    iconName: 'flower',
    difficulty: 'Easy',
    timeEstimate: '20 mins',
    youtubeSearchQuery: 'DIY paper pulp compost seed starter pots biodegradable',
  },
];


// =============================================
// Dynamic DIY Suggestion Engine
// =============================================

export interface DiyLockerItem {
  category: string; // slug
}

export interface DynamicDiySuggestion {
  project: DiyProjectItem | DiyComboProject;
  isCombo: boolean;
  matchedCategories: string[];
}

/**
 * Generates DIY project suggestions based on exact materials in the current locker.
 * Prioritizes multi-material combo projects, then falls back to single-material.
 * Returns up to maxResults projects.
 */
export function getDynamicDiySuggestions(
  items: DiyLockerItem[],
  maxResults: number = 4
): DynamicDiySuggestion[] {
  const categories = [...new Set(items.map((i) => i.category))];
  if (categories.length === 0) return [];

  const suggestions: DynamicDiySuggestion[] = [];
  const usedIds = new Set<string>();

  // 1. Multi-material combo projects first
  for (const combo of DIY_COMBO_PROJECTS) {
    if (usedIds.size >= maxResults) break;

    const allPresent = combo.requiredCategories.every((req) => categories.includes(req));
    if (allPresent && !usedIds.has(combo.id)) {
      suggestions.push({
        project: combo,
        isCombo: true,
        matchedCategories: combo.requiredCategories,
      });
      usedIds.add(combo.id);
    }
  }

  // 2. Single-material projects for remaining categories
  for (const cat of categories) {
    if (usedIds.size >= maxResults) break;

    const singleProject = DIY_PROJECTS_CATALOG.find(
      (p) => p.categoryId === cat && !usedIds.has(p.id)
    );
    if (singleProject) {
      suggestions.push({
        project: singleProject,
        isCombo: false,
        matchedCategories: [cat],
      });
      usedIds.add(singleProject.id);
    }
  }

  return suggestions;
}

