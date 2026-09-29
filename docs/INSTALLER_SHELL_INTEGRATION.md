# Installer shell integration — September 16, 2026

Branch: `codex/installer-shell-integration`. Previous dirty work preserved. Local, unsigned candidate; internal version stays 1.1.14 and public identity remains **HD2 Chaos Slot Machine 1.0 · Local preview**. No publication, commit, tag, driver/security-setting change or artwork outreach.

## What changed

The original System/Windows-API helper now replaces all ten WinShell calls in the locked app-builder-lib 26.15.3 templates. `scripts/prepare-installer-shell.js` checks exact original/patched SHA-256 values and the dependency version before changing anything. It stages both files, rolls back ordinary partial-write failures and refuses unexpected changes. Preparation is idempotent and reapplied by `prebuild:win` after `npm ci`. A `beforePack` check refuses unprepared direct builds. An implicit `build/installer.nsi` is rejected too.

Only `include/installer.nsh` and `uninstaller.nsh` are mechanically adapted; no builder JavaScript or stock `installer.nsi` is changed. `nsis.include` loads the helper in both build passes; **`nsis.script` stays unset**. The normal separate uninstaller generation/signing hook is retained. Build logs explicitly show both uninstaller and installer signing stages skipped because this local build is unsigned. This is not a successful credential-backed signing test.

Shortcut identity failures produce an install-details warning, persistent `installer-shell-warnings.log` and an interactive warning (silently defaulted during `/S`). Installation remains usable. Unpin/jump-list requests remain Windows-controlled best-effort operations; HRESULTs alone do not prove that a real pin or populated list was removed.

Both distributions contain the original helper and integration sources under `licenses/hd2-shell`, covered by the accompanying project Apache-2.0 license, alongside the unchanged upstream legal/source archives. Historical WinShell matching evidence remains in the old manifest, explicitly labeled as historical; no WinShell DLL is bundled in this candidate. This resolves that dependency's inclusion, not the broader artwork/legal review.

## Artifact evidence

- Installer: `dist/installer-shell/HD2-Chaos-Slot-Machine-Setup-local-installer-shell-win-x64.exe`
- SHA-256: `724d7db910f7cf74bdb7192cab5e103b0e37a549513d0d56683e41d3addc56fe`
- Portable ZIP: `dist/installer-shell/HD2-Chaos-Slot-Machine-local-installer-shell-win-x64.zip`
- ZIP SHA-256: `de19ce48dd32dea5cff96a930d064b4f284fcf36059476ee22856293f0ab4736`
- Embedded uninstaller SHA-256: `ef2a6ad818d1c6adb5fbb9375241fbbca49ebf9c2924344542ef06718e1b8fa4`

`python scripts/verify_win_zip.py --dist dist/installer-shell --local-label installer-shell` passes ZIP CRC, exact bundled helper/legal-source comparisons, payload/runtime checks and checksum generation. `node scripts/verify-combined-build.js installer-shell` verifies **389 ASAR source files**, **27 embedded payload comparisons**, **14 upstream legal/source files plus two helper files**, hardened fuses and archive integrity. Outer installer has exactly six DLL plugins; embedded uninstaller has five, including System and **no WinShell in either**. Three retained separate plugins still match their pinned upstream archives. Evidence: `.test-data/installer-shell-artifact-inspection/report.json`.

Application EXE and ASAR remain byte-identical to Combined Preview (`4976e83c…` and `f8e05a94…` respectively); only packaging, external notices/source delivery and installer behavior changed. Previous 23-phase application results remain historical evidence, not newly rerun tests. The new packaged candidate did receive a fresh core test: **54 workflow + 8 restart + 7 normal/fullscreen + 14 controlled-network checks**, all gracefully exited using isolated software-rendered profiles. Evidence: `.test-data/packaged-smoke-1789600913439`.

Native private fixtures pass **42 assertions**, including production wrapper success/failure logging, register/stack preservation, Unicode links, damaged/read-only/missing links and a compiled private fixture uninstaller: `.test-data/installer-shell-1789600628120/report.json`. This fixture does not uninstall the product. **367 unit tests** plus CSP/catalog/assets pass; results are recorded in `.test-data/installer-shell-integration-unit-final.log`.

Defender custom scan of the complete candidate folder finished with **no threats found**, exit 0 (`.test-data/installer-shell-defender.log`). App, Setup and extracted uninstaller all report **NotSigned**. This is a bounded scan, not a guarantee against malware or hacking.

## Owner-approved native upgrade

The earlier explicit authorization to back up and upgrade the actual installation was followed, still excluding standalone uninstall acceptance against personal data. With the app closed, **287 files** were copied/hash-verified, including the complete existing installation, current/legacy profiles, cache material and both shortcuts; the two exact registration keys were exported. PRIVATE recovery directory: `.test-data/shell-integration-upgrade-1789601033405`. Never publish it or rerun its one-off installer blindly.

The new Setup ran with `/S /currentuser` and the already-resolved existing installation path, exiting **0**. **97 installed runtime files** match the candidate; the installed uninstaller matches the separately inspected new binary. No extra/missing runtime files or shell warning log appeared. Both shortcuts have the expected EXE, empty arguments and unchanged app ID. Registry identity/version/uninstaller target are correct. All **188 existing profile files stayed byte-identical immediately after installation**.

Installed path: `C:\Users\Chris\AppData\Local\Programs\HD2 Chaos Slot Machine\HD2 Chaos Slot Machine.exe`. Installed runtime tests use separate profiles; this batch does not claim a new real-personal-profile gameplay test. The previous two real-profile launches are documented in `INSTALLER_SHELL_REVIEW.md` and apply to the same application bytes.

The actual installed EXE also passes **54 workflow + 8 restart + 7 normal/fullscreen + 14 controlled-network checks** (`.test-data/packaged-smoke-1789601107540`), with graceful exits. No app/test processes or shared test lock remain.

## Cleanup and limits

Archived/hash-verified **82** obsolete v1.1.10 preview files to `.test-data/accepted-builds/preview-v1.1.10`; adjacent move manifest gives exact restoration paths. Old launcher now targets that recovery fixture. No permanent deletion, personal-save cleanup or Desktop duplicate. `dist` retains Combined Preview as rollback baseline and Installer Shell as current candidate. `scripts/start-installer-review.cmd` uses a separate owner-review profile.

Still unverified: standalone product uninstall/reinstall, clean-machine/all-users installation, real populated jump-list/pin removal, native installer-wizard clicks, physical DPI, audible listening, native file-picker interaction, credential-backed signing and long-duration stability. Do not test standalone uninstall against this personal installation. A separate Windows environment is needed for that acceptance gate.

Next: final installer/component-notice review and a safe clean-install/uninstall test environment, then the remaining approved roadmap. Artwork permission/use bases, hosted CI/security enforcement, final release signing/scan, user acceptance and Milestones 3–7 remain separate gates. No public release is authorized by this local result.
