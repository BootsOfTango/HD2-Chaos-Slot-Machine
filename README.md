# Helldivers 2 Chaos Slot Machine

A Helldivers 2 loadout slot machine and performance tracking app for Windows and the browser. Its visual title and icon use **HD2CSM** in yellow with a black outline.

## Download for Windows

[Download HD2CSM v1.1.0](https://github.com/BootsOfTango/Helldivers-2-Roulette/releases/tag/hd2csm-v1.1.0)

- **Recommended:** `Helldivers-2-Chaos-Slot-Machine-Setup-v1.1.0-win-x64.exe` — installs the app and shortcuts; no development tools or internet connection needed for installation.
- **Portable:** `Helldivers-2-Chaos-Slot-Machine-v1.1.0-win-x64.zip` — extract the entire ZIP and run `Helldivers 2 Chaos Slot Machine.exe`.
- This first HD2CSM Windows release is **unsigned**. Windows may show an unknown-publisher/SmartScreen warning. Verify the download against its accompanying SHA-256 file. Future signed releases require publisher credentials.

See [the v1.1.0 patch notes](RELEASE_NOTES_v1.1.0.md) for the rename, save migration, offline improvements, and corrected weapon/booster artwork. The repository URL stays unchanged so existing links keep working.

## Desktop development

This repository now includes an Electron shell for the existing `index.html` application. The desktop app keeps the current Spin, Results, Compare, Armory, and Rank interfaces intact while adding a secure desktop window, an isolated preload bridge, external browser handling for the YouTube channel link, and Windows packaging metadata.

### Commands

- `npm ci` installs the exact Electron and Windows packaging toolchain versions recorded in `package-lock.json`.
- `npm run dev` launches the Electron desktop application for local development.
- `npm start` launches the Electron desktop application normally.
- `npm run prepare:icons` regenerates the local desktop icon files from the HD2CSM slot-machine artwork.
- `npm test` runs the automated logic, storage, catalog, and asset checks. `npm run test:electron` runs the Electron workflow and restart checks with isolated test data.
- `npm run build:win` regenerates those icon files, then creates two self-contained Windows x64 artifacts with the product name `Helldivers 2 Chaos Slot Machine` and stable app ID `com.bootsoftango.helldivers2chaosslotmachine`: the recommended offline installer `Helldivers-2-Chaos-Slot-Machine-Setup-v1.1.0-win-x64.exe` and the portable `Helldivers-2-Chaos-Slot-Machine-v1.1.0-win-x64.zip`. The installer embeds the full application and Electron runtime; it does not download components during installation and users do not need Node.js, npm, or Python. The ZIP includes `README-FIRST.txt` and must be extracted as a complete folder before its app executable is run.
- `npm run release:win` builds both Windows artifacts, inspects the packaged runtime/assets and embedded installer payload, and creates one `.sha256` checksum file beside each artifact.


## Windows releases

The `hd2csm-v1.1.0` release contains the locally tested, unsigned Windows artifacts. Its distinct tag does not trigger the signed `v*.*.*` workflow described below. This one-time unsigned release does not disable signing requirements for future workflow releases.

Maintainers publish the offline installer and portable ZIP with the **Windows Release** GitHub Actions workflow. Push a version tag that matches `package.json`, such as `v1.1.0`, to run validation, tests, packaging, artifact inspection, checksum generation, signature verification, and GitHub Release upload on GitHub's Windows runner. Tagged releases require configured Azure signing credentials and verify both the installed application executable inside the ZIP and the NSIS installer before upload. Use **Actions → Windows Release → Run workflow** for an unsigned manual test build on a branch before tagging. See `docs/RELEASE.md` for the release checklist and owner steps.

## Desktop save files and recovery

The desktop app stores its data under `%APPDATA%\Helldivers 2 Chaos Slot Machine`. The Windows application ID is `com.bootsoftango.helldivers2chaosslotmachine`; save files remain separate from the installation folder so application updates do not replace them.

On first launch after the rename, the app can copy a valid save from `%APPDATA%\Helldivers 2 Chaos Roulette` when the new save location has no existing save. The previous save and backups remain untouched. An existing new save takes priority. Browser storage also copies supported legacy keys to the new names while preserving the originals. JSON exports from the previous application remain supported.

Your working desktop save is a clearly named `state.json` file in that save folder. The file includes the save-format version, the application version that wrote it, the save date, and your saved cards/item edits. Browser `localStorage` is now only used as a development fallback when the app is not running through Electron.

To open the folder, go to **Results** and select **Open Save Folder**. Windows Explorer will open the directory that contains:

- `state.json` — the working save.
- `backups/` — dated automatic backup files. Each backup is stored as a separate JSON file, and the app keeps the latest 20 backups.
- `recovery/` — damaged working saves or damaged backups preserved for manual inspection.

On startup, the app tries `state.json` first. If it is damaged, the app copies it into `recovery/` instead of silently discarding it, then tries backups from newest to oldest. If a backup is recovered, the app shows a friendly message so you know what happened. A blank save is used only when no valid working save or backup exists.

## Exporting, importing, and clearing data

Use the existing **Results → Export JSON** button to make a portable copy of your supported slot-machine state. In the desktop app this opens the normal Windows **Save As** dialog with a dated filename such as `helldivers-2-chaos-slot-machine-export-2026-08-04.json`. The exported JSON includes:

- Saved loadout cards and mission stats.
- Item ownership/enabled changes.
- Supported settings, including the remembered player name.
- Save-format version.
- Application version.
- Export date.

Use **Results → Import JSON** to open the normal Windows file-selection dialog. The app validates the selected JSON before touching the current working save. Unsupported JSON, incorrectly shaped JSON, files over 5 MB, and exports from future save formats are rejected with a friendly explanation. When an import is accepted, the app creates an automatic backup of the current data before saving the imported data, refreshes the affected pages, and writes the imported data to `state.json` so it remains available after restarting the desktop app.

### Moving data from the browser version on first launch

1. Open the browser version.
2. Select **Export JSON** and save the exported file somewhere easy to find.
3. Open the desktop version.
4. Go to **Results → Import JSON** and choose the exported JSON file.
5. Restart the desktop app if you want to confirm the imported cards and item changes were persisted.

### Clear All Data recovery behavior

**Results → Clear All Data** explains that it will erase saved cards, mission stats, item ownership changes, remembered player name, current spin details, rank comparisons, and slot-machine settings from the working desktop save. It requires typing `CLEAR ALL DATA` exactly. The desktop app creates one final recovery backup before clearing; if that backup cannot be created, the clear operation stops and the working save is left alone.

## Offline behavior and optional live data

The core slot-machine app is designed to work without internet access. Application startup, Spin, difficulty selection, built-in planet selection, card creation, Results, Compare, Armory, Rank, Save, Import, and Export all use bundled data and local storage.

The desktop package includes the item catalog and image manifest at `assets/item-catalog.json` and `assets/item-images.json`. In Electron, those files are read through a limited preload bridge that only allows those packaged JSON resources, so ordinary relative-file quirks in packaged builds do not prevent the Armory and item insights from loading. Browser security protections remain enabled.

The **Current active planets (live API)** panel is optional bonus information and requires internet. It checks the public Helldivers 2 campaigns API with a short timeout, does not block startup, and can be refreshed manually from **Armory → Current active planets (live API) → Refresh Live Planets**. If the request fails, the app keeps the built-in planet list available, shows a friendly offline message, and displays the last successful live result when one has been cached. Cached live data is labeled with its last-updated date.

The YouTube channel link is also optional external navigation. In the desktop app it opens only through the secure Electron external-link handler and is not required for any slot-machine feature.
