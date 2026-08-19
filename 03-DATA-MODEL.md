# Data Model — MVP Schema

Simplified for the hackathon pilot: one territory, single-taxon Wild, mocked payouts. Full production model (multi-territory, full Trust tiers, institutional reports) is roadmap — noted where relevant.

## `users`
| Field | Type | Notes |
|---|---|---|
| id | uuid (PK) | Supabase auth user id |
| display_name | text | |
| clan_id | uuid (FK → clans, nullable) | MVP: optional, can skip clans entirely if time is short |
| trust_score | numeric | starts at a default baseline, single score used by both modules |
| created_at | timestamp | |

## `territories`
| Field | Type | Notes |
|---|---|---|
| id | uuid (PK) | |
| name | text | e.g. "Campus Pilot Zone" |
| boundary | geography(polygon) | PostGIS — can be a simplified rectangle for MVP |
| health_score | numeric | the single shared score — this is the number the demo hinges on |
| updated_at | timestamp | |

## `species_observations`
| Field | Type | Notes |
|---|---|---|
| id | uuid (PK) | |
| user_id | uuid (FK) | |
| territory_id | uuid (FK) | |
| photo_url | text | Supabase storage path |
| species_label | text | from AI ID (or mocked lookup) |
| confidence | numeric | |
| rarity_tier | text | Common / Amber / Legendary — hardcoded lookup table is fine for one taxon |
| verification_tier | int | 0 or 1 for MVP |
| gps_lat / gps_lng | numeric | Tier 0 verification input |
| created_at | timestamp | |

## `waste_transactions`
| Field | Type | Notes |
|---|---|---|
| id | uuid (PK) | |
| user_id | uuid (FK) | |
| territory_id | uuid (FK) | |
| category | text | Paper/Plastic/Metal/Glass/E-Waste/Textiles/Organic |
| photo_url | text | nullable — category picker doesn't require a photo |
| ai_confidence | numeric | nullable if manually picked |
| weight_estimate | numeric | mocked/estimated for MVP |
| payout_amount | numeric | mocked value |
| verification_tier | int | |
| status | text | logged / locker / pickup_scheduled / paid_mock |
| created_at | timestamp | |

## `missions`
| Field | Type | Notes |
|---|---|---|
| id | uuid (PK) | |
| type | text | daily / weekly / legendary |
| source | text | fixed_template / generated |
| completion_criteria | jsonb | keep it simple: `{ "type": "species_log", "count": 1 }` style objects |
| territory_id | uuid (FK, nullable) | |

## `mission_progress`
| Field | Type | Notes |
|---|---|---|
| id | uuid (PK) | |
| user_id | uuid (FK) | |
| mission_id | uuid (FK) | |
| status | text | in_progress / complete | 
| completed_at | timestamp | nullable |

## `greenpoints_ledger`
| Field | Type | Notes |
|---|---|---|
| id | uuid (PK) | |
| user_id | uuid (FK) | |
| source | text | wild_xp / circular_payout |
| amount | numeric | |
| related_observation_id | uuid (FK, nullable) | |
| related_transaction_id | uuid (FK, nullable) | |
| created_at | timestamp | |

## `clans` (optional for MVP — cut first if time is short)
| Field | Type | Notes |
|---|---|---|
| id | uuid (PK) | |
| name | text | |
| territory_id | uuid (FK, nullable) | |

## Deliberately deferred (roadmap, not MVP)
- Full Trust Engine Tier 2/3 tables (cloud AI review queue, human review queue)
- Institutional report tables (GBIF export, EBWGR documentation)
- Real UPI transaction records
- Multi-territory support beyond the single pilot zone

# Data Model — MVP Schema

Simplified for the hackathon pilot: one territory, single-taxon Wild, mocked payouts. Full production model (multi-territory, full Trust tiers, institutional reports) is roadmap — noted where relevant.

## `users`
| Field | Type | Notes |
|---|---|---|
| id | uuid (PK) | Supabase auth user id |
| display_name | text | |
| clan_id | uuid (FK → clans, nullable) | MVP: optional, can skip clans entirely if time is short |
| society_id | uuid (FK → societies, nullable) | Stage 7 — which community/society this user belongs to |
| moderator_of_society_id | uuid (FK → societies, nullable) | Stage 7 — set only if this user won their society's moderator election |
| trust_score | numeric | starts at a default baseline, single score used by both modules |
| created_at | timestamp | |

## `territories`
| Field | Type | Notes |
|---|---|---|
| id | uuid (PK) | |
| name | text | e.g. "Campus Pilot Zone" |
| boundary | geography(polygon) | PostGIS — can be a simplified rectangle for MVP |
| health_score | numeric | the single shared score — this is the number the demo hinges on |
| updated_at | timestamp | |

## `species_observations`
| Field | Type | Notes |
|---|---|---|
| id | uuid (PK) | |
| user_id | uuid (FK) | |
| territory_id | uuid (FK) | |
| photo_url | text | Supabase storage path |
| species_label | text | from AI ID (or mocked lookup) |
| confidence | numeric | |
| rarity_tier | text | Common / Amber / Legendary — hardcoded lookup table is fine for one taxon |
| verification_tier | int | 0 or 1 for MVP |
| gps_lat / gps_lng | numeric | Tier 0 verification input |
| created_at | timestamp | |

## `waste_transactions`
| Field | Type | Notes |
|---|---|---|
| id | uuid (PK) | |
| user_id | uuid (FK) | |
| territory_id | uuid (FK) | |
| category | text | Paper/Plastic/Metal/Glass/E-Waste/Textiles/Organic |
| photo_url | text | nullable — category picker doesn't require a photo |
| ai_confidence | numeric | nullable if manually picked |
| weight_estimate | numeric | mocked/estimated for MVP |
| payout_amount | numeric | mocked value |
| verification_tier | int | |
| status | text | logged / locker / pickup_scheduled / paid_mock |
| created_at | timestamp | |

## `missions`
| Field | Type | Notes |
|---|---|---|
| id | uuid (PK) | |
| type | text | daily / weekly / legendary |
| source | text | fixed_template / generated |
| completion_criteria | jsonb | keep it simple: `{ "type": "species_log", "count": 1 }` style objects |
| territory_id | uuid (FK, nullable) | |

## `mission_progress`
| Field | Type | Notes |
|---|---|---|
| id | uuid (PK) | |
| user_id | uuid (FK) | |
| mission_id | uuid (FK) | |
| status | text | in_progress / complete | 
| completed_at | timestamp | nullable |

## `greenpoints_ledger`
| Field | Type | Notes |
|---|---|---|
| id | uuid (PK) | |
| user_id | uuid (FK) | |
| source | text | wild_xp / circular_payout |
| amount | numeric | |
| related_observation_id | uuid (FK, nullable) | |
| related_transaction_id | uuid (FK, nullable) | |
| created_at | timestamp | |

## `societies` (Stage 7)
| Field | Type | Notes |
|---|---|---|
| id | uuid (PK) | |
| name | text | e.g. "Green Valley Society" |
| boundary | geography(polygon) | can reuse the same simplified-polygon approach as `territories` |
| health_score | numeric | this society's own score — separate from the original single pilot `territories` row |
| created_at | timestamp | |

## `moderator_votes` (Stage 7.4)
| Field | Type | Notes |
|---|---|---|
| id | uuid (PK) | |
| society_id | uuid (FK) | |
| voter_id | uuid (FK → users) | |
| candidate_id | uuid (FK → users) | |
| created_at | timestamp | one row per vote; tally by `COUNT(*) GROUP BY candidate_id` when "closing" an election |

## `raids` (Stage 10)
| Field | Type | Notes |
|---|---|---|
| id | uuid (PK) | |
| society_id | uuid (FK) | |
| created_by | uuid (FK → users) | must be that society's moderator |
| title | text | |
| lat / lng | numeric | pin location |
| scheduled_at | timestamp | |
| status | text | scheduled / active / pending_review / approved / rejected |
| created_at | timestamp | |

## `raid_participants` (Stage 10)
| Field | Type | Notes |
|---|---|---|
| id | uuid (PK) | |
| raid_id | uuid (FK) | |
| user_id | uuid (FK) | |
| before_photo_url | text | |
| after_photo_url | text | |
| status | text | joined / submitted / approved / rejected |
| created_at | timestamp | |

## `waste_transactions` — additional field (Stage 9)
| Field | Type | Notes |
|---|---|---|
| diy_suggested | boolean | set true when the "insufficient material" DIY prompt was shown for this locker state, for basic analytics |

## `clans` (optional — cut first if time is short)
| Field | Type | Notes |
|---|---|---|
| id | uuid (PK) | |
| name | text | |
| territory_id | uuid (FK, nullable) | |

## Deliberately deferred (still out of scope)
- Full Trust Engine Tier 2/3 tables (cloud AI review queue, human review queue)
- Real NGO/government outbound data pipeline (Stage 12 is a local export only, no real integration)
- Real UPI transaction records
- Ranked-choice or weighted voting for moderator elections — plain vote count only

## Related docs
- [[02-ROADMAP]] — Stage 1.4 builds the original schema; Stage 7.1/7.3/7.4 and Stage 10 build the tables above
- [[00-OVERVIEW]] — plain-language description of each entity