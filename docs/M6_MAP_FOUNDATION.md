# M6 — Galaxy map data and projection foundation

September 21, 2026. Branch `codex/galaxy-map-foundation`.
Source-only implementation; **not yet loaded in the renderer or Desktop EXE**.

## Implemented

- `assets/galaxy-map-model.js`: pure browser/CommonJS module. No DOM, network,
  storage, game-control or score side effects. Returns immutable map-view records.
- `normalizeAtlas`: converts the documented all-planets response into bounded
  display metadata: stable ID, name, sector name, owner, position and disabled flag.
  Duplicate IDs reject the atlas. Invalid rows are reported; valid coordinate-less
  planets remain list entries. Only English localized names are selected.
- `project`: fixed square projection,1000 units with40 padding. API X goes right;
  positive API Y goes up, so SVG Y is inverted. Origin maps to500,500. No rotation,
  X mirroring, faction-dependent transforms or auto-fit to currently active planets.
  Supported coordinates are finite values within[-1,1] per axis; this is a reviewed
  display bound, not an API schema guarantee. Outliers remain unplaced/list-only,
  rather than distorting the map or acquiring invented positions.
- `build`: joins atlas and campaign records by stable identity, never a fuzzy name
  match. Current campaign coordinates take priority, otherwise same-ID atlas
  coordinates can fill missing display metadata. Name-only offline records never
  silently become same-named API planets. Missing/untrusted war data leaves atlas
  context visible but makes no planet selectable.
- `selectPlanet`: revalidates the current snapshot and preferences for each action,
  using the existing shared selector. It never accepts a stale rendered marker as
  authority. Metadata-only planets cannot enter the roll pool. Cached/bundled
  choices retain existing offline behavior and explicit unconfirmed-war status.
- Owner and attacking faction remain separate (human-owned defenses are not shown
  as enemy-free). Observation age and war-data freshness are separate outputs;
  recently observed atlas metadata cannot promote cached war data into live data.
- Exact sector polygons, territory fills, supply lines and MO highlights are NOT
  invented. Model exposes `sectorBoundaries: null`, `exactTerritoryGeometry: false`
  and `exactMissionAvailability: false`.

The consumer must treat all names as untrusted text, not HTML. It must refresh its
view on snapshot/ownership changes and invoke the shared mission-context adapter
after planet selection. Fetch-time event factions in the planet pool are not proof
that a defense is still ongoing; the existing mission adapter evaluates expiry.
The model deliberately does not introduce a second planet or mission policy.

## Source review and bounded live observation

Primary [OpenAPI schema](https://helldivers-2.github.io/api/openapi/Helldivers-2-API.json)
and [API project](https://github.com/helldivers-2/api) reviewed read-only. `/api/v1/planets`
provides Planet index/name, sector name, X/Y position, owner and disabled fields.
The schema's sector property is a name, not a polygon definition; no sector boundary
geometry is supplied by these fields. No numeric faction codes were guessed.

`scripts/probe-galaxy-map.js --live` makes two explicit read-only requests with
client/contact/language headers,15-second timeouts,8MiB response limits and no
redirects. It does not cache data, modify user profiles or run at app startup.

Observation at **2026-09-21T04:43:42.804Z**:
**273 atlas planets,38 campaign planets,38 selectable,zero unplaced,zero model/atlas
issues**. Evidence: `.test-data/galaxy-foundation-live-probe.json`.
This is a single API observation, not guaranteed later availability.

Coordinate anchors captured in `test/fixtures/galaxy-coordinate-anchors.json`:
Super Earth(0,0); Cyberstan upper-left; Hellmire/Meridia upper-right;
Calypso/Malevelon Creek lower-left under the unrotated projection. Observed faction
coordinate signs also align with the broad upper-left red /upper-right yellow /
lower purple regions in the owner's screenshot. This supports the projection;
**exact named-planet comparison against a high-resolution in-game map is still an
acceptance gate**, not completed by the unlabeled overview reference. Positions
are not fixed by faction, and ownership observations are not bundled as live facts.

The six-coordinate fixture is test data only, not a complete offline atlas or an
artwork asset. No reference screenshot or AI-generated mockup was added to runtime.

## Verification

- **21 focused tests** in `test/galaxy-map-model.test.js`; included in final
  **679 passed units** plus CSP/catalog/assets validation.
  `.test-data/galaxy-foundation-units.log` is the complete final evidence.
- Tests cover projection/bounds, observed anchors, null/nonfinite/outlier positions,
  invalid and duplicate atlas data, disabled/conflicting/missing planets, defense
  ownership, stale-click prevention, same-ID joins, offline legacy records, cache
  age, failed refresh, event expiry, input immutability and standalone browser VM.
- All three factions ×10 difficulties feed the exact same existing mission adapter
  and engine whether selected through the new map API or existing direct selector.
- Initial18-test run found two issues: the test helper replaced a deliberate null
  invalid fixture with defaults; and the new adapter used `cached` instead of the
  established snapshot source token `cache`. Fixed both, retained failure log
  `.test-data/galaxy-foundation-focused.log`. Final full suite includes three further
  legacy/expiry/failed-refresh cases. No existing war service changes were needed.
- No GUI/build/install tests this slice: this module is deliberately not loaded by
  the app yet. Existing Desktop `mission-clean` and installed baseline untouched;
  no personal-save writes, duplicates, archive operations, version bump or publication.

## Exact next

1. Add a separately dated all-planets metadata cache and bounded loader without
   changing campaign randomization authority or making rolls wait for the network.
   Preserve unsupported caches; test outages, stale responses, invalid data and
   first-launch offline metadata. Review provenance before bundling a complete atlas.
2. Render the first original SVG view using this model, with text-list fallback and
   no falsely authoritative sector fills. Verify orientation visually against the
   owner's in-game references and known named planets.
3. Then add pan/zoom/search/details, shared planet→mission actions and proven sector
   geometry. Keep map drag separate from page panning; run isolated GUI, restart and
   packaged checks before replacing the current Desktop preview.

Public rights/signing, exact sector geometry, physical DPI/listening, real OS resume,
long stability and separate clean Windows installation remain outside this slice.
