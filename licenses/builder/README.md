# electron-builder template attribution

HD2 Chaos Slot Machine's installer contains compiled installer templates from electron-builder / app-builder-lib **26.15.3**, maintained at https://github.com/electron-userland/electron-builder . Both locked packages identify their license as MIT. `LICENSE.txt` is the unmodified notice delivered with the locked electron-builder package (Copyright (c) 2015 Loopline Systems); it also matches the project's published MIT notice: https://github.com/electron-userland/electron-builder/blob/master/LICENSE .

SHA-256 of the copied notice: `bed8d0ab3e6031817f775a641ff37313b0f5591bc8ba0ed79b978dafbd4231ce`.

Project modification: ten WinShell call sites in `templates/nsis/include/installer.nsh` and `templates/nsis/uninstaller.nsh` are replaced with calls to the original HD2 helper. These are modified template inputs, not unmodified upstream templates. The version/hash-guarded adaptation is maintained in `scripts/prepare-installer-shell.js` in the source checkout; original helper/integration source accompanies this distribution under `licenses/hd2-shell`. No upstream builder JavaScript is modified and its normal uninstaller signing path is retained.

This notice supplements, not replaces, the separate NSIS/plugin notices and source packages under `licenses/installer`, Electron/Chromium notices and the project license. It does not grant rights to game artwork or imply upstream endorsement. End users need not install any development tools or open source archives to run the application.
