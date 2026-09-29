# M5 faction mission coverage — September 19, 2026

Branch `codex/mission-faction-coverage`. Bounded reviewed catalog batch, not full M5 acceptance or a public release.

## Reviewed additions

Catalog revision `review-2026-09-19-a`: **32 identities, 26 suggestion-enabled, 6 confirmation-only**.
All additions retain the **40-minute / Normal (40)** scoring family. Solo formulas and the gentler Firepower engine are unchanged.

| Mission / reference | Front | Difficulty |
| --- | --- | --- |
| [Eliminate Brood Commanders](https://helldivers.wiki.gg/wiki/Eliminate_Brood_Commanders) | Terminids | 1–2 |
| [Eliminate Chargers](https://helldivers.wiki.gg/wiki/Eliminate_Chargers) | Terminids | 3 |
| [Eliminate Bile Titans](https://helldivers.wiki.gg/wiki/Eliminate_Bile_Titans) | Terminids | 4–5 |
| [Eliminate Impaler](https://helldivers.wiki.gg/wiki/Eliminate_Impaler) | Terminids | 5 |
| [Eliminate Devastators](https://helldivers.wiki.gg/wiki/Eliminate_Devastators) | Automatons | 1–2 |
| [Eliminate Automaton Hulks](https://helldivers.wiki.gg/wiki/Eliminate_Automaton_Hulks) | Automatons | 3 |
| [Eliminate Automaton Factory Strider](https://helldivers.wiki.gg/wiki/Eliminate_Automaton_Factory_Strider) | Automatons | 4–6 |
| [Destroy Harvesters](https://helldivers.wiki.gg/wiki/Destroy_Harvesters) | Illuminate | 3 |
| [Destroy Transmission Network](https://helldivers.wiki.gg/wiki/Destroy_Transmission_Network) | Automatons | 2–3 |
| [Purge Hatcheries](https://helldivers.wiki.gg/wiki/Purge_Hatcheries) | Terminids | 2–10 |

Read the indexed mission-page texts on September 19. Direct requests to the first four mission pages returned HTTP403; sources are explicitly recorded as community-reference/indexed-text, not publisher verification or live operation data. Each mission page supplies faction, time and minimum/maximum difficulty. The [mission index](https://helldivers.wiki.gg/wiki/Objectives) supports the listed boundaries but is not treated as proof of current planet-specific availability. No briefing text or game artwork copied.

The main-objective ranges, not ordinary enemy spawn ranges or optional-objective ranges, drive suggestions. Hulks, Factory Striders, transmissions and hatcheries can also appear as side objectives; those variants are not extra weighted missions. Campaign restrictions are unspecified, not evidence that these missions appear in every defense/liberation operation. Suggestions still say to check in-game.

## Compatibility and visuals

- All22 prior mission rows and all prior source records byte-equivalent as parsed objects to the accepted Firepower package. A frozen catalog fixture extracted from that package tests this.
- Catalog revision invalidates old operation confirmations without rewriting them. Explicit review/reset required; historical Result snapshots remain valid.
- Existing six unresolved missions stay confirmation-only: Survey, Rapid Acquisition, Tunnels, Illuminate ships/gateways and Defend Evacuation Site.
- Target hunts share a new original thin-line reticle; hatcheries use an original egg-cluster symbol. Transmissions reuse the original broadcast tower. Eighteen self-contained offline SVGs in total. No official assets/tracing.
- Compact labels, full accessible names and existing card layout retained. No version bump, gameplay automation or silent network catalog updates.

## Verification

Unit run `.test-data/mission-factions-unit-final.log`: **604 passed**, plus CSP/catalog/assets validation. New test matrix covers all3 fronts × all10 difficulties ×4 campaign states per addition, deterministic random/manual equality, observed-operation override scope, old confirmation recovery and exact historical catalog parity. One initial focused unit run referenced an internal unexported CAMPAIGNS constant; corrected the test to enumerate the four documented contexts, not the production engine.

- Source `electron-smoke-1789797280910`: **199 workflow +18 restart**. All10 new missions clicked in the actual renderer, offline images decoded and shared eligibility/scoring-family assertions passed.
- Window `window-smoke-1789797352963`: **131 checks**. All18 symbols at32/48/56px and new target-hunt picker visually inspected. Narrow-window controls, keyboard operation and standalone browser responsiveness passed. Blank equipment in synthetic window fixture is intentional.
- Packaged `packaged-smoke-1789797571769`: **195 workflow +13 restart +7 normal/fullscreen +33 controlled-network +5 cache restart**.
- Packaged transfers `packaged-transfer-1789797645706`: **31 +7 restart**; security `packaged-security-1789797660911`: **44**. All GUI suites ran sequentially, isolated, software-rendered and exited normally. Native dialogs stubbed; sound WebAudio checked, not listened to.
- `mission-factions-artifact-inspection/report.json`: installer/ZIP/payload/fuses/notice checks pass, **440 source files** compared; `mission-factions-zip-verify.log` records checksums. Installer inspected, NOT executed.
- Setup: `dist/mission-factions/HD2-Chaos-Slot-Machine-Setup-local-mission-factions-win-x64.exe`; SHA256 `baa9d011bba8d20172cfa573e8b6d20317944ab5c67db733920d814356deacd9`. ZIP alongside it; no product version bump. ASAR `dec386391426ff880915e5ab29738ef57d38d0e9874b2a085f64c54359e53fca`.
- `mission-factions-defender.log`: no threats. `mission-factions-npm-audit.json`: zero known vulnerabilities. Neither is an absolute security guarantee; builds remain unsigned.

Evidence paths above are under `.test-data/` unless stated otherwise.

## Desktop handoff and recovery

The existing Desktop shortcut now targets `scripts/start-mission-factions-review.cmd`, with the same isolated owner-review profile. Raw preview save copied/hash-verified unchanged to `.test-data/mission-factions-save-backup-20260919-020123/state.json`. Shortcut backup: `.test-data/desktop-mission-factions-shortcut-20260919-020123/HD2 Chaos Slot Machine.lnk`.

Superseded Firepower runtime was not running. All107 files moved/hash-verified to `.test-data/accepted-builds/firepower`; adjacent `firepower-move.json` preserves exact recovery paths/hashes. Historical launcher/resolver preserved. Do not rerun `promote-mission-factions.ps1`. Active dist contains only installed baseline `installer-shell` and current `mission-factions`. No permanent deletion, additional Desktop folder or personal-save modification. Actual installed app remains untouched.

## Remaining roadmap

Next bounded mission review: remaining ordinary sabotage/nursery missions, then regional/Illuminate/event coverage with conservative confirmation-only handling where context cannot be established. Do not claim the catalog is complete. M5 acceptance and M6 galaxy navigation remain pending.

Public release rights/signing, separate clean Windows install/uninstall, physical DPI, listening and long-duration stability remain separate gates. No publication without owner approval.
