# CHANGE-06-LANDING-PAGE.md — Landing / Intro Screen

## What changes

Currently: after login, users land directly on the Map screen.
After this change: **first-time users** see a landing/intro screen before login. Returning users skip it and go straight to the app (after the session check).

This screen is also the answer to the pitch question: *"Why should I care about this app?"*

---

## Navigation logic

```
App launches
     │
     ├─ No session → Landing Screen → Login/Signup
     │
     └─ Active session
           ├─ First-time user (no onboarding_completed flag) → Onboarding flow → Map
           └─ Returning user → Map directly (existing behavior)
```

Add `onboarding_completed: boolean` to the `users` table. Set it `true` after the user completes onboarding. The landing screen is shown only before any session exists.

```sql
ALTER TABLE users
  ADD COLUMN IF NOT EXISTS onboarding_completed BOOLEAN DEFAULT false;
```

---

## Landing screen structure

This is a **scrollable single screen** (or a 3-swipe horizontal pager — simpler to implement with a FlatList paginated view). Three beats, then a CTA:

### Beat 1 — The problem

**Visual:** full-bleed image or animated illustration of a degraded ecosystem (dusty urban area, overflowing waste, absent birds). This is the *before state* — not depressing, just honest.

**Headline:** `Your neighborhood is a living ecosystem.`

**Body:** `40% of India's bird species have declined in the last decade. Meanwhile, less than 20% of our waste is formally recycled. These two problems have the same root: we've stopped paying attention to what's around us.`

### Beat 2 — The insight (what makes EcoQuest different)

**Visual:** side-by-side — a bird on one half, a plastic bottle on the other, converging into a single green territory on a map.

**Headline:** `Biodiversity and waste are the same fight.`

**Body:** `EcoQuest connects them. Every species you log and every kg of waste you divert moves the same Health Score for your home territory. One app. One number. One community working on both.`

**The differentiation point (don't soften this):**
`Other apps separate nature from cleanup. We don't — because your home doesn't, either.`

### Beat 3 — The invitation

**Visual:** a map with green territory polygons and active user pins, animated (or static with dots).

**Headline:** `Your neighborhood needs you to see it.`

**Body:** `Scan species. Log waste. Earn GreenPoints. Join a Clean Raid. Every action you take inside your home territory multiplies — and goes on the map for everyone.`

### CTA screen

Two buttons, stacked:

```
[ Get Started ]    ← goes to signup
[ I already have an account ]  ← goes to login
```

Small text below: `Free forever. No ads.`

---

## Technical notes

- Use `react-native-reanimated` (already Expo Go-compatible) for any scroll-driven animations on the landing screen — fade-ins, parallax headers.
- If a pager/swipe layout is used, `react-native-pager-view` (Expo Go-compatible) or a simple manual FlatList with `pagingEnabled` is sufficient — no third-party carousel library needed.
- **Do not use a video background** — it increases bundle size and doesn't work reliably in Expo Go on all devices. Use static images or lightweight Lottie animations (`lottie-react-native` is Expo Go-compatible).
- Keep images light (<200KB each, WebP if possible). For the demo, placeholder images from `unsplash.com` are fine — the real illustrated art comes in the full UI overhaul.
- The landing screen must render **before** the Supabase auth check completes — don't gate it behind a `loading` spinner. Show the landing immediately; run the session check in parallel and redirect returning users as soon as the check resolves.

---

## Copy notes (for the UI overhaul later)

The copy written above is intentionally **direct and slightly provocative** — it doesn't say "We're a sustainability app!" softly. That directness is what makes it memorable in a 60-second pitch. Preserve the tone in the redesign even if the visual style changes. The key message: *biodiversity and waste are not two separate green initiatives — they're one thing.*

---

## Testing checklist

- [ ] Landing screen shows on a fresh install / signed-out state
- [ ] "Get Started" navigates to signup
- [ ] "I already have an account" navigates to login
- [ ] Returning user with active session skips the landing screen entirely
- [ ] Screen renders fully before Supabase auth check resolves
- [ ] No video/heavy assets — loads in under 2 seconds on a mid-range phone
