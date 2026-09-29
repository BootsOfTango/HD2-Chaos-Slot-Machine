# M2B Warbond batch 3 — Control Group, Servants of Freedom, Borderline Justice

Checked September 14, 2026 against the local v1.1.5 catalog: 205 canonical items. Research only; no catalog, ownership, runtime, tests or media bytes changed by this pass.

## Result

The three complete rollable sets contain **14 existing items: 5 + 4 + 5**. Their acquisition is supported by the official announcements linked below. VG-70 Variable is already reviewed; the other **13** acquisitions are pending. No missing rollable row was found. Five existing stratagems need their `Unassigned / Custom` acquisition corrected. Three backpacks need the app's `backpack` subgroup, and Dynamite should use `grenade` rather than `throwing-weapon`. One booster display name is incorrect.

This would retain 205 items and produce **56 primary-source / 12 community-source / 137 pending** if exactly those 13 acquisitions are reviewed. Evidence tiers concern acquisition; exact current menu taxonomy is qualified separately below. Buying a Warbond does not prove an individual player's unlocks, and this audit must not change ownership/default eligibility.

## Control Group — five rollable items

[Official Arrowhead announcement on PlayStation Blog](https://blog.playstation.com/2025/07/10/helldivers-2-control-group-warbond-launches-july-17/), published July 10, 2025; release July 17, 2025. Byline: **Katherine Baskin**, Social Media and Community Manager, Arrowhead Game Studios.

| Existing stable ID | Official equipment name | Slot / app subgroup | Required adjustment |
| --- | --- | --- | --- |
| `primary:vg-70-variable` | VG-70 Variable | Primary / `special-primary` | Already reviewed; preserve earlier fact |
| `throwable:g-31-arc` | G-31 Arc | Throwable / `grenade` | Review acquisition |
| `stratagem:epoch` | PLAS-45 Epoch | Stratagem / `support` | Assign Control Group; add full-designation alias |
| `stratagem:laser-sentry` | A/LAS-98 Laser Sentry | Stratagem / `defensive` | Assign Control Group; add full-designation alias |
| `stratagem:warp-pack` | LIFT-182 Warp Pack | Stratagem / `backpack` | Assign Control Group; change `support`; add alias |

The official text explicitly identifies the primary, grenade, support weapon, sentry and wearable teleport stratagem. It announces no sidearm or booster. Use acquisition `kind: warbond`, ID `warbond:control-group`, source/label `Control Group`, verification `primary-source`, scope `acquisition`. Preserve existing short stratagem display names and stable IDs; the full official designations are aliases, not additional items.

## Servants of Freedom — four rollable items

[Official Arrowhead announcement on PlayStation Blog](https://blog.playstation.com/2025/02/04/helldivers-2-servants-of-freedom-warbond-launches-february-6/), published February 4, 2025; release February 6, 2025. Byline: **Katherine Baskin**, Social Media and Community Manager, Arrowhead Game Studios.

| Existing stable ID | Official equipment name | Slot / app subgroup | Required adjustment |
| --- | --- | --- | --- |
| `primary:las-17-double-edge-sickle` | LAS-17 Double-Edge Sickle | Primary / `energy` | Review acquisition |
| `sidearm:gp-20-ultimatum` | GP-20 Ultimatum | Sidearm / `special-sidearm` | Review acquisition |
| `throwable:g-50-seeker` | G-50 Seeker | Throwable / `grenade` | Review acquisition |
| `stratagem:portable-hellbomb` | B-100 Portable Hellbomb | Stratagem / `backpack` | Assign Servants of Freedom; change `support`; add alias |

The official text explicitly describes a backpack, secondary-slot pistol and throwable drone. No booster is announced. Use `warbond:servants-of-freedom`, source/label `Servants of Freedom`, primary-source acquisition evidence. Keep the current Portable Hellbomb ID/display label with its complete designation as an alias. Armor, capes, emotes and titles are outside the app's rollable categories.

## Borderline Justice — five rollable items

[Official Arrowhead announcement on PlayStation Blog](https://blog.playstation.com/2025/03/18/helldivers-2-borderline-justice-warbond-launches-march-20/), published March 18, 2025; release March 20, 2025. Byline: **Katherine Baskin**, Social Media and Community Manager, Arrowhead Game Studios.

| Existing stable ID | Official equipment name | Slot / app subgroup | Required adjustment |
| --- | --- | --- | --- |
| `primary:r-6-deadeye` | R-6 Deadeye | Primary / `marksman-rifle` | Review acquisition |
| `sidearm:las-58-talon` | LAS-58 Talon | Sidearm / `special-sidearm` | Review acquisition |
| `throwable:ted-63-dynamite` | TED-63 Dynamite | Throwable / `grenade` | Review acquisition; change `throwing-weapon` |
| `stratagem:hover-pack` | LIFT-860 Hover Pack | Stratagem / `backpack` | Assign Borderline Justice; change `support`; add alias |
| `booster:sample-extractor` | **Sample Extricator** | Booster / `booster` | Fix display name; retain ID and old-name alias |

Use `warbond:borderline-justice`, source/label `Borderline Justice`, primary-source acquisition evidence. The article explicitly names **Sample Extricator**; the current [community item page](https://helldivers.wiki.gg/wiki/Sample_Extricator) agrees. No evidence was found that “Sample Extractor” is an official rename. Preserve `booster:sample-extractor` and add `Sample Extractor` as a compatibility alias rather than creating another booster. Do not rewrite saved Results/history names or scores.

## Taxonomy qualifications and evidence gaps

- The existing `grenade` and `throwing-weapon` app groups are not exact mirrors of every in-game Standard/Special throwable section. [TED-63's item entry](https://helldivers.wiki.gg/wiki/TED-63_Dynamite) explicitly identifies **Standard Throwable**. Its current `throwing-weapon` placement is unsuitable; `grenade` is the app-equivalent correction. This exact menu statement is **community corroboration**, not a phrase supplied by the official announcement.
- [Warp Pack](https://helldivers.wiki.gg/wiki/LIFT-182_Warp_Pack) and [Hover Pack](https://helldivers.wiki.gg/wiki/LIFT-860_Hover_Pack) explicitly have Backpack traits in the community item entries. Official articles describe their wearable operation; Portable Hellbomb's article explicitly says backpack. Correct these three from general `support` to `backpack` without claiming a verbatim official menu taxonomy for all three.
- Retain [GP-20 Ultimatum](https://helldivers.wiki.gg/wiki/GP-20_Ultimatum) and [LAS-58 Talon](https://helldivers.wiki.gg/wiki/LAS-58_Talon) in `special-sidearm`: their item pages explicitly identify Secondary / Special. The official articles establish the secondary slots, not that exact Special menu label.
- Retain Deadeye as a marksman rifle: its [individual item page](https://helldivers.wiki.gg/wiki/Deadeye) explicitly agrees with the official hunting-rifle description. The current [Borderline Justice overview table](https://helldivers.wiki.gg/wiki/Borderline_Justice_Premium_Warbond) incorrectly labels it Energy-Based; do **not** copy that apparent table error. Its full contents table corroborates the five-item membership, not every taxonomy field.
- [Control Group's table](https://helldivers.wiki.gg/wiki/Control_Group_Premium_Warbond) and [Servants of Freedom's table](https://helldivers.wiki.gg/wiki/Servants_of_Freedom_Premium_Warbond) corroborate the five/four rollable counts. Some direct wiki opens returned HTTP 403; the research used the web search tool's indexed page contents where that occurred. These are community evidence, never official provenance.
- No current balance values, unlock prices, live entitlement checks or blanket completeness claim for the remaining catalog are made.

## Separate Superstore exclusions

The [community Superstore table](https://helldivers.wiki.gg/wiki/Superstore) separates these themed shop sets from their Warbonds. Specific exclusions:

- **Servants of Freedom:** `sidearm:cqc-5-combat-hatchet` remains Superstore, not part of the four-item Warbond set. Its [item procurement section](https://helldivers.wiki.gg/wiki/CQC-5_Combat_Hatchet) explicitly identifies the separate shop purchase. Also excluded: IE-57 Hell-Bent armor/helmet and Vision of Freedom cape/card.
- **Control Group:** AD-11 Livewire armor/helmet, Enthusiastic Mirth emote, Schema Laid Bare cape/card. No extra rollable weapon, stratagem or booster appears in that themed shop set.
- **Borderline Justice:** GS-11 Democracy's Deputy armor/helmet, Draw! emote, Veil of the Valorous Vagabond cape/card. No extra rollable weapon, stratagem or booster appears in that themed shop set.

Do not convert themed artwork or shop-page grouping into Warbond entitlements. Retain the Hatchet's earlier community-source review untouched. No shop pricing or availability promise is needed.

## Official promotional artwork candidates — no downloads in this pass

Exact URLs extracted from each official page's `og:image` HTML on September 14, 2026. Each also matches the resource base of that page's `featured-asset` image; rendered derivatives add resize/crop parameters. All three bylines above were independently checked in the HTML. The 1088 × 612 featured HTML attributes are rendered sizes, **not measured original dimensions**.

| Warbond | Original featured/OG candidate | Candidate local path |
| --- | --- | --- |
| Control Group | [Official JPG candidate](https://blog.playstation.com/tachyon/2025/07/8673000f2bdaa5162280c7ddb6019d060d48dd68-scaled.jpg) | `assets/warbonds/official/control-group.jpg` |
| Servants of Freedom | [Official JPG candidate](https://blog.playstation.com/tachyon/2025/02/7b1da375328c6d823392bf48ad6d9c47bff33ead-scaled.jpg) | `assets/warbonds/official/servants-of-freedom.jpg` |
| Borderline Justice | [Official JPG candidate](https://blog.playstation.com/tachyon/2025/03/8c47042d2c960242b1bfb9c012f35342c154a8d6.jpg) | `assets/warbonds/official/borderline-justice.jpg` |

Implementation must download and verify actual signatures, dimensions, SHA-256 and visual suitability before adding provenance. This research has not inspected image bytes. Label the assets **official promotional artwork**, not proven exact in-game covers. Publication on an official page does not make artwork subject to this repository's code license; public-distribution rights review remains separate.
