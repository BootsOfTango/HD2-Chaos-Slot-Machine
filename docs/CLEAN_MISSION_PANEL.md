# Clean mission panel — September 21, 2026

Owner chose to move My operation, Add missing mission and About missions to
Armory > Advanced > Mission tools, rather than remove their functionality.

- Spin retains mission cards, Play this, Roll mission and Change planet.
- Ordinary suggestions do not show another tools button. A saved, empty or stale
  shortlist exposes Edit mission list in Armory, opening and focusing its checklist.
- Back to mission returns to Spin without resetting selection or stored lists.
- The text-list alternative lives under About missions. Existing custom missions,
  operation persistence, eligibility, catalog revision, scores and histories remain
  unchanged. Choose and confirm a planet before editing its operation.
- Advanced stays collapsed by default. Browser and desktop share the relocation.

## Source validation

- 649 units plus CSP/catalog/local-asset checks passed; 247 local pictures,
  zero missing and seven existing placeholders. npm audit: zero known vulnerabilities
  at check time, not a security guarantee.
- `.test-data/electron-smoke-1789963801341`: 282 workflow and18 separate-process
  restart checks passed. Covers moving the same nodes, saved-list recovery,
  preserved confirmation and navigation back to Spin.
- `.test-data/window-smoke-1789963949082`: 144 checks passed. Keyboard custom entry,
  confirmation and return/roll, scroll reachability at640x480 with100%/200% page
  zoom, browser responsive mode and existing fullscreen/Result behavior exercised.
  Spin and Armory screenshots inspected. At200%, the final captured viewport is
  panned away from labels; individual control reachability uses hit tests, not that
  screenshot as proof of appearance. Physical Windows DPI remains untested.
- Initial source run `.test-data/electron-smoke-1789963691973` failed only because
  an old test expected the replaced label My operation instead of Saved list.
  Verified graceful will-quit, absent PID28876/descendants and absent test lock,
  then corrected the assertion and reran successfully. Failure evidence retained.

## Package and handoff

- Unsigned installer and ZIP at `dist/mission-clean` passed ZIP integrity/checksums,
  embedded installer payload/notices/fuse inspection and446 source-file comparisons:
  `.test-data/mission-clean-artifact-inspection/report.json`.
  Installer SHA256: `4ca37454189ae19a6543877d0bb0bc8b0ec62aabd560d941374f1d7a04895fab`.
- Actual packaged EXE:278 workflow +13 restart +7 normal/fullscreen +33 controlled
  network +5 cache restart checks; `.test-data/packaged-smoke-1789964198840/report.json`.
- Packaged transfers31+7 restart and storage-backend file roundtrip:
  `.test-data/packaged-transfer-1789964265310/report.json`. Native file picker not tested.
- Packaged renderer security44: `.test-data/packaged-security-1789964280335/report.json`.
- Defender reported no threats in this output. Bounded scan, not a safety guarantee.
- Desktop shortcut now targets `scripts/start-mission-clean-review.cmd`, same
  `.test-data/mission-owner-review` profile. Save copied/hash-verified unchanged to
  `.test-data/mission-clean-save-backup-20260921-001822/state.json`; shortcut backup
  `.test-data/desktop-mission-clean-shortcut-20260921-001822/HD2 Chaos Slot Machine.lnk`.
- 107 superseded city build files moved/hash-verified to
  `.test-data/accepted-builds/mission-city`; adjacent `mission-city-move.json`
  records restoration paths/hashes. Historical launcher and resolver retained;
  22 resolver tests passed after archive. Do not rerun promotion scripts.

No version bump, publication, native installation, permanent deletion or Desktop
duplicates. Personal installation and saves untouched. GUI suites used isolated
profiles, software rendering, exclusive locking and graceful exits. Installer was
inspected, not executed. Signing, separate clean Windows, physical DPI, audible
listening and long-stability testing remain outside this bounded UI task.

Next: owner review, consolidated M5 acceptance/gaps, then M6 map foundation.
