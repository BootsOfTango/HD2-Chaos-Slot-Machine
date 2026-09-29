# M2B Warbond batch 3 — v1.1.6 local acceptance

September 14, 2026. Branch `codex/desktop-graphics-safety`, retaining the interrupted `codex/m2b-warbond-audit-3` changes. The bounded catalog increment and its automated packaged regression gate now pass. Owner hands-on acceptance, full M2 completion and public release are separate gates.

## Delivered and preserved

- Control Group, Servants of Freedom and Borderline Justice have complete five/four/five-item reviewed equipment sets. Thirteen previously pending acquisitions are reviewed; VG-70 Variable's earlier review is unchanged. All 14 items already existed in the catalog.
- Five stratagem acquisition associations, three backpack subgroups and Dynamite's throwable subgroup are corrected. Sample Extricator retains its old `booster:sample-extractor` ID and `Sample Extractor` alias. Five full stratagem names are aliases, not extra rollable entries.
- Three official promotional images are bundled with source URLs, measured dimensions, hashes and attribution. These are not claimed to be exact in-game Acquisitions covers. Acquisition evidence and menu-taxonomy qualifications remain distinct; see `M2B_WARBOND_BATCH3_RESEARCH.md`.
- Ten explicitly reviewed Warbond groups have complete-set ownership/include/exclude controls. Filtered search does not limit a bulk action to visible items. Custom rows and separate Superstore purchases are excluded from those actions. The screenshot fixtures deliberately include false-source custom items to verify this boundary; they are not bundled equipment.
- All 205 identities, ownership defaults, item artwork paths and prior acquisition facts are preserved, except the explicitly reviewed name/source/subgroup changes. Old names and ID-only imports preserve ownership, arbitrary metadata and historical Results/scores. Totals: **56 primary-source + 12 community-source + 137 pending = 205**; 68 acquisitions reviewed, not 68 new items.
- The app-only graphics safeguards from `DESKTOP_GRAPHICS_SAFETY.md` remain enabled. This session changed only the test runner, its tests and documentation; no packaged application bytes changed and no rebuild/version bump was needed.

## Checks executed

All GUI checks ran sequentially using isolated `.test-data` profiles. The new EXE uses software rendering; the archived v1.1.3 fixture additionally receives `--disable-gpu`. Every process exited normally after windowed-close preparation. No force-kill, personal profile, installer-overwrite or GitHub action was used.

Counts below include repeated per-item assertions, not distinct user workflows. Paths are relative to the source checkout; each packaged evidence directory contains `report.json`, phase results, close preparation and shutdown records.

| Check | Passed | Evidence |
| --- | --- | --- |
| Final units and catalog/assets | 165 tests; 233 local pictures, zero missing, seven pre-existing placeholder references | `.test-data/warbond-batch3-final-unit.log` and `.json` |
| New Warbond batch | 1,042 granular integration + 218 restart + 3 real file-backend checks | `.test-data/packaged-warbonds-1789432582985/` |
| Prior Warbond batch | 1,016 integration + 212 restart + 3 file-backend | `.test-data/packaged-warbonds-1789432365655/` |
| Prior source-review regression | 808 integration + 167 restart + 3 file-backend | `.test-data/packaged-sources-1789432399393/` |
| New-gear/ownership regression | 81 integration + 10 restart + 3 file-backend | `.test-data/packaged-gear-1789432415314/` |
| Duplicate identity regression | 131 integration + 28 restart + 3 file-backend | `.test-data/packaged-dedup-1789432449877/` |
| Actual v1.1.3 EXE save → v1.1.6 EXE | 18 old seed + 29 first-boot + 3 version/backup checks; original save bytes preserved in automatic backup | Same dedup report, `upgrade` field |
| Lifecycle evidence cross-check | All five focused reports and matching current-app diagnostics passed; no abnormal renderer/child-process exits recorded | `.test-data/warbond-batch3-acceptance.json` |
| Explicit target preflight | Four new units plus actual no-argument CLI refusal; no GUI launched | `.test-data/warbond-batch3-target-preflight.json` |
| Source/package parity | 349 source files, package identity/version/main and external README match packaged bytes | `.test-data/warbond-batch3-source-parity.json` |
| Package integrity | ZIP CRC, executable headers, embedded installer payload, assets and checksum sidecars passed again | `python scripts/verify_win_zip.py --dist dist/safety-preview-v1.1.6` |

The packaged Warbond tests exercise real controls, all ten equipment sets, alias/image resolution offline, mixed ownership, hidden set members, per-item and bulk synchronization, custom-item exclusion, old/plain/enveloped imports, immutable history, restart and exact storage-backend file round-trips. The new batch also checks backpack visual categories without validation errors. All three Warbond panel captures were visually inspected: covers, labels, full-set warnings, counts and visible controls are readable. Captures are in `.test-data/packaged-warbonds-1789432318621/` and the final repeated run above.

The actual old-EXE upgrade is specifically the duplicate-identity fixture, not a native installer upgrade or an actual v1.1.5 executable upgrade. Batch-3 old-name/ID import compatibility is tested independently in units and the packaged Warbond suite.

The unchanged build's earlier workflow/fullscreen/offline evidence remains valid: 54 development workflow + 8 restart; packaged 51 workflow + 8 restart + 7 normal-startup + 14 controlled network checks. These were not rerun in this session; see `DESKTOP_GRAPHICS_SAFETY.md`. The broad window/DPI suite remains deferred.

At 20:37:51 EDT, a bounded Windows System warning/error/critical log check since 20:31 found no Display, nvlddmkm, WHEA, BugCheck or WER-SystemErrorReporting entries. Boot time remained 19:52:28; no test app processes or shared lock remained. Evidence: `.test-data/warbond-batch3-system-check.json`. This short interval does not prove long-duration stability or fix the original BSOD cause.

## Test-runner safeguard added during acceptance

The old no-argument packaged runner would select `dist/win-unpacked`, which may contain interrupted build output. It now requires exactly one explicit EXE path, validates the path/file type and checks the MZ header before creating evidence or launching an app. Empty, partial or zero-filled headers are rejected. This basic preflight does not replace full ZIP/source-parity verification.

Example, from the source checkout:

```powershell
node scripts/run-packaged-smoke.js 'dist/safety-preview-v1.1.6/win-unpacked/Helldivers 2 Chaos Slot Machine.exe' --warbonds --warbond-batch=3
```

Only one GUI suite may run at a time. A held/uncertain lock still requires inspection under the existing safety procedure. The runner's success message now distinguishes catalog/import/restart checks from an actual old-EXE save upgrade.

## Verified local artifacts

Directory: `C:\Users\Chris\Desktop\HD2CSM-Source\dist\safety-preview-v1.1.6`

| File | Bytes | SHA-256 |
| --- | ---: | --- |
| `Helldivers-2-Chaos-Slot-Machine-Setup-v1.1.6-win-x64.exe` | 131310096 | `9ece98cf7972856b245598e85b6f4898781e31f15fc19475e289f38315b54729` |
| `Helldivers-2-Chaos-Slot-Machine-v1.1.6-win-x64.zip` | 170852676 | `eeea264ea02f00e51aa508cb8d12d2ebba1ef9e099a3fc05e4848476e24b5fe4` |

Installer Authenticode: **NotSigned**. Installer embeds the runtime; end users need no development tools. The tested app is `win-unpacked\Helldivers 2 Chaos Slot Machine.exe` with all companion files, not a native-installed copy. Use `scripts\start-local-preview.cmd` for isolated review with `dist\review-profile-safety-v1.1.6`. The original installation and personal AppData are untouched.

The damaged earlier v1.1.6 installer directly under `dist` remains preserved; **do not run or distribute it**. No release asset was replaced, published or uploaded.

## Owner review and exact next work

1. Open the isolated preview, then Armory → Manual pool management → Source / Warbond-first. Search each of Control Group, Servants of Freedom and Borderline Justice. Check its image, full-set counts and ownership controls. Search Sample Extractor and Sample Extricator; both should find the one corrected booster.
2. Try an individual ownership change and full-set include/exclude, narrow search to one item, and restart. This is test-profile data only. Keep real-game ownership choices separate from fixture screenshots.
3. Next bounded M2B increment: review Masters of Ceremony, Force of Law and Dust Devils against official sources, including any related currently unassigned stratagems and separate shop/reward exclusions. These are audit candidates, not confirmed new associations. Preserve already-reviewed records and all ownership; add only supported metadata/artwork and focused tests.

Still queued: 137 acquisition reviews and remaining Warbond artwork; M3 unrestricted planet rolls/shared refresh; M4 full Armory redesign; M5 missions; M6 map; M7 integration/release. Native installation/upgrade/uninstall, physical DPI/multi-monitor/trackpad, native file pickers and audible sound remain unverified. Long-duration stability, public signing, artwork-rights review and owner release approval remain separate requirements.
