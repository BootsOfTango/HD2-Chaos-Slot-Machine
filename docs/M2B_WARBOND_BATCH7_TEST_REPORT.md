# M2B batch 7 — v1.1.10 acceptance

Local acceptance completed September 14, 2026 on branch `codex/m2b-warbond-audit-7`. No publication, personal installation or personal-save changes. Previous dirty source work preserved.

## Changes verified

Sixteen pending acquisitions reviewed: fifteen official Warbond records and one community-source Sweeper correction. Exact sets: Entrenched Division six, Exo Experts five, ODST four. Sweeper belongs to the separate Superstore group and cannot be enabled by Entrenched bulk actions. Stoker/Sweeper subgroups corrected, nine aliases added, three original publisher images bundled. Canonical names, IDs, ownership/defaults and item artwork unchanged. The prior Exo SVG remains recoverable. Research and source limitations: [batch-7 research](M2B_WARBOND_BATCH7_RESEARCH.md).

Catalog totals: **108 primary + 18 community + 79 pending = 205**; 126 reviewed acquisitions and 22 reviewed Warbond groups. This does not mean the whole roadmap or all game content is complete.

## Source checks

- Baseline before editing: 194 units plus catalog/assets passed.
- Final source run: **203 unit tests passed**; catalog and asset validators passed, 244 local picture references, zero missing, seven pre-existing placeholders outside the corrected weapon/booster paths.
- Nine new tests cover exact source sets, Sweeper's shop exclusion, independent v1.1.9 ASAR baseline hashes, 189 untouched rows/19 prior groups, nonmutating review, old name/ID/alias imports, default/ownership preservation and original image hashes/dimensions.
- Historical tests project away only explicitly reviewed facts; independent digests still detect protected changes. Generator run twice: idempotent.
- `.test-data/desktop-safety-1789443785974/report.json`: 7 windowed + 8 restart/fullscreen checks; both exited normally.
- `.test-data/electron-smoke-1789443803884/report.json`: 54 workflow + 8 separate-process restart checks, network blocked for first-run coverage.

## Actual packaged EXE checks

All used `dist/preview-v1.1.10/win-unpacked/Helldivers 2 Chaos Slot Machine.exe` with isolated profiles, exclusive desktop-test lock, software rendering and graceful close. No GUI testing overlapped packaging or another GUI suite.

| Suite / evidence directory under .test-data | Write | Restart | Additional |
| --- | ---: | ---: | --- |
| packaged-warbonds-1789443983735 — batch 7 | 1711 | 353 | 3 real file-backend checks |
| packaged-smoke-1789444014596 — main flow | 51 | 8 | 7 normal fullscreen startup + 14 network |
| packaged-warbonds-1789444079698 — prior batch 6 regression | 1713 | 352 | 3 real file-backend checks |
| packaged-sources-1789444099149 | 808 | 167 | 3 real file-backend checks |
| packaged-gear-1789444112447 | 81 | 10 | 3 real file-backend checks |
| packaged-dedup-1789444136558 | 131 | 28 | old v1.1.3 seed: 18; v1.1.10 upgrade: 29; 3 file-backend checks |

Main flow exercises Spin, locking/rerolls, WebAudio context, Results/scoring, Compare, Armory, Rank and persistence. Planet rerolls still obey the old faction rule; cross-faction selection remains M3. All 51 primary/24 sidearm/21 throwable/18 booster images decoded offline. New Warbond screenshots were visually inspected: original images, six/five/four counters, ownership controls and labels render. Injected custom test rows are clearly marked and never included in bulk grants; they are not shipped defaults.

Controlled network cases include success, dated cache, offline, rate limit, invalid/empty responses, timeout and recovery. Separate real API check returned 36 active planets at **23:47:34 EDT**. This is a point-in-time response, not a live mission availability guarantee.

Sixteen packaged phases exited normally. Fifteen current-app lifecycle files matched their launch PID, software settings and `will-quit`, with no abnormal child/renderer exit event. The old v1.1.3 seed predates these diagnostics but exited normally. Its original save backup survived the actual old-EXE → new-EXE upgrade. Aggregate: `.test-data/warbond-batch7-acceptance.json`.

## Artifacts and handoff

Electron 43.3.0 / builder 26.15.3. ZIP CRC, runtime/picture inventory, forbidden-development-file checks and installer embedded payload passed. 7-Zip tested 79 embedded files successfully (exit 0), with its existing **“data after the end of archive”** warning for the NSIS container. Authenticode: **NotSigned**.

- Installer: 137,578,382 bytes; SHA-256 `b61c4b785c0f99f5656b16c14f44a000fccc1e40a823fd7def1e66079fbcd983`.
- ZIP: 177,122,632 bytes; SHA-256 `7e007482373a60761c4e4e5014206573775c94ce18cb911193db24204d9f313e`.
- ASAR: `7d170a0fa11612d9d54aad2ba7f8f1868a81136da2668ec8c9ee1e0562daefe4`; 366 bundled source-file comparisons passed, plus package identity/version, external player guide/icons and ZIP-to-runtime ASAR equality.
- Detailed integrity record: `.test-data/warbond-batch7-artifacts.json`; per-file parity: `dist/preview-v1.1.10/source-parity.json`.
- Clean `C:\Users\Chris\Desktop\HD2CSM`: v1.1.10 Setup, matching checksum, guide only. Source-root installer and isolated review shortcut also target v1.1.10.
- Previous v1.1.9 artifacts moved intact to `.test-data/accepted-builds/v1.1.9`; builder support moved separately. Twelve exact moves validated before execution and every moved file hash checked after. Nothing permanently deleted. Manifest: `.test-data/warbond-batch7-handoff.json`.
- Post-handoff recheck: 203 units/catalog/assets passed again, 366 source-file comparisons still matched, both installer copies/checksum names/guide matched, 18 relative documentation links resolved, exact three-file player folder and source shortcut target/icon verified. No remaining app process or test lock. Evidence: `.test-data/warbond-batch7-post-handoff.json` and its unit log.

## Windows observation and remaining limits

The bounded System log check from 23:36 through 23:51 found one **Volsnap event 36 at 23:47:35**, reporting shadow-copy storage could not grow because of a user-imposed limit. C: had 1,477,509,623,808 free bytes. A read-only `vssadmin list shadowstorage` query required elevation and was not retried with elevation. The configured limit and its cause remain unverified; no backup/driver/system settings were changed. This observation does not establish a relationship to HD2CSM or the prior BSOD. Boot time remained 19:52:28 EDT; no app processes or desktop lock remained at the check. Evidence: `.test-data/warbond-batch7-system-check.json`.

Still **not tested**: native Setup/upgrade/uninstall flow, audible listening, native file-picker interaction, physical Windows scaling/multi-monitor/trackpad, and long-duration stability. Packaged EXE testing is not installer-flow testing. Public release requires owner approval, rights review for bundled game imagery and Windows signing credentials. No claim that prior PC crashes are fixed.

Next bounded task: audit Helldivers Mobilize and its base-game boundary, then the 59 remaining unassigned/requisition/campaign rows and missing-content checks. Do not silently stamp them reviewed or begin M3–M7 at the same time.
