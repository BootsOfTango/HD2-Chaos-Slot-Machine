# M2B second Warbond review — v1.1.5

September 14, 2026. Branch `codex/m2b-warbond-audit-2`, based on local v1.1.4 checkpoint `6441680`. Unpublished, unsigned local preview. The installed app, original runtime folder and personal AppData profiles were not modified.

## Delivered

- Reviewed 17 previously pending acquisitions: four additional Cutting Edge weapons plus its community-supported Localization Confusion booster, and six items each from Democratic Detonation and Polar Patriots. The already-reviewed Blitzer remains unchanged. All 18 equipment members already existed locally; no item or player entitlement was added.
- The three Warbonds now have explicit six-item equipment sets. Each comprises three primaries, a sidearm, a throwable and a booster. No stratagem was added to these sets. Evidence and taxonomy qualifications are in `M2B_CUTTING_EDGE_RESEARCH.md` and `M2B_WARBOND_BATCH2_RESEARCH.md`.
- Corrected Punisher Plasma from Shotgun to Energy, Eruptor from Marksman Rifle to Explosive, and Grenade Pistol from Pistol to Special sidearm. Punisher Plasma's change is officially documented; the latter two current menu categories are community-corroborated, separately from their official acquisition evidence.
- Added descriptive full-label aliases for Adjudicator Rifle, Eruptor Rifle and Thermite Grenade, without renaming IDs or canonical display labels. Existing gear artwork, defaults, histories and saved choices remain compatible.
- Bundled three unmodified official promotional images (two JPEGs and one PNG), with original marks, source URLs, measured dimensions, SHA-256 and attribution. These are not presented as exact in-game Acquisitions covers. Polar Patriots is credited to Dominic Wiggan; the other two articles to Katherine Baskin.
- Added bulk ownership controls to all seven explicitly reviewed Warbond groups in the existing Manual pool management view. Include-all sets owned/included; exclude-all retains ownership; unowned clears both. Actions use the full declared ID/category set despite filtered search, exclude custom/forged-source/shop entries, preserve recovery metadata and refresh existing item/new-gear/Spin views. Incomplete or ambiguous sets cannot be partially changed.
- Acquisition totals: **43 primary-source + 12 community-source + 150 pending = 205 unique entries**. This is catalog-review coverage, not a percentage of the overall roadmap.

The committed `assets/catalog-reviews/2026-09-14-warbonds.json` can be applied idempotently through the existing fact-review script. Older review manifests and the retired-identity archive remain unchanged. This increment adds no dependencies, live-war features or full Armory redesign.

## Checks executed

All application tests used isolated profiles under `.test-data`. The assertion counts below include repeated item/source/import checks; they are not counts of distinct user workflows.

| Check | Result / evidence |
|---|---|
| Baseline | v1.1.4 `npm test`: 110 passed before changes |
| Final units and validators | `npm test`: 126 passed; catalog passed; 230 local picture references / 205 remote metadata or fallback URLs / 0 missing / 7 existing placeholder references |
| Preservation | All 205 ordered IDs, canonical names, slot categories, eligibility defaults, introduced versions, item artwork paths and retired IDs match `6441680`; earlier reviewed acquisition facts remain unchanged |
| Deterministic generation | After initial newline normalization, repeated `python scripts/sync_item_catalog.py` runs leave index/catalog/image-map hashes unchanged |
| Development workflow | `npm run test:electron`: 54 workflow + 8 separate-process restart checks; `.test-data/electron-smoke-1789420168977/report.json` |
| Desktop/browser window behavior | `npm run test:window`: 75 checks; `.test-data/window-smoke-1789420179169/report.json` |
| Packaged normal workflow | `node scripts/run-packaged-smoke.js`: 51 workflow + 8 restart + 7 normal-startup + 14 network/fallback; `.test-data/packaged-smoke-1789420285589/report.json` |
| Packaged new Warbond review | `node scripts/run-packaged-smoke.js --warbonds`: 618 granular integration + 155 separate-process restart + 3 real file-backend checks; `.test-data/packaged-warbonds-1789420251740/report.json` |
| Previous source-review regression | `node scripts/run-packaged-smoke.js --sources`: 808 integration + 167 restart + 3 file-backend; `.test-data/packaged-sources-1789420260458/report.json` |
| Gear/ownership regression | `node scripts/run-packaged-smoke.js --gear`: 81 integration + 10 restart + 3 file-backend; `.test-data/packaged-gear-1789420295761/report.json` |
| Retired-identity regression | `node scripts/run-packaged-smoke.js --dedup`: 131 integration + 28 restart + 3 file-backend; `.test-data/packaged-dedup-1789420305934/report.json` |
| Actual old executable save upgrade | Dedup run additionally executes 18 seed checks in the archived v1.1.3 EXE, then 29 first-boot migration checks in v1.1.5 plus 3 version/backup checks. Original old save bytes remain exactly in an automatic backup; same report's `upgrade` field |
| Build | `npm run build:win` completed: locked Electron 43.3.0 / builder 26.15.3; unsigned NSIS installer and ZIP |
| Package integrity | `python scripts/verify_win_zip.py`: 81 ZIP entries, required runtime/review manifests/all 205 mapped item images and new covers present; forbidden development/secrets patterns absent; embedded installer payload and checksum sidecars verified |
| Source/package parity | 15 ASAR files match source bytes: index; catalog-state, catalog-sources, catalog-ui JS/CSS; item catalog/image map; all three review manifests; cover provenance/attribution; three new cover files. External `README-FIRST.txt` also matches. Packaged version is 1.1.5 |
| Signing | PowerShell Authenticode reports installer `NotSigned` |
| Visual inspection | Viewed all three original art files and all three final packaged Warbond-panel captures; corresponding art, full-set warning/counts, ownership controls and item rows are readable |

### New focused coverage

Eight ownership unit tests cover exact trusted catalog membership, unavailable/duplicate/unreviewed sets, custom and false-provenance exclusions, mixed ownership, unrelated recovery metadata, deduplicated bundled loading/failure, accessible labels and complete-set counts. Eight batch-review tests cover the 17 evidence records, three exact equipment sets, three category/alias changes, baseline preservation, pure/idempotent review application, 170 name-only/stable-ID import/flag combinations plus three full-label alias cases, and image signatures/native dimensions/hashes.

The packaged Warbond test reads the actual packaged catalog, validates each newly reviewed acquisition and all seven reviewed sets, decodes item names/aliases/covers offline, and creates custom same-label records with copied source claims. Real renderer controls are clicked for each reviewed Warbond through enable → filtered exclude → filtered enable → unowned → individual ownership/include changes. It verifies that hidden members are affected only by the intended full-set action, unrelated/custom rows never are, existing ownership views agree, and history/metadata survive imports and restart. Native file pickers are not clicked: the exact renderer export payload is round-tripped through the real file storage backend in another isolated directory.

Existing workflow tests exercise Spin animations, locks/special rerolls, current faction-constrained planet rerolls, legacy mission families, pending/finalized Results, scoring/Major Order penalty, Compare/radars/search, Armory and Rank. Network cases cover connected campaigns plus controlled offline/429/malformed/empty/timeout/recovery behavior. The requested all-faction planet reroll and five-minute refresh are still M3 work.

Window tests exercise real fullscreen state, F11/toolbar/Escape, minimum window bounds, desktop canvas, modal reachability/focus and injected Space-drag. Browser behavior uses an isolated no-preload renderer. Display scaling cases emulate page zoom; they do not validate physical Windows DPI. WebAudio initialization/output passed, not an audible listening test.

The old-to-new EXE test is a save upgrade, **not an installer upgrade**. It writes with the actual v1.1.3 runtime into an isolated profile before launching v1.1.5 there. It never reads the user's personal save. v1.1.4 fact/default compatibility is independently compared with its Git checkpoint and exercised through imports.

## Artifacts

Directory: `C:\Users\Chris\Desktop\HD2CSM-Source\dist`

| File | Bytes | SHA-256 |
|---|---:|---|
| `Helldivers-2-Chaos-Slot-Machine-Setup-v1.1.5-win-x64.exe` | 130499496 | `d59b39791afd1c02c16317d73a2797267c25a33fc5b9de91a93c1e5bd3afac5d` |
| `Helldivers-2-Chaos-Slot-Machine-v1.1.5-win-x64.zip` | 170042816 | `b74102851f6e2a31c996f4dcd6b9965e64a6764894a53b0567303b3d3b120dc3` |

Embedded installer payload: 130168232 bytes. The installer contains the runtime; users need no development tools or install-time runtime download. The tested program is `dist\win-unpacked\Helldivers 2 Chaos Slot Machine.exe`; its companion files must stay together.

Previous v1.1.1–v1.1.4 installers/ZIPs and unpacked archives remain intact. The v1.1.4 runtime was copied to `dist\preview-v1.1.4` before the new build. The safe review launcher is `scripts\start-local-preview.cmd`, which uses `dist\review-profile-v1.1.5`, not personal AppData.

## Troubleshooting / unverified work

- Direct community-wiki retrieval for Localization Confusion returned 403; indexed procurement text was available. It is explicitly marked community-source. No fake primary confirmation or current game-stat claims were introduced.
- The Polar Patriots original is PNG, not JPEG; its unusual official `2084` path and Cutting Edge's `2054` path are preserved verbatim. Initial generalized contributor metadata was corrected to the actual Polar Patriots byline before building.
- A transient unit count mismatch occurred while the new manifest was still being applied. The final 126-test suite passed after the completed batch. Initial ad-hoc preservation command had a syntax typo, then a first regeneration normalized mixed newlines; corrected repeated semantic/hash checks passed.
- The first ASAR parity check incorrectly looked for `README-FIRST.txt` inside ASAR. Builder intentionally puts it beside the EXE. Corrected checks verify the 15 ASAR files and separate README bytes successfully; no packaged file was missing.
- Development shutdown logged GPU command-buffer warnings after checks passed. Final packaged runs reported no uncaught renderer errors. This does not certify physical GPU or multi-monitor behavior.
- No installer installation/upgrade/uninstall or shortcut registration test was performed for v1.1.5. Physical DPI/trackpad, native file dialogs and audible sound remain hands-on acceptance gates. Public signing and third-party artwork-rights review remain outstanding.
- 150 acquisition records and remaining Warbond art remain queued. M3 live-war/all-faction planets, M4 full visual Armory, M5 planet-aware missions, M6 galaxy map and M7 final integration/publication are not implemented here. Nothing was published and no recurring background work was scheduled.

## Owner review / next increment

Use the isolated launcher. In Armory expand Manual pool management, choose Source / Warbond-first and search Cutting Edge, Democratic Detonation or Polar Patriots. Inspect the image and sources; try full-set ownership/inclusion, narrow the search to one item and confirm the explicit full-set warning, then restart. A fresh review profile does not copy personal saves; the test captures contain intentional fixture choices/custom rows that will not appear in your fresh profile.

Next: a bounded audit of remaining Warbond-linked stratagems, starting with Control Group, Servants of Freedom and Borderline Justice, using primary evidence where available and retaining explicit uncertainty. Review their unassigned entries rather than granting ownership based on existing names. Do not redo this batch or begin the live-war/map rewrite concurrently.
