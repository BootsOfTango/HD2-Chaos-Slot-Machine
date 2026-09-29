# M5 — First integrated mission interface

September 16, 2026; branch `codex/mission-interface`. Local source implementation, not a packaged candidate or owner acceptance.

## Implemented

- New `assets/mission-ui.js` / `.css` connects the existing mission catalog, context adapter, selection engine and persistence into Spin. Catalog JSON is bundled/local; no network dependency for first-launch suggestions.
- Confirming the planet selects a specific compatible mission. The same pool drives the dropdown and mission roulette. Rerolls exclude the current identity when alternatives exist; no fabricated default is returned for an empty pool.
- **Play this** finalizes the recommendation and reveals the seed; it does not start/control Helldivers 2. Existing scoring still uses its exact legacy category. Specific identity, provenance, scope and duration are captured separately in `cards[].missionSelection`.
- **Match my in-game operation** is a collapsible checklist. Catalog rows outside suggestions are marked as overrides requiring an in-game observation. Players can add a missing/event mission with name, optional duration and an explicitly chosen legacy scoring category. This does not edit global catalog facts.
- Custom names use DOM text nodes, not HTML. UI requires a scoring family before confirming a custom choice; imported unscored custom entries can be assigned one in the checklist. No implicit score is inferred from duration.
- Empty confirmed operations remain empty. Invalidated saved operations require explicit reconfirmation or **Use suggestions instead**, not silent fallback. Draft checklist context is checked again at commit to prevent a stale draft leaking to another planet/difficulty.
- **Change planet (keep equipment)** reopens planet selection without re-spinning the loadout or consuming equipment reroll allowances. This is also an escape route when event context has expired or a planet becomes unsuitable.
- Context revalidation runs on renderer refresh, war-service notifications, focus/visibility/resume/reconnect inputs and the adapter's next event/freshness deadline. Unfinalized incompatible recommendations clear; finalized mission snapshots/Results are retained. Seed-animation completion revalidates before locking a recommendation.
- The interface labels suggestions, partial catalog coverage and dated cached/bundled uncertainty. It does not claim the player's exact mission list is live from the game. Unknown contexts and empty pools require player action instead of invented availability.
- Saved Results retain identity separate from `mode`; a mission detail line uses the historical name with legacy fallback. Existing scoring, ranking and comparisons continue using the original mode/stat fields.
- Narrow protocol allowlist additions: two local scripts, one CSS file, mission catalog JSON. Inline CSP hash regenerated without relaxing policy. Local catalog failure blocks the new mission recommendation controls but not equipment generation.

## Important limitations

The catalog remains the five-identity reviewed seed from `M5_MISSION_FOUNDATION.md`, including one confirmation-only Illuminate variant. Blitz, Rapid Acquisition and many regular/event missions still need source review. These can be entered explicitly in a player-confirmed checklist, but this is **not catalog completeness** or a finished M5 release gate.

The new checklist has native controls and page scrolling. A screenshot was inspected for readable labels, custom-entry fields and safe text rendering; it does not prove all physical display scaling, keyboard/screen-reader or small-window acceptance. Real OS suspend/resume and wall-clock event-boundary behavior of the new UI were not exercised. The underlying context module has deterministic expiry/start tests; the new scheduling/lifecycle callbacks are wired but need expanded integration coverage before release.

Older save/export compatibility remains per `M5_MISSION_PERSISTENCE.md`. Current equipment spins are still not persisted across restarts; operation preferences and created Results are. A new run revalidates a restored operation scope before use.

## Evidence

- **527/527 units**, CSP/catalog/assets pass: `.test-data/mission-ui-final-unit.log`. New UI behavior is covered in renderer tests rather than counted as new unit cases. Asset totals unchanged: 247 local references, zero missing, seven prior placeholders elsewhere.
- Final source workflow **105**, network **33**, restart **16**: `.test-data/electron-smoke-1789614597973/report.json`. Includes first-launch offline mission identity, explicit partial/offline labels, empty shortlists, custom-score requirement, hostile-looking custom text rendered safely, manual/random parity, difficulty invalidation, low-difficulty empty pool, return to suggestions, Change planet preserving equipment/rerolls and Result identity separate from scoring. Existing Spin, locks/rerolls, Results/scoring, Compare, Armory, Rank and import/export still pass.
- Source renderer transfers: desktop **48 + 9 restart**, browser-path **39 + 9 restart**, `.test-data/transfer-health-1789614465717/report.json`. Both paths load the local catalog/UI offline. Covers mission metadata/import/restart/reset; desktop visual fixture also checks a finalized snapshot remains unchanged after context changes. Browser mode is real localStorage inside isolated Electron without preload, not a standalone browser-vendor test.
- Screenshot inspected: `.test-data/transfer-health-1789614465717/mission-checklist.png`. Synthetic visual equipment is used because the transfer fixture intentionally imports an excluded-only primary pool. This screenshot does not prove that excluded gear can roll.
- Earlier visual-fixture attempt `.test-data/transfer-health-1789614426171` stopped on a setup assertion: its normal loadout generator could not supply the expected usable fixture after the exclusion import. Graceful `will-quit`, absent process 3972 and released test lock were checked. Harness changed to explicit synthetic visual gear, without changing app eligibility; fresh-profile rerun passed. Do not count the failed attempt as a pass.
- Renderer security **44 desktop + 44 browser-path**: `.test-data/renderer-security-1789614576359/report.json`. CSP intentionally blocked the injected test frame. No security-policy relaxation.
- GUI suites ran sequentially, software-rendered, with exclusive test locks, isolated profiles and graceful exits. No force kill; final lock absent. Runtime edits were held until each GUI suite completed. The final instructional HTML copy now describes Play this before player confirmation; no scoring/script change in that copy edit.

No packaged/new-EXE/native-installer test in this slice. No installation, personal saves, Desktop copies, artifact deletion, version increase, commit, push or publication. Existing `dist/armory-browser` review and `dist/installer-shell` installed baseline remain unchanged.

## Next

1. Expand/review the mission catalog, especially normal objectives, Blitz restrictions, Rapid Acquisition and faction/event-specific variants. Keep unresolved facts explicit; do not infer operation availability from MO prose.
2. Extend integrated UI tests for timer boundaries, stale draft/event transitions, keyboard/small-window reachability and mission detail display across Results views. Include save-failure feedback and confirmed custom missions on restart.
3. Build and launch one local M5 candidate after those gates, keeping the accepted baseline and archiving the superseded review only after verification. Then obtain owner feedback.

M6 map, M7 full integration, separate Windows clean-install/uninstall, physical display testing, signing/artwork-rights and final publication approval remain open.
