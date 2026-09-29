# Fullscreen and smaller-window acceptance — local review

Owner priority: finish window behavior before resuming the gear/Warbond audit. Branch `codex/window-behavior-polish`; descriptive build label `window-behavior`, internal version still 1.1.14. No publication or installed-app replacement is authorized by this local review step.

## Behavior

- Normal desktop launches start in true fullscreen. F11 and the accessible toolbar toggle it; held F11 is suppressed. Escape dismisses the top app dialog first and exits fullscreen only when none remain.
- Windowed minimum remains 640 × 480 outer Windows pixels. The desktop canvas remains at least 1280 CSS pixels wide with native horizontal/vertical scrolling. Browser mode remains responsive.
- Space-drag is limited to noninteractive background. Buttons, fields, selected text and nested scroll areas are protected. This pass fixes a reproduced stale dragging state after pointer-capture loss, and cancels pan state on dialog activation, focus entering an interactive control, resize, blur and document hiding. Capture release is reentrancy-safe, including pointer ID zero.
- App dialogs remain viewport-level, scroll internally and preserve focus containment/restoration. No scoring, gear, ownership, migration or save-format changes were made.

## Tests and evidence

- Baseline 279 unit tests and validators passed. Final **282 unit tests**, catalog and asset validators passed; three new panning regressions. `.test-data/window-polish-unit-final.log`.
- Focused software-rendered safety gate passed **7 startup + 8 restart/fullscreen-close** checks: `.test-data/desktop-safety-1789528044875`.
- Expanded real Electron window suite passed **93 checks**: `.test-data/window-smoke-1789528192368`. Includes injected native F11/Escape/Tab/drag/wheel, repeated-key handling, fixed geometry on all five tabs, minimum outer dimensions, dialog focus/keyboard isolation, both scroll axes, capture-loss cancellation, responsive browser fallback, and dialog/control bounds at minimum window plus 200% page zoom.
- Existing source workflow passed **54 workflow + 8 separate-process restart** checks: `.test-data/electron-smoke-1789528277026`. Covers Spin, locks/rerolls, Results/scoring, Compare, Armory, Rank, WebAudio initialization and stubbed import/export paths. No audible listening or native file-picker check claimed.
- Fullscreen and minimum-size Result/Finalize renderer captures were visually inspected. Contact points/control bounds are automated; page zoom is not physical Windows DPI validation.
- The first expanded run reproduced the pointer-loss bug (`window-smoke-1789528103070`). A subsequent run exposed an input-timing problem in the wheel test (`window-smoke-1789528164353`); the test now waits for scroll reset and positions the pointer before sending wheel input. Both failed runs quit normally, recorded `will-quit`, and released their locks before further GUI work. No force termination or system setting changes.

## Owner acceptance and remaining integration coverage

Owner subsequently confirmed: **“looks good, i confirm fullscreen behavior.”** Fullscreen behavior is accepted and the pause on remaining catalog development is lifted. This records feature acceptance only: no installation, download replacement or publication was performed. It does not imply the owner individually tested every scenario in the checklist below.

Automated implementation checks can be complete without pretending physical testing occurred. Still unverified: physical 125/150/200% Windows scaling, moving between different-DPI monitors, actual trackpad gestures, native OS select/file-picker behavior and long-duration stability. Software rendering remains enabled; this is not proof the earlier Windows graphics crash cannot recur.

Use `scripts/start-window-review.cmd` after package verification. It launches the candidate normally/fullscreen with isolated `.test-data/window-behavior-owner-review` saves; the installed app and accepted preview launcher remain unchanged.

Hands-on checklist:

1. Open the review; confirm fullscreen startup and use F11 to resize it smaller.
2. Try wheel/trackpad, both scrollbars and Space-drag on an empty background. Controls should keep their usual behavior.
3. Open a Result and its Finalize dialog; Escape should close one layer at a time before leaving fullscreen.
4. Try your usual monitor/scaling, then close and reopen the review. Report clipped controls or uncomfortable scrolling before we return to catalog work.

This checklist does not require changing Windows settings, installing over your app or using personal saves. The candidate is unsigned and local only.

## Packaged verification and cleanup

- `dist/window-behavior-review`: unsigned installer and portable ZIP built and verified for archive integrity, required assets/runtime, embedded installer payload and checksum sidecars. Installer 139,618,869 bytes / SHA-256 `4cee29d2bda47c39787fd36a9847bac3fc75d3a898d5159a8f5ed476916d9719`; ZIP 179,304,801 bytes / `d40d269d0b12ee0abbc44547ee85d19eee78d38bcd3d04c0688221e27a60c8e9`.
- All 377 packaged files matched source; runtime/ZIP ASAR, external guide and icons agreed. ASAR `0f12765df1acd214a09d37f68fa99a325260113fd3f306a780493709bd35bb33`.
- Actual packaged EXE: **51 workflow, 8 restart, 7 normal-startup/fullscreen, 14 controlled-network checks**, four normally exited processes: `.test-data/packaged-smoke-1789528451785`. This packaged suite is not the broader 93-check native-window suite, which ran from source. The native installer itself was not executed.
- Aggregate verification: `.test-data/window-behavior-acceptance.json`. Catalog, item image mappings and storage code unchanged compared with the prior package. Installed app, accepted Desktop installer and 73 existing personal-profile files still match their earlier hashes. Desktop download still has three files; no public writes.
- Archived all 87 superseded Support Weapon candidate files with before/after hashes under `.test-data/desktop-cleanup-2026-09-15/superseded-support-weapon-candidate/support-weapon-review`. Adjacent manifest records original paths for restoration only when absent. Nothing permanently deleted. Only accepted `preview-v1.1.10` and the new `window-behavior-review` remain active.
