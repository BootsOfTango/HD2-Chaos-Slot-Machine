# Mission game icons — second verified batch

September 28, 2026. Branch: `codex/mission-icons-batch2`.

## Change

Added 24 exact in-game screenshot crops, bringing verified coverage to **47/60**.
Previously delivered 23 PNGs are byte-identical. Mission catalog, eligibility,
state/scoring modules and Electron main process also match the accepted prior
build byte-for-byte. No new version, public release, save migration or installer
execution is part of this artwork task.

New coverage: Recon Craft Intel; Mobile E-711, Extract E-711 and Restart Pumps;
Restore Air Quality and Cleanse Infested District; Impaler and Factory Strider;
all three Commando missions; Confiscate Assets; Orgo-Plasma, Industrial Complex,
Mineral Sites, Cyborg Production and Bio-Processors; Illuminate Warp Ships;
Evacuate Colonists, Overship, Free Colony, Anomalous Material, Exospire and Gazer
Spire. All identity mappings have their own screenshot evidence, even when the
game reuses a symbol across mission types.

## Source and pixel verification

Sources: public game-description screenshots linked from the exact mission pages
on Helldivers Wiki.gg. Newly credited uploaders: SoundwaveAeron, AkuBC, Takapy,
TauCetiV and TBot. URLs, crop rectangles, input/output hashes and original sizes
are in `assets/missions/game-icons/provenance.json`. New entries carry the
September28 retrieval date; prior retrieval records are preserved.

Original source screenshots are retained under
`.test-data/mission-game-icon-sources/originals`. The 24 exact downloads created
in this task were moved there with path guards and SHA-256 checks. No unrelated
Downloads files were touched. Two header contact sheets and the 47-icon crop
sheet were visually inspected. No AI, tracing, resizing, recoloring or background
removal. Small original screenshot backgrounds remain around the game badges.

One reviewed SVG file explicitly describes a contributor's hand-traced artwork
with reuse restrictions. It was not downloaded or substituted for source pixels.
Attribution remains separate from permission; public-release rights are unchanged.

## Remaining 13

- Eradicate Automaton Forces and Eradicate Terminid Swarm
- Evacuate High-Value Assets and Defend Evacuation Site
- Rapid Acquisition and Chart Terminid Tunnels
- Destroy Illuminate Warp Gateways and Destroy Harvesters
- Nuke Nursery and Democratize the Void
- Infiltrate Illuminate Lair and Repel Invasion Fleet
- Suppress Toxic Pollination

The examined mission pages generally expose traced symbols, unrelated gameplay
screenshots, or no suitable description screenshot for these entries. Defend
Evacuation Site needs a separate identity/source check. Retain explicit original
placeholders until verified source pixels are located. Do not reuse a lookalike
based on a name or change eligibility while correcting artwork.

## Validation and delivery

859 units plus CSP/catalog/assets pass, including exact source-pixel equality,
47 unique source mappings, 13 honest placeholders, numeric E-711 asset paths,
safe custom-ID fallback and archive recovery.

Actual packaged EXE: **323 workflow +16 restart,9 startup,33 network,5 cache**;
**31+7 transfer**, **44 security**, **152+13 gear** checks pass. All47 icons
decode offline; dedicated confirmed Commando/Illuminate fixtures render correct
paths without changing saved records. Both packaged screenshots inspected.
Evidence: `.test-data/packaged-smoke-1790637256823`,
`packaged-transfer-1790637370679`, `packaged-security-1790637378783`,
`packaged-gear-1790637383527`.

534 bundled source files, ZIP, installer payload, fuses and notices verified in
`.test-data/mission-art-2-artifact-inspection/report.json`; all47 image source
records/hash matches verified in `.test-data/mission-art-2-inventory.json`.
Defender custom scan found no threats, not a guarantee. Unsigned installer was
inspected, not executed; physical DPI/audio, clean Windows and in-game comparison
are not newly claimed by these tests.

Same Desktop shortcut now launches `scripts/start-mission-art-2-review.cmd` and
`dist/mission-art-2/win-unpacked/HD2 Chaos Slot Machine.exe`. Backup:
`.test-data/mission-art-2-promotion-20260928-191658`.107 old mission-game-art files
archived/hash-verified, with recovery manifest and old launcher/resolver. No
permanent deletion, extra Desktop copies, save changes, version bump, commit,
push or publication. Do not rerun the promotion script.

ASAR SHA-256: `0e6eb9c28f3b7850da4539d07cc58c2de8a3bcfe70b12895ef640903bf8a910f`.
Setup SHA-256: `d7aa178504def67660d9434948a089a41107e3948e04e4218d441dba2c14a2e1`.
