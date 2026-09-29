# Planet artwork review — September 18, 2026

Owner requested planet images in Armory and rolls. Branch: `codex/planet-artwork`.
Existing working-tree changes preserved. No commit, push, publication or version bump.

## Delivered

- Thirteen small original SVG globe illustrations: forest, ice, desert, swamp, crimson,
  volcanic, barren, moon, acid, ocean, urban, hive and neutral/unknown.
- Thumbnails in the editable Armory planet list, shared live/cached/bundled Armory list,
  and manual planet search; a larger globe beside the rolled planet's name.
- Exact normalized biome-family mapping covers all 27 current bundled biome labels.
  Unknown, new, localized or invalid labels use the neutral globe. No remote image URL,
  faction, weather or guessed planet name determines an artwork path.
- Globes are **representative biome illustrations, not exact official game imagery**.
  Visible short disclosure and image tooltips; source/provenance in
  `assets/planets/ORIGIN.md`. Images are decorative for accessibility because names and
  biome information remain adjacent. No motion, shaders, GPU filters or new network requests.
- Settled rolls/rerolls update the image from the chosen planet. The image is hidden
  while transient planet names animate. Missing artwork falls back once to a local
  neutral globe; a missing neutral image hides itself without an error loop or lost text.
- Planet eligibility, randomization, missions, scoring, ownership and save format unchanged.
  Local protocol allows only the two new script/style resources plus existing safe image routes;
  reviewed inline CSP hash updated, not loosened.

## Executed verification

All GUI tests sequential, exclusive, software-rendered, isolated and gracefully exited.

| Check | Result / evidence under `.test-data` |
| --- | --- |
| Unit + CSP/catalog/asset checks | **556 passed**, `planet-art-unit-final.log`; no missing catalog artwork. New vectors separately checked for local paths, SVG content, coverage and provenance. |
| Source real-renderer workflow | **140 workflow +14 mission lifecycle +33 controlled network +16 restart**, `electron-smoke-1789784752145/report.json`. All 13 globes decoded offline; both Armory row paths/manual search, settled roll/reroll, malicious names, missing assets and no-selected-planet state checked. |
| Window/browser | **107 passed**, `window-smoke-1789784855173/report.json`; 640x480 at 100%/200% page zoom, scroll/focus reachability, desktop/native keyboard/fullscreen, responsive browser. Globe screenshot review at 1280px. |
| Packaged contents | ZIP CRC/NSIS payload, **433 source /29 embedded comparisons**, notices/fuses pass; `planet-art-zip-verify.log`, `planet-art-artifact-inspection/report.json`. |
| Actual packaged EXE | **136 workflow +14 mission lifecycle +11 restart +7 normal/fullscreen +33 controlled network +5 cache restart**, `packaged-smoke-1789785069305/report.json`. |
| Packaged imports/exports | **28+6 restart**, `packaged-transfer-1789785148299/report.json`. |
| Packaged renderer security | **44 passed**, `packaged-security-1789785156232/report.json`. |
| Defender / dependencies | Custom scan exit 0/no threats, `planet-art-defender.log`; zero known npm audit vulnerabilities, `planet-art-npm-audit.json`. Neither guarantees safety. |

The initial window run `window-smoke-1789784802208` failed a newly added test assumption:
Refresh was legitimately disabled during cooldown, while its position was reachable.
Test corrected to require reachability and focus only when enabled; mission controls still
require enabled/focused/reachable. No cooldown or production behavior weakened. Recorded
`will-quit`, absent Electron/app processes and released test lock were checked before retry.
Initial planet-roll/Armory screenshots were visually inspected; synthetic fixture equipment
is intentionally blank and is not an artwork regression. Final run supersedes its test result.

## Local artifacts

Root: `C:\Users\Chris\HD2CSM-Development\HD2CSM-Source\dist\planet-art`

- Setup: `HD2-Chaos-Slot-Machine-Setup-local-planet-art-win-x64.exe`
  SHA-256: `84252c0c47eb86d1f7267e540f746dde004a901dc6be90e2104aa660f448a3a6`
- ZIP: `HD2-Chaos-Slot-Machine-local-planet-art-win-x64.zip`
  SHA-256: `8b16cd507ad1a67db0cca3f167da5086279e8c4e370c84f6a0708dca1eee0180`
- Runtime: `win-unpacked\HD2 Chaos Slot Machine.exe`
  SHA-256: `cf428405c5f81c92155d8730dd5fc4e1db647617fc41e77763ff796d0f7ffdda`
- ASAR SHA-256: `4b2fcf7ec46759ec837ebcf88d05d39702bdd82369ee15e048b85ed4ee91e117`

Unsigned local preview; internal compatibility version remains 1.1.14 and public label
remains 1.0 Local preview. Installer created/inspected, **not executed**. Native installation,
physical DPI/trackpad/listening, OS resume, long-duration stability and clean Windows
install/uninstall are not newly verified. Public rights/signing/release gates remain open.

## Desktop / cleanup

- Existing Desktop `HD2 Chaos Slot Machine.lnk` now targets
  `scripts/start-planet-art-review.cmd`, verified after save. Same isolated
  `.test-data/mission-owner-review` profile; shortcut not auto-launched for the owner.
- Previous shortcut backup/hash verified in `desktop-planet-shortcut-20260918-223358`.
- **107** superseded basic-mission files archived/hash verified to
  `.test-data/accepted-builds/mission-basics`. Adjacent `mission-basics-move.json` records
  every original/restoration path and hash. Historical launcher/resolver target that exact
  archive, not a newer build. Do not rerun one-off `.test-data/promote-planet-art.ps1`.
- `dist` now contains only installed baseline `installer-shell` and review `planet-art`.
  Nothing permanently deleted; no new Desktop icon, duplicate installer or personal-save writes.
- Installed ASAR remains `f8e05a940da3f200796e7dac55b4166458b7e5c18549726c63e665d7ebcc37e0`.

Next: owner visual review, then resume the bounded remaining faction-specific mission
coverage audit described in `M5_BASIC_MISSION_COVERAGE.md`. This is not the galaxy-map milestone.
