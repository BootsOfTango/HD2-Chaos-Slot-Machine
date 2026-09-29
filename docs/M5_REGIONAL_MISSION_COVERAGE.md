# M5 regional mission coverage — September 20, 2026

Branch `codex/regional-mission-coverage`. Revision `review-2026-09-20-a`: **54 identities /32 suggested /22 confirmation-only**. Reviewed partial catalog, not a live copy of a player's operation screen.

## Reviewed additions

| Mission / community reference | Front | Difficulty | Minutes | Treatment |
| --- | --- | --- | --- | --- |
|[Conduct Mobile E-711 Extraction](https://helldivers.wiki.gg/wiki/Conduct_Mobile_E-711_Extraction)|Terminids|1–10|40|Player-confirmed|
|[Extract E-711](https://helldivers.wiki.gg/wiki/Element_711)|Terminids|1–10|40|Player-confirmed|
|[Restart Pumps](https://helldivers.wiki.gg/wiki/Restart_Pumps)|Terminids|1–10|40|Player-confirmed|
|[Seize Industrial Complex](https://helldivers.wiki.gg/wiki/Seize_Industrial_Complex)|Automatons|1–10|40|Suggested|
|[Annex Untapped Mineral Sites](https://helldivers.wiki.gg/wiki/Annex_Untapped_Mineral_Sites)|Automatons|1–10|40|Player-confirmed|
|[Halt Cyborg Production](https://helldivers.wiki.gg/wiki/Halt_Cyborg_Production)|Automatons|4–10|40|Player-confirmed|
|[Blitz: Destroy Bio-Processors](https://helldivers.wiki.gg/wiki/Blitz%3A_Destroy_Bio-Processors)|Automatons|5–10|12|Player-confirmed|
|[Sabotage Orgo-Plasma Synthesis](https://helldivers.wiki.gg/wiki/Sabotage_Orgo-Plasma_Synthesis)|Automatons|1–10|40|Suggested|

Facts reviewed from indexed community wiki text September20; source records explicitly say community-reference/indexed-text, not publisher verification. No briefing text or game artwork copied.

The [Gloom overview](https://helldivers.wiki.gg/wiki/The_Gloom) distinguishes retired expedition missions from the Hive World roster. Do not expand ordinary suggestions with the older Gloom collection/research missions merely because a planet is named in a dispatch. The three added Hive World missions require player observation because the current adapter does not verify regional operation identity. Existing Chart Terminid Tunnels remains confirmation-only and retained for compatibility.

Seize Industrial Complex and Sabotage Orgo-Plasma Synthesis explicitly entered the regular Automaton roster in their source change histories. They are compatible suggestions, never guaranteed operation members. Annex Mineral Sites and Bio-Processor Blitz have reviewed durations/difficulties but insufficient regional availability evidence in this bounded review, so they remain confirmation-only. Halt Cyborg Production is explicitly Megafactory-only; do not infer that from an Automaton planet or Cyberstan name.

E-711 mission renames are recorded in notes without introducing duplicate rows. Extract E-711 was retrieved through the indexed Element 711 redirect. The mobile and fixed extraction missions are distinct, while flag/drill/processor subobjectives are not extra main-mission rolls. Existing side-objective count/scoring remains unchanged.

**Source gaps retained:** Destroy Spore Lung direct page access failed and indexed searches did not establish its time limit; do not guess40 minutes. Eradicate Illuminate Forces still lacks sufficient duration/operation evidence. Both remain outside the catalog for now; custom observed mission entry is available. This is not full faction coverage or M5 acceptance.

## Compatibility and presentation

All46 previous mission records and source records remain exact against `test/fixtures/mission-catalog-2026-09-19-c.json`. Revision changes ask the player to review a previous operation, without silently replacing its checklist. Historical Results and entered numbers remain unchanged. No scoring, schema, application version or fullscreen change.

Seven40-minute additions retain Normal (40); the12-minute Blitz retains Blitz (12). These app compatibility families are not official game scores. Confirmation stays scoped to planet, difficulty and event context, with conflicts recorded rather than silently changing global rules.

Short labels reuse the existing original fuel, survey, bunker and blitz symbols. The established23-icon set remains unchanged; no new official/downloaded artwork.

## Verification

- **637 units**, CSP/catalog/assets passed: `.test-data/mission-regional-unit.log`.
- Each addition is tested across3 factions×10 difficulties×4 campaign contexts. Manual/random equality, explicit confirmation, scope invalidation, metadata, no keyword inference, historical snapshots and old-record parity covered.
- Source renderer: **250 workflow +18 restart**, `.test-data/electron-smoke-1789879946590/report.json`.
- Initial source run `.test-data/electron-smoke-1789879857989` failed an existing immediate `naturalWidth` check on a newly created hatchery icon. The failure was consistent with render/decode timing: all mission assets had preloaded, but a newly created image can still decode asynchronously. Added a bounded wait for the actual rendered image; kept the positive-width assertion. No production/catalog change. Diagnostics show PID20816 reached `will-quit`; no Electron/HD2 processes or test lock remained before retry. Final rerun passed. The failed run is retained and not counted as passing evidence.
- Window suite: **135 checks**, `.test-data/window-smoke-1789880000934/report.json`. Hive World and industrial-operation picker screenshots visually inspected: labels fit, all choices decode, confirmation and roll controls remain reachable. Synthetic empty equipment slots in those screenshots belong to the isolated fixture. Physical Windows DPI and audible sound remain unverified.
- Unsigned installer/ZIP at `dist/mission-regional` passed ZIP contents/checksum, embedded installer payload, notices and fuse checks. `.test-data/mission-regional-artifact-inspection/report.json`: **445 source files** compared. Installer SHA-256 `a55ab6ce3bf6ba58cebb8ddb63a05f59cfbd75d0e76d051385a5c62aa6909581`; ZIP SHA-256 `482bcd9fc93fbd8501d41d8d73bea20abef6a6d3fb1f07f9ce03d615abd76cd6`. Installer inspected, **not executed**.
- Defender scan found no threats; npm audit zero known vulnerabilities. These bounded checks are not security guarantees.
- Actual packaged EXE: **246 workflow +13 restart +7 normal/fullscreen +33 controlled-network +5 cache-restart**, `.test-data/packaged-smoke-1789880199640/report.json`.
- Packaged imports/exports: **31 write +7 restart**, plus real backend file roundtrip, `.test-data/packaged-transfer-1789880280702/report.json`. Native file-picker interaction excluded.
- Packaged renderer security: **44 checks**, `.test-data/packaged-security-1789880288584/report.json`.
- All GUI suites ran sequentially in isolated profiles, with software rendering and graceful shutdown. Only the first source run failed as documented above; all packaged suites passed on their first run.
- Post-archive inventory resolver: **20 tests**, `.test-data/mission-regional-archive-tests.log`; no runtime source changes after packaging.

## Desktop handoff and recovery

Existing `HD2 Chaos Slot Machine.lnk` now targets `scripts/start-mission-regional-review.cmd`, with the same `.test-data/mission-owner-review` profile. Preview save copied/hash-verified unchanged at `.test-data/mission-regional-save-backup-20260920-005825/state.json`. Shortcut backup: `.test-data/desktop-mission-regional-shortcut-20260920-005825/HD2 Chaos Slot Machine.lnk`.

All107 superseded Illuminate build files moved and hash-verified under `.test-data/accepted-builds/mission-illuminate`, with adjacent `mission-illuminate-move.json` recovery manifest. Historical launcher and inventory resolver preserve access to that exact archive. Active `dist` contains only `installer-shell` baseline and `mission-regional`. No additional Desktop files or permanent deletion. Do not rerun `.test-data/promote-mission-regional.ps1` or any old promotion scripts.

Personal installed baseline untouched. No native installation, publication, commit, tag or application version bump. On next preview launch, catalog changes require explicit operation review, without automatically changing historical Results or equipment.

## Next bounded work and remaining gates

Review remaining Commando/city/event identities and resolve Spore Lung/Illuminate eradication evidence where possible, then perform M5 acceptance before M6 galaxy map. Do not treat all retired missions as current choices or guess region mapping.

Public rights/signing, separate clean Windows install/uninstall, physical DPI, audible listening and long-duration stability gates remain open. No publication without owner approval.
