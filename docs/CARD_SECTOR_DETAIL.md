# Saved-card sector detail — September 27, 2026

Owner requested more useful mini-map context: lines, shading, sector label and
faction color. Branch `codex/card-sector-detail`. Original local SVG rendering;
no new raster art, external website, network requests or historical save edits.

## Change

- Approximate padded sector-cluster outline using the same original convex-hull
  geometry as the main map. More compact padding is optional; main-map defaults
  are unchanged. This is not exact in-game sector-border geometry.
- Subtle fill and outline use the saved run's enemy color. Neighbor dots remain
  neutral; a saved-run faction label and accessible explanation avoid claiming
  that every neighbor was owned by that enemy on the run date.
- Only documented bundled intra-sector waypoint links are drawn, deduplicated;
  no proximity-inferred routes. Selected-planet links are emphasized. These are
  reference routes, not current or historical supply status. Bundle date remains
  in the SVG tooltip. Missing links produce a routes-unavailable caption.
- Sector heading and selected planet name appear inside the map, with a target
  leader line. Longer labels truncate visually, while full text stays in the
  adjacent details and accessibility text. Larger SVG supports readable labels.
- Original identity/coordinate precedence and unknown-location fallback retained.
  Sector mismatch suppresses outline/neighbors/routes rather than inventing them.
  Saved Results, scores, ownership, exports and planet selection are unchanged.

## Verification and delivery

Tests cover Genesis Prime/Rictus, projection, bounded hulls,
recorded faction independence, route deduplication, invalid endpoints, missing
geography and unchanged historical cards. Packaged runner also captures the
reported Genesis Prime example and the existing emulated640x480 card view.

Build label `card-sector`, same app version1.1.14/display1.0 Local preview.
No GitHub publication or installer execution. User confirmed current app closed.
Completed:853 units+CSP/catalog/assets; source321 workflow+21 restart;151 window
checks. Packaged319 workflow+16 restart+9 startup+33 controlled network+5 cache,
31+7 transfer,44 security,152+13 gear all pass. Isolated software-rendered GUI
phases ran sequentially and exited gracefully. Evidence IDs: source1790484698285,
window1790484765435, smoke1790484829844, transfer1790484911997,
security1790484920132, gear1790484924769. Genesis screenshot and emulated640x480
saved-card screenshot inspected; shading/labels/routes visible, no horizontal
panel overflow. No new physical-DPI, listening, live-game or clean-Windows claim.

486 source files plus ZIP/installer/fuses/notices verified in
`.test-data/card-sector-artifact-inspection/report.json`. Defender found no
threats in the candidate, not a security guarantee. Unsigned installer inspected,
not executed. ASAR `40c7f68b6c859627011153d3100a058db5453776186ba19f41320ae9dc2b9e2c`;
Setup `8627e4b90fa9706098fd019c23a228034ac272cc20864ef4891e424b7c9914eb`.

Same Desktop shortcut now `scripts/start-card-sector-review.cmd`, same review
saves. Backup `.test-data/card-sector-promotion-20260927-005558`.107 superseded
runtime-patch files archived/hash-verified at `.test-data/accepted-builds/runtime-patch`,
adjacent recovery manifest and historical launcher/resolver preserved. Active dist
`installer-shell` + `card-sector`. Installed baseline and review save unchanged.
No permanent deletion, Desktop duplicates, version bump, commit or publication.
Do not rerun `.test-data/promote-card-sector.ps1`.
