# Eligible-only map default — September 24, 2026

Branch `codex/eligible-map-default`. Owner requested that manual planet selection
start with Eligible only checked. No change to eligibility rules or run data.

- Map component initially checks Eligible only.
- Every actual manual chooser opening resets that filter to checked, including
  reopening after browsing all planets and Change planet in mission selection.
- Unchecking still permits full-map browsing; refreshes preserve that choice
  until the next opening. Calling open on an already-open dialog does not reset it.
- Reopening a stale/inactive recorded planet can show its disabled detail panel
  but must not silently uncheck the filter or make that planet selectable.
- Ordinary explicit reveal behavior in the standalone inspection component remains
  compatible. The manual-selection opening path preserves eligible-only.
- Offline snapshots remain labeled unconfirmed; checked eligibility is not proof
  of current in-game availability. Empty pools show No matches, not fabricated rows.

## Verification

56 isolated map-component checks passed:
`.test-data/galaxy-view-1790223299373/report.json`.
This run used controlled snapshots; no new real-server observation was requested.
Includes checked startup with empty pool, inactive selection, uncheck/all-list,
refresh preservation and re-open reset. Software rendered, graceful exit.
Main-app adapter tests cover opening, lock guards, repeated open and refresh.
Packaged workflow adds real manual opening and reopen assertions.

769 units plus CSP/catalog/assets passed:
`.test-data/eligible-default-units-final.log`.

Actual packaged EXE passed298 workflow,13 restart,7 normal/fullscreen startup,
33 controlled network and5 cached restart checks:
`.test-data/packaged-smoke-1790223502874/report.json`.
Packaged transfer31+7: `.test-data/packaged-transfer-1790223567761/report.json`.
Packaged security44: `.test-data/packaged-security-1790223576141/report.json`.
These were isolated, software-rendered, sequential and gracefully closed.
No new physical Windows DPI/touch/audio or long-running stability claim.

Installer/ZIP/checksums/notices/hardened fuses and458 source-file comparisons
passed: `.test-data/eligible-map-artifact-inspection/report.json`.
Installer/uninstaller inspected, not executed; unsigned local build.
Defender custom scan (remediation disabled) reported no threats:
`.test-data/eligible-default-defender.log`. Not a security guarantee.

Existing Desktop shortcut now targets `scripts/start-eligible-map-review.cmd`,
same `.test-data/mission-owner-review` profile. Review save and installed app
baseline were hash-verified unchanged. Save/shortcut backup:
`.test-data/eligible-map-promotion-20260924-002003`.
All107 superseded themed-names build files moved/hash-verified under
`.test-data/accepted-builds/themed-names`; adjacent `themed-names-move.json`
records recovery. No permanent deletion or duplicate Desktop files.
Post-archive26 tests passed: `.test-data/eligible-default-archive-tests.log`.
Active dist only `installer-shell` + `eligible-map`.
**Do not rerun `.test-data/promote-eligible-map.ps1`.**

Installer:
`C:\Users\Chris\HD2CSM-Development\HD2CSM-Source\dist\eligible-map\HD2-Chaos-Slot-Machine-Setup-local-eligible-map-win-x64.exe`
ZIP adjacent: `HD2-Chaos-Slot-Machine-local-eligible-map-win-x64.zip`.
Installer SHA256 `eee30b42452e7074b1635532d9c1ecc9bffe05eeaf8212327f75af8275d2e0b6`.
ZIP SHA256 `00484882471438da09b6a485739270a2406c14646f42372938e0f6c4c82b714f`.
ASAR SHA256 `3cb23c54f7cb1c0f618ea275d7ab6a5af866eca0e4a0847802acddb5dc7814f2`.

No GitHub publication or version bump. Naming changes retained. Next remains
owner feedback, verified special-activity source research and saved-card visuals.
