# Retired equipment identities — v1.1.4

Bounded consolidation of two previously verified duplicate pairs. Acquisition evidence is in `M2B_STRATAGEM_SOURCE_RESEARCH.md`; the original fact batch remains immutable at `assets/catalog-reviews/2026-09-14.json`. No new research or broader source audit is implied.

| Retired row | Canonical row retained |
|---|---|
| `stratagem:wasp` / Wasp | `stratagem:sta-x3-w-a-s-p-launcher` / StA-X3 W.A.S.P. Launcher |
| `stratagem:ems-strike` / EMS Strike | `stratagem:orbital-ems-strike` / Orbital EMS Strike |

EMS Mortar Sentry is separate equipment. The retired rows' complete catalog facts are archived in `assets/catalog-reviews/2026-09-14-identity-merges.json`; their artwork files remain. The active catalog and image map contain only the 205 canonical entries. Legacy names resolve to the retained image, and both IDs resolve to the same equipment during import.

## Deterministic player-state policy

Resolution is scoped to the equipment category:

1. An exact canonical ID wins.
2. Otherwise an explicit retired ID wins, even if its supplied name is absent or misleading.
3. Otherwise the canonical name wins.
4. Otherwise a unique explicit alias wins.
5. The first supplied record wins ties at the same level. Never combine flags with logical OR.

The winner's `owned` and `enabled` choices survive. For old rows lacking ownership, legacy enabled determines ownership. Explicit unowned/enabled contradictions become unowned/excluded with the original contradictory row retained. A missing row in an explicitly supplied category remains disabled/unowned, while an entirely absent category retains existing fresh-default semantics. The five opt-in additions remain off unless chosen by the player.

All losing records are retained under `legacyAliasRecords`. A winning retired-ID row is also retained so its original ID and fields remain recoverable. A sole name-alias winner for merged equipment is retained for pre-ID exports too; unrelated alias migration behavior is unchanged. Nested recovery is flattened and structurally deduplicated. Re-importing already migrated state must not grow it. Recovery records are never rollable and never silently restore discarded choices.

Unknown custom records retain the previous category-scoped custom/name fallback. Bundled canonical/legacy IDs are validated for category, shape and collisions before any save resolution, including fresh startup. Invalid catalogs/imports throw before inputs are mutated; callers retain existing recovery/non-overwrite behavior.

Armory → Duplicate cleanup explains the policy and lists the current choices and retained originals. Existing ownership controls can change the canonical choice after review; doing so does not reintroduce duplicates or remove archived originals.

## History and analytics

Gear migration never rewrites cards, displayed equipment snapshots, fingerprints, locked statistics, notes or scoring. Existing import normalization/scoring still runs as before; tests baseline normalized/scored historical records before checking the migration.

Derived analytics resolve canonical/retired IDs and names per category. If an old Result contains both Wasp and its longer name (or both EMS names), that equipment counts once for that run. This repairs usage weighting, not historical scores. The two live analytics consumers keep category-safe keys; an older unused name-keyed compatibility helper retains its preexisting cross-category custom-name limitation.

## Reviewed source maintenance

`node scripts/apply_identity_merges.js` validates the exact archived retired snapshots, keeps canonical facts/defaults/artwork, and applies the committed merge batch idempotently. Run `python scripts/sync_item_catalog.py` afterward to update defaults, legacy-ID metadata and image aliases. Reapplying the older fact-only batch directly to a merged catalog rejects its retired targets; it must not resurrect rows. Tests reconstruct its historical baseline in memory and replay the original review followed by the identity merge.

The source summary is now 27 primary + 11 community + 167 pending = 205 unique entries. Previously it was 28 + 12 + 167 = 207 rows. No evidence was removed: one reviewed primary-source duplicate and one reviewed community-source duplicate were combined.

This migration does not authorize installation over personal profiles, GitHub publication, or a full Armory/live-war rewrite. Each preview remains local until approved.
