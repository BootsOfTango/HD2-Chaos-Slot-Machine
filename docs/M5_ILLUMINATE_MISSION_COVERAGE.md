# M5 Illuminate coverage — September19,2026

Branch `codex/illuminate-mission-coverage`. Revision `review-2026-09-19-c`: **46 identities,30 suggested,16 confirmation-only**. Partial reviewed catalog, not an exact in-game operation feed.

## Reviewed additions

| Mission / community source | Difficulty | Minutes | Treatment |
| --- | --- | --- | --- |
| [Retrieve Recon Craft Intel](https://helldivers.wiki.gg/wiki/Retrieve_Recon_Craft_Intel) |1–10|40|Suggested|
| [Extract Anomalous Material](https://helldivers.wiki.gg/wiki/Extract_Anomalous_Material) |3–10|40|Player-confirmed|
| [Free Colony](https://helldivers.wiki.gg/wiki/Free_Colony) |1–10|40|Player-confirmed|
| [Democratize the Void](https://helldivers.wiki.gg/wiki/Democratize_the_Void) |1–10|40|Player-confirmed|
| [Take Down Overship](https://helldivers.wiki.gg/wiki/Take_Down_Overship) |1–10|40|Player-confirmed|
| [Infiltrate Illuminate Lair](https://helldivers.wiki.gg/wiki/Infiltrate_Illuminate_Lair) |1–10|40|Player-confirmed|
| [Repel Invasion Fleet](https://helldivers.wiki.gg/wiki/Repel_Invasion_Fleet) |3–10|20|Player-confirmed|
| [Destroy Exospire](https://helldivers.wiki.gg/wiki/Destroy_Exospire) |3–10|40|Player-confirmed|
| [Destroy Gazer Spire](https://helldivers.wiki.gg/wiki/Destroy_Gazer_Spire) |5–10|40|Player-confirmed|
| [Blitz: Suppress Toxic Pollination](https://helldivers.wiki.gg/wiki/Blitz%3A_Suppress_Toxic_Pollination) |3–10|12|Player-confirmed|

Indexed community page text reviewed September19. Sources explicitly say community-reference/indexed-text, not publisher verification. No game briefing text or official imagery copied.

Recon Craft Intel's reference gives all10 difficulties without a regional restriction. Other rows are conservative confirmation-only: known Void-only missions, city/operation restrictions or unresolved region mapping. Free Colony/Free the City share one identity; Democratize the Void is the region-specific counterpart, not a second ordinary flag roll. Overship's city and special Exostorm/Void cases are not presumed universal. Fleet records defense as a known necessary condition, but defense alone never enables it because city context is unknown.

[Exostorm reference](https://helldivers.wiki.gg/wiki/Exostorm) supports holding Exospire until actual operation confirmation. [GATER reference](https://helldivers.wiki.gg/wiki/Ground_All-Terrain_Extraction_Rig_%28GATER%29) associates Anomalous Material with Void missions and side objectives; no extra row for the optional version. Gazer/lair/blossom sources explicitly describe Void missions. No keyword matching of planet names, biomes or Major Orders grants a verified regional rule.

**Eradicate Illuminate Forces remains pending.** The mission index lists difficulty3–10, but direct mission-page access failed and bounded indexed searches did not retrieve its duration and operation restrictions. Do not infer15 minutes from other factions or silently add it as playable. Custom observed mission entry remains available. This is not complete Illuminate coverage or M5 acceptance.

## Preservation and graphics

All36 previous mission records and source records remain exact against frozen fixture `test/fixtures/mission-catalog-2026-09-19-b.json`. Old operation shortlists require review after catalog revision, not silent adoption. Historical Results unchanged. No scoring/schema/application version change.

40-minute additions use Normal (40),12-minute pollination uses Blitz (12),20-minute fleet uses Defense (20min). These are app compatibility categories, not an official game scoring model. Player-confirmed provenance and rule conflicts remain recorded; confirmation cannot leak between planets/difficulties/event contexts.

Two original thin-line symbols (spire and crossed blossom) extend the established SVG set to23; the other entries reuse suitable existing type symbols. No tracing/downloaded icon assets.

## Verification

`mission-illuminate-unit-final.log`: **625 units**, CSP/catalog/assets pass.3 fronts×10 difficulties×4 campaign cases per addition; confirmation scope/random-manual equality/duration/scoring checks, old-record parity and review recovery. Initial unit run failed a pre-existing exact low-level Illuminate pool assertion; updated it to include the newly reviewed Recon mission. No production rule relaxed.

Evidence files are under `.test-data/`:

- Source renderer: **232 workflow +18 restart**, `electron-smoke-1789802487804/report.json`.
- Window suite: **133 checks**, `window-smoke-1789802566208/report.json`. Contact sheet of all23 original symbols at32/48/56px and the three-choice Illuminate picker visually inspected. Small-window controls remain reachable. This is not physical Windows scaling certification.
- Actual packaged EXE: **228 workflow +13 restart +7 normal/fullscreen +33 controlled-network +5 cache-restart**, `packaged-smoke-1789802920743/report.json`.
- Packaged imports/exports: **31 write +7 restart**, plus real backend file roundtrip, `packaged-transfer-1789802995213/report.json`. Native file-picker interaction excluded.
- Packaged renderer security: **44 checks**, `packaged-security-1789803012613/report.json`.
- GUI suites ran sequentially, using isolated profiles and software rendering, with graceful shutdown. New Illuminate checks use actual checklist/card controls, verify all nine restricted choices, duration/scoring/provenance, reset to suggestions and preserved historical data. No GUI failure this batch.
- Unsigned installer/ZIP at `dist/mission-illuminate` passed ZIP contents/checksum, embedded installer payload, notices and fuse checks. `mission-illuminate-artifact-inspection/report.json`: **445 source files** compared. Installer SHA-256 `e9cf34e5534cb7da320082305ac19f9a1c0b3610a21116fdcf34537d72f33428`. Native installer inspected, **not executed**.
- Defender scan found no threats; npm audit zero known vulnerabilities. Bounded checks, not guarantees against all malware or vulnerabilities.
- Post-archive resolver regression: **19 tests**, `mission-illuminate-archive-tests.log`; packaging/runtime source unchanged by this maintenance step.

## Desktop handoff and recovery

Existing `HD2 Chaos Slot Machine.lnk` now targets `scripts/start-mission-illuminate-review.cmd`, using the same `.test-data/mission-owner-review` profile. Raw save copied and hash-verified unchanged to `.test-data/mission-illuminate-save-backup-20260919-033031/state.json`. Shortcut backup: `.test-data/desktop-mission-illuminate-shortcut-20260919-033031/HD2 Chaos Slot Machine.lnk`.

All107 superseded sabotage build files moved and hash-verified at `.test-data/accepted-builds/mission-sabotage`, with adjacent `mission-sabotage-move.json` recovery manifest. Historical launcher and inventory resolver point to that exact archive. Active `dist` contains only `installer-shell` baseline and `mission-illuminate`; no duplicate Desktop file or permanent deletion. Do not rerun `.test-data/promote-mission-illuminate.ps1` or any older promotion script.

Personal installed baseline remains untouched; no native installation, publication, commit, tag or application version bump. On next preview launch the catalog revision requires explicit operation review; no automatic changes to historical Results or equipment.

## Next

Remaining Terminid Gloom/Automaton special-operation catalog review; keep unresolved missions confirmation-only. Track the unresolved Illuminate eradication source before claiming full coverage. M5 acceptance then M6 galaxy map. Public rights/signing, clean Windows install/uninstall, physical DPI, listening and long-stability gates remain open. No publication without owner approval.
