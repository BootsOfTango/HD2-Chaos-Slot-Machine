# M2B Warbond batch 6 — v1.1.9 local preview

September 14, 2026; branch `codex/m2b-warbond-audit-6`. Accepted local bounded increment. Prior uncommitted work, personal installation/saves and original runtime folder preserved. No commit, push or GitHub release.

## Scope and baseline

Python Commandos, Redacted Regiment and Siege Breakers: exact four/six/five sets, 15 newly primary-source-reviewed acquisitions, seven stratagem Warbond assignments, two backpack subgroup corrections, eight full-designation aliases and three original official promotional scenes. All 205 canonical names, stable IDs, default eligibility and item-image paths remain unchanged. Source conflicts and the actual delayed release date are documented in [research](M2B_WARBOND_BATCH6_RESEARCH.md).

Catalog: **93 primary + 17 community + 95 pending = 205; 110 reviewed acquisitions, 19 reviewed Warbond groups**. This does not complete M2 or start M3–M7.

- Baseline **185 unit tests** passed before edits.
- Updated **194 unit tests** passed; catalog/assets validators passed: **242 local picture references, zero missing, seven pre-existing placeholders**. Log: `.test-data/warbond-batch6-units.log`.
- Independent pre-change fixture matched the accepted v1.1.8 ASAR. Tests retain all 190 untouched records, previous 16 Warbond definitions and all 205 protected name/ID/type/default/art fields. Historical tests retain independent older digests.
- Tests verify source tiers, exact set exclusions, full-name/ID/legacy imports without duplicates or grants, metadata/Results preservation, idempotent review, two precise subgroup changes, original image hashes/dimensions and conflicting numbering.
- Initial run found the fixed-list backpack visual test still expected six groups; extended its exact list to the two new backpacks. Its complete canonical/alias rim assertions then passed. No runtime workaround was needed.
- Repeated catalog generation left index/catalog/image-map hashes unchanged after normalizing edited HTML.
- Desktop safety: **7 windowed + 8 restart/fullscreen/guarded-close checks**, `.test-data/desktop-safety-1789442279168/report.json`.
- Development app: **54 workflow + 8 restart checks**, `.test-data/electron-smoke-1789442310765/report.json`.

## Actual packaged EXE acceptance

All desktop suites ran sequentially, after packaging, in isolated profiles with software rendering and normal shutdown. Counts below include repeated per-item assertions, not independent user workflows. “FileBackend” means three real storage export/import/load checks on the packaged renderer's payload, without native picker interaction.

| Suite | Passed checks | Evidence folder under .test-data |
| --- | --- | --- |
| New Warbond batch 6 | 1554 written + 322 verified + 3 fileBackend | packaged-warbonds-1789442500768 |
| Main app | 51 written + 8 verified + 7 normalStartup + 14 network | packaged-smoke-1789442528112 |
| Prior Warbond batch 5 | 1384 written + 274 verified + 3 fileBackend | packaged-warbonds-1789442579062 |
| Source audit | 808 written + 167 verified + 3 fileBackend | packaged-sources-1789442591510 |
| Gear/ownership | 81 written + 10 verified + 3 fileBackend | packaged-gear-1789442595295 |
| Identity deduplication | 131 written + 28 verified + 3 fileBackend | packaged-dedup-1789442605413 |

Additional actual **v1.1.3 EXE save → v1.1.9 first boot**: 18 old seed + 29 new upgrade checks; original backup retained. Evidence is the dedup report's upgrade field. This is not native installer upgrade testing.

Warbond suites exercise all 19 reviewed groups: bulk/per-item owned and included flags, hidden search members, exclusion of unrelated/custom entries, eight new aliases, original “detonation tool” alias, visuals/analytics, plain/enveloped imports, historical Results and exact state after restart. Visually inspected Python-Commandos.png, Redacted-Regiment.png and Siege-Breakers.png in the new batch folder. Images, titles, set counts and controls render correctly. Artificial “Unverified custom equipment” rows are isolated fixtures, not shipped items. The layout remains the existing Manual pool view, not M4's future redesign.

The main suite covered offline first launch, Spin and animations, lock/reroll guards, existing faction-bound planet/mission selection, Results, stats/scoring, Compare, Armory, Rank and restart persistence. All 51 primary, 24 sidearm, 21 throwable and 18 booster image paths decode offline. WebAudio output initializes, but **no listening test** was performed. Development IPC used stubbed native picker responses.

Controlled network tests cover success, cached/offline data, rate-limit, invalid/empty payloads, timeout and recovery. An actual live request returned **36 active planets at 23:22:47 EDT**. Later availability is not guaranteed. Periodic shared war refresh, unrestricted planet rerolls and richer missions remain separate milestones.

Aggregate: `.test-data/warbond-batch6-acceptance.json`. All **16 packaged phases** exited normally and prepared windowed before close. All **15 current-app lifecycle records** match their process IDs, report software rendering, contain graceful quit and no recorded abnormal child/renderer exit. The preserved v1.1.3 seed predates lifecycle logging; it used software-rendering test flags and exited normally.

At **23:24:17 EDT**, a bounded System warning/error/critical query since 23:00 returned no matching events; no app process or test lock remained. Boot time unchanged at 19:52:28.5. Evidence: `.test-data/warbond-batch6-system-check.json`. This is not proof that the earlier Windows BSOD cause is fixed.

## Build integrity and handoff

Electron **43.3.0**, builder **26.15.3**, locked dependency versions unchanged. ZIP CRC, 81 entries, executable headers, required runtime/assets, forbidden development/secrets patterns and embedded offline installer payload passed. 7-Zip tested all 79 embedded runtime files with exit zero; its container listing reports trailing data around the embedded archive. This does not substitute for native installation testing. Authenticode: **NotSigned**.

| Artifact | Bytes | SHA-256 |
| --- | ---: | --- |
| Installer | 136363460 | `57f6c33decc401a444f71419ab4d898a44044f47b7fa96971995cd4c91ec2b02` |
| Portable ZIP | 175907850 | `43bdee07360d699ccd660cd97153c6febecef7e7700b6d8647c4c646409d979b` |

`dist/preview-v1.1.9/source-parity.json` records **361 bundled files** byte-equal to source, package metadata, external player guide and both extra icons. ZIP ASAR equals the tested runtime ASAR; SHA-256 `4833f65b87e831f7b6d4eb6be7df4275d0f2bba451930e89651c01603ea24654`.

Clean player folder: `C:\Users\Chris\Desktop\HD2CSM`, containing only v1.1.9 Setup, its checksum and the bundled usage guide. Canonical installer/checksum are at the source-checkout root. Portable ZIP/runtime/parity are in `dist/preview-v1.1.9`; the source-root shortcut points to the complete runtime via `scripts/start-local-preview.cmd`, with separate `dist/review-profile-v1.1.9` saves.

v1.1.8 was moved intact to `.test-data/accepted-builds/v1.1.8`, including the previous player-download copy. Builder/verification support files moved to `.test-data/build-support/v1.1.9`. All 12 exact moves were path/reparse/profile checked and every moved file hash verified. **Nothing permanently deleted.** Manifest: `.test-data/warbond-batch6-handoff.json`. Older review profiles, if present, and the preserved v1.1.3 migration fixture are not moved.

## Still unverified / next task

Post-handoff verification passed: all 194 unit tests again, all 361 bundled source-file comparisons, both installer hashes, matching player guide, 19 relative documentation links, exact three-file download folder and shortcut target/icon. No app processes or shared test lock remained. Evidence: `.test-data/warbond-batch6-post-handoff.json` and `warbond-batch6-post-handoff-units.log`.

Native installer installation/upgrade/uninstall, native file pickers, audible sound, physical DPI/multi-monitor/trackpad and long-duration stability remain unverified. The EXE was tested directly from its complete runtime, not installed over the user's app. Publication requires approval, signing credentials and artwork-rights review.

Next bounded M2 batch after owner feedback: Entrenched Division, Exo Experts and the ODST Warbond. Verify complete equipment sets and acquisition sources before changing facts; preserve ownership and use isolated sequential checks. Remaining base/requisition/campaign/custom audit also stays queued. M3–M7 are not part of this preview.
