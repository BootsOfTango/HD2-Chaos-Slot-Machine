# M2A local preview evidence — v1.1.2

September 13, 2026. Branch `codex/m2-catalog-ownership`, based on M1 checkpoint `0d215d0`. No push, tag or public release. The application installed before this session and personal AppData saves were not changed.

## Scope

First part of M2 only: five opt-in additions, source-attributed local artwork/cover, stable IDs and aliases, independent ownership/inclusion, compatibility migration, a compact review panel, and safe custom Add behavior. Catalog now has 207 gear records (202 pre-existing + 5 new). Existing source assignments are explicitly marked unverified pending M2B; this report does not certify every Warbond association or a complete current-game inventory.

The existing Spin, Results, Compare, Rank, scoring and M1 fullscreen layout remain. There is no new war service, all-faction planet selection, full visual Armory, mission eligibility engine or galaxy map in this increment.

## Executed checks

| Check | Result and evidence |
|---|---|
| Unit tests and validation | `npm test`: 66 tests passed; catalog validation passed; 226 local image references, 207 remote metadata/fallback URLs, 0 missing assets, 7 existing rank/Warbond placeholder references |
| Migration engine | 19 unit cases: default/legacy/missing/disabled groups, ID/name/alias priority, contradictory ownership, duplicate recovery, custom/future IDs, malformed data, idempotence, independent flags and browser UMD entry |
| Catalog regeneration | Ran `python scripts/sync_item_catalog.py` twice; second-run hashes of index, catalog and image mappings unchanged. Corrected artwork, aliases, source metadata and opt-in defaults preserved |
| Development workflow | `npm run test:electron`: 54 workflow + 8 separate-process restart checks. `.test-data/electron-smoke-1789339728637` |
| Window and browser-layout integration | `npm run test:window`: 75 checks passed on final runtime. `.test-data/window-smoke-1789340308861/report.json`; actual fullscreen/input/640×480 bounds, page-zoom emulation and isolated no-preload browser responsiveness |
| Real packaged app | `node scripts/run-packaged-smoke.js`: 51 offline workflow + 8 separate-process restart + 7 normal startup + 14 network/fallback checks. `.test-data/packaged-smoke-1789339876809/report.json` |
| Packaged new-gear path | `node scripts/run-packaged-smoke.js --gear`: 68 integration + 10 separate-process restart checks, network blocked from launch, plus 3 file-backend roundtrip assertions. `.test-data/packaged-gear-1789340218926/report.json` |
| Windows build | `npm run build:win`: final x64 offline NSIS installer and ZIP built successfully with locked Electron 43.3.0 / builder 26.15.3 |
| Payload verification | `python scripts/verify_win_zip.py`: all 207 item image mappings, new catalog/UI assets, attribution, Warbond cover and required Electron runtime present; forbidden development/secrets patterns absent; embedded installer payload verified and checksum sidecars written |
| Source-to-package match | Extracted ASAR buffers match working-source SHA-256 for index, catalog-state, catalog-ui JS/CSS, item-catalog and item-images (6 files) |
| Signing | PowerShell Authenticode: installer `NotSigned` |
| Visual inspection | Final packaged new-gear panel and its lower controls inspected using renderer captures; all six additions/cover decode offline, including the documented community-traced Eagle SVG |

No dependencies were added in M2A; only the package/lockfile application version changed. The prior zero-known-vulnerability audit belongs to M1 and was not repeated as a new M2A security assessment.

### New-gear integration coverage

- Fresh installs exclude all five additions. Marking Owned alone does not enable inclusion; clearing ownership disables inclusion. The Warbond bulk action affects exactly four new entries and leaves Eagle/legacy flags unchanged.
- A forced eligible primary pool rolls the new rifle; all-empty gear pools produce no loadout and display an actionable warning, without drawing excluded gear.
- Legacy 202-item imports retain every eligibility flag; name aliases, stable-ID conflicts and repeated imports preserve custom metadata/recovery records and historical cards byte-for-byte after existing normalization.
- Five real custom Add controls create immediate stable IDs and explicit ownership. Repeat custom/canonical/alias Add attempts are rejected without changing flags or roll weighting.
- Browser-format JSON payload and desktop-envelope parsing/serialization preserve ownership and review status; actual desktop storage save/load and a separate packaged process restore every supported field. These serialization tests do not click the browser's download UI or packaged native file picker.
- A separate real storage-backend export writes the exact packaged-renderer payload to `gear-export.json`, verifies its application version/data, imports it into another isolated directory and reloads it exactly. This is file-backend coverage, not packaged file-picker clicking.
- Review dismissal, owned-but-excluded campaign reward, custom entries and historical Results survive restart.

### Existing workflow coverage

Spin/reel completion, locks, special rerolls, current faction-constrained planet behavior, mission family selection, pending/finalized Results, MO scoring penalty, Compare/radars/search, Armory toggle/search/artwork, Rank and exact restart values passed. The connected API test and controlled offline/429/invalid/empty/timeout/recovery cases passed; this does not implement the future periodic refresh policy. WebAudio context and output initialization passed, but nobody listened to audio during automation.

Development import/export uses real IPC/storage handlers with file-picker answers stubbed. Packaged native file-picker interaction remains untested. Informational first-save reminders are pre-acknowledged only in isolated test fixtures; normal packaged fullscreen startup is separately tested with automation mode disabled.

## Final artifacts

Directory: `C:\Users\Chris\Desktop\HD2CSM-Source\dist`

| Artifact | Bytes | SHA-256 |
|---|---:|---|
| `Helldivers-2-Chaos-Slot-Machine-Setup-v1.1.2-win-x64.exe` | 128243589 | `cfda66400868a9d87fb224618dd1930de207b84daeca30a4b2480acc07098ed0` |
| `Helldivers-2-Chaos-Slot-Machine-v1.1.2-win-x64.zip` | 167779729 | `fd62d1fc1eea450e729339b3a41af97f0b063edd2af5781a77200a0dd7ed3705` |

Installer embedded payload: 127912325 bytes. No Node/npm/Python or download-at-install runtime is needed. The packaged app was launched from `dist\win-unpacked`; do not move only its EXE away from companion files. Prior v1.1.1 installer/ZIP and an archived unpacked directory remain available locally.

## Troubleshooting and limitations

- Early test-only failures were corrected: the old Armory selector clicked a newly unowned/disabled first item; the initial gear fixture expected a placeholder loadout instead of the new explicit null-on-empty guard. Both final workflow/gear runs pass.
- Screenshot inspection exposed oversized inherited Armory text in the new panel; scoped CSS corrected its sizing and improved item contrast without editing source artwork or redesigning the rest of Armory.
- Initial final window runs stalled after desktop/DPI-emulation checks at the hidden browser case (`.test-data/window-smoke-1789339739068` and `window-smoke-1789339984127`). A pre-document alert hook removed reliance on the unreliable reminder-suppression flag, but protocol initialization itself then stalled. Bounded stage diagnostics (`window-smoke-1789340256425`) isolated `Page.enable` before the hidden renderer was initialized. The harness now first navigates its isolated window to `about:blank`, attaches the protocol, stubs the reminder before application load, and bounds API waits. The final full suite passed 75 checks. No application/runtime change was required; native alert interaction remains untested.
- Development shutdown logged GPU command-buffer warnings after passing checks; no renderer/startup failure was observed in the successful packaged runs. Physical GPU/multi-monitor behavior is not certified by these tests.
- No installer upgrade, uninstall, shortcut registration or installation over v1.1.0 was performed in this preview session. Packaged EXE execution is not installation verification.
- Physical Windows 125/150/200% scaling, real trackpad/pinch, native file pickers/select popups and audio listening require owner/hardware acceptance. Window tests emulate page zoom and inject keyboard/mouse input.
- The old 202-entry source/Warbond audit and remaining covers are not complete. Known legacy cards-only-import/custom-Warbond semantics are recorded in `M2_CATALOG_AUDIT.md`.
- The Eagle icon is an attributed community tracing, not an extracted original. Its contributor conditions and all third-party game-art rights require public-distribution review; attribution alone is not an unrestricted license.
- Unsigned installer: potential unknown-publisher/SmartScreen warning. Approved public distribution still needs the owner's approval, signing credentials and remaining integration/rights gates.

## Owner review checklist

Run `C:\Users\Chris\Desktop\HD2CSM-Source\scripts\start-local-preview.cmd`. It launches the actual packaged application with the separate `dist\review-profile-v1.1.2` save directory. Your normal saves are not loaded or changed.

1. Review gear; confirm all five additions start off. Compare Owned versus Include, and inspect all item images and the cover.
2. Use the four-item bulk control only for unlocked equipment. Confirm the Eagle reward remains separate.
3. Spin, lock and save a test Result; close and reopen with the same launcher. Confirm ownership and Results remain.
4. Test F11/Escape, smaller-window scrolling and Space-drag, your monitor scaling and reel audio.
5. Report feedback before any public release. Next development task is the M2B legacy source/Warbond audit, not a simultaneous map/mission rewrite.
