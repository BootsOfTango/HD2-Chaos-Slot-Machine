# Installer shell helpers and approved native upgrade — September 16, 2026

Branch `codex/installer-shell-review`; earlier uncommitted work retained. Two separate results are recorded here: a **replacement helper prototype** and an **owner-approved upgrade using the unchanged Combined Preview installer**. The prototype is not in that installer.

## WinShell review and replacement foundation

The [WinShell author page](https://nsis.sourceforge.io/WinShell_plug-in) identifies version 20121005, labels it Freeware and describes the three operations used by electron-builder. The downloaded author's ZIP previously matched the shipped DLL, but still has no complete distribution terms/source. The [NSIS license](https://nsis.sourceforge.io/License) has an exception for separately stated terms; the label alone is not treated as a newly established license grant here. No rights-holder message was sent and the licensing gate remains blocked.

The author documents a standard System-plugin alternative for shell cleanup and describes property-setting in the [NSIS forum](https://nsis-dev.github.io/forum-archive/thread/4768183/creating-a-shortcut-with-an-appusermodelid-using-the-system-plug-in/). The implementation here is original project source in `installer/shell-properties.nsh`, using the already licensed NSIS core System plugin/COM headers and Windows APIs, not a downloaded replacement DLL. ABI constants were checked against [NSIS COM declarations](https://github.com/kichik/nsis/blob/master/Include/Win/COM.nsh). Microsoft documents [AppUserModel.ID](https://learn.microsoft.com/en-us/windows/win32/properties/props-system-appusermodel-id), [property commit behavior](https://learn.microsoft.com/en-us/windows/win32/api/propsys/nf-propsys-ipropertystore-setvalue), [pinned-list cleanup](https://learn.microsoft.com/en-us/windows/win32/api/shobjidl/nn-shobjidl-istartmenupinnedlist), and [destination-list deletion](https://learn.microsoft.com/en-us/windows/win32/api/shobjidl_core/nf-shobjidl_core-icustomdestinationlist-deletelist).

The prototype:

- Sets the explicit app ID on an existing shortcut using load/property-set/commit/save, preserving other link fields.
- Rejects empty/overlong IDs, wrong extensions and missing/damaged/read-only links; reports HRESULTs rather than silently claiming success. Handles successful S_FALSE separately from truncation warnings.
- Preserves borrowed registers and stack, releases COM/native allocations, and balances successful COM initialization.
- Exposes explicit-link unpin and explicit-app-ID destination cleanup. It does not delete files, write installer registry entries, launch a shortcut or fall back from an empty app ID to another app.

**38 native fixture assertions pass**, including a compiled fixture installer and fixture uninstaller context, persisted property readback through Windows Shell, repeated/change-ID/register-input cases, Unicode paths, non-mutating error cases and preservation of target/arguments/working directory/description/icon. Both fixture binaries contain System.dll and no WinShell.dll. Evidence: `.test-data/installer-shell-1789597718763/report.json`; reproducible harness `scripts/test-installer-shell.ps1`, supplied the existing reviewed NSIS root. It creates only private `.test-data` fixtures and a unique fixture app ID, with no product installation or shell-folder changes.

Limit: unpin returned S_FALSE (1) for an unpinned fixture; empty test-app destination cleanup returned zero. Actual pinned-item or populated jump-list removal is **not established** by these return codes. No Windows 11 test was run. Three earlier failed attempts are retained: WScript's Unicode filename handling in fixture setup/readback, the compiler's initial ACP decoding, and positive-success HRESULT handling. The final harness uses UTF-8 compilation, direct Unicode Shell property reads and a verified ASCII-named byte copy only for the legacy WScript field reader. No Windows protection was disabled or bypassed; a bounded Defender event query showed no matching Controlled Folder Access event during that setup failure.

**358 unit tests** plus CSP/catalog/assets pass (`.test-data/installer-shell-unit.log`). Five new structural tests protect the fixture scope and prevent accidental production activation. No runtime source or production build configuration changed, so no new duplicate application package was made.

## Approved real installation upgrade

The owner explicitly chose **Back up and upgrade my actual installation**, while excluding an uninstall acceptance test against the personal app. The current registration pointed to `C:\Users\Chris\Desktop\Helldivers 2 Chaos Slot Machine` (internal 1.1.14), with no app process running.

1. Copied and SHA-256 verified **265 files**: old installation, personal/legacy profiles, available installer-cache material and the existing project shortcut. Exported the two exact application registration keys and recorded missing/existing shortcut states. Private recovery directory: `.test-data/approved-install-upgrade-1789597962960`. Never upload it.
2. Rechecked source and backup hashes immediately before dispatch. Installed the already-tested unsigned Combined Preview (`725b76be72084dc45f9d5ed5d57ef1b61dd87a129aa49996441724b1351f3ad5`) using `/S /currentuser` and an explicit normal per-user destination. Native installer exited **0**.
3. Verified **95 installed runtime files** match the tested candidate and that only the expected product uninstaller is additional. Registration still uses GUID `47bdb29f-8aa0-5f3c-a469-272721cfb1dc`; display name is HD2 Chaos Slot Machine 1.0 and internal version remains 1.1.14.
4. Old Desktop installation folder/old shortcuts were removed by the installer. Exactly the expected new Desktop and Start-menu shortcuts target the new EXE, have no extra launch arguments and carry the unchanged app ID. No manual recursive deletion was used.
5. Immediately after installation, **183 personal/legacy profile files remained byte-identical**. The actual installed EXE then passed isolated workflow **54**, restart **8**, normal/fullscreen **7** and controlled-network **14** checks: `.test-data/packaged-smoke-1789598117594`.
6. Two additional ordinary launches used the **actual default personal profile**, with network temporarily blocked only for those processes. No synthetic Spin/import/clear/save action was invoked. **16 checks** established full-word identity, built-in software rendering, fullscreen startup, original default save path, preserved Results/ownership and graceful exits. After both launches, the complete saved `data` object still equals the backup; only envelope `savedAt`/`exportedAt` timestamps changed during normal startup. Caches/diagnostic/migration bookkeeping can change normally. Evidence: `personal-profile-acceptance.json` in the private recovery directory.

Installed program: `C:\Users\Chris\AppData\Local\Programs\HD2 Chaos Slot Machine\HD2 Chaos Slot Machine.exe`.

Desktop shortcut: `C:\Users\Chris\Desktop\HD2 Chaos Slot Machine.lnk`.

The application was closed normally after tests. Existing source installer/ZIP hashes are unchanged. `dist` still contains only `preview-v1.1.10` and `combined-preview`; no new Desktop installer copies. Old installation and saves are recoverable from the private manifest-backed backup. Native wizard clicks, product uninstall/reinstall, all-users installation, fresh-machine installation, physical pin behavior, native file pickers, audible listening and long-duration stability remain unverified. The product's old uninstaller ran as part of normal upgrade, not as a standalone uninstall acceptance test.

## Historical next step (completed by the integration follow-up)

Integrate the tested helper through a narrowly scoped, version/hash-guarded adapter for the locked builder's ten WinShell call sites, then build and inspect both full installer and embedded uninstaller for WinShell absence. Preserve the stock signed-uninstaller creation path: inspection of locked `NsisTarget.computeScriptAndSignUninstaller` shows that setting `nsis.script` takes a different branch that skips its normal uninstaller generation/signing, so do not simply switch to a copied custom script. Include the replacement source/attribution in distribution materials and add failure-path handling, compile/payload tests and native upgrade acceptance for that new candidate before promoting it.

The statements above describe the prototype checkpoint. The subsequent [integration review](INSTALLER_SHELL_INTEGRATION.md) supersedes its next-step/installed-package status: replacement is now built and WinShell absence is checked in both installer binaries. Historical evidence remains unchanged. Artwork rights, broader release review, final signing/CI and queued roadmap milestones remain separate blockers.
