# M3 shared war snapshot foundation

Reviewed September 16, 2026 (Eastern); branch `codex/war-snapshot`.

## Scope and delivery

`assets/war-snapshot.js` is a pure, immutable data adapter shared by future war refresh, selection and map consumers. It depends on `planet-selection.js`. Neither module is loaded by the current renderer yet. No network requests, timers, storage writes or personal-save changes occur inside this adapter. This work is **not in the installed app or the Installer Notices candidate**. Internal version remains 1.1.14; no build, publication or Desktop duplicate was created.

## Rules implemented

- Validate campaign/planet identities, English localized names and known factions; project bounded known fields, including coordinates, sector, biome, hazards and event context. Unknown input properties are not carried forward.
- Current relevant event initiator takes priority for defense enemies. Recognized enemy campaign faction is next. Human liberation campaigns resolve to the enemy owner when there is no contradictory active-event evidence. Human owners are never selectable enemies. Unknown combatants remain unresolved instead of guessed.
- Keep event IDs, campaign IDs/types, dates and explicit ongoing/future/expired/undated/invalid state. Ignore unrelated, expired or future events when resolving campaign opponents. This is snapshot context, not an exact live operation/mission list.
- Exclude disabled/unknown/conflicting planets from the selector; deduplicate by stable identity without giving repeated campaigns extra roll weight. Empty or wholly unusable responses cannot replace the last good snapshot. Older responses cannot replace newer ones.
- Copy-only versioned cache decoding accepts valid current and legacy dated planet caches. Damaged/future-dated data is rejected. Unsupported schema versions are identified separately so the future persistence layer can preserve them. Existing input objects are not modified. There has been **no actual storage migration** yet.
- Cache reads never become live just because their timestamp is recent. Freshness expires at five minutes, connectivity/fetch failure, or a recorded active event ending. Bundled data has its own bundle version, no fabricated fetch timestamp, and an explicit not-confirmed-currently-playable label.
- `confirmedCurrentlyPlayable` expresses fresh campaign-list evidence only. It must not be presented as proof of a particular player's exact missions, difficulty availability or ship operation screen. The future UI must keep this distinction visible.

## Evidence and correction found during validation

Primary references: [community API schema](https://helldivers-2.github.io/api/openapi/Helldivers-2-API.json), [API project](https://github.com/helldivers-2/api). Schema inspected for v1 Campaign, Planet and Event fields; no raw numeric race mapping assumed. API requests used an application header, repository contact URL, English language and a ten-second timeout. No authentication or player data was sent.

An initial live probe normalized 36 rows but only admitted one defense planet: the adapter incorrectly treated the other campaigns' `Humans` faction as unknown. Inspection showed 35 human liberation campaigns with enemy-owned planets. Added the friendly-campaign rule and regression test rather than weakening handling of unknown species.

Corrected read-only live probe at **2026-09-17 00:34:47 UTC**:

- 36 response rows, 36 unique eligible planets: 16 Illuminate, 10 Automatons, 10 Terminids.
- Human-owned defense planet 268 resolved to Terminids from its active event.
- No normalization warnings; serialized cache round trip valid.
- This is one observed API response, not proof of every future API shape or exact in-game playability.

Logs retained under `.test-data/war-snapshot-api-probe.log` (initial discrepancy) and `.test-data/war-snapshot-api-probe-corrected.log` (corrected check).

Final `npm test`: **411/411 pass**, including **26 new snapshot tests** and the ten prior selector tests. CSP, catalog and asset validation pass (247 local pictures, zero missing references; seven preexisting placeholders). Evidence: `.test-data/war-snapshot-unit-final.log`. Earlier 410-test run predates the live-discovered regression and is not the final result.

Tests cover three factions, defense/liberation, malformed/expired/future events, unknown factions, duplicates/conflicts, invalid responses, disabled pools, immutable copies, stale updates, legacy/damaged/unsupported caches, timestamps, expiry, bundled status and browser module loading. Full-suite success does not mean this feature has been exercised through Electron: **no UI or packaged-app test was run for this unwired code**.

## Exact next slice

Implement an injectable war refresh service with deterministic fake-clock/network/storage tests: startup and five-minute active refresh, stale reconnect/resume, manual cooldown, request deduplication, timeout, Retry-After/backoff, last-valid cache retention, safe cache migration and unsupported-version preservation. Keep randomization synchronous against the current snapshot.

Then connect the snapshot and existing selector to Spin/manual/reroll together, migrate ownership/opt-outs carefully, display dates/freshness, and retain locked-run/history immutability. Cache event states describe fetch-time context; future mission eligibility must also evaluate event dates against the current clock. Do not reuse stale context as current event authorization. Add integrated renderer/restart/network tests before building one replacement candidate. Clean-install/standalone-uninstall acceptance stays deferred by owner; no personal uninstall test.
