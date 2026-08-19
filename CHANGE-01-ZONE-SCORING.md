# CHANGE-01-ZONE-SCORING.md — Flexible Zone Scoring (Remove Hard Gate)

## What changes

Currently: the app **blocks** a scan if the user is outside the pilot territory boundary.
After this change: **scans are allowed everywhere.** Being inside the pilot zone earns a bonus multiplier; being outside earns base points. No hard gate.

## Why

A hard gate creates friction that kills early adoption and discourages exploration. The biodiversity discovery loop should be available to anyone anywhere — the zone multiplier is the incentive to contribute to the home territory, not a lock-out.

## Exact scoring logic

| User location | Points multiplier | Label shown in UI |
|---|---|---|
| Inside pilot territory | 2× base points | "🏡 Home Zone — 2× points!" |
| Within 5 km of territory boundary | 1.25× base points | "📍 Nearby Zone — bonus active" |
| Anywhere else | 1× base points (standard) | *(no label needed)* |

Base points per action remain unchanged from the existing schema. Only the multiplier is new.

## Files to change

### `lib/territory.ts` (or wherever GPS check lives)

Replace the current "is user inside boundary → block if false" logic with a function that returns a **multiplier** instead of a boolean:

```ts
// BEFORE (remove this pattern entirely)
if (!isInsidePilotZone(userCoords)) {
  throw new Error("You must be inside the pilot zone to scan.");
}

// AFTER
export function getZoneMultiplier(userCoords: LatLng, territory: Territory): ZoneResult {
  const inside = isInsidePolygon(userCoords, territory.boundary);
  if (inside) return { multiplier: 2.0, label: "Home Zone", tier: "home" };

  const distanceKm = distanceToBoundary(userCoords, territory.boundary);
  if (distanceKm <= 5) return { multiplier: 1.25, label: "Nearby Zone", tier: "nearby" };

  return { multiplier: 1.0, label: null, tier: "remote" };
}
```

### `screens/ScanScreen.tsx` (species) and `screens/WasteScanner.tsx`

- Call `getZoneMultiplier()` when the scan flow starts (not as a gate — just to capture the multiplier for point calculation).
- If `label` is non-null, show a small banner at the top of the scan screen with the zone label.
- Pass `multiplier` into the point-award call.

### Point award function (wherever `greenpoints_ledger` is written)

```ts
const finalPoints = Math.round(basePoints * zoneMultiplier);
await supabase.from("greenpoints_ledger").insert({
  user_id,
  action: "species_observation", // or "waste_transaction"
  points: finalPoints,
  zone_tier: zoneTier, // "home" | "nearby" | "remote"
  created_at: new Date(),
});
```

Add `zone_tier` column to `greenpoints_ledger` if it doesn't already exist (useful for analytics later).

### `03-DATA-MODEL` — migrations needed

```sql
ALTER TABLE greenpoints_ledger
  ADD COLUMN IF NOT EXISTS zone_tier TEXT DEFAULT 'remote';
```

## What NOT to change

- The territory boundary polygon still exists and still matters — it's now used to *calculate* the multiplier, not to *gate* the scan.
- The GPS check-in step (Stage 3.1 in the roadmap) can be simplified: instead of "confirm player is inside boundary before allowing sighting," change it to "capture GPS coordinates and compute zone multiplier." The check-in step becomes informational, not a blocker.

## Testing checklist

- [ ] Scan while GPS is mocked inside the pilot territory → 2× points awarded, "Home Zone" banner shown
- [ ] Scan while GPS is mocked 3 km outside boundary → 1.25× points, "Nearby Zone" banner
- [ ] Scan while GPS is mocked far away → 1× points, no banner
- [ ] `zone_tier` column is correctly written to `greenpoints_ledger` in all three cases
- [ ] No screen shows "you must be inside the pilot zone" error copy anywhere
