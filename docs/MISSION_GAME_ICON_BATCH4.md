# Mission game icons — fourth verified batch

September28,2026. Branch `codex/mission-icons-batch4`. Local label `mission-art-4`.

## Three additions

Destroy Harvesters, Nuke Nursery and Chart Terminid Tunnels now use exact game
screenshot crops, bringing verified coverage to **53/60**. Names and badges
appear together in each source; originals and crops were visually inspected.
No similar-mission substitution, AI, tracing, recoloring, resampling or
background removal. Nuke Nursery has a small source badge and looks softer when
enlarged; that limitation is recorded in provenance, not disguised by redrawing.

- Harvesters: [Helldivers Wiki file page](https://helldivers.wiki.gg/wiki/File:Destroy_Harvestors_Map.png),
  SoundwaveAeron's January16,2026 upload,845×936 PNG. The filename's Harvestors
  spelling is retained; the screenshot itself says Destroy Harvesters.
- Nursery: [N4G Unlocked/Vukan Truc](https://n4g.com/articles/helldivers-2-how-to-do-the-nuke-nursery-mission),
  June17,2024 article's game briefing screenshot,1024×576 JPEG.
- Tunnels: [N4G Unlocked/Ksenija Grgurovic](https://n4g.com/articles/helldivers-2-freshly-added-gloom-mission-types-spark-excitement-in-the-community),
  February19,2025 article (updated March2), right-hand briefing screenshot,
  1024×576 JPEG montage. Left-hand Secure Research Site badge is NOT used.

Source URL, uploader, crop rectangle, download/decoded/output hashes are in
`assets/missions/game-icons/provenance.json`. Original source bytes remain
outside the bundle in `.test-data/mission-game-icon-sources/originals`.
Pillow RGBA decoding preserves downloaded JPEGs separately; the decode check
compares all pixels, then Node compares exact crop pixels. No runtime dependency
was added. Credits are not permission; public-release rights remain unestablished.

Two inspected Steam guide defense-map images lacked sufficient mission-name
evidence for a distinct Defend Evacuation Site mapping. They were not used.
The three task-created Downloads were moved with exact-path/hash guards: one
accepted source and two research-only images under `rejected-batch4` outside
the bundle. No unrelated Downloads or Desktop files were touched.

## Remaining seven

Defend Evacuation Site; Rapid Acquisition; Destroy Illuminate Warp Gateways;
Democratize the Void; Infiltrate Illuminate Lair; Repel Invasion Fleet;
Suppress Toxic Pollination. Keep original placeholders until exact sources are
verified. No mission catalog, eligibility, scores, saves or ownership changes.

Unverified leads for the next batch: Sarge's [Infiltrate Illuminate Lair video](https://www.youtube.com/watch?v=OAK6tKsISp8)
lists briefing/stratagem selection at00:00; DemoStorm's [Toxic Pollination video](https://www.youtube.com/watch?v=XQyKTUzfL9g)
names the mission. These are discovery leads only: neither video frame has been
inspected or captured, and neither is evidence for an icon mapping yet.

## Validation and delivery

863 units plus CSP/catalog/assets pass. All four retained JPEG/WebP decodes and
all53 crop pixels verify exactly. All50 previous crop files and seven core
catalog/rules/scoring/storage/UI files match accepted batch3 bytes.

Packaged EXE checks pass: 327 workflow,16 restart,9 normal startup,33 network,
5 cache,31+7 transfer,44 security and152+13 gear/restart checks. Screenshots
`harvester-game-icon.png` and `nursery-tunnels-game-icons.png` were visually
inspected. Nursery's softer source remains apparent; all three badges resolve
offline. Evidence folders under `.test-data`:

- `packaged-smoke-1790642101335`
- `packaged-transfer-1790642313501`
- `packaged-security-1790642321602`
- `packaged-gear-1790642326375`
- `mission-art-4-artifact-inspection/report.json`

540 bundled source files,53 provenance records, installer/ZIP content, notices
and Electron fuses verify. Windows Defender's custom no-remediation scan of
`dist/mission-art-4` completed September28 at20:35:47 with no threats found;
this is not a security guarantee. Installer remains NotSigned and was inspected,
not installed. No new clean-Windows, physical DPI/audio or in-game acceptance
is claimed. Electron remains44.4.5; internal1.1.14/display1.0 Local preview.

- ASAR SHA256: `4da5e746f63d06565053ebdaacfd2a2649105e1e5511345e84c520883261b73d`
- Setup SHA256: `b5e86957586bd78909f92c2afe9eba51809a327443067c934b1a57a759823f61`
- ZIP SHA256: `18b11a5eba3826951e1697a6b8aa91d136bf81f328666eb9c034efa1c68041e6`

The existing Desktop shortcut now targets `scripts/start-mission-art-4-review.cmd`
and the same `.test-data/mission-owner-review` profile. Save/shortcut backup:
`.test-data/mission-art-4-promotion-20260928-203915`. All107 superseded batch3
build files moved and hash-verified at `.test-data/accepted-builds/mission-art-3`;
adjacent `mission-art-3-move.json` records recovery. The old launcher and audit
resolver support that archive. Active dist is `installer-shell` plus `mission-art-4`.
Installed baseline and review save unchanged. No permanent deletion, duplicate
Desktop files, version bump, commit or publication. Do not rerun the one-off
`.test-data/promote-mission-art-4.ps1` promotion.
