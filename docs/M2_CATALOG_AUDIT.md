# M2 catalog and ownership audit

## M2A follow-through

The local v1.1.2 preview implements the stable-ID/ownership engine, generator metadata preservation, alias-compatible import, no-disabled-fallback behavior, and five opt-in additions described below. The original baseline findings remain here as an audit trail. See `M2_TEST_REPORT.md` for the actual renderer/packaged evidence. **Full verification of the legacy 202 entries and their Warbond/source associations is still queued.**

Two pre-existing semantics found during integration are retained for later review: cards-only imports with no `items` keep the current gear; an `items` object with absent groups uses those groups' defaults. Custom entries assigned to a known Warbond can still be normalized to Unassigned unless present in the canonical map. Neither behavior establishes verified source association for a custom entry. Track these explicitly during the full Armory/source audit.

Audited September 13, 2026 against the M1 source in `HD2CSM-Source`, before the concurrent M2 catalog/renderer changes. Counts and line references below describe that inspected baseline; they are not claims that those defects remain after M2 integration. This is a code/data consistency audit, **not an independent verification of current in-game equipment or acquisition facts**.

Read `PROJECT_STATUS.md` and `ROADMAP.md` for the approved milestone boundary. No personal save, installed app, or published release was modified for this audit. Read-only isolated JavaScript evaluation reproduced the merge and eligibility behavior described below.

## Baseline inventory and source-audit queue

| Category | Catalog records | Unassigned / Custom |
|---|---:|---:|
| Primary | 50 | 7 |
| Sidearm | 23 | 7 |
| Throwable | 20 | 2 |
| Stratagem | 91 | 86 |
| Booster | 18 | 0 |
| Total | 202 | 102 |

- Catalog version was `1`; none of the 202 rows had an ID, explicit aliases, or a source URL. Every `source` string merely repeated `warbond`; acquisition method was not represented separately.
- There were 24 source/Warbond labels, including the single `Unassigned / Custom` bucket. Named labels with very few records are review priorities, not proof of incomplete in-game inventories: Control Group 1, Python Commandos 1, Urban Legends 1, Chemical Agents 2, Dust Devils 2, Siege Breakers 2.
- `StA-11 SMG` was in `assault-rifle`, an internal name/category inconsistency. `ARC-12 Blitzer` also appeared in that subgroup and requires source verification. Do not recategorize either solely from this audit.
- `Orbital EMS Strike` and `EMS Strike` were separate roll entries pointing at the same wiki page. `Wasp` and `StA-X3 W.A.S.P. Launcher` are another possible duplicate/alias pair requiring review. Preserve legacy identities and ownership before consolidating anything.
- Familiar labels such as `FLAM-66 Torcher`, `JAR-5 Dominator`, `P-92 Warrant`, several CQC sidearms, `Sterilizer`, `AX/TX-13 Dog Breath`, and `StA-X3 W.A.S.P. Launcher` were in the catch-all bucket. This is a provenance audit queue, not a verified claim of their correct Warbonds.
- `WARBOND_ART` had only one named entry, Exo Experts, plus a universal placeholder. The Exo Experts SVG is a locally drawn cover-style graphic; it must not be described as official cover artwork without separate provenance.

Artwork sources of truth had drifted:

- All 202 runtime image mappings referenced existing local files and had a `sourceUrl`. 111 corrected weapon/booster mappings had artwork hashes.
- 152 `catalog.assetPath` values differed from the actual runtime image mappings; 127 catalog paths did not exist. Runtime mappings, not stale catalog paths, are the known-good baseline to preserve.
- For **25 entries**, the catalog pointed to a different file that still existed: all 18 boosters plus Stoker, Sweeper, SMG-203 Gallant, Entrenchment Tool, Veto, P-33 Missile Pistol, and Giga Grenade. The old generator would preferentially restore those older files, reversing the owner's artwork fixes.
- 88 weapon image records still carried `placeholder:true` even though their runtime paths were corrected `-wiki` assets, not placeholder paths. Do not report these as 88 currently missing pictures; the metadata is stale.
- There were 211 image alias keys, including meaningful historical spellings such as `detonation tool` → Defoliation Tool, `grenadier battalion` → Grenadier Battlement, `guard dog arc` → AX/ARC-3 K-9, `guard dog breath` → AX/TX-13 Dog Breath, `r 0 variable` → VG-70 Variable, and abbreviated FRV names. These must survive catalog regeneration and become category-scoped identity aliases after verification.

## Critical implementation findings

1. **Disabled gear can currently roll.** `enabledNames` at `index.html:7174` explicitly falls back to all names if zero entries are enabled. An isolated call with `[{name:'Not owned',enabled:false}]` returned `['Not owned']`. `sampleEnabledText` at8042 does not use that fallback, so animation and final selection can disagree. M2 must use one shared eligibility predicate, never an all-items fallback, and explain an empty or undersized pool.
2. **Name-only merging duplicates renamed items and reintroduces omitted rows.** `parseAndApplyState` at6685 starts from the caller's existing arrays, matches exact `name`, then `Object.assign`s saved rows over catalog facts. An alias becomes a second entry rather than carrying the original ownership. Missing defaults remain enabled. A later source correction is overwritten by stale saved `source`/`subgroup` fields.
3. **Import and restart differ.** `loadState` at6759 initializes defaults before applying a file, but `applyImportedData` at13071 merges into the current working state. An isolated reproduction retained a session-only custom item immediately after import but lost it on a fresh restart of the same imported file. Always migrate gear against the immutable default catalog, not the previously merged state.
4. **The generator can revert opt-in flags and artwork.** `scripts/sync_item_catalog.py:46` hardcodes `enabled:true` for every default. Its image rebuild at105 preserves only a small metadata allowlist, dropping `artworkSha256`, `artworkSource`, other provenance, and curated aliases. Fix generator behavior before running it on new gear.
5. **Identity is coupled to asynchronously loaded image data.** `preloadItemVisualsInternal` at7723 fills `itemVisuals.aliases`; `canonicalItemName` at11370 uses that map. Ownership migration must not depend on successful image loading or network availability. `toImageKey` at6539 and `normalizeItemKey` at7710 also normalize punctuation/ampersands differently.
6. **Historical aggregation uses inconsistent keys.** `buildArmoryStats` at11379 uses alias-canonical names without slot scoping, `buildArmoryAnalyticsData` at11551 uses type + lowercase text without aliases, and `buildItemAnalytics` at12085 uses slot + normalized names. Resolve a stable catalog ID plus category for derived analytics while preserving original stored card labels and scores.
7. **Custom editing does not model ownership independently.** Gear toggle handlers at11801/12024 directly flip `enabled`. Add buttons at13387 append arbitrary names without duplicate detection or IDs. No gear-removal/tombstone handler was found; omission in an old file cannot prove whether an item was deleted, never known, or simply absent from a partial export.

The requested function names `ensureDefaultCatalogItems` and `forceBoot` were **not present** in this checkout. Their real equivalents to protect are the defaults-first merge above, the explicit reset handler at13374, Clear All at13103, and the boot rejection fallback at13618. The latter resets runtime data and sets `shouldPersistOnBoot=false`; preserve that non-overwrite behavior when migration fails.

## Pure migration module delivered during this audit

`assets/catalog-state.js` exposes `HD2CSMCatalogState` in the browser and the same CommonJS interface to tests:

- `mergeItems(defaultItems, savedItems)` returns the five gear arrays only. Planets and other data remain the renderer's responsibility. It does not mutate inputs, cards, or settings.
- Resolve within a category by stable ID, normalized canonical name, then a unique normalized alias. Conflicts choose higher priority, then first input record; never OR ownership/eligibility flags together.
- Known catalog facts replace stale saved facts, while arbitrary user fields survive. Losing duplicate records are retained under `legacyAliasRecords`, including their preexisting recovery records, without growth on repeated migration.
- Preserve explicit boolean `owned`; otherwise derive it from legacy `enabled`. A missing `enabled` on a matched row falls back to its catalog default. An explicit unowned/enabled contradiction becomes disabled, retaining the original row for recovery.
- An entire missing saved category uses default clones. An explicitly present category with missing known rows retains those defaults **disabled and unowned**. This prevents omitted old entries from silently reappearing in rolls. The newly introduced opt-in gear also remains disabled by default.
- Unknown rows survive with arbitrary fields. Preserve existing unknown/future IDs; otherwise generate deterministic category-scoped custom IDs from normalized names, with a stable hash fallback for non-Latin/symbol-only names.
- `isEligible(item)` requires `enabled === true` and `owned !== false`. `setOwned(false)` also clears enabled; `setOwned(true)` does not automatically enable; `setEnabled(true)` rejects explicitly unowned gear. These setters return success/failure and mutate only their supplied row.
- Ambiguous aliases are retained as custom data rather than selecting an arbitrary known item. Malformed gear arrays/rows fail migration, allowing the caller to preserve the original file and report recovery guidance.

The ownership inferred from legacy enabled flags is a compatibility inference, not proof of account entitlement. The compact new-gear and ownership UI should say that ownership is user-managed, not synced from Steam/the game.

## Renderer, persistence, and build integration checklist

- Use the same catalog migration for fresh boot, browser legacy-key migration, desktop legacy-profile recovery, JSON imports, and explicit reset defaults. Do not add a second helper that appends enabled defaults after migration.
- Update `buildPersistedStatePayload` at6729 and browser export construction at13067 if any new catalog/ownership metadata lives outside existing item rows. Desktop validation currently permits extra root fields but gear-group values must be arrays; do not put an object-valued ownership map inside `items` without changing validators.
- `electron/storage.js` uses save wrapper version1, validates structural shape, backs up before import, then writes the raw imported payload. After renderer migration, await saving the final merged payload before announcing that import is persisted. Test immediate restart. Preserve pre-migration/import backups.
- Keep import acceptance for old unwrapped browser JSON and wrapper-version1 desktop exports. Do not indiscriminately bump the outer save wrapper or rename browser storage keys solely for IDs; use a dedicated catalog-state version if needed, with forward-version handling tested.
- Gear migration must not alter planet merging, remembered name, card IDs, displayed historic equipment names, seed strings/fingerprints, locked stats snapshots, or scores. New cards may carry additive ID references alongside display-name snapshots; legacy cards can resolve identities at read time without rewriting history.
- Reset Defaults is an explicit destructive ownership/custom-list action; preserve its confirmation and backup behavior, clearly stating what it resets. Clear All must reset any new metadata too. Removed/custom records require a deliberate recovery/tombstone policy before adding deletion UI; do not infer deletion from missing legacy rows.
- Generated default facts should remain usable synchronously/offline. If moving catalog loading to a new module/resource, update the renderer boot dependency and the narrowly allowed JSON resource list in `electron/resource-loader.js:4`; never let a failed catalog request trigger an enabled fallback.
- Preserve corrected local artwork and provenance through generation. Extend validation from name/order parity to unique IDs, scoped alias collisions, categories, acquisition/source references, valid local paths, provenance hashes where supplied, and opt-in default flags. Existing validation does not prove those facts.
- Search, Warbond bulk controls, random selection, reel sampling, and analytics must share identities and ownership mutations. Bulk ownership must operate over all eligible records in the chosen source group, not just the currently filtered/rendered rows. Marking a Warbond owned must not automatically mark an unrelated campaign reward owned.

## Targeted cases and evidence

`node --test test/catalog-state.test.js` passed **19 tests** when the module was delivered. It covers fresh/legacy state, missing groups versus omitted rows, disabled ownership, canonical facts, ID-only ownership records, scoped aliases, duplicate priority, recovery retention/idempotence, custom/future IDs, non-Latin names, repeated imports, explicit-unowned safety, independent ownership/enabled controls, malformed input, and the browser UMD interface.

Renderer integration still needs its own tests; a passing pure module is not a passing app migration:

1. Import a full v1.1.0 file with disabled gear and a historical alias; import the same file again and restart. No duplicates or reenabled gear; exact custom fields and historical cards survive.
2. Test partial category exports, empty explicit categories, absent entire categories, unknown/future IDs, custom names that resemble known gear, and mixed ID/canonical/alias duplicates with contradictory booleans.
3. Turn off/unown every item in each slot; both reel samples and final rolls must remain empty/blocked with a useful message. For fewer than four unique stratagems, never duplicate or silently add unowned gear.
4. Add new gear defaults, reset lists, Clear All, and import old data: the five introduced items stay opt-in unless explicitly owned/enabled by the player. Eagle Gas Airstrike and Orbital Gas Strike remain separate identities.
5. Damage catalog input, aliases, or state; preserve recoverable files and do not auto-save fallback defaults over them. Test native import failure before and after migration.
6. Regenerate catalog/defaults/images twice: no ownership/provenance/alias loss, no corrected-artwork regression, deterministic IDs, and no changes to source facts merely because an image download is unavailable.
7. Complete a run, finalize stats, update/rename its catalog item, then use Results, Compare, Rank, Armory, export, and restart. Original history and scoring remain stable; derived item analytics may consolidate verified aliases only.
