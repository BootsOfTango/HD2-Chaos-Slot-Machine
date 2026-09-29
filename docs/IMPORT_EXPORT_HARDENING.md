# Import/export hardening — September 15, 2026

Branch: `codex/import-export-hardening`. Bounded follow-up to the health review. Earlier dirty work, accepted v1.1.10 downloads and v1.1.11 candidate preserved. No personal installation/save changes, publication or system/driver work.

## Findings and changes

1. An export could exceed the 5 MiB import ceiling and become impossible to restore. Shared transfer validation now allows 32 MiB and 10,000 cards, with at most 48 nested containers and 250,000 JSON nodes. Export uses the same reader rules before writing. Ordinary desktop working saves are not capped by these transfer limits; oversized working saves remain accessible, but require a file-level backup until a larger-transfer feature is reviewed.
2. Desktop import wrote raw data before renderer normalization. New read-only preparation IPC returns the candidate, then renderer validates/normalizes its independent items/cards/settings and scoring metadata, then a separate commit writes it durably with a prior backup. Only a successful acknowledgement publishes it to the UI. UI editing, reentry, autosaving and close are guarded during the transaction.
3. Malformed equipment, metadata, stats, object keys and IDs were accepted too shallowly. Shared transfer checks reject these before mutation; actual catalog resolution and card normalization run on a disposable candidate. These checks are not a claim to validate every possible historical/custom field or renderer behavior.
4. Browser FileReader errors could escape the completion path. Awaited file reads now have an error path and pre-read size check. Browser quota failure retains old working data and active session. Pre-import JSON is retained separately under `hd2_chaos_slot_machine_before_import_v1`, rather than being lost to the next normal backup update. Clearing site data removes this recovery copy.
5. Import backup/rotation now finishes before working-file replacement; there is no fallible cleanup after replacement that could falsely report a failed commit. Reads are bounded even if an external file grows after its size check.
6. Restart coverage found zero `scoreRawBonusPercent` was treated as missing by `||`. Nullish fallback preserves intentional zero. No scoring formula changed.

## Completed validation

- Baseline: 220 unit tests/catalog/assets passed. Eight of eleven initial transfer tests failed against the old backend; all passed after implementation. Final source suite currently **234 unit tests** plus catalog/assets (244 pictures, zero missing, seven existing placeholders).
- Safety `.test-data/desktop-safety-1789448197227`: 7+8 passed before version bump. Development workflow `.test-data/electron-smoke-1789448202359`: 54+8 passed, including real storage IPC export/import with stubbed native pickers.
- Focused transfer `.test-data/transfer-health-1789448379578`: desktop 36, desktop restart 5, browser 29, browser restart 5 passed before version bump. Malformed data, failed commit/quota, close/reentry/autosave guards, legacy planet text, >5 MiB metadata and exact restart persistence were exercised.
- Browser coverage uses the real HTML/localStorage implementation without a preload inside isolated Electron. It is not a separate Chrome/Edge/Firefox test. Injected commit/quota errors and picker stubs are test-only; no production fault hooks ship.
- Initial harness runs uncovered a test return-value serialization issue, then the real zero-bonus restart mismatch. Both were corrected; failed-run evidence retained, normal exits used, no force-kill.
- Final v1.1.12 save-health `.test-data/save-health-1789448551539`: 6+6+7+3 passed. Final safety `.test-data/desktop-safety-1789448962505`: 7+8 passed. Final transfer `.test-data/transfer-health-1789448967640`: desktop 36+5 and browser-path 29+5 passed with matching graceful lifecycle records. Dependency audit reported zero advisories; no dependency updates.
- Two intervening browser-harness runs (`transfer-health-1789448558733`, `transfer-health-1789448764483`) timed out without matching clean-shutdown evidence. They are retained as failures, not counted as passes. Native reminders and background frame/screenshot waits were removed from this test-only browser path; final coverage is logical/localStorage, not browser visual testing. After reviewing each failure and verifying recorded processes/descendants absent, its exact manual-review lock was moved into the failed evidence directory; nothing was force-killed. The final cause of those processes' termination is unverified. Computer Use inventory had no targetable test window; no UI input was performed.
- Packaged acceptance completed. Aggregate: `.test-data/import-safety-acceptance.json`. All **16 final packaged phases exited normally**, with matching software-rendering/PID/will-quit diagnostics for the 15 current-app phases. The preserved v1.1.3 seed runtime predates diagnostics; its successful process exit and original backup bytes were checked separately.

| Packaged suite / directory under `.test-data` | Passing checks |
| --- | --- |
| `packaged-transfer-1789449151176` | Transfer 26, exact restart 4, backend file roundtrip 3 |
| `packaged-smoke-1789449158394` | Core workflow 51, restart 8, fullscreen startup 7, network 14 |
| `packaged-dedup-1789449241547` | Identity/import 131, restart 28, backend roundtrip 3, actual v1.1.3 seed 18, upgrade 29, version/backup assertions 3 |
| `packaged-warbonds-1789449254353` | Warbond 1711, restart 353, backend roundtrip 3 |
| `packaged-gear-1789449266968` | Gear/ownership 81, restart 10, backend roundtrip 3 |
| `packaged-sources-1789449276084` | Source organization 808, restart 167, backend roundtrip 3 |

Core regression includes offline first-launch Spin, locks/rerolls under existing faction rules, Results/scoring, Compare, Armory, Rank, WebAudio initialization (not listening), fullscreen and restart. Packaged transfer checks exercise actual UI-file import/preparation/commit IPC, malformed data preservation, >5 MiB metadata, zero bonus and full restart equality; they bypass the native file picker using browser File objects. Native picker stubs and simulated quota/commit errors belong only to source harness coverage.

The real community API returned **36 active planets on September 15 at 01:13:18 EDT**. Separate controlled network checks covered dated fallback, offline/429/invalid/empty/timeout and recovery. This does not implement M3's revised planet rules.

## Build and preservation

- Installer: `C:\Users\Chris\Desktop\HD2CSM-Source\dist\import-safety-v1.1.12\Helldivers-2-Chaos-Slot-Machine-Setup-v1.1.12-win-x64.exe`, 137,583,186 bytes.
- Installer SHA-256: `05a65c68686872aec5cb676e799dbe75d650aeaff16f1b7492652bb7a2e27cd1`.
- Portable ZIP beside it: `Helldivers-2-Chaos-Slot-Machine-v1.1.12-win-x64.zip`, 177,129,738 bytes; SHA-256 `b96d93673dcbb91aad0ff5a435e077bb5b9dc7fe6634a193a63dd2fde000ea34`.
- Archive/runtime verification passed: required files/assets present; no forbidden development/secrets patterns. Installer embedded payload integrity passed with 7-Zip's expected embedded-container trailing-data warning. **NotSigned**; no native installer execution or publication.
- **369 bundled source files** compared (package identity fields checked separately for builder normalization); external guide/icons and ZIP/runtime ASAR matched. Post-GUI parity rechecked; `.test-data/import-source-parity.json` contains hashes. ASAR SHA-256: `9793592d0ff8848c711eca1c4889c508164f40f6f1d321743c34c8fa8bca669b`.
- Six previously recorded artifact hashes remain unchanged: both accepted v1.1.10 installers, v1.1.10 ZIP/runtime ASAR, and v1.1.11 installer/ZIP. The v1.1.11 runtime ASAR was also independently preserved. Player folder still contains the same three v1.1.10 files; launcher still points to the isolated v1.1.10 preview.
- Final Win32_Process inventory found no Electron/HD2CSM test process; no active desktop-test lock remained. Failed harness locks/evidence are archived in their exact failed-run folders, not deleted. No personal save, installation, driver, GitHub, commit or release changes.

## Remaining boundaries

Native installer/upgrade/uninstall and native file-picker interaction, audible sound, physical display/trackpad/multi-monitor behavior, standalone-browser vendor tests, simultaneous native launch, long-duration/OS-shutdown stress and full IPC sender-boundary audit remain separate. Oversized transfers are rejected safely, not streamed or silently truncated. This is not an exhaustive security or import-format certification.

Next after acceptance: owner review/promotion decision, then resume the bounded Helldivers Mobilize/base-game catalog audit. M2 stays 126/205 reviewed; M3–M7 not started here. Keep accepted downloads unchanged without approval.
