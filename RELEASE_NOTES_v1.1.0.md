# HD2CSM v1.1.0 — Helldivers 2 Chaos Slot Machine

The Windows desktop release of **Helldivers 2 Chaos Slot Machine**, previously known as Helldivers 2 Chaos Roulette. New name, yellow-and-black **HD2CSM** branding, and the familiar slot-machine interface.

**Unsigned Windows x64 build:** this release contains the same application build tested locally on Windows. Code-signing credentials are not configured, so Windows may display an unknown-publisher/SmartScreen warning. Checksums identify these exact downloads; they are not a code-signing certificate. No development tools are required to install or run the app.

## Highlights

- New **HD2CSM** yellow-and-black slot-machine identity for the program title and Windows icons.
- Complete offline Windows x64 Setup installer and portable ZIP, including the Electron runtime. End users do not need Node.js, npm, or Python.
- Automatic, non-destructive migration from the previous desktop save folder when no new save exists, with continued support for older JSON exports.
- Spin, Results, Compare, Armory, and Rank use bundled catalog data and local artwork. Live planet refresh is optional and falls back to dated cached data or bundled planets.
- Local saves, automatic backups, damaged-save recovery, and portable JSON export/import support.

## Fixes and improvements

- Replaced primary, sidearm, and throwable placeholders with bundled game renders: **50 primaries, 23 sidearms, and 20 throwables**.
- Replaced simplified booster substitutes with **18 game-matching wiki icons**. Some are community-traced representations of the in-game symbols, not developer-provided SVGs; source attribution is retained.
- All 111 weapon/booster images load without internet. The reported Adjudicator, Machete, Arc grenade, and Increased Reinforcement Budget visuals are corrected.
- First-ever offline launch now has complete item and planet pools. API outages, timeouts, rate limits, malformed responses, and missing factions cannot block randomization.
- Live planets refresh when connected; cached data shows its update date, and bundled fallback planets are clearly identified.
- Prevented repeated reroll actions during reel animation and corrected planet reroll/faction handling.
- Pending Results are visibly unfinished and excluded from scoring, Compare, and Rank until finalized.
- Fixed Major Order score/radar penalties, untruncated raw-score totals, Compare deaths/stims display, and booster analytics.
- Compare filters/overlays no longer mutate saved cards. Import and Clear All refresh their views correctly.
- Installer, portable ZIP, release workflow filenames, and SHA-256 sidecars now agree.

## Upgrading and saves

- New desktop saves live in `%APPDATA%\Helldivers 2 Chaos Slot Machine`.
- On first launch, a valid legacy desktop save is copied when no new save exists. Old saves and backups remain untouched; an existing new save takes priority.
- Legacy browser storage keys and previously exported Roulette JSON remain supported.
- Export a JSON backup before upgrading. The renamed application may coexist with the older installation; use the new **Helldivers 2 Chaos Slot Machine** shortcut.

## Validation

Verified on Windows: **38 unit tests**, catalog/asset validation, **76 development desktop assertions**, and **73 installed-application assertions**, including offline image decoding, Spin, locks/rerolls, Results/scoring, Compare, Armory, Rank, and persistence across separate process restarts. Desktop import/export was exercised through the real preload/IPC with file-dialog paths supplied by the test harness. Both downloadable artifacts and checksums were verified. The installed build also passed the owner's follow-up functional check.

Remaining limits: speaker output was not independently verified by listening; native file-picker interaction was not manually driven in the packaged test; the ZIP was inspected but not separately exercised through the complete workflow. Rank-tier/warbond fallback placeholders remain. Details are in `docs/FINAL_TEST_REPORT.md`.

This unsigned release uses tag **hd2csm-v1.1.0**. The existing signed-release workflow remains available for future signed `v*.*.*` releases.

## Installation

1. Run `Helldivers-2-Chaos-Slot-Machine-Setup-v1.1.0-win-x64.exe`. Installation uses the bundled payload and does not download development tools.
2. Launch **Helldivers 2 Chaos Slot Machine** from its shortcut or Start menu entry.
3. Use **Results → Export JSON** to create a portable backup and **Results → Import JSON** to restore a supported desktop or older browser backup.

For the portable version, extract all of `Helldivers-2-Chaos-Slot-Machine-v1.1.0-win-x64.zip`, then run `Helldivers 2 Chaos Slot Machine.exe` inside that folder. Keep its runtime files and resources beside it.

Each artifact has a matching `.sha256` file. To calculate the installer checksum in PowerShell:

```powershell
Get-FileHash .\Helldivers-2-Chaos-Slot-Machine-Setup-v1.1.0-win-x64.exe -Algorithm SHA256
```
