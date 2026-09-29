# Local Development — Backpack / Vehicle Audit: test evidence

September 15, 2026 (local time). Branch `codex/m2b-backpack-vehicle-audit`. Internal version remains frozen at 1.1.14; this is not a new numbered release. No installation, publication, personal-save or Windows/driver/security changes.

## Implemented

- Eleven existing acquisition records reviewed: ten community-supported requisition purchases and primary-source Supply FRV campaign reward. See `M2B_BACKPACK_VEHICLE_RESEARCH.md` and the dated review manifest for sources and scope.
- Supply FRV starts unowned/excluded in fresh profiles. Existing saved opt-in/opt-out choices remain authoritative; no automatic October ownership grant. Add `M-102 Gunner FRV` as a compatible alias without renaming or duplicating the existing entry.
- All 205 stable identities, item art, historical Results and 23 Warbond groups retained. Only one fresh default and one alias list change. Independent pre-edit Defensive ASAR fixture protects 194 unrelated items and all other protected fields.
- Coverage: **189/205 reviewed: 109 primary, 80 community, 16 pending**. All 21 selectable backpack/vehicle entries in the consulted dated category lists are represented; not a game-wide completeness certification.

## Source checks

- Baseline 258 tests; final **265 tests**, catalog and asset validation passed. 245 local pictures, zero missing, seven pre-existing placeholders. Logs: `.test-data/backpack-vehicle-baseline.log`, `backpack-vehicle-unit-final.log`.
- Seven new tests cover independent-baseline integrity, idempotence, mutation detection, aliases, ownership combinations, historical/private metadata, explicit-empty/missing data and restricted fresh-exclusion review rules. Prior historical digest guards still pass.
- Initial review CLI wrote the correct catalog but its success log referenced an undefined variable. Fixed that CLI-only logging error and reran the idempotent application/generator successfully before the final test/build. No application launch failure.
- Source safety: 7 initial + 8 restart/fullscreen/graceful-close checks, `.test-data/desktop-safety-1789517901628`.
- Source workflow: 54 + 8 restart checks, `.test-data/electron-smoke-1789517908610`.

## Build checks

Build log: `.test-data/backpack-vehicle-build.log`. Unsigned NSIS installer and portable ZIP built with `--publish never`. ZIP CRC, required contents/asset checks, installer embedded payload and independent 7-Zip test passed. Authenticode status `NotSigned`.

**376 bundled source-file comparisons**, external guide/icons and ZIP/runtime ASAR equality passed: `.test-data/backpack-vehicle-source-parity.json`.

Directory: `C:\Users\Chris\HD2CSM-Development\HD2CSM-Source\dist\backpack-vehicle-review`.

- `HD2CSM-Setup-local-backpack-vehicle-win-x64.exe`: 139,617,817 bytes; SHA-256 `a1dcb235ffaeec280c41bd3283974695c0376454c1b620150b8153235716cebc`.
- `HD2CSM-local-backpack-vehicle-win-x64.zip`: 179,302,996 bytes; SHA-256 `ea207d63183e128f9b1afd5cd8a8f6c39b3a8c298f2546b960c236eb55c36c03`.
- ASAR SHA-256 `6a432f306c663da45511c964e8df03004b2aa6c42325487adb2788ae9af54587`.

## Actual packaged application checks

| Suite | Checks | Evidence under `.test-data` |
| --- | --- | --- |
| Backpack/vehicle facts, all Warbond controls, history, restart | 1710 + 353; backend roundtrip 3 | `packaged-acquisition-1789518205975` |
| Transfer / restart | 26 + 4; backend 3 | `packaged-transfer-1789518229095` |
| Duplicate identities / restart | 131 + 28; backend 3 | `packaged-dedup-1789518235162` |
| Actual v1.1.3 EXE save upgrade | Seed 18 + upgrade 29; original backup retained | Same dedup directory |
| New gear ownership / restart | 81 + 10; backend 3 | `packaged-gear-1789518248758` |
| Earlier source audit / restart | 808 + 167; backend 3 | `packaged-sources-1789518256959` |
| Core / restart / normal fullscreen / network | 51 + 8 + 7 + 14 | `packaged-smoke-1789518260664` |

All **16 phases** passed and exited normally, one at a time, with isolated profiles. No failed GUI run or forced shutdown in this batch. Fifteen current-app phases have matching PID/software-rendering/`will-quit` records; the older seed process also closed normally. Aggregate: `.test-data/backpack-vehicle-acceptance.json`.

Fresh Supply FRV exclusion and preserved imported opt-in were checked in the actual packaged renderer. Core exercised offline Spin, existing locks/rerolls, WebAudio initialization, Results/scoring, Compare, Armory, Rank, restart and existing network/cache/bundled fallback. Cross-faction planet changes remain M3 work, not implemented by these tests. Source-audit screenshot visually inspected at one captured size: descriptive label, correct 109/80/16 counts and local backpack image. Assertion counts are not user-testing coverage percentages.

## Preservation / cleanup

Accepted installer, ZIP/runtime and installed v1.1.10 hashes remain unchanged; all 73 existing personal-profile files still match the earlier protected backup. Desktop download remains exactly three accepted files. The candidate was not installed or promoted.

After successful verification, moved and hash-verified 87 previous defensive candidate files to `.test-data/desktop-cleanup-2026-09-15/superseded-defensive-candidate/defensive-review`. Adjacent manifest/result files record restoration paths. No permanent deletion or Desktop folder changes. Only accepted `preview-v1.1.10` and current `backpack-vehicle-review` remain in active `dist`.

## Limits and next work

Native candidate installer/upgrade/uninstall/wizard and real file pickers, audible listening, physical DPI/trackpad/multi-monitor and long-duration/OS-shutdown checks are separate from packaged-runtime automation. No personal-profile gameplay. Same-version native upgrades and the eventual official 1.0 version transition remain future gates. Public signing and asset-rights review remain outstanding.

Next bounded task: remaining sixteen support-weapon acquisition records, then broader missing-content checks. M2 is still open; M3–M7 remain queued. Keep accepted downloads/installation unchanged until owner upgrade approval. No publishing until roadmap completion and the owner's decision.
