# Installer component-notice audit — September 16, 2026

Completed on `codex/installer-notice-audit`; continued into source-only M3 work on `codex/live-war-foundation`. Previous dirty work preserved. No commit/push/publication, personal installation change, account/VM setup or security-setting change.

## Finding and fix

The installer compiles electron-builder/app-builder-lib templates but the previous distributed notice set omitted their MIT copyright/permission notice. The locked packages both report **26.15.3 / MIT**. The exact 1,084-byte LICENSE delivered with electron-builder was copied without modification to `licenses/builder/LICENSE.txt` (SHA-256 `bed8d0ab3e6031817f775a641ff37313b0f5591bc8ba0ed79b978dafbd4231ce`). Its text agrees with the [maintainer's published notice](https://github.com/electron-userland/electron-builder/blob/master/LICENSE). The attempted `v26.15.3` raw license URL returned 404; it is not cited as successfully retrieved evidence. app-builder-lib's local package omits a standalone LICENSE file, so the documented source is the same-version electron-builder package plus shared repository metadata, not an invented app-builder-lib license file.

The accompanying README identifies the project's ten-call template modification, while keeping the original license unmodified. Before-pack and normal prebuild validation reject missing/changed notices or unreviewed builder versions. Both portable and installer payload now carry the notice and attribution README.

`scripts/installer-component-policy.js` also pins every reviewed outer/inner plugin and the wizard bitmap. Verification compares extracted bytes without executing installer components, and rejects missing, unexpected, duplicate or changed members.

| Component | Match / retained material |
| --- | --- |
| System, nsDialogs, nsExec | Exact Unicode DLLs from the reviewed NSIS 3.0.4.1 toolset; full NSIS COPYING |
| UAC | Exact 0.2.4c author archive DLL; zlib notice and source archive |
| StdUtils | Exact 1.14 DLL; LGPL 2.1, verbatim author clarification, README and corresponding source archive |
| nsis7z (installer only) | Exact 19.00 DLL; original License/README, source archive and specified LZMA SDK 19.00 |
| modern-wizard.bmp | Exact `Contrib/Graphics/Wizard/nsis3-metro.bmp` bytes from the reviewed toolset; NSIS COPYING |
| Project shell helper | Original Apache-2.0 helper/integration source shipped separately; no WinShell code |
| Builder templates | Added full MIT notice and explicit modification attribution |

The [NSIS license page](https://nsis.sourceforge.io/License) distinguishes core/graphics and compression-module terms. The build's version-specific COPYING remains unmodified, including its LZMA exception; this project has not replaced it with newer website text or applied one blanket license to everything. Existing source archives/notices are unchanged. No reproducible recompilation of upstream DLLs is claimed.

## New local candidate: Installer Notices

- Setup: `dist/installer-notices/HD2-Chaos-Slot-Machine-Setup-local-installer-notices-win-x64.exe`
- Setup SHA-256: `814bc092acc7a72266d82d070578526b8bce2b7141585202d6d748ff80f488de`
- ZIP: `dist/installer-notices/HD2-Chaos-Slot-Machine-local-installer-notices-win-x64.zip`
- ZIP SHA-256: `feeb9291cfc59efce6384d2650c1a8433928a9dd0243e1ec9665e685dad5c6df`

**374 units** and CSP/catalog/assets passed before the build. ZIP CRC, **389 ASAR source comparisons**, **29 embedded payload comparisons**, 14 existing upstream legal/source files, two helper files and two builder-attribution files pass. All **13 component occurrences** match (six installer DLLs + its bitmap; five uninstaller DLLs + its bitmap). Both archives still contain no WinShell. Evidence: `.test-data/installer-notices-artifact-inspection/report.json`; full component mappings and hashes are in `componentReview`.

App EXE and ASAR hashes are identical to the installed Installer Shell/Combined Preview runtime. This is a packaging/notice change, not a new gameplay implementation. Fresh packaged tests pass **54 workflow + 8 restart + 7 normal/fullscreen + 14 controlled-network checks**, using isolated profiles/software rendering and graceful exits (`.test-data/packaged-smoke-1789603514869`). Audible listening/native-picker interaction is not inferred from those checks. Defender scanned the candidate folder, exit 0/no threats (`.test-data/installer-notices-defender.log`). Build signing stages were deliberately skipped; this remains unsigned and unpublished.

**The new Setup was not installed.** The personal installation remains the previously backed-up/tested Installer Shell candidate. No personal profile read/write or new native install/uninstall occurred this session. Do not reuse the previous candidate's native upgrade evidence as if this exact new Setup had run. `scripts/start-notice-review.cmd` launches this preview with separate review data.

## Cleanup, decision and remaining scope

Archived/hash-verified **103** superseded Combined Preview files under `.test-data/accepted-builds/combined-preview`; adjacent move manifest records original and restoration paths. Old launcher/archive resolution updated. No permanent deletion or Desktop duplicates. Active `dist` now holds installed-baseline `installer-shell` and latest `installer-notices` only. Historical reports were not rewritten or silently regenerated against new binaries.

The owner explicitly chose **continue live-planet work; defer clean-install testing** after the read-only Windows environment check. See `CLEAN_WINDOWS_ACCEPTANCE.md` for the future test procedure and limits. Do not repeat personal-install upgrades or change OS/virtualization settings to substitute for that deferred gate.

No further missing notice was detected in this bounded installer-component review. This is technical inventory/source-delivery evidence, **not a legal opinion or guarantee against copyright claims**. Final release artifacts must be checked again after roadmap changes. Artwork permission/use bases, hosted CI/security enforcement, final signing/scan, clean-machine/uninstall and remaining user acceptance are still separate gates. The public-release gate stays closed.
