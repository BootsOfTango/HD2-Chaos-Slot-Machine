# HD2CSM v1.1.5 — local Warbond review preview

September 14, 2026. Unpublished, unsigned Windows x64 preview. This is a bounded Milestone 2 increment, not the full Armory redesign or live-war/mission/map update.

- Reviewed 17 additional equipment acquisitions in Cutting Edge, Democratic Detonation and Polar Patriots. The three Warbonds each have an explicit six-item set; all equipment already existed in the catalog. No ownership or default roll eligibility is granted by metadata updates.
- Corrected Punisher Plasma to Energy, Eruptor to Explosive and Grenade Pistol to Special sidearm. Stable IDs, canonical names, old aliases, local gear images, saved choices and historical Results remain compatible.
- Added three locally bundled official promotional images. These are not exact in-game Acquisitions covers. Original formats, marks, source URLs, attribution and byte hashes are retained.
- In Armory → Manual pool management → Source / Warbond-first, seven reviewed Warbond groups now offer full-set include, exclude and unowned actions. They affect all declared equipment even under filtered search, never unrelated/custom/shop entries. Exclusion retains ownership; marking unowned also excludes. Only use include-all when you have unlocked every item.
- Acquisition totals: 43 primary-source + 12 community-source + 150 pending = 205 unique records. Localization Confusion's association remains explicitly community-supported. The prior WASP/Orbital EMS cleanup remains in place.

## Local files

- Installer: `C:\Users\Chris\Desktop\HD2CSM-Source\dist\Helldivers-2-Chaos-Slot-Machine-Setup-v1.1.5-win-x64.exe`
- Portable ZIP: `C:\Users\Chris\Desktop\HD2CSM-Source\dist\Helldivers-2-Chaos-Slot-Machine-v1.1.5-win-x64.zip`
- Safe review launcher: `scripts\start-local-preview.cmd`, using `dist\review-profile-v1.1.5`, not personal AppData. No installation is needed. Keep the complete runtime folder together.

Previous installers/ZIPs remain intact; the previous unpacked runtime is archived at `dist\preview-v1.1.4`. Do not install or extract into the source checkout or old runtime folder for review.

## Remaining work

The remaining 150 acquisitions and other Warbond artwork still need review. Cross-faction planets, automatic war refresh, the full visual Armory, compatible missions and galaxy map remain queued. Native installer integration/upgrade/uninstall, physical display scaling/trackpad, native file pickers and audible sound require separate acceptance. Public release needs owner approval, Windows signing credentials and artwork-rights review.

See `docs/M2B_WARBOND_TEST_REPORT.md` for the final executed checks, exact artifacts and limitations.
