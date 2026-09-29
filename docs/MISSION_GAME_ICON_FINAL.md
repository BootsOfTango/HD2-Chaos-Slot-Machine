# Complete mission game-icon pass — September 28, 2026

## Scope

Branch `codex/mission-icons-final`; local preview label `mission-art-final`.
All seven remaining catalog placeholders are replaced: **60/60 mission identities**.
Existing 53 PNGs and seven checked core files (catalog, mission selection, scoring,
storage, main, preload, index) are byte-identical to batch4. No gameplay, scoring, ownership,
save-format or version changes. Custom/unknown missions retain an original SVG.

## New sources

Each link points to the captured video time. The retained full frame and exact
crop rectangle/hash are recorded in `assets/missions/game-icons/provenance.json`.
These are paused browser JPEG captures of rendered public gameplay, not original
encoded game frames. Video/browser scaling and compression remain visible. Crops
preserve the decoded source pixels; no AI, tracing, recoloring or retouching.

| Mission | Video contributor / timestamp | Evidence |
|---|---|---|
| infiltrate-illuminate-lair | [Sarge, 0:05](https://www.youtube.com/watch?v=OAK6tKsISp8&t=5s) | Named mission selection card. |
| blitz-toxic-pollination | [DemoStorm, 0:15](https://www.youtube.com/watch?v=XQyKTUzfL9g&t=15s) | Named Suppress Toxic Pollination selection card; right edge of label clipped in vertical video. |
| repel-invasion-fleet | [Maplewood, 0:40](https://www.youtube.com/watch?v=EFb1Db_ETVk&t=40s) | Named city mission briefing. |
| democratize-the-void | [Sjór Deansson, 2:05](https://www.youtube.com/watch?v=jgCGjjOg3rg&t=125s) | Named mission selection card. |
| blitz-illuminate-gateways | [Skybass - Patrick, 0:04](https://www.youtube.com/watch?v=FOa3j_4DpTA&t=4s) | Named Destroy Warp Gateways objective HUD in the 12-minute mission; orange outline retained. |
| rapid-acquisition | [Zaper, 14:21](https://www.youtube.com/watch?v=31cjRoogk2M&t=861s) | Main-objective results badge from the video Rapid Acquisition w/ GeneralJaydonius; same cargo/platinum badge observed beside Seize High-Grade Platinum at 00:46. Orange fill retained. |
| defend-evacuation-site | [Millsonius, 0:03](https://www.youtube.com/watch?v=TlrxPc5ydyA&t=3s) | Named Defend Evacuation Site briefing explicitly describes Illuminate; not borrowed from another faction. |

Gateway uses the orange outlined objective-HUD badge; Rapid Acquisition uses the
orange results badge. These color differences are from the game, not recoloring.
Small video badges are softer than larger still-image sources.

## Validation

- 866 unit tests, CSP, catalog and asset checks pass (including the map regression below).
- All 60 crops match retained source pixels; 11 JPEG/WebP decodes verified.
- Final packaged workflow332 +restart16, startup9, network33, cache5; transfer31+7,
  security44, gear152+13 pass on Electron44.4.5. Evidence directories:
  `packaged-smoke-1790643800605`, `packaged-transfer-1790643871490`,
  `packaged-security-1790643879691`, `packaged-gear-1790643882227`.
- All seven new icons visually inspected in the final packaged screenshots.
- 547 bundled source files, ZIP/installer payload parity, security fuses, notices
  and60 per-file source records verified. Defender custom scan found no threats;
  not a security guarantee. Installer remains unsigned and was not executed.
- Rights/attribution status is unchanged. Coverage is not publisher endorsement.
- No clean-Windows install/uninstall, physical DPI/audio or in-game client test
  is implied by automated validation. Installer execution is outside this pass.

## Handoff

Same Desktop shortcut now targets `scripts/start-mission-art-final-review.cmd`.
Review save and installed app unchanged; backed up save/shortcut at
`.test-data/mission-art-final-promotion-20260928-210523`.107 superseded batch4
files archived/hash-verified under `.test-data/accepted-builds/mission-art-4`,
with restoration manifest. No permanent deletion or new Desktop copies.
No GitHub publication. Do not rerun the one-off promotion script.

- ASAR: `f212d296076f476b2cbeb1642c0c06418c7f4fc3b93c13519f00b989e50f968b`
- Setup: `9a1bc9c7ebb977f48387469ed4d44328e78bc09d523aabbaf8079683d3a85884`
- ZIP: `f64cd8e3e7553124a961a5851c4513c1ad4ce6401ed831c2ab88357c743ca392`

Installer: `C:\Users\Chris\HD2CSM-Development\HD2CSM-Source\dist\mission-art-final\HD2-Chaos-Slot-Machine-Setup-local-mission-art-final-win-x64.exe`.

## Test-discovered saved-map edge case

The first packaged run, `packaged-smoke-1790643549145`, failed the saved-card
sector outline assertion after randomly rolling Nabatea Secundus. The recorded
`L’estrade Sector` used a curly apostrophe while the reference atlas used a
straight apostrophe. The previous read-only comparison therefore withheld the
region/routes. Fixed only that comparison: normalize curly apostrophes, retain
the exact stored/displayed label and preserve genuinely mismatched sectors.
A unit regression and packaged assertion cover the legacy label, outline/routes
and no card mutation. The main guided-card fixture now uses fixed Genesis Prime
geography, eliminating unrelated random-map assumptions. The intermediate
`packaged-smoke-1790643663179` passed icon/UI checks before this production fix;
it is not final-build evidence. Final rebuild/retest supersedes it.
