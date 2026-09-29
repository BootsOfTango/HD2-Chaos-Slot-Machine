# Mid-project health review — September 15, 2026

Completed this bounded pass on `codex/mid-project-health-review`. This is a save/startup/packaging review, not an exhaustive security audit or a guarantee against PC crashes. Accepted v1.1.10 downloads, installed app and personal saves are untouched. Candidate v1.1.11 is staged separately, built and regression-tested, but not installed, promoted or published.

## Confirmed findings and fixes

- High: a newer-format save was treated as damaged and could be replaced with an older/default state. Loading now fails closed; current bytes remain intact, and later writes/imports are rejected by the backend. A failed renderer load also blocks later autosaves/import/clear actions, not only the initial boot save.
- High: file read errors were classified as JSON corruption. Reads now occur outside the parse-recovery catch, so permission/I/O failures do not remove or quarantine the original.
- High: save errors were logged only to the console, with no acknowledgement tracking at close. The renderer now exposes a persistent accessible warning, retries, session export and explicit discard confirmation. Normal close waits for pending writes; failed writes keep the window open. Blocked-load sessions clearly say they cannot overwrite the original.
- Medium: saves used unflushed temporary writes and exports directly truncated their targets. Both now use the existing exclusive temporary-file, fsync and rename helper. Failure cleanup affects only that write's temporary file. This reduces interrupted-write exposure, not a guarantee against OS/power/hardware failure.
- Medium: millisecond-only backup/recovery filenames could collide. Random suffixes preserve distinct snapshots. Existing filename matching and 20-backup retention remain compatible.
- High: ordinary launches had no single-profile instance lock, permitting independent windows to compete over a shared save. A duplicate launch now quits before diagnostics/migration/window creation, and the owner focuses its existing window. Different isolated test profiles remain separate.

## Test evidence

Baseline: 203 units/catalog/assets passed; full and production-only npm audit reported zero advisories for the locked dependency tree. This does not certify Electron or the app as vulnerability-free. No dependency updates were made.

Eight new storage failure cases failed against the original implementation, then all passed after fixes. Existing storage and legacy migration regressions passed alongside them (29 tests). Five new save-tracker units and four single-instance units passed. Final `npm test`: **220 tests passed**, catalog valid, **244 local picture references / zero missing / seven existing placeholders**. Full and production npm audits again reported zero advisories; no dependencies were updated. `git diff --check` passed (normal Windows line-ending warnings only).

Focused final v1.1.11 Electron checks: `.test-data/save-health-1789445987676/report.json` (future-format preservation **6**, semantically unusable load preservation **6**, failed write/retry **7**, actual pending-close persistence **3**). The final failure screenshot was visually inspected and the Retry button hit-tested after paint. Test-only fault injection is excluded from the packaged app; these injected-failure checks ran against source Electron, not the packaged EXE.

Final v1.1.11 desktop safety gate `.test-data/desktop-safety-1789446005096`: **7+8** passed. Development workflow `.test-data/electron-smoke-1789445662377`: **54+8** passed with the instance guard before the version bump. All GUI tests ran sequentially with software rendering, isolated profiles and normal shutdown; no personal profile or force-kill was used.

Actual packaged EXE regression evidence:

| Suite / evidence directory under `.test-data` | Passed checks |
| --- | --- |
| `packaged-smoke-1789446217511` | Workflow 51; restart 8; normal fullscreen startup 7; network 14 |
| `packaged-warbonds-1789446285917` | Warbond 1711; restart 353; backend file roundtrip 3 |
| `packaged-dedup-1789446300766` | Identity/import 131; restart 28; backend roundtrip 3; real old EXE seed 18; new EXE upgrade 29; version/backup assertions 3 |
| `packaged-gear-1789446313471` | Gear/ownership 81; restart 10; backend roundtrip 3 |
| `packaged-sources-1789446324424` | Source organization 808; restart 167; backend roundtrip 3 |

Core checks include Spin, locks/rerolls under the current faction rules, Results/finalized scoring, Compare, Armory, Rank, image decoding and WebAudio initialization (not audible listening). Fourteen packaged phases exited normally; thirteen current-app lifecycle records matched their PID and `will-quit`. The old v1.1.3 fixture predates those diagnostics, but exited normally and produced a real save whose exact original bytes were retained in the new app's automatic backup. Export/import file roundtrips use the real backend and packaged renderer payload, not native file-picker interaction.

The real community API returned **36 active planets at September 15, 2026, 00:24:17 EDT**. Separate fixtures exercised success, offline, HTTP 429, invalid/empty data, timeout and recovery, retaining a dated cache and usable rolls. This does not implement the queued M3 changes.

## Build and preservation

- Candidate installer: `C:\Users\Chris\Desktop\HD2CSM-Source\dist\health-review-v1.1.11\Helldivers-2-Chaos-Slot-Machine-Setup-v1.1.11-win-x64.exe` (137,580,945 bytes).
- Installer SHA-256: `b1b1202836443bba0a306879003e25b0a2e92a8f77c144bda2fa486d166a363e`.
- Portable ZIP beside it: `Helldivers-2-Chaos-Slot-Machine-v1.1.11-win-x64.zip` (177,125,180 bytes), SHA-256 `9b81fcd2ea5a43c346704edd05dfa660685fbf9825b228b0e065e6a29831f055`.
- ZIP/installer verification found required runtime/assets and no forbidden development/secrets patterns. Embedded installer archive integrity passed; 7-Zip reported its expected embedded-container trailing-data warning, not an extraction error. Authenticode status: **NotSigned**. Public signing remains a separate credential/release step.
- **368 bundled files** matched source (builder-normalized package metadata checked by identity fields), external guide/icons matched, and ZIP ASAR matched runtime ASAR. Rechecked after packaged tests. Detailed parity: `.test-data/health-source-parity.json`.
- Accepted v1.1.10 player/source-root installers, portable ZIP and runtime ASAR retained their recorded hashes. The player folder still contains exactly its existing v1.1.10 Setup, checksum and guide; the source-root shortcut launcher still targets the v1.1.10 isolated preview.
- Aggregate evidence: `.test-data/health-review-acceptance.json`. No GUI processes or test-lock files remained at the final check. No commit, publication, native installer execution, cleanup or personal save changes.

Next: owner review of this health candidate, then a bounded import/export validation hardening pass (oversized roundtrip and semantically malformed payloads) before resuming the queued Helldivers Mobilize/base-game catalog audit. Keep the accepted download unchanged until promotion is approved.

## Review boundaries and queued risks

- Existing live-war shortcomings (faction-bound rerolls, owner/event resolution, no periodic refresh) remain M3, not silently changed here.
- Catalog facts remain 126/205 reviewed; 79 pending and seven existing placeholders. No gear/ownership/scoring redesign in this pass.
- Native installer/upgrade/uninstall, audible output, physical scaling/trackpad/multiple displays, actual simultaneous native relaunch and long-duration stability remain unverified.
- A previous Windows Volsnap storage-limit event is an OS backup concern, not an established HD2CSM/BSOD cause. No driver, VSS or system settings are changed here.
- Continued hardening should examine oversized export/import roundtrips, deeply malformed imports, renderer IPC sender boundaries and Windows shutdown under load. Do not equate this bounded pass with every possible failure being tested.

Implementation references: [Node filesystem flush semantics](https://nodejs.org/api/fs.html#fsfsyncsyncfd), [Electron window close/beforeunload](https://www.electronjs.org/docs/latest/api/browser-window#event-close), [Electron single-instance lock](https://www.electronjs.org/docs/latest/api/app#apprequestsingleinstancelockadditionaldata).
