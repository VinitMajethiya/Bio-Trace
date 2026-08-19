import { supabase } from './supabase';
import { PILOT_TERRITORY_ID, incrementHealthScore } from './territory';
import { recordGreenPointsTransaction } from './ledger';

// =============================================
// Constants
// =============================================
export const MIN_PICKUP_WEIGHT_KG = 2.0;

// =============================================
// Types
// =============================================

/** Server-authoritative rate table row */
export interface WasteCategoryRate {
  category: string;
  name: string;
  price_per_kg: number;
  gp_per_kg: number;
  default_weight_kg: number;
  icon: string;
  color: string;
}

/** Locker session row from Supabase */
export interface LockerSession {
  id: string;
  user_id: string;
  status: 'active' | 'scheduled' | 'completed' | 'cancelled';
  total_weight_kg: number;
  total_payout_inr: number;
  total_gp: number;
  created_at: string;
  closed_at: string | null;
}

/** Locker item row from Supabase (joined with rate for category_name) */
export interface LockerItemRecord {
  id: string;
  session_id: string;
  user_id: string;
  category: string;
  estimated_weight: number;
  image_url: string | null;
  source: 'ai' | 'manual';
  confidence: number | null;
  created_at: string;
  // Joined from waste_category_rates
  waste_category_rates?: WasteCategoryRate;
}

/** Client-side locker item for UI display */
export interface LockerItem {
  id: string;
  category: string;
  categoryName: string;
  icon: string;
  color: string;
  weightKg: number;
  payoutAmount: number;
  gpReward: number;
  photoUri?: string;       // local display URI
  storagePath?: string;    // Supabase storage path
  source: 'ai' | 'manual';
  confidence?: number;
}

/** AI scan result — discriminated union on status */
export type WasteScanResult =
  | { status: 'success'; categoryId: string; categoryName: string; confidence: number; estimatedWeightKg: number; itemDescription: string }
  | { status: 'uncertain'; estimatedWeightKg: number; itemDescription: string }
  | { status: 'network_error'; message: string };

/** Backward-compat: still used by MapScreen and history views */
export interface WasteTransactionRecord {
  id?: string;
  user_id: string;
  territory_id?: string;
  category: string;
  photo_url?: string;
  ai_confidence?: number;
  weight_estimate: number;
  payout_amount: number;
  verification_tier?: number;
  status?: string;
  created_at?: string;
}

// =============================================
// Category Slug Normalization
// =============================================

const CATEGORY_SLUG_MAP: Record<string, string> = {
  paper: 'paper',
  cardboard: 'paper',
  newspaper: 'paper',
  plastic: 'plastic',
  pet: 'plastic',
  metal: 'metal',
  aluminum: 'metal',
  tin: 'metal',
  can: 'metal',
  glass: 'glass',
  ewaste: 'ewaste',
  electronic: 'ewaste',
  electronics: 'ewaste',
  textiles: 'textiles',
  textile: 'textiles',
  cloth: 'textiles',
  fabric: 'textiles',
  organic: 'organic',
  food: 'organic',
  compost: 'organic',
};

export function normalizeCategorySlug(rawCategory: string | null | undefined): string | null {
  if (!rawCategory) return null;
  const clean = rawCategory.trim().toLowerCase().replace(/[^a-z0-9]/g, '');
  if (clean === 'unknown') return null;
  return CATEGORY_SLUG_MAP[clean] || null;
}

// =============================================
// Weight Sanitization
// =============================================

/**
 * Defensively clamps/defaults AI-reported weight.
 * Re-run this on manual category override to re-derive against the new category's default.
 */
export function sanitizeEstimatedWeight(
  rawWeight: any,
  categorySlug: string,
  rates: WasteCategoryRate[]
): number {
  const parsed = typeof rawWeight === 'number' ? rawWeight : parseFloat(rawWeight);
  const rate = rates.find((r) => r.category === categorySlug);
  const defaultWeight = rate?.default_weight_kg || 0.1;

  if (isNaN(parsed) || parsed <= 0) return defaultWeight;

  // Clamp: 0.01 kg (10g wrapper) – 25.0 kg (heavy bulk)
  return Math.round(Math.min(25.0, Math.max(0.01, parsed)) * 100) / 100;
}

// =============================================
// Category Rates (from server-authoritative table)
// =============================================

let _cachedRates: WasteCategoryRate[] | null = null;

/** Fetches the server-authoritative category rate table (cached after first call) */
export async function fetchCategoryRates(): Promise<WasteCategoryRate[]> {
  if (_cachedRates) return _cachedRates;

  try {
    const { data, error } = await supabase
      .from('waste_category_rates')
      .select('*')
      .order('category');

    if (!error && data && data.length > 0) {
      _cachedRates = data as WasteCategoryRate[];
      return _cachedRates;
    }
  } catch (err) {
    console.warn('[Circular] Failed to fetch rate table, using defaults:', err);
  }

  // Hardcoded fallback if DB is unreachable
  _cachedRates = [
    { category: 'paper', name: 'Paper', price_per_kg: 12, gp_per_kg: 15, default_weight_kg: 0.10, icon: 'document-text', color: '#F59E0B' },
    { category: 'plastic', name: 'Plastic', price_per_kg: 25, gp_per_kg: 25, default_weight_kg: 0.05, icon: 'beaker', color: '#3B82F6' },
    { category: 'metal', name: 'Metal', price_per_kg: 40, gp_per_kg: 40, default_weight_kg: 0.20, icon: 'hardware-chip', color: '#10B981' },
    { category: 'glass', name: 'Glass', price_per_kg: 8, gp_per_kg: 10, default_weight_kg: 0.30, icon: 'wine', color: '#8B5CF6' },
    { category: 'ewaste', name: 'E-Waste', price_per_kg: 75, gp_per_kg: 80, default_weight_kg: 0.50, icon: 'laptop', color: '#EC4899' },
    { category: 'textiles', name: 'Textiles', price_per_kg: 18, gp_per_kg: 20, default_weight_kg: 0.30, icon: 'shirt', color: '#14B8A6' },
    { category: 'organic', name: 'Organic', price_per_kg: 5, gp_per_kg: 10, default_weight_kg: 0.20, icon: 'leaf', color: '#84CC16' },
  ];
  return _cachedRates;
}

// Backward-compat: re-export as WASTE_CATEGORIES for existing consumers (DiyProjectsScreen, etc.)
export const WASTE_CATEGORIES = [
  { id: 'paper', name: 'Paper', icon: 'document-text', pricePerKg: 12, gpPerKg: 15, color: '#F59E0B', defaultWeightKg: 0.1 },
  { id: 'plastic', name: 'Plastic', icon: 'beaker', pricePerKg: 25, gpPerKg: 25, color: '#3B82F6', defaultWeightKg: 0.05 },
  { id: 'metal', name: 'Metal', icon: 'hardware-chip', pricePerKg: 40, gpPerKg: 40, color: '#10B981', defaultWeightKg: 0.2 },
  { id: 'glass', name: 'Glass', icon: 'wine', pricePerKg: 8, gpPerKg: 10, color: '#8B5CF6', defaultWeightKg: 0.3 },
  { id: 'ewaste', name: 'E-Waste', icon: 'laptop', pricePerKg: 75, gpPerKg: 80, color: '#EC4899', defaultWeightKg: 0.5 },
  { id: 'textiles', name: 'Textiles', icon: 'shirt', pricePerKg: 18, gpPerKg: 20, color: '#14B8A6', defaultWeightKg: 0.3 },
  { id: 'organic', name: 'Organic', icon: 'leaf', pricePerKg: 5, gpPerKg: 10, color: '#84CC16', defaultWeightKg: 0.2 },
];

// Backward-compat type aliases
export type WasteCategoryInfo = typeof WASTE_CATEGORIES[0];
export type WasteLockerItem = LockerItem;

// =============================================
// AI Waste Identification
// =============================================

/**
 * AI Waste Scanner via Supabase Edge Function 'classify-waste'.
 * Separates network errors from AI uncertainty:
 * - Network/timeout → { status: 'network_error' }
 * - AI uncertain/unknown → { status: 'uncertain' }
 * - AI confident → { status: 'success' }
 */
// =============================================
// AI Waste Identification
// =============================================

/**
 * Direct Gemini 1.5 Flash Vision client-side fallback
 * Used when Supabase Edge Function is not deployed or unreachable.
 */
async function classifyWithDirectGemini(photoBase64OrUri: string, apiKey: string): Promise<WasteScanResult | null> {
  try {
    const cleanBase64 = photoBase64OrUri.replace(/^data:image\/\w+;base64,/, '');
    const WASTE_CATEGORIES_LIST = ["Paper", "Plastic", "Metal", "Glass", "E-Waste", "Textiles", "Organic"];

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
                  text: `You are a waste classification and weight estimation assistant for a recycling app.
Look at this image and:
1. Classify the waste item into one of these categories: ${WASTE_CATEGORIES_LIST.join(', ')}.
2. If the item is NOT clearly a recyclable waste item, is obscured, or you genuinely cannot identify it, you MUST return category as "unknown". Do NOT guess.
3. Estimate the physical weight of the item in kilograms (kg) based on its visual appearance.
Respond with ONLY JSON: {"category": "<one of categories or unknown>", "confidence": <0.0 to 1.0>, "estimated_weight_kg": <number>, "item_description": "<description>", "reasoning": "<reasoning>"}`,
                },
              ],
            },
          ],
          generationConfig: { temperature: 0 },
        }),
      }
    );

    const data = await response.json();
    if (!data.candidates?.length) return null;

    const raw = data.candidates[0].content.parts[0].text;
    const clean = raw.replace(/```json|```/gi, '').trim();
    const result = JSON.parse(clean);

    const categoryKey = normalizeCategorySlug(result.category);
    const confidence = result.confidence || 0;
    const estimatedWeight = result.estimated_weight_kg || 0;

    if (!categoryKey || confidence < 0.60) {
      return {
        status: 'uncertain',
        estimatedWeightKg: estimatedWeight,
        itemDescription: result.item_description || '',
      };
    }

    const rates = await fetchCategoryRates();
    const rate = rates.find((r) => r.category === categoryKey);

    return {
      status: 'success',
      categoryId: categoryKey,
      categoryName: rate?.name || categoryKey,
      confidence,
      estimatedWeightKg: estimatedWeight,
      itemDescription: result.item_description || '',
    };
  } catch (err) {
    console.warn('[Circular] Direct Gemini API error:', err);
    return null;
  }
}

/**
 * AI Waste Scanner via Supabase Edge Function 'classify-waste' with client-side Gemini fallback.
 * Separates network errors from AI uncertainty:
 * - Network/timeout → { status: 'network_error' }
 * - AI uncertain/unknown → { status: 'uncertain' }
 * - AI confident → { status: 'success' }
 */
export async function identifyWaste(photoBase64OrUri: string): Promise<WasteScanResult> {
  // 1. Try Supabase Edge Function first
  try {
    const { data, error } = await supabase.functions.invoke('classify-waste', {
      body: { imageBase64: photoBase64OrUri },
    });

    if (!error && data && data.category_display !== undefined) {
      const categoryKey = data.category_key; // Already normalized by Edge Function
      const confidence = data.confidence || 0;
      const estimatedWeight = data.estimated_weight_kg || 0;
      const itemDescription = data.item_description || '';

      if (!categoryKey || confidence < 0.60) {
        return {
          status: 'uncertain',
          estimatedWeightKg: estimatedWeight,
          itemDescription,
        };
      }

      const rates = await fetchCategoryRates();
      const rate = rates.find((r) => r.category === categoryKey);

      return {
        status: 'success',
        categoryId: categoryKey,
        categoryName: rate?.name || categoryKey,
        confidence,
        estimatedWeightKg: estimatedWeight,
        itemDescription,
      };
    }

    if (error) {
      console.warn('[Circular] classify-waste invocation error:', error.message);
    }
  } catch (err: any) {
    console.warn('[Circular] classify-waste network error:', err);
  }

  // 2. Try direct Gemini API if key is available in environment
  const directKey = process.env.EXPO_PUBLIC_GEMINI_API_KEY || (process.env as any).GEMINI_API_KEY || '';
  if (directKey) {
    const directResult = await classifyWithDirectGemini(photoBase64OrUri, directKey);
    if (directResult) return directResult;
  }

  // 3. If edge function not reachable/deployed, return network_error
  return {
    status: 'network_error',
    message: 'Could not reach classify-waste function. Ensure 06_the_locker_sessions.sql is run and function is deployed.',
  };
}

// =============================================
// Locker Session Management
// =============================================

/**
 * Gets the user's active locker session, or creates a new one if none exists.
 * If the database table does not exist yet in Supabase, returns a fallback local session.
 */
export async function getOrCreateActiveLockerSession(userId: string): Promise<LockerSession | null> {
  try {
    // Check for existing active session
    const { data: existing, error: fetchErr } = await supabase
      .from('locker_sessions')
      .select('*')
      .eq('user_id', userId)
      .eq('status', 'active')
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (fetchErr) {
      console.warn('[Circular] Note: locker_sessions table query:', fetchErr.message);
    }

    if (existing) return existing as LockerSession;

    // Create new session
    const { data: newSession, error: createErr } = await supabase
      .from('locker_sessions')
      .insert({ user_id: userId })
      .select()
      .single();

    if (!createErr && newSession) {
      return newSession as LockerSession;
    }

    if (createErr) {
      console.warn('[Circular] Error creating session in database:', createErr.message);
      // Fallback local session so UI is never blocked while migration is pending
      return {
        id: 'local-session-' + userId.slice(0, 8),
        user_id: userId,
        status: 'active',
        total_weight_kg: 0,
        total_payout_inr: 0,
        total_gp: 0,
        created_at: new Date().toISOString(),
        closed_at: null,
      };
    }

    return null;
  } catch (err) {
    console.error('[Circular] Failed to get/create session:', err);
    return {
      id: 'local-session-' + userId.slice(0, 8),
      user_id: userId,
      status: 'active',
      total_weight_kg: 0,
      total_payout_inr: 0,
      total_gp: 0,
      created_at: new Date().toISOString(),
      closed_at: null,
    };
  }
}

/**
 * Fetches all items for a session, joined with rates for category display info.
 */
export async function fetchLockerSessionItems(sessionId: string): Promise<LockerItemRecord[]> {
  try {
    const { data, error } = await supabase
      .from('locker_items')
      .select('*, waste_category_rates(*)')
      .eq('session_id', sessionId)
      .order('created_at', { ascending: false });

    if (error) {
      console.warn('[Circular] Error fetching locker items:', error.message);
      return [];
    }
    return (data || []) as LockerItemRecord[];
  } catch (err) {
    console.error('[Circular] Failed to fetch locker items:', err);
    return [];
  }
}

/**
 * Adds an item to the active locker session.
 * The DB trigger automatically recalculates session totals.
 */
export async function addItemToLockerSession(
  sessionId: string,
  userId: string,
  category: string,
  estimatedWeight: number,
  source: 'ai' | 'manual',
  confidence: number | null,
  imageUrl?: string
): Promise<{ success: boolean; itemId?: string; error?: string }> {
  try {
    const { data, error } = await supabase
      .from('locker_items')
      .insert({
        session_id: sessionId,
        user_id: userId,
        category,
        estimated_weight: estimatedWeight,
        source,
        confidence,
        image_url: imageUrl || null,
      })
      .select('id')
      .single();

    if (error) {
      console.warn('[Circular] Error adding locker item:', error.message);
      return { success: false, error: error.message };
    }

    return { success: true, itemId: data?.id };
  } catch (err: any) {
    console.error('[Circular] Failed to add locker item:', err);
    return { success: false, error: err.message || 'Failed to add item' };
  }
}

/**
 * Removes an item from the locker session.
 * The DB trigger automatically recalculates session totals.
 */
export async function removeItemFromLockerSession(itemId: string): Promise<boolean> {
  try {
    const { error } = await supabase
      .from('locker_items')
      .delete()
      .eq('id', itemId);

    if (error) {
      console.warn('[Circular] Error removing locker item:', error.message);
      return false;
    }
    return true;
  } catch (err) {
    console.error('[Circular] Failed to remove locker item:', err);
    return false;
  }
}

/**
 * Re-fetches the session row to get trigger-updated totals.
 */
export async function refreshLockerSession(sessionId: string): Promise<LockerSession | null> {
  try {
    const { data, error } = await supabase
      .from('locker_sessions')
      .select('*')
      .eq('id', sessionId)
      .single();

    if (error) {
      console.warn('[Circular] Error refreshing session:', error.message);
      return null;
    }
    return data as LockerSession;
  } catch (err) {
    console.error('[Circular] Failed to refresh session:', err);
    return null;
  }
}

// =============================================
// Pickup Scheduling
// =============================================

/**
 * Schedules a pickup for the locker session.
 * The DB trigger enforces ≥ 2.0 kg, stamps items/totals, and locks the session.
 * Double-tap safe via unique partial index.
 */
export async function scheduleLockerPickup(
  userId: string,
  sessionId: string,
  scheduledWindow: string,
  lat: number | null,
  lng: number | null,
  pickupAddress?: string
): Promise<{ success: boolean; pickupId?: string; error?: string }> {
  try {
    const { data, error } = await supabase
      .from('pickup_requests')
      .insert({
        user_id: userId,
        locker_session_id: sessionId,
        scheduled_window: scheduledWindow,
        pickup_lat: lat,
        pickup_lng: lng,
        pickup_address: pickupAddress || null,
        status: 'pending',
        mock_eta_seconds: 120,
        // items, total_weight_kg, estimated_value_inr are stamped by trigger
      })
      .select('id')
      .single();

    if (error) {
      // Handle unique constraint (double-tap) gracefully
      if (error.code === '23505') {
        return { success: false, error: 'A pickup has already been scheduled for this locker session.' };
      }
      console.warn('[Circular] Error scheduling pickup:', error.message);
      return { success: false, error: error.message };
    }

    // Trigger mock collector progression for demo
    if (data?.id) {
      supabase.functions.invoke('mock-pickup-progression', {
        body: { pickupId: data.id },
      }).catch((e) => console.warn('Mock pickup progression error:', e));
    }

    return { success: true, pickupId: data?.id };
  } catch (err: any) {
    console.error('[Circular] Failed to schedule pickup:', err);
    return { success: false, error: err.message || 'Failed to schedule pickup' };
  }
}

/**
 * User cancels their own pending/assigned pickup via RPC.
 */
export async function cancelOwnPickup(pickupId: string): Promise<{ success: boolean; error?: string }> {
  try {
    const { error } = await supabase.rpc('cancel_own_pickup', { p_id: pickupId });
    if (error) {
      console.warn('[Circular] Error cancelling pickup:', error.message);
      return { success: false, error: error.message };
    }
    return { success: true };
  } catch (err: any) {
    console.error('[Circular] Failed to cancel pickup:', err);
    return { success: false, error: err.message || 'Failed to cancel pickup' };
  }
}

// =============================================
// Legacy / Backward-Compat
// =============================================

/**
 * Fetches user's past logged waste transactions from Supabase.
 * Used by MapScreen and history views.
 */
export async function fetchUserWasteHistory(userId: string): Promise<WasteTransactionRecord[]> {
  try {
    const { data, error } = await supabase
      .from('waste_transactions')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) {
      console.warn('Error fetching waste history:', error.message);
      return [];
    }

    return (data || []) as WasteTransactionRecord[];
  } catch (err) {
    console.error('Failed to fetch waste history:', err);
    return [];
  }
}

/**
 * Submits confirmed waste transaction batch to Supabase.
 * Legacy: used for direct transaction logging outside the Locker flow.
 */
export async function submitWasteTransaction(
  userId: string,
  items: LockerItem[],
  zoneTier: 'home' | 'nearby' | 'remote' = 'home'
): Promise<{ success: boolean; totalPayout: number; totalGP: number; error?: string }> {
  try {
    if (items.length === 0) return { success: false, totalPayout: 0, totalGP: 0, error: 'No items in waste locker' };

    let totalPayout = 0;
    let totalGP = 0;
    let totalWeight = 0;

    const rows = items.map((item) => {
      totalPayout += item.payoutAmount;
      totalGP += item.gpReward;
      totalWeight += item.weightKg;

      return {
        user_id: userId,
        territory_id: PILOT_TERRITORY_ID,
        category: item.categoryName,
        photo_url: item.photoUri || null,
        ai_confidence: item.confidence || 90,
        weight_estimate: item.weightKg,
        payout_amount: item.payoutAmount,
        verification_tier: 1,
        status: 'completed',
      };
    });

    const { error: txError } = await supabase.from('waste_transactions').insert(rows);

    if (txError) {
      console.warn('Error inserting waste transactions:', txError.message);
      return { success: false, totalPayout: 0, totalGP: 0, error: txError.message };
    }

    await incrementHealthScore(PILOT_TERRITORY_ID, Math.min(10, Math.max(3, Math.round(totalWeight * 2))));

    await recordGreenPointsTransaction({
      user_id: userId,
      source: 'circular_payout',
      amount: totalGP,
      zone_tier: zoneTier,
    });

    return { success: true, totalPayout, totalGP };
  } catch (err: any) {
    console.error('Failed to submit waste transaction:', err);
    return { success: false, totalPayout: 0, totalGP: 0, error: err.message || 'Submission failed' };
  }
}

// =============================================
// Scientific Earth Healing Impact Engine
// Based on EPA WARM, DEFRA & IPCC Circular Economy Metrics
// =============================================

export interface CategoryImpactData {
  co2PerKg: number;    // kg CO2e emissions avoided per kg recycled
  waterPerKg: number;  // Litres of industrial water conserved per kg
  scientificFact: string;
}

export const CATEGORY_IMPACT_FACTORS: Record<string, CategoryImpactData> = {
  metal: {
    co2PerKg: 6.5,
    waterPerKg: 24,
    scientificFact: 'Recycling metals saves 95% of energy vs virgin smelting and prevents mining tailings from degrading waterways.',
  },
  plastic: {
    co2PerKg: 1.6,
    waterPerKg: 18,
    scientificFact: 'Diverting plastics saves crude petroleum monomer extraction and keeps microplastics out of soil and marine food chains.',
  },
  paper: {
    co2PerKg: 1.2,
    waterPerKg: 26,
    scientificFact: 'Recycling paper conserves standing forest biomass and reduces chemical pulping effluent and freshwater draw.',
  },
  ewaste: {
    co2PerKg: 3.2,
    waterPerKg: 15,
    scientificFact: 'Safe e-waste recovery halts toxic lead, mercury, and cadmium contamination in campus groundwater aquifers.',
  },
  glass: {
    co2PerKg: 0.4,
    waterPerKg: 8,
    scientificFact: 'Cullet glass melts at lower furnace temperatures, endlessly conserving natural silica riverbeds.',
  },
  textiles: {
    co2PerKg: 3.8,
    waterPerKg: 45,
    scientificFact: 'Textile recovery eliminates intense agricultural irrigation and chemical dye discharge into waterways.',
  },
  organic: {
    co2PerKg: 0.9,
    waterPerKg: 5,
    scientificFact: 'Composting organic matter stops anaerobic methane off-gassing in municipal landfills.',
  },
};

export interface EarthImpactEstimate {
  co2SavedKg: number;
  waterSavedLitres: number;
  landfillKgDiverted: number;
  highlightNumber: string;
  impactNarrative: string;
  healingAffirmation: string;
}

/**
 * Calculates scientifically correlated environmental healing impact for given items.
 */
export function calculateEarthImpact(items: { category: string; weightKg: number }[]): EarthImpactEstimate {
  let co2 = 0;
  let water = 0;
  let totalWeight = 0;

  for (const item of items) {
    const key = (item.category || '').toLowerCase().replace(/[^a-z]/g, '');
    const factor = CATEGORY_IMPACT_FACTORS[key] || {
      co2PerKg: 1.8,
      waterPerKg: 16,
      scientificFact: 'Diverting recyclables fuels clean circular production loops.',
    };
    co2 += item.weightKg * factor.co2PerKg;
    water += item.weightKg * factor.waterPerKg;
    totalWeight += item.weightKg;
  }

  const co2Val = Math.round(co2 * 100) / 100;
  const waterVal = Math.round(water * 10) / 10;
  const weightVal = Math.round(totalWeight * 100) / 100;

  let narrative = '';
  if (totalWeight === 0) {
    narrative = 'Add your scanned recyclables to calculate your direct carbon and resource abatement for the planet.';
  } else if (co2Val >= 4.0) {
    narrative = `Outstanding stewardship! Diverting ${weightVal} kg of materials has prevented ~${co2Val} kg of greenhouse gas emissions and saved ${waterVal}L of water.`;
  } else {
    narrative = `Your ${weightVal} kg of sorted recyclables prevents ~${co2Val} kg of greenhouse emissions and keeps virgin resources in the ground.`;
  }

  return {
    co2SavedKg: co2Val,
    waterSavedLitres: waterVal,
    landfillKgDiverted: weightVal,
    highlightNumber: `${co2Val > 0 ? co2Val.toFixed(1) : '0.0'} kg CO₂`,
    impactNarrative: narrative,
    healingAffirmation: 'Every kilogram you recycle actively cools the planet and helps restore ecological balance.',
  };
}

