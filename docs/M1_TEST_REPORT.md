# M0/M1 local review evidence — v1.1.1

September 13, 2026. Source branch `codex/m1-fullscreen-window`, based on published `hd2csm-v1.1.0` (`035e47a6480bf6b2a1c5c7aca2eaf0820dfcd7c3`). No push/tag/release performed.

## Scope and implementation

M0 workspace restoration and M1 fullscreen/window usability only. Source is in `C:\Users\Chris\Desktop\HD2CSM-Source`. The original runtime folder was not repaired/overwritten, its Git deletions were not staged, and no personal AppData saves were used in testing.

Normal desktop startup uses native Electron fullscreen. F11 suppresses repeats; renderer Escape closes Finalize, Difficulty or Result before exiting fullscreen. Window control IPC is limited to attached application main frames. The fixed desktop scrollport contains a minimum1280px canvas; container queries keep its layout stable below that width while the no-preload browser page remains responsive. Dialogs move outside that canvas and receive semantics, focus containment/restoration and inert backgrounds. Space-drag uses native scrolling, excludes controls/text/charts/nested scrollers, and never transforms the canvas. Toolbar state follows native transition events, avoiding stale command-return state.

## Executed checks

| Check | Result / evidence |
|---|---|
| Published-source baseline | `npm ci`;38 unit tests plus catalog/assets passed before implementation |
| Current unit/catalog/assets | `npm test` passed;44 unit tests,220 local references,0 missing,7 known rank/Warbond placeholders; all111 primary/sidearm/throwable/booster source images are bundled |
| Dependency audit | Compatible leaf patches only: @xmldom/xmldom0.8.13→0.8.15, fast-uri3.1.5→3.1.6, js-yaml4.3.1→4.3.2. `npm ls` confirms installed fixes. Fresh network-enabled `npm audit --json`:0 known vulnerabilities. Electron43.3.0 and builder26.15.3 unchanged |
| Development workflow | `npm run test:electron`:54 workflow +8 separate-process restart checks. `.test-data/electron-smoke-1789336889307` |
| Window integration | `npm run test:window`:75 checks. `.test-data/window-smoke-1789337553836/report.json` |
| Windows build | `npm run build:win`:x64 ZIP and offline NSIS installer successfully built unsigned |
| Package verification | `python scripts/verify_win_zip.py`:runtime, app source, new window assets, icons and111 source images present; forbidden development/secrets patterns absent; installer contains embedded application payload; checksum sidecars written |
| Actual packaged EXE | `node scripts/run-packaged-smoke.js`:51 offline workflow +8 restart +7 normal-startup +14 network checks. `.test-data/packaged-smoke-1789337337951/report.json` |
| Connected API | Actual packaged live request succeeded with35 active planets; subsequent controlled offline/429/invalid/empty/timeout/recovery checks passed |
| Signature | PowerShell Authenticode check:installer `NotSigned`, consistent with unsigned preview |
| Diff hygiene | `git diff --check` passed |

Workflow checks cover Spin animations, locks/rerolls, WebAudio context/output initialization, Results finalization, scoring/MO penalty, Compare, Armory ownership/search, Rank, import/export IPC and exact save values across process restarts. Native file-picker return values were stubbed in the development test; packaged file-picker clicking was not tested. Audio was not listened to.

Window checks use real Electron windows and injected native Chromium key/mouse events: actual fullscreen/F11/toolbar state, repeat suppression, dialog-first Escape through nested overlays, focus trap/return, numeric-shortcut suppression,1280→640 geometry on all five tabs, outer640×480 minimum including Windows frame, two-axis scrolling, background drag and search/text field protection. Dialog bounds were checked at125%,150%,200% **Electron page zoom**, not changed physical Windows display settings. Browser responsiveness used an isolated no-preload Chromium window, not the user's installed browser/profile.

Packaged normal-startup check removes automation environment flags. The informational first-save alert is pre-acknowledged only within that isolated fixture; normal fullscreen behavior itself is not bypassed. No installer was run over the current installed app.

## Artifacts

Directory: `C:\Users\Chris\Desktop\HD2CSM-Source\dist`

| File | Bytes | SHA-256 |
|---|---:|---|
| `Helldivers-2-Chaos-Slot-Machine-Setup-v1.1.1-win-x64.exe` |126198372|`94cb3ffc72ee18f90873f001747d0baf7ced89608e794efa8cc730918312f05f`|
| `Helldivers-2-Chaos-Slot-Machine-v1.1.1-win-x64.zip` |165736296|`7a97f3f12089629f6fe42c34e3f5ee26038532cd0dc6eec4c3027f054e99016d`|

The installer includes125867108 bytes of embedded payload; no Node/npm/Python or download-at-install runtime is required. Do not move the portable EXE away from its companion files.

## Limitations and remaining acceptance

- Not installed/upgraded over v1.1.0 during this milestone, to preserve the existing app. Installer install/uninstall/upgrade and shortcut registration belong to integration testing before public release.
- Native Windows computer-use capture failed twice with `SetIsBorderRequired failed: No such interface supported (0x80004002)`; accessibility text was insufficient. That manual native UI attempt is **unverified**, not passed. The isolated process was closed afterward. Electron renderer captures of startup, small-window tabs and dialogs were inspected successfully.
- Physical Windows125/150/200%DPI, multi-monitor transitions, real touchpad/pinch, native select popups/file pickers and audio listening still require hands-on checks.
- The npm audit result is not a certification of the embedded Chromium/Electron runtime or all application security.
- Existing7 rank/Warbond placeholders remain; Warbond cover auditing is M2/M4, not silently claimed fixed here.
- Legacy faction-locked planet behavior and broad mission families are intentionally unchanged until M3/M5. Catalog and live-war additions are not present in this preview.
- Unsigned builds may show unknown-publisher/SmartScreen warnings. Public signing needs configured Windows code-signing credentials; no signing claims are made for this build.

## Owner checklist

Open `C:\Users\Chris\Desktop\HD2CSM-Source\scripts\start-local-preview.cmd` to run the actual packaged EXE using `dist\review-profile-v1.1.1`. This review data is separate from your personal save. No development tools are used by the launcher.

1. Confirm fullscreen startup, exit with F11, resize smaller, and reenter with the toolbar.
2. Scroll both directions. Hold Space and drag an empty margin; verify buttons and text fields retain normal behavior.
3. Spin, open Results, open a confirmation, and press Escape one layer at a time.
4. Save a test Result, close and reopen through the same launcher, and check it remains.
5. Try your usual Windows scaling/monitor and listen to reel audio. Report any clipped or unreachable controls.

Do not install into the source folder or extract over the older runtime folder. GitHub publication requires separate approval after review.
