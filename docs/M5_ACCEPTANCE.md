# M5 consolidated acceptance — September 21, 2026

Branch: `codex/mission-acceptance`. This is a validation-only handoff, not a new
catalog release or a visual change. The clean-panel Desktop candidate stays in
place; no redundant installer, runtime copy or shortcut is created.

## Decision

The implemented mission system can proceed to the M6 map foundation with the
explicit catalog/availability limitations below. This is **engineering acceptance
of the existing partial-catalog behavior**, not exhaustive mission coverage,
publisher verification, user acceptance of every mission or public-release approval.

## Acceptance evidence

| Requirement | Evidence |
| --- | --- |
| Random and manual choices share eligibility | New cross-module matrix composes real war normalization, ownership pool, planet selector, mission context, engine and snapshot capture. 240 scenarios: four freshness/source modes × three factions × ten difficulties × two campaign fixtures. Every suggested identity is checked through manual and deterministic random selection, including no-repeat rerolls. |
| Defense enemies are not human owners | Synthetic human-owned defense rows resolve each of the three attacking factions through real normalization/context. Bundled context deliberately loses defense authority. |
| No fake exact live missions | All matrix pools retain `exactLiveAvailability: false` and partial coverage; cached/stale/bundled context remains unconfirmed. These tests use synthetic fixtures, not actual game operations. |
| Owned/enabled planet choices cannot be bypassed | Disabled, conflicting and removed target planets are rejected through both the shared planet selector and mission context, even when the selection object supplies stale favorable metadata. |
| Confirmation isolation | Every catalog identity is tested with explicit confirmation and rejected after planet, difficulty or event-scope changes. Unchanged refresh and cache transition preserve the shortlist; expiry blocks reuse without deleting the stored record. |
| Empty lists remain explicit | An empty confirmed list survives transfer and continues blocking rolls; only an explicit reset restores suggestions. |
| Scores/history/imports remain intact | All60 catalog identities roundtrip through browser transfer and native import parsers, with exact historical metadata, explicit scoring family and unchanged recorded score. This does not recalculate scoring or assert benchmark balance. |
| Optional UI stays accessible | Prior clean-panel source282+18 restart and window144 checks verify recovery links, Armory relocation, native keyboard custom entry/return and small-window reachability. Those are prior evidence, not rerun window tests this session. See `CLEAN_MISSION_PANEL.md`. |

New file: `test/mission-acceptance.test.js` (eight integration tests).
Focused log: `.test-data/mission-acceptance-focused-final.log`.
Full run: `.test-data/mission-acceptance-units.log` — **658 tests passed**, plus CSP,
item catalog and asset checks;247 local picture references, zero missing, seven
preexisting placeholders elsewhere.

The first focused attempt constructed an entirely inactive snapshot. The normalizer
correctly rejected it before selection. The fixture now includes a separate eligible
planet to test rejection of the inactive target in an otherwise valid snapshot.
No production change; failed log retained at `.test-data/mission-acceptance-focused.log`.

Existing `mission-clean` EXE and ASAR hashes match the accepted artifact report;
ten bundled mission/planet source files (including index.html) match current source.
No rebuild is needed for test/docs-only changes. Fresh packaged run:
`.test-data/packaged-smoke-1789964872740/report.json` — passed278 workflow,
13 restart,7 normal/fullscreen startup,33 controlled-network and5 cache-restart
checks, plus14 mission-lifecycle checks recorded separately under
`written.missionLifecycle`. Timer expiry, failed-save feedback, stale drafts and
finalized-history preservation were exercised in the real packaged renderer.
Exclusive isolated software-rendered runs exited gracefully; no force kill.
Native file dialogs were stubbed; this was not a new installation or long soak.
Previously passed clean-panel transfer/security/window suites are supporting
evidence only, not newly rerun suites. Final check: Desktop target unchanged,
only installer-shell and mission-clean in dist, installed ASAR unchanged,
no remaining Electron/app test processes or test lock.

## Known gaps, classified

- **Catalog completeness, nonblocking for map foundation:** current revision
  `review-2026-09-20-b` contains60 identities,33 suggested and27 confirmation-only.
  Counts are code facts, not a claim that the game has exactly60 mission types.
  Existing research records leave Destroy Spore Lung and Eradicate Illuminate Forces
  duration/context unresolved. Unreviewed events and retired expeditions must not
  be silently enabled. No new game-source verification was performed in this audit.
- **Availability, permanent product limitation unless a supported source changes:**
  the current service supplies campaign context, not the player's exact ship
  operation. Keep short suggestion/confirmation labels. Explicit custom observations
  remain scoped to the selected context and do not rewrite catalog facts.
- **Mission scoring:** specific identities retain legacy scoring families. Solo
  scoring and historical snapshots remain separate; no hidden score rebalance here.
- **User/OS acceptance:** clean-panel appearance is available for owner review.
  Physical Windows scaling, screen-reader coverage, actual sleep/resume, audible
  sound, long-duration stability and separate clean Windows install/uninstall are
  not certified by these deterministic/isolated checks.
- **Release gates:** artwork rights, signing and remaining release/security review
  are not cleared by passing mission tests. Nothing published.

## Exact next task — M6 map data foundation

Implement a pure, tested map-view model before adding gestures or a new window:

1. Read the current API schema before adding an all-planets metadata source. Current
   campaign snapshots only contain campaign planets; they cannot supply all inactive
   galaxy context or justify guessed Major Order highlights.
2. Join display metadata by stable planet ID. Only the existing campaign snapshot,
   ownership pool and `HD2PlanetSelection.selectPlanet` decide roll/select eligibility.
   Inactive metadata must never add a playable planet to that pool.
3. Use finite supported coordinates; missing positions stay available through the
   accessible text list. Do not invent geographically accurate positions for bundled
   legacy planets. Keep freshness labels and future offline metadata provenance.
4. Planet clicks supply identity through the same current-pool validation used by
   manual selection. Mission context remains `HD2MissionContext.forPlanet`; do not
   create a map-specific mission engine or infer availability from names/biomes/MO prose.
5. Next slices: original SVG rendering, pan/zoom with page-pan separation, details
   and search, shared select→mission flow, then sequential isolated GUI/packaged QA.

Source, user saves, the actual installed baseline, accepted Desktop preview and
existing recovery archives are preserved. No version bump, commit, push or tag.
