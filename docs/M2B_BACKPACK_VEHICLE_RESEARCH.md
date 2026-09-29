# Backpack / vehicle audit — September 15, 2026

Scope: eleven existing entries. Ten requisition acquisitions are community-supported by their individual Helldivers Wiki item pages, read via the public MediaWiki parse API with redirects. Responses retained under `.test-data/backpack-vehicle-research`. The review manifest links each canonical page; current full names were resolved before reading procurement (the generic Guard Dog page is a disambiguation, not evidence).

Requisition entries: Ballistic Shield Backpack, Bastion, Emancipator Exosuit, M-102 Fast Recon Vehicle (current Wiki name M-102 Gunner FRV), Guard Dog, Guard Dog Rover, Jump Pack, Patriot Exosuit, Shield Generator Pack and Supply Pack. All ten infoboxes specify a Requisition cost and level requirement. Supply Pack's level-one availability does not make it free starter gear. Historical Major Order introduction is not necessarily participant-only entitlement today. We add no prices or balance values to roll logic.

## Supply FRV — primary-source correction and fresh-profile defect

[Arrowhead's campaign-reward FAQ](https://arrowhead.zendesk.com/hc/en-us/articles/29563053705500-I-didn-t-get-a-campaign-reward), updated September 15, identifies Supply FRV as the Census Thunder reward, with participation window June 16 00:00 to June 29 15:00 UTC. It specifically announces a return sometime in October 2026 for people who missed it; that is future availability, not present universal ownership. The article's generic closing paragraph about unspecified return dates does not override its specific Supply FRV statement. No exact October day or automatic game unlock is inferred.

The legacy catalog treated this item as unassigned and default-enabled. That would wrongly include it in fresh profiles. This batch explicitly sets only its fresh default to false. Existing saved flags are preserved, including opted-in owners; importing a save is not used to infer whether the game account actually earned it. Current/source notes ask players to confirm ownership. A future reviewed availability update is required—there is no clock-based ownership grant. Campaign fact is marked primary-source; the other ten remain community-source.

## Bounded missing-content comparison

Public categorymembers responses: Backpack Stratagems contains fourteen page entries, of which Guard Dog (disambiguation) is not equipment. Vehicle Stratagems contains ten, of which Exosuit/FRV disambiguation pages are not equipment. No pagination continuation. The thirteen actual backpacks plus eight vehicles are represented by this batch's eleven and ten previously reviewed Warbond items (K-9, Hot Dog, Dog Breath, Portable Hellbomb, Warp Pack, Hover Pack, Directional Shield, Lumberer, Breakthrough and Incinerator FRV). Ammunition packs included with support weapons are not additional independent loadout entries. No missing selectable item was found against these two dated community lists; not a game-wide completeness certification.

## Compatibility and identity boundaries

Keep all 205 IDs, existing display names, categories and local art paths. Add only `M-102 Gunner FRV` to the existing M-102 alias list; importing that name must not create another roll entry. The older short names remain recognized. Subgroup remains the existing `support` bucket; splitting backpack/vehicle browsing roles belongs to the later Armory work.

Independent baseline: Local Defensive Audit ASAR SHA-256 `0306f0b021ad46e88f0b741b35cc35dca54ca794a7c3449d6abac79f71528784`, internal version 1.1.14. Protect 194 untouched records and all 23 Warbond groups. Explicit tests constrain the only two protected-field changes: that one alias addition and Supply FRV fresh default. No other default, item name or artwork changes are allowed. Existing player metadata and Results remain untouched.
