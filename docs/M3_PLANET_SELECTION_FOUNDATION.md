# M3 first slice — shared planet-selection rules

The owner chose to defer clean-install/uninstall environment setup and resume the live-planet milestone. This is a **source-only foundation**, not a shipped change to Spin. `assets/planet-selection.js` is intentionally not referenced by `index.html` and was added after the Installer Notices candidate was built. That candidate and the installed application still use the old planet flow.

## Implemented and tested

- One eligibility routine shared by random and manual selection, with no previous-faction filter.
- Uniform selection per unique eligible planet, not equal faction weighting.
- Rerolls exclude the current planet when another eligible planet exists; one-planet and empty pools are explicit.
- Stable IDs, including ID zero; normalized name fallback for older records. Explicit invalid IDs are not hidden by fallback.
- Disabled/inactive/unknown-enemy records excluded. Duplicate records cannot increase a planet's odds or resurrect an opt-out; conflicting enemy metadata is excluded.
- Selected planet metadata is independently copied, so later snapshot updates cannot mutate that returned selection through shared object references.
- No network, timer, storage, save-schema, scoring or installed-profile operation.

Ten focused tests pass, including deterministic uniform-bin checks, cross-faction rerolls, matching manual rules, malformed pools, immutable source snapshots and browser export without Electron/Node.

Final full suite: **385/385 tests**, CSP/catalog/assets pass; evidence `.test-data/notice-audit-war-foundation-unit.log`. The packaged app test evidence for Installer Notices predates this unwired module and does not validate it as a connected UI feature.

The caller must supply a normalized active snapshot or explicitly labeled offline fallback pool. This module **does not** determine live availability, resolve a human-owned defense's attacker, merge ownership preferences, label stale data or update an existing run. Those remain integration responsibilities; a successful test of this module is not a UI acceptance result.

## Exact next slice

1. Define a versioned shared war snapshot and strict campaign normalization against the [community API schema](https://helldivers-2.github.io/api/openapi/Helldivers-2-API.json): stable planet identity, sector/position, active state, resolved enemy, defense/event context and successful-fetch timestamp. Inspect event faction semantics before using owner information; do not infer exact mission lists or enemy from Major Order prose.
2. Test defense/human-owned, liberation, unknown/malformed, duplicate and empty response cases. Preserve valid cached/bundled operation with explicit **not confirmed currently playable** status. Old cache data must remain recoverable; do not erase a valid snapshot on a bad response.
3. Implement an injectable refresh service: startup; every five minutes while active; stale resume/reconnect; manual refresh cooldown; one in-flight request; timeout, rate-limit/backoff and last-success status. Selection must remain synchronous/offline-capable and never await refresh.
4. Connect Spin, reroll and manual selection to this shared pool and selector. Update faction from selected planet, clear incompatible mission state, preserve gear/reroll allowances and never mutate locked runs or historical Results on refresh. Add UI/packaged acceptance before claiming the cross-faction bug fixed in the application.
5. Add prominent Refresh war data/last-success labels and supported cache/preference export coverage. Build a new isolated milestone candidate only after the connected slice passes, preserving current installed/profile data and cleanup policy.

The future mission suggestion/confirmed-shortlist and galaxy-map milestones must consume this same snapshot/selection path; they are not part of this initial module. Catalog/Armory/map/mission work remains queued rather than silently bundled into M3.
