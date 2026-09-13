# Changelog

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
