# HD2CSM project status

## Working rules

- Develop in `HD2CSM-Source`, not in the installed application or the older folder containing runtime files.
- Keep builds in `dist/` and isolated test profiles/evidence in `.test-data/`; neither is committed.
- Preserve user saves and the published v1.1.0 release.
- Work one milestone at a time. Local review precedes any GitHub publication.

## Current session — September 13, 2026

- Milestone 0: separate checkout created from published tag `hd2csm-v1.1.0` / commit `035e47a6480bf6b2a1c5c7aca2eaf0820dfcd7c3`.
- Branch: `codex/m1-fullscreen-window`.
- Baseline: `npm ci` completed; all 38 tests and catalog/asset validation passed.
- Dependency audit: the three high-severity build-only findings were patched narrowly: @xmldom/xmldom 0.8.15, fast-uri 3.1.6, js-yaml 4.3.2. Fresh network-enabled audit reports zero known vulnerabilities. Electron 43.3.0 / builder 26.15.3 unchanged.
- Milestone 0: complete. The old runtime folder and personal profiles remain untouched.
- Milestone 1: implementation and automated local build gate complete; owner hands-on acceptance is pending. Version 1.1.1 is an unpublished unsigned preview.
- Milestones 2–7: queued. No new gear, planet-selection, mission, or Armory changes in this first milestone.
- No new GitHub release is authorized until the owner reviews this milestone.

## Local artifacts and verification

- Installer: `C:\Users\Chris\Desktop\HD2CSM-Source\dist\Helldivers-2-Chaos-Slot-Machine-Setup-v1.1.1-win-x64.exe`
- Portable ZIP: `C:\Users\Chris\Desktop\HD2CSM-Source\dist\Helldivers-2-Chaos-Slot-Machine-v1.1.1-win-x64.zip`
- Packaged program: `C:\Users\Chris\Desktop\HD2CSM-Source\dist\win-unpacked\Helldivers 2 Chaos Slot Machine.exe`
- Safe hands-on launcher: `C:\Users\Chris\Desktop\HD2CSM-Source\scripts\start-local-preview.cmd`; uses `dist\review-profile-v1.1.1`, not the personal AppData profile.
- Unit suite + catalog/asset validation passed; 75 dedicated window checks passed; development workflows 54 + restart 8 passed; packaged workflows 51 + restart 8 + normal startup 7 + network 14 passed.
- Packaged normal launch was tested without automation startup settings. Installer/ZIP payloads and SHA-256 sidecars verified; installer is `NotSigned`.
- See `M1_TEST_REPORT.md` for exact evidence directories, checksums, limitations and checklist. We did **not** install over the existing app; physical Windows DPI/trackpad/audio listening and native dialog interactions remain manual checks. Windows native capture failed with `SetIsBorderRequired ... 0x80004002`; renderer screenshots were inspected successfully.

## Exact next task

1. Owner tries the isolated-profile preview: F11, Escape, shrink/scroll/pan, Spin and Results dialogs.
2. Fix any M1 feedback and complete physical DPI/input checks before declaring user acceptance/public-release readiness. Do not publish automatically.
3. Next implementation milestone is M2: audit existing catalog/ownership schema and provenance, add migration tests, then add the four Castellan's Creed items and opt-in Eagle Gas Airstrike with verified bundled artwork. Do not start the map/mission/live-war overhaul at the same time.

Read `ROADMAP.md` for the full approved sequence and shared boundaries. No scheduled automation was created; progress resumes through normal daily sessions.
