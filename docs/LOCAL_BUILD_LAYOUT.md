# Local Windows build locations

Current local handoff: **v1.1.10**, September 14, 2026. Unpublished and unsigned. No installer was executed over the personal installation.

## Clean player-download folder

Use **`C:\Users\Chris\Desktop\HD2CSM`**. It contains only:

- `Helldivers-2-Chaos-Slot-Machine-Setup-v1.1.10-win-x64.exe`
- Its matching `.sha256`
- `README-FIRST.txt`, the install/use/cautions guide also included in the new package.

The installer is a byte-identical copy of the verified source-root artifact. No development tools or loose runtime files are required to install it. It is local preview v1.1.10, not the separately published v1.1.0 GitHub release.

## Source checkout and isolated review

In `C:\Users\Chris\Desktop\HD2CSM-Source`:

- **Helldivers 2 Chaos Slot Machine** — root Windows shortcut to `scripts/start-local-preview.cmd`, with the HD2CSM icon. Runs the complete packaged app without installation.
- **Helldivers-2-Chaos-Slot-Machine-Setup-v1.1.10-win-x64.exe** and checksum — canonical verified offline installer at the top level.
- **dist/preview-v1.1.10/** — complete `win-unpacked` runtime, portable ZIP/checksum and source-parity evidence. Keep all runtime files together; never move only the app EXE.

The shortcut uses separate `dist/review-profile-v1.1.10` saves, not personal AppData or test fixtures. Earlier review profiles, if present, are preserved separately; changing the preview version does not overwrite them. Source/Git/dependencies and the old runtime folder outside the checkout remain untouched.

## Recoverable previous build and support output

The complete accepted **v1.1.9** build, root installer/checksum and prior clean-download files now reside at:

`C:\Users\Chris\Desktop\HD2CSM-Source\.test-data\accepted-builds\v1.1.9`

All 12 exact handoff moves were preflighted inside the named source/player folders, checked for reparse points and profile files, and verified by per-file hashes after moving. Nothing was permanently deleted. Full manifest: `.test-data/warbond-batch7-handoff.json`.

Current builder debug/update/blockmap and temporary ZIP-ASAR verification extraction are kept separately in `.test-data/build-support/v1.1.10`. They are not player downloads. The v1.1.3 full runtime used for actual save-migration tests remains in `.test-data/legacy-runtimes/v1.1.3`.

## Earlier owner-approved cleanup — historical

Before v1.1.9, **42 old/generated entries, 519 files, 4,687,011,975 bytes** were sent to Windows Recycle Bin. These were superseded v1.1.1–v1.1.6 artifacts/runtimes, interrupted output and disposable verification/build metadata. The Recycle Bin was not emptied; use Restore if needed. **Do not run the damaged interrupted v1.1.6 installer formerly directly under dist**, even if restored.

Historical manifest: `.test-data/build-cleanup-2026-09-14/manifest.json`. At that cleanup, all 79 current runtime files and 79 archived v1.1.3 files matched original hashes; 177 unit tests passed. Those earlier reports' original artifact paths are historical, not current.

## Current verification

- Installer SHA-256: `b61c4b785c0f99f5656b16c14f44a000fccc1e40a823fd7def1e66079fbcd983`.
- ZIP SHA-256: `7e007482373a60761c4e4e5014206573775c94ce18cb911193db24204d9f313e`.
- 203 unit tests, catalog/assets, sequential desktop safety/workflow and actual packaged-app regressions passed. Actual v1.1.3 save → v1.1.10 first boot retained backups.
- ZIP CRC/runtime/assets, installer payload and 366 source-file comparisons passed; the revised player guide is embedded.
- Native installer upgrade/uninstall, audible sound, native file pickers, physical DPI/trackpad/multi-monitor and long-duration stability are not verified.

See [batch-7 evidence](M2B_WARBOND_BATCH7_TEST_REPORT.md), [current project status](PROJECT_STATUS.md) and [player guide](../README.md).

To reverify from the source checkout:

```powershell
python scripts/verify_win_zip.py --dist dist/preview-v1.1.10 --installer 'Helldivers-2-Chaos-Slot-Machine-Setup-v1.1.10-win-x64.exe'
```

The verifier creates a temporary `verify-win-zip` extraction for inspection; it is not a player download. Do not recycle more artifacts without inspecting targets, dependencies and saves and obtaining appropriate cleanup authority.
