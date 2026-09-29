# M2B focused stratagem/source audit

Checked September 14, 2026 against the local M2A catalog. Scope: Chemical Agents, Urban Legends, Righteous Revenants/W.A.S.P., and the existing EMS aliases. No catalog rows, stable IDs, ownership, historical results, or runtime mappings were modified by this research task.

## Chemical Agents — four rollable items

Arrowhead's announcement identifies two stratagems, the Gas throwable and Stim Pistol; it expressly explains why this Warbond introduced stratagem variants instead of primary weapons. No booster is announced. Release: September 19, 2024. [Official announcement](https://blog.playstation.com/2024/09/12/helldivers-2-the-chemical-agents-warbond-launches-sept-19/)

| Existing stable ID | Existing name | Verified association / display-name note |
|---|---|---|
| `stratagem:sterilizer` | Sterilizer | Chemical Agents; official full name TX-41 Sterilizer; support weapon. |
| `stratagem:ax-tx-13-dog-breath` | AX/TX-13 Dog Breath | Chemical Agents; official announcement AX/TX-13 “Guard Dog” Dog Breath; backpack stratagem. Keep existing `guard dog breath` alias. |
| `throwable:g-4-gas` | G-4 Gas | Chemical Agents; throwable. |
| `sidearm:p-11-stim-pistol` | P-11 Stim Pistol | Chemical Agents; sidearm. |

The current first two entries are incorrectly left in `Unassigned / Custom`; the latter two already have the right legacy Warbond label but need verified source metadata. Orbital Gas Strike is mentioned only as another gas source compatible with the armor passive, **not as a Chemical Agents reward**.

## Urban Legends — five rollable items

The official announcement, December 13, 2024, lists the following equipment. The three stratagems and Stun Lance need association corrections; Armed Resupply Pods is already labeled Urban Legends. [Official announcement](https://blog.playstation.com/2024/12/13/helldivers-2-urban-legends-warbond-drops-today/)

| Existing stable ID | Existing name | Verified association / full name |
|---|---|---|
| `stratagem:directional-shield` | Directional Shield | Urban Legends; SH-51 Directional Shield. |
| `stratagem:anti-tank-emplacement` | Anti-Tank Emplacement | Urban Legends; E/AT-12 Anti-Tank Emplacement. |
| `stratagem:flame-sentry` | Flame Sentry | Urban Legends; A/FLAM-40 Flame Sentry. |
| `booster:armed-resupply-pods` | Armed Resupply Pods | Urban Legends; booster. |
| `sidearm:cqc-2-stun-lance` | CQC-2 Stun Lance | Urban Legends; erroneous catalog identifier in display name, see below. |

No primary weapon or throwable is listed. The FRV pattern is a cosmetic; the FRV vehicle itself must not be assigned to the Warbond because that pattern exists.

### Stun Lance naming discrepancy

The launch blog says `SQC-19 Stun Lance`, but later official patch notes identify **CQC-19 Stun Lance**, separately from **CQC-2 Saber**. The app's existing `CQC-2 Stun Lance` image mapping already resolves to `CQC-19 Stun Lance` on the wiki. Therefore its stable ID can remain unchanged while its display name is corrected and its erroneous prior display spelling preserved as a compatibility alias. Do not conflate this item with the Saber. [Official later naming](https://arrowhead.zendesk.com/hc/en-us/articles/25259642976156--Into-the-Unjust-6-0-1), [current wiki procurement corroboration](https://helldivers.wiki.gg/wiki/CQC-19_Stun_Lance)

## Righteous Revenants — three primaries, not the W.A.S.P.

The December 2025 official Killzone Legendary Warbond reissue lists three weapons; the current wiki calls this Warbond **Righteous Revenants**. The three current associations are correct. Prior Superstore purchases/free gifts are historical alternative acquisition routes and must not be erased or interpreted as proof of present ownership. Release: December 18, 2025. [Official reissue announcement](https://blog.playstation.com/2025/12/11/the-helldivers-2-x-killzone-items-return-as-a-legendary-warbond-dec-18/), [current Warbond name/content corroboration](https://helldivers.wiki.gg/wiki/Righteous_Revenants_Legendary_Warbond)

| Existing stable ID | Name | Association |
|---|---|---|
| `primary:sta-52-assault-rifle` | StA-52 Assault Rifle | Righteous Revenants / Helldivers 2 x Killzone Legendary Warbond. |
| `primary:sta-11-smg` | StA-11 SMG | Same; primary submachine gun, not assault rifle. |
| `primary:plas-39-accelerator-rifle` | PLAS-39 Accelerator Rifle | Same; primary energy weapon. |

The Warbond lists no booster, sidearm, throwable or rollable stratagem. The W.A.S.P.'s involvement in the **original Killzone crossover** does not make it part of this Warbond.

## W.A.S.P. acquisition and duplicate identity

PlayStation's official evolution guide explicitly places **StA-X3 W.A.S.P. Launcher** among support weapons unlocked through requisition. The wiki specifies the Patriotic Administration Center, level 20 and 12,000 Requisition Slips. Classify current acquisition as ship/requisition, not paid Warbond or current limited campaign reward. Ownership remains player-managed, not assumed merely because it is requisition gear. [Official acquisition category](https://www.playstation.com/en-us/games/helldivers-2/helldivers-2-update-summary/), [community exact procurement details](https://helldivers.wiki.gg/wiki/StA-X3_W.A.S.P._Launcher)

The catalog has these two rows:

| ID | Name | Existing image metadata |
|---|---|---|
| `stratagem:sta-x3-w-a-s-p-launcher` | StA-X3 W.A.S.P. Launcher | Canonical wiki page and W.A.S.P. icon. |
| `stratagem:wasp` | Wasp | Wiki page `WASP` redirects to `StA-X3 W.A.S.P. Launcher`; same exact icon URL. |

**Finding:** these app entries represent one weapon, not two distinct items. This conclusion combines the canonical source identity with the app's own shared source image. **No merge performed.** A future merge must keep both old IDs resolvable, retain contradictory ownership rows recoverably, avoid OR-enabling them, and preserve original result labels/scores. Merely adding `Wasp` as a name alias while leaving two independent rollable canonical rows would not remove its double weighting.

## EMS identity and acquisition

| Existing stable ID | Existing name | Finding |
|---|---|---|
| `stratagem:orbital-ems-strike` | Orbital EMS Strike | Canonical orbital stratagem; ship/Bridge requisition acquisition. |
| `stratagem:ems-strike` | EMS Strike | Existing app metadata points to the same canonical wiki page and exact icon URL; duplicate shortened name, not a support weapon. |
| `stratagem:ems-mortar-sentry` | EMS Mortar Sentry | **Distinct** defensive sentry; not an alias of either strike row. |

The canonical strike's current wiki entry supplies Bridge, level 5 and 6,000 Requisition Slips; those exact costs are community-correlated, not independently confirmed from an official procurement announcement in this bounded audit. [Canonical strike and procurement](https://helldivers.wiki.gg/wiki/Orbital_EMS_Strike), [distinct sentry](https://helldivers.wiki.gg/wiki/EMS_Mortar_Sentry)

**No merge performed.** Queue the same ID/ownership/history migration safeguards as W.A.S.P. The `support` subgroup on the shortened EMS row is inconsistent with its canonical orbital identity.

## Official promotional card images

Three unmodified official announcement-featured JPEGs are bundled. These are official **promotional scenes used as card covers**, not claims of exact in-game Acquisitions cover screenshots. All three were viewed locally before handoff; source pages identify the matching Warbond.

| Warbond | Local path | Visual inspection |
|---|---|---|
| Freedom's Flame | `assets/warbonds/official/freedoms-flame.jpg` | Two Helldivers with fire weapons in rocky terrain; 2048 × 1152. |
| Chemical Agents | `assets/warbonds/official/chemical-agents.jpg` | Two gas-equipped Helldivers in green gas; retains Captured on PS5 mark; 2048 × 1152. |
| Urban Legends | `assets/warbonds/official/urban-legends.jpg` | Crested-helmet Helldiver with yellow shield; retains Captured on PS5 mark; 2560 × 1440. |

Exact CDN URLs, hashes, dates and attribution are stored in `assets/warbonds/official/provenance.json` and `ATTRIBUTION.md`. No AI, local cropping, recoloring or graphic edits were used. Original third-party rights apply separately from this app's code license.

### Steeled Veterans image candidate — not downloaded

The official [PlayStation evolution guide](https://www.playstation.com/en-us/games/helldivers-2/helldivers-2-update-summary/) exposes the official Steeled Veterans trailer thumbnail at `https://i.ytimg.com/vi_webp/U2WCGJYTX_4/maxresdefault.webp`, with matching Steeled Veterans alt text. This is an official trailer-thumbnail candidate, not yet a locally inspected Acquisitions cover. No Steeled Veterans artwork was downloaded in this bounded asset batch.

## Remaining boundaries

- This is not a complete 202-item audit. Other unverified acquisition rows and all remaining covers stay queued.
- Do not infer that Chemical Agents/Freedom's Flame cosmetic vehicle patterns grant ownership of their vehicles.
- Do not grant gear ownership during source corrections, or discard legacy labels/IDs on rename.
- WASP/EMS duplicate consolidation needs an explicitly tested follow-up and is not included in the present association-only recommendations.
