# M2B first source-audit increment — v1.1.3

September 14, 2026. Branch `codex/m2b-source-audit`, based on M2A checkpoint `bc59ac0`. Local review only: no push, tag or release. The old runtime folder, installed app and personal AppData saves were not changed.

## Scope delivered

- Applied a fact-only review batch to 35 of the 202 legacy entries: 23 primary-source and 12 community-source acquisition reviews. Including M2A's five additions, the 207-record catalog now reports 28 primary-source reviewed, 12 community-source reviewed and 167 pending. These are acquisition-review counts, not a percentage of the whole roadmap or a complete/current-game inventory certification.
- Corrected three CQC display names while preserving their stable IDs, old aliases, image paths, player ownership and historical card labels. Both derived Armory analytics consumers now aggregate old/new names using category-scoped identities; saved cards and scores are not rewritten.
- Distinguished Warbond, Superstore, starter, edition, gift, campaign and requisition sources. Audited equipment sets for Freedom's Flame, Chemical Agents and Urban Legends; grouped the three reviewed Killzone primaries under Righteous Revenants. Separately documented community corroboration and taxonomy limitations.
- Bundled three original official promotional JPEGs with source pages, dates, dimensions, SHA-256 and rights notes. These are promotional scenes, not exact in-game Acquisitions covers.
- Added per-item source-review labels and a compact audit summary in the existing Armory. This is not the M4 visual Armory redesign. Unknown custom items retain their chosen grouping but cannot import a fake verified-source badge.
- Made image regeneration identity-aware, kept reviewed stratagem rim categories, and removed stale placeholder flags only when existing non-placeholder artwork bytes matched the recorded hash. No existing image was replaced.

Source evidence: `M2B_WEAPON_SOURCE_RESEARCH.md`, `M2B_STRATAGEM_SOURCE_RESEARCH.md`, `assets/catalog-reviews/2026-09-14.json`, and `assets/warbonds/official/provenance.json`.

## Executed checks

| Check | Result / local evidence |
|---|---|
| Unit tests and validators | `npm test`: 83 tests passed, catalog passed, 229 local references / 207 remote metadata URLs / 0 missing / 7 existing rank/Warbond placeholder references |
| Baseline preservation | Compared with Git checkpoint `bc59ac0`: all 207 ordered IDs, types, introduced versions, eligibility defaults, image paths, artwork hashes and provenance fields preserved; every recorded artwork hash matches local bytes; no category-scoped alias collisions |
| Generator determinism | Ran `python scripts/sync_item_catalog.py` twice; index, catalog and image-map SHA-256 unchanged on second run |
| Development workflow | `npm run test:electron`: 54 workflow + 8 separate-process restart checks; `.test-data/electron-smoke-1789416277794/report.json` |
| Window/browser behavior | `npm run test:window`: 75 checks; `.test-data/window-smoke-1789416287992/report.json` |
| Packaged normal workflow | `node scripts/run-packaged-smoke.js`: 51 workflow + 8 restart + 7 normal-startup + 14 network/fallback checks; `.test-data/packaged-smoke-1789416421526/report.json` |
| Packaged gear regression | `node scripts/run-packaged-smoke.js --gear`: 68 integration + 10 restart + 3 real file-backend export/import assertions; `.test-data/packaged-gear-1789416431721/report.json` |
| Packaged source audit | `node scripts/run-packaged-smoke.js --sources`: 766 granular mapping/import/render assertions + 130 restart assertions + 3 real file-backend export/import assertions; `.test-data/packaged-sources-1789416555002/report.json` |
| Windows artifacts | `npm run build:win` completed with locked Electron 43.3.0 / builder 26.15.3; no dependency changes |
| ZIP/installer checks | `python scripts/verify_win_zip.py`: 81 ZIP entries, required runtime/new source helper/review batch/three JPEGs/all 207 mapped images present; forbidden development/secrets patterns absent; substantial embedded NSIS payload; checksum sidecars generated |
| Source/package parity | Nine source files equal ASAR bytes: index, catalog-state, catalog-sources, catalog-ui JS/CSS, item-catalog, item-images, review JSON, official-image provenance |
| Signing | PowerShell Authenticode: installer `NotSigned` |
| Visual inspection | Inspected packaged source-summary and all three Warbond-group captures from the final source run; covers and review labels visible; existing scrolling layout retained |

The source-audit count is deliberately granular and repetitive across 35 records and multiple import stages. It is not 896 distinct user workflows. All application tests use isolated profiles and never read personal saves.

### Coverage details

- Existing workflow tests exercise offline first launch and full reel settling, locks/special rerolls, faction-constrained planet rerolls (unchanged), mission family selection, pending/finalized Results, Major Order scoring penalty, Compare/radars/search, Armory filters/toggles/artwork, Rank, and exact saved values after restart.
- Network cases exercise a connected campaigns response plus controlled offline, HTTP 429, malformed/empty/timeout and recovery behavior. No five-minute refresh or cross-faction planet feature was added in this increment.
- New source tests verify all 207 identity/ownership tuples; all 35 acquisition mappings and evidence tiers; three name-only and stable-ID migration paths; arbitrary legacy item metadata; historical card labels, fingerprints and score/stat snapshots; repeated import idempotence; and canonical/legacy image lookups offline.
- The source and gear runs export the exact packaged-renderer payload through the real storage backend, import into another isolated directory and reload it exactly. Native packaged file-picker UI is not clicked. Development IPC tests use stubbed file-picker responses.
- Window tests cover real Electron fullscreen state, F11/toolbar/Escape, 640x480 native bounds, 1280-CSS-pixel desktop canvas, modal reachability/focus and injected Space-drag. Browser behavior is checked with an isolated no-preload renderer. DPI cases emulate page zoom, not physical Windows display scaling.
- WebAudio initialization/output is checked; no listening test was performed.

## Final artifacts

Directory: `C:\Users\Chris\Desktop\HD2CSM-Source\dist`

| File | Bytes | SHA-256 |
|---|---:|---|
| `Helldivers-2-Chaos-Slot-Machine-Setup-v1.1.3-win-x64.exe` | 129067467 | `dc88a6e28d7fef11a42189cf99f527dae032666ff3684a245f560591de28e0d1` |
| `Helldivers-2-Chaos-Slot-Machine-v1.1.3-win-x64.zip` | 168610108 | `1d21d02d50eb7219e8a490869169a7427e3a3d18cd182b55234c69e4a7231d6f` |

Installer embedded-payload overlay: 128736203 bytes. The builder embeds the runtime; users do not need Node/npm/Python or an install-time internet download. The actual packaged program was launched from `dist\win-unpacked\Helldivers 2 Chaos Slot Machine.exe`; keep its companion files together.

Previous installers and ZIPs remain untouched. The v1.1.2 unpacked runtime was copied to `dist\preview-v1.1.2`; the older v1.1.1 archive also remains. The current safe launcher is `scripts\start-local-preview.cmd`, using `dist\review-profile-v1.1.3` instead of personal AppData.

## Troubleshooting and unverified gates

- A read-only review caught split old/new-name analytics; fixed and covered by five regression tests before the final build.
- Before runtime execution, the new test fixture was corrected to use overall versus batch audit counts and image mappings rather than nonexistent saved `assetPath` fields. Historical fixtures now use the actual normalized schema. No runtime change was made merely to satisfy those assumptions.
- Initial source capture passed functional checks but did not open Manual pool management. A subsequent capture-only run selected the first Urban Legends search match, which was correctly a separate Superstore group without Warbond artwork, and failed at `.test-data/packaged-sources-1789416524627`. The harness now opens the real control, selects the exact group heading, checks visibility and decodes its image. Final complete rerun passed at the path above.
- Initial ASAR parity command used forward-slash nested paths and raised a lookup error for the review JSON. Windows-normalized paths verified all nine files; no packaged file was missing.
- Development shutdown logged GPU command-buffer warnings after passing checks; successful packaged runs reported no uncaught renderer error. This does not certify physical GPU or multi-monitor behavior.
- No installation over the existing app, installer upgrade/uninstall, or shortcut registration test was performed for v1.1.3. Running the packaged EXE is not installation verification. Physical DPI/trackpad, native dialogs and audible sound remain owner/hardware checks.
- Two duplicate pairs remain: `stratagem:wasp` / `stratagem:sta-x3-w-a-s-p-launcher`, and `stratagem:ems-strike` / `stratagem:orbital-ems-strike`. They can still affect roll weighting. Next work must consolidate them with explicit legacy-ID migration and recoverable ownership-conflict policy; do not delete records casually. EMS Mortar Sentry is distinct.
- Acquisition review for 167 records and other Warbond images remains pending. Community verification must not be upgraded to official without evidence. The Eagle icon remains a credited community tracing. Third-party artwork redistribution rights and Windows signing credentials remain public-release gates.
- M3 live-war service, M4 visual Armory, M5 missions, M6 galaxy map and M7 final upgrade/integration/publication remain queued. This local preview does not implement them.

## Owner review

Use the isolated launcher. In Armory, inspect Source audit, then expand Manual pool management, choose Source / Warbond-first and search Freedom's Flame, Chemical Agents or Urban Legends. Confirm art and source distinctions; try old CQC-name searches, Owned/Enabled controls and restart. Report hardware/fullscreen/audio feedback before publication. No automatic background work or scheduled automation was created.
