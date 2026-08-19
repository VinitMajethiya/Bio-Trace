# Feature Scope — Demo vs. Stretch vs. Cut

Use this when you're mid-build and need to decide fast whether something is worth your remaining time. Pulled directly from PRD Section 12, expanded with a stretch tier.

## 🟢 In scope — build this, it's the demo
- One pilot territory
- Wild: GPS check-in, single-taxon AI ID, Tier 0/1 verification, basic mission log
- Circular: category picker + scanner, Waste Locker, mocked pickup confirmation
- Shared Ecosystem Health Score moving from either module, live, on one map
- One shared login, one map, one leaderboard

## 🟡 Stretch — only if the 🟢 list is done early
- Cross-module legendary mission (Stage 5.4)
- Clan system beyond a single hardcoded clan
- Rewards catalogue with real (not mocked) redemption
- Second taxon for Wild species ID
- Fog-of-war visual effect on the map (vs. a simple static boundary)

## 🔴 Out of scope — do not build for the hackathon
Per PRD Section 12.2, explicitly roadmap-only:
- Live MCX price feed
- Full cloud AI Tier 2/3 verification
- Institutional dashboards (Municipal/CSR ESG Suite)
- Real collector network + live UPI payouts
- Automated EBWGR documentation
- Best-Out-of-Waste creative engine
- Multi-territory support
- Collector companion app (separate Android app for pickup agents)

## Decision rule
If a feature doesn't make the "one bird photo, one bottle photo, same score, same map" moment more convincing, it's not worth building before that moment is rock-solid. Build 🟢 completely before touching 🟡.

# Feature Scope — Demo vs. Stretch vs. Cut

Use this when you're mid-build and need to decide fast whether something is worth your remaining time. Original MVP scope pulled from PRD Section 12; expanded scope reflects the full BioVerse vision (hard requirement, per project owner, given more than a week of runway).

## 🟢 In scope — the full committed build
**Original MVP (built and verified, Stages 1-6):**
- Wild: GPS check-in, bird AI ID, Tier 0/1 verification, mission log
- Circular: category picker + scanner, Waste Locker, mocked pickup confirmation
- Shared Ecosystem Health Score moving from either module, live, on one map
- Shared login, map, leaderboard, level/XP, rewards catalogue

**Expanded scope (Stages 7-12, hard requirements):**
- Multi-society model + society-elected moderators (plain vote count, not ranked-choice)
- Clean Raids: creation, join, before/after photo verification, moderator approval, group point payouts
- Multi-society Health Score Dashboard with rule-based improvement insights
- DIY upcycling suggestions (static lookup + YouTube deep-links)
- NGO/government data-sharing view (admin table + CSV export, local only)
- Camera-only scoring + EXIF secondary signal (the honest version of screen-recapture prevention)
- Waste model accuracy audit, specifically for glass/plastic/transparent-material confusion

## 🟡 Stretch — only if the 🟢 list is done early
- Cross-module legendary mission (Stage 5.4)
- Clan system beyond a single hardcoded clan
- Rewards catalogue with real (not mocked) redemption
- Second taxon for Wild species ID
- Fog-of-war visual effect on the map
- YouTube Data API embedded video results (vs. deep-link out) for DIY suggestions
- Ranked-choice moderator elections

## 🔴 Out of scope — do not build regardless of time remaining
- Live MCX price feed
- Full cloud AI Tier 2/3 verification
- Real collector network + live UPI payouts
- Automated EBWGR documentation
- Best-Out-of-Waste creative engine
- Real outbound NGO/government data pipeline (Stage 12 is local export only)
- Collector companion app (separate app for pickup agents)
- A genuine, reliable screen-recapture/deepfake photo detector — not achievable for free; Stage 11's camera-only-scoring approach is the honest substitute, not a placeholder for a "real" version later

## Decision rule
Within the committed 🟢 scope, prioritize by dependency order in [[02-ROADMAP]] (Stage 7's society infrastructure unlocks both Stage 8 and Stage 10, so it comes first). If time runs genuinely short despite the full scope being a hard requirement, flag it explicitly rather than silently cutting — Clean Raids (Stage 10) was named as the single hardest requirement, so if a cut becomes truly unavoidable, look to 🟡 stretch items or Stage 12's scope (data sharing is the most self-contained, lowest-narrative-risk item to trim) before touching Stage 10.

## Related docs
- [[00-OVERVIEW]]
- [[02-ROADMAP]]