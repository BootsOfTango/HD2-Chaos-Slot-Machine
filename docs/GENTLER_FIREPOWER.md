# Gentler Firepower — September 19, 2026

Branch `codex/gentler-firepower`. Owner accepted the proposed gentler curve
and applying it to existing Solo cards while preserving entered numbers/notes.
This supersedes the v1-only freeze for this explicit one-time tuning decision;
it does not authorize future silent score rebalancing. Legacy cards unchanged.

## Rule and migration

- Solo engine version 2: `100 * sqrt(min(killsPerMinute / 20, 1))`.
  Zero stays zero, 20+ kills/min stays 100; old 19.7 becomes 44.38 (44.4 shown),
  old 40 becomes 63.25 and old 80 becomes 89.44. Use unrounded entered rates,
  not the already-rounded v1 Firepower, when calculating the new value.
- Other five axes, comparison context, success-first ranking and equal-weight
  arithmetic average unchanged. Overall rating and positions can rise.
- New cards use version 2. Loading/importing valid version-1 Solo cards
  upgrades a cloned candidate once and marks the prepared load as migrated
  for normal durable saving. Original finalized result retained under
  `soloScore.originalResult`, including all original axes and overall rating.
  The current result/derived grade are updated, never the entered stats,
  locked stat snapshot, scoring inputs, original note, comments or dates.
- Version 1 and 2 remain readable; unsupported versions fail closed. Both
  current and retained original results are validated against locked inputs.
  Damaged original snapshots cannot migrate. Missing inputs stay unranked;
  pending cards get the new version without fabricating a finalized result.
- Reopening/reimporting v2 is idempotent; the curve does not compound. Original
  results survive exports and are disclosed inside Scoring. Existing Legacy
  snapshots are untouched. Do not open new v2 saves with old previews.
- Includes the previously tested tidy-card UI pending on Desktop; no further
  changes to guided entry, catalog, planets, mission rules or application
  release version. Benchmarks remain provisional, not empirical game balance.

## Source verification

- `firepower-unit.log`: 591 tests, CSP/catalog/assets pass; approved examples,
  zero/cap, unchanged other axes, exact input/note/comment preservation,
  repeated migration, corrupted snapshots, unranked/pending/Legacy behavior,
  export recovery and future-version rejection covered.
- `electron-smoke-1789795736542/report.json`: 169 workflow +18 restart,
  including real renderer startup preparation, migration-needed signal,
  input payload unchanged and idempotent preparation of adjusted cards.
- Initial window test `window-smoke-1789795870170` inspected a background
  Rank SVG rather than the open card. Failure screenshot visibly showed
  44.4 correctly. Corrected only the selector scope. Exact PID 25196 was gone,
  shutdown diagnostics had will-quit, and exclusive lock was absent before
  rerunning. No force-kill or app workaround.
- `window-smoke-1789795921890/report.json`: 130 checks passed. New card radar
  shows 44.4 and Scoring discloses retained 19.7. Existing tidy/guided/small
  window/fullscreen/focus/panning/browser-responsive tests retained.

All evidence paths are under `.test-data/`. Final package and Desktop handoff
evidence appended after completion. Native installer execution, physical DPI,
audible sound and long-duration stability remain unverified for this build.

## Final packaged checks and handoff

- `firepower-unit-final.log`: 591 tests, CSP/catalog/assets passed.
- `packaged-smoke-1789796151826/report.json`: 165 workflow +13 restart
  +7 normal/fullscreen +33 controlled network +5 cache restart checks.
- `packaged-transfer-1789796122219/report.json`: 31 transfer +7 restart.
  Real transactional v1 import: original Firepower 19.7 retained, current
  Firepower 44.38, other axes/input/note unchanged, current rating 65.73;
  exact entire committed payload survives process restart.
- `packaged-security-1789796136959/report.json`: 44 checks.
- `firepower-artifact-inspection/report.json`: 438 source /29 embedded
  notice/source comparisons, NSIS/ZIP/fuses checks. Installer inspected,
  **not executed**. Installer SHA-256:
  `c14743da17d863ccffd0a8b896d5ad613addb7eb54680307e3ac730b280cfbb4`.
  ASAR: `47b19c04a3fc1445d4a8e8e4ba0928b10fcbc75f525fb81c389c451aaf050d3c`.
- `firepower-defender.log`: no threats. `firepower-npm-audit.json`: zero known
  dependency vulnerabilities. Neither is an absolute safety guarantee.

All GUI suites sequential, isolated, software-rendered, gracefully closed;
no force-kill or OS/driver/security changes. Network tests controlled rather
than external uptime certification; WebAudio checks are not listening tests.

The prior manual preview was closed before promotion. Raw owner-review save
copied and SHA-256 checked under
`.test-data/firepower-save-backup-20260919-013702/state.json`; original save
not manually rewritten. Existing Desktop shortcut backed up under
`.test-data/desktop-firepower-shortcut-20260919-013702`, then retargeted to
`scripts/start-firepower-review.cmd` using the same review profile. It includes
tidy UI and new scoring. Owner's next launch performs the migration normally.
Archived/hash-verified 107 files each from `dist/card-entry` and `dist/tidy-card`
into matching `.test-data/accepted-builds/` directories with recovery manifests.
No extra Desktop files or permanent deletion; installed baseline unchanged.
No publishing, product version bump or native installation.
