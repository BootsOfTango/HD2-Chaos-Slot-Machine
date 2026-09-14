# HD2CSM project status

## Working rules

- Develop in `HD2CSM-Source`, not in the installed application or the older folder containing runtime files.
- Keep builds in `dist/` and isolated test profiles/evidence in `.test-data/`; neither is committed.
- Preserve user saves and the published v1.1.0 release.
- Work one milestone at a time. Local review precedes any GitHub publication.

## Current session — September 14, 2026

- Milestone 0: separate checkout created from published tag `hd2csm-v1.1.0` / commit `035e47a6480bf6b2a1c5c7aca2eaf0820dfcd7c3`.
- Branch: `codex/m2b-warbond-audit-2`, based on local v1.1.4 checkpoint `6441680` (v1.1.3 `a434de2`, M2A `bc59ac0`, M1 `0d215d0`).
- Baseline: `npm ci` completed; all 38 tests and catalog/asset validation passed.
- M1 dependency audit: the three high-severity build-only findings were patched narrowly: @xmldom/xmldom 0.8.15, fast-uri 3.1.6, js-yaml 4.3.2. Its network-enabled audit reported zero known vulnerabilities. M2 added no dependencies or new audit result. Electron 43.3.0 / builder 26.15.3 unchanged.
- Milestone 0: complete. The old runtime folder and personal profiles remain untouched.
- Milestone 1: implementation and automated local build gate complete; owner hands-on acceptance is pending. Version 1.1.1 is an unpublished unsigned preview.
- Milestone 2A: five opt-in additions, stable catalog IDs/aliases, independent ownership, migration, local artwork/cover and compact new-gear panel implemented as local v1.1.2 preview. Final packaged verification is recorded in `M2_TEST_REPORT.md`.
- Milestone 2B: first 35-entry acquisition/identity audit batch implemented in v1.1.3. Corrected three CQC names with stable-ID/alias compatibility, fixed derived analytics, distinguished acquisition sources and added three official promotional Warbond images.
- Milestone 2B next increment: duplicate WASP and Orbital EMS rows consolidated in local v1.1.4 with explicit retired-ID/name migration, deterministic ownership-conflict handling and recoverable original records. EMS Mortar Sentry remains distinct. Historical cards/scores remain unchanged; usage analytics count equipment once per run. The actual v1.1.3 EXE → v1.1.4 first-boot save migration and exact original backup preservation passed in isolation. Across 205 unique entries: 27 primary-source reviewed, 11 community-source reviewed, 167 pending. Counts fell by two because already-reviewed duplicates merged; no review evidence was lost. M2 as a whole is NOT complete.
- Milestone 2B latest increment: v1.1.5 reviews 17 additional acquisitions in Cutting Edge, Democratic Detonation and Polar Patriots, records their three six-item equipment sets, corrects three subgroups, and bundles three official promotional images. Seven explicitly reviewed Warbond groups now have safe full-set ownership/include/exclude controls in the existing Manual pool view. All gear identities/defaults and previous facts remain compatible. Current totals: **43 primary-source + 12 community-source + 150 pending = 205 unique entries**. M2 remains in progress; this is not the full M4 visual redesign.
- Milestones 3–7: queued. No new all-faction planet selection, refresh service, full visual Armory, mission system or galaxy map yet.
- No new GitHub release is authorized until the owner reviews this milestone.

## Local artifacts and verification

- Installer: `C:\Users\Chris\Desktop\HD2CSM-Source\dist\Helldivers-2-Chaos-Slot-Machine-Setup-v1.1.5-win-x64.exe`
- Portable ZIP: `C:\Users\Chris\Desktop\HD2CSM-Source\dist\Helldivers-2-Chaos-Slot-Machine-v1.1.5-win-x64.zip`
- Packaged program: `C:\Users\Chris\Desktop\HD2CSM-Source\dist\win-unpacked\Helldivers 2 Chaos Slot Machine.exe`
- Safe hands-on launcher: `C:\Users\Chris\Desktop\HD2CSM-Source\scripts\start-local-preview.cmd`; uses `dist\review-profile-v1.1.5`, not the personal AppData profile.
- Previous v1.1.1–v1.1.4 installers/ZIPs remain unchanged, with unpacked previews at the corresponding `dist\preview-v1.1.x` paths. The active unpacked preview is now v1.1.5.
- Latest v1.1.5 verification: 126 unit tests plus catalog/assets; 75 window; development 54 workflow + 8 restart; packaged 51 workflow + 8 restart + 7 normal-startup + 14 network; Warbonds 618 granular + 155 restart + 3 file-backend; source-audit 808 + 167 + 3; gear 81 + 10 + 3; dedup 131 + 28 + 3 plus actual v1.1.3 → v1.1.5 EXE save migration 18 seed + 29 first-boot + 3 backup/version checks. All 205 identities/defaults/art paths preserved; generator idempotent; 15 ASAR files and external README match source bytes. Installer/ZIP/checksums verified, installer `NotSigned`. See `M2B_WARBOND_TEST_REPORT.md` for exact evidence, caveats and hands-on checklist. No native installer-upgrade verification.
- M2B duplicate verification passed: 110 unit tests plus catalog/assets; 75 window; development 54 workflow + 8 restart; packaged 51 workflow + 8 restart + 7 normal-startup + 14 network; gear 81 + 10 restart + 3 file-backend; source-audit 808 granular + 167 restart + 3 file-backend; dedup 131 + 28 restart + 3 file-backend. Actual old-to-new EXE upgrade: 18 old seed + 29 new first-boot + 3 version/backup checks. All 205 surviving identities/defaults/art paths preserved against v1.1.3; generator idempotent; ten source files match ASAR bytes. Installer/ZIP/checksums verified; installer `NotSigned`. See `M2B_DEDUP_TEST_REPORT.md` for exact evidence and limitations. This is not installer-upgrade verification.
- M2B verification passed: 83 unit tests plus catalog/assets; 75 window; development 54 workflow + 8 restart; packaged 51 workflow + 8 restart + 7 normal-startup + 14 network; gear 68 + 10 restart + 3 file-backend; source-audit 766 granular + 130 restart + 3 file-backend assertions. All 207 identities/defaults/artwork paths preserved against M2A; generator idempotent; nine source files match ASAR bytes. Installer/ZIP/checksums verified; installer `NotSigned`. See `M2B_TEST_REPORT.md` for exact evidence and limitations.
- M2A verification passed: 66 unit tests plus catalog/assets; 75 window checks; development 54 workflow + 8 restart; packaged 51 workflow + 8 restart + 7 normal-startup + 14 network; new-gear 68 integration + 10 restart + 3 file-backend assertions. Installer/ZIP payloads and final checksums verified; installer `NotSigned`. Details and limitations are in `M2_TEST_REPORT.md`.
- Prior milestone evidence remains in `M1_TEST_REPORT.md`. We do **not** install over the existing app during preview review; physical Windows DPI/trackpad/audio listening and native dialog interactions remain manual checks. Windows native capture previously failed with `SetIsBorderRequired ... 0x80004002`; Electron renderer captures remain available.
- The Eagle Gas Airstrike asset is an attributed community trace, not an original extracted icon. All third-party artwork remains under its owners' rights; public-distribution review is pending.

## Exact next task

1. Owner tries isolated v1.1.5: Armory → Manual pool management → Source / Warbond-first; search Cutting Edge, Democratic Detonation or Polar Patriots. Inspect the art and source badges, use full-set ownership/include/exclude controls, narrow search to one item and confirm full-set behavior, then restart. Retest F11/Escape/scroll/pan and audio on hardware. A fresh profile does not copy personal saves or test fixtures.
2. Next bounded M2B implementation task: review remaining Warbond-linked stratagems, starting with Control Group, Servants of Freedom and Borderline Justice, and reconcile their unassigned/source/category records against evidence. Add verified relevant promotional art with provenance and focused ownership/import tests; end with another local build. Do not assume a player's entitlement or redo the completed reviews/duplicate consolidation.
3. Use `M2B_WEAPON_SOURCE_RESEARCH.md`, `M2B_STRATAGEM_SOURCE_RESEARCH.md`, `M2B_CUTTING_EDGE_RESEARCH.md`, `M2B_WARBOND_BATCH2_RESEARCH.md`, all three committed review manifests and `CATALOG_IDENTITY_MIGRATION.md` as completed evidence. The first 35 reviewed rows resolve to 33 unique legacy identities; with M2A's five and the latest 17, 55 unique records are reviewed and 150 pending. Keep community versus primary verification explicit. Legacy cards-only import semantics remain noted in `M2_CATALOG_AUDIT.md`.
4. Address hands-on feedback and complete physical/native installer integration and signing/rights gates before public release. Do not publish automatically or start map/mission/live-war redesign concurrently with this catalog audit.

Read `ROADMAP.md` for the full approved sequence and shared boundaries. No scheduled automation was created; progress resumes through normal daily sessions.
