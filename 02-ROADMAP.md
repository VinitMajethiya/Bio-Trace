# EcoQuest — Build Roadmap

This is the file to work from day to day. Seven main stages, each broken into sub-stages. Work top to bottom — each stage assumes the previous one is done. Check items off as you go.

Scope guardrail: everything here builds toward the MVP defined in [[00-OVERVIEW]] → "Hackathon MVP scope." If a task isn't needed for the demo narrative (one bird photo + one bottle photo moving one score on one map), it can wait.

---

## Stage 1 — Foundation & Setup
Goal: an empty-but-running Expo Go app with auth and a database schema, nothing else.

- [ ] **1.1 Project scaffolding** — `npx create-expo-app`, folder structure (`/app` or `/src`, `/components`, `/lib`), install React Navigation, connect to Expo Go on device
- [ ] **1.2 Navigation skeleton** — bottom tab bar with 5 tabs: Map, Wild, Circular, Wallet, Profile (empty screens for now)
- [ ] **1.3 Supabase project setup** — create project, enable PostGIS extension, set up Auth (email or magic link is fastest for a demo)
- [ ] **1.4 Base schema in Supabase** — create tables per [[03-DATA-MODEL]]: `users`, `territories`, `species_observations`, `waste_transactions`, `missions`, `greenpoints_ledger`
- [ ] **1.5 Wire auth into the app** — one shared login screen, session persisted, redirects into the tab nav on success

---

## Stage 2 — Shared Infrastructure
Goal: the plumbing both modules will plug into — map, Health Score, Trust tiers, ledger.

- [ ] **2.1 Territory Map (base)** — `react-native-maps` rendering, centered on your one pilot territory, static boundary drawn as a polygon overlay
- [ ] **2.2 Ecosystem Health Score — data model + display** — a single number per territory, stored in `territories` table, shown on the Map screen
- [ ] **2.3 Health Score update function** — a Supabase function/trigger (or client-side call) that bumps the score when a verified event lands (wired up properly in Stage 5)
- [ ] **2.4 Trust Engine — Tier 0 only** — capture GPS + timestamp on every submission (species or waste); Tier 1 (on-device pre-check) can be a stub that auto-approves for MVP
- [ ] **2.5 GreenPoints ledger table + read/write functions** — single ledger, entries taggable by source (`wild_xp` / `circular_payout`)

---

## Stage 3 — Wild Module
Goal: a player can check in, log a species, see it in a collection book, and complete a mission.

- [ ] **3.1 GPS check-in flow** — confirm player is inside the pilot territory boundary before allowing a sighting
- [ ] **3.2 Species capture screen** — camera capture via `expo-camera`, submit for identification (see [[01-TECH-STACK]] AI section for cloud vs. mocked inference)
- [ ] **3.3 Single-taxon AI ID integration** — pick one taxon (birds or plants), wire up the chosen inference path, return category + confidence
- [ ] **3.4 Collection Book UI** — list/grid of confirmed sightings, rarity tier badge (Common/Amber/Legendary — can hardcode a small lookup table for the pilot taxon)
- [ ] **3.5 Mission log (basic)** — one daily quest (fixed template) + one weekly zone mission, both visible with completion state
- [ ] **3.6 Wire sightings into Health Score + GreenPoints** — confirmed sighting → ledger entry + Health Score bump (via Stage 2.3 function)

---

## Stage 4 — Circular Module
Goal: a player can log waste, see it accumulate in a locker, and get a mocked pickup/payout.

- [ ] **4.1 Waste category picker** — icon-first, offline-capable, Hindi + English labels, no camera required (Paper/Plastic/Metal/Glass/E-Waste/Textiles/Organic)
- [ ] **4.2 AI Waste Scanner (enhancement layer)** — camera capture, wired to the same inference path as 3.3, returns category suggestion + confidence + mocked price
- [ ] **4.3 Waste Locker screen** — running list of logged items, estimated total value, no-expiry accumulation
- [ ] **4.4 Pickup confirmation flow (mocked)** — "schedule pickup" button → confirmation screen with a fake payout amount, no live UPI
- [ ] **4.5 Wire waste transactions into Health Score + GreenPoints** — confirmed transaction → ledger entry + Health Score bump

---

## Stage 5 — The Bridge (this is the demo's entire point)
Goal: prove, live, that both modules move the same score on the same map.

- [ ] **5.1 Shared Health Score wiring end-to-end** — verify a species log AND a waste log both visibly move the same territory's Health Score number in real time
- [ ] **5.2 One map, two toggleable layers** — Wild pins (sightings, restoration zones) and Circular pins (locker, drop-off points) as switchable overlays on the same map
- [ ] **5.3 GreenPoints ↔ Wild XP conversion** — fixed conversion rate implemented, shown somewhere in the Wallet screen
- [ ] **5.4 (Stretch) Cross-module legendary mission** — a mission that only completes once both a restoration action and a waste pickup have happened in the same territory/window — nice-to-have, cut first if time is short

---

## Stage 6 — Gamification & Rewards
Goal: make progress visible and satisfying.

- [ ] **6.1 Unified player level/XP bar** — combines Wild XP and GreenPoints into one progression indicator
- [ ] **6.2 Leaderboard (single clan or individual, whichever is simpler for the pilot)** — blends species + kg-diverted metrics
- [ ] **6.3 Rewards catalogue (mock)** — a simple screen listing redeemable rewards, no real redemption logic needed for demo

---

## Stage 7 — Polish & Demo Prep
Goal: it runs smoothly on a phone in front of judges.

- [ ] **7.1 Onboarding flow** — first-launch walkthrough into the shared login (Section 4 of PRD: "one account, one onboarding flow")
- [ ] **7.2 Visual consistency pass** — spacing, colors, icons consistent across both modules so it reads as one app, not two bolted together
- [ ] **7.3 Seed pilot territory with demo data** — pre-load a few sightings/waste logs so the map isn't empty when judges look at it
- [ ] **7.4 Full run-through on a physical device via Expo Go** — fix crashes, slow loads, broken nav before demo day
- [ ] **7.5 Rehearse the demo narrative** — practice the exact "one bird photo, one bottle photo, same score, same map" moment from [[00-OVERVIEW]]

---

## Related docs
- [[00-OVERVIEW]] — what you're building and why
- [[01-TECH-STACK]] — stack detail, especially the Expo Go AI workaround
- [[03-DATA-MODEL]] — table-by-table schema for Stage 1.4
- [[04-FEATURES-SCOPE]] — full in/out/stretch feature list if you need to make a cut call mid-build
