# Guided card entry — September 19, 2026

Branch: `codex/guided-card-entry`. Owner requested the guided edit-card work
after the Solo radar/ranking implementation. No score formula or save-schema
change, version bump, publication or personal installation changes.

## Behavior

- Opening an unfinished Result automatically opens a focused in-app dialog,
  not a second OS process/window. Solo cards have 13 short steps: kills,
  accuracy, deaths, stims, shots, completed objectives, stratagem uses,
  distance, decimal minutes, available objectives, mission outcome,
  extraction, optional run note. Legacy cards retain their Major Order step
  and can explicitly opt into Solo scoring from the first step.
- Large number fields and colored question labels; Next/Back, Enter for
  numeric fields, normal multiline Enter in the note. Back retains valid
  draft answers. Choices have explicit pressed states and descriptive labels.
- Cancel, header Cancel, Escape or closing the dialog discard the unsaved
  draft, not the existing card. No partial wizard data is persisted. Explicit
  opt-in to Solo scoring is separate from numeric entry; it is not undone by
  cancelling the subsequent entry session.
- Required numeric entries cannot be blank, negative, nonfinite or unsafe
  integers. Counts require whole numbers; accuracy <=100, minutes >0 <=240,
  objective counts <=100 and completed <=available. Note optional <=10,000
  characters. All answers are validated again on review/save. Imported
  incomplete historical scoring context can still be unranked under the
  existing Solo engine; this workflow does not invent context.
- Review lists every answer with an Edit button; edits return straight to
  review, with acknowledgement reset. A permanent-lock warning and explicit
  checkbox precede Save & lock. Existing finalization/persistence guards
  freeze stats, outcomes and original note; comments remain available.
- Finalized cards never reopen the wizard. Readable summary and note, with
  collapsed Loadout & planet and All recorded numbers. Existing legacy-form
  form remains available through first-step Card options → View details &
  comments, preserving access to unfinished-card deletion/comments and the
  existing form. Guided entry remains the default on reopening an unfinished
  card. This small access link was added after the initial window screenshots;
  its visibility/functionality is checked by the final packaged workflow.
- All player text uses DOM textContent/value; no player-supplied HTML.
  New local JS/CSS are allowlisted by the secure app protocol.

## Verification

- Initial source integration: `electron-smoke-1789793613728/report.json`,
  164 workflow +17 restart, including default guided path, cancellation,
  invalid input, review editing, acknowledgement, locked note and comments.
  The final harness also retains a wizard-finalized card across restart;
  packaged evidence below is the final regression gate for that addition.
- `window-smoke-1789793693908/report.json`: 123 checks. Inspected screenshots
  `solo-entry-640.png`, `card-review-640.png`, `solo-result-1280.png`.
  Narrow-window input/review controls reachable, Escape cancels draft, prior
  keyboard/focus/fullscreen/desktop-panning/browser-responsive tests retained.
  Emulated page zoom is not a physical Windows scaling test.

Evidence paths are relative to `.test-data/`. Final package checks and Desktop
handoff are recorded after completion. Native installer execution, actual
Windows display scaling, audible listening and long-duration stability remain
unverified for this candidate. Builds remain unsigned local previews.

## Final packaged verification and Desktop handoff

- `card-entry-unit-final.log`: **584** unit tests, CSP/catalog/assets pass.
- Final window `window-smoke-1789794085921/report.json`: **123** checks,
  including Card options present in the final entry screenshot; visually
  inspected `solo-entry-640.png` again. Earlier screenshots retained.
- `packaged-smoke-1789794136149/report.json`: **162 workflow +13 restart
  +7 normal/fullscreen +33 controlled network +5 cache restart**. Guided final
  save persists the edited kills value, exact Solo snapshot, literal note and
  follow-up comment. Back, cancellation, invalid input, review editing,
  acknowledgement and access to unfinished-card options are exercised.
- `packaged-transfer-1789794225677/report.json`: **29 transfer +7 restart**.
- `packaged-security-1789794240034/report.json`: **44** security checks.
- `card-entry-artifact-inspection/report.json`: **438 source files /29
  embedded notice/source files**, ZIP/NSIS payload/fuses/identity checks.
  Installer inspected only, **not executed**. SHA-256:
  `5eb80c03bf34f5e556e545038e9a7419d022fdbe3ae871bb7a434be56e3f6467`.
  ASAR: `bff6ac52941dd2a47eee7dd9421deb41733359efee1eb0a312ca46d48eacb3b0`.
- `card-entry-defender.log`: no threats. `card-entry-npm-audit.json`: zero
  known dependency vulnerabilities. Neither proves absolute safety.

All GUI suites exclusive, isolated, software-rendered and gracefully closed.
Controlled network cases do not prove external API uptime; WebAudio checks
are not listening tests. No OS/driver/protection changes.

Desktop shortcut now targets `scripts/start-card-entry-review.cmd`, using
the same `.test-data/mission-owner-review` profile. Installer and ZIP remain
in `dist/card-entry/` with checksum sidecars, not duplicated on the Desktop.
107 superseded Solo build files moved/hash-verified to
`.test-data/accepted-builds/solo-score`, with adjacent recovery manifest and
`.test-data/desktop-card-entry-shortcut-20260919-010418` shortcut backup.
Installed baseline and personal saves unchanged; nothing published.
