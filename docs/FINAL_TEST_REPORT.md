# Windows validation report — Helldivers 2 Chaos Slot Machine v1.1.0

Verified locally on Windows on September 13, 2026. Build branch: `codex/windows-desktop-build`. The owner subsequently requested publication as HD2CSM v1.1.0; repository history and the GitHub Release record publication status.

Updated after the user's missing-artwork report: the prior build's image-existence checks allowed placeholders and simplified booster substitutes. This build bundles 111 source weapon/booster images and adds per-category source/hash checks plus offline decoding and the four reported-slot checks in the installed EXE. The artifact hashes below supersede the earlier build. See `docs/ITEM_ARTWORK.md` for provenance, including community-traced booster icons.

## Delivered artifacts

- Installer: `dist/Helldivers-2-Chaos-Slot-Machine-Setup-v1.1.0-win-x64.exe`
- Portable ZIP: `dist/Helldivers-2-Chaos-Slot-Machine-v1.1.0-win-x64.zip`
- Installed program: `%LOCALAPPDATA%\Programs\Helldivers 2 Chaos Slot Machine\Helldivers 2 Chaos Slot Machine.exe`
- Save folder: `%APPDATA%\Helldivers 2 Chaos Slot Machine`

The installer is a self-contained, offline NSIS installer with the Electron runtime. Users do not need Node.js, npm, Git, or other development tools. Matching SHA-256 sidecars are in `dist`.

| Artifact | Bytes | SHA-256 |
| --- | ---: | --- |
| Installer | 126194223 | `89aefd80a0c63f2efe0d79c424653d07546e93b70d292745c7ac2d1b5125fea4` |
| ZIP | 165731556 | `64aee1796a837c0e2d325b97d87e0efed0b48ea83e0ee19a809a248b171fc970` |

## Checks run and results

| Check | Observed result |
| --- | --- |
| Dependencies | `npm ci` completed with the lockfile; final `npm audit --json` reported zero known vulnerabilities. |
| Automated unit checks | `npm test`: 38 tests passed, followed by catalog and asset validation. |
| Development desktop | `npm run test:electron`: 54 workflow/artwork, 8 separate-process restart, and 14 network assertions passed. |
| Installed application | `node scripts/run-packaged-smoke.js` targeting the installed EXE: 51 workflow/artwork, 8 restart, and 14 network assertions passed (73 total). |
| Reported artwork regression | All 50 primaries, 23 sidearms, 20 throwables, and 18 boosters decode offline. BR-14 Adjudicator, CQC-19 Machete, G-31 Arc, and Increased Reinforcement Budget were rendered in the actual installed slots and captured in `reported-artwork.png`. |
| Spin and locks/rerolls | Actual reel animations, special rerolls, lock guards, faction-matched planets, planet rerolls, mission modes, and pending Results passed. |
| Results and scoring | Finalizing entered statistics, pending-run exclusions, Major Order failure at 75% score/radar weighting, and untruncated raw totals passed. |
| Compare | Two cards, radars, overlay, search, correct deaths/stims, and no mutation of saved cards passed. |
| Armory and Rank | Ownership toggles, bundled artwork, search, booster analytics, ranking, and detail rendering passed. |
| Imports/exports | Actual preload/IPC exported JSON, recovery-backed Clear All, and reimport restored cards and settings. Native dialog paths were supplied by the development test harness; see limitations below. |
| Persistence | New processes restored exact card identities, player name, ownership, scoring, Results, Compare, and Rank using isolated profiles. |
| First launch offline | Fresh empty profiles generated complete loadouts and matching bundled planets with external requests blocked from startup. |
| Live planets and fallback | Actual API returned 34 active planets at 12:55:42 AM Eastern. Controlled success, offline, rate limiting, malformed/empty responses, timeout, missing faction, and recovery passed. Cached fallbacks show their date; bundled data is identified as non-live. |
| Save migration | Valid, missing, damaged, backup-recovery, and already-migrated cases passed. Browser-key tests preserve legacy data and prefer existing new data. Legacy JSON import remains supported. |
| Build and artifact inspection | `npm run release:win` passed. `python scripts/verify_win_zip.py` reverified both artifacts, all 111 source-artwork paths inside the ZIP's ASAR, runtime/asset presence, absence of forbidden development/secrets paths, checksums, and 125862959 bytes of embedded installer payload. Installer and ZIP naming match the workflow. |
| Installation | Silent per-user installation exited 0. Installed EXE and application ASAR hashes matched the final unpacked build. Desktop and Start menu shortcuts point to the renamed installed EXE. |
| Normal Windows launch | Before the artwork correction, the installed application was opened outside the test harness; Windows accessibility inspection confirmed the full window name, HD2CSM header, and all main tabs. After the correction, the installed EXE was launched and exercised with an isolated test profile. |
| Branding | New yellow/black HD2CSM emblem used by header and Windows resources; 16/32/48/256-pixel ICO entries verified. The icon extracted from the installed EXE was visually inspected. Original artwork remains recoverable. |

The normal application migrated the existing user's save from the legacy profile without warnings and displayed the previously saved card. The original legacy `state.json` and its archived copy were confirmed byte-identical by SHA-256 comparison. Destructive workflow tests used only isolated `.test-data` profiles, not that user save. Actual saves and test profiles are excluded from the source repository and downloads.

## Reproducible evidence

Paths relative to the unchanged repository folder:

- Development report: `.test-data/electron-smoke-1789275148942/report.json`
- Installed-EXE report: `.test-data/packaged-smoke-1789275302750/report.json`
- Installed renderer screenshots: `.test-data/packaged-smoke-1789275302750/spin.png`, `results.png`, `compare.png`, `items.png`, `rank.png`, and `reported-artwork.png`.
- Test phase reports and process logs are stored alongside these reports. These generated test artifacts are intentionally ignored by Git.
- Artwork provenance and icon preparation are documented in `docs/BRANDING.md`.

The installed report identifies application version 1.1.0. The development runner reports Electron's version when launched directly through its test entry point; this is not the packaged application's version metadata.

## Remaining limitations and release requirements

- Installer and EXE are intentionally **unsigned builds** (`NotSigned`). Windows may warn. The owner requested sharing this tested build with an explicit unsigned warning. A signed release still requires publisher identity validation and signing credentials, followed by a successful signed build and timestamped Authenticode verification. See `docs/RELEASE.md`. No signed CI release was executed.
- Audio initialization and a running WebAudio output context passed; physical speaker output was not verified by listening.
- Native export/import file-picker interaction was not manually driven in the installed copy. The actual preload/IPC import/export implementation was exercised in the development app with dialog paths stubbed.
- The ZIP's packaged contents and checksums were verified; a separately extracted ZIP instance was not independently exercised through the full workflow. The installed application was exercised through that workflow.
- Renderer screenshots and native accessibility inspection were used. Native Windows screenshot capture was unavailable in this environment; this was not a complete manual Windows UI inspection.
- All Windows ICO entries are present. At 16 pixels the emblem is recognizable, but the full six-character text is too small to promise comfortable reading; lettering is clearer at 32 pixels and above.
- Asset validation found no missing local files. Seven placeholder references remain for rank tiers/warbond fallback artwork; none remain for primaries, sidearms, throwables, or boosters.
- Browser storage migration has unit coverage; a separate external-browser end-to-end session was not run.

No blocking functional failure was observed in the executed tests. A test pass covers the scenarios above, not every possible Windows configuration or gameplay data combination.
