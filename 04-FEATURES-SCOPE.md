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

## Related docs
- [[00-OVERVIEW]]
- [[02-ROADMAP]]
