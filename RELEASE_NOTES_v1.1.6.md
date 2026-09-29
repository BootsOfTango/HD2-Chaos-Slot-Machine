# HD2CSM v1.1.6 — local Warbond review preview

September 14, 2026. Unpublished, unsigned Windows x64 preview. This is a bounded Milestone 2 increment, not the full Armory redesign or live-war/mission/map update. **The graphics-safety build and Warbond-specific automated regression gate passed; owner hands-on acceptance and public-release gates remain pending.**

The interrupted build directly under `dist/` is damaged and MUST NOT be used. A separate graphics-safety candidate was built and tested under `dist/safety-preview-v1.1.6/`; see [the safety report](docs/DESKTOP_GRAPHICS_SAFETY.md) for executed checks and limitations. It adds app-local software rendering, guarded fullscreen close, exclusive desktop-test execution and non-forcing timeout handling. It does not establish that the Windows blue-screen cause is fixed.

- Reviewed 13 additional equipment acquisitions against official Control Group, Servants of Freedom and Borderline Justice announcements. Their complete rollable sets contain five, four and five existing items respectively; VG-70 Variable's earlier review is unchanged. No new gear, ownership or default roll eligibility is granted by these metadata updates.
- Corrected five stratagem associations: Epoch, Laser Sentry and Warp Pack belong to Control Group; Portable Hellbomb belongs to Servants of Freedom; Hover Pack belongs to Borderline Justice. Separate Superstore equipment, including the Combat Hatchet, is not granted by a themed Warbond.
- Grouped Warp Pack, Hover Pack and Portable Hellbomb as backpacks, and TED-63 Dynamite with grenades. Exact menu-category corroboration is distinguished from primary-source acquisition evidence.
- Corrected the booster name to **Sample Extricator**. Its existing `booster:sample-extractor` ID and the old `Sample Extractor` name remain compatible. Full official designations for the five stratagems are added as aliases, not duplicate items. Historical Result labels/scores, saved ownership/include choices and existing item artwork are preserved.
- Added three more locally bundled official promotional images, with source URLs, attribution and provenance. They are promotional artwork, not a claim of exact in-game Acquisitions covers.
- In Armory → Manual pool management → Source / Warbond-first, ten reviewed Warbond groups offer full-set include, exclude and unowned actions. They affect the entire declared equipment set even under filtered search, never unrelated/custom/shop entries. Exclusion retains ownership; marking unowned also excludes. Only use include-all when you have unlocked every item.
- Acquisition totals: **56 primary-source + 12 community-source + 137 pending = 205 unique records**. That is 68 reviewed acquisitions. The prior WASP/Orbital EMS duplicate cleanup remains in place.

## Verified local files and safe review

- Installer: `C:\Users\Chris\Desktop\HD2CSM-Source\dist\safety-preview-v1.1.6\Helldivers-2-Chaos-Slot-Machine-Setup-v1.1.6-win-x64.exe`
- Portable ZIP: `C:\Users\Chris\Desktop\HD2CSM-Source\dist\safety-preview-v1.1.6\Helldivers-2-Chaos-Slot-Machine-v1.1.6-win-x64.zip`
- Safe review launcher: `scripts\start-local-preview.cmd`, using `dist\review-profile-safety-v1.1.6`, not personal AppData. No installation is needed for this isolated preview. Keep the complete runtime folder together.

Do not install or extract into the source checkout or over the old runtime folder for review. The public GitHub download remains v1.1.0; this increment is local and has not been published. Unsigned Windows builds may show an unknown-publisher/SmartScreen warning. Verified SHA-256 sidecars accompany both artifacts. The packaged EXE was tested in its unpacked runtime; native installer execution/upgrade was not performed.

## Remaining work and acceptance

Executed: final 165 unit checks plus catalog/assets; new and prior Warbond packaged regression suites, source audit, gear/ownership, duplicate identity and an actual v1.1.3 EXE → v1.1.6 EXE isolated save upgrade with original backup preservation. The unchanged build also passed the earlier focused safety startup/restart/close checks, development workflow, packaged workflow/fullscreen and controlled network cases. Installer/ZIP contents and source parity passed again. See [batch-3 test evidence](docs/M2B_WARBOND_BATCH3_TEST_REPORT.md) for counts, command paths and the distinction between current-session checks and prior evidence. Audible sound, native file-picker interactions, native installation and long-duration stability are not established by these checks.

The remaining 137 acquisitions and other Warbond artwork still need review. Cross-faction planets, automatic war refresh, the full visual Armory, compatible missions and galaxy map remain queued. Native installer integration/upgrade/uninstall, physical display scaling/trackpad, native file pickers and audible sound require separate acceptance. Public release needs owner approval, Windows signing credentials and artwork-rights review.

Source evidence and its limits are recorded in [the batch 3 research](docs/M2B_WARBOND_BATCH3_RESEARCH.md).
