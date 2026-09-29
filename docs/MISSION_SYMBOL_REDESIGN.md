# Original mission symbols — September 18, 2026

Branch: `codex/mission-symbol-redesign`.

The owner requested recognizable original artwork instead of the existing thin
outline symbols. All sixteen SVGs now use the `tactical-v2` design: mostly solid
yellow silhouettes with generic mission objects, negative space and distinct
compositions. Missile, evacuation group, hard drive, stronghold, bunker,
transmitter and drill replace the earlier depictions. Custom missions use a
clipboard with a plus sign. These are not official Helldivers 2 mission icons.

No game extraction, tracing, downloaded path data or third-party icon pack was
used. See `assets/missions/ORIGIN.md`. Recognizable subject matter is the aim,
not an assurance that similarity avoids copyright; no legal clearance is claimed.
Existing artwork/release permission gates remain separate.

The same sixteen paths and mission mapping remain. No mission eligibility,
catalog facts, scoring, save schema or labels changed. Tooltips identify the
images as original mission symbols. Everything remains local/offline.

## Source verification

- 557 unit tests, CSP, catalog and asset validators passed.
- Source workflow: `.test-data/electron-smoke-1789788424751/report.json`;
  140 workflow and 16 separate-process restart checks, plus mission lifecycle
  and controlled-network phases.
- Window checks: `.test-data/window-smoke-1789788490266/report.json`, 108 passed.
  Added a temporary test-only contact sheet with all 16 symbols at 32/48/56 CSS
  pixels, captured and removed before continuing the usual window suite.
  Contact sheet and mission-picker screenshots visually inspected.
- Existing full-name accessible buttons, keyboard selection, small-window
  controls and browser-responsive behavior remain tested.

## Packaged verification and handoff

- Unsigned Setup/ZIP in `dist/mission-symbols`; ZIP and NSIS contents, notices,
  production fuses and 433 source/29 embedded comparisons passed.
  `.test-data/mission-symbols-artifact-inspection/report.json`.
- Installer SHA-256:
  `0b3328927f3d59abaf1fd2651c859b300d0d2e1342c0cc35c395be99d6c6eb6f`.
  Packaged ASAR:
  `79b42da307bdd9bcb984beffd9be302b2fa52110967f9cde2507536ec5641fa8`.
- Actual packaged EXE: `packaged-smoke-1789788692650`,
  136 workflow, 11 restart, 7 normal/fullscreen, 33 network, 5 cache-restart
  checks, plus mission lifecycle. Transfers: `packaged-transfer-1789788760100`,
  28+6. Security: `packaged-security-1789788779713`, 44.
  All GUI phases isolated, sequential, software-rendered and gracefully exited.
- Defender scan reported no threats, npm audit zero known vulnerabilities.
  Neither establishes a guarantee of safety.
- All sixteen SVG files differ from the previous Desktop ASAR. The first
  read-only comparison command used forward-slash ASAR member paths on Windows
  and failed lookup; repeating with native member paths passed all16.
- Existing Desktop shortcut backed up and retargeted to
  `scripts/start-mission-symbols-review.cmd`; same isolated owner-review saves.
  107 old planet-preview files archived/hash-verified under
  `.test-data/accepted-builds/planet-art`; manifest records recovery.
  No permanent deletion or Desktop duplicate.
- Installed ASAR still
  `f8e05a940da3f200796e7dac55b4166458b7e5c18549726c63e665d7ebcc37e0`.
  Personal saves untouched; native installer not executed.

## Remaining limits

These checks do not validate physical Windows DPI/multi-monitor behavior,
audible playback, long-duration stability or a clean native install/uninstall.
No new public release, version increment or permission request is part of this
task. The personal installation and saves must remain untouched.
