# 1.0 test candidate — September 29, 2026

**Later checkpoint:** the owner-approved native upgrade and installed-EXE tests have now passed. See [INSTALLER_1_0_UPGRADE.md](INSTALLER_1_0_UPGRADE.md) for current installation, Desktop/profile handling and archived preview state. The preparation-only observations below remain historical; artifact hashes are unchanged. No public release occurred.

Prepared locally on `codex/release-readiness`. This is an **unsigned test candidate**, not the approved official release. Versioned filenames do not change the application's `local-preview` channel. Public display version is 1.0; Windows/package compatibility version stays 1.1.14. No tag, merge, publication or installer execution occurred in this checkpoint.

## Artifacts

Located in `dist/release-candidate/`:

| File | Bytes | SHA-256 |
| --- | ---: | --- |
| `HD2-Chaos-Slot-Machine-Setup-v1.0.0-win-x64.exe` | 152182134 | `c060a0869ff6b9333ee5881c1d3b6a397a66150d76e066fbdd2953191a58dbbb` |
| `HD2-Chaos-Slot-Machine-v1.0.0-win-x64.zip` | 193787290 | `ed18ddaf57d3c5be85f93be23e85dd06e52d6123fd6f57720d1c2a88a2f0938c` |

Matching `.sha256` files are alongside both downloads. Extract the complete ZIP before use; do not move its EXE away from the other files. Setup and ZIP are alternatives, not two required downloads.

App ASAR: `72f1e404fb43bbe0e63eb96f4dd70b2c1745f6f6788ae7108ac767f32dc8c22c`.
App EXE: `950aedc58c9620c8423001efe1b970904a700c76b5e774cac61fdeeff583df44`.
These match the accepted card-rules runtime. The rebuilt distribution includes the updated external SECURITY.md guide and current patched build dependencies. No gameplay, scoring or save-format change was made here.

## Verification completed

- Build succeeded with Electron 44.4.5 and electron-builder 26.15.3, publishing disabled.
- **909/909 local unit tests**, CSP, catalog and asset validation pass. Installer source/notice validation also passed during prebuild.
- ZIP CRC/required-file checks and checksums pass. All **552 ASAR source files**, selected embedded installer payloads, external guides/notices, hardened fuses and ZIP parity verified. Installer/uninstaller components match reviewed materials; no WinShell component found. Extraction/inspection is not installer execution.
- Actual candidate EXE, sequential software-rendered tests, isolated synthetic profiles, graceful exits:

| Test | Checks | Evidence under `.test-data/` |
| --- | --- | --- |
| Workflow, restart, fullscreen startup, controlled network, cached restart | 333 + 16 + 9 + 33 + 5 | `packaged-smoke-1790711977770/report.json` |
| Import/export and restart | 31 + 7, plus backend roundtrip | `packaged-transfer-1790712064825/report.json` |
| Card rules and restart | 25 + 6, verified recovery copy | `packaged-smoke-1790712073355/report.json` |
| Renderer security | 44 | `packaged-security-1790712079928/report.json` |
| Gear ownership and restart | 155 + 13 | `packaged-gear-1790712085206/report.json` |

- Fresh npm audit: **0 known vulnerabilities**. Defender candidate-folder scan exited 0 and reported **no threats**; remediation was disabled for this diagnostic scan. Setup/ZIP hashes rechecked afterward. Neither result is a malware/security guarantee.
- Authenticode: app, Setup and extracted uninstaller all **NotSigned**. No credentials configured, no signing or protection bypass performed.
- Distribution inventory: 99 runtime files, 552 ASAR files, 450 media files, 780 upstream notice sections, no ASAR node_modules entries. Artwork index records 109 documented-origin files and 14 catalog-associated crossover files; it establishes no redistribution permissions. The older 380-file inventory is historical, not this candidate.

Build/test/audit/scan/signature logs and inventories: `.test-data/release-candidate-checks/`. Detailed payload inspection: `.test-data/release-candidate-artifact-inspection/report.json`. These private evidence folders are excluded from Git and downloads.

## Preserved state

Desktop shortcut still launches the accepted card-rules preview with the same owner-review profile. The actual LocalAppData installation was not changed; personal cards were not read, recalibrated or removed. No Desktop duplicates were created. Keep the accepted runtime and installed baseline until a tested candidate is deliberately promoted; the additional candidate directory is pending evaluation, not obsolete clutter. Do not rerun old one-off cleanup scripts.

Hosted CI remains green for public draft PR407 head `cae7b2275e515a418db276fc57e9657fb8474930`; this checkpoint's verifier/documentation changes are local and are not claimed to have run on hosted CI. Main and release tags remain untouched.

## Next gate and remaining decisions

1. Arrange the final backed-up installer upgrade test with the owner, including close-app confirmation and preservation of both normal installation data and the separate owner-review cards. Do not silently switch to the installed profile and present missing review cards as data loss. Prior basic hands-on acceptance remains recorded; this checkpoint does not repeat that request.
2. Clean-Windows fresh-install/uninstall remains deferred. A different install directory/profile on this PC is not a separate Windows environment. Do not test uninstall against the owner's installation.
3. Resolve the artwork-use basis/replacement decision and signed versus explicitly approved unsigned distribution policy. A fun/noncommercial purpose, attribution or a scan is not recorded as permission or a signature. Any workflow-policy changes require explicit review, not removal of a failed gate.
4. Finalize release-channel labels, release notes, public download guidance and approved release evidence. Rebuild/reverify final bytes after any packaged changes. Refresh remote CI for the final source revision.
5. Obtain final publication approval, then merge/tag/publish the new immutable project release and verify downloaded assets. This test candidate must not be silently relabeled as a signed or fully accepted official release.
