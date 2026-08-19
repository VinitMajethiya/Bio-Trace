# CHANGE-07-THEME.md — Biodiversity-Forward Design System

## What this is (and isn't)

This is **not the full UI overhaul** — that comes later. This document defines the **design token layer** (colors, typography, iconography, motion principles) that the full overhaul will build on, so when it happens there's no ambiguity about what EcoQuest looks, feels, and moves like.

The agent's job right now: implement the token system and apply it consistently to the **functional screens already built** — no layout redesign, just replace hardcoded colors, font sizes, and generic icons with themed tokens. This is the foundation pass.

---

## Core design principle

> **EcoQuest should feel like a field naturalist's tool that got gamified — not a green lifestyle app that got UI polish.**

The visual language should reference: field guides, topographic maps, biodiversity data visualisations, the organic irregularity of natural systems. It should NOT reference: generic eco-product pastel palettes, corporate sustainability dashboards, or typical mobile game UI tropes.

---

## Color system

Store all tokens in `constants/theme.ts`. Use these everywhere — no hardcoded hex strings anywhere else in the codebase.

```ts
// constants/theme.ts
export const colors = {
  // Base — inspired by forest floor + canopy light
  background: {
    primary: "#0F1A0F",      // Deep forest floor — used for main screen backgrounds
    surface: "#1A2B1A",      // Card/surface background — slightly lighter
    elevated: "#243524",     // Elevated surfaces (modals, bottom sheets)
  },

  // Primary greens — living/healthy
  green: {
    primary: "#4CAF72",      // Main CTA, active states, health score (good)
    light: "#A8D5B5",        // Secondary green, subtle highlights
    faint: "#2A3D2A",        // Green-tinted backgrounds, pressed states
  },

  // Amber — urgency, rare finds, warnings
  amber: {
    primary: "#E8A920",      // Rare species badge, warning states, low health score
    light: "#F5D780",        // Amber chip backgrounds
    faint: "#2E2510",        // Amber-tinted surface backgrounds
  },

  // Earth — grounding, organic, "Circular" module identity
  earth: {
    primary: "#8B6914",      // Waste/Circular module accent
    light: "#C4A45A",
    faint: "#231A08",
  },

  // Sky — air, open space, clean
  sky: {
    primary: "#3A8EC4",      // Map water, clean-air indicators, links
    light: "#89C4E8",
  },

  // Legendary — special finds, max achievement
  legendary: {
    primary: "#9B4DCA",      // Legendary rarity badge, top-tier rewards
    glow: "#C47DFF",
  },

  // Neutrals
  text: {
    primary: "#E8F0E8",      // Main readable text on dark backgrounds
    secondary: "#9AB09A",    // Subdued labels, captions
    muted: "#5A705A",        // Placeholder text, disabled states
  },
  border: "#2A3D2A",
  divider: "#1E2E1E",

  // Semantic
  error: "#E85454",
  success: "#4CAF72",        // same as green.primary intentionally
};
```

### Light mode

For the pitch demo, **dark mode only** — the deep forest palette reads dramatically on a phone screen in a dim conference room. Light mode can be added post-funding if needed.

---

## Module identity colors

Each module has a distinct accent that runs through its screens, icons, and score contributions:

| Module | Accent color | Used for |
|---|---|---|
| Wild (biodiversity) | `green.primary` (#4CAF72) | Species pins, Collection Book, Wild XP bar |
| Circular (waste) | `earth.primary` (#8B6914) | Waste locker, pickup flow, Circular score |
| Raids | `amber.primary` (#E8A920) | Raid markers on map, raid score badge |
| Shared Health Score | Gradient `green → amber` based on score | Dashboard score ring, territory polygon fill |

---

## Typography

Use `expo-font` with **Space Grotesk** (readable, slightly technical, not corporate):

```ts
export const typography = {
  // Headlines — large impact numbers and section titles
  headline: { fontFamily: "SpaceGrotesk-Bold", fontSize: 28, lineHeight: 34, color: colors.text.primary },
  title: { fontFamily: "SpaceGrotesk-SemiBold", fontSize: 20, lineHeight: 26, color: colors.text.primary },
  subtitle: { fontFamily: "SpaceGrotesk-Medium", fontSize: 16, lineHeight: 22, color: colors.text.secondary },

  // Body — explanatory text, card content
  body: { fontFamily: "SpaceGrotesk-Regular", fontSize: 15, lineHeight: 22, color: colors.text.primary },
  caption: { fontFamily: "SpaceGrotesk-Regular", fontSize: 12, lineHeight: 17, color: colors.text.secondary },

  // Data — scores, stats, numbers
  dataLarge: { fontFamily: "SpaceGrotesk-Bold", fontSize: 42, color: colors.green.primary },
  dataMedium: { fontFamily: "SpaceGrotesk-SemiBold", fontSize: 24, color: colors.text.primary },
};
```

Load fonts in `app.tsx` via `useFonts` from `expo-font`. Space Grotesk is available on Google Fonts, free, open license.

---

## Iconography

Use `@expo/vector-icons` (Expo Go-compatible, already included) with the **MaterialCommunityIcons** set — it has the best coverage for nature/eco themes.

Define a canonical icon map so icons are consistent:

```ts
// constants/icons.ts
export const icons = {
  // Wild module
  bird: "bird",
  wildlife: "paw",
  plant: "leaf",
  insect: "bug",
  sighting: "eye",
  
  // Circular module
  waste: "recycle",
  locker: "archive",
  pickup: "truck-delivery",
  
  // Gamification
  greenpoints: "star-circle",
  xp: "lightning-bolt",
  rarity_common: "circle-outline",
  rarity_amber: "fire",
  rarity_legendary: "diamond-stone",
  
  // Health Score
  health: "heart-pulse",
  territory: "map-marker-radius",
  
  // Navigation
  map: "map",
  collection: "book-open-variant",
  wallet: "wallet",
  profile: "account-circle",
  raid: "shield-star",
};
```

---

## Motion principles

Apply these using `react-native-reanimated` (Expo Go-compatible):

- **Score changes** animate — a Health Score change should count up/down over 800ms, not snap. Use a spring animation, not linear.
- **Point awards** use a brief upward float (+25 ✦) that fades out over 1.2s — similar to game score popups.
- **Map pins** for species sightings appear with a subtle bounce (scale from 0 → 1.1 → 1.0).
- **Rarity reveals** (when a scan confirms a Legendary species) deserve a moment: a radial glow pulse + the legendary color.
- **Tab bar** — the active tab icon has a soft ambient glow in its module color.

All other transitions: standard `react-navigation` defaults — don't over-animate navigation.

---

## Map visual style

The map (react-native-maps) should use a **dark/nature style**. Apply a custom map style JSON:

```ts
// constants/mapStyle.ts
// Use Google's "aubergine" or "night" base style as a starting point,
// then override road colors to be very muted (grey) so the green
// territory overlays and biodiversity pins are the main visual elements.
// Fetch a suitable style from: snazzymaps.com (search "dark nature" or "forest")
// Store the JSON array in this file and pass it to <MapView customMapStyle={...} />
```

Territory polygon fill: use `rgba` version of the health score color:
- Score 0–40: `rgba(232, 84, 84, 0.25)` (red, low health)
- Score 41–70: `rgba(232, 169, 32, 0.25)` (amber, moderate)
- Score 71–100: `rgba(76, 175, 114, 0.25)` (green, healthy)

---

## Application order for the agent

1. Create `constants/theme.ts` and `constants/icons.ts` with the full token sets above.
2. Install and load Space Grotesk via `expo-font`.
3. Do a pass over every screen, replacing:
   - Hardcoded hex strings → `colors.*` token references
   - Hardcoded font sizes → `typography.*` references
   - Ad-hoc icon strings → `icons.*` references
4. Apply the map custom style JSON.
5. Add the three motion behaviors (score count-up, point float, rarity reveal) — these are the highest-impact moments for the pitch.
6. Do NOT redesign any screen layout — that is the UI overhaul's job.

---

## Testing checklist

- [ ] All hex strings in screen files replaced with token references (grep for `#[0-9A-Fa-f]{3,6}` outside theme.ts — result should be near zero)
- [ ] Space Grotesk loads correctly on a real device in Expo Go
- [ ] Wild module screens use green accent, Circular screens use earth accent
- [ ] Map uses dark custom style with health-score-colored territory polygon
- [ ] Score count-up animation works on the dashboard
- [ ] Point float (+N ✦) shows on GreenPoints award
