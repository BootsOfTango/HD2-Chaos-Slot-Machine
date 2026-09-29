# Planet special-activity source audit — September 24, 2026

## Decision

**A viable community-reported source was found; production integration remains next.**
The raw status endpoint includes per-planet effect codes that the normalized
planet feed/schema do not expose. Fifteen reviewed activity groups (23 codes)
can be interpreted using a pinned community catalog. These are provider reports,
not independently verified encounters or a second-by-second mirror of the game.

This slice adds a read-only developer probe and tested pure validator in `scripts/`.
Neither is imported by the renderer or packaged by the existing builder. No
new startup requests, badges, caches, personal saves, app bytes or Desktop files
were changed. Current Desktop remains **card-planets**.

## Sources and provenance

- Current war discovery: `https://api.helldivers2.dev/raw/api/WarSeason/current/WarID`.
- Observed season:801. Status endpoint:
  `https://api.helldivers2.dev/raw/api/WarSeason/801/Status`.
  Future integration must discover the ID, not permanently hard-code801.
- Planet identity join: `https://api.helldivers2.dev/api/v1/planets` (`index`).
- Effect dictionary: [helldivers-2/json, pinned effect catalog](https://github.com/helldivers-2/json/blob/c7425990a1ef5891005b0ecb387fbea5def471b7/effects/planetEffects.json).
  Commit `c7425990a1ef5891005b0ecb387fbea5def471b7`;156 entries.
- [Provider schema](https://helldivers-2.github.io/api/openapi/Helldivers-2-API.json)
  and [provider WarStatus source](https://github.com/helldivers-2/api/blob/233f155771880324eff41f78a1ab5951568d875b/src/Helldivers-2-Models/ArrowHead/WarStatus.cs)
  leave PlanetActiveEffects unmodeled/TODO. Actual raw response includes it.
- [Maintainer's effect model](https://github.com/CrosswaveOmega/hd2api.py/blob/0ff67eade7c2d4f4db45ea225f41b865dd515b26/src/hd2api/models/Base/Effects.py)
  documents the planet index / effect-ID relation.
- [Maintainer's wartime model](https://github.com/CrosswaveOmega/hd2api.py/blob/0ff67eade7c2d4f4db45ea225f41b865dd515b26/src/hd2api/models/Base/WarStatus.py)
  explicitly describes internal ticks and drift. **Do not treat `time` as Unix
  seconds, or add it to WarInfo.startDate to invent a UTC source-updated time.**
- Catalog repository [MIT notice](https://github.com/helldivers-2/json/blob/c7425990a1ef5891005b0ecb387fbea5def471b7/LICENSE):
  Copyright2024 Helldivers2 Community. Preserve required notice/attribution when
  integrating derived catalog data into distribution. This does not grant game
  artwork rights. No source descriptions, third-party code, icons or artwork were
  copied into the app in this slice; the research mapping records IDs/short labels.

## Checks and observed quality

Grain: one `(planet index, galactic effect ID)` pair in one war snapshot.
Normalized app planet IDs are joined by exact integer identity, never fuzzy name.

Two explicit, bounded live observations (UTC):

| Observation | Status retrieved | Internal tick | Unique effect pairs |
|---|---|---:|---:|
| A |2026-09-24 04:49:18.569|82,287,820|116|
| B |2026-09-24 04:50:04.939|82,287,870|116|

The counter advanced50 ticks over46.37 wall-clock seconds; effect sets stayed
identical. This supports a changing provider snapshot, **not** a measured game
latency guarantee, reliable UTC conversion, long-running uptime or complete coverage.
HTTP Date is retrieval/HTTP context, not proof of a changed game record. No
Last-Modified or reliable per-effect UTC update timestamp was supplied.

| Finding | Evidence | Risk / treatment |
|---|---|---|
| Identity integrity passes |273 status planets,273 atlas planets;0 orphan IDs;0 duplicate pairs|High confidence in these observed joins; validate every response.|
| Catalog incomplete |13 of56 distinct observed codes missing (23.2%);22 of116 pairs (19.0%)|High risk of false all-clear; unknown codes stay unknown.|
| Reviewed positive subset |10 code pairs collapse to5 badges on2 planets|Coverage of requested indicators, not coverage of every modifier.|
| Semantic duplicates |Enemy/visible variants may describe the same activity|Collapse by reviewed group while preserving both source codes.|
| Timestamp limitation |Internal counter only; sourceUpdatedAt=null|Do not claim exact current game conditions; show retrieval/cache age.|
| Schema gap |Raw response contains effect rows absent from normalized schema|Guard shape explicitly; fail closed on unexpected scope.|

Observed reviewed examples: OSHAUNE212 reported Rupture strain, Dragonroaches,
and Hive Lords; OMICRON259 reported Dragonroaches and Hive Lords. This does not
mean either planet was playable for every player or that every mission contains
those enemies. No currently observed reviewed code for Jet Brigade or SEAF in
these samples is **not evidence of their absence in-game**.

## Reviewed mapping boundary

Research definitions contain15 groups /23 codes:

- Jet Brigade1202/1203; Hive Lords1307/1308; Spore Burst1244/1386.
- Predator1243/1245; Rupture1303/1310; Incineration1248/1249;
  Dragonroaches1306/1309; Heavy SEAF Presence1400/1401.
- Strider surge1283; Impaler rampage1285; Spore Scavenger rampage1288;
  Charger rampage1293; Heavy armor1355; Hulk1357; Devastator1359.

Factories1239 do **not** imply a Jet Brigade deployment. Gloom/biome/hive-world
codes do **not** imply Hive Lords or a Spore Burst strain. A description mentioning
SEAF patrols is **not** evidence of SEAF support. Unreviewed effects may be valid
unrelated modifiers; they are not automatically errors or new enemy types.

## Implemented validation and tests

`scripts/planet-activity-audit.js` is a source-only pure adapter. It validates war
identity, bounded lists, unique integer planet keys, exact pair identities,
scope, internal ticks and retrieval dates. It rejects missing effects separately
from an explicitly empty list, counts duplicate pairs, groups reviewed codes,
retains unreviewed codes and has no confirmed-absence state. Empty/unknown data
never becomes an all-clear. Offline, failure, future retrieval dates and expired
retrieval windows cannot produce `recent-report`. That label means recently
retrieved, not source-time verified. Tick regression/unchanged/new-war outcomes
are exposed for the upcoming refresh coordinator.

`scripts/probe-planet-activity.js --live` runs four read-only public GETs, with
timeouts, redirect refusal,8MB bounds, identifying headers and no automatic retry.
It writes response hashes/headers and a compact report under ignored `.test-data`.
It does not run when imported, at startup or without the explicit flag.

-15 focused tests passed (exact IDs, duplicate grouping, malformed/missing data,
  empty lists, unknown codes, unsupported scope, faction-text false positives,
  tick progression/regression, bounded responses and offline/expired reports).
-793 full unit tests +CSP/catalog/assets passed:
  `.test-data/planet-activity-units.log`.247 pictures,0missing,7existing placeholders.
- Live evidenceA: `.test-data/planet-activity-audit-1790225358222/report.json`.
- Live evidenceB: `.test-data/planet-activity-audit-1790225404410/report.json`.
  Raw responses and normalized snapshots are retained beside each report.
- Desktop ASAR still `e877eb4aa637952e9ab42ee3b4f31ecb7c974c6204087bdf12983e873c18a8e7`;
  shortcut still `start-card-planets-review.cmd`. No build, GUI test, installer,
  publication, version bump or personal-profile change in this research slice.

## Exact next implementation

1. Promote the reviewed decoder/catalog into an attributed, allowlisted local
   module after adding required source notice coverage. Do not download mappings
   silently at runtime or copy the whole source catalog/artwork.
2. Add a separate optional raw-status service on the existing API host. Discover
   war ID; reuse dedup/cooldown/Retry-After/backoff and bounded parsing. Keep
   polling coordinated with map visibility (one minute) and active app (five).
   Never block Spin or turn a raw-effects error into an empty active-planet pool.
3. Track war ID, internal counter progression, retrieval time and last observed
   progression separately. Reject regressions; unchanged snapshots must not keep
   presenting old reports as newly confirmed. Cache version/size validation and
   existing unknown-version preservation are required before any storage writes.
4. Render original icons and concise **Reported activity** badges in hover,
   keyboard preview and selected details. Use the same view model; disclose
   cached/offline age and unsupported codes. No guaranteed-encounter wording.
5. No effect-based eligibility/mission/scoring changes, no mutation of locked
   runs or historical cards. Regional and global modifiers remain out of scope
   until their scope is explicitly reviewed.
6. Fake-clock/failure/war-change/cache tests, controlled UI tests, then source
   and packaged regressions and owner-preview promotion under cleanup policy.
   In-game comparison and long-running freshness remain separate acceptance tasks.
