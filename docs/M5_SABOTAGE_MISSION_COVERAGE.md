# M5 sabotage and nursery missions — September 19, 2026

Branch `codex/mission-sabotage-coverage`. Bounded local batch; catalog revision `review-2026-09-19-b` remains partial: **36 identities,29 suggestion-enabled,7 confirmation-only**.

## Evidence and decisions

| Mission / reference | Front | Difficulty | Treatment |
| --- | --- | --- | --- |
| [Nuke Nursery](https://helldivers.wiki.gg/wiki/Nuke_Nursery) | Terminids |4–10| Suggested |
| [Sabotage Air Base](https://helldivers.wiki.gg/wiki/Sabotage_Air_Base) | Automatons |3–10| Suggested |
| [Neutralize Ground-to-Orbit Defenses](https://helldivers.wiki.gg/wiki/Neutralize_Ground-to-Orbit_Defenses) | Automatons |4–10| Suggested |
| [Sabotage Supply Bases](https://helldivers.wiki.gg/wiki/Sabotage_Supply_Bases) | Automatons |1–10 descriptive metadata| Player-confirmed only |

All four references list40-minute limits; existing Normal (40) scoring family retained. Direct requests returned403; indexed page texts were reviewed September19 and catalog sources explicitly say community-reference/indexed-text. These are not official publisher verification or a live player's operation list. No mission briefing text copied.

Air Base's changing dropship/tower counts and city/Megafactory layouts remain one identity; nursery chambers/city/cave variants likewise do not add extra weighting. No additional campaign constraint is established: suggestions still require checking the actual operation.

Supply Bases remains contradictory: its body limits normal operations to difficulty5 and describes high-level city exceptions, but August12 change history reports higher difficulty availability outside city/factory operations. The broad1–10 infobox is retained as descriptive metadata only. No guessed region/city/Major Order rule is added. Player confirmation permits an observed mission, with ordinary planet/difficulty/event scope rules; clearing the checklist removes it from the roll pool again. Stockpile/fuel side objectives are not new standalone rows.

## Preservation

All32 prior mission rows and their sources compare exactly against frozen fixture `test/fixtures/mission-catalog-2026-09-19-a.json`. New catalog revision requires explicit review of an old operation shortlist, preserves the old checklist, and does not rewrite historical Results. No save-schema, scoring, application version, ownership, fullscreen or overall-layout change.

Three original locally authored SVGs follow the accepted thin-line system: nursery drill, airbase tower/aircraft, orbital cannon. Supply Bases reuses the existing crate. Twenty-one offline symbols total; no copied/traced publisher or wiki artwork. See assets/missions/ORIGIN.md.

## Verification

Initial `.test-data/mission-sabotage-unit.log`: **611 tests pass**, CSP/catalog/assets pass,247 local item images,zero missing and7 pre-existing placeholders. New matrix covers3 fronts×10 difficulties×4 campaign states; random/manual equivalence, confirmation-only restrictions/clearing/scope, historical parity and old-catalog recovery.

- Final unit log `mission-sabotage-unit-final.log`:611 pass, CSP/catalog/assets checks pass.
- Source `electron-smoke-1789801761598`: **211 workflow +18 restart**. All three suggested additions selected offline; Supply Bases absent without confirmation, selectable after confirmation, absent again after explicit reset.
- Window `window-smoke-1789801831529`: **132 checks**. All21 icons at32/48/56px and sabotage picker visually inspected. Empty equipment slots in the synthetic fixture are intentional; actual workflow checks use complete loadouts. Window sizing/keyboard/browser responsiveness passed, not physical Windows DPI.
- Packaged `packaged-smoke-1789802021241`: **207 workflow +13 restart +7 normal/fullscreen +33 network +5 cache restart**.
- Transfers `packaged-transfer-1789802088754`: **31+7 restart**. Security `packaged-security-1789802105644`: **44**. GUI suites sequential, exclusive, software-rendered, isolated, graceful shutdown. Native file dialogs stubbed, WebAudio checked without listening.
- `mission-sabotage-artifact-inspection/report.json`:443 source files compared; ZIP, NSIS embedded payload, notices and fuses checked. Installer NOT executed.
- Installer `dist/mission-sabotage/HD2-Chaos-Slot-Machine-Setup-local-mission-sabotage-win-x64.exe`, SHA256 `d7154b81be88a4443b626f7395a801a207f42afe0b8132282f497fd43e58fa6c`. Portable ZIP/checksum alongside. ASAR `05d081e1ba588415926347f3609dcc62e36a0650c04b38a9a0b28b4555e334f8`.
- Defender found no threats; npm audit zero known vulnerabilities (`mission-sabotage-defender.log`, `mission-sabotage-npm-audit.json`). Bounded evidence, not absolute security guarantees. Build unsigned.

Evidence paths are under `.test-data/` unless otherwise stated.

## Desktop handoff

Existing Desktop shortcut updated to `scripts/start-mission-sabotage-review.cmd`, same isolated owner-review profile. Raw preview save copied/hash-verified unchanged to `.test-data/mission-sabotage-save-backup-20260919-031523/state.json`. Shortcut backup under `.test-data/desktop-mission-sabotage-shortcut-20260919-031523/`.

Previous faction preview was not running. All107 files moved/hash-verified to `.test-data/accepted-builds/mission-factions`; adjacent `mission-factions-move.json` records recovery paths/hashes. Old launcher/resolver retained. Active outputs contain only baseline `installer-shell` and new `mission-sabotage`. No new Desktop folder, permanent deletion or personal-installation/profile change. Do not rerun `promote-mission-sabotage.ps1`.

## Next

Review remaining Illuminate and regional/event mission gaps, preserving confirmation-only treatment when the API cannot establish region/operation context. Then M5 acceptance and M6 map. This batch does not establish complete mission coverage.

Public-release artwork/rights/signing, separate clean Windows install/uninstall, physical DPI, listening and long-duration stability remain open. No GitHub publication without owner approval.
