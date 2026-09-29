# M2B batch 8 — v1.1.13 validation and Desktop cleanup

September 15, 2026; branch `codex/m2b-warbond-audit-8`. Local only, preserving earlier uncommitted work. Scope: Mobilize's 20 acquisitions, offline art and ownership controls; separate owner-approved installation consolidation/cleanup.

## Passed

- Baseline **234 tests**. Final **243 tests**, catalog validation and asset validation passed: 245 local picture references, zero missing, seven pre-existing placeholders. Final log `.test-data/warbond-batch8-units-final.log`. Generator idempotence passed after normalizing manually edited index text.
- Independent pre-change fixture from the verified v1.1.12 ASAR protects all identities/names/defaults/item artwork, 185 untouched items and 22 prior Warbond groups. Fact-only import/ownership/history preservation and starter exclusions passed. Prior-batch digest tests remain intact through the historical projection.
- Source safety `.test-data/desktop-safety-1789502579061`: **7 + 8**. Source workflow `.test-data/electron-smoke-1789502586020`: **54 + 8**. All normal exits, isolated profiles, software rendering.
- Windows x64 installer/ZIP integrity, executable/payload headers and ZIP CRC passed. **373 bundled source files** match current source; package metadata, external guide/icons and ZIP/runtime ASAR match. `.test-data/warbond-batch8-source-parity.json`.
- Actual packaged EXE suites below passed in **16 process phases** with normal exits. Matching PID/software/will-quit lifecycle evidence checked for all current-app phases; retained old v1.1.3 seed also exited normally. Counts include repeated per-item checks, not thousands of independent workflows.

| Suite / evidence directory under `.test-data` | Checks |
|---|---|
| `packaged-warbonds-1789502881875` | 1764 + 362 restart + 3 backend roundtrip |
| `packaged-transfer-1789502894554` | 26 + 4 restart + 3 backend roundtrip |
| `packaged-dedup-1789502898837` | 131 + 28 restart + 3 backend; actual old EXE seed 18 + upgrade 29 + 3 backup/version |
| `packaged-gear-1789502921170` | 81 + 10 restart + 3 backend roundtrip |
| `packaged-sources-1789502929982` | 808 + 167 restart + 3 backend roundtrip |
| `packaged-smoke-1789502933913` | 51 workflow + 8 restart + 7 normal/fullscreen + 14 controlled network |

Main workflow covers Spin, locks/rerolls, WebAudio initialization, Results, scoring, Compare, Armory and Rank. Warbond tests cover all reviewed sets, search-hidden bulk controls, unaffected outside equipment, ownership across restart, aliases, images, source labels and historical Results. Original v1.1.3 save bytes remain in the automatic upgrade backup.

Visually inspected `packaged-warbonds-1789502881875/Helldivers-Mobilize-.png`: correct original cover illustration, title, community-source labels, medal-unlock notice and reachable full-set controls. This is one captured desktop size, not physical DPI certification.

## Troubleshooting, honestly excluded

The first packaged Warbond run (`packaged-warbonds-1789502805593`) failed during screenshot selection because the harness assumed every cover was in `/warbonds/official/`. The actual app used the correct separately attributed in-game cover. The harness now verifies the actual group-header image against its declared mapping; a regression test was added. Failed-run evidence retained and excluded from passing counts. Its normal shutdown was verified, no process/lock remained, and the complete rerun passed. No app rebuild was needed for this test-only fix.

## Artifacts

Directory: `C:\Users\Chris\Desktop\HD2CSM-Source\dist\mobilize-review-v1.1.13`.

- `Helldivers-2-Chaos-Slot-Machine-Setup-v1.1.13-win-x64.exe`: 139,610,627 bytes; SHA-256 `8d396f863ced8adce4fb0b8bb1b1ec213e44e92cf46c6d184883377e35764dab`.
- `Helldivers-2-Chaos-Slot-Machine-v1.1.13-win-x64.zip`: 179,297,939 bytes; SHA-256 `fff2b77930d3cdf82e969b65fa91bcdd61fbb40543bc2283d94d4646310616c6`.
- Runtime `win-unpacked/Helldivers 2 Chaos Slot Machine.exe`; ASAR SHA-256 `d1ce0c8e2237e7c5e3ed4c726737c631f8f5aa547e6f478d3f909dc205af3f23`.
- Authenticode **NotSigned**. Candidate not installed/promoted/published. Installer and ZIP have checksum sidecars.

## Separate approved Desktop consolidation

The owner approved moving the installed app to the normal per-user location. The already-accepted **v1.1.10** installer ran silently, exited zero, removed the old v1.1.7 Desktop installation folder, and updated shortcut/uninstall registration to `%LOCALAPPDATA%\Programs\Helldivers 2 Chaos Slot Machine`. Actual installed EXE passed isolated **51 + 8 + 7 + 14** checks (`packaged-smoke-1789502475180`). No personal-profile gameplay was performed.

Complete old-installation/profile backup: `.test-data/installation-consolidation-2026-09-15` (153 verified files). All **73 existing personal-profile files** remained byte-identical after consolidation and tests. Keep this private backup local and ignored by Git.

Duplicate source-root installer/checksum and obsolete v1.1.11 candidate archived with 89 verified files; superseded v1.1.12 candidate archived with 87 verified files, under `.test-data/desktop-cleanup-2026-09-15`. Nothing permanently deleted. Accepted download remains exactly three v1.1.10 files; source preview shortcut still v1.1.10. `dist` retains only accepted preview plus latest candidate. The original task workspace `Helldivers-2-Roulette` remains untouched; retire only after switching the task/project away and preserving Git data. See `DESKTOP_CLEANUP_POLICY.md`.

Aggregate evidence: `.test-data/warbond-batch8-acceptance.json`. No force-kill, driver/security changes, commit or publication.

## Remaining

Candidate-native installer/wizard/pickers, audible listening, physical display/trackpad/multimonitor, full IPC boundary audit and long-duration/OS-shutdown testing remain unverified. Silent native installer coverage above applies only to accepted v1.1.10. Public distribution still needs signing credentials and artwork-rights review.

Catalog now **146/205 reviewed (108 primary + 38 community), 59 unassigned stratagem acquisitions pending**, 23 reviewed Warbond groups. This is not proof that every current game item exists in the catalog. Next: owner feedback/promotion decision, then a bounded requisition/campaign stratagem audit plus missing-content checks. M3–M7 remain queued; planet rerolls still use the existing faction constraint.
