# EcoQuest — Project Overview

> Source of truth: this file is a **build-focused condensation** of `EcoQuest_Combined_PRD.docx`. Full business/market detail lives in the PRD — this doc only carries what you need to build.

## One-line pitch
Biodiversity is the scoreboard. Spotting a kingfisher and recycling a circuit board move the *same* score, on the *same* map, in the *same* app.

## The two modules (one app, shared account)
| Module | What it does |
|---|---|
| **Wild** | GPS species discovery, AI identification, restoration missions, clan territory stewardship |
| **Circular** | AI waste scanner, "Waste Locker", doorstep pickup + cash payout, EBWGR compliance (institutional) |

Both feed one **Ecosystem Health Score** and share one **Trust Engine** (fraud/verification), one **map**, one **currency** (GreenPoints/XP), one **account**.

## Hackathon demo narrative (the whole point)
> One photo of a bird and one photo of a plastic bottle move the exact same score on the exact same map.

That single moment *is* the proof of the merger — not a long feature list. Every build decision should protect this demo moment first.

## Hackathon MVP scope (what you're actually building)
**In scope:**
- One pilot territory (e.g. campus / one neighbourhood block)
- **Wild:** GPS check-in, single-taxon AI ID (e.g. birds OR plants only), Tier 0/Tier 1 verification, basic mission log
- **Circular:** waste category picker + on-device-style scanner, Waste Locker, manual/mocked pickup confirmation (no live UPI)
- **The Bridge:** shared Ecosystem Health Score visibly moves from either module, shown live on one shared map
- One shared login, one map, one leaderboard

**Explicitly out of scope (roadmap only — do not build these for the demo):**
- Live MCX price feed
- Full cloud AI Tier 2/3 verification
- Institutional dashboards
- Real collector network + live UPI payouts
- Automated EBWGR documentation
- Best-Out-of-Waste creative engine

## Core personas to design for (MVP)
- **The Explorer** — Wild primary user, wants XP/badges/leaderboard bragging rights
- **The Household Recycler** — Circular primary user, wants convenience + fair cash value
- **The Clan Leader** — cross-module, runs joint events, cares about shared Health Score

(Collector Agent, Municipal/CSR Partner, Bulk Waste Generator personas are B2B/roadmap — not needed for the hackathon build.)

## Core data model (build against this from day one)
- **User/Profile** — single identity shared across modules
- **Clan** — group membership, shared territory claims
- **Territory** — polygon (or simplified pilot-zone shape) + rolling Health Score
- **Species Observation** — photo, AI confidence, rarity tier, verification tier
- **Waste Transaction** — category, AI confidence, weight, price, payout, verification tier
- **Mission** — type, source (fixed template vs. generated), completion criteria
- **Trust Score** — single per-user score, consumed by both modules
- **GreenPoints Ledger** — unified transaction log across Wild XP and Circular payouts

## Related docs
- [[01-TECH-STACK]] — stack choices, adapted for Expo Go
- [[02-ROADMAP]] — the stage-by-stage build plan (main file to work from)
- [[03-DATA-MODEL]] — schema detail for the entities above
- [[04-FEATURES-SCOPE]] — feature-by-feature demo vs. stretch vs. cut list

# EcoQuest (BioVerse) — Project Overview

> Source of truth: this file is a **build-focused condensation**, expanded beyond the original hackathon-MVP PRD to cover the full BioVerse vision as described by the project owner. Full original business/market detail lives in `EcoQuest_Combined_PRD.docx` — this doc carries what you need to build, including features added after the initial MVP.

## One-line pitch
Biodiversity is the scoreboard. Spotting a kingfisher and recycling a circuit board move the *same* score, on the *same* map, in the *same* app — and now, entire communities ("societies") organize group cleanups led by elected moderators to move that score together.

## The modules (one app, shared account)
| Module | What it does |
|---|---|
| **Wild** | GPS species discovery, AI identification, verified data feeding into an NGO/government sharing view |
| **Circular** | AI waste scanner, "Waste Locker", doorstep pickup (mocked), DIY upcycling suggestions when material is insufficient |
| **Clean Raids** (gamification layer) | Pokemon-Go-style group cleanup events, society-elected moderators, before/after photo verification, group point payouts |
| **Health Score Dashboard** | Multi-society interactive dashboard — compare societies, see contribution breakdowns, get improvement insights |

All feed one **Ecosystem Health Score per society**, one **Trust Engine** (fraud/verification), one shared **map**, one **currency** (GreenPoints/XP), one **account**.

## Hackathon demo narrative (still the core moment, now with a second centerpiece)
> One photo of a bird and one photo of a plastic bottle move the exact same score on the exact same map.

Original core proof, still the opening beat. The expanded centerpiece on top of it:
> A society's moderator verifies a group cleanup raid live, and every participant's points and the society's Health Score update together.

## Scope status (updated)
The original 6-stage MVP (Wild, Circular, The Bridge, Gamification) is **built and verified on-device** — see [[02-ROADMAP]] Stages 1-6. The project has since expanded to the full vision below, tracked as Stages 7-12 in the roadmap, with final polish moved to Stage 13.

**Newly in scope (Stages 7-12):**
- Multi-society model (communities, not just one pilot territory)
- Society-elected moderators (simple vote-count election, not ranked-choice)
- Clean Raids: creation, join, before/after photo verification, moderator approval, group payouts
- Multi-society Health Score Dashboard with rule-based improvement insights
- DIY upcycling suggestions (static lookup + YouTube deep-links, no API key needed)
- NGO/government data-sharing view (admin table + CSV export — not a real outbound integration)
- Scan verification hardening: camera-only scoring (the honest, achievable answer to "detect a photo of a screen"), EXIF as a secondary signal, and a waste-model accuracy audit specifically for glass/plastic/transparent-material confusion

**Still explicitly out of scope (unchanged):**
- Live MCX price feed, real UPI payouts, real collector network, automated EBWGR documentation, live NGO/government data pipelines, institutional dashboards beyond the simple admin view above

## Core personas to design for
- **The Explorer** — Wild primary user
- **The Household Recycler** — Circular + DIY primary user
- **The Clan Leader / Moderator** — elected per-society, runs Clean Raids, verifies group contributions
- **The Society Member** — participates in raids, sees their society's Health Score improve

## Core data model (expanded — see [[03-DATA-MODEL]] for full schema)
Original entities (User, Territory, Species Observation, Waste Transaction, Mission, Trust Score, GreenPoints Ledger) plus new ones: **Society**, **Moderator Vote**, **Raid**, **Raid Participant**.

## Related docs
- [[01-TECH-STACK]] — stack choices, adapted for Expo Go, with every gotcha hit so far documented
- [[02-ROADMAP]] — the stage-by-stage build plan (main file to work from)
- [[03-DATA-MODEL]] — schema detail for the entities above
- [[04-FEATURES-SCOPE]] — feature-by-feature demo vs. stretch vs. cut list