# Tech Stack — Expo Go Edition

The PRD's stack (Section 9.1) assumes a fully custom React Native build. You're using **Expo Go** to run on-device during development, which changes a few things below — flagged with ⚠️.

## 💰 Cost — everything below runs at $0
Every layer in this stack has a free tier that's enough for a hackathon build with one pilot territory and a handful of demo users. Nothing here requires a credit card on file, and nothing bills you if you stay under the limits noted below.

| Layer | Free tier | Card required? |
|---|---|---|
| Expo / Expo Go | Free, unlimited for development | No |
| React Navigation, AsyncStorage, expo-location/camera/image-picker | Open-source, free | No |
| Supabase | Free project tier (500MB DB, 1GB storage, 50k monthly active users) — plenty for a demo | No |
| Maps (`react-native-maps` in Expo Go) | Expo Go ships a **shared Google Maps API key for development/testing only** — Android maps render for free with zero setup. This key is not valid for a production/EAS build, but you don't need one for the hackathon | No |
| AI inference | Hugging Face Inference API free tier (see AI/ML section below) | No |
| Payments | Mocked — no real payment provider integrated | No |

If any stage of the roadmap starts pointing you toward a paid service or a "add billing details" screen, that's a signal to swap in a free alternative or mock it instead — flag it and we'll adjust.

## Mobile app
| Layer | Choice | Notes |
|---|---|---|
| Framework | **Expo (managed workflow) + React Native** | Stay in the Expo Go sandbox — don't add native modules that require a custom dev client unless you decide to eject later |
| Navigation | **React Navigation** (`@react-navigation/bottom-tabs` + `native-stack`) | Matches PRD's shared bottom nav: Map / Wild / Circular / Wallet / Profile |
| State management | **React Context + `useReducer`**, or **Zustand** if state gets complex | Keep it simple for hackathon speed — avoid Redux boilerplate |
| Local persistence | `@react-native-async-storage/async-storage` | Offline-first waste category picker (PRD 7.1) needs this |
| Maps | `react-native-maps` | Works inside Expo Go. Use for the Territory Map (fog-of-war can be simulated with overlay circles/polygons at MVP scale) |
| Location | `expo-location` | GPS check-in, territory boundary checks |
| Camera / image capture | `expo-camera` + `expo-image-picker` | For species photos and waste scans |
| Push notifications | `expo-notifications` | Optional for MVP — mission/quest nudges |

## ⚠️ AI / ML — the one place Expo Go forces a real decision
The PRD specifies **on-device TensorFlow Lite** for both species ID and waste-material ID (Sections 6.3, 7.1). **Expo Go cannot run TFLite or other custom native ML modules** — it only supports the JS/Expo SDK APIs, no custom native code, unless you eject to a dev client (which defeats the point of using Expo Go for fast iteration).

Two workable paths for the hackathon build, both $0:
1. **Cloud inference (recommended for MVP):** capture the photo with `expo-camera`, send it to a lightweight backend endpoint that calls a **free-tier hosted model** — e.g. the **Hugging Face Inference API** (generous free rate limits, no card required, no billing account) using an existing image-classification model for your chosen taxon. Get back a category + confidence score, display it. Slightly slower than on-device but fully Expo Go compatible and much faster to build.
2. **Mocked/staged inference for the demo:** for the pilot territory and single taxon, a small labeled lookup (or a pre-recorded response keyed to a few known demo photos) is enough to prove the loop live — genuinely $0, zero API calls. Be upfront in the pitch that Tier 2/3 cloud AI and full on-device inference are Phase 2 (already true per PRD Section 12.2 and the roadmap).

Either path is honest with the PRD's own scope line: "no live UPI payout in the demo build" already signals mocked pieces are expected — treat AI inference the same way if time is short. Avoid Google Cloud Vision or AWS Rekognition for this build — both require a billing account attached even on their free tiers.

## Backend
| Layer | Choice | Notes |
|---|---|---|
| Auth + DB + Realtime + Storage | **Supabase** | Matches PRD exactly — Postgres under the hood, gives you auth and storage for free, fastest path for a hackathon team |
| Geo data | **PostgreSQL + PostGIS** (via Supabase) | Territory polygon, Health Score per territory |
| Cache | Skip for MVP unless price-feed features are built | Redis (PRD) is for live MCX pricing — out of scope per Section 12.2 |
| Async AI queue | Skip for MVP | Only needed once you're running real Tier 2/3 cloud AI at scale — not needed for a single pilot territory demo |

## Payments
- PRD: direct UPI integration, 5-minute payout.
- **MVP: mocked.** Show a payout confirmation screen with a fake transaction — matches PRD Section 12.1 exactly ("manual or mocked pickup confirmation, no live UPI payout in the demo build").

## Dev tooling
- Expo CLI (`npx create-expo-app`)
- Expo Go app on a physical device for live testing (no simulator setup needed)
- EAS Build — only relevant if/when you outgrow Expo Go post-hackathon

## Compliance note (carry forward, don't build)
DPDP Act 2023-compliant storage and an append-only audit ledger are named in the PRD as production requirements — not hackathon build items. Worth one line in your pitch deck, not a checkbox in this MVP.

## Related docs
- [[00-OVERVIEW]]
- [[02-ROADMAP]]
