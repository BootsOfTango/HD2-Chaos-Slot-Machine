# HD2CSM project status

## Working rules

- Develop in `HD2CSM-Source`, not in the installed application or the older folder containing runtime files.
- Keep builds in `dist/` and isolated test profiles/evidence in `.test-data/`; neither is committed.
- Preserve user saves and the published v1.1.0 release.
- Work one milestone at a time. Local review precedes any GitHub publication.

## Current session — September 13, 2026

- Milestone 0: separate checkout created from published tag `hd2csm-v1.1.0` / commit `035e47a6480bf6b2a1c5c7aca2eaf0820dfcd7c3`.
- Branch: `codex/m2-catalog-ownership`, based on local M1 checkpoint `0d215d0`.
- Baseline: `npm ci` completed; all 38 tests and catalog/asset validation passed.
- M1 dependency audit: the three high-severity build-only findings were patched narrowly: @xmldom/xmldom 0.8.15, fast-uri 3.1.6, js-yaml 4.3.2. Its network-enabled audit reported zero known vulnerabilities. M2 added no dependencies or new audit result. Electron 43.3.0 / builder 26.15.3 unchanged.
- Milestone 0: complete. The old runtime folder and personal profiles remain untouched.
- Milestone 1: implementation and automated local build gate complete; owner hands-on acceptance is pending. Version 1.1.1 is an unpublished unsigned preview.
- Milestone 2A: five opt-in additions, stable catalog IDs/aliases, independent ownership, migration, local artwork/cover and compact new-gear panel implemented as local v1.1.2 preview. Final packaged verification is recorded in `M2_TEST_REPORT.md`.
- Milestone 2B: full audit of the existing 202 items, source types, duplicate aliases and Warbond associations/covers remains queued. M2 as a whole is NOT complete.
- Milestones 3–7: queued. No new all-faction planet selection, refresh service, full visual Armory, mission system or galaxy map yet.
- No new GitHub release is authorized until the owner reviews this milestone.

## Local artifacts and verification

- Installer: `C:\Users\Chris\Desktop\HD2CSM-Source\dist\Helldivers-2-Chaos-Slot-Machine-Setup-v1.1.2-win-x64.exe`
- Portable ZIP: `C:\Users\Chris\Desktop\HD2CSM-Source\dist\Helldivers-2-Chaos-Slot-Machine-v1.1.2-win-x64.zip`
- Packaged program: `C:\Users\Chris\Desktop\HD2CSM-Source\dist\win-unpacked\Helldivers 2 Chaos Slot Machine.exe`
- Safe hands-on launcher: `C:\Users\Chris\Desktop\HD2CSM-Source\scripts\start-local-preview.cmd`; uses `dist\review-profile-v1.1.2`, not the personal AppData profile.
- The v1.1.1 installer and ZIP remain unchanged. Its former unpacked preview is retained at `dist\preview-v1.1.1`; the launcher's active target is now v1.1.2.
- M2A verification passed: 66 unit tests plus catalog/assets; 75 window checks; development 54 workflow + 8 restart; packaged 51 workflow + 8 restart + 7 normal-startup + 14 network; new-gear 68 integration + 10 restart + 3 file-backend assertions. Installer/ZIP payloads and final checksums verified; installer `NotSigned`. Details and limitations are in `M2_TEST_REPORT.md`.
- Prior milestone evidence remains in `M1_TEST_REPORT.md`. We do **not** install over the existing app during preview review; physical Windows DPI/trackpad/audio listening and native dialog interactions remain manual checks. Windows native capture previously failed with `SetIsBorderRequired ... 0x80004002`; Electron renderer captures remain available.
- The Eagle Gas Airstrike asset is an attributed community trace, not an original extracted icon. All third-party artwork remains under its owners' rights; public-distribution review is pending.

## Exact next task

1. Owner tries the isolated v1.1.2 preview: Review gear, Owned versus Include, four-item Warbond bulk control, custom Add, Spin and restart. Retest F11/Escape/scroll/pan and audio on their normal hardware.
2. Continue M2B in a small `codex/` branch: audit the legacy catalog's source associations and likely duplicate identities against primary sources. Start with the 102 catch-all assignments/86 stratagem entries identified in `M2_CATALOG_AUDIT.md`; preserve IDs, legacy alias recovery, ownership and historical scoring. Record verified versus unresolved sources explicitly.
3. Audit remaining Warbond equipment associations/covers and artwork provenance. Track legacy cards-only import semantics and custom Warbond normalization documented in the audit. Do not claim a complete Armory audit until it is actually verified.
4. Address hands-on feedback and complete physical/native installer integration and signing/rights gates before public release. Do not publish automatically or start map/mission/live-war redesign concurrently with this catalog audit.

Read `ROADMAP.md` for the full approved sequence and shared boundaries. No scheduled automation was created; progress resumes through normal daily sessions.
