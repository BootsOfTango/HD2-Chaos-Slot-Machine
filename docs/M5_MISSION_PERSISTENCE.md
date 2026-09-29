# M5 — Mission save and transfer support

September 16, 2026, branch `codex/mission-persistence`. Local source implementation; no new installer.

Follow-up: the first mission UI/context integration is now implemented; see `M5_MISSION_INTERFACE.md`. Statements below about unwired UI describe this earlier persistence slice.

## Implemented

- Added shared `assets/mission-state.js` with versioned validation, copy-only normalization, recoverability status and historical selection capture.
- `settings.missionPlanner = { version: 1, confirmation: null | record }` carries the player-confirmed operation shortlist. Missing means legacy/default; explicit null or malformed planner records are not silently replaced with defaults.
- Optional `cards[].missionSelection` stores a historical identity/name/duration/scoring-family/provenance/scope/catalog-revision snapshot. It is not looked up against the current catalog on load. Existing broad `mode` labels and scores remain intact. A supplied non-null scoring family must agree with an existing card's `mode`.
- Browser and desktop load/import/export validators recognize both fields. The renderer now preserves them through prepared imports, ordinary saved payloads, exports and reload. Importing an older file without a shortlist resets that preference instead of retaining an unrelated current operation.
- Clear All explicitly resets the planner to no confirmation, using the existing backup/typed-confirmation flow. It does not recover a discarded shortlist from legacy keys.
- `mission-selection.js` and `mission-state.js` are loaded as local scripts before transfer validation. Added only those exact scripts to the desktop protocol allowlist; regenerated the existing inline CSP hash without loosening the policy.

**The planet-context adapter, mission catalog, timer callbacks and mission UI are not wired into Spin yet.** Current broad-mode rolling still works as before. The newly loaded selection module supports scope validation; that alone does not enable the new mission chooser.

## Record contracts

Confirmations retain the engine's `{ version, catalogRevision, scope, missions }` structure. Choices are either catalog IDs or explicit custom entries. A canonical scope includes planet, resolved enemy, difficulty, campaign and event context; noncanonical/malformed scopes are rejected. Shortlists are bounded at 32 unique entries. Custom names/durations/scoring families and all record fields are bounded/validated; no HTML is rendered by this module.

Validation is structural, not a live eligibility check: an old catalog revision or removed mission ID remains recoverable. The mission engine must reject it for current use or request reconfirmation. Empty confirmed shortlists remain distinct from no confirmation. Unknown custom duration/scoring family remains null rather than being guessed.

Historical snapshots use `{ version, catalogRevision, scope, id, name, minutes, scoringFamily, provenance, ruleConflicts }`. Catalog choices and custom choices have distinct ID namespaces and provenance. Rule conflicts are allowed only for a player-confirmed catalog override. No catalog migration renames old Results or recalculates their recorded stats.

The future UI must require an explicit legacy scoring-family choice or an unscored path for null-family custom missions. This slice only preserves null faithfully; it does not implement an unscored UI or change the existing score calculator. No unfinished equipment/current-spin state is newly persisted—the saved planner contains only the operation shortlist.

The outer save format and internal package version remain unchanged. Legacy saves need no destructive migration. Older application builds may not preserve newly introduced optional fields; do not use an older build to edit mission-enabled saves without a separate export/backup.

## Recovery behavior

- Future versions in planner, confirmation, historical selection or embedded scope raise `UNSUPPORTED_SAVE_VERSION`. Existing native safeguards leave those bytes in place and block autosave/import replacement; no downgrade/quarantine occurs.
- Malformed current-version native data follows the existing recovery path: exact original bytes are copied to recovery before a valid backup is used. If none is valid, loading stays blocked rather than inventing defaults.
- Failed mission imports leave the working save and in-memory data unchanged. Browser quota and desktop commit failures retain existing transactional protection.
- `HD2MissionState.read` reports `missing`, `valid`, `invalid` or `unsupported`; invalid/unsupported results are not writable. It has no storage side effects. Actual browser/native persistence still uses the established guarded save pathways.

## Verification

- **527/527 unit tests**, including 17 new mission-state cases, passed; CSP/catalog/assets passed. Final evidence: `.test-data/mission-persistence-regression-final.log`. An initial recovery test incorrectly mutated its own expected fixture via the save wrapper's shared reference; corrected the fixture copy, not production recovery behavior.
- Native temporary-directory tests exercised actual save/reload/export/import, future-version overwrite protection, exact-byte damaged-save recovery and rejection without backup mutation. Test-owned temporary fixtures were cleaned up; no personal files were used.
- Real source renderer transfer checks: desktop **45 + 8 restart**, browser-path emulation **38 + 8 restart**, `.test-data/transfer-health-1789612912933/report.json`. Tests include new shortlist/Result metadata, malformed/future import rejection, old-import reset behavior, separate-process restart and typed Clear All reset. Browser mode uses real localStorage in isolated Electron without preload, not a standalone browser-vendor test. Native pickers were stubbed.
- Renderer security **44 desktop + 44 browser-path** checks passed, `.test-data/renderer-security-1789612942577/report.json`. The CSP-blocked test frame message is expected.
- Existing source workflow **89 + 16 restart** checks passed, `.test-data/electron-smoke-1789612955399/report.json`: offline Spin, locks/rerolls, Results/scoring, Compare, Armory, Rank, transfers and persistence. WebAudio initialization is not an audible listening test. These still exercise the old broad mission controls, not an unimplemented mission UI.
- GUI tests ran sequentially with exclusive locks, software rendering, isolated profiles and graceful process exits. Runtime source was not edited during a GUI run. Final whitespace check passed.

No new EXE/package test, native installation, personal-profile change, Desktop duplication, release/version increment, cleanup of user artifacts, commit, push or publication. The installed baseline and existing Armory Browser candidate are unchanged. Signing, artwork-rights, physical display acceptance and separate-environment clean-install/uninstall gates remain open.

## Exact next

Implement a bounded mission-selection UI slice: use the context adapter and engine for one shared suggested/manual/random pool, an explicit operation-confirmation checklist, and clear warnings for partial/uncertain/offline context. Schedule local event-boundary/resume revalidation, preserve equipment and locked/history data, and capture mission identity independently from legacy scoring when confirming a Result. Persist the shortlist using this adapter. Expand the source-reviewed catalog before claiming complete coverage. Then test the integrated UI and produce one local M5 candidate—not another duplicate Desktop build.
