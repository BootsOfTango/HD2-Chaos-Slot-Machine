# Ironclad Democracy catalog update — September 24, 2026

Local branch: `codex/ironclad-gear`. Descriptive candidate: `ironclad-gear`; internal version unchanged. No GitHub publication authorized by this change.

## Reviewed scope

| Acquisition | Slot | Item |
| --- | --- | --- |
| Ironclad Democracy | Primary | AR-11 Arbitrator |
| Ironclad Democracy | Primary | GL-15 Evictor |
| Ironclad Democracy | Sidearm | P-34 Breacher |
| Ironclad Democracy | Throwable | G-60 Anti-Tank Seeker |
| Ironclad Democracy | Throwable | G-8 Immolation |
| Ironclad Democracy | Booster | Integrated Extinguishers |
| Ironclad Democracy | Booster | Surplus EAT Allocation |
| Separate Superstore purchase | Primary / energy | LAS-12 Sai |

[Arrowhead's official PlayStation announcement](https://blog.playstation.com/2026/09/15/helldivers-2-ironclad-democracy-warbond-launches-sept-22/) identifies the seven Warbond equipment entries and September 22 release. The current [Arbitrator page](https://helldivers.wiki.gg/wiki/Arbitrator) corroborates post-release procurement. The [Sai page](https://helldivers.wiki.gg/wiki/LAS-12_Sai) corroborates its primary/energy slot and separate Superstore procurement, but is work in progress. Mutable damage, price and rotation availability are deliberately not modeled. Steam's official September 22 Devoid of Liberty 7.1.0 news was checked through its public news API; it is context, not proof of every item detail.

Surplus EAT Allocation is a booster, not another selectable EAT stratagem. No additional Warbond stratagem was identified. Armor/cosmetics are outside the roulette's scope. A nearby TD-110 Maelstrom announcement is not treated as a permanent unlock without a separate acquisition review. This is an eight-item scoped addition, not a claim that every item in the current game has been exhaustively audited.

## Ownership and compatibility

- All eight additions default to unowned and excluded on fresh installs and older-save upgrades. Armory → Review new gear lets players confirm actual unlocks.
- Ironclad bulk enable changes exactly its seven IDs; it does not grant Sai, Castellan equipment, rewards or unrelated gear. Existing Castellan bulk enable is similarly source-scoped.
- Canonical IDs and aliases support older custom name-only imports without duplicates; existing flags and custom metadata remain recoverable. Old review-dismissal tokens cannot hide the new notice.
- The previous 206 items and 24 groups are protected by independent hashes extracted from the accepted activity-map package. New totals: 214 equipment identities, 25 Warbond groups. Existing Results, scores, names, planet rules and prior ownership choices are unchanged.
- Themed names recognize Sai energy, Immolation fire, Breacher/Seeker explosive and booster support/defense. A fire extinguisher is not counted as offensive flame weaponry.

## Artwork / rights boundary

Eight original repo-native SVG symbols and one original catalog cover are bundled with hashes/provenance in `assets/catalog-additions/ironclad/`. They are clearly labeled symbolic illustrations, not official game renders or accurate weapon-model replicas. No third-party image bytes were copied for this addition. The community image source was incomplete/protected, so it was not bypassed or substituted with unrelated gear renders.

This does not clear existing game/trademark/artwork rights. Prior unresolved provenance findings and public-release approval/signing gates remain. The source inventory audit's supplemental review permits only matching reviewed IDs/names/types/acquisition records; the older inventory is not rewritten to imply it was current on its historical date.

## Verification

Completed local delivery:

-823 units plus CSP/catalog/assets pass (`.test-data/ironclad-all-tests-final.log`); generator idempotence verified. Tests cover exact membership, independent prior-catalog hashes, ownership defaults/migration/aliases, SVG hashes, bulk boundaries and naming themes.
- Source314 workflow +20 restart at `.test-data/electron-smoke-1790229255641` passed before final text/thumbnail/guide polish.
- Final packaged gear148 +13 restart at `.test-data/packaged-gear-1790305628143`: all eight items forced through actual slot roulette;16 panel images decoded with HTTP/HTTPS blocked; both bulk interfaces preserve unrelated gear; legacy imports/browser and desktop roundtrips preserve history. Enabled Sai and owned-but-excluded Extinguishers survive restart. Screenshot review verified correct heading and uncropped symbols.
- Final packaged workflow311 +15 restart +7 normal/fullscreen +33 controlled-network +5 cache at `.test-data/packaged-smoke-1790305653525`; transfer31+7 at `.test-data/packaged-transfer-1790305716627`; security44 at `.test-data/packaged-security-1790305724759`. All tests isolated/software-rendered/gracefully exited.
-475 bundled source matches, installer payload, ZIP/offline runtime, fuses and notices checked at `.test-data/ironclad-gear-artifact-inspection/report.json`; checksum sidecars regenerated. Defender final scan found no threats (`.test-data/ironclad-defender-delivery.log`), not a guarantee. Both EXE/installer unsigned. Installer/uninstaller inspected, not executed; no new physical DPI/touch/audio, game-client comparison, long-soak or clean-Windows acceptance claim.

Pre-delivery test reports remain historical. Visual review corrected an outdated panel heading and cropped thumbnails. A subsequent guide-update build was interrupted during ZIP creation; `ironclad-build-resumed.log` records the successful full replacement. Final parity and all four suites were rerun on it.29 post-archive resolver checks passed (`ironclad-post-archive.log`).

## Delivery and recovery

Existing Desktop `HD2 Chaos Slot Machine.lnk` now opens `scripts/start-ironclad-gear-review.cmd` with the same `.test-data/mission-owner-review` profile.107 old activity-map build files archived/hash-verified at `.test-data/accepted-builds/activity-map`; adjacent `activity-map-move.json` records restoration paths/hashes. Save/shortcut backup: `.test-data/ironclad-gear-promotion-20260924-230912`. Old launcher supports archive recovery. No permanent deletion/new Desktop files. Do not rerun the promotion script.

Installer: `C:\Users\Chris\HD2CSM-Development\HD2CSM-Source\dist\ironclad-gear\HD2-Chaos-Slot-Machine-Setup-local-ironclad-gear-win-x64.exe`.

Portable ZIP: `dist/ironclad-gear/HD2-Chaos-Slot-Machine-local-ironclad-gear-win-x64.zip`.

Final installer SHA256: `304eb69568008febc6371cfc5e3e932493714179c1d755250110d3ce668eccb7`.
Final ASAR SHA256: `b8eff8d74a16c62ee5cf685dcd76951004f6cbc00d075fff0b25b895b6cf5176`.
Installed baseline unchanged: `F8E05A940DA3F200796E7DAC55B4166458B7E5C18549726C63E665D7EBCC37E0`.
Owner-review save unchanged: `76F4823EF3B02602790B8E97FC0AB2BF5D797D803F0FDB274601A4D5709AE5EC`.

Next: owner tests actual unlocked gear; then resume artwork provenance/rights and M7 acceptance. No public-release approval is inferred.
