# M5 — Mission catalog and selection foundation

Local source-only slice, September 16, 2026. Branch: `codex/mission-foundation`.

Follow-up: the snapshot/context adapter is now implemented and unit-tested in `M5_MISSION_CONTEXT.md`. The descriptions below record this initial foundation slice; persistence and renderer integration still remain pending.

## What changed

- `assets/mission-catalog.json`: deliberately **partial**, five-identity seed with source provenance, duration, restrictions and an explicit legacy scoring family. Four entries can supply suggestions; the Illuminate evacuation variant requires player confirmation.
- `assets/mission-selection.js`: pure browser/CommonJS module. No network, disk, storage, DOM, game control or scoring side effects.
- `test/mission-selection.test.js`: 26 focused tests. The module is **not loaded by the renderer** and has not replaced the current broad mission-mode UI.

Existing Spin, saves, Results, scoring, renderer CSP, packaged files and installed application are unchanged. There is no new installer for this foundation-only slice. Do not present it as a completed M5 or as functionality already in the Armory Browser EXE.

## Evidence and limits

Reviewed indexed community-reference text, not publisher confirmation:

| Identity | Reviewed rule encoded | Reference |
| --- | --- | --- |
| Launch ICBM | Main mission, 40 minutes, Medium (3)–Super Helldive (10), all three enemy factions | [Mission reference](https://helldivers.wiki.gg/wiki/Launch_ICBM) |
| Eradicate Automaton Forces | 15 minutes, Easy (2)–10, Automatons | [Mission reference](https://helldivers.wiki.gg/wiki/Eradicate_Automaton_Forces) |
| Eradicate Terminid Swarm | 15 minutes, Easy (2)–10, Terminids | [Mission reference](https://helldivers.wiki.gg/wiki/Eradicate_Terminid_Swarm) |
| Evacuate High-Value Assets | 20 minutes, Hard (5)–10, defense campaigns for Terminids/Automatons | [Mission reference](https://helldivers.wiki.gg/wiki/Evacuate_High-Value_Assets) |
| Defend Evacuation Site | Illuminate variant; 20 minutes, 5–10; confirmation-only pending a reliable regional rule | [Same reference, variant and regional exception](https://helldivers.wiki.gg/wiki/Evacuate_High-Value_Assets) |

Direct wiki page opening returned HTTP 403; the searchable indexed text was available. Catalog sources explicitly say `community-reference` / `indexed-text`. No game briefings, artwork or long source passages were copied. These are reviewed suggestions, not guaranteed exhaustive/current operation availability. `campaigns: null` means no additional campaign restriction is encoded, **not** proof the mission exists on every planet. The ICBM optional objective in special Gloom missions is not treated as this main mission.

Blitz restrictions conflict between [the older reference](https://helldivers.fandom.com/wiki/Blitz%3A_Search_and_Destroy) and newer [difficulty tables](https://helldivers.wiki.gg/zh/wiki/Difficulty), including a Terminid difficulty difference. Blitz, Rapid Acquisition, other normal objectives and event missions remain outside this seed pending review; they were not removed from the running app. There are no production event-rule keys yet. Event-rule behavior is tested with explicitly synthetic fixtures, not invented live-event rules.

The public paths in the [community API's primary OpenAPI schema](https://helldivers-2.github.io/api/openapi/Helldivers-2-API.json) were inspected read-only. They cover war, campaigns, planets, planet events, assignments, dispatches, Steam and space stations (plus raw war endpoints), not an exact per-player operation list. This is a limitation of the reviewed schema, not a claim about inaccessible/private game systems. We do not read game memory or Steam credentials.

## Engine contract

`createEngine(catalog)` validates and privately copies the catalog; `getCatalog()` returns an independent copy. Duplicate identities, unrecognized versions, malformed restrictions and missing evidence fail closed. New reviewed facts must change `revision` so old confirmations are not silently reinterpreted.

The caller supplies normalized context:

```js
{
  planetKey: 'id:7',       // use the shared planet identity adapter
  faction: 'Automatons',  // resolved enemy, never a guessed raw owner
  difficulty: 7,
  campaign: 'liberation', // defense, event or unknown also supported
  active: true,
  enabled: true,
  campaignIds: [20],
  eventKeys: [],          // relevant event identity AND semantic state
  verifiedEventRules: []  // only explicitly reviewed structured rules
}
```

The snapshot-to-context adapter is **not implemented in this slice**. It must use current normalized planet selection, preserve defense attackers, use snapshot freshness labels separately, and handle event expiration/resume without waiting for another successful fetch. It must not translate Major Order wording into a verified rule. `active` must be explicitly true; missing enemy, planet or difficulty produces a `needs-context` result. Malformed values throw instead of being coerced.

- `getPool(context)` returns `Suggested compatible missions`, a partial-catalog warning, and only entries meeting encoded restrictions. Unknown campaign context suppresses restricted missions; unrestricted suggestions remain labeled uncertain.
- `confirm(context, choices)` records an explicit player-confirmed shortlist. This function is not a live API confirmation. The UI must call it only after the player confirms what they see.
- `getPool(context, confirmation)` uses **only** that shortlist. An empty shortlist stays empty. Damaged, future-version, changed-catalog or out-of-scope confirmation returns `needs-confirmation`, never an automatic switch to suggestions. The caller retains the original record for recovery.
- `select(context, id, { confirmation })` and `roll(context, { confirmation, currentId, random })` use the same pool. Draws are uniform across unique identities; rerolls exclude the current identity if another exists. Empty pools return `null` without drawing or inventing a default.
- Confirmed catalog entries can override suggestion restrictions, with explicit `ruleConflicts`; this is a local observation, not a change to catalog facts. The UI must show the override instead of hiding the conflict.
- Custom entries use `custom:` identities, a bounded name, nullable duration and an explicitly selected legacy score family or `null`. They cannot shadow catalog IDs. Their names are untrusted text: the future UI must use text nodes, never HTML interpolation.
- All returned pools and confirmations are immutable. Inputs are untouched. The browser export works without Node, Electron or network capabilities.

Confirmation scope includes planet identity, enemy, difficulty, campaign context/IDs, relevant event keys and reviewed rule keys. Lists are sorted before comparison. Planet/difficulty/enemy/event changes require reconfirmation. Reordered metadata, fetch timestamps, progress and unrelated MO text do not. An inactive/excluded planet blocks use even if its scope matches. A stale/cached snapshot does not become live just because a shortlist is confirmed; the renderer must retain the separate war-data warning.

## Compatibility boundaries

`scoringFamily` is one of the **existing exact labels**, or `null`. It is independent of mission ID/name/duration and does not invoke the score calculator. Null must lead to an explicit scoring-family choice or an unscored state in later integration, never a guessed default. No historical Result is rewritten or score rebalanced.

There is deliberately **no save/import migration yet**. The next slice must add versioned validation and preserve unsupported/damaged records before enabling persistence. Legacy `mode` values must continue to work when no specific mission exists. Do not wire a confirmation into settings or exports without covering both browser and desktop validation paths.

## Verification

- `node --test test/mission-selection.test.js`: **26/26** passed.
- `npm test`: **485/485** passed, including the 26 new tests; renderer CSP, item catalog and asset validation passed. Evidence: `.test-data/mission-foundation-regression.log`.
- Asset audit: 247 local picture references, zero missing; seven existing placeholders remain elsewhere. No artwork changed here.
- Covers faction/difficulty/defense restrictions, missing context, event-rule gating, no MO inference, scoped override/custom missions, shared manual/random pools, nonrepeat/uniform draws, invalid random values, empty shortlists, catalog changes, event expiration, unchanged refresh, input preservation, malformed records and standalone offline browser-module execution.
- These are deterministic logic/regression checks, **not new GUI, packaged, installed-app or real-operation acceptance tests**. No app launch, build, install, personal-profile access, Desktop write, cleanup/deletion, version bump, commit, push or publication in this slice. Prior changes in the working tree were preserved.

## Exact next task

1. Build and test the snapshot-to-mission-context adapter, including stable scope and local event-expiry handling, without guessing unknown context.
2. Add a small versioned mission-state/confirmation persistence adapter with backward-compatible legacy mode handling, strict transfer/storage validators, future/damaged-record preservation and export coverage.
3. Then wire the shared engine into Spin/manual selection and a clearly labeled “Match my in-game operation” checklist. Keep specific identity separate from historical scoring. Add further source-reviewed mission types before calling catalog coverage complete.
4. Run sequential isolated source UI/restart/network regressions, then make **one** useful local M5 candidate for owner review. Keep the existing Armory candidate/installed baseline until that gate passes; do not create Desktop duplicates.

M4 owner acceptance, the rest of M5, M6 galaxy map, M7 integration, separate clean-install/uninstall, physical display testing, signing and artwork-rights/public-release gates remain open.
