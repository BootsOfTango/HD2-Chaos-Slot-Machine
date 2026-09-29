# M5 — Planet-to-mission context adapter

September 16, 2026; branch `codex/mission-context`. Source-only continuation of `M5_MISSION_FOUNDATION.md`.

Follow-up: versioned persistence and renderer transfer support now exist; see `M5_MISSION_PERSISTENCE.md`. This context adapter itself remains unwired pending the mission UI slice.

## Implemented

`assets/mission-context.js` connects the existing normalized war-snapshot, shared planet selection and ownership-preference modules to the mission engine. It performs no network requests, storage writes, scoring, rendering or background work.

`HD2MissionContext.forPlanet(snapshot, options)` returns:

- `context`: immutable input for `HD2MissionSelection`, including stable planet identity, resolved enemy, difficulty, campaign and relevant event scope.
- `warStatus`: snapshot-wide freshness and last-successful-update time. This is **not** proof of exact mission availability or that the requested planet was found; callers must also respect `reason` and the engine's context checks.
- `warnings`: offline, unknown-context, event-timing or local event-transition warnings.
- `reason`: a blocking selection/snapshot problem, or null. Missing or invalid data never falls back to the previously selected object's stale campaign metadata.
- `nextRecheckAt`: earliest future snapshot-freshness or selected-event boundary, or null. This is a scheduling hint, not an installed timer.

Options: `selectedPlanet`, `difficulty`, `editable` planet preferences, `now`, `online`, `refreshFailed`. The selected object supplies identity only; its saved faction/event/ownership values cannot override the current pool. Invalid difficulty, clocks, connectivity booleans and malformed preference records are programmer/data errors and throw. Missing/corrupt/unsupported snapshots instead return a blocked context and an explicit reason. Original inputs remain untouched.

## Selection and compatibility rules

- Uses the existing shared ownership adapter: stable IDs win; legacy name-only opt-outs still apply; disabled duplicates stay disabled. Does not create a separate planet eligibility policy.
- A legacy name-only selection resolves only when the current pool has one matching identity. Ambiguous names, removed planets, excluded planets and unresolved/conflicting enemies are blocked. An explicit missing ID never falls back to a same-named planet.
- Copies current campaign IDs and types into confirmation scope; no assumptions are made about numeric campaign-type semantics.
- Relevant event identity, type, campaign, faction, schedule and locally evaluated state contribute to scope. Unrelated events with a different campaign ID do not. A planet event with no campaign ID follows the existing M3 planet-event relevance rule.
- Refresh timestamps, health/progress, display names for ID-backed planets, coordinates, source changing to cache and unrelated planet changes do not invalidate an otherwise unchanged confirmation.
- Defense attackers come from normalized enemy/event evidence, never from treating the human owner as the enemy.
- No production special-event rule keys are emitted. Imported/custom row fields or Major Order prose cannot unlock special mission suggestions.

## Time and offline behavior

- Recomputes event state from normalized dates using the supplied clock. An event can start or expire without another successful API request.
- A newly started event uses its known initiator and changes confirmation scope. The old snapshot is visibly treated as cached until refreshed.
- When a relevant event ends, defense/event context becomes unknown. An enemy known solely from that expired event is cleared; independently resolved campaign evidence may remain. No winner, new owner or next campaign is invented.
- Undated and invalid event timing suppresses phase-specific suggestions. Independent campaign defense context with **no event record** remains usable, with a timing warning; absence of a timer is not itself proof that the campaign ended.
- Cached data preserves a last-successful timestamp and remains labeled not confirmed currently playable. Confirmation never turns cached war data into a live claim.
- Bundled and legacy-cache planets can still produce ordinary offline suggestions. Their missing campaign context is explicit. Editable offline planets have event/campaign/rule fields stripped from mission context, even if imported metadata claims otherwise.
- Legacy cache data cannot relabel itself live by changing its `source` field alone.

The future renderer must call the adapter on selection, relevant refresh, difficulty/ownership changes, its `nextRecheckAt` boundary, and resume/reconnect. **Those callbacks are not wired yet.** The adapter does not change a locked run or a historical Result; the caller must preserve those immutable recommendations and separately indicate when current suggestions differ. An unknown post-expiry enemy blocks mission recommendations, not the existing equipment randomizer.

## Verification

- **25 focused adapter tests** cover all factions, human defenses, local start/expiry boundaries, invalid/undated timing, independent enemy evidence, unrelated events, scope changes/stability, stale/offline/bundled/legacy inputs, custom-metadata injection, ID/name matching, disabled/ambiguous/conflicting selections, malformed input and immutability.
- Browser modules were composed in an isolated JavaScript VM with no Electron or network access. This is not a graphical browser/app test.
- `npm test`: **510/510 passed**, plus renderer CSP, catalog and asset checks. Evidence: `.test-data/mission-context-regression.log`.
- Existing asset audit remains 247 local picture references, zero missing and seven pre-existing placeholders. No catalog facts, images or score rules changed.
- No GUI/packaged/installed-app test, real OS sleep/resume or live API probe this slice. Timing tests use explicit deterministic clocks over synthetic API fixtures passed through the real snapshot normalizer.

No renderer integration, save migration, new EXE, build, install, Desktop duplicate, personal-profile write, cleanup/deletion, version bump, commit, push or publication. All earlier working-tree changes preserved. The Armory Browser candidate and installed Installer Shell baseline remain unchanged.

## Next bounded task

Add versioned mission state and confirmation persistence, preserving old broad `mode` labels and historical scores. Cover browser and desktop transfer/storage validation, future/damaged-record recovery, imports/exports and clear/reset behavior before loading these modules in the renderer. Then implement the shared Spin/manual/operation-checklist UI, expand the partial mission catalog with reviewed evidence, and run isolated integration tests before producing one M5 local candidate.

M5 is not complete. M4 owner acceptance, M6 map, M7 final integration and the existing separate-Windows/physical-display/signing/artwork-rights release gates remain open.
