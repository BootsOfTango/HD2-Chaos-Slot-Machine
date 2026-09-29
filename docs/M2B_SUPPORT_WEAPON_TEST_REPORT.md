# Local Development — Support Weapon Audit: test evidence

September 15, 2026 (local time). Branch `codex/m2b-support-weapon-audit`. Internal package/lockfile version frozen at 1.1.14. No public release or native candidate installation.

## Implemented and researched

Sixteen existing support-weapon acquisitions: MG-43 starter equipment and fifteen requisition purchases, explicitly community-source reviewed. No IDs, names, aliases, artwork, default eligibility, ownership choices or historical Results changed. All 23 Warbond groups preserved. Dated 33-entry support-weapon category maps uniquely to existing catalog entries; C4 Pack keeps its previously reviewed backpack role despite the Wiki category overlap. Research and per-item references: `M2B_SUPPORT_WEAPON_RESEARCH.md` and `assets/catalog-reviews/2026-09-15-support-weapon.json`.

All **205 existing acquisitions reviewed: 109 primary, 96 community, zero pending**. This is a source-review count, not evidence that every current game item exists, that every image is final, or that the roadmap is complete.

## Source checks

- Baseline 265 tests/catalog/assets passed: `.test-data/support-weapon-baseline.log`.
- Final **272 tests**, catalog/assets passed: `.test-data/support-weapon-unit-final.log`. 245 local picture references, zero missing; seven pre-existing placeholder references (rank-tier/fallback artwork, not missing weapon files).
- Seven new tests protect independent prior-build digests, all item identity/default/art fields, 189 unrelated records, 23 Warbond groups, source/date/tier distinctions, history/private metadata, all old ID/name ownership combinations, explicit exclusions and 33 unique category mappings.
- First new category test incorrectly assumed the Wiki category excluded backpacks. It failed on C4 Pack; corrected the test to retain that specific existing backpack subgroup. No product-category change. Failed unit log retained at `.test-data/support-weapon-unit.log`; final run passed.
- Generator byte-idempotence initially observed header-edit newline normalization in `index.html`; catalog/image hashes unchanged. A subsequent generator run was byte-identical across all three files. Visible Support Weapon Audit header retained.
- Source desktop safety passed 7 initial + 8 restart/fullscreen/graceful-close checks: `.test-data/desktop-safety-1789518679612`.
- Source workflow passed 54 + 8 separate-process restart checks: `.test-data/electron-smoke-1789518689186`.

## Build verification

Build log: `.test-data/support-weapon-build.log`. Built with `--publish never`; ZIP CRC, required assets/runtime, embedded NSIS payload and independent 7-Zip test passed. Installer Authenticode: `NotSigned`. **377 bundled source-file comparisons**, external guide/icons and ZIP/runtime ASAR equality passed: `.test-data/support-weapon-source-parity.json`.

Directory: `C:\Users\Chris\HD2CSM-Development\HD2CSM-Source\dist\support-weapon-review`.

- `HD2CSM-Setup-local-support-weapon-win-x64.exe`: 139,618,418 bytes; SHA-256 `c6e373397bb39b8911445d82b6b3a33c180810fc781418dbb9266929bb025d28`.
- `HD2CSM-local-support-weapon-win-x64.zip`: 179,304,984 bytes; SHA-256 `dcd9d9e66425f3e420aeee8d52725731a0efc094297cfc7bfcbb5ee022e54cf0`.
- ASAR SHA-256 `998de220575a03271263caeb535a3aa8f6fc8eca9b0342d47ab6fe85230e07a1`.

## Actual packaged EXE

| Suite | Checks | Evidence under `.test-data` |
| --- | --- | --- |
| Support-weapon facts, all Warbond controls, history, restart | 1895 + 391; backend roundtrip 3 | `packaged-acquisition-1789518937904` |
| Transfer / restart | 26 + 4; backend 3 | `packaged-transfer-1789518971286` |
| Duplicate identities / restart | 131 + 28; backend 3 | `packaged-dedup-1789518985493` |
| Actual v1.1.3 save upgrade | Seed 18 + upgrade 29, original backup retained | Same dedup directory |
| New gear / restart | 81 + 10; backend 3 | `packaged-gear-1789519003258` |
| Earlier source review / restart | 808 + 167; backend 3 | `packaged-sources-1789519013849` |
| Core / restart / normal fullscreen / network | 51 + 8 + 7 + 14 | `packaged-smoke-1789519021635` |

All **16 phases** passed and closed normally, with exclusive sequential isolated profiles. No failed GUI runs or forced shutdowns. Fifteen current-app phases have matching PID/software/`will-quit` records; older seed also exited normally. Aggregate `.test-data/support-weapon-acceptance.json`.

Core covers offline Spin, existing locks/rerolls, sound-context initialization (not audible listening), Results/scoring, Compare, Armory, Rank, persistence and existing network/cache/bundled fallback. Actual backend import/export and old-save upgrade checks passed. Cross-faction planets remain M3 work; existing faction-locked behavior was tested, not changed.

Inspected the acquisition source-audit screenshot at one window size: correct new build label, 109/96/0 counts and local Autocannon image. Not a physical-display or full visual-artwork audit. Assertion totals are not coverage percentages.

## Preservation and cleanup

Accepted installer, ZIP/runtime, installed v1.1.10 ASAR and all 73 existing personal-profile files remain hash-identical. Desktop download still exactly three accepted files. Candidate not installed, promoted or published.

After the new candidate passed, archived/hash-verified all 87 previous backpack/vehicle candidate files under `.test-data/desktop-cleanup-2026-09-15/superseded-backpack-vehicle-candidate/backpack-vehicle-review`; adjacent manifest/result records restoration paths. Nothing permanently deleted. Active `dist` now holds only accepted `preview-v1.1.10` and current `support-weapon-review`.

## Limits and next gate

Native candidate installer/upgrade/uninstall/wizard and real file pickers are separate from packaged-runtime automation. Audible listening, physical DPI/trackpad/multi-monitor, long-duration/OS-shutdown checks and personal-profile gameplay remain unverified. Same-internal-version upgrades and the eventual official 1.0 transition require future verification. Public signing and artwork rights review remain outstanding.

Next: broader current item/Warbond inventory comparison and outstanding artwork verification before closing M2. M3 live-war/all-faction planets, M4 visual Armory, M5 missions, M6 map and M7 integrated release gate remain queued. Keep accepted installation/download unchanged until owner upgrade approval, and publish only when the owner approves the completed product.
