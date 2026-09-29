# Clean weapon thumbnails — September25

Owner reported blue screenshot backgrounds on Arbitrator and Evictor. Replaced
those two crops and Sai's black screenshot rectangle with higher-resolution
transparent game-derived source images already obtained during the prior review.
Same actual weapons; no AI generation, recoloring, segmentation or invented detail.
Only excess transparent margins cropped. PNG decoding is checked against exact
original source pixels, including alpha. Prior source viewer misleadingly exposed
RGB streaks in fully transparent pixels; the source alpha already masks them.
This corrects the earlier interpretation that those source cutouts were damaged.

All New gear and Armory equipment thumbnails share a simple #202520 backdrop.
Category/Warbond thumbnails use contain instead of cropping a long weapon to a
square. Cover images retain their separate presentation. Existing artwork outside
the three replacements is unchanged; this is not a blanket re-edit of all assets.
The app shares these three mapped images with rolls and Results.

Source URLs/hashes and crop bounds are in the Ironclad provenance manifest.
Original source alpha and 8-pixel transparent margins are regression-tested.
Community upstream editing authorship and public rights remain unestablished.
Old screenshot files/provenance are recoverable in the prior packaged build and
ignored .test-data/weapon-thumb-before; no source-image deletion.

## Validation and delivery

- **844 units + CSP/catalog/assets** passed (`.test-data/weapon-thumbs-tests-final.log`).
  New regressions require high-resolution transparent weapon margins and shared
  plain list backgrounds. Source pixels/alpha exactly match the pinned cutouts.
- Actual packaged **152 gear +13 restart**, **316 workflow +16 restart +9 startup
  +33 network +5 cache**, **31+7 transfer**, **44 security** passed, sequentially
  with isolated profiles, software rendering and graceful exits. Reports:
  `.test-data/packaged-gear-1790394379823`, `packaged-smoke-1790394412122`,
  `packaged-transfer-1790394477302`, `packaged-security-1790394485553`.
  New-gear and Ironclad Armory screenshots visually inspected: no blue/black
  screenshot rectangles; transparent weapon edges on the common backdrop.
- Installer/ZIP,486 source files, embedded payload/notices and fuses verified:
  `.test-data/weapon-thumbs-artifact-inspection/report.json`.
  ASAR `2e3e78b714c18ed4735e1278740639c3af0e5285877bb5cd1d21d34fc7083fce`;
  installer `e704291e42b1df5707e9a6f4b3cab8925d750e72fdd429ccdb3adf296305b270`.
  Defender found no threats, not a guarantee. Unsigned local build; installer
  inspected, not executed. No new physical/game-client/owner acceptance claimed.
- Same Desktop shortcut now `scripts/start-weapon-thumbs-review.cmd`, same review
  saves. Backup `.test-data/weapon-thumbs-promotion-20260925-234823`.107 old files
  archived/hash-verified at `.test-data/accepted-builds/ironclad-art`, adjacent
  `ironclad-art-move.json` records restoration; old launcher/resolver retained.
  Installed baseline and review save unchanged. No permanent deletion, Desktop
  duplicates, version bump, commit or publication. Do not rerun promotion script.
