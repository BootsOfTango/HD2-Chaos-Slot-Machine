# M6 navigation/gesture refinements — September 21, 2026

Branch `codex/galaxy-navigation-polish`. Owner requested a bounded session using
part of the remaining account allowance. **Source only: Desktop stays on the
accepted galaxy-map preview.** No build, version, publication, personal-save or
cleanup changes. Account reset credit was not used.

## Changes

- Reopening the current planet clears only filters hiding that planet. Matching
  search/sector filters remain; no automatic camera movement or run mutation.
- Search accepts straight/curly apostrophes and compatible Unicode forms. This
  affects search only, not stable IDs, identity matching or roll eligibility.
- Horizontal-only trackpad wheel events no longer zoom out; zero-size viewports
  are guarded. Ctrl-wheel uses a bounded smooth zoom factor for trackpad pinch.
- One-finger pan and two-finger pinch use bounded camera geometry, keeping the
  gesture center anchored. Mouse controls and the text-list alternative remain.
- Touch taps inspect planets but cannot bypass eligibility or finalize a run.
  Pinch/drag release suppresses ghost clicks. Cancel, lost capture, window blur,
  hidden document, dialog close and disposal clear gesture state/capture.
- Overlapping markers now use the nearest projected planet center, rather than
  whichever marker is painted last. Unit fixtures and a Chromium touch test
  reproduce the Super Earth/Wayward overlap. This is inspection, not automatic
  planet selection; the shared selector still gates Choose planet.
- Keyboard/programmatic marker activation retains its explicit target because
  such click events do not carry meaningful mouse coordinates.

## Verification and issues caught

- **739 units**, CSP/catalog/local assets passed on final source:
  `.test-data/galaxy-navigation-handoff-units.log`. 247 local pictures, zero
  missing, seven pre-existing placeholders.
- **42 component checks** passed on final source:
  `.test-data/galaxy-view-1789973309096/report.json`. Uses Chromium-generated touch
  events, real mouse/wheel/keyboard input, offline atlas and controlled network
  replies. This is **not physical touchscreen/trackpad testing**.
- Source full workflow/restart passed **292+18** on final source:
  `.test-data/electron-smoke-1789973259484/report.json`. Earlier passing evidence
  is retained separately; final logs are `galaxy-navigation-workflow-final.log`
  and `galaxy-navigation-release-check.log`.
- Native source window suite passed151 at
  `.test-data/window-smoke-1789972940572`. Page zoom is not physical Windows DPI.
  A prior run (`window-smoke-1789972817462`) timed out resizing to640x480 late in
  the Armory checks. It recorded a normal will-quit in its isolated profile and
  no surviving test process/lock. Exact cause remains unproven. Added diagnostic
  bounds/fullscreen/maximized/zoom capture on future resize failure; assertions
  were not weakened. Rerun passed without an app window-sizing change.
- Touch-tap test failures (`galaxy-navigation-touch-final.log` and
  `galaxy-touch-diagnostic.log`) exposed the real overlap issue: target center was
  Super Earth, topmost hit region was Wayward. Picking logic was corrected, not
  the expected planet. Graceful quits and absence of processes/locks were checked
  before reruns. Failure evidence is retained.

## Handoff boundaries

The accepted Desktop ASAR remains
`45f9a3d80095ef1bfb707242ec3d6578e3039f819a347dd8bf101215d0dff93b`.
Shortcut still uses `scripts/start-galaxy-map-review.cmd` and the same owner-review
profile. Active dist remains `galaxy-map` + `installer-shell`; no duplicate files.

These refinements have **not been packaged or installed**. In the current Desktop
preview, use the map's planet list when overlapping markers are difficult to pick.
Next session: read this report and status; obtain owner feedback on the accepted
map; validate/package/promote this small refinement batch under normal cleanup
policy. Physical touch/pinch/DPI, exact game sector geometry, public rights/signing
and separate clean Windows acceptance remain open.
