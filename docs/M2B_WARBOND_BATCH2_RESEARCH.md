# M2B Warbond batch 2 — Democratic Detonation and Polar Patriots

Checked September 14, 2026 against the local v1.1.4 catalog: 205 canonical items. Scope is limited to these two Warbonds. This document records research for the v1.1.5 increment; it does not change catalog facts, ownership, tests, runtime behavior or artwork.

## Result and evidence standard

All 12 announced rollable items already exist with the correct Warbond association: six per Warbond. No missing rollable equipment or erroneous Warbond membership was found in this bounded comparison. All 12 still carry `acquisition.kind: unverified` / `legacy-assignment-pending-audit`, so their acquisition source can be upgraded using the official announcements below without adding gear or changing eligibility.

Each set is three primaries, one sidearm, one throwable and one booster. No rollable stratagem is announced in either set. Armor, capes and emotes are outside this app's current rollable categories; the audit must not invent equipment entitlements from cosmetic artwork.

**Acquisition** is primary-source confirmed. Exact present-day weapon-menu **subcategories** are a separate claim: the announcements do not explicitly certify every menu label. Narrow community corroboration for three menu labels is identified separately below, not presented as official acquisition evidence.

## Democratic Detonation

Official source: [Arrowhead announcement on PlayStation Blog](https://blog.playstation.com/2024/04/04/helldivers-2-gets-an-explosive-new-warbond-on-april-11/), published April 4, 2024, subsequently updated April 23. It identifies **Democratic Detonation** as a Premium Warbond released April 11, 2024 and explicitly names the following equipment.

| Existing stable ID | Current catalog name | Slot / recommended app subgroup |
| --- | --- | --- |
| `primary:br-14-adjudicator` | BR-14 Adjudicator | Primary / `assault-rifle` |
| `primary:r-36-eruptor` | R-36 Eruptor | Primary / `explosive` — currently `marksman-rifle` |
| `primary:cb-9-exploding-crossbow` | CB-9 Exploding Crossbow | Primary / `explosive` |
| `sidearm:gp-31-grenade-pistol` | GP-31 Grenade Pistol | Sidearm / `special-sidearm` — currently `pistol` |
| `throwable:g-123-thermite` | G-123 Thermite | Throwable / `grenade` |
| `booster:expert-extraction-pilot` | Expert Extraction Pilot | Booster / `booster` |

The article appends “Rifle” to the first two names, “Grenade” to Thermite and “Booster” to the booster. These are descriptive suffixes, not evidence of additional distinct items. Retain the existing stable IDs and canonical labels; optional full-label aliases must not create new rows.

Acquisition recommendation for these six: `kind: warbond`, ID `warbond:democratic-detonation`, label/source `Democratic Detonation`, verification `primary-source`, review scope `acquisition`, source URL above.

### Category evidence and limit

- [Official patch 01.000.300](https://arrowhead.zendesk.com/hc/en-us/articles/13807959633564-PATCH-01-000-300) explicitly places Adjudicator among assault rifles. It also describes Eruptor, Crossbow and Grenade Pistol as explosive weapons, but that general description is not an explicit menu-subcategory assignment for all three.
- The current [Eruptor wiki entry](https://helldivers.wiki.gg/wiki/R-36_Eruptor) identifies **Primary / Explosives**. The proposed `marksman-rifle` → `explosive` correction matches that current community-documented menu classification and the official weapon description.
- The current [Grenade Pistol wiki entry](https://helldivers.wiki.gg/wiki/GP-31_Grenade_Pistol) identifies **Secondary / Special**. The proposed `pistol` → `special-sidearm` correction is community-corroborated menu taxonomy, not a claim that the official announcement uses the word Special.
- No damage, armor penetration, ammunition, medal price or balance effect should be copied from launch-era promotional descriptions into current game-stat claims during this source-only update.

## Polar Patriots

Official source: [PlayStation announcement](https://blog.playstation.com/2024/05/02/new-helldivers-2-warbond-brings-trap-laying-weaponry-arctic-themed-armor-and-more-may-9/), published May 2, 2024, updated May 7. It identifies **Polar Patriots** as a Premium Warbond released May 9, 2024 and explicitly names all six equipment entries below.

| Existing stable ID | Current catalog name | Slot / existing app subgroup |
| --- | --- | --- |
| `primary:ar-61-tenderizer` | AR-61 Tenderizer | Primary / `assault-rifle` |
| `primary:smg-72-pummeler` | SMG-72 Pummeler | Primary / `smg` |
| `primary:plas-101-purifier` | PLAS-101 Purifier | Primary / `energy` |
| `sidearm:p-113-verdict` | P-113 Verdict | Sidearm / `pistol` |
| `throwable:g-13-incendiary-impact` | G-13 Incendiary Impact | Throwable / `grenade` |
| `booster:motivational-shocks` | Motivational Shocks | Booster / `booster` |

Acquisition recommendation for these six: `kind: warbond`, ID `warbond:polar-patriots`, label/source `Polar Patriots`, verification `primary-source`, review scope `acquisition`, source URL above. No display-name or source-association correction is needed.

The article describes Tenderizer as an assault rifle and Pummeler as an SMG. The exact **Energy-Based** menu subtype of Purifier is [community corroboration](https://helldivers.wiki.gg/wiki/PLAS-101_Purifier); [official patch 01.001.104](https://arrowhead.zendesk.com/hc/en-us/articles/16438150997916--PATCH-01-001-104) independently discusses Purifier in its primary/plasma section and Verdict under sidearms. Keep the existing `energy` grouping, but do not claim the launch article explicitly supplies that menu label.

## Official promotional artwork candidates — not downloaded

The following URLs were extracted directly from each official source page's HTML on the audit date. **No media bytes were downloaded or locally inspected during this task.** There are therefore no new local files, measured original dimensions, hashes or image-format verification results from this pass. The HTML's 1088 × 612 featured-image attributes describe the rendered derivative, not proven original dimensions.

### Democratic Detonation featured JPEG

- [Official source page](https://blog.playstation.com/2024/04/04/helldivers-2-gets-an-explosive-new-warbond-on-april-11/).
- [Exact original featured/og:image candidate](https://blog.playstation.com/tachyon/2024/04/1a42a221dba5b31d68e95588ca9c330910f8e113-scaled.jpg).
- Both `og:image` and the `featured-asset` image identify this resource; the displayed version adds resize/crop query parameters. Prefer the linked original candidate when the implementation downloads and verifies bytes.
- Candidate local path: `assets/warbonds/official/democratic-detonation.jpg`.

### Polar Patriots featured original is PNG, not JPEG

- [Official source page](https://blog.playstation.com/2024/05/02/new-helldivers-2-warbond-brings-trap-laying-weaponry-arctic-themed-armor-and-more-may-9/).
- [Exact original featured/og:image candidate](https://blog.playstation.com/tachyon/2084/05/8fda168f4b1d7a97f0f11c0fdd6a5889cab07080.png).
- The unusual **2084** directory is present verbatim in both `og:image` and `featured-asset` HTML. Do not “correct” it to 2024 or substitute a `.jpg` suffix. Preserve its actual file format if downloaded.
- Candidate local path: `assets/warbonds/official/polar-patriots.png`.

If a JPEG specifically is required, the official article additionally embeds and links these four original scene candidates. They are official-page-linked JPEG resources, **not established as the same featured image**, and require visual inspection before choosing one:

1. [Scene candidate 1](https://live.staticflickr.com/65535/53688760034_1eb5a2f48d_h.jpg)
2. [Scene candidate 2](https://live.staticflickr.com/65535/53688856345_b63bb81cc2_h.jpg)
3. [Scene candidate 3](https://live.staticflickr.com/65535/53688855980_d1e55b053f_h.jpg)
4. [Scene candidate 4](https://live.staticflickr.com/65535/53688624683_c252f851e3_h.jpg)

Use **official promotional artwork**, not “exact in-game Warbond cover,” as the eventual provenance/display description unless visual evidence supports a more specific label. Official publication does not grant the application's code license to these images. Retain original marks, record source page and exact URL, validate file signatures/dimensions, calculate SHA-256 and complete the existing public-distribution rights review separately.

## Handoff boundaries

- This pass supports reviewing 12 currently pending acquisitions; it neither changes the 205-item count nor grants player ownership.
- Eruptor and Grenade Pistol menu corrections need the stated community-source qualification. All their acquisition-source claims remain official.
- No claim is made about current prices, account entitlements, Superstore rotation, live game balances or the remainder of the catalog.
- Cutting Edge is being researched separately by the parent task and is intentionally excluded here.
