# Yellow mission icons and Meltagun stratagem artwork

September 28, 2026 — local preview `yellow-missions`, branch `codex/yellow-missions-meltagun`.

## Changes

- 40-K Meltagun was already classified as a support stratagem. Its catalog and shared image mapping now use the cyan framed stratagem SVG instead of a tiny weapon render. Stable ID, category, ownership, enabled choices and Warbond association are unchanged.
- Source: [Meltagun icon file](https://helldivers.wiki.gg/wiki/File:Meltagun_Stratagem_Icon_Background.svg), contributor Torakhan. This is a **community tracing**, not an extracted official game asset. Attribution and per-file provenance record this accurately. Removed the external DOCTYPE only; paths/fills/geometry unchanged. Original download retained under `.test-data/yellow-missions-sources`, SHA256 `8effadd3d319869d910d1565e78bc68e53b65db7a5e06e58e26f3cf0bf02ad74`. Bundled SVG SHA256 `96cb10e19d3190a207f199c126f9f13bcfe451a98c9d3c8f8c0d77fa90f2b3b7`.
- CSS gives sourced mission PNGs a yellow/gold display tint on the hero, choices and advanced checklist. All 60 packaged source PNGs remain byte-identical to the preceding build. Original SVG fallbacks remain yellow and are not filtered.
- No gameplay, scoring or save changes. Historical catalog tests project only the explicitly reviewed Meltagun artwork path; unknown path changes remain detectable. Upgrade test checks the new artwork while preserving every old ownership/custom field.

## Verification

- 868 unit tests plus CSP, catalog and asset validation pass.
- Packaged workflow: 333 checks, 16 restart, 9 startup, 33 network and 5 cache. Report `.test-data/packaged-smoke-1790644854319/report.json`.
- Packaged transfer: 31+7 checks, `.test-data/packaged-transfer-1790644929213/report.json`.
- Packaged renderer security: 44 checks, `.test-data/packaged-security-1790644937448/report.json`.
- Packaged gear: 154+13 checks plus decoded New gear icon screenshot, `.test-data/packaged-gear-1790644980369/report.json`. Earlier passing gear run `1790644942118` retained; final run includes the focused Meltagun visual evidence.
- Inspected yellow mission hero/choices and cyan Meltagun screenshots. Art resolves locally/offline. `index.html`, mission catalog/selection, scoring and storage files match the prior package; item catalog differs only in the intended image path.
- 548 bundled source files, ZIP/installer payload, notices and hardened runtime fuses verified: `.test-data/yellow-missions-artifact-inspection/report.json`. All 60 mission source records/hashes verified in `.test-data/yellow-missions-inventory.json`.
- Defender reported no threats; this is not a security guarantee. Installer remains unsigned and was inspected, not executed. No new physical DPI/audio, clean-Windows or in-game acceptance claim.

## Delivery

- Same Desktop shortcut now targets `scripts/start-yellow-missions-review.cmd` and the same `.test-data/mission-owner-review` saves.
- Save/shortcut backup: `.test-data/yellow-missions-promotion-20260928-212357`.
- 107 superseded build files archived and hash-verified at `.test-data/accepted-builds/mission-art-final`; adjacent move manifest and old launcher/resolver preserve recovery. Do not rerun `.test-data/promote-yellow-missions.ps1`.
- Active `dist`: `installer-shell` plus `yellow-missions`. Installed baseline and review save unchanged; no duplicate Desktop files or permanent deletion. Research download moved/hash-verified out of Downloads into ignored source evidence.
- ASAR: `2b8ea909ef461bbcd74977fe3a30ef4216a328e1d07c93ee18426c11d6610ce3`.
- Setup: `c9170e19eb500c33b2449fb7c847b2c2029a78423c2b0b49dabe285904a854d6`.
- ZIP: `c2a464240bff49cec2a501e3ca6b669b63885b9639dd955e6c075df1bfe9318f`.

No version bump, commit, publication or new rights-clearance claim. Next: owner checks the updated icons using the existing shortcut, then resume the remaining M7 acceptance gates.
