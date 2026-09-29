# One-run owner acceptance — September25

## Current checkpoint — September29

**Automated route passed; owner reports the basic hands-on route works.**
September29 follow-up: owner replied **"works next"** to the three-step checklist.
Basic owner-reported acceptance is recorded; no issue was reported. This does not
independently verify a full real-game session, every sound/DPI scenario, live-map
accuracy, native file pickers or clean install/uninstall. Older unreported fields
below describe the prior checkpoint, not a new request to repeat basic acceptance.
Current Desktop shortcut was read back and confirmed as
`scripts/start-card-rules-review.cmd`, using the existing owner-review profile.
The historical targets below are superseded. No personal profile was used by
these tests, and no Desktop/installation/save changes were made.

Fresh checks of the actual accepted `dist/card-rules` EXE, Electron44.4.5:

- Workflow333 + restart16 + normal/fullscreen startup9 + controlled network33 +
  offline cache restart5 pass: `.test-data/packaged-smoke-1790710700746/report.json`.
- Transfer31 + restart7, plus3 real backend export/import/load checks pass:
  `.test-data/packaged-transfer-1790710795926/report.json`.
- Card rules25 + restart6 and byte-exact recovery-copy verification pass:
  `.test-data/packaged-smoke-1790710804010/report.json`.
- Fresh EXE and ASAR hashes match the accepted card-rules delivery. All test app
  processes exited gracefully; tests ran sequentially with software rendering,
  the shared safety lock and separate synthetic profiles. Saved-card sector panel
  and card-rules dialog screenshots were visually inspected.

Coverage includes rolls/map/mission eligibility, guided review/final save,
locked numbers with editable comments, restart persistence, export/import,
deferred/confirmed scoring updates, stale-review refusal and recovery copy.
Controlled API fixtures do not prove current live-game agreement. Audio-device
initialization is not an audible listening test. Native file-picker interaction,
installer/uninstaller, physical DPI and a real game session were not exercised.

### Route given to owner (basic acceptance now reported)

1. Use the existing Desktop shortcut. Spin, listen, lock/reroll and choose a planet
   on the map. Note awkward controls, unreadable text or missing images.
2. After a real solo dive, enter results, review and save; add a comment. Do not
   enter fake results into personal history just to test this.
3. Close normally and reopen. Confirm that card, score and comment remain.

Report which steps you tried and any issue; a general "looks good" is not assumed
to certify untested steps. No need to apply card-rule changes to real history for
acceptance: that destructive path was tested only on synthetic copies. Real
recalibration still requires reviewing the listed changes and explicit consent.

---

September28 update: the owner said "good" after the yellow missions/Meltagun
delivery and later "looks good so far." Positive general feedback is recorded;
it does not establish completion of a real dive, audible sound/DPI checks or
card/comment restart verification. Current Desktop target and hashes are in
`PROJECT_STATUS.md` (`yellow-missions`). Earlier target statements below are
historical; the feedback checklist remains open where no specific result was given.

September27 owner feedback: "all looks good" with a specific request to improve
saved-card sector visuals (plain dots lacked useful context). Work is recorded in
`CARD_SECTOR_DETAIL.md`. This is positive general feedback, not itemized evidence
for physical sound/DPI, a completed real solo dive, or clean-install acceptance.
Do not mark those unreported checks passed by inference.

September27 delivery update: the same Desktop shortcut now opens the verified
`runtime-patch` preview (Electron44.4.5), retaining the same review profile and
clean weapon thumbnails. The route below still awaits owner feedback; automated
passes do not mark it accepted. Original September25 baseline below is historical.
See `RUNTIME_PATCH_44_4_5.md` for current hashes and test evidence.

Status: **awaiting owner test**, not passed. Existing Desktop shortcut targets
the accepted `fan-notice` preview and its existing owner-review profile.
No new build, installation, settings change or save modification for this task.
ASAR: `dbfab97cfd7ffec91ae6d07baee9e89f2e5bcd2df83533da63a4fcfa64e5d593`.

## Short hands-on route

1. Open the existing Desktop shortcut. Dismiss **Just for fun** with **Let’s dive**.
   Confirm it is readable and does not get in your way.
2. Spin a loadout. Listen to the enabled spin sound. Lock one equipment slot and
   reroll an unlocked slot; check the locked equipment stays unchanged.
3. Open the planet map. Drag starting on a planet, then click without dragging.
   Inspect weather/activity and select an eligible planet. If the game is open,
   compare that same planet's faction/conditions and record discrepancies with
   the app's displayed update time. Community reports are not guaranteed
   second-by-second game state; mission suggestions are not an exact operation.
4. Play a solo dive if convenient, then record its real results through the guided
   card questions. Review carefully before final save: numbers and the original
   note become locked. Add a comment and inspect the radar/planet visuals.
   Do not save fabricated results into your normal history just for this check;
   an isolated synthetic test can be prepared separately if preferred.
5. Close normally and reopen. Check the saved card/comment are retained and the
   startup notice returns. Report any confusing labels, tiny text, missing images,
   unexpected score, missing sound or difficult control.

Owner may pause at any point. No required full-game session or changes to Windows
display/security settings. Fullscreen behavior was previously owner-approved;
this checklist does not reopen that approval or substitute for physical DPI,
clean-install/uninstall, long-duration stability or rights/release gates.

## Feedback record

- Startup: not reported
- Sound/lock/reroll: not reported
- Map interactions/in-game comparison: not reported
- Guided entry/card readability: not reported
- Restart/card/comment: not reported

Next: record the owner's actual observations, fix one reproducible issue at a
time, and rerun targeted regression checks. No public publication authorized here.
