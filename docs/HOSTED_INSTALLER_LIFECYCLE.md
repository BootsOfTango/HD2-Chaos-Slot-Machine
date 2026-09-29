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

Prepared locally; hosted execution is pending until an actual run result is recorded. Do not convert preparation, a green source job or installer exit 0 alone into a lifecycle pass. Each result must identify the exact source commit, hosted OS, artifact hashes, phases/checks and limitations. A hosted build is separately identified from the locally installed candidate even when application sources match.

Manual wizard interaction, consumer Windows variants, physical DPI/audio/pins, all-users setup, actually disconnected installation, and fresh portable first-run are not covered here. Keep those limits visible in `CLEAN_WINDOWS_ACCEPTANCE.md`; do not silently clear the broader release gate.
