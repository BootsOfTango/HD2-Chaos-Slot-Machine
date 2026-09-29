# Disposable Windows installer lifecycle

September 29, 2026: owner explicitly approved GitHub-hosted Windows testing, updating the existing development PR and a temporary publicly downloadable unsigned test-build artifact. This does **not** authorize an official release, main merge, tag, signing purchase, rights-holder contact or any uninstall on the owner's PC.

## Scope

`.github/workflows/windows-lifecycle.yml` uses two separate standard `windows-2022` jobs. GitHub documents [fresh hosted VMs and free standard runners for public repositories](https://docs.github.com/en/actions/reference/runners/github-hosted-runners). The second job performs no checkout/npm/Node/Python command; its image nevertheless has developer tools preinstalled. This is a **fresh product-state Windows Server lifecycle test**, not a tools-free Windows 10/11 consumer-machine certification.

The read-only build job audits/tests locked source and verifies the ZIP, embedded installer, source parity, notices and fuses. It stages exactly five files: unsigned test Setup, manifest, synthetic fixture, guarded test script and test-only warning. No owner profile, backup or credential enters that bundle. The separate lifecycle job downloads the same run's immutable artifact ID. No signing secrets, write token or publication commands are used.

GitHub says [signed-in people with repository read access can download artifacts](https://docs.github.com/en/actions/how-tos/manage-workflow-runs/download-workflow-artifacts). The approved test bundle expires after three days; the bounded report after fourteen days. These are not release-page downloads. Only the report JSON is uploaded after the lifecycle job, not the generated profile or arbitrary logs/directories.

## Automated checks

1. Refuse normal/self-hosted environments, unexpected bundle paths, modified inputs and existing product paths/registration/profile. These are accident-prevention guards, not an authentication boundary; never spoof them to run uninstall on a personal PC.
2. Silent per-user native installation on the disposable runner; check every runtime file and uninstaller hash, exact file set, shortcuts and user registration, and absence of machine-wide registration.
3. Seed one public synthetic Solo v1 card in the runner's ordinary default profile. Launch/close the real installed EXE normally. Check graceful diagnostics, card identity, stats/note/comment and unchanged score-rule version.
4. Run the actual ordinary product uninstaller. Its launcher may spawn a temporary copy, so wait for removal of the complete installation directory, shortcuts and registration. No manual deletion or force-kill is permitted to manufacture a pass. Verify save bytes remain identical.
5. Reinstall the same Setup, compare files and save bytes again, launch/close normally, and verify the synthetic card remains unique and unchanged.

No local installer/uninstaller is executed by preparing or source-testing this workflow. Local regression tests cover refusal paths and explicit no-mutation preflight only.

## Evidence status

**Incomplete: fresh install passed; normal app close failed, so uninstall/reinstall were not executed.** A hosted build is separately identified from the locally installed candidate even when application sources match.

- Attempt1: run36628705211, head5f4fe2909d71a089f0cccd2b694119af2a40c75d. Build/inspection passed but bundle preparation incorrectly depended on an absent developer Electron LICENSE. Fixed by enumerating the already-inspected runtime, validating its hashes and required companion notices; no lifecycle launched.
- Attempt2: run36629297465, head9c4fc64b47682467bd0ee5f54e52d49d54343d53. Fresh install succeeded,128 checks passed, but `CloseMainWindow()` returned false. No uninstall/reinstall executed. Report retained locally as `attempt-2-report.json`.
- Attempt3: [run36630110703](https://github.com/BootsOfTango/Helldivers-2-Roulette/actions/runs/36630110703), head **c2f6d5bf5f244e72f2069a4a71e3b9f8b772ef88**. Build job109616890355 passed. Lifecycle job109618236526 ran on Microsoft Windows Server2022 Datacenter, fresh install exited0 and128 checks passed.99 runtime files, exact installation contents, uninstaller hash, native shortcuts and registration matched. After PID-matched `window-created` diagnostics, a nonzero window handle and title `HD2 Chaos Slot Machine` were observed, but refreshed/retried normal-close requests still failed. This does not establish renderer readiness, graceful closure or a specific root cause. Uninstall/reinstall and final card checks remain unexecuted. GitHub job cleanup terminated orphan app processes; the harness neither forced closure nor proceeded into uninstall.
- Attempt3 Setup SHA256: `962f8e577c797361ba0f4012f9fde8ae57de94274c746f1ac2be22892f0d5332`. Temporary bundle artifact11062586794 ZIP SHA256: `3468834fa1e2f6cfe56567e3d53b896a231d7b9e8b75a44fb1d30a2ef7647bf2`, expiresOctober2. Report artifact11061878153 ZIP SHA256: `d05b388bb9cefff06c3f9a6871ca9993b3951c94d044374056c938ed03f18032`, expiresOctober13. Report ZIP digest verified before reading its single `report.json`; retained under `.test-data/hosted-lifecycle-2026-09-29/attempt-3-report.{zip,json}`. These hashes are not those of the owner's installed candidate.
- Current source CI36630110569 passes918 tests total,917 passed,1 expected private-source skip,0 failed; audit0 and CSP/catalog/assets pass. Local918/918 tests and validators pass. These do not override the failed lifecycle result.

Next: inspect hosted window/session readiness and normal-close failure with bounded diagnostics. Do not mask failure by force-killing, skipping a check, erasing files manually, or calling the whole gate passed. No owner-PC changes occurred.

Manual wizard interaction, consumer Windows variants, physical DPI/audio/pins, all-users setup, actually disconnected installation, and fresh portable first-run are not covered here. Keep those limits visible in `CLEAN_WINDOWS_ACCEPTANCE.md`; do not silently clear the broader release gate.
