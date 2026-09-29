# Changelog

## HD2 Chaos Slot Machine v1.1.1 — publication preparation

The owner selected **v1.1.1**, following published v1.1.0, instead of restarting the public numbering at1.0. Full-name branding, installers, portable ZIP, application display and release tag use v1.1.1. Internal Windows/package compatibility version remains1.1.14 to protect upgrades. Historical releases stay unchanged.

This release includes the map/Armory/mission/scoring/card-save improvements described in the prior preparation entry below, plus the creator's introduction. See [v1.1.1 release notes](docs/RELEASE_NOTES_1.1.1.md). A hosted source-test failure was traced to the15-second deadline for compiling a test-only PowerShell helper; the compilation deadline is now60 seconds with explicit spawn-error reporting. Native dialog safety assertions remain unchanged.

## HD2 Chaos Slot Machine 1.0 — prepared September 29, 2026; publication pending

This is the new full-name release line, not a replacement for historical Roulette/Chaos Tango tags. The public version is 1.0; internal Windows compatibility version stays 1.1.14 so existing installations can upgrade without a version downgrade. Existing saves and migration aliases remain compatible. Full [release notes and limitations](docs/RELEASE_NOTES_1.0_DRAFT.md).

- Fullscreen startup, F11/Escape controls and scrollable smaller windows with background panning.
- Searchable, collapsible Armory: 214 items, 25 Warbond groups, source images, separate Owned/Included controls and opt-in new acquisitions. Includes Castellan's Creed, Ironclad Democracy, separate LAS-12 Sai and campaign-reward Eagle Gas Airstrike.
- Cross-faction planet rolls and a shared manual/random selection system. Original interactive galaxy map with sectors, faction shading, supply links, search, hover conditions, reported activity and an accessible list.
- Cached/offline war data with visible freshness; five-minute refresh checks normally, once per minute while the visible map is open. Community data can lag the game.
- 60 specific mission identities with yellow/gold icons; compatible suggestions and optional in-game-operation confirmation. No claim to read exact live mission availability.
- Context-sensitive loadout codenames, compact saved-card planet/sector visuals, guided score entry, final review, locked numbers/notes and later comments.
- Six-axis solo scoring/ranking, gentler Firepower curve and opt-in card-rule updates. Verified recovery copies before updates/removal of reviewed incomplete cards; keep pending cards and preserve original records for retained cards.
- Hardened save/import/recovery handling, protected unreadable/future-format saves, separate installation/save folders, restricted renderer/IPC and Electron 44.4.5.
- Full-name Setup/portable ZIP, bundled player guide, credits/component notices, checksums and accurate unsigned-build warnings. Manual app updates; war refresh does not install catalog/software updates.
- Verified hosted install/uninstall/reinstall and synthetic-card preservation; broader physical audio/DPI and consumer-Windows scenarios remain separately documented. Tests/scans are not a safety guarantee.

### Historical development log

Earlier entries below describe their dated development state, not missing features in the new 1.0 release line. Historical tags and downloads are retained unchanged.

## Local Development — Support Weapon Audit, September 15, 2026

- Review the remaining sixteen acquisition records: MG-43 starter equipment and fifteen requisition purchases, all explicitly community-source reviewed.
- Preserve IDs, names, aliases, artwork, default eligibility, saved choices and historical Results. No new roll entries or ownership grants.
- All 205 existing acquisitions reviewed (109 primary, 96 community). The dated 33-entry support-weapon category resolves uniquely to existing items; broader completeness and artwork review remain open.
- Descriptive local build, frozen internal version; no installation or publication. Planet/mission and Armory redesign milestones remain separate.

## Local Development — Backpack / Vehicle Audit, September 15, 2026

- Review ten existing requisition backpack/vehicle acquisitions and the Supply FRV's Census Thunder campaign eligibility (one official, ten community sources).
- Fix Supply FRV fresh-profile eligibility: unowned/excluded until selected by the player. Preserve existing saved ownership/include choices and history; no automatic October date unlock.
- Recognize M-102 Gunner FRV as an alias of the existing Fast Recon Vehicle, keeping its stable ID and images.
- Catalog review now 189/205; sixteen support-weapon acquisitions remain pending. Bounded backpack/vehicle category comparison found no missing selectable entries; broader completeness remains open.
- Descriptive local artifact names; internal version unchanged. No installation, publication, planet/mission or scoring-rule changes.

## Local Development — Defensive Audit, September 15, 2026

- Stop incrementing public-looking version numbers for local review batches. Use descriptive local installer/ZIP/header labels; internal package version stays frozen until the final release/upgrade plan is validated.
- Owner targets **HD2CSM 1.0 Official** when the roadmap is complete and explicitly approved. Existing published tags/releases remain unchanged.
- Review fourteen defensive-stratagem requisition acquisitions with dated community evidence; preserve all identities, ownership exclusions, artwork and historical Results.
- Current catalog review: 178/205 entries, with 27 support/backpack/vehicle acquisitions still pending. No game-wide completeness claim or planet/mission/scoring changes.

## v1.1.14 — local orbital/Eagle audit candidate, September 15, 2026

- Correct acquisition sources for 17 existing requisition stratagems and the starter Orbital Precision Strike, with dated community evidence.
- Preserve identities, local artwork, existing ownership/roll choices, historical Results and all 23 Warbond groups.
- Keep Orbital Gas Strike, Orbital EMS Strike and campaign-reward Eagle Gas Airstrike distinct. Eagle Rearm is not a loadout item.
- Current-catalog review coverage: 164/205; 41 support/defensive acquisitions remain pending. No claim of a complete game-wide catalog audit.
- Includes the cumulative Mobilize/save/import work. No planet/mission/scoring-rule changes, installation or publication.

## v1.1.13 — local Mobilize-audit candidate, September 15, 2026

- Review Helldivers Mobilize!'s 20 equipment acquisitions, add its original offline background artwork and full-set ownership controls.
- Separate free Warbond access from medal unlocks; preserve starter equipment, prior ownership, item identities and historical Results.
- Correct stale artwork-credit wording; retain transparent community-source evidence and attribution.
- Includes the v1.1.11–12 save/import safeguards. No planet/mission/scoring-rule changes or publication.
- Record an ongoing cleanup policy: one player download, one installed shortcut, recoverable archives for superseded builds.

## v1.1.12 — local import-safety candidate, September 15, 2026

- Prepare/validate imports before durable commit and UI publication; keep the active session on failure.
- Shared desktop/browser transfer size and structural limits, visible error handling and retained pre-import browser recovery copy.
- Support transfers beyond the previous 5 MiB limit; reject unsupported oversized exports before touching targets.
- Preserve zero-valued bonus metadata on restart; scoring formulas unchanged. [Review and test evidence](docs/IMPORT_EXPORT_HARDENING.md).

## v1.1.11 — local health-review candidate, September 15, 2026

- Preserve newer-format/unreadable saves and block writes after an unsuccessful load.
- Make saves/exports durable before replacement; avoid colliding rapid backup names.
- Show failed-save warnings, retry/session export and explicit discard controls; wait for pending saves on normal close.
- Add a per-profile single-instance guard. No catalog, ownership or scoring rules changed.
- Separate unsigned candidate; accepted v1.1.10 player files remain unchanged. See [review evidence and limits](docs/MID_PROJECT_HEALTH_REVIEW.md).

## v1.1.10 — local preview, September 14, 2026

- Reviewed Entrenched Division, Exo Experts and ODST equipment and three bundled original promotional images.
- Sweeper corrected to a separate Superstore shotgun; Stoker corrected to SMG. Nine aliases, no ID/default/ownership changes.
- 126/205 acquisitions reviewed across 22 Warbond groups; [research](docs/M2B_WARBOND_BATCH7_RESEARCH.md) and [tests](docs/M2B_WARBOND_BATCH7_TEST_REPORT.md). Unpublished and unsigned.


## 2026-09-14 — v1.1.9 local Warbond review preview (unpublished)

- Review all 15 equipment acquisitions in Python Commandos, Redacted Regiment and Siege Breakers using official announcements. Catalog remains 205 unique items: 93 primary-source + 17 community-source + 95 pending.
- Correct seven previously unassigned stratagem associations; classify Hot Dog and C4 Pack as backpacks. Preserve names, IDs, default ownership and item images; add eight full-designation search/import aliases.
- Add three bundled original promotional scenes. Nineteen reviewed Warbond groups have complete equipment-set controls.
- Preserve current LAS-13 Trident identity despite conflicting announcement text; use Redacted Regiment's actual January 22 release date instead of the original January 20 schedule.

## 2026-09-14 — v1.1.8 local Warbond review preview (unpublished)

- Review 13 existing acquisitions in Viper Commandos, Truth Enforcers and Steeled Veterans: nine primary-source, four explicitly community-source. Catalog remains 205 items: 78 primary + 17 community + 110 pending.
- Add three bundled original official promotional images and exact four/four/six equipment sets; preserve the previously reviewed Dominator and all other prior metadata.
- Recognize the historical AR-23E Liberator Explosive name as an alias of AR-23C Liberator Concussive. No canonical names, subgroups, IDs, default ownership or item artwork change.
- Bundle the player-first usage/install guide. Full roadmap, native installer acceptance and public signing/release remain separate.

## 2026-09-14 — v1.1.7 local Warbond review preview (unpublished)

- Reviewed 14 existing acquisitions across Masters of Ceremony, Force of Law and Dust Devils: 13 primary-source, one explicitly community-source (Sample Scanner). Catalog stays at 205 identities: 69 primary + 13 community + 123 pending.
- Corrected six previously unassigned stratagem associations and K-9's backpack subgroup. Added full-name aliases while preserving canonical names, old aliases, item artwork, ownership defaults and historical Results.
- Added three original official promotional images with attribution, including a Warbond-specific Dust Devils Steam banner. Thirteen reviewed Warbond sets have complete-set controls; separate shop and custom gear stay excluded.
- Historical baseline digest tests retain exact earlier expectations through a fact-only projection. Nine new batch-specific tests cover metadata, preservation, evidence tiers, aliases, ownership imports, exclusions and image signatures/hashes.
- Local automated gate passed: 174 unit tests, development and packaged workflow/restart checks, all 13 Warbond sets, prior catalog regressions and actual old-EXE save upgrade. Installer/ZIP integrity and 353 bundled source-file comparisons passed. The isolated review launcher targets the verified v1.1.7 runtime; no personal installation or GitHub release was changed.
- Software rendering and sequential graceful-close testing remain enabled. Local artifact and verification evidence belongs in `docs/M2B_WARBOND_BATCH4_TEST_REPORT.md`; public release and native/hardware acceptance remain separate.

## 2026-09-14 — v1.1.6 local Warbond review preview (unpublished)

- Added an app-only software-rendering default, graceful fullscreen close, and bounded durable lifecycle diagnostics. Desktop test runners now share a cross-process lock, wait for normal exit, and stop on timeouts without force-killing the app. This mitigates exposure; it does not establish a fix for the Windows graphics-scheduler crash.
- The safety candidate is built separately in `dist/safety-preview-v1.1.6`, preserving the interrupted/damaged artifacts and personal installation for review. See `docs/DESKTOP_GRAPHICS_SAFETY.md` for executed checks.
- Reviewed 13 more existing acquisitions against official Control Group, Servants of Freedom and Borderline Justice announcements. The three complete equipment sets contain five, four and five items; the already-reviewed VG-70 Variable remains unchanged.
- Corrected five previously unassigned stratagem sources without adding equipment or granting ownership. Catalog remains 205 unique entries: 56 primary-source reviewed / 12 community-source reviewed / 137 pending, or 68 reviewed in total.
- Grouped Warp Pack, Hover Pack and Portable Hellbomb as backpacks, and TED-63 Dynamite with grenades. Exact taxonomy evidence remains qualified separately from official acquisition evidence.
- Corrected Sample Extractor to Sample Extricator while retaining the existing stable ID and old-name alias. Added full official stratagem-designation aliases; saved choices and historical Results remain compatible.
- Added three more bundled official promotional images with provenance/attribution. Ten reviewed Warbond groups now have full-set include, exclude and unowned controls; separate Superstore purchases and custom entries remain outside those sets.
- Automated local build and batch-3 acceptance passed: 165 unit checks, focused packaged Warbond/prior-catalog regressions, restart/import/export and old-EXE save migration. Packaged test commands now require an explicit verified EXE path and reject damaged headers before launch. See `docs/M2B_WARBOND_BATCH3_TEST_REPORT.md` for exact evidence and limitations.
- This remains a local unsigned preview, not a public release or the full visual Armory/live-war/map/mission update. Owner hands-on, physical/native installer and signing/rights acceptance remain pending. See `RELEASE_NOTES_v1.1.6.md` for scope and remaining gates.

## 2026-09-14 — v1.1.5 local Warbond review preview (unpublished)

- Reviewed 17 more existing acquisitions across Cutting Edge, Democratic Detonation and Polar Patriots: 16 primary-source and one community-source. Catalog remains 205 unique entries, now 43 primary-source reviewed / 12 community-source reviewed / 150 pending.
- Recorded three exact six-item Warbond equipment sets. The already-reviewed Blitzer is unchanged; no equipment or player entitlement is added by this update.
- Corrected Punisher Plasma to Energy, Eruptor to Explosive and Grenade Pistol to Special sidearm, keeping IDs, names, image paths, player choices and historical scores. Exact taxonomy evidence is distinguished from acquisition evidence.
- Bundled three more unmodified official promotional images with original JPEG/PNG formats, provenance, attribution and rights caveats.
- Added whole-set ownership/include/exclude controls to seven reviewed Warbond groups in the existing Manual pool view. Search-hidden members remain in scope, unrelated/custom/shop entries do not; changes synchronize existing ownership views and persist.
- This is not the full visual Armory or live-war/map/mission update. See `docs/M2B_WARBOND_TEST_REPORT.md` for executed tests and remaining gates. Local, unsigned, not published.

## 2026-09-14 — v1.1.4 local duplicate-cleanup preview (unpublished)

- Consolidated Wasp into StA-X3 W.A.S.P. Launcher and EMS Strike into Orbital EMS Strike. EMS Mortar Sentry is unchanged. Rolls now contain 205 canonical equipment entries, not 207 rows containing two duplicates.
- Retained shortened names as aliases and old stable IDs as explicit legacy IDs. Canonical ID choices take priority over retired IDs, then canonical names, then aliases; ties retain the first supplied record. Flags are never combined to enable equipment.
- Preserved replaced originals, custom metadata and conflicting choices under recoverable `legacyAliasRecords`, including sole old-ID/name records; repeated imports do not grow recovery data.
- Kept historical labels, fingerprints, locked statistics and scores unchanged. Derived analytics count each equipment identity once per recorded run, including old cards containing both duplicate names.
- Added Armory's compact Duplicate cleanup explanation/current choices/recovery summary and stronger catalog ID/alias/image validation.
- No new acquisition reviews: 38 unique reviewed identities (27 primary-source, 11 community-source), with 167 pending. The count dropped by two because duplicate rows were combined, not because evidence was lost.
- See `docs/M2B_DEDUP_TEST_REPORT.md`. Still local and unsigned; other roadmap milestones remain queued.

## 2026-09-14 — v1.1.3 local source-audit preview (unpublished)

- Reviewed 35 legacy acquisition assignments: 23 against primary sources and 12 against community sources. With the prior five additions, 40 of 207 catalog records have reviewed acquisition metadata; 167 remain pending.
- Distinguished Warbond unlocks from Superstore purchases, starter equipment, edition bonuses, gifts, campaign rewards and requisition unlocks. Source corrections do not grant ownership or enable rolls.
- Corrected three display names to CQC-2 Saber, CQC-42 Machete and CQC-19 Stun Lance while retaining stable IDs, old aliases, artwork and historical Result labels.
- Kept pre/post-rename usage together in derived Armory analytics without rewriting historical cards or scoring.
- Added offline official promotional scenes for Freedom's Flame, Chemical Agents and Urban Legends, with attribution, byte hashes and clear wording that they are not exact in-game cover images.
- Added acquisition-review badges and a compact audit-status panel. Custom source groupings are preserved but cannot claim verified catalog provenance.
- Confirmed duplicate WASP and Orbital EMS records; their ID-safe consolidation remains a separate task. No duplicate was silently deleted or merged in this increment.
- M2 remains in progress. See `docs/M2B_TEST_REPORT.md`; live-war, visual Armory, missions and map remain queued.

## 2026-09-13 — v1.1.2 local gear/ownership preview (unpublished)

- Added the four Castellan's Creed equipment items and separate Eagle Gas Airstrike campaign reward, all excluded until the player chooses ownership and inclusion.
- Added a compact new-gear review panel, local Warbond cover/item artwork, and explicit four-item bulk enable.
- Introduced stable gear IDs, aliases, independent Owned/Include state, and backward-compatible imports preserving legacy eligibility and historical Results.
- Removed the all-disabled fallback that could roll excluded equipment; empty gear categories now explain what needs enabling.
- Preserved corrected weapon/booster art during catalog regeneration and retained artwork provenance/hashes.
- Documented the Eagle icon as a credited community tracing, not an extracted official icon. Broader artwork rights review remains a public-release gate.
- This is M2A only. Existing Warbond/source assignments still need a complete audit; live-war, visual Armory, missions and map are queued. See `docs/M2_TEST_REPORT.md`.

## 2026-09-13 — v1.1.1 local fullscreen preview (unpublished)

- Restored a separate source checkout; preserved the existing runtime installation and personal saves.
- Added true fullscreen startup, F11/toolbar controls and dialog-first Escape handling.
- Kept a 1280 CSS-pixel desktop layout in smaller resizable windows, with scrollbars and background Space-drag panning.
- Added viewport-sized dialog accessibility/focus handling while preserving browser responsiveness.
- Patched three vulnerable build-only transitive dependencies without an Electron/builder upgrade.
- Added focused window tests, normal packaged-startup verification, a safe isolated-profile preview launcher and the persistent phased roadmap.
- New gear, live-war redesign, missions, visual Armory and galaxy map remain queued. See `docs/M1_TEST_REPORT.md` for executed checks and limitations.

## 2026-09-13 — HD2CSM v1.1.0 Windows desktop

- Renamed the application to **Helldivers 2 Chaos Slot Machine**, with **HD2CSM** yellow-and-black slot-machine branding.
- Added a self-contained Windows Setup installer alongside the portable ZIP, with matching release filenames and checksums.
- Added non-destructive migration from the previous desktop save location and browser storage keys, with continued support for older JSON exports.
- Improved first-launch offline randomization, dated live-planet fallback data, Results finalization, scoring, rerolls, and analytics consistency.
- Replaced weapon placeholders and simplified booster substitutes with 111 bundled source images, verified offline in the installed application.
- Fixed pending-result ranking, Major Order penalties, Compare deaths/stims, raw totals, booster analytics, and import refresh.
- Passed 38 unit tests and 73 installed-app assertions. See `docs/FINAL_TEST_REPORT.md` for evidence and limitations.
- Published-download preparation uses the explicit unsigned `hd2csm-v1.1.0` release tag; the future signed-release workflow remains intact.

## 2026-04-01

### First official Chaos Tango 1.0 release ✅

- **Release:** Declared **Helldivers 2 Chaos Slot Machine (Chaos Tango)** as the first official **v1.0.0** release baseline.
- **Version label:** Updated in-app version tag to `HD2CSM v1.0.0` for semantic-version consistency.
- **Release docs:** Added `RELEASE_NOTES_v1.0.0.md` with copy-ready notes for GitHub Releases.

## 2026-03-26

### Entrenched Division warbond content update ✅

- **Change:** Added the Entrenched Division warbond gear to the catalog, defaults, and image mappings.
- **Weapons/Equipment:** Entrenchment Tool, Veto, Stoker, Sweeper, Giga Grenade.
- **Stratagems:** Gas Mortar, Cremator.
- **Why:** Keeps slot-machine pools aligned with newly released warbond content so new items can be rolled immediately.

## 2026-03-22

### Official stable release tag

- **v1.0.0:** First official 1.0 release of **HD2CSM**.
- **Status:** UI version tag, release notes, and release prep now align on the official 1.0 designation.

### Release focus ✅

- **Change:** Promoted the current Slot Machine build to the official **1.0** release milestone.
- **Why:** Establishes a clear stable launch point for GitHub tagging and future release notes.

## 2026-03-14

### Armory catalog maintenance + icon integrity ✅

- **Change:** Added a canonical `assets/item-catalog.json` source and automated item/image validation checks before release publication.
- **Why:** Prevents ARMORY stat cards from showing missing or mismatched icons when item pools are updated.

### Newly added weapons/stratagems this update

- **Weapons:** None (catalog/data integrity update only).
- **Stratagems:** None (catalog/data integrity update only).


## 2026-03-09

### Stable release tags

- **v0.1:** First stable version.
- **v0.2:** Second stable version.
- **v1.0.0:** Official 1.0 baseline release.

### Spin tab – Manual planet search + choose ✅

- **Change:** Added a **SEARCH PLANET** button next to **ROLL PLANET** so players can manually pick a planet when they want to override random planet rolls.
- **Details:** Search supports filtering by **planet name**, **biome**, **environment/hazards**, or an all-fields mode. The results include the full internal planet list (not only currently active/MO planets), grouped by **Sector** with planets sorted **alphabetically** inside each sector.
- **Details:** Choosing a planet from search sets the same current-run planet data used by roll/reroll (name, sector, biome, environment) so the Spin and Results behavior remains consistent.
- **Status:** Stable – manual selection and grouped search view integrated into Spin workflow.

## 2026-02-25

### Results tab – Biome on cards ✅

- **Change:** Biome info from the Spin tab is now carried over and shown on saved loadout cards in the Results tab.
- **Details:** When you roll a planet and hit "USE THIS RUN", the card now displays **Sector**, **Biome** (e.g. "Scorched Moor"), **Environment**, and **Faction**. Biome is persisted on both `card.planetBiome` and `card.planet.biome` so it always shows correctly for new and existing cards.
- **Status:** Successful – confirmed working (e.g. "Scorched Moor" on Menkent / Hydra Sector card).
