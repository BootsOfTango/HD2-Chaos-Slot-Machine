# M6 sectors, supply links and API sync — September 21, 2026

Branch `codex/galaxy-sectors-supply-sync`. Scope: the original map component and its lifecycle, still **not connected to the main production page or Desktop build**.

## Source contract and limits

Reviewed the [community API schema](https://helldivers-2.github.io/api/openapi/Helldivers-2-API.json) and [API project/rate limits](https://github.com/helldivers-2/api). Planet.waypoints contains destination planet IDs; the raw PlanetInfo schema describes these as supply lines. Planet.sector is the in-game sector name. The documented payload does not contain the exact polygon/arc boundaries of the in-game sectors.

Only reported waypoint endpoints are drawn. Reciprocal reports are deduplicated into one unarrowed line; **lines do not claim attack direction or traversability**. Nearby planets are never connected merely by proximity, common faction or common sector. Unresolved endpoints retain diagnostics rather than receiving invented coordinates. Self-links are ignored. Input bounds: 256 waypoints per row and 20,000 total references. Invalid lists reject the response, retaining the previous atlas.

Sector filters use named membership. Labels use the mean projected position of their members, not a verified in-game sector-label anchor. Labels appear when zoomed or inspecting a sector member; no fabricated polygon/faction territory fill was introduced. The grid is still a navigation aid. Names and supply links retain the atlas observation timestamp and are not proof of current mission availability.

The source bundle was refreshed at **2026-09-21T05:33:43.060Z**: 273 planets, 56 sectors, 341 reported references /336 unique unarrowed links, no normalization issues. Provenance/checksum updated. Optional waypoint fields preserve reading of earlier v1 caches; a legacy cache without them displays an explicit unavailable-links state. This source update is not a user-profile migration.

## Implemented behavior

- Map model exposes connections and sectors without changing campaign eligibility. The view renders original SVG lines, highlights those connected to the inspected planet, and supports sector selection plus supply-line/sector-name toggles. Search/list/eligible filtering remain available. No game textures or third-party map artwork were added.
- Atlas service now supports explicit start/stop/active lifecycle. Construction still makes no request or timer. Start refreshes; successful refresh schedules five minutes later. Hidden/offline states pause scheduled work. Resume/reconnect refreshes stale data. Requests deduplicate, manual refresh honors cooldown, and failures honor backoff/Retry-After. Stop/dispose cancels in-flight work and prevents late completion from rescheduling or writing cache.
- `galaxy-map-session.js` connects the view to injected atlas and optional existing war services. It owns atlas lifecycle, but does not own the shared campaign lifecycle unless explicitly requested. It reuses existing snapshot/preferences/selector authority, provides a Refresh war data button and combines loading/failure status. The adapter does not modify the current run, equipment, mission, scoring or saved history.
- This is polling, **not instant server push**. API refresh does not guarantee zero upstream lag. Cadence/backoff/visibility behavior is covered with an injected clock, not a five-minute real-time soak test.

## Verification

- **723 units** plus CSP/catalog/assets passed: `.test-data/galaxy-supply-units-final.log`. Ten new tests cover link normalization/deduplication, invalid/missing endpoints, removal on new snapshots, sector membership, legacy cache compatibility, five-minute lifecycle, pause/resume, rate limits and cancellation.
- **35 isolated software-rendered Electron checks passed**, including a real API refresh: `.test-data/galaxy-view-1789969376962/report.json`, `live-probe.json`, `graceful-exit.json` and `galaxy-live.png`.
- Real observation: atlas **2026-09-21T05:43:02.154Z**, campaign **05:43:02.389Z**, both requests updated; **273 planets /56 sectors /336 links /38 eligible planets**. The visible status and sector controls were checked against the returned data. Disconnect preserved the real map and relabeled it offline/unconfirmed. Only isolated memory storage/test profiles were used.
- Controlled-network component checks cover sector/layer toggles, live adapter startup, rendered removal of obsolete links, manual refresh, stop/focus behavior, disposal, existing native mouse/keyboard controls, stale choices and small-window reachability. Main application and packaged installer behavior are not claimed here.
- One harness failure used top-level await in a nonmodule script; corrected to an async function after clean exit/lock/PID checks (`galaxy-view-1789969183609`). An initial real request pair did not meet the successful-refresh assertion (`1789969280970`); no specific root cause was established. Durable detailed live results were then added. A subsequent live pass (`1789969327751`) had a stale hidden-window screenshot despite correct service results; disabled background throttling **in the test window only**, asserted the rendered status and waited for frames before the final passing screenshot. Failure/intermediate evidence retained; no force-kills or security bypasses.

## Remaining work

Integrate the connected component into the production Change planet dialog and existing planet-to-mission flow, then run source GUI/restart/security and packaged checks before updating Desktop. Avoid creating a second atlas service or taking ownership of the already managed campaign service. Exact in-game sector boundaries, named-planet owner acceptance, multitouch pinch, physical DPI, long stability and public rights/signing gates remain open.

No new build, Desktop duplicate, publication, version bump or personal-save change. Active dist remains `installer-shell` and `mission-clean`; installed ASAR unchanged (`F8E05A940DA3F200796E7DAC55B4166458B7E5C18549726C63E665D7EBCC37E0`).
