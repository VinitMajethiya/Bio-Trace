# CHANGE-02-MULTI-TAXON.md — Expand Scanning to Animals, Plants & Insects

## What changes

Currently: species scanning is **birds only** (single taxon).
After this change: the app can identify **birds, other animals (mammals, reptiles, amphibians), plants, and insects/arthropods** — four scan modes with different UI entry points.

## Taxon structure

| Taxon group | iNaturalist iconic taxon name | Display name in app | Icon |
|---|---|---|---|
| Birds | `Aves` | Birds | 🐦 |
| Animals (non-bird) | `Animalia` (excluding Aves, Insecta) | Wildlife | 🦎 |
| Plants | `Plantae` | Plants | 🌿 |
| Insects & bugs | `Insecta` | Insects | 🦋 |

## AI inference — use iNaturalist Vision API (see also CHANGE-03-AI-FIX.md)

iNaturalist provides a **free, no-key-required** computer vision endpoint that covers all four taxon groups:

```
POST https://api.inaturalist.org/v1/computervision/score_image
Content-Type: multipart/form-data

Fields:
  image: <photo file>
  lat: <user latitude>
  lng: <user longitude>
  locale: en
```

The response returns ranked species suggestions with common names, scientific names, taxon group (`iconic_taxon_name`), and a confidence score. No API key. No billing. The lat/lng field improves accuracy by filtering to regionally plausible species — include it always.

Filter the response to the relevant taxon group based on which scan mode the user chose. This also prevents "I scanned a plant but iNat is suggesting animals" confusion.

## UI changes — Taxon Picker screen

Add a **Taxon Picker screen** before the camera, so the user selects what they're about to scan. This replaces the current "go straight to camera" flow:

```
Wild Tab
  └─ Taxon Picker screen (NEW)
       ├─ 🐦 Birds
       ├─ 🦎 Wildlife
       ├─ 🌿 Plants
       └─ 🦋 Insects
  └─ Camera / Scan screen (existing)
  └─ Results + Confirm screen (existing)
```

The taxon choice is passed as a prop/param into the scan screen and used to:
1. Set the iNaturalist `iconic_taxon_name` filter in the API call.
2. Set appropriate on-screen guidance copy ("Point at a plant's leaves and flowers for best results").
3. Set the rarity tier lookup table used in Stage 3.4 (each taxon has its own lookup).

## Rarity tier lookup per taxon

Each taxon needs its own small lookup table (hardcoded in `constants/rarityTiers.ts` is fine for the demo). Example structure:

```ts
export const RARITY_TIERS: Record<TaxonGroup, RarityRule[]> = {
  birds: [
    { keyword: "sparrow", tier: "common" },
    { keyword: "kingfisher", tier: "amber" },
    { keyword: "hornbill", tier: "legendary" },
    // etc.
  ],
  plants: [
    { keyword: "grass", tier: "common" },
    { keyword: "orchid", tier: "amber" },
    { keyword: "cycad", tier: "legendary" },
  ],
  wildlife: [ /* ... */ ],
  insects: [ /* ... */ ],
};
```

If no keyword matches the top iNaturalist suggestion, default to `"common"`. Expand this list with real data later — for the demo, 5–10 entries per taxon is enough.

## Schema changes

### `species_observations` table

```sql
ALTER TABLE species_observations
  ADD COLUMN IF NOT EXISTS taxon_group TEXT DEFAULT 'birds';
  -- values: 'birds' | 'wildlife' | 'plants' | 'insects'
```

This also enables taxon-filtered stats on the dashboard (e.g., "You've found 3 insects and 7 plants this month").

## Collection Book UI changes (Stage 3.4)

The Collection Book should group sightings by taxon. Add a filter/tab bar at the top:
`All | 🐦 Birds | 🦎 Wildlife | 🌿 Plants | 🦋 Insects`

No functional change to how items are stored — just filter `species_observations` by `taxon_group` when a tab is selected.

## Testing checklist

- [ ] Taxon Picker screen shows 4 options, each navigates to the camera
- [ ] iNaturalist API call includes `lat/lng` and returns results
- [ ] Results are filtered to the chosen taxon group (no cross-taxon suggestions shown)
- [ ] `taxon_group` field correctly written to `species_observations`
- [ ] Collection Book tabs filter correctly
- [ ] Zone multiplier (from CHANGE-01) still works for all taxon types
