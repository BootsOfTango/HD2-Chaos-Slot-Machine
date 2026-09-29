# Orbital / Eagle acquisition audit — September 15, 2026

Scope: eighteen previously unreviewed existing stratagems only. No ID, name, alias, subgroup, artwork, gameplay values, eligibility defaults or Warbond membership additions. Source manifest: `assets/catalog-reviews/2026-09-15-orbital-eagle.json`.

## Evidence and limits

The community-maintained [Helldivers Wiki](https://helldivers.wiki.gg/wiki/Stratagems) item pages were read through their public MediaWiki API (`action=parse`, `prop=wikitext`, redirects enabled). Ordinary HTML returned HTTP 403; the public API served the content without authentication or any protection changes. Each correction links its own canonical item page. Original API responses are retained locally under `.test-data/orbital-eagle-research/`. This is **community-source acquisition evidence**, not primary Arrowhead confirmation or a current in-game account entitlement check.

- Seventeen item infoboxes specify a Requisition Slips unlock cost: 120mm/380mm HE, Airburst, Gas, Gatling, Laser, Napalm, Railcannon, Smoke and Walking orbital strikes; Eagle 110mm Rocket Pods, 500kg Bomb, Airstrike, Cluster Bomb, Napalm Airstrike, Smoke Strike and Strafing Run.
- [Orbital Precision Strike](https://helldivers.wiki.gg/wiki/Orbital_Precision_Strike) identifies free access after training, so its group is Base game / Starter equipment, not requisition or Mobilize. Existing opt-outs remain unchanged.
- [Orbital Napalm Barrage](https://helldivers.wiki.gg/wiki/Orbital_Napalm_Barrage) currently lists a requisition purchase. Its historical Major Order deployment is not grounds for treating it as a participant-only campaign reward now.
- Orbital Gas Strike remains separate from the already reviewed Eagle Gas Airstrike campaign reward. No new ownership assumptions were applied to either.

## Bounded missing-content check

Public API `categorymembers` page-only responses for Category:Orbital Stratagems and Category:Eagle Stratagems list twelve orbitals and nine Eagle pages. All twelve orbitals and eight selectable Eagles already exist in the catalog, including the previously reviewed Orbital EMS Strike and Eagle Gas Airstrike. The ninth Eagle page, [Eagle Rearm](https://helldivers.wiki.gg/wiki/Eagle_Rearm), is the rearm command described in the Stratagems overview, not separate equipped ordnance. It is intentionally excluded. Retained category responses have no pagination continuation.

This establishes parity with those two community category lists on this review date, not completeness for all game gear or unannounced content. Remaining support/defensive acquisitions and game-wide missing-content checks are queued. Prices and level numbers were read as evidence but are not copied into a new gameplay/pricing catalog in this pass.

## Compatibility gate

Independent fixture extracted from the hash-verified pre-edit v1.1.13 ASAR. It protects all 205 names/IDs/categories/aliases/defaults/art paths, all 23 Warbond groups and 187 untouched records. Six focused tests cover facts, prior digests, projection tampering, ID/name/alias imports, ownership/history preservation and the EMS/gas/rearm boundary. The renderer smoke runner supports this non-Warbond acquisition batch without inventing a Warbond to test it.
