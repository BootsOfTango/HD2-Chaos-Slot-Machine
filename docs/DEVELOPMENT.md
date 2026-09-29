# Development and maintenance

For contributors only. Players need the Setup EXE, not these commands; see the [player README](../README.md). This document preserves the former README's technical setup and local-preview notes.

## Desktop development

**Current September 16 installer integration supersedes historical preview locations below:** see [Installer Shell Integration](INSTALLER_SHELL_INTEGRATION.md) and [Project Status](PROJECT_STATUS.md). Current candidate is `dist/installer-shell`; the installed app is under LocalAppData Programs. The old v1.1.10 preview is recoverably archived. After `npm ci`, `npm run build:win` automatically prepares the hash/version-guarded template adapter. Direct builder invocation requires `npm run prepare:installer-shell` first. Do not set `nsis.script` or add `build/installer.nsi`: that bypasses the stock signed-uninstaller path. Builder upgrades require reviewing/updating both template hashes and rerunning native fixtures, binary inspections and installed acceptance.

Runtime-security source work now pins Electron 44.4.1 and uses a hash-authorized inline app script. After reviewed edits inside that script, run `python scripts/renderer_csp.py --write`; tests/builds reject stale hashes. Catalog regeneration updates the hash automatically. Do not restore broad inline-script permission to bypass a failure. `npm run test:renderer-security` runs exclusive isolated desktop/browser-emulation CSP probes after the desktop safety gate. See [runtime review](RUNTIME_RENDERER_SECURITY.md) and current project status; candidate paths in older paragraphs below are historical.

Current source is **Local Development — Hyena and Revenants**, staged in `dist/hyena-revenants-review/`. Internal version stays frozen at 1.1.14; no new numbered release. Fullscreen behavior is owner-accepted. `scripts/start-catalog-review.cmd` launches the new catalog candidate with isolated review data; the accepted preview launcher remains unchanged. Window Behavior is recoverably archived, with its old launcher retargeted. See [catalog evidence](M2_HYENA_REVENANTS_REVIEW.md), [local build policy](LOCAL_BUILD_POLICY.md) and [current status](PROJECT_STATUS.md). `npm run test:transfer` exercises source desktop/browser paths and restarts; packaged transfer checks use `node scripts/run-packaged-smoke.js <verified-exe-path> --transfer`.

September 16 observation supersedes earlier installation-location statements below: the LocalAppData installation is absent; the current Desktop app shortcut points to a Desktop runtime whose v1.1.10 ASAR matches the accepted build. Personal files differ from the historical backup. Neither location nor saves was repaired/restored; review tests remain isolated. Consult current status before any future installation/cleanup.

Previous numbered candidates are recoverably archived under `.test-data/desktop-cleanup-2026-09-15`, with exact paths in cleanup manifests; do not recreate their old active paths. The accepted player download, installed app and isolated preview shortcut remain v1.1.10. See [save/startup safeguards](MID_PROJECT_HEALTH_REVIEW.md) and [import hardening](IMPORT_EXPORT_HARDENING.md); do not replace the accepted handoff or publish automatically. `npm run test:save-health` runs isolated save-failure/close checks after the desktop safety gate.

Accepted local player preview: **v1.1.10**, unpublished and unsigned. This increment audits Entrenched Division, Exo Experts and ODST: 15 primary-source Warbond acquisitions plus one community-source Superstore correction, two weapon subgroups, nine aliases and three original promotional images. Catalog: 108 primary + 18 community + 79 pending = 205; 126 reviewed acquisitions, 22 reviewed Warbond groups. IDs/defaults/ownership/item art remain unchanged. See [project status](PROJECT_STATUS.md), [preview notes](../RELEASE_NOTES_v1.1.10.md) and [batch-7 evidence](M2B_WARBOND_BATCH7_TEST_REPORT.md). Publication requires owner approval.

The accepted **Setup EXE is in `Desktop\HD2CSM`**, with its checksum and player guide, not duplicated in the source root. The source lives at `C:\Users\Chris\HD2CSM-Development\HD2CSM-Source`; its local preview shortcut targets `scripts/start-local-preview.cmd` and the accepted isolated runtime in `dist/preview-v1.1.10/`. The Desktop app shortcut instead launches the installed app under LocalAppData. Keep only accepted and latest candidate builds active, following [cleanup policy](DESKTOP_CLEANUP_POLICY.md). The preserved actual old EXE fixture remains `.test-data/legacy-runtimes/v1.1.3/`. [Graphics safeguards](DESKTOP_GRAPHICS_SAFETY.md) remain enabled. Personal AppData is not used by test/review launchers. Do not install or extract over the source checkout or old runtime.

Desktop launches now default to software rendering before Electron readiness; the browser version is unchanged. This reduces hardware-acceleration exposure but may use more CPU and is not a guarantee against Windows/driver failures. Fullscreen close returns to windowed mode before normal teardown. Test runners share an exclusive lock, wait for graceful exit, and never force-kill a stalled desktop process. Bounded lifecycle diagnostics are saved as `desktop-diagnostics.json` in the selected profile without card/player data.

This repository now includes an Electron shell for the existing `index.html` application. The desktop app keeps the current Spin, Results, Compare, Armory, and Rank interfaces intact while adding a secure desktop window, an isolated preload bridge, external browser handling for the YouTube channel link, and Windows packaging metadata.

### Commands

- `npm ci` installs the exact Electron and Windows packaging toolchain versions recorded in `package-lock.json`.
- `npm run dev` launches the Electron desktop application for local development.
- `npm start` launches the Electron desktop application normally.
- `npm run prepare:icons` regenerates the local desktop icon files from the HD2CSM slot-machine artwork.
- `npm test` runs the automated logic, storage, catalog, and asset checks. `npm run test:electron` runs the Electron workflow and restart checks with isolated test data.
- `npm run test:desktop-safety` runs the small software-rendering, restart, and fullscreen-close gate first. Run GUI suites sequentially; a timeout retains evidence and may hold the shared lock for review. See the safety document before resuming a blocked suite.
- `npm run build:win` regenerates those icon files, then creates two self-contained Windows x64 artifacts with the product name `Helldivers 2 Chaos Slot Machine` and stable app ID `com.bootsoftango.helldivers2chaosslotmachine`: the recommended offline installer `Helldivers-2-Chaos-Slot-Machine-Setup-v<VERSION>-win-x64.exe` and the portable `Helldivers-2-Chaos-Slot-Machine-v<VERSION>-win-x64.zip`, using `package.json`'s version. The installer embeds the full application and Electron runtime; it does not download components during installation and users do not need Node.js, npm, or Python. The ZIP includes `README-FIRST.txt` and must be extracted as a complete folder before its app executable is run.
- `npm run release:win` builds both Windows artifacts, inspects the packaged runtime/assets and embedded installer payload, and creates one `.sha256` checksum file beside each artifact.


## Windows releases

The `hd2csm-v1.1.0` release contains the locally tested, unsigned Windows artifacts. Its distinct tag does not trigger the signed `v*.*.*` workflow described below. This one-time unsigned release does not disable signing requirements for future workflow releases.

Maintainers publish the offline installer and portable ZIP with the **Windows Release** GitHub Actions workflow. Push a version tag that matches `package.json`, such as `v1.1.0`, to run validation, tests, packaging, artifact inspection, checksum generation, signature verification, and GitHub Release upload on GitHub's Windows runner. Tagged releases require configured Azure signing credentials and verify both the installed application executable inside the ZIP and the NSIS installer before upload. Use **Actions → Windows Release → Run workflow** for an unsigned manual test build on a branch before tagging. See the [release checklist](RELEASE.md) for owner steps.

## Save implementation and compatibility

Normal desktop saves are in `%APPDATA%\Helldivers 2 Chaos Slot Machine\state.json`; the local review launcher overrides the profile explicitly. The Windows app ID is `com.bootsoftango.helldivers2chaosslotmachine`.

A valid save in the legacy Helldivers 2 Chaos Roulette folder is copied only when a new save does not already exist. Old files remain unchanged. Browser keys migrate non-destructively; browser data should be exported and imported into the desktop app through Results. Existing new-format saves take priority.

The backend keeps up to 20 dated automatic backups, preserves damaged state/backups under `recovery/`, and attempts backup recovery before creating a blank save. Import validates JSON shape, rejects files over 5 MiB and unsupported future save formats, backs up existing state, and writes the imported data. Export includes cards, gear choices, supported settings, save-format/app versions and date. Clear All requires the exact confirmation phrase and a successful final backup before clearing.

Core loadout/card functionality is local. The optional campaigns refresh has a timeout and dated cache/bundled fallback; there is no periodic scheduler or exact live-operation API in the current implementation. Links to outside services are optional.

## Documentation handoff

`README.md` is the player-facing repository guide. `README-FIRST.txt` is the standalone quick-start file already copied by electron-builder into both distributions. Before the next approved release, rebuild and inspect the package to ensure its guide matches the shipped version; editing source documentation does not change an existing installer or ZIP. Never replace an already published release asset silently.
