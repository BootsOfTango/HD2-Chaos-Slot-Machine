# Mission game icons — third verified batch

September 28, 2026. Branch: `codex/mission-icons-batch3`.

## Bounded change

Three more exact game screenshot crops: Eradicate Automaton Forces, Eradicate
Terminid Swarm, and Evacuate High-Value Assets. Coverage is **50/60**, with ten
explicit original placeholders remaining. No mission eligibility, scoring,
save-format, version or ownership changes. Nothing published.

The actual mission title and badge appear together in each source screenshot;
all three originals and all three crops were visually inspected. The two
Eradicate symbols differ and have independent source evidence. The Illuminate
Defend Evacuation Site is not automatically assigned the other defense badge.

## Sources and reproducibility

- Automaton: [PC Gamer/Sean Martin, syndicated by inkl](https://www.inkl.com/news/how-to-find-and-kill-devastators-in-helldivers-2).
  Image caption credits Arrowhead Game Studios. The original CDN screenshot is
  2560 × 1440 JPEG; not the similarly titled GamesRadar guide.
- Terminid: [Steam guide, Easy XP farm! [UPDATED]](https://steamcommunity.com/sharedfiles/filedetails/?id=3168338353),
  author displayed as ♿. Its 800 × 800 PNG has the mission name and bug badge.
- Defense: [GameLeap/Ivan Valev](https://www.gameleap.com/articles/helldivers-2-how-to-complete-the-new-automaton-defense-mission),
  screenshot credited to Arrowhead Game Studios. The source is a 1920 × 1080 WebP.

Exact CDN URLs, contributors, crop rectangles and hashes are recorded in
`assets/missions/game-icons/provenance.json`. Sources remain outside the bundle
in `.test-data/mission-game-icon-sources/originals`. Three task-created downloads
were moved from the batch3 staging folder with exact-path and hash checks;
nothing was downloaded onto the Desktop or deleted.

For JPEG/WebP only, `scripts/decode-mission-sources.py` uses development Pillow
to decode RGBA pixels into a lossless PNG intermediate. Original downloaded
bytes and their `downloadSha256` are retained separately from `sourceSha256`
for the decoded PNG. `--check` compares every decoded pixel. The normal Node
crop script and unit tests then compare every crop pixel against that PNG.
No AI, tracing, background removal, resizing, recoloring or sharpening.
Small source backgrounds remain. Credits are not redistribution permission;
the existing public-release rights gate is unchanged.

## Remaining ten

Defend Evacuation Site; Rapid Acquisition; Chart Terminid Tunnels;
Destroy Illuminate Warp Gateways; Destroy Harvesters; Nuke Nursery;
Democratize the Void; Infiltrate Illuminate Lair; Repel Invasion Fleet;
Suppress Toxic Pollination.

Further searches in this session found gameplay scenes, unrelated mission
screens, or traced icons rather than verified title-and-badge sources for these.
Do not copy an icon solely because names or mechanics appear related. Useful
unverified leads: the wiki's `File:Destroy_Harvestors_Map.png`, Steam's guide
3429481502 for defense variants, and public gameplay videos for newer missions.

## Validation and handoff

**861 unit tests plus CSP/catalog/assets pass**, with no skips. Both lossy-source
decodes pass full-pixel verification; all50 crop pixels and original hashes pass.
All47 prior crop files and seven core catalog/mission/scoring/storage/UI files
are byte-identical to the accepted batch2 ASAR.

Actual packaged EXE: **325 workflow +16 restart,9 startup,33 network,5 cache**;
**31+7 transfer**, **44 security**, **152+13 gear** checks pass. New Automaton
defense and Terminid icon screenshot fixtures were visually inspected. Evidence:
`.test-data/packaged-smoke-1790641437308`,
`packaged-transfer-1790641524569`, `packaged-security-1790641533035`,
`packaged-gear-1790641537937`. Tests use isolated profiles and graceful shutdown.

537 bundled source files, ZIP CRC/runtime, installer payload, security fuses and
notices verified in `.test-data/mission-art-3-artifact-inspection/report.json`.
All50 crop inventory records match their hashes and source credits in
`.test-data/mission-art-3-inventory.json`. Defender bounded custom scan found no
threats (not a security guarantee). Authenticode: NotSigned. The installer was
inspected, **not executed**. No new physical DPI/audio, clean-Windows lifecycle,
in-game availability or long-duration acceptance is claimed.

Same Desktop shortcut now targets `scripts/start-mission-art-3-review.cmd`,
launching `dist/mission-art-3/win-unpacked/HD2 Chaos Slot Machine.exe` with the
same review saves. Backup: `.test-data/mission-art-3-promotion-20260928-202607`.
107 superseded batch2 files archived/hash-verified at
`.test-data/accepted-builds/mission-art-2`, with recovery manifest and historical
launcher/resolver support. Installed baseline and review save hashes unchanged.
Active dist: installer-shell +mission-art-3. No permanent deletion, Desktop
duplicates, installer execution, version change, commit or publication.
**Do not rerun `promote-mission-art-3.ps1`.**

The shell wrapper incorrectly tested `$LASTEXITCODE` after a PowerShell script
and reported failure after successful promotion (no native-command exit code
was set). A read-only recheck confirmed verified manifest, correct shortcut and
icon target,107 archived files, unchanged save/installed hashes, no old dist,
and no remaining app process/test lock. No retry or second move was performed.

ASAR SHA-256: `2e218cda3f164806353b3ef445f071e282e0b93e0e3c52477541da9ec0684c93`.
Setup SHA-256: `fc2f00ac65dacb34a66e004fe742d5346ae164d9a32bce92e01c026890a780ac`.
ZIP SHA-256: `c83fc65c6fddf0a47d55895534810201fc54eceabbaa7c815190ada8758bf31d`.

Next: continue exact screenshot sourcing for the remaining ten, retaining the
accepted Desktop build until the next bounded replacement is verified.
