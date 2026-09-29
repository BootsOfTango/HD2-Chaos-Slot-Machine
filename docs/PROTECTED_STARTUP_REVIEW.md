# Protected startup and origin migration review

September 16, 2026. Branch `codex/local-protocol-integration`. Local internal version stays 1.1.14; this is not the public 1.0 release. Installed application, personal saves and Desktop files are outside the test scope and remain untouched.

## Implementation

- Normal desktop pages now load from `hd2-slot://app/index.html`. Exact main-frame IPC authorization changes with that URL; the former file-origin app and migration bootstrap cannot call the desktop bridge. The separate browser version remains supported.
- Main startup waits for a hidden, script-free, sandboxed, no-preload storage reader. A private allowlisted source/destination snapshot and copy plan are durably written to `recovery/origin-copy-v1.json` before destination writes. Interrupted copies resume the recorded plan, not a recomputed save-family decision. Conflicts or invalid journals stop startup without loading the normal renderer.
- Existing destination save families win over old data, including destination backups/damaged data. A completion marker and completed journal prevent resurrecting deliberately deleted keys. Original file-origin values remain unchanged. Snapshot sizes are bounded; unrelated keys are excluded. The recovery journal may contain private player data and must stay out of Git/releases.
- Native state/backup recovery takes precedence. Only absent native state permits validated and normalized origin fallback promotion. Unsupported future formats and unrecoverable native/origin data block automatic defaults. Fixed an additional edge case where unrecoverable native data could otherwise return an empty result on subsequent launches.
- The prior literal imported-Result-ID selector fix is included. Added exact CSS resource entries after the first integrated layout test exposed their omission; the resource test now checks stylesheet links as well as scripts.
- Packaged fuses disable RunAsNode, Node options and Node CLI inspect; require ASAR loading and embedded ASAR integrity validation. Actual bit verification is part of the build checker, not an assumption from configuration.

### Deliberate file-compatibility exception

`GrantFileProtocolExtraPrivileges` remains **enabled** for the old file-origin storage reader. Two packaged attempts with it disabled failed safely: ASAR file URL resolution failed first; an external script-free reader then could not read localStorage. An isolated stock Electron 44.4.1 copy with only that fuse changed confirmed `SecurityError: Failed to read the 'localStorage' property from 'Window': Access is denied for this document.` It is therefore not safe to disable this bit in an upgrade that must preserve old origin data.

Normal app rendering still uses the restricted custom protocol. The old app is never loaded to read storage; the reader has restrictive CSP, no application IPC/preload, and is closed before normal startup. No extra external bootstrap remains in the final package. Retiring this compatibility bit needs a separately proven migration strategy or a clearly scoped future clean-install policy; do not silently drop old data to mark a hardening checklist complete.

Reference: [Electron fuse documentation](https://www.electronjs.org/docs/latest/tutorial/fuses). Cookie encryption, browser-specific V8 snapshots and Wasm trap handling retain their existing defaults. These controls do not establish protection against an already-compromised local account or guarantee freedom from malware/crashes.

## Source evidence

- **337 unit tests**, CSP/catalog/assets validation: `.test-data/protocol-integration-unit-final.log`. 247 local picture references, zero missing, seven preexisting placeholders.
- Final source safety **7+8**: `.test-data/desktop-safety-1789591879415`; workflow **54+8**: `.test-data/electron-smoke-1789590738440`.
- Renderer/CSP **44+44**, desktop plus browser emulation: `.test-data/renderer-security-1789590912701`. Transfer **36+5 desktop /29+5 browser emulation**: `.test-data/transfer-health-1789590918899`.
- Eight normal-entry migration scenarios, each seed/migrate/restart: final `.test-data/origin-startup-1789591884681/report.json` (131 checks across 24 processes). Covers valid/missing/backup recovery/future/native/native damaged/destination priority/recorded partial-copy resume. Simulated interruption uses durable partial fixtures and normal exits, **not a forced process kill or power-loss test**. Earlier passing run remains at `origin-startup-1789590848082`.
- Earlier custom-origin browser-mode proof rerun: `.test-data/local-protocol-1789590927271` (7 seed +31 migrate +24 restart; embedded 43 renderer checks; 206 mapped equipment images decode). Not a substitute for desktop integration evidence.
- All GUI suites sequential, isolated, software-rendered and normally shut down. Final packaged acceptance is recorded below once completed.

## Retained failures and recovery

- First integrated source safety failure: `.test-data/desktop-safety-1789590694802` (CSS allowlist, fixed).
- Initial build command failed because PowerShell split an unquoted dotted configuration argument; quoted `--config.directories.output=...` works. Logs retained.
- Failed ASAR reader candidate: `.test-data/protected-startup-failed-asar-reader` (89 files hash-verified during move); test `.test-data/packaged-smoke-1789591184279`. Failed external file-storage candidate: `.test-data/protected-startup-failed-file-storage` (90 files hash-verified); test `.test-data/packaged-smoke-1789591384256`. These are failure evidence, **not usable installers**.
- Fuse-only diagnostic runtime: `.test-data/electron-file-fuse-probe`; final explicit error evidence `.test-data/origin-startup-1789591521129/fallback/seed/process.log`. Earlier reporting probes retained. They exited normally; no force-kill or security/driver setting changes.

## Packaged acceptance

Final compatible candidate: `dist/protected-startup-review`.

- **10 actual old-EXE origin phases**: `.test-data/packaged-smoke-1789591719565`. Previous Runtime Security EXE seeds file-origin and native fixtures; new hardened EXE preserves native priority, promotes fallback and resumes a staged partial copy, each followed by restart. Durable journal source byte values match the seeded allowlist; original synthetic native files moved to recoverable fixture archives rather than deleted. Private resource requests rejected and required catalog/CSS loads succeed. No forced crash was used.
- Core **51 +8 restart +7 fullscreen/normal +14 network**: `.test-data/packaged-smoke-1789591759635`. Actual packaged fullscreen screenshot inspected at 1920x1080. Controlled network cases, not external API availability certification.
- Renderer/CSP **44**: `.test-data/packaged-security-1789591804683`.
- Transfer **26+4**, plus backend file roundtrip: `.test-data/packaged-transfer-1789591809093`.
- Gear/ownership **97+11**: `.test-data/packaged-gear-1789591816513`.
- Deduplication **131+28**, actual v1.1.3 seed/upgrade **18+30** with original save backup preserved: `.test-data/packaged-dedup-1789591826163`.
- **23 packaged processes** across those suites, all graceful exits. Final source migration/safety reruns also pass. No remaining desktop-test lock or app test process at cleanup.
- **386 ASAR source comparisons**, ZIP/runtime ASAR equality, external guides/notices/icons parity, and actual fuse bits checked in `.test-data/protected-startup-source-parity.json`. ZIP CRC/content checks pass. Installer outer and inner archive tests pass; extracted embedded EXE and ASAR hashes equal the tested runtime. Evidence `protected-startup-installer-integrity.log`, `protected-startup-inner-integrity.log`, `protected-startup-installer-payload` under `.test-data`.
- Defender custom scan of the final directory: **no threats found**, remediation disabled, exit 0 (`.test-data/protected-startup-defender.log`). npm audit: zero reported known advisories (`.test-data/protected-startup-dependency-audit.json`). Bounded checks, not guarantees or proof of exhaustive vulnerability coverage.

Final unsigned installer **`HD2CSM-Setup-local-protected-startup-win-x64.exe`**, 153,708,384 bytes, SHA-256 **`1464973a5be4d57bc9599635106e903ce42657a81d0eb9cb5318648e9296d307`**. ZIP **`HD2CSM-local-protected-startup-win-x64.zip`**, 195,312,497 bytes, SHA-256 **`b7641d934ad159a9fee9a0c607048ceeef3d84803c648133e66193f7a5d2ef30`**. Tested runtime EXE SHA-256 `06cb0dd889df36997966e6155497cd9b924cbfc067abb6fa09357f8790145c6c`.

Use `scripts/start-protected-startup-review.cmd` for an isolated local review. No native installer was executed, no personal app/profile changed and no Desktop copy added. Native install/upgrade/uninstall, real file-picker clicks, audible sound, physical DPI/mixed monitors/trackpad, power-loss recovery and long-duration stability remain unverified in this pass. Browser checks use Electron without preload, not independent browser certification. Production ASAR integrity flags/embedding verified; deliberately tampered runtime launch was not tested.

Archived/hash-verified **89** superseded Runtime Security files under `.test-data/desktop-cleanup-2026-09-16/superseded-runtime-security-candidate/runtime-security-review`. Adjacent `manifest.json` records original/restoration paths and hashes. Old isolated launcher and upgrade runner now target that archive. `dist` retains only accepted `preview-v1.1.10` and latest `protected-startup-review`. Nothing permanently deleted; failure evidence and test profiles remain recoverable off Desktop.

## Next / release limits

Startup integration and this local packaged regression gate are complete, with the explicit file-fuse compatibility exception above. Next bounded release-preparation task is the exact shipped dependency/runtime/license inventory, followed by resolving outstanding artwork rights/provenance and final full-word branding/version compatibility. Do not claim artwork clearance or publish merely because runtime checks pass. Public release still requires hosted CI/security-reporting work, final native installer/upgrade checks and a documented signing/unsigned distribution decision. No commit, push, tag, release or GitHub setting change in this pass.
