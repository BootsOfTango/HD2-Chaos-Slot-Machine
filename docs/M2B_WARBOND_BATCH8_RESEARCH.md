# M2B batch 8 — Helldivers Mobilize! and starter boundary

Reviewed September 15, 2026. Acquisition associations only: no balance, scoring, gear identity, default-eligibility or item-image changes.

## Evidence and confidence

[Arrowhead's Warbond FAQ](https://arrowhead.zendesk.com/hc/en-us/articles/12517746128924-What-is-a-Warbond) confirms that Mobilize is the free standard Warbond, while equipment/page unlocks require Medals. Free access does not mean the player has unlocked all items. This primary source establishes the acquisition model, not each individual membership.

[Helldivers Wiki.gg's contents](https://helldivers.wiki.gg/wiki/Helldivers_Mobilize_Warbond) provide the twenty rollable memberships below and a February 8, 2024 release date. [Fandom's contents page](https://helldivers.fandom.com/wiki/Helldivers_Mobilize) also lists this set; the wikis may share source history, so this is not independent primary evidence. Individual acquisition facts are explicitly **community-source**, not promoted to primary-source. Direct wiki HTML was blocked; the public MediaWiki parse/imageinfo API succeeded. Local downloaded research evidence is in `.test-data/mobilize-page-api.json` and `.test-data/mobilize-art-api.json`.

| Page | Rollable equipment |
|---|---|
| 1 | SG-8 Punisher; G-6 Frag |
| 2 | R-63 Diligence; P-19 Redeemer |
| 3 | Hellpod Space Optimization; SMG-37 Defender |
| 4 | Vitality Enhancement; SG-225 Breaker |
| 5 | LAS-5 Scythe; G-16 Impact |
| 6 | UAV Recon Booster; AR-23P Liberator Penetrator |
| 7 | Stamina Enhancement; R-63CS Diligence Counter Sniper |
| 8 | SG-8S Slugger; G-3 Smoke |
| 9 | Muscle Enhancement; SG-225SP Breaker Spray&Pray |
| 10 | Increased Reinforcement Budget; PLAS-1 Scorcher |

Ten primaries, one sidearm, three throwables and six boosters. No stratagems. Cosmetics and separately purchased Superstore equipment are not part of this rollable set. The existing AR-23 Liberator, P-2 Peacemaker and G-12 High Explosive starter records remain unchanged outside the Warbond. Requisition/campaign/custom audit is a later batch.

## Implementation boundaries

- Correct the legacy `Helldiver Basics (Mobilize)` group to `Helldivers Mobilize!`; add the stable `warbond:helldivers-mobilize` definition and full-set controls.
- Preserve every equipment ID, canonical name, alias, category, artwork path and default. No new gear is injected and no player's ownership choices are granted or cleared.
- New and old name/ID-based saves converge through the existing fact-only catalog merge. Historical Results remain untouched.
- Capture an independent pre-change fixture from the verified v1.1.12 ASAR. Keep prior batch digests through a test-only projection; do not regenerate expectations from modified catalog data.
- Bundle unmodified in-game background art, credited to uploader Dogo314 / Helldivers Wiki.gg. See `assets/warbonds/ATTRIBUTION.md` and `provenance.json`. This is not an acquisition-menu screenshot; redistribution-rights review remains separate.

Expected catalog coverage after this batch: **146/205 acquisitions reviewed = 108 primary + 38 community; 59 pending**, with 23 reviewed Warbond groups. This measures only the existing catalog, not completeness against every item currently in the game. M2 remains open. No M3–M7 work or publication in this batch.
