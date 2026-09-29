# M6 planet conditions and map interaction — September 23, 2026

Branch: `codex/galaxy-planet-conditions`. Local review only; no version bump or
GitHub publication. Includes the previously source-only navigation refinements.

## Implemented

- Planet hover and keyboard list focus show an original thin-line icon, biome,
  source weather labels, retrieval date and an explicit unknown special-activity
  label. The selected-planet panel shows the same data. No per-hover request.
- Validated optional atlas environment metadata survives cache round trips;
  legacy caches remain readable. Newer campaign metadata takes priority over an
  older atlas observation. Missing, malformed and ambiguous `None` hazards never
  mean a verified absence of weather or special activity.
- While the map is open and visible, check both feeds every minute; outside the
  map retain the existing five-minute lifecycle. Closing/hiding/offline cancels
  the inspection timer. Existing deduplication, cooldown, retry/backoff and
  server Retry-After handling remain authoritative. Nothing updates while closed.
- Selected sectors gain original faction-colored approximate cluster shading,
  split by reported faction in mixed sectors. These are not game sector borders.
- Mouse panning can start over a planet, using a five-pixel movement threshold
  to preserve ordinary clicks. Cancel, touch/pinch and keyboard behavior retained.
- No changes to scoring, saves, ownership, planet eligibility or locked runs.

## Data limitations / next provider task

Reviewed primary sources:

- https://helldivers-2.github.io/api/openapi/Helldivers-2-API.json
- https://github.com/helldivers-2/api
- https://github.com/helldivers-2/json/blob/master/planets/planets.json

The current planets response supplies biome/hazards, sector, positions, waypoints,
ownership, campaign/event context and regions. It does not provide verified named
Hive Lord, Jet Brigade, enemy surge, spore-faction or SEAF activity flags. These
requested indicators are **not implemented** and remain explicitly not reported.
Do not infer them from biome, faction, hazard names or Major Order prose.

API metadata is not a live in-mission weather sensor. Retrieved times mean this
app received a community snapshot, not that its contents changed at that time.
One-minute polling does not guarantee second-by-second agreement with the game.
Exact game sector polygons and exact ship mission lists are also unavailable.
Next research: a reviewed public source with stable planet IDs, timestamps and
verified meanings for special-activity codes, before adding those badges.

## Source verification actually run

- 752 final unit tests, CSP/catalog/assets checks passed in
  `.test-data/galaxy-conditions-units-handoff.log`: 247 local pictures, zero
  missing files and seven pre-existing placeholders.
- Desktop safety: 7 + 8 checks, `.test-data/desktop-safety-1790214051016`.
- Map component: 56 checks, `.test-data/galaxy-view-1790214509124/report.json`.
  Includes actual community API observations: 273 planets, 56 sectors, 336
  links and 40 eligible planets; all 273 records supplied biome metadata.
  Hover/keyboard, marker-start dragging, rendered viewport, mixed-faction
  shading, controlled changing weather and disconnect fallback passed.
  One-minute cadence uses a fake clock, not a physical wall-clock soak.
- Source workflow 292 + 18 restart checks:
  `.test-data/electron-smoke-1790214420003/report.json`.
- Source window behavior 151 checks:
  `.test-data/window-smoke-1790214573805/report.json`.
- Rendered live and synthetic-condition screenshots inspected. Synthetic
  Malevelon Creek weather is a labeled test fixture, not a real-server claim.

Early component attempts exposed a hidden-window native-mouse test assumption
(replaced with Chromium input injection), then caught a real missing SVG viewBox
dimension introduced during editing. The viewport was fixed and a four-number
rendered-camera regression added. Failed evidence is retained, all runs exited
gracefully, and the final suite passed. No forced process kills or driver changes.

## Unverified / deferred

Physical touchscreen/trackpad and Windows DPI, audible sound, hardware rendering,
long-running sync stability, clean Windows install/uninstall, special-activity
provider, exact sector borders and saved-card sector thumbnails remain pending.
Saved-card visuals are a separate owner request, not included in this map slice.
Public rights/signing and other release gates remain open.

## Packaged verification and Desktop handoff

Built an unsigned local installer and portable ZIP under `dist/galaxy-conditions`.
Installer/ZIP contents, checksums, embedded payload, notices, hardened Electron
fuses and 456 source-file comparisons passed:
`.test-data/galaxy-conditions-artifact-inspection/report.json`.
Installer and embedded uninstaller were inspected, **not installed/executed**.

- Actual packaged EXE: 290 workflow, 13 restart, 7 normal/fullscreen startup,
  33 controlled network and 5 cached-restart checks passed:
  `.test-data/packaged-smoke-1790215028784/report.json`.
- Packaged imports/exports: 31 + 7 restart checks:
  `.test-data/packaged-transfer-1790215121943/report.json`.
- Packaged renderer security: 44 checks:
  `.test-data/packaged-security-1790215129921/report.json`.
- Packaged map screenshot inspected: selected Charbal-VII, faction shading,
  local condition icons, dated offline state and unknown special activity.
- Defender bounded custom scan with remediation disabled: no threats reported;
  `.test-data/galaxy-conditions-defender.log`. Not a guarantee of security.
  Authenticode status: NotSigned.
- Archive resolver regression after promotion: 24 passed;
  `.test-data/galaxy-conditions-archive-tests-final.log`.

GUI checks were sequential, isolated, software-rendered and exited gracefully.
Real-server map data was observed in the source component test at
2026-09-24T01:48:55Z (September23 local); packaged network tests used controlled
responses. Do not confuse those test types or claim a new physical-DPI test.

Existing Desktop `HD2 Chaos Slot Machine.lnk` now targets
`scripts/start-galaxy-conditions-review.cmd`, retaining the same
`.test-data/mission-owner-review` profile. No reinstallation is needed to test.

- Installer: `C:\Users\Chris\HD2CSM-Development\HD2CSM-Source\dist\galaxy-conditions\HD2-Chaos-Slot-Machine-Setup-local-galaxy-conditions-win-x64.exe`
- ZIP: adjacent `HD2-Chaos-Slot-Machine-local-galaxy-conditions-win-x64.zip`.
- Installer SHA256: `9c0b01520501a39c71d11e63d8da5c283c44dd4b660219fd7bb062b2e362c640`
- ZIP SHA256: `8dccb702e00220662884d8ad4f462f3b610ce95c48360132b9378f56702d26be`
- ASAR SHA256: `dcf556314b5480d4ccc3f3aef4c672438ca24f3e9b55687e4fab84080e00903e`
- EXE SHA256: `74954817ef3fe1b4c720b54be50b7eb9c35d9a56b9d3f1f16e9c2aed5897bb1e`

Save and shortcut backed up at
`.test-data/galaxy-conditions-promotion-20260923-215925`; review save verified
unchanged. All107 old galaxy-map build files moved and hash-verified under
`.test-data/accepted-builds/galaxy-map`, with adjacent recovery manifest
`galaxy-map-move.json`. No permanent deletion or duplicate Desktop files.
Active dist: `installer-shell` + `galaxy-conditions` only.
Do not rerun `.test-data/promote-galaxy-conditions.ps1`.

Installed baseline ASAR unchanged:
`F8E05A940DA3F200796E7DAC55B4166458B7E5C18549726C63E665D7EBCC37E0`.
No GitHub commit/push/tag/publication or version bump.

Next: owner review of hover/keyboard previews and marker dragging; investigate a
verifiable special-activity provider. Saved-card map/planet visuals remain queued.
