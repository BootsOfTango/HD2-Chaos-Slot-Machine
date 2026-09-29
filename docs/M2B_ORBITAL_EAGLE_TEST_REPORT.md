# Orbital / Eagle audit — v1.1.14 local verification

September 15, 2026. Branch `codex/m2b-orbital-eagle-audit`. Earlier dirty/untracked work preserved. No commit, publication, installation, personal-profile write or Windows/driver/security changes.

## Scope and baseline

Eighteen existing acquisition labels corrected (17 requisition, one starter), with community-tier evidence. No new loadout items, art, identity/name/alias/category/default changes, score changes or Warbond groups. Independent pre-edit v1.1.13 ASAR hash `d1ce0c8e2237e7c5e3ed4c726737c631f8f5aa547e6f478d3f909dc205af3f23`; fixture protects 187 unaffected records and all 205 identities/defaults/art/category fields. Existing historical digests remain enforced through a narrowly scoped reverse-fact projection.

Current acquisition coverage: **164/205 reviewed: 108 primary-source, 56 community-source; 41 pending**. Category membership comparison found no absent selectable orbital/Eagle entries in the consulted community category lists. Not a complete game-wide missing-content audit.

## Checks actually run

- Baseline 243 tests passed before changes. Final **249 tests** plus catalog/assets validation passed; 245 local pictures, zero missing, seven pre-existing placeholders. `.test-data/orbital-eagle-unit.log`.
- Source desktop safety: 7 initial + 8 restart/fullscreen/normal-close checks. `.test-data/desktop-safety-1789507366560`.
- Source workflow: 54 + 8 restart checks. `.test-data/electron-smoke-1789507371751`.
- Unsigned NSIS installer and portable ZIP built successfully, archive CRC/runtime/content checks and 7-Zip installer payload test passed. Authenticode `NotSigned`. `.test-data/orbital-eagle-build.log`, `orbital-eagle-artifacts.log`.
- **374 packaged source-file comparisons** passed, plus external guide/icons and ZIP/runtime ASAR equality. `.test-data/orbital-eagle-source-parity.json`.
- Actual packaged EXE executed in isolated profiles with app-side software rendering and sequential exclusive tests. All **16 phases** exited normally, without force-kills. Fifteen current-version phases have matching PID/software-rendering/`will-quit` diagnostics; the sixteenth is the preserved v1.1.3 upgrade seed.

| Packaged suite | Checks | Evidence under `.test-data` |
| --- | --- | --- |
| New acquisition facts + all existing Warbond controls + restart | 1971 + 407, backend roundtrip 3 | `packaged-acquisition-1789507545417` |
| Transfer | 26 + 4, backend 3 | `packaged-transfer-1789507568717` |
| Duplicate identity / restart | 131 + 28, backend 3 | `packaged-dedup-1789507575773` |
| Actual old EXE save upgrade | v1.1.3 seed 18 + upgrade 29 + backup checks 3 | Same dedup directory |
| New gear ownership / restart | 81 + 10, backend 3 | `packaged-gear-1789507588721` |
| Earlier source audit / restart | 808 + 167, backend 3 | `packaged-sources-1789507597585` |
| Core workflow / restart / normal fullscreen / network | 51 + 8 + 7 + 14 | `packaged-smoke-1789507601829` |

Core coverage includes offline first-launch Spin, locks/rerolls, WebAudio context initialization, Results/scoring, Compare, Armory, Rank and persistence. Dedicated suites cover export/import payloads and storage backend, ownership exclusions, all prior Warbond controls, local image decode and unchanged historical results/analytics. Network cases exercise the existing live/cache/bundled fallback behavior; the promised new all-faction roll/service is not implemented here. The Armory source-audit screenshot was visually inspected: new version and 108/56/41 counts are legible. This is one captured window size, not a full visual/DPI audit.

Aggregate exact evidence: `.test-data/orbital-eagle-acceptance.json`. No failed GUI runs in this pass. A single initial shell-process launch returned Access denied before execution; a read-only location check and identical retry succeeded. No security setting or alternate executable bypass was used.

## Artifacts

Directory: `C:\Users\Chris\HD2CSM-Development\HD2CSM-Source\dist\orbital-eagle-review-v1.1.14`.

- `Helldivers-2-Chaos-Slot-Machine-Setup-v1.1.14-win-x64.exe`: 139,612,351 bytes; SHA-256 `c3fed87d436b4971ce17efc4d13b3c5bd2ce8a409b61ffd86f6475a829d9ddb3`.
- `Helldivers-2-Chaos-Slot-Machine-v1.1.14-win-x64.zip`: 179,298,935 bytes; SHA-256 `91d8e6a94cdaf91db16959cad32e16ef9c7fc662217d370161088a794fd20bb9`.
- Packaged ASAR SHA-256: `415805382c987c89188e6642330b8cd34ca861e798adcc58bf962766c3e253c9`.

## Preservation and cleanup

Installed and accepted-download v1.1.10 remain hash-identical. All 73 existing personal-profile files compared with the earlier backup remain identical. Desktop `HD2CSM` still contains the same three accepted player files; no extra Desktop installer or shortcut created. The owner asked to leave the two visible folders alone.

After the replacement passed, all 87 files of the superseded v1.1.13 review candidate were moved and hash-verified under `.test-data/desktop-cleanup-2026-09-15/superseded-mobilize-candidate/mobilize-review-v1.1.13`. Adjacent `manifest.json` records every original/restoration path; `result.json` confirms the match. Nothing permanently deleted. Only accepted `preview-v1.1.10` and current `orbital-eagle-review-v1.1.14` remain active in `dist`. Old-version fixtures, failed-run evidence, source and save backups are retained deliberately.

## Still unverified / next

This candidate's native installation/upgrade/uninstall/wizard and real file-picker interactions were not executed; the actual packaged runtime was. No personal-profile gameplay, audible listening, physical DPI/multi-monitor/trackpad, long-duration or OS-shutdown testing. Unsigned; public signing and remaining release/asset-rights review still required. Automated counts are assertions, not user-testing coverage percentages.

Next bounded development batch: the remaining 14 defensive-stratagem acquisition records, including careful requisition-versus-campaign distinctions and a category missing-content check. Then the 27 support/backpack/vehicle records and wider completeness checks. Milestone 2 remains open; M3–M7 are still queued. Keep v1.1.10 installed/accepted until owner approves an upgrade; do not publish without approval.
