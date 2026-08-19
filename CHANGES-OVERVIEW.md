# CHANGES-OVERVIEW.md — EcoQuest Update Batch

This document summarises all 7 changes to be made to the existing EcoQuest build. Each change has its own detailed file. Work through them in the order listed — earlier changes have dependencies later ones assume.

## Recommended build order

| Order | Change | File | Why this order |
|---|---|---|---|
| 1 | Flexible zone scoring (replace hard gate) | `CHANGE-01-ZONE-SCORING.md` | Touches the core scanning flow — fix before adding new scan types |
| 2 | Multi-taxon scanning (animals, plants, insects) | `CHANGE-02-MULTI-TAXON.md` | Depends on the scanning flow being gate-free first |
| 3 | AI scanning fix (replace Hugging Face) | `CHANGE-03-AI-FIX.md` | Fix the inference layer before widening it to more taxa |
| 4 | Delivery client integration prep | `CHANGE-04-DELIVERY-CLIENT.md` | Schema + API surface changes — do before any UI work so screens read from the right tables |
| 5 | Dashboard upgrade | `CHANGE-05-DASHBOARD.md` | Needs correct data model in place (point 4 changes pickup data) |
| 6 | Landing page | `CHANGE-06-LANDING-PAGE.md` | Pure new screen, no dependencies on 1–5 |
| 7 | Biodiversity theme | `CHANGE-07-THEME.md` | Done last — it's a visual pass across everything built in 1–6 |

> **Note on UI overhaul:** The user has stated that after all 7 changes are implemented there will be a full UI overhaul. This means changes 1–4 should invest zero effort in visual polish — wire up the logic correctly, use placeholder/existing components. Changes 5 and 6 get *functional* UI only. Change 7 lays the groundwork (tokens, colors, motion system) so the full overhaul has a consistent foundation to build on top of.

## Files in this set

- `CHANGES-OVERVIEW.md` — this file
- `CHANGE-01-ZONE-SCORING.md` — remove hard gate, add zone multiplier
- `CHANGE-02-MULTI-TAXON.md` — expand scanning to animals, plants, insects
- `CHANGE-03-AI-FIX.md` — replace Hugging Face with working free alternatives
- `CHANGE-04-DELIVERY-CLIENT.md` — schema + API for collector app integration
- `CHANGE-05-DASHBOARD.md` — richer health score dashboard
- `CHANGE-06-LANDING-PAGE.md` — pre-login landing/intro screen
- `CHANGE-07-THEME.md` — biodiversity-forward design system
