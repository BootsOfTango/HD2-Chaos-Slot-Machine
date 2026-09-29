# M2B duplicate consolidation — v1.1.4

September 14, 2026. Branch `codex/m2b-deduplicate-stratagems`, based on local v1.1.3 checkpoint `a434de2`. Local review only; no push, tag or release. The installed app, old runtime folder and personal AppData profiles were not modified.

## Scope delivered

- Consolidated Wasp into StA-X3 W.A.S.P. Launcher, and EMS Strike into Orbital EMS Strike. EMS Mortar Sentry remains independent. Each equipment identity now occupies one eligible roll-pool entry.
- Retained the full-name stable IDs, canonical artwork/defaults and shortened-name aliases. Retired IDs migrate explicitly. Both old artwork files and complete retired catalog records remain recoverable in the project.
- Ownership conflicts use canonical ID, retired ID, canonical name, then unique alias; first supplied row wins ties. Flags are never OR-combined. Original replaced records and winning retired records remain in `legacyAliasRecords`, including pre-ID name-only exports.
- Added a collapsed Armory explanation showing current choices and retained original records. Existing ownership controls remain authoritative.
- Historical cards, fingerprints, locked stats, notes and scores are not rewritten by gear migration. Derived usage analytics aggregate aliases and count each equipment identity once per historical run, including old runs containing both former duplicates.
- The active catalog has 205 unique entries: 27 primary-source reviewed, 11 community-source reviewed, 167 pending. The two-row reduction removes already-reviewed duplicates, not review evidence. No broader catalog audit was performed in this increment.

See `CATALOG_IDENTITY_MIGRATION.md` for the exact policy and `assets/catalog-reviews/2026-09-14-identity-merges.json` for the archived facts. The original 35-row source-review batch remains unchanged.

## Executed checks

All application runs below used isolated profiles. Counts are assertions, often repeated across catalog entries and import stages, not distinct user workflows.

| Check | Result / local evidence |
|---|---|
| Baseline | 83 unit tests passed before this increment |
| Final unit tests / validators | `npm test`: 110 passed; catalog passed; 227 local picture references / 205 remote metadata or fallback URLs / 0 missing / 7 existing placeholder references |
| Preservation | Compared with `a434de2`: all 205 surviving ordered IDs, names, categories, introduced versions, eligibility defaults and artwork paths retained; only the two retired rows removed from active data |
| Generator | `python scripts/sync_item_catalog.py` run twice; index, catalog and image-map SHA-256 unchanged on the second run |
| Development workflow | `npm run test:electron`: 54 workflow + 8 separate-process restart checks; `.test-data/electron-smoke-1789417878004/report.json` |
| Window/browser behavior | `npm run test:window`: 75 checks; `.test-data/window-smoke-1789417888180/report.json` |
| Packaged normal workflow | `node scripts/run-packaged-smoke.js`: 51 workflow + 8 restart + 7 normal-startup + 14 network/fallback checks; `.test-data/packaged-smoke-1789418101789/report.json` |
| Packaged gear regression | `node scripts/run-packaged-smoke.js --gear`: 81 integration + 10 restart + 3 file-backend export/import checks; `.test-data/packaged-gear-1789418101789/report.json` |
| Packaged source regression | `node scripts/run-packaged-smoke.js --sources`: 808 granular mapping/import/render + 167 restart + 3 file-backend checks; `.test-data/packaged-sources-1789418101788/report.json` |
| Packaged duplicate migration | `node scripts/run-packaged-smoke.js --dedup`: 131 integration + 28 restart + 3 file-backend checks; `.test-data/packaged-dedup-1789418101794/report.json` |
| Actual old-to-new first boot | Same dedup command: 18 seed checks in the real v1.1.3 EXE, 29 first-boot checks in v1.1.4, plus 3 save-version/backup assertions. Original v1.1.3 save bytes preserved exactly in the automatic backup; same report's `upgrade` field |
| Windows build | `npm run build:win` completed with locked Electron 43.3.0 / builder 26.15.3; application version changed, no dependency changes |
| Artifact verification | `python scripts/verify_win_zip.py`: 81 ZIP entries, required runtime, all 205 mapped images and identity-review manifest present; forbidden development/secrets patterns absent; substantial embedded installer payload; checksum sidecars generated |
| Source/package parity | Ten files match ASAR bytes: index, catalog-state, catalog-sources, catalog-ui JS/CSS, item-catalog, item-images, both review JSONs and official-image provenance. Packaged metadata is v1.1.4 |
| Signing | PowerShell `Get-AuthenticodeSignature`: installer `NotSigned` |
| Visual inspection | Inspected final `duplicate-recovery.png` and `source-audit.png`: readable current excluded/unowned choices versus retained included/owned originals, EMS Mortar distinction, and 27/11/167 counts |

### Upgrade and compatibility coverage

The dedup test reconstructs old 207-row imports, canonical-versus-retired flag conflicts, retired-only records, ID-only/misleading names, pre-ID name-only exports and repeated imports. It verifies complete recovery arrays, unrelated player settings, custom data and normalized historical cards. It samples 64 actual loadout selections, each yielding four distinct canonical stratagems, and decodes both canonical and legacy-name local images offline.

The actual executable upgrade is separate from import testing: the archived `dist\preview-v1.1.3\Helldivers 2 Chaos Slot Machine.exe` writes an old-format save into `.test-data\packaged-dedup-1789418101794\upgrade-user-data`; v1.1.4 opens that same isolated profile. Assertions inspect automatic startup migration before any import call. The original bytes are also retained as `original-v1.1.3-state.json` in that evidence directory. This is a real packaged save upgrade, **not an installer upgrade test**.

Unit tests additionally cover deep-frozen inputs/non-mutation, nested recovery deduplication, same-priority conflicts, absent versus empty categories, invalid/cross-category/colliding retired IDs, exact retired-catalog snapshots, merge replay and refusal to resurrect retired rows through the older review script.

The existing packaged workflow checks offline first launch, full reel settling, locks/special rerolls, current faction-constrained planet rerolls, mission families, pending/finalized Results, scoring and Major Order penalty, Compare/radars/search, Armory ownership/artwork/search and Rank. Network checks cover connected campaigns and controlled failures/fallback/recovery. No all-faction planet feature or periodic refresh was added here.

File-backend round trips export the packaged renderer's exact supported payload and import/reload it in another isolated directory. Packaged native file pickers were not clicked. WebAudio context/output initialization passed; audible sound was not checked. Window tests use real Electron fullscreen state and minimum bounds, keyboard/modal/Space-drag tests and an isolated browser renderer; scaling cases use page zoom, not physical Windows DPI.

## Final artifacts

Directory: `C:\Users\Chris\Desktop\HD2CSM-Source\dist`

| File | Bytes | SHA-256 |
|---|---:|---|
| `Helldivers-2-Chaos-Slot-Machine-Setup-v1.1.4-win-x64.exe` | 129068333 | `c4fa5b344054e2d6146e20a08bf46809f86802481fa97567e0d0ab197273d766` |
| `Helldivers-2-Chaos-Slot-Machine-v1.1.4-win-x64.zip` | 168612148 | `7ef48dc5931ffa5576f762404c30a0de7780e574cb870ad4bbaeff5a1d7e89c9` |

Installer embedded-payload overlay: 128737069 bytes. The builder embeds the runtime; no Node/npm/Python or install-time runtime download is needed. The application was actually launched from `dist\win-unpacked\Helldivers 2 Chaos Slot Machine.exe`; keep its companion files together.

Prior installers/ZIPs remain unchanged. Unpacked v1.1.1, v1.1.2 and v1.1.3 previews remain in `dist\preview-v1.1.x`. The current safe launcher is `scripts\start-local-preview.cmd`, using `dist\review-profile-v1.1.4`, not personal AppData. The installer was built and inspected, but not installed over the user's app.

## Troubleshooting and remaining gates

- The packaged test fixture initially referenced an `assetPath` field absent from generated saved defaults; it now resolves artwork through the real image lookup. No runtime field was added to satisfy that mistaken test assumption.
- Development shutdown emitted GPU command-buffer warnings after checks passed. Successful packaged runs reported no uncaught renderer errors. Physical GPU/multi-monitor behavior is not certified.
- Installer integration, upgrade/uninstall and shortcut registration were not exercised for v1.1.4. Physical Windows scaling/trackpad, native file pickers and audible sound remain hands-on checks.
- Acquisition review for 167 records and remaining Warbond artwork is still pending. Existing community-versus-primary source distinctions and the credited Eagle Gas Airstrike trace remain unchanged. Third-party artwork rights and code-signing credentials remain public-release gates.
- M3 live-war service/all-faction planets, M4 visual Armory, M5 planet-aware missions, M6 galaxy map and M7 final integration/publication remain queued. No automatic background work was scheduled and nothing was published.

For review, run the isolated launcher, open Armory → Duplicate cleanup, search both old/new names in Manual pool management, toggle canonical ownership/inclusion and restart. A new review profile correctly has no recovered records until an old export is imported; it does not copy personal saves automatically. Next implementation work is another bounded source-audit batch, not a concurrent map/mission rewrite.
