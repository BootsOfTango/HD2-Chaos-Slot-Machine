# Combined local preview — September 16, 2026

**Later acceptance:** the owner subsequently authorized a backed-up real upgrade. It passed along with installed-EXE and actual-profile restart checks; see `INSTALLER_SHELL_REVIEW.md`. The native-test limitations below describe this earlier checkpoint and are not rewritten as if they had already passed then. Product uninstall/fresh-machine acceptance remains open.

Branch `codex/combined-preview`. The first full-word **HD2 Chaos Slot Machine** Windows candidate now combines public-identity preparation, protected startup/security changes and installer license/source materials. Displayed **1.0 · Local preview** is not a public release. Internal compatibility version remains **1.1.14**, with unchanged app ID, profile directory, origin and save schema.

## Local files

Under `C:\Users\Chris\HD2CSM-Development\HD2CSM-Source\dist\combined-preview`:

- `HD2-Chaos-Slot-Machine-Setup-local-combined-preview-win-x64.exe` — unsigned, self-contained installer. SHA-256 `725b76be72084dc45f9d5ed5d57ef1b61dd87a129aa49996441724b1351f3ad5`.
- `HD2-Chaos-Slot-Machine-local-combined-preview-win-x64.zip` — portable runtime. SHA-256 `b854ef7bafbbc85b6919822091a163795409ac2e40904b8497bf22fd9f072734`.
- `win-unpacked\HD2 Chaos Slot Machine.exe` — the actual packaged application tested here. Keep its supporting files together.

`scripts/start-combined-preview.cmd` opens that complete runtime with a separate `.test-data/combined-preview-owner-review` profile. Use this for review without installing or touching personal saves. The installer has **not** been executed or promoted to the Desktop download folder.

## Executed verification

- **353 unit tests**, CSP/catalog/assets and offline license-material validation pass. Catalog validation reports 247 local UI picture references, zero missing and seven pre-existing placeholder references.
- **389 packaged source-file comparisons**, ZIP CRC/content/checksum checks and exact ZIP/runtime ASAR equality pass. **25 embedded installer payload comparisons** include the app EXE, ASAR, notices, icons and all **14 legal/source files**. Both outer NSIS and inner archive integrity pass. Four separately supplied installer plugin DLLs match the reviewed upstream archive hashes. This is byte inspection, not installer execution or legal clearance.
- Actual executable fuse bits verified: unused Node entry/debug features disabled; ASAR-only/integrity enabled. The documented file-origin privilege exception remains for legacy storage recovery. Full-word Windows ProductName/FileDescription/InternalName verified; file version is correctly 1.1.14, not a downgrade to 1.0.
- **23 packaged phases**, sequential isolated profiles, software rendering and graceful exits. Core workflow **54**, restart **8**, normal/fullscreen startup **7**, controlled network **14**; legacy-origin migration **10 phases**; renderer security **44**; transfer **26+4**; gear **97+11**; dedup **131+28**; actual v1.1.3 save seed/upgrade **18+30**. Counts include repeated assertions, not independent user workflows.
- Core coverage includes offline first launch and artwork decoding, Spin, locks/rerolls, WebAudio initialization, Results/scoring, Compare, Armory, Rank and persistence. Transfers use tested bridge/backend paths, not native file-picker clicks. Old-EXE tests cover native-save precedence, file-origin fallback promotion and staged interrupted-copy recovery followed by restart. Original v1.1.3 save bytes remain in an automatic backup.
- Packaged fullscreen screenshot visually inspected: new full-word header/mark, preview label, controls and existing layout. This does not certify every Windows DPI, tiny taskbar icon, display or tab screenshot.
- Defender custom scan of this candidate: **found no threats**; npm audit: **zero reported vulnerabilities**. EXE and installer are **NotSigned**. Neither scan/audit is a security guarantee.
- Bounded System log observation from 18:00 through 18:06 EDT found no matching graphics/bugcheck warning/error entries. No test process or shared lock remained. No conclusion about the prior BSOD's root cause or long-term stability follows.

Evidence: `.test-data/combined-preview-acceptance.json`, `combined-preview-artifact-inspection/report.json`, `combined-preview-unit-final.log`, `combined-preview-defender.log`, `combined-preview-dependency-audit.json`, `combined-preview-system-context.json`. Packaged suites: `packaged-smoke-1789596059152`, `packaged-smoke-1789596142430`, `packaged-security-1789596164939`, `packaged-transfer-1789596166578`, `packaged-gear-1789596172654`, `packaged-dedup-1789596181227` (all under `.test-data`).

Initial packaging command failed because PowerShell split the unquoted configuration argument. Quoting it fixed the invocation; the original failure log is retained. No failed build/test is counted as passing.

## Native installer gate remains open

This PC reports Windows 10 Home; no available Windows Sandbox, VirtualBox or VMware commands were found. No safe preconfigured isolated environment was established. A same-user `/D=<fixture>` install would still share the app ID, uninstall registry and shell shortcuts, so it was deliberately **not used as fake isolation**. No Windows account, VM, security feature, registry or personal installation was changed.

Static inspection of the locked NSIS templates shows old-shortcut registry lookup and old-uninstaller execution, but that is **not proof renamed upgrades work**. A true isolated Windows test must still:

1. Install an old package, seed synthetic data and record shortcuts/uninstall registration.
2. Close it normally; install this exact candidate using the same app ID.
3. Verify one installation, new-name shortcuts/targets, old executable/shortcut cleanup, normal default-profile continuity and restart persistence.
4. Exercise uninstall, confirming save retention, then reinstall/recovery.

This requires an agreed isolated Windows environment or separately approved backed-up real installation test. It is not permission to modify the owner's working installation. Audible listening, native file-picker interaction, physical DPI and long-duration acceptance also remain unverified in this pass.

## Cleanup and next task

Archived/hash-verified **89** superseded Protected Startup files at `.test-data/desktop-cleanup-2026-09-16/superseded-protected-startup-candidate/protected-startup-review`. Adjacent manifest records exact restore paths and hashes. Historical launcher targets the archive; inventory verification resolves the archive while preserving the original report's logical path and bytes. Its exact check still passes. Nothing permanently deleted. `dist` now contains only accepted `preview-v1.1.10` and `combined-preview`; no Desktop duplicates, installed-app replacement or personal-save changes.

Next bounded task: resolve the remaining WinShell license terms or a reviewed/tested replacement. Native install/upgrade remains gated as above; artwork inquiry remains unsent pending scoped recipient/content approval. Rights, hosted CI/repository controls, signing and final acceptance still block release. Milestones 3–7 remain queued; this packaging checkpoint did not implement live-war scheduling, unrestricted planet rolls, visual Armory, mission compatibility or galaxy map. No commit, push, tag, release or external outreach occurred.
