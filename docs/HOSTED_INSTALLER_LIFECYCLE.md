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

## Current result — PASS, September29

[Run36637328640](https://github.com/BootsOfTango/Helldivers-2-Roulette/actions/runs/36637328640), head **dce5c9dca22d50de79e319f9d14ec0eac27f9184**, build job109641057476 and lifecycle job109642352896 both succeeded. **273 checks passed** on Microsoft Windows Server2022 Datacenter. Fresh install and actual uninstall launcher/reinstall exit0; verified complete app directory/shortcuts/user registration removal, exact save bytes preserved by uninstall and reinstall, successful normal default-profile launches and graceful exits before/after, unique synthetic card with original stats/note/comment and unchanged v1 rating67.5. No force-kill or manual cleanup needed.

The report confirms the first-run backup reminder was the blocking modal: accessibility text matched the exact source string; its observed native OK button was revalidated and acknowledged; normal parent-close then succeeded. This is a test-driver correction, not a gameplay/save change. Earlier failed attempts remain evidence, not passes.

- Setup SHA256: `174e1f37aefc7b13c8df65f8867b2a93ae7ed868748c93ed7e975a72c7b03fb9`.
- Test bundle artifact11064892729 ZIP SHA256 `847779941aeaca55f1413aafe3bf8638a50dac37f92240817729b151f9ae254c`, expiresOctober2.
- Report artifact11065487236 ZIP SHA256 `52bb232f15280a2a5634af8d83534575ece325a44348adad04ca38216b43652c`, expiresOctober13. Download digest verified, single expected report.json extracted to `.test-data/hosted-lifecycle-2026-09-29/attempt-7-report.{zip,json}` for persistent local evidence.
- Source CI36637328715 passes922 total/921 passed/1 expected private-source skip/0 failures, audit0 and CSP/catalog/assets pass. Linux36637328713 passes.

The tested build is separately identified from the owner's unchanged installed candidate. Manual wizard, all-users, offline-network installation, tools-free consumer Windows, portable first-run and physical audio/DPI remain outside this automated result. No official publication.

## Historical attempts — superseded by the pass above

Attempt6 confirmed the dialog's accessibility text exactly matches the first-run save reminder. The hosted accessibility tree omits its native OK button, so the strict selector refused action and stopped. Run36636642479/head3e018a1b638f0a716a31dee3e327d9ba59c16adb:129 checks, no uninstall; report artifact11065081680 digest `fe3b9804220f725da303ba3f025e113078a721f54d908de61dfc85e49de2e644`, Setup hash `0cd6c6eace06338f92a787262c861bd322402e83d5bd2e8fb9f3a8dc52e70386`. Verified local `attempt-6-report.{zip,json}` retained. Head dce5c9dca22d50de79e319f9d14ec0eac27f9184 pairs that exact accessibility text with the observed native sole enabled OK child, revalidates PID/handle/text, and sends normal BM_CLICK to that button (not a guessed task-dialog command ID). No global input, force-close, arbitrary acknowledgement or product change. Rerun pending.

September29 continuation: attempts4/5 reached the app-owned first-run native dialog but refused acknowledgement because the legacy control inspection could not verify its message. Attempt5's bounded diagnostic shows a modern `DirectUIHWND` dialog and an OK button with native control ID0; its text content is not represented by native Static controls. Source commit3e018a1b638f0a716a31dee3e327d9ba59c16adb uses the dialog's accessibility Text/Button elements and InvokePattern instead, retaining exact reminder-text, PID, single enabled OK action and immediate re-observation checks. No arbitrary dismissal or application change. Result of that rerun is pending; do not claim the hypothesis confirmed before seeing its report.

- Attempt4 run36635219069/head05e677cd266244bf216dc9c022a419c956e9294e:129 passed checks, no uninstall. Report ZIP artifact11064133825 digest `cbe258bd0b3fa9555f52a4aece5aacfca9c8e0fbb39a05cf27be5b315c020802`; Setup hash `fcdac928e3d703e6ea634a448a2ac2f8376d68cce55db4ad6c75183c925449e0`.
- Attempt5 run36635891961/headcb00536fc0dba14494ea6ea76f29cb832e09c91f:129 passed checks, no uninstall. Report ZIP artifact11065440047 digest `25b43bbe9dc990f5ecdeab5e8ff5633d4b956c8ba87ba64926796c28dd30472d`; Setup hash `6340e4625906bcd98f5c2567072c971add9443639246c5c0e7b6c17f1b00e77e`. Source CI36635891845 passes922 total/921 passed/1 expected skip/0 failures; audit0 and validators pass. Both report ZIPs verified/extracted only expected report.json to local ignored evidence (`attempt-4-report`, `attempt-5-report`).

**Incomplete: fresh install passed; normal app close failed, so uninstall/reinstall were not executed.** A hosted build is separately identified from the locally installed candidate even when application sources match.

- Attempt1: run36628705211, head5f4fe2909d71a089f0cccd2b694119af2a40c75d. Build/inspection passed but bundle preparation incorrectly depended on an absent developer Electron LICENSE. Fixed by enumerating the already-inspected runtime, validating its hashes and required companion notices; no lifecycle launched.
- Attempt2: run36629297465, head9c4fc64b47682467bd0ee5f54e52d49d54343d53. Fresh install succeeded,128 checks passed, but `CloseMainWindow()` returned false. No uninstall/reinstall executed. Report retained locally as `attempt-2-report.json`.
- Attempt3: [run36630110703](https://github.com/BootsOfTango/Helldivers-2-Roulette/actions/runs/36630110703), head **c2f6d5bf5f244e72f2069a4a71e3b9f8b772ef88**. Build job109616890355 passed. Lifecycle job109618236526 ran on Microsoft Windows Server2022 Datacenter, fresh install exited0 and128 checks passed.99 runtime files, exact installation contents, uninstaller hash, native shortcuts and registration matched. After PID-matched `window-created` diagnostics, a nonzero window handle and title `HD2 Chaos Slot Machine` were observed, but refreshed/retried normal-close requests still failed. This does not establish renderer readiness, graceful closure or a specific root cause. Uninstall/reinstall and final card checks remain unexecuted. GitHub job cleanup terminated orphan app processes; the harness neither forced closure nor proceeded into uninstall.
- Attempt3 Setup SHA256: `962f8e577c797361ba0f4012f9fde8ae57de94274c746f1ac2be22892f0d5332`. Temporary bundle artifact11062586794 ZIP SHA256: `3468834fa1e2f6cfe56567e3d53b896a231d7b9e8b75a44fb1d30a2ef7647bf2`, expiresOctober2. Report artifact11061878153 ZIP SHA256: `d05b388bb9cefff06c3f9a6871ca9993b3951c94d044374056c938ed03f18032`, expiresOctober13. Report ZIP digest verified before reading its single `report.json`; retained under `.test-data/hosted-lifecycle-2026-09-29/attempt-3-report.{zip,json}`. These hashes are not those of the owner's installed candidate.
- Current source CI36630110569 passes918 tests total,917 passed,1 expected private-source skip,0 failed; audit0 and CSP/catalog/assets pass. Local918/918 tests and validators pass. These do not override the failed lifecycle result.

Next: inspect hosted window/session readiness and normal-close failure with bounded diagnostics. Do not mask failure by force-killing, skipping a check, erasing files manually, or calling the whole gate passed. No owner-PC changes occurred.

Manual wizard interaction, consumer Windows variants, physical DPI/audio/pins, all-users setup, actually disconnected installation, and fresh portable first-run are not covered here. Keep those limits visible in `CLEAN_WINDOWS_ACCEPTANCE.md`; do not silently clear the broader release gate.
