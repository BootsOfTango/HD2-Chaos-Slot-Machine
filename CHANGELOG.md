# Changelog

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
