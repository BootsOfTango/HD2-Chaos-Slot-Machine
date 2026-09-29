# HD2CSM v1.1.3 — local source-audit preview

Unpublished Windows x64 review build, September 14, 2026. This is one bounded step in Milestone 2B, not a complete game-catalog audit or the finished roadmap. Public v1.1.0 downloads remain unchanged.

## Changes

- Reviewed 35 legacy equipment acquisition records. Freedom's Flame, Chemical Agents and Urban Legends now have checked equipment associations and locally bundled official promotional images; Killzone's three primary weapons are grouped under Righteous Revenants.
- Separated Warbond equipment from Superstore purchases, starter gear, edition bonuses, commemorative gifts, campaign rewards and requisition unlocks. Your Owned/Include choices are preserved; these corrections do not unlock or enable anything for you.
- Corrected CQC-1 Saber → CQC-2 Saber, CQC-19 Machete → CQC-42 Machete, and CQC-2 Stun Lance → CQC-19 Stun Lance. Stable IDs, old-name imports and bundled artwork remain compatible. Historical Results retain their original names and scores; derived Armory analytics group the old and new names together.
- Added a compact Armory acquisition-source status and per-item review labels. The total is 28 primary-source reviewed, 12 community-source reviewed and 167 pending out of 207 records. Reviewed labels concern acquisition, not a claim that all current game properties are certified.
- Preserved player-defined source labels on custom items without presenting them as verified catalog facts.

## Review safely

Run `scripts/start-local-preview.cmd` from `C:\Users\Chris\Desktop\HD2CSM-Source`. It uses `dist\review-profile-v1.1.3`, separate from your normal AppData saves. The prior v1.1.2 runtime is archived under `dist\preview-v1.1.2`; its installer and ZIP remain available.

- Installer: `Helldivers-2-Chaos-Slot-Machine-Setup-v1.1.3-win-x64.exe`.
- Portable ZIP: `Helldivers-2-Chaos-Slot-Machine-v1.1.3-win-x64.zip`.

Both bundle the runtime and local assets. No development tools are needed to run them. Do not install into the source checkout or old runtime folder during review. This local build is unsigned; Windows may warn about an unknown publisher.

## Remaining limits

- The WASP/W.A.S.P. pair and EMS Strike/Orbital EMS Strike pair are confirmed duplicate equipment identities. They are still separate catalog records and can affect roll weighting until a dedicated ID-safe migration is implemented. EMS Mortar Sentry is a distinct item and must remain separate.
- The remaining 167 acquisition records and other Warbond covers need review. The three new images are official promotional scenes, not exact in-game Acquisitions covers. Attribution does not grant unrestricted artwork redistribution rights; public-release rights review remains pending.
- The full collapsible Armory redesign, unrestricted cross-faction planet rolls, five-minute war-data refresh, compatible mission engine and galaxy map remain queued.
- Packaged-app automation is not installation or physical-hardware acceptance. Installer upgrade/uninstall/shortcuts, physical Windows scaling/trackpad behavior, native file pickers and audible sound remain hands-on gates for this preview.

See `docs/M2B_TEST_REPORT.md` for checks actually executed. Publication needs owner approval and public-release signing/rights review. No push, tag or GitHub release is included in this increment.
