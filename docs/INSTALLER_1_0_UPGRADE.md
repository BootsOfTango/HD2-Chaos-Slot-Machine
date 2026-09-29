# Backed-up 1.0 candidate upgrade — September 29, 2026

Owner approved the backed-up installer upgrade test. Completed locally using the exact unsigned candidate recorded in [RELEASE_CANDIDATE_1_0.md](RELEASE_CANDIDATE_1_0.md). This is not a clean-Windows installation test or official publication approval.

## Backup and native installation

- Confirmed no app/test process or shared test lock before starting. No forced shutdown.
- **397 files** copied and SHA-256 verified: existing installation, normal profile, owner-review profile, legacy profile, updater cache, Desktop/Start shortcuts and review launcher. Install/uninstall registry keys exported separately.
- Private recovery directory: `.test-data/release-candidate-upgrade-2026-09-29/`. `backup.json` records exact original paths, backup paths and hashes. Never upload this folder. Do not rerun its one-off backup/install/promotion scripts.
- Setup SHA-256 `c060a0869ff6b9333ee5881c1d3b6a397a66150d76e066fbdd2953191a58dbbb` rechecked before execution. Ran the native installer silently with `/S /currentuser /D=` and the verified existing path: `C:\Users\Chris\AppData\Local\Programs\HD2 Chaos Slot Machine`.
- Installer exited **0**. All **99 installed runtime files** match the candidate; the installed uninstaller matches the inspected binary. Exact installed file list checked; no unexpected extra files or shell warning log. Both native shortcuts and uninstall registration point to the correct full-name installation. Windows compatibility version remains 1.1.14; public app channel is still 1.0 Local preview.
- All **295 existing files across the three profile folders** remained byte-identical immediately after installation and after isolated testing/promotion. No card import, merge, deletion, rescoring or save-folder relocation was performed.

## Actual installed EXE tests

All tests used synthetic profiles, software rendering, the shared desktop lock and graceful exits; they did not run against the owner's cards.

| Test | Result | Evidence under `.test-data/` |
| --- | --- | --- |
| Workflow/restart/fullscreen startup/controlled network/cache restart | 333 + 16 + 9 + 33 + 5 checks passed | `packaged-smoke-1790712815511/report.json` |
| Card-rule confirmation, recovery copy and restart | 25 + 6 checks passed | `packaged-smoke-1790712884335/report.json` |
| Source regressions after launcher/archive changes | 911 tests passed; CSP/catalog/assets passed | `release-candidate-upgrade-2026-09-29/final-unit.log` |

Native verification: `installed-verification.json`; Setup execution: `install-start.json`, `install-exit.json`; native shortcut readback before review-route restoration: `installer-shortcuts.json`. Final promotion: `promotion.json`. All are in the private recovery directory above. Final readback found no app/test processes or shared lock. Setup/ZIP hashes still match the verified candidate.

## Desktop and cleanup

Use the **existing Desktop HD2 Chaos Slot Machine shortcut**. Its existing `scripts/start-card-rules-review.cmd` now launches the installed EXE while keeping `.test-data/mission-owner-review` as its save folder. The icon points to the installed EXE. No additional shortcut or Desktop installer was created.

The normal Start-menu shortcut still uses `%APPDATA%\Helldivers 2 Chaos Slot Machine`. These remain two intentionally separate card collections. Do not silently merge or overwrite either. A later consolidation requires an explicit reviewed transfer; do not interpret a different collection after switching launch methods as deleted cards.

The **107 superseded card-rules preview files** were moved, not deleted, to `.test-data/accepted-builds/card-rules`. Every file hash was checked after the move. `card-rules-move.json` in the recovery directory records exact source/archive paths and hashes. Historical inventory resolution now finds that exact archive without substituting a newer build. Active `dist` contains only `installer-shell` (retained historical fixture) and `release-candidate` (current downloads/test candidate). Protected save/recalibration backups and the retired project attachment were not touched.

## Limits and next steps

- This proves a silent per-user upgrade on this existing PC, not a clean-machine install/uninstall, all-users installation, native wizard click-through or physical DPI/pin behavior. No standalone uninstaller was run. Clean-Windows acceptance remains deferred.
- No automatic rollback is authorized. If rollback is needed, close normally and inspect the manifest; restore installation/registration/shortcuts consistently. Never overwrite newer cards with a historical profile or use an old runtime against newer saves blindly.
- Candidate remains unsigned; no protection settings were changed. Earlier Defender/npm results remain bounded evidence, not guarantees.
- No commit/push/PR update, main merge, tag or public release in this session. Hosted CI remains tied to its earlier exact commit, not these local changes.
- Remaining release work: clean-Windows lifecycle decision/evidence, artwork-use basis, signing/distribution policy, final channel/notes/evidence, final-source CI and explicit owner publication approval. The completed upgrade should not be requested again as though it had never been tested.
