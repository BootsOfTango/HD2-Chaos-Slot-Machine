# HD2CSM v1.1.2 — local gear/ownership preview

Unpublished, unsigned Windows x64 review build, September 13, 2026. This is the first part of Milestone 2, not the completed roadmap. It also includes the preceding local fullscreen/window milestone. Public v1.1.0 downloads remain unchanged.

## What's new

- Castellan's Creed: R/40-K Hot-Shot Marksman Rifle, P/40-K Bolt Pistol, G/40-K Melta Mine (Meltamine alias), and 40-K Meltagun support stratagem. No booster has been invented for this Warbond.
- Eagle Gas Airstrike as a separate campaign reward; Orbital Gas Strike stays in the catalog.
- A compact Armory review panel with bundled images and cover. New items are OFF until you mark them Owned and Include in rolls. Only use the four-item bulk enable if you have actually unlocked all four; it never enables the campaign reward.
- Stable gear IDs, alias-aware imports and separate ownership/roll inclusion. Legacy enabled choices are preserved; the app cannot detect what your game account owns. For old records without ownership, an enabled row is treated as owned and a disabled row as unselected/unowned.
- Empty categories now block a new loadout with an explanation, instead of silently rolling disabled equipment.
- Existing Results, scoring and legacy export compatibility are preserved. Catalog regeneration retains the previously corrected weapon/booster artwork and source metadata.

## Review safely

From the source checkout, run `scripts/start-local-preview.cmd`. It launches the packaged app with `dist/review-profile-v1.1.2`, separate from your normal AppData save. No installation is required. Keep the complete runtime folder together.

Installer: `Helldivers-2-Chaos-Slot-Machine-Setup-v1.1.2-win-x64.exe`.

Portable: `Helldivers-2-Chaos-Slot-Machine-v1.1.2-win-x64.zip`.

Both contain the Electron runtime and local artwork; users do not need development tools. The installer is unsigned and may show an unknown-publisher/SmartScreen warning. Do not install into the source folder or over the old runtime folder during review.

## Known limits and next work

- Only these five additions have been source-verified in this increment. The existing 202-item catalog still has unverified source assignments, possible duplicate aliases and incomplete Warbond covers; its complete audit is next.
- Eagle's bundled icon is Dogo314's attributed community tracing, not an original extracted game file. Its reuse conditions and third-party game-art rights need review before public distribution. See `assets/new-gear/ATTRIBUTION.md` and `docs/M2_CONTENT_RESEARCH.md`.
- All-faction planet rolls, scheduled live-war refresh, redesigned Armory, planet-compatible missions and the interactive galaxy map are not implemented by this preview.
- Automated packaged-app tests are not owner hands-on acceptance. Native installer upgrade/uninstall, physical Windows DPI/trackpad behavior, file-picker interaction and listening to audio remain unverified for this preview. Public release also needs approved patch notes, rights review and Windows signing credentials.

See `docs/M2_TEST_REPORT.md` for exact checks run and limitations. No push, tag or GitHub release is part of this local review.
