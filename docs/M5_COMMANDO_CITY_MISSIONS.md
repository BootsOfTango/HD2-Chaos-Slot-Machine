# M5 Commando and city missions — September 20, 2026

Branch `codex/commando-city-missions`. Revision `review-2026-09-20-b`: **60 identities /33 suggested /27 confirmation-only**. Partial reviewed catalog, not exact live operation availability.

## Reviewed additions

| Mission / community source | Front | Difficulty | Minutes | Treatment |
| --- | --- | --- | --- | --- |
|[Commando: Acquire Evidence](https://helldivers.wiki.gg/wiki/Commando%3A_Acquire_Evidence)|Automatons|1–10|40|Player-confirmed|
|[Commando: Extract Intel](https://helldivers.wiki.gg/wiki/Commando%3A_Extract_Intel)|Automatons|1–10|40|Player-confirmed|
|[Commando: Secure Black Box](https://helldivers.wiki.gg/wiki/Commando%3A_Secure_Black_Box)|Automatons|1–10|40|Player-confirmed|
|[Cleanse Infested District](https://helldivers.wiki.gg/wiki/Cleanse_Infested_District)|Terminids|4–10|40|Player-confirmed|
|[Restore Air Quality](https://helldivers.wiki.gg/wiki/Restore_Air_Quality)|Terminids|1–10|40|Player-confirmed|
|[Confiscate Assets](https://helldivers.wiki.gg/wiki/Confiscate_Assets)|Automatons|1–10|40|Suggested|

Indexed community text reviewed September20; records use community-reference/indexed-text, not publisher verification. No briefing text or official artwork copied.

All three Commando mission change histories say they entered the regular roster, but the [Commando overview](https://helldivers.wiki.gg/wiki/Commando_Missions) describes special liberation-only operations. Availability is therefore unresolved: all three remain confirmation-only, without inventing a global campaign restriction from conflicting sources. Their40-minute duration and1–10 difficulty are independently stated on each page. Camera/keycard/black-box subobjectives are not additional missions.

The two Terminid missions explicitly require Mega Cities. Faction, planet name, biome text, arbitrary event flags and Major Order wording cannot establish that context. Confiscate Assets explicitly entered the regular Automaton roster; it is a compatible suggestion, not a guarantee. Platinum and battery tasks are subobjectives, not separate rolls.

Commando selection shows a brief **check gear & stratagem limits in-game** reminder. It disappears for other missions/reset/unconfirmed planets. It does not silently replace equipment, prohibit boosters, or change reroll allowances. A camera icon is an original project vector, not extracted/traced game artwork; other additions reuse existing symbols,24 total.

## Preservation

All54 previous records/sources remain exact against `test/fixtures/mission-catalog-2026-09-20-a.json`. Catalog revision asks the player to review their prior operation without discarding the saved checklist. Finalized Results, entered numbers, scoring and version metadata remain unchanged. All six additions retain the existing Normal (40) compatibility category; Commando-specific score normalization is not introduced.

## Verification

- **648 units**, CSP/catalog/assets pass: `.test-data/mission-city-unit.log`.
- New matrix tests cover3 fronts×10 difficulties×4 campaign cases, random/manual equality, confirmed provenance, scoped overrides, no keyword inference, historical snapshots and prior catalog parity.
- Advice tests reject custom/hostile lookalike IDs; original SVG tests reject scripts/external references and check established thin-line styling.
- Source renderer: **276 workflow +18 restart**, `.test-data/electron-smoke-1789880704071/report.json`. Actual checklist/card actions verify all additions, contextual advice/reset and unchanged rolled gear/reroll allowances.
- Window suite: **141 checks**, `.test-data/window-smoke-1789880763907/report.json`. Commando and city picker screenshots and all24 symbols at32/48/56px visually inspected; labels, gear reminder and actions remain reachable. Empty equipment slots in these screenshots are intentional isolated fixtures. Physical Windows DPI and audible listening not certified.
- Unsigned installer/ZIP at `dist/mission-city` passed ZIP integrity/checksum, embedded installer payload, notices and fuse checks; **446 source files** compared by `.test-data/mission-city-artifact-inspection/report.json`. Installer SHA-256 `252f2cfba5cc62b601d05963b3233877dec0d9c74abcd18530884517d6e109a9`; ZIP SHA-256 `cfd4780b4107a665fd8713895eaedc76dabac460cf705dce217684bf02813630`. Native installer inspected, **not executed**.
- Defender found no threats; npm audit zero known vulnerabilities. Bounded checks, not guarantees.
- Actual packaged EXE: **272 workflow +13 restart +7 normal/fullscreen +33 controlled-network +5 cache-restart**, `.test-data/packaged-smoke-1789880979017/report.json`.
- Packaged transfers: **31 write +7 restart**, plus real storage-backend file roundtrip, `.test-data/packaged-transfer-1789881048361/report.json`; native file-picker interaction excluded.
- Packaged renderer security: **44 checks**, `.test-data/packaged-security-1789881058357/report.json`.
- All GUI suites passed first run, sequentially, in isolated profiles using software rendering and graceful shutdown. No forced termination, graphics/Windows/security changes or personal-profile tests.
- Post-archive resolver: **21 tests**, `.test-data/mission-city-archive-tests.log`. Maintenance changes after packaging do not alter runtime source.

## Desktop handoff and recovery

Existing `HD2 Chaos Slot Machine.lnk` now targets `scripts/start-mission-city-review.cmd`, with the same `.test-data/mission-owner-review` profile. Raw review save backed up/hash-verified unchanged at `.test-data/mission-city-save-backup-20260920-011111/state.json`; shortcut backup `.test-data/desktop-mission-city-shortcut-20260920-011111/HD2 Chaos Slot Machine.lnk`.

All107 superseded regional build files moved and hash-verified under `.test-data/accepted-builds/mission-regional`, with adjacent `mission-regional-move.json` recovery manifest. Historical launcher and inventory resolver retain that exact archive. Active `dist`: `installer-shell` baseline and `mission-city`. No duplicate Desktop files or permanent deletion. Do not rerun `.test-data/promote-mission-city.ps1` or earlier promotion scripts.

Personal installed baseline unchanged; no native installation, commit, tag, public release or version bump. Catalog revision requires operation review on the next preview launch; historical Results, equipment and entered stats are preserved.

## Next

M5 acceptance/gap triage, then M6 galaxy-map foundation. Keep Destroy Spore Lung and Eradicate Illuminate Forces duration/context evidence gaps explicit; do not guess or claim full coverage. Unreviewed event-only content such as Activate TCS+ Station and retired Gloom missions must not be silently enabled. Custom observed missions remain supported. Catalog gaps can stay documented while the map uses the same existing eligibility engine.

Public artwork rights/signing, separate clean Windows installation/uninstallation, physical DPI, audible listening and long-duration stability gates remain open. No publication without owner approval.
