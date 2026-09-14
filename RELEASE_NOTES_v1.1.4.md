# HD2CSM v1.1.4 — local duplicate-cleanup preview

September 14, 2026. Unpublished, unsigned Windows x64 preview. This is the next bounded M2B catalog task, not a complete source audit or the map/mission update.

## Changes

- Wasp and StA-X3 W.A.S.P. Launcher now represent one support weapon in the roll pool.
- EMS Strike and Orbital EMS Strike now represent one orbital stratagem. EMS Mortar Sentry stays distinct.
- Existing full-name stable IDs remain canonical. Shortened names and retired IDs still import; no old artwork files were deleted.
- Conflicting ownership/inclusion uses canonical ID, then retired ID, canonical name, and alias, with the first supplied row winning ties. Choices are never OR-combined to enable equipment. If only the old entry exists, it keeps its choices.
- Replaced original records remain recoverable under `legacyAliasRecords` in saves and JSON exports. Armory → Duplicate cleanup shows current choices and retained records. Change current eligibility through the existing Manual pool management controls.
- Saved Results retain their old labels, fingerprints, stats and scores. Usage analytics count each equipment identity once per run, even if an old loadout contained both former duplicate entries.
- The catalog now has 205 unique entries: 27 primary-source reviewed, 11 community-source reviewed, 167 pending. The original 35-row audit evidence is retained; the two-row count reduction is deduplication, not lost review work.

## Local files and review

- Installer: `C:\Users\Chris\Desktop\HD2CSM-Source\dist\Helldivers-2-Chaos-Slot-Machine-Setup-v1.1.4-win-x64.exe`.
- Portable ZIP: `C:\Users\Chris\Desktop\HD2CSM-Source\dist\Helldivers-2-Chaos-Slot-Machine-v1.1.4-win-x64.zip`.
- Safe launcher: `scripts\start-local-preview.cmd` uses `dist\review-profile-v1.1.4`, separate from personal AppData saves. No installation is needed to try it. Keep the packaged runtime folder together.

Prior installers/ZIPs remain intact; the previous unpacked runtime is archived at `dist\preview-v1.1.3`. Do not install into the source checkout or overwrite the old runtime folder for review.

## Remaining work

The 167 pending acquisition records and remaining Warbond images still need review. Cross-faction planet rolls, automatic war refresh, the full visual Armory, compatible missions and the galaxy map remain queued. Existing source/artwork caveats remain; no new rights or acquisition claims were introduced here.

See `docs/M2B_DEDUP_TEST_REPORT.md` for executed checks and limitations, and `docs/CATALOG_IDENTITY_MIGRATION.md` for the conflict policy. Native installer integration/upgrade/uninstall, physical display scaling/trackpad, native file pickers and audible sound require separate acceptance. The installer remains unsigned. Publication still needs owner approval, signing credentials and artwork-rights review.
