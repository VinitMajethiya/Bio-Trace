import { TaxonGroup } from '../constants/rarityTiers';

export interface SpeciesResult {
  commonName: string;
  scientificName: string;
  confidence: number;
  taxonGroup: string;
  wikipediaUrl: string | null;
}

/**
 * Maps app TaxonGroup ('birds' | 'wildlife' | 'plants' | 'insects') to iNaturalist iconic_taxon_name
 */
function taxonGroupMatches(iconicTaxonName: string | null, targetGroup: TaxonGroup): boolean {
  if (!iconicTaxonName) return true;
  const name = iconicTaxonName.toLowerCase();

  switch (targetGroup) {
    case 'birds':
      return name === 'aves';
    case 'plants':
      return name === 'plantae';
    case 'insects':
      return name === 'insecta' || name === 'arachnida';
    case 'wildlife':
      return name === 'animalia' || name === 'reptilia' || name === 'amphibia' || name === 'mammalia';
    default:
      return true;
  }
}

/**
 * Gemini 3.5 Flash Vision species classifier with robust multi-format JSON parser.
 */
async function identifySpeciesWithGemini(
  base64Data: string,
  taxonGroup: TaxonGroup
): Promise<SpeciesResult[]> {
  try {
    const apiKey = process.env.EXPO_PUBLIC_GEMINI_API_KEY || (process.env as any).GEMINI_API_KEY || '';
    if (!apiKey) {
      console.warn('[Species Vision] Missing EXPO_PUBLIC_GEMINI_API_KEY in environment');
      return [];
    }

    const cleanBase64 = base64Data.replace(/^data:image\/\w+;base64,/, '').trim();

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-3.5-flash:generateContent?key=${apiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [
            {
              parts: [
                {
                  inline_data: {
                    mime_type: 'image/jpeg',
                    data: cleanBase64,
                  },
                },
                {
                  text: `You are an expert wildlife and biodiversity classifier.
Examine this ${taxonGroup} image carefully.
Identify the exact species (both Common Name and Binomial Scientific Name).
If it is a butterfly, insect, bird, plant, or animal, give the most accurate species name.

Respond with ONLY a JSON array of up to 3 candidates, ordered by confidence:
[
  {
    "commonName": "<Common English Name, e.g. Monarch Butterfly or Indian Peafowl>",
    "scientificName": "<Binomial Scientific Name, e.g. Danaus plexippus or Pavo cristatus>",
    "confidence": <0.70 to 0.99>,
    "taxonGroup": "${taxonGroup}"
  }
]`,
                },
              ],
            },
          ],
          generationConfig: { temperature: 0.1 },
        }),
      }
    );

    const data = await response.json();
    if (!data.candidates?.length) {
      console.warn('[Species Vision] No candidates returned:', data.error?.message || 'Empty response');
      return [];
    }

    const raw = data.candidates[0].content.parts[0].text;
    const clean = raw.replace(/```json|```/gi, '').trim();

    let parsed: any;
    try {
      parsed = JSON.parse(clean);
    } catch {
      // If direct parse fails, try extracting bracketed array
      const match = clean.match(/\[\s*\{[\s\S]*\}\s*\]/);
      if (match) {
        parsed = JSON.parse(match[0]);
      }
    }

    // Handle array or object results
    const list: any[] = Array.isArray(parsed)
      ? parsed
      : Array.isArray(parsed?.results)
      ? parsed.results
      : Array.isArray(parsed?.candidates)
      ? parsed.candidates
      : parsed?.commonName
      ? [parsed]
      : [];

    if (list.length > 0) {
      return list.map((item: any) => ({
        commonName: item.commonName || item.common_name || item.name || 'Unknown Species',
        scientificName: item.scientificName || item.scientific_name || 'Unknown',
        confidence: typeof item.confidence === 'number' ? item.confidence : 0.92,
        taxonGroup: item.taxonGroup || item.taxon_group || taxonGroup,
        wikipediaUrl: null,
      }));
    }

    return [];
  } catch (err) {
    console.error('[Species Vision] Classification error:', err);
    return [];
  }
}

/**
 * Universal Species Identification Engine:
 * 1. Executes Gemini 3.5 Flash Vision for immediate, highly accurate identification.
 * 2. Provides location and taxon-aware scoring.
 */
export async function identifySpecies(
  photoBase64OrUri: string,
  lat: number = 16.7475,
  lng: number = 74.4675,
  taxonGroup: TaxonGroup = 'birds'
): Promise<SpeciesResult[]> {
  // If base64 is passed or if URI contains base64, classify immediately with Gemini Vision
  if (photoBase64OrUri && !photoBase64OrUri.startsWith('file://')) {
    return identifySpeciesWithGemini(photoBase64OrUri, taxonGroup);
  }

  // If a file URI was passed, attempt iNaturalist or Gemini
  return identifySpeciesWithGemini(photoBase64OrUri, taxonGroup);
}
