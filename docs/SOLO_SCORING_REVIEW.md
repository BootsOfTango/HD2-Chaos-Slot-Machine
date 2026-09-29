# Solo performance scoring — September 19, 2026

Branch: `codex/solo-performance-scoring`. Owner approved implementing the
six-axis radar and matching ranking before the guided card-entry wizard.
Existing source/user work preserved; no publishing or personal-installation work.

## Fixed starting rules (Solo version 1, explicitly a local preview)

- Firepower = kills/minute /20 *100.
- Precision = entered accuracy percentage.
- Survivability =100 -25*(deaths*10/minutes). This is survival, not damage absorbed.
- Speed =100*(1-minutes/mission time limit) for success, zero for failure.
- Utility =completed/available side objectives *100. Zero available =N/A,
  omitted from average. Unknown total =unranked.
- Mission =100 for completed, zero for failed. Extraction is separately displayed.
- All axes bounded0–100; rating is equal-weight arithmetic mean of applicable
  axes, not polygon area. Two-decimal stored ratings, one-decimal UI.
- No samples, stim/death flat deductions, distance/shot/stratagem bonuses or
  Major Order multiplier. Deaths affect Survivability only.

Firepower/Survival/Speed thresholds are transparent provisional design choices,
not empirically calibrated or verified game-balance targets. Accuracy and kills
cannot measure heavy-enemy contribution, weapon-specific damage, true tankiness
or causal equipment quality. The owner must review balance before release.

## Identity, persistence and comparison

New cards carry `soloScore.version=1`, input minutes/available count/main outcome
and an immutable finalized result snapshot. The existing normalized stat
snapshot supplies kills/accuracy/deaths/completed count. Main mission is not
Major Order success. Unknown fields may be saved, but remain permanently
unranked under the existing lock policy; this is explicitly warned before save.
Invalid/impossible values cannot be finalized. Comments do not affect scores.

Exact comparison groups: difficulty, faction, mission identity/name, time limit
and available objective count. Success first, then rating, deterministic ID
tie break. Both successes/failures retained. N/A-utility runs have their own
groups. Up to100 rows displayed per group; loadout success history uses all
eligible runs in that group with matching equipment names/slot order.

Finalized Legacy score fields/grade are captured/restored without translating
them to Solo ratings. New cards cannot change legacy kill-target calculations.
Unfinalized older cards may explicitly choose new Solo scoring. Results show
both systems with a filter/labels; Rank defaults to Solo with a Legacy toggle.
Existing Compare, totals and derived equipment analytics remain Legacy-only.
Solo mini-radars are side-by-side within each Rank group; the old Compare tab
does not pretend old and new formulas are comparable.

The transfer validator rejects unsupported versions, malformed inputs and
inconsistent locked results; new data round-trips in export/import. No saves
are sent externally. Do not downgrade to older apps which lack these fields.

## Scope and remaining work

Three necessary inputs were added to the existing form. The larger/compact
card redesign, step-by-step entry window and review workflow remain next,
not claimed complete here. Physical Windows DPI, native fresh install/uninstall,
audible sound, long stability, benchmark calibration and public release remain
unverified/deferred. Builds unsigned. Test evidence is appended after validation.

## Regression discovered during packaged transfer verification

The initial packaged import run passed its 29 write checks, then failed exact
restart parity (`packaged-transfer-1789792885575`). Comparing the isolated
saved payloads located three Legacy bonus fields whose explicit zeros had been
replaced with difficulty/extraction/objective bonuses by `normalizeCardRecord`.
The stored Solo result itself was unchanged. Replaced truthy fallback with
nullish fallback so explicit zero values remain zero. Kept the exact-payload
restart assertion as the regression gate. The failed test exited gracefully;
its PID was absent and exclusive test lock released before further GUI work.

## Final verification and handoff

- `solo-score-unit-final.log`: 577 units, CSP/catalog/assets passed after fix.
- `electron-smoke-1789792154442/report.json`: source 153 workflow +17 restart,
  plus controlled mission/network coverage (before final normalization fix).
- `window-smoke-1789792437632/report.json`: 118 layout/interaction checks;
  inspected Solo rank, finalized radar and 640x480 entry screenshots. An earlier
  screenshot exposed a hidden Legacy MO badge still styled visible; corrected
  with an explicit hidden selector and computed-style regression. Final radar
  screenshot visually verified. This suite predates final zero-default fix.
- Final `packaged-smoke-1789793147755/report.json`: 149 workflow, 12 restart,
  7 normal/fullscreen startup, 33 controlled network, 5 cache restart checks.
- Final `packaged-transfer-1789793116095/report.json`: 29 transfer +7 restart.
- Final `packaged-security-1789793133788/report.json`: 44 security checks.
- GUI suites isolated, exclusive, software-rendered, graceful shutdown; no
  force-kill or Windows/driver/security changes. Network mocks do not certify
  actual service uptime. WebAudio initialization is not an audible sound test.
- `solo-score-artifact-inspection/report.json`: 436 bundled source files and
  29 embedded notice/source files compared, ZIP/NSIS payload checks and fuses.
  Native installer **not executed**. Final installer SHA-256:
  `85f8669d166a20873c53c77c6c3bf30ee9519803b606c7d32d0cf6dd1a0a33db`.
  ASAR: `ef37cf38ef4a8389a53705befd500cd82cb8ee3cc2bedbfc03116bdb68d63fbe`.
- `solo-score-defender-final.log`: no threats found. `solo-score-npm-audit.json`:
  zero known dependency vulnerabilities. These are not absolute safety claims.

All evidence paths above are under `.test-data/`. Installer and portable ZIP are
in `dist/solo-score/`, with SHA-256 sidecars. Desktop shortcut now uses
`scripts/start-solo-score-review.cmd` and the existing isolated
`.test-data/mission-owner-review` profile. No extra Desktop copies. Previous
107 runtime/build files were hash-verified and moved to
`.test-data/accepted-builds/mission-lines`; adjacent move manifest and shortcut
backup `.test-data/desktop-solo-score-shortcut-20260919-004652` preserve recovery.
Installed baseline and personal saves remain untouched; no public release.
