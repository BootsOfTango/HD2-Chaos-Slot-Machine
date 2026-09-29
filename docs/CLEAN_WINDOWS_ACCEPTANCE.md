# Clean Windows installation/uninstallation acceptance

## Current gate: not run

September 16 read-only preflight: this host reports **Windows 10 Home, x64, HyperVisorPresent=False**. No WindowsSandbox, VBoxManage, vmrun or Get-VM command was available; queried installed-program registration showed no VirtualBox, VMware or QEMU entries. This is bounded discovery, not proof that no portable hypervisor exists anywhere on disk. No OS feature, VM software, account, BIOS setting, driver or security protection was changed.

Microsoft states that [Windows Sandbox is not supported on Home editions](https://learn.microsoft.com/en-us/windows/security/threat-protection/windows-sandbox/windows-sandbox-overview). Its [supported setup instructions](https://learn.microsoft.com/en-us/windows/security/application-security/application-isolation/windows-sandbox/windows-sandbox-install) require virtualization and a supported Windows configuration. Do not use Home-edition bypass scripts. Given the prior BSOD investigation, installing a hypervisor/driver is a separate owner-approved setup decision, not an ordinary app-test step.

Changing only `/D=` or `HD2CSM_USER_DATA_DIR` does **not** isolate the product installer: app GUID, registry, shortcuts, updater cache and shell IDs still collide. Do not uninstall the personal installation or call a same-user alternate-directory run a clean-machine test. An additional local user is also not full-machine isolation from an elevated/all-users installer.

## Safe environment choices

Use an owner-designated spare Windows machine or existing disposable VM with a checkpoint, or plan a supported test VM separately with owner approval. A future hosted Windows runner would require approval to upload/push the necessary source/artifact and a reviewed workflow; nothing is uploaded or triggered by this document. Do not introduce a paid service or Windows license assumption.

While this environment decision is pending, source feature work can continue locally. Keep clean-install/uninstall acceptance explicitly pending in release readiness. Do not repeat already-passed personal-install upgrades as a substitute.

## Acceptance procedure for the selected clean guest

1. Record Windows edition/build, architecture, scaling, machine isolation method and snapshot identifier. Confirm the session is inside the approved disposable guest, not the host. Start without Node, npm, Git or Python installed; do not infer this merely from an empty PATH.
2. Confirm **no** product installation/legacy profile/shortcuts/registration exist in guest HKCU or HKLM (including WOW6432Node). Stop on existing user data; do not erase it to manufacture a clean machine. Disable networking only inside the disposable guest for the offline phase.
3. Transfer only the verified Setup, ZIP, checksums and public player guide. No `.test-data`, personal backups, credentials, signing secrets or source profiles. Record exact artifact hashes and signature status. Unsigned local test builds remain labeled as such; never disable host or guest security protections to make them run.
4. Exercise the visible per-user wizard and default installation path. Confirm the installed full-word name, Start-menu/Desktop shortcuts, app ID, registry/uninstall target and complete embedded runtime. Check that shortcut warnings are absent or explicitly recorded. Do not accept installer exit 0 as proof of correct files.
5. Launch the installed app with its ordinary default guest profile while offline. Verify fullscreen, F11/Escape, smaller-window scrolling/dialog reachability, Spin, ownership/locks/rerolls, Results/scoring, Compare, Armory, Rank, import/export and restart persistence. Use clearly synthetic data. Listen to sound and exercise native file dialogs manually; programmatic initialization alone does not count.
6. Compare file hashes with the candidate, and verify original helper, builder MIT, upstream notices/source archives and runtime notices are installed. Observe app shutdown before the next phase. Never force-kill an installer or app to make the next test proceed.
7. Take a guest snapshot and hash the synthetic default save. Run the **product's actual uninstaller** in the disposable guest. Verify removal of installed app files, both shortcuts and the product's uninstall/install registration, while preserving the synthetic save according to the current `deleteAppDataOnUninstall=false` policy. Check no other application or directory changed. Report observable pin/jump-list behavior separately from API return codes.
8. Reinstall the exact same Setup and verify saved Results, ownership and preferences return without duplicates or reset. Then test upgrade from a separately hash-verified historical version, retaining that version's synthetic profile before/after. Test fresh/upgrade branches independently rather than reusing a contaminated guest state.
9. Use a separate reverted checkpoint for portable ZIP extraction/first launch and for any elevated/all-users installation test. Keep all-users behavior explicitly unverified until actually tested; per-user success is not equivalent.
10. Restore guest networking and test live refresh, stale-cache labels, failure fallback and manual refresh as implemented by the candidate. Record limitations rather than claiming later roadmap functionality exists.

## Evidence and completion

Record exact hashes, initial state, install/uninstall exit codes, before/after file/registry/shortcut/save comparisons, launched EXE path, restart results, screenshots where useful and every unverified/manual check. Preserve failures separately. A fixture uninstaller, extracted archive inspection, packaged EXE smoke test or host upgrade does not satisfy this gate. The owner approves final public release only after this and the other roadmap/rights/security gates are completed.
