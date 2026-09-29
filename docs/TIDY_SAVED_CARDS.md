# Tidy saved cards — September 19, 2026

Branch `codex/tidy-saved-cards`. Owner approved the entry workflow and requested
less text and larger visuals in the saved-card screenshot. This is presentation
only: no score, schema, ownership, history or guided-entry changes.

- Wider saved dialog, larger radar/labels, prominent score, single outcome row.
- Keep Time/Objectives visible; rate details and formulas under Scoring.
- Short Run/Player/Difficulty labels and Loadout/Stats/Note/Comments sections.
- Read-only numbers instead of disabled form controls; duplicate extraction
  controls and inactive Save hidden. Lock status remains visible; Delete keeps
  its existing confirmation. Empty note/comment filler hidden.
- 100x80 equipment thumbnails and larger names; responsive stack in narrow
  windows. Comment input has a short placeholder and Post action.
- Existing locked values, source controls, handlers and data remain intact;
  expanding details must not mutate the card. Legacy extraction retains an
  Unknown state instead of guessing where no choice exists.

Initial visual gate: `.test-data/window-smoke-1789794695549/report.json`, 128
checks. Inspected `solo-result-1280.png`, `saved-loadout-large.png`, and
`saved-stats-comments.png`. Larger radar/thumbnails, hidden redundant controls,
read-only stats, concise comments and no state mutation verified, alongside
existing guided entry, focus/keyboard/window/panning/browser regressions.
Physical Windows scaling and audible sound are not covered by these tests.
Package evidence and Desktop handoff recorded below after validation.

## Final checks

All evidence paths below are under `.test-data/`:

- `tidy-card-unit-final.log`: 584 unit tests and CSP/catalog/assets pass.
- `packaged-smoke-1789794950637/report.json`: 162 workflow +13 restart
  +7 normal/fullscreen +33 controlled network +5 cache restart checks.
  Includes guided entry, final locking, comments, exact saved score/note
  persistence, and existing offline/Results/Rank/Compare/Armory regressions.
- `packaged-transfer-1789795024482/report.json`: 29 transfer +7 restart.
- `packaged-security-1789795038282/report.json`: 44 security checks.
- `tidy-card-artifact-inspection/report.json`: 438 source /29 embedded
  notice/source comparisons, ZIP/NSIS/fuses. Installer inspected, not executed.
  Installer SHA-256:
  `eb0712897716a65a352be3acd80f7be4c5dc3073569908bcd8847d57bca53b3d`.
  ASAR: `9ceb8c3557cbbd7f6ffd4a6e6cc43f04f716ad183cbb1ad77ce6a04ea129bd96`.
- `tidy-card-defender.log`: no threats; `tidy-card-npm-audit.json`: zero known
  dependency vulnerabilities. These do not establish absolute safety.

GUI suites sequential, isolated, software-rendered and gracefully closed;
test lock absent after completion. Network tests are controlled cases, not
live service uptime certification. Native install, physical Windows scaling,
audible sound and long-duration stability remain unverified for this build.

## Pending Desktop switch

The actual old `dist/card-entry` preview remains open. Last read-only check
found PIDs 2040,33004,27296,21084,26572; do not rely on these numbers later
without fresh executable-path checks. Asked the owner to finish unsaved entry
and close it. Existing Desktop shortcut still targets
`scripts/start-card-entry-review.cmd`; **not updated to this candidate yet**.

Prepared, unexecuted `.test-data/promote-tidy-card.ps1` verifies replacement
reports, running-process absence and exact source/archive paths before backing
up/updating the shortcut and moving/hash-verifying the old build. Execute only
once after checking the old runtime is closed. Then update historical launcher
to its archive and record successful handoff. No duplicate Desktop files,
permanent deletion, personal-save edits or native installation this session.
Installed baseline ASAR still
`f8e05a940da3f200796e7dac55b4166458b7e5c18549726c63e665d7ebcc37e0`.
