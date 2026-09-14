# HD2CSM project status

## Working rules

- Develop in `HD2CSM-Source`, not in the installed application or the older folder containing runtime files.
- Keep builds in `dist/` and isolated test profiles/evidence in `.test-data/`; neither is committed.
- Preserve user saves and the published v1.1.0 release.
- Work one milestone at a time. Local review precedes any GitHub publication.

## Current session — September 14, 2026

- Milestone 0: separate checkout created from published tag `hd2csm-v1.1.0` / commit `035e47a6480bf6b2a1c5c7aca2eaf0820dfcd7c3`.
- Branch: `codex/m2b-source-audit`, based on local M2A checkpoint `bc59ac0` (M1 checkpoint `0d215d0`).
- Baseline: `npm ci` completed; all 38 tests and catalog/asset validation passed.
- M1 dependency audit: the three high-severity build-only findings were patched narrowly: @xmldom/xmldom 0.8.15, fast-uri 3.1.6, js-yaml 4.3.2. Its network-enabled audit reported zero known vulnerabilities. M2 added no dependencies or new audit result. Electron 43.3.0 / builder 26.15.3 unchanged.
- Milestone 0: complete. The old runtime folder and personal profiles remain untouched.
- Milestone 1: implementation and automated local build gate complete; owner hands-on acceptance is pending. Version 1.1.1 is an unpublished unsigned preview.
- Milestone 2A: five opt-in additions, stable catalog IDs/aliases, independent ownership, migration, local artwork/cover and compact new-gear panel implemented as local v1.1.2 preview. Final packaged verification is recorded in `M2_TEST_REPORT.md`.
- Milestone 2B: first 35-entry acquisition/identity audit batch implemented and packaged as local v1.1.3. Corrected three CQC names with stable-ID/alias compatibility, fixed both derived analytics consumers, distinguished acquisition sources and added three official promotional Warbond images. Across all 207 records: 28 primary-source reviewed, 12 community-source reviewed, 167 pending. M2 as a whole is NOT complete.
- Milestones 3–7: queued. No new all-faction planet selection, refresh service, full visual Armory, mission system or galaxy map yet.
- No new GitHub release is authorized until the owner reviews this milestone.

## Local artifacts and verification

- Installer: `C:\Users\Chris\Desktop\HD2CSM-Source\dist\Helldivers-2-Chaos-Slot-Machine-Setup-v1.1.3-win-x64.exe`
- Portable ZIP: `C:\Users\Chris\Desktop\HD2CSM-Source\dist\Helldivers-2-Chaos-Slot-Machine-v1.1.3-win-x64.zip`
- Packaged program: `C:\Users\Chris\Desktop\HD2CSM-Source\dist\win-unpacked\Helldivers 2 Chaos Slot Machine.exe`
- Safe hands-on launcher: `C:\Users\Chris\Desktop\HD2CSM-Source\scripts\start-local-preview.cmd`; uses `dist\review-profile-v1.1.3`, not the personal AppData profile.
- Previous v1.1.1 and v1.1.2 installers/ZIPs remain unchanged; unpacked previews are retained at `dist\preview-v1.1.1` and `dist\preview-v1.1.2`. The active unpacked preview is now v1.1.3.
- M2B verification passed: 83 unit tests plus catalog/assets; 75 window; development 54 workflow + 8 restart; packaged 51 workflow + 8 restart + 7 normal-startup + 14 network; gear 68 + 10 restart + 3 file-backend; source-audit 766 granular + 130 restart + 3 file-backend assertions. All 207 identities/defaults/artwork paths preserved against M2A; generator idempotent; nine source files match ASAR bytes. Installer/ZIP/checksums verified; installer `NotSigned`. See `M2B_TEST_REPORT.md` for exact evidence and limitations.
- M2A verification passed: 66 unit tests plus catalog/assets; 75 window checks; development 54 workflow + 8 restart; packaged 51 workflow + 8 restart + 7 normal-startup + 14 network; new-gear 68 integration + 10 restart + 3 file-backend assertions. Installer/ZIP payloads and final checksums verified; installer `NotSigned`. Details and limitations are in `M2_TEST_REPORT.md`.
- Prior milestone evidence remains in `M1_TEST_REPORT.md`. We do **not** install over the existing app during preview review; physical Windows DPI/trackpad/audio listening and native dialog interactions remain manual checks. Windows native capture previously failed with `SetIsBorderRequired ... 0x80004002`; Electron renderer captures remain available.
- The Eagle Gas Airstrike asset is an attributed community trace, not an original extracted icon. All third-party artwork remains under its owners' rights; public-distribution review is pending.

## Exact next task

1. Owner tries isolated v1.1.3: Armory Source audit; Manual pool management → Source / Warbond-first; search the three reviewed Warbonds or old CQC names; inspect source badges/images, ownership and restart. Retest F11/Escape/scroll/pan and audio on normal hardware. The full visual Armory redesign remains later work.
2. Next bounded M2B task: consolidate confirmed WASP/W.A.S.P. and EMS Strike/Orbital EMS Strike duplicates with explicit legacy-ID migration, deterministic ownership-conflict handling and recoverable discarded records. Preserve cards/fingerprints/scores; EMS Mortar Sentry is distinct. Both pairs remain separate and can affect roll weighting in v1.1.3.
3. Continue source audit for the remaining 167 records and Warbond images. Use `M2B_WEAPON_SOURCE_RESEARCH.md`, `M2B_STRATAGEM_SOURCE_RESEARCH.md` and the committed review batch as completed evidence; do not redo the 35 finished rows. Keep community versus primary verification explicit. Custom Warbond normalization is fixed; legacy cards-only import semantics remain noted in `M2_CATALOG_AUDIT.md`.
4. Address hands-on feedback and complete physical/native installer integration and signing/rights gates before public release. Do not publish automatically or start map/mission/live-war redesign concurrently with this catalog audit.

Read `ROADMAP.md` for the full approved sequence and shared boundaries. No scheduled automation was created; progress resumes through normal daily sessions.
