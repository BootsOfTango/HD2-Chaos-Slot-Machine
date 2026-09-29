# Support-weapon acquisition audit — September 15, 2026

Scope: the sixteen remaining unreviewed existing catalog entries. Each individual Helldivers Wiki page was retrieved through the public MediaWiki parse API with redirects; original JSON retained locally in `.test-data/support-weapon-research`. The review manifest links every canonical page. These are community sources, not official developer verification. Costs/levels below are dated research evidence, not new app rules or guaranteed future values.

| Item | Evidence: unlock level / Requisition cost |
| --- | --- |
| AC-8 Autocannon | 10 / 7,000 |
| APW-1 Anti-Materiel Rifle | 1 / 5,000 |
| ARC-3 Arc Thrower | 15 / 7,000 |
| EAT-17 Expendable Anti-Tank | 3 / 3,000 |
| FAF-14 Spear | 20 / 9,000 |
| FLAM-40 Flamethrower | 10 / 6,000 |
| GL-21 Grenade Launcher | 5 / 6,000 |
| GR-8 Recoilless Rifle | 5 / 6,000 |
| LAS-98 Laser Cannon | 5 / 4,000 |
| LAS-99 Quasar Cannon | 18 / 7,500 |
| M-105 Stalwart | 1 / 3,500 |
| MG-206 Heavy Machine Gun | 12 / 6,000 |
| MG-43 Machine Gun | 1 / free, explicitly unlocked by default |
| MLS-4X Commando | 15 / 8,000 |
| RL-77 Airburst Rocket Launcher | 15 / 8,000 |
| RS-422 Railgun | 20 / 10,000 |

The [MG-43 procurement section](https://helldivers.wiki.gg/wiki/MG-43_Machine_Gun) explicitly identifies default unlock. APW-1 and Stalwart still require purchase despite level-one availability. Commando and Airburst had historical Major Order introductions, but their current procurement infoboxes specify Requisition purchases; do not reclassify them as participant-only rewards. Supply FRV and Eagle Gas Airstrike remain separately audited campaign rewards. This review changes facts only, never player ownership/default eligibility.

## Dated coverage check

The [Support Weapon Stratagems category](https://helldivers.wiki.gg/wiki/Category:Support_Weapon_Stratagems) API returned 33 titles and no continuation. Every title resolves uniquely to an existing stable item name/alias: these sixteen plus seventeen prior Warbond acquisitions. Frozen list in `test/fixtures/support-weapon-category.json`, original response in the research evidence folder. C4 Pack is included in that Wiki category but remains the app's previously audited backpack subgroup; a category overlap is not an instruction to change its role. No missing or duplicate selectable entry was found against this dated list.

After this pass, all **205 existing catalog acquisitions** have reviewed sources (109 primary, 96 community). This does not establish full game-wide completeness, original artwork accuracy/licensing or completion of M2. Next gate: wider current category/Warbond inventory comparison and outstanding artwork audit, retaining honest source-tier distinctions.

## Compatibility boundary

Independent pre-edit Backpack / Vehicle ASAR SHA-256 `6a432f306c663da45511c964e8df03004b2aa6c42325487adb2788ae9af54587`. Protect 189 unrelated records, all 205 IDs/names/aliases/subgroups/defaults/art paths and all 23 Warbond groups. No new identities, balance changes, scoring changes or ownership grants. Existing disabled starter gear remains disabled. Historical fixture digests are projected only through the explicitly reviewable acquisition/source fields.
