# M6 atlas loader and cache — September 21, 2026

## Outcome and boundary

Source-only step on `codex/galaxy-atlas-cache`. The all-planets metadata loader now handles bounded downloads, cache validation, offline reads and failure recovery independently of campaign selection. It is **not loaded by the renderer** yet. No new map screen, installer, Desktop promotion, personal-save write or public release was performed.

The complete first-launch offline atlas is **still pending**: this session's live requests timed out. No complete bundled atlas was created, and no new successful live observation is claimed. Offline bundle tests use synthetic fixtures. The previous foundation's successful 273-planet probe retained a summary and six coordinate anchors, not a complete redistributable atlas.

## Implementation

- `assets/galaxy-atlas-service.js` exposes `createService`, `getState`, `refresh`, `setOnline`, `subscribe` and `dispose`. Browser use requires the existing map-model and war-refresh modules; Node use is also tested.
- Storage is injected with a localStorage-shaped interface. The separate key is `hd2csm_galaxy_atlas_v1`; no existing save or campaign key is changed. Construction reads synchronously and does not start requests or timers.
- Valid cache and supplied bundle are compared by observation time. Damaged, unsupported future-format, unreadable or externally changed caches are preserved. Quota/write failures keep valid data usable in memory and allow later saving to recover.
- `galaxy-map-model.js` now exports strict `validateAtlas`: supported fields, normalized records, bounded issue codes, valid timestamps and positions are checked. Unknown/missing positions remain null; coordinates are never invented.
- Requests use the documented all-planets endpoint, anonymous client/contact headers, no credentials, no redirects, a 4 MiB streamed-body bound and a ten-second timeout. In-flight calls are deduplicated. Timeout also settles when an injected transport ignores abort.
- Manual requests honor a 30-second cooldown and failure backoff. Rate-limit Retry-After is honored. Nonmanual background/resume/reconnect calls skip recent observations. Old observations cannot replace newer data; invalid or malformed partial responses cannot erase a valid atlas.
- Going offline or disposing cancels the request; late completion cannot save data. Network failures retain the last valid atlas. Invalid bundles do not block recovery from cache or network.
- State reports source, observation time, freshness, loading and warnings separately. Atlas data is display metadata, **never evidence of current playability**. Campaign eligibility remains owned by the existing selection engine.

The caller still needs to connect startup, active five-minute refresh, manual refresh and reconnect/resume lifecycle signals. This module does **not** introduce a second automatic polling loop on its own. Nothing about the shipped application's refresh behavior changes in this slice.

Primary API contract: [community API schema](https://helldivers-2.github.io/api/openapi/Helldivers-2-API.json). Sector names/coordinates are not verified sector polygons or an exact in-game operation list.

## Verification

- `npm test`: **704 tests passed**, zero failed/skipped; CSP, catalog and asset validators passed. Assets: 247 local pictures, zero missing, seven existing placeholders. Evidence: `.test-data/galaxy-cache-units-final.log`.
- **25 new service tests** cover bundle/cache preference, separate-instance offline restart, corruption/future formats, storage failures, external changes, deduplication/reentrant observers, cooldown/backoff/Retry-After, malformed/oversized bodies, stalled-body timeout, ignored aborts, cancellation/disposal, clock rollback, no-atlas fallback and standalone browser execution without Node/Electron privileges.
- Existing map-model/selection regressions continue to pass; metadata alone cannot make a planet selectable.
- `node scripts/probe-galaxy-atlas-cache.js --live`: the final real endpoint attempt timed out at `2026-09-21T04:56:11.029Z`; source unavailable, no cache written. Evidence: `.test-data/galaxy-cache-live-probe.json`. Independent Node and PowerShell requests also timed out. This does not establish the cause of the endpoint/network failure.
- Cache restart tests use isolated memory storage and separate service instances, not a real Electron process restart. No GUI, packaged-app, installation, audible or physical-DPI tests were run in this source-only slice.

## Next bounded task

Obtain and review a dated complete atlas when the endpoint is reachable, then build the first original SVG view against the existing map model. Keep campaign-coordinate/list fallback when the atlas is unavailable. Verify named-planet orientation visually before acceptance; do not fabricate exact sector boundaries or hardcode faction quadrants. Lifecycle integration, gestures, accessibility and packaged promotion need their own tests before the Desktop preview changes.
