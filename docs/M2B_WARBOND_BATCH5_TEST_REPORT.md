# M2B Warbond batch 5 — v1.1.8 local preview

September 14, 2026; branch `codex/m2b-warbond-audit-5`. Earlier uncommitted work preserved. Bounded catalog increment; installed app and personal saves untouched. No publishing.

## Changes and independent compatibility checks

Viper Commandos, Truth Enforcers and Steeled Veterans have exact four/four/six equipment sets and three locally bundled original official promotional images. Thirteen pending acquisitions reviewed: nine primary-source, four explicitly community-source. Existing Dominator facts are unchanged. The old AR-23E Liberator Explosive name resolves as an import/search alias, not another rollable item. All 205 canonical names, IDs, subgroups, default eligibility and item-image paths remain unchanged.

Catalog: **78 primary + 17 community + 110 pending = 205; 95 reviewed acquisitions, 16 reviewed Warbond groups**. M2 remains incomplete. See [source research](M2B_WARBOND_BATCH5_RESEARCH.md).

- Baseline: **177 unit tests** passed before changes.
- Updated/final units: **185 passed**, catalog validation passed, **239 local image references / zero missing / seven pre-existing placeholders**. Evidence: `.test-data/warbond-batch5-units.log`.
- Pre-change catalog matched the accepted v1.1.7 ASAR before independent fixture capture. Tests preserve every one of the 192 untouched items, all 205 protected field sets and prior 13 Warbond definitions. Historical tests remain based on independent older digests, not weakened to accept new totals.
- Tests exercise pure/idempotent review, source tier accuracy, exact sets/exclusions, original image signatures/dimensions/hashes, name/ID/alias imports, saved ownership and unchanged Results.
- The first generator-repeat check followed a manual HTML edit and normalized that edit's line endings. A subsequent repeat produced identical index/catalog/image-map hashes; final version banner remained v1.1.8.
- Desktop safety: **7 windowed + 8 restart/fullscreen/guarded-close checks**, `.test-data/desktop-safety-1789437640994/report.json`.
- Development workflow: **54 + 8 restart checks**, `.test-data/electron-smoke-1789437655618/report.json`.

## Actual packaged EXE checks

All suites ran sequentially, after packaging, with isolated profiles, software rendering and ordinary shutdown. Counts include repeated per-item assertions, not separate user workflows.

| Packaged suite | Passed checks | Evidence directory under .test-data |
| --- | --- | --- |
| New Warbond batch 5 | 1225 integration + 244 restart + 3 file-backend | packaged-warbonds-1789437935017 |
| Main workflow | 51 workflow + 8 restart + 7 normal/fullscreen startup + 14 controlled network | packaged-smoke-1789437974986 |
| Previous Warbond batch 4 | 1354 integration + 283 restart + 3 file-backend | packaged-warbonds-1789438034681 |
| Previous source audit | 808 integration + 167 restart + 3 file-backend | packaged-sources-1789438118199 |
| Gear/ownership | 81 integration + 10 restart + 3 file-backend | packaged-gear-1789438127746 |
| Duplicate identity regression | 131 integration + 28 restart + 3 file-backend | packaged-dedup-1789438144794 |
| Actual v1.1.3 save → v1.1.8 EXE first boot | 18 seed + 29 upgrade; original backup preserved | Same dedup directory, upgrade field |

The Warbond suites exercise all 16 reviewed groups: bulk/per-item ownership and inclusion, hidden search members, exclusion of custom rows and separate purchases, aliases, historical analytics, plain/enveloped imports, real storage export/import/load and exact restart state. Visually inspected the three new packaged screenshots: Viper-Commandos.png, Truth-Enforcers.png, Steeled-Veterans.png. Titles, art, counts and controls render correctly. “Unverified custom equipment” rows in these captures are deliberate isolated fixtures, not bundled additions. This remains the existing Manual pool view, not M4's future redesign.

Main workflow covered offline first launch/Spin, locks/rerolls and animation guards, existing faction-bound planet and mission behavior, Results, stats/scoring, Compare, Armory, Rank and persistence. All 51 primary, 24 sidearm, 21 throwable and 18 booster image paths decoded offline. WebAudio initialized; **no audible listening test**. Development storage IPC used stubbed native picker responses; packaged file checks are not native dialog interaction.

Controlled network checks cover success, dated cache, offline, rate-limit, invalid/empty responses, timeout and recovery. A separate real API request returned **36 active planets at 22:07:05 EDT**. This does not guarantee later availability or exact in-game missions. Cross-faction rolls and the shared periodic-refresh service remain M3.

Aggregate evidence: `.test-data/warbond-batch5-acceptance.json`. **16 packaged processes shut down normally** and prepared windowed before closing. All **15 current-app lifecycle records** match their process IDs and contain software rendering and graceful quit, with no recorded abnormal renderer/child exit. The one archived v1.1.3 seed predates these diagnostics; its normal zero exit was verified with software-rendering test flags. No processes/shared test lock remained afterward.

At 22:09:29 EDT, a bounded System warning/error/critical query since 21:40 found no matching Display, nvlddmkm, WHEA, BugCheck or WER-SystemErrorReporting events; boot time remained 19:52:28.5. See `.test-data/warbond-batch5-system-check.json`. This short observation is **not proof of a BSOD fix**.

## Build, integrity and clean handoff

Electron 43.3.0 / electron-builder 26.15.3; locked dependency versions unchanged. ZIP CRC, 81 entries, runtime/asset presence, development/secrets exclusions, Windows executable headers and substantial offline installer payload passed. 7-Zip tested all 79 embedded runtime files successfully (exit zero); listing reports trailing data around the embedded archive inside the NSIS EXE. That check is not native installation testing. Authenticode: **NotSigned**.

| Artifact | Bytes | SHA-256 |
| --- | ---: | --- |
| Installer | 135640269 | `43cdac1210e29d088d195b8ae305d1a17a1ac8d27a94fb5f4d4ba339d81f41b5` |
| Portable ZIP | 175185083 | `c590fba08cc4f688df429eee5bfd136185d97f41cc8d356cfc5f64291d326f6f` |

`dist/preview-v1.1.8/source-parity.json`: **357 bundled source files** match source bytes; builder-normalized package metadata, external README-FIRST and both extra icons match. ZIP ASAR equals the tested runtime ASAR; hash `27cf2f12287460ffa15e125ecf1ebe56b8d4819bbe6fe9466ad61410025f323b`. The revised player guide is now included in the build.

Current clean download: `C:\Users\Chris\Desktop\HD2CSM` contains only Setup v1.1.8, its checksum and README-FIRST. Canonical installer/checksum are at the source-checkout root; ZIP/runtime/parity remain in `dist/preview-v1.1.8`. The root shortcut uses `scripts/start-local-preview.cmd` with separate `dist/review-profile-v1.1.8` saves.

Previous v1.1.7 artifacts/download copy were moved intact to `.test-data/accepted-builds/v1.1.7`; build-support output to `.test-data/build-support/v1.1.8`. All 12 exact moves were preflighted inside intended folders and each moved file hash verified; **nothing permanently deleted**. Original personal installation, source, Git work and v1.1.3 migration fixture stay intact. Manifest: `.test-data/warbond-batch5-handoff.json`.

Post-handoff: all 185 units passed again; all 357 bundled source files still match, both installer copies retain the verified hash, the player guide matches source, 20 relative documentation links resolve, and shortcut target/icon/isolated profile were checked. No application process remains. Evidence: `.test-data/warbond-batch5-post-handoff.json` and `warbond-batch5-units-post-handoff.log`. The shell's last no-matching-process query returned 1; it was not a test failure.

## Remaining limits and next task

Native installer installation/upgrade/uninstall, native file pickers, audible sound, physical Windows DPI/multi-monitor/trackpad and long-duration stability remain unverified. The packaged EXE was launched directly from its complete runtime, not installed over the user's app. Public release requires owner approval, signing credentials and artwork-rights review. No source commit/push/release this session.

Next bounded M2 task after owner feedback: audit Python Commandos, Redacted Regiment and Siege Breakers, including currently unassigned stratagems where verified sources establish membership. Do not infer gear from theme or silently grant ownership. Preserve the same isolated/sequential test procedure. M3–M7 remain separate.
