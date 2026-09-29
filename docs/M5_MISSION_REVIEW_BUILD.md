# Mission Planner — local packaged review

September 16, 2026 (verification timestamps cross September 17 UTC). Branch `codex/mission-review-build`. Unpublished, unsigned; internal compatibility version remains 1.1.14 and the app displays 1.0 Local preview.

## What changed

This is the first packaged M5 review: the 14-identity partial mission catalog, planet-aware suggestions, observed-operation checklist/custom missions, scoped confirmations, historical mission persistence, event revalidation, and the short-window header fix from prior source slices are now bundled.

Specific mission names now appear in Results summaries/details, Compare labels/search/details, Rank details and Discord share markup/text/PNG fallback. Legacy score-category filters/calculations remain unchanged. Historical names are read from saved snapshots, not renamed from the current catalog. Legacy cards fall back to their old mode label. Custom text is HTML-escaped; Discord mission names escape formatting and neutralize mentions. Long/unspaced names wrap in the fallback canvas without losing characters. Both PNG canvases have additional vertical space for the mission label.

Updated the player guides to distinguish the local Mission Planner from older previews/public downloads. No Discord post, external message, Git commit, push, tag or publication was made.

## Files

- Setup: `dist/mission-planner/HD2-Chaos-Slot-Machine-Setup-local-mission-planner-win-x64.exe` — 150,350,265 bytes.
  SHA-256: `b0b99d42bb8917cfe7c8a8d35afec756e066a175b4dca9dc7d3f89333db3fa58`.
- Portable ZIP: `dist/mission-planner/HD2-Chaos-Slot-Machine-local-mission-planner-win-x64.zip` — 192,016,244 bytes.
  SHA-256: `50240defefb9178ea32de877fbf6e50ec53a783bb6f722d5dc63f55002038ca1`.
- Runtime EXE SHA-256: `095d5ede575d78aefbf5a6e303a2606d6d94595ff8a0d1b89e865e0f4a68849e`.
- ASAR SHA-256: `d0895fd2a3ac9fe0fdd6fe03600380b49e1f8fb6faabf4233bbffb21053ed197`.
- `scripts/start-mission-review.cmd` opens the full packaged runtime without installation, using `.test-data/mission-owner-review`, not personal saves. Keep the entire runtime directory intact.

Setup is an offline NSIS installer, not a web bootstrapper. Matching checksum sidecars are present. Both Setup and the EXE report `NotSigned`; public Windows signing credentials are still required for a signed release. A checksum or a clean scanner result is not proof of safety.

## Executed checks

- **536 unit tests**, CSP/catalog/assets: `.test-data/mission-planner-final-unit.log`. Five new tests cover stored-name/legacy fallback, Discord text escaping, unbroken/Unicode canvas wrapping and exact historical archive resolution. All 247 local picture references present; seven earlier placeholders elsewhere remain.
- Source gameplay **117**, mission lifecycle **14**, network **33**, restart **16**: `.test-data/electron-smoke-1789616393875/report.json`. Tests include a long HTML-like custom name, Results/Compare searches, non-mutation of history/scores, safe share markup and a real offline fallback PNG export.
- Source renderer security **44+44**: `.test-data/renderer-security-1789616466095/report.json`.
- Final source window suite **101**: `.test-data/window-smoke-1789616861214/report.json`. Native keyboard input, fullscreen/window controls, scroll/pan, dialogs and 640x480 mission control reachability with page-zoom emulation. Browser mode retains its responsive layout.
- ZIP/installer validation: `mission-planner-zip-verify.log`; artifact inspection `.test-data/mission-planner-artifact-inspection/report.json`: **400 source comparisons, 29 embedded payload comparisons**, ZIP CRC/runtime, NSIS payload integrity, notices/components, hardened fuses and absence of WinShell pass. Electron 44.4.1; builder 26.15.3.
- Actual packaged EXE: **113 gameplay +14 mission lifecycle +11 restart +7 normal/fullscreen +33 network +5 war-cache restart**, `.test-data/packaged-smoke-1789616685483/report.json`. All 24 displayed Warbond covers decode locally. These are assertions, not a count of distinct user scenarios. Real event deadline test runs without waiting for network refresh.
- Packaged transfers **28+6 restart**, `.test-data/packaged-transfer-1789616842844/report.json`; supported JSON file roundtrip also passes. A player-confirmed custom operation and historical 40-minute mission with explicit Blitz score category survive import/export and restart unchanged. The earlier identical transfer run `1789616752792` also passed; the final run adds screenshots. Inspected `mission-detail.png`: literal `<Observed> operation` is readable as text. The incomplete legacy fixture intentionally has no equipment; its placeholder fields are not missing bundled artwork. `mission-result.png` retains the established pending-card EDIT overlay.
- Packaged renderer security **44**, `.test-data/packaged-security-1789616771396/report.json`; injected frame blocked by unchanged CSP as expected.
- Defender custom scan of the candidate with remediation disabled: exit 0, no threats found (`mission-planner-defender.log`). npm audit: zero known vulnerabilities (`mission-planner-npm-audit.json`). Neither is a guarantee against malware/vulnerabilities.

All GUI runs are sequential/exclusive, software-rendered, use isolated profiles and exit gracefully. Final desktop-test lock absent; no force termination, Windows/driver/security-setting changes or personal-save access. Source workflow initial attempt `.test-data/electron-smoke-1789616362077` failed because the prior lifecycle fixture left its synthetic war-status text displayed; its underlying service had already been restored. Checked normal `will-quit`, absent PID 32032 and released lock, then made the harness explicitly rerender restored status instead of depending on a periodic UI tick. Fresh-profile source and packaged reruns passed. No production war-refresh change was needed.

## Review and remaining limits

This is a local review, not full M5 completion or official 1.0 readiness. Catalog remains partial; unresolved regional variants require player confirmation. No exact per-player live operation feed is claimed. Please try choosing a planet, confirming an observed operation, rolling/selecting a mission, creating a Result, restarting and checking its name/score category.

Not exercised here: executing Setup over a real installation, clean Windows install/uninstall, native file-picker clicks, actual Discord posting or clipboard interaction, audible listening, physical Windows DPI/trackpad/multi-monitor, real OS suspend/resume and long-duration stability. The normal share markup is validated; actual PNG generation was exercised through the fallback renderer, not a guarantee that every SVG/foreignObject export path works in every browser. Separate clean-install testing remains deferred by owner decision.

M6 galaxy map, further mission/regional catalog evidence, M7 complete upgrade/release acceptance, signing, artwork redistribution clearance and owner approval remain open.

## Cleanup and installation preservation

Archived/hash-verified **107** superseded Armory Browser files at `.test-data/accepted-builds/armory-browser`; adjacent `armory-browser-move.json` records original paths, file hashes and restoration instructions. Nothing permanently deleted. Historical launcher/resolver now finds that exact archive, not a substitute newer build. Do not rerun the one-off move script.

`dist` contains only installed baseline `installer-shell` and latest review `mission-planner`. No Desktop duplicate or player-download promotion. Installed EXE SHA remains `4976e83cacbad5588bb2164a0fba8d1cd80466c6392eaf716963dfb2409c56d9`; installed ASAR SHA remains `f8e05a940da3f200796e7dac55b4166458b7e5c18549726c63e665d7ebcc37e0`, identical before/after. No native installer was executed.
