# Desktop graphics safety — local v1.1.6 candidate

## Scope

Owner approved app-side safeguards after the September 14 Windows graphics-scheduler crash. Branch: `codex/desktop-graphics-safety`. The in-progress Warbond audit is preserved; this task does not implement the remaining roadmap or publish a release.

- `app.disableHardwareAcceleration()` runs before Electron readiness for all app entry points. The interface, browser version, save schema, equipment and scoring are unchanged by these safety edits. CPU use/animation performance can differ with software rendering.
- A native fullscreen close returns to windowed mode, waits briefly for the transition to settle, then requests ordinary window close. Existing close/beforeunload cancellation is respected. A failed fullscreen exit leaves the window open rather than destroying it. The packaged runner explicitly exits fullscreen before its renderer-driven `window.close()`, which bypasses Electron's native window-close event.
- All desktop runners use the same exclusive lock in the current user's temporary directory. A live owner or orphaned child prevents another suite. Partial/unreadable locks and uncertain shutdowns fail closed.
- Development harnesses use normal `app.quit()` / `window.close()`. Packaged tests wait up to 30 seconds for process completion instead of terminating after 500 ms. A timeout stops the suite; no force-kill fallback exists.
- Tests write flushed, atomically replaced reports. The latest `desktop-diagnostics.json` in the selected profile records bounded lifecycle/GPU-status events, not cards or player data. This reduces interrupted-write risk but cannot guarantee survival of a system crash or power loss.
- Test profiles remain isolated; the installed application and personal saves are not changed.

The installed NVIDIA update now reports 581.80 on both GPUs after restart, with healthy device status. The owner confirmed Control Panel opens. Its original installer finalization error remains unexplained. No additional Windows/driver/security changes are part of this task.

## Verification gates

1. Node unit tests and catalog/assets checks, without launching Electron.
2. `npm run test:desktop-safety`: one windowed offline startup/save/exit, then a separate fullscreen startup/restart/guarded-close process. This deliberately omits the `--disable-gpu` test flag to verify the app's own default.
3. Existing workflow/restart checks, one process at a time.
4. Separate safety build, package-content integrity/source comparison, then packaged workflow and normal-startup verification.

No GUI suite runs concurrently with another GUI suite or packaging during this verification. The broad 75-check window/DPI-emulation suite is updated but is not part of the first cautious gate.

## Executed evidence

- Final unit run: **161 passed**, including 22 graphics-safety/test-runner tests; catalog validation passed; 233 local picture references, zero missing assets, seven existing placeholders outside the previously corrected weapon/booster paths. Evidence: `.test-data/graphics-safety-unit-final.log`. Includes a separate Node process refusing the occupied test lock; no GUI process is needed for that test.
- `.test-data/desktop-safety-1789431201720/report.json`: 7 windowed checks + 8 restart/fullscreen checks passed. Both processes exited normally. Recorded compositor and rasterization status: `disabled_software`; fullscreen close recorded transition completion before window close and `will-quit`.
- `.test-data/electron-smoke-1789431299372/report.json`: 54 workflow checks + 8 separate-process restart checks passed, including offline Spin, locking/rerolls, WebAudio context, Results/scoring, Compare, Armory, Rank, storage bridge export/import and persistence. The source harness also exercises its controlled network cases. Native file pickers are stubbed, and sound is not an audible listening test.
- `.test-data/packaged-smoke-1789431914742/report.json`: the actual new packaged EXE passed **51 workflow + 8 restart + 7 normal-startup/fullscreen + 14 controlled network checks**. All four processes exited with code zero and matching `will-quit` diagnostics. Each phase records `*-close-preparation.json`; normal startup confirms `wasFullscreen: true` and `isFullscreen: false` before renderer close. The focused source test above separately verifies the native close guard. This final run supersedes the earlier packaged run whose checks passed but whose renderer close did not explicitly prepare fullscreen shutdown.
- Packaged artwork: all 51 primary, 24 sidearm, 21 throwable and 18 booster image paths decoded offline; four reported slot examples rendered. Fullscreen renderer capture visually inspected at 1920 × 1080. WebAudio initialized, but no audible listening test was performed. The faction-locked planet behavior is still the existing rule; unrestricted cross-faction selection remains Milestone 3 work.
- Controlled network cases cover success, dated cache, offline, rate-limit, invalid, empty, timeout and recovery. These do not prove the external API's actual availability or correctness.
- Build completed with Electron 43.3.0 / electron-builder 26.15.3. `python scripts/verify_win_zip.py --dist dist/safety-preview-v1.1.6` passed ZIP CRC, executable headers, installer payload and bundled-asset checks. 7-Zip independently tested the installer payload successfully. Authenticode status: `NotSigned`.
- `dist/safety-preview-v1.1.6/source-parity.json`: **349 bundled source files** match source bytes; package identity/version and external `README-FIRST.txt` also match. Installer is 131,310,096 bytes, ZIP is 170,852,676 bytes. SHA-256 sidecars are present:
  - Installer: `9ece98cf7972856b245598e85b6f4898781e31f15fc19475e289f38315b54729`.
  - ZIP: `eeea264ea02f00e51aa508cb8d12d2ebba1ef9e099a3fc05e4848476e24b5fe4`.
- At September 14, 20:28:42 EDT, Windows System warning/error/critical events since 20:13 contained no matching Display, nvlddmkm, WHEA, BugCheck or WER-SystemErrorReporting entries. Boot time remained 19:52:28; no Electron/HD2CSM test processes or test lock remained. This bounded log check is not a stability certification.

## Local output and review

New output directory: `dist/safety-preview-v1.1.6/`.

- Installer: `Helldivers-2-Chaos-Slot-Machine-Setup-v1.1.6-win-x64.exe`.
- ZIP: `Helldivers-2-Chaos-Slot-Machine-v1.1.6-win-x64.zip`.
- Runtime: `win-unpacked/Helldivers 2 Chaos Slot Machine.exe`.
- `scripts/start-local-preview.cmd` uses this runtime with `dist/review-profile-safety-v1.1.6`.

The damaged v1.1.6 installer directly under `dist/` remains preserved and MUST NOT be used. The tested EXE is the new packaged runtime under `safety-preview-v1.1.6/win-unpacked`, not a copy installed through the native installer. No installer was run over the owner's installation. This is an unsigned local candidate, not a completed public release or a completed Warbond-audit gate.

## If a desktop test stops

Packaged runners now require an explicit verified EXE path, for example `node scripts/run-packaged-smoke.js 'dist/safety-preview-v1.1.6/win-unpacked/Helldivers 2 Chaos Slot Machine.exe' --warbonds --warbond-batch=3`. There is no default runtime fallback. Path/type/MZ-header preflight rejects missing or damaged files before GUI launch; complete artifact verification is still required.

Stop subsequent GUI tests. Inspect the evidence directory and `%TEMP%/hd2csm-desktop-tests.lock`. Do not delete an unreadable lock or a manual-review lock automatically. First verify the exact owner/child processes and any descendants have ended, and review the reported failure. Stale recovery is automatic only for a valid lock whose recorded owner and child are both absent, with no manual-review flag. PID reuse or ambiguous process state intentionally blocks rather than guesses.

## Still unverified

- Long-duration stability or elimination of the original BSOD; its hardware/Windows/driver root cause is not established.
- Full physical Windows DPI/multi-monitor/trackpad testing and the broad window suite on this candidate.
- Native installer upgrade/uninstall and native file-picker interaction.
- Audible sound, high-load animation performance, and hardware rendering (intentionally disabled).
- Remaining catalog-review and roadmap milestones. The v1.1.6 Warbond-specific automated regression gate subsequently passed; see `M2B_WARBOND_BATCH3_TEST_REPORT.md` for its 165-test final unit count and exact packaged evidence.

The interrupted Warbond regression/build acceptance has now passed with exclusive, non-forcing runners. Next: owner review of the isolated preview and the next bounded catalog audit recorded in `PROJECT_STATUS.md`. No GitHub publication without owner approval.
