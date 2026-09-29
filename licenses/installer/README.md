# Windows installer component notices and source

These files accompany HD2 Chaos Slot Machine's Windows installer. They do not change the licenses of the application, game artwork or the components themselves. This is a local preparation set; **public-release review is not complete**.

## What is included

- NSIS core/default plugins (System, nsDialogs, nsExec) and default wizard art: `NSIS-COPYING.txt`, copied unmodified from the nsis-3.0.4.1 toolset. It includes the upstream component-specific terms and compression exception; not every listed compression module is used by this installer.
- StdUtils 1.14 (LoRd_MuldeR): `LGPL-2.1.txt`, `StdUtils-ReadMe.txt`, `StdUtils-LGPL-CLARIFICATION.txt`, and the author's complete `sources/StdUtils.2018-10-27.sources.tbz2`. The source TAR matches the source TAR supplied with the byte-identical Unicode DLL. Preserve the author's clarification verbatim, including its terminology; this project has not rewritten it.
- Nsis7z 19.00 (Nik Medved, with updates credited to Marek Mizanin and Stuart Welch): `Nsis7z-License.txt`, `Nsis7z-ReadMe.txt`, the original `sources/Nsis7z_19.00.7z`, and its documented prerequisite `sources/lzma1900.7z`. The plugin's README retains its LGPL discussion; its separate license file describes the public-domain LZMA SDK. Do not collapse these different statements into a blanket license for all code.
- LZMA SDK 19.00 (Igor Pavlov and credited contributors): `LZMA-SDK-ReadMe.txt` and the unmodified SDK archive above.
- UAC 0.2.4c (Anders): `UAC-License.txt` and the original `sources/UAC.zip`, containing source and binaries. Its Unicode DLL matches the reviewed installer.

The source archives are delivered alongside notices, not merely linked to a future download. Some upstream archives also contain example/prebuilt programs. They are retained unchanged for provenance, are **not application runtime dependencies**, and are never launched by the app or installer. End users need not open or install anything in this folder to run the application. Developers should inspect source before building or running it. No reproducible compilation of upstream DLLs is claimed by this project.

## Source use

For StdUtils, extract the `.tbz2` then its TAR with a compatible archive reader. The supplied tree contains `Contrib/StdUtils/StdUtils.sln`, project files, component sources/licenses and packaging scripts. Keep the full tree and upstream notices.

For Nsis7z 19.00, follow the version-specific instructions at the end of `Nsis7z-ReadMe.txt`: extract the plugin release, add the SDK's `C` and `CPP` trees under `Contrib/nsis7z`, then build the supplied solution with VS 2017. This describes upstream instructions, not a build tested here. The older instructions earlier in that README concern earlier releases.

UAC's original ZIP contains its source and resource/header files. No component was modified by this project. Do not imply our SHA-256 matching is an upstream signature verification: it establishes equality between the HTTPS-downloaded maintainer archive and the already-reviewed installer DLL.

## Historical WinShell issue and replacement

WinShell's Unicode DLL is byte-identical to the file in the author's [download page](https://nsis.sourceforge.io/WinShell_plug-in). That page labels it Freeware, but the ZIP has no source or full license text. No additional license is invented here. Clarify the author's distribution terms or choose a reviewed replacement before declaring the public installer cleared. The downloaded WinShell ZIP is research evidence only and is not added to these source materials.

Current build configuration replaces the WinShell calls with original project source delivered in the adjacent `hd2-shell` directory under the project Apache-2.0 license. The manifest below retains historical matching evidence, including the older WinShell match; it is not a declaration that WinShell is present in the new installer. New artifact verification explicitly requires its absence in both installer and uninstaller. Other components and their notices/source archives are unchanged.

## Reproducibility

`manifest.json` records source URLs, download hashes, byte-matched DLLs and every vendored legal/source file hash. In the project checkout, `npm run validate:installer-licenses` verifies this set without internet or downloaded-code execution. `node scripts/prepare-installer-licenses.js --prepare` regenerates it only from already-downloaded, pinned inputs under the ignored research folder; it refuses changed inputs or overwritten material. See `docs/INSTALLER_LICENSE_MATERIALS.md` for scope and remaining gates.
