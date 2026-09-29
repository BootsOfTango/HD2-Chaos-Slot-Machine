# Ironclad artwork correction — September 25, 2026

Follow-up: `CLEAN_WEAPON_THUMBNAILS.md` supersedes the three screenshot crops
with transparent source cutouts. The validation and hashes below describe the
original ironclad-art build, not that subsequent revision.

Owner requested correct game images and approved exact screenshot crops without
AI redraws. All eight Ironclad-era equipment mappings and the cover now use
sourced rasters. IDs, acquisition associations, aliases, ownership defaults,
prior equipment, saved runs and scoring are unchanged.

## Sources and quality

See `assets/catalog-additions/ironclad/ATTRIBUTION.md` and `provenance.json` for
direct URLs, source hashes, dimensions, crop bounds and output hashes. Three
public cutouts had streak artifacts: Arbitrator, Evictor and Sai use clean
game screenshot tiles instead. Breacher/grenade shapes match the Warbond tiles.
Both yellow booster symbols have explicit name mappings on Helldivers 2
Challenges. Its upstream editing authorship is unverified; not every file is a
publisher original. Surplus EAT is a small source icon, softer when enlarged.

`scripts/prepare_ironclad_artwork.py <local-source-directory>` requires Pillow,
rejects changed source hashes before writes, checks bounds, and verifies every
PNG against exact source pixels. No redrawing, resampling, background removal
or recoloring. Research originals are in ignored `.test-data/ironclad-art-sources`.
Runtime needs no network for these images. Nine original SVG alternatives remain
recoverable with historical provenance, but are not mapped by the catalog.
Rights auditing distinguishes original vectors from sourced rasters. Public
reuse rights remain unestablished; no public upload or version bump.

## Validation

- **842 units + CSP/catalog/assets**, source **319 workflow +21 restart** passed.
  First unit run caught the old wiki-only source assumption; now each reviewed
  mapping must match its exact provenance URL/hash, retaining wiki checks for
  legacy entries. Logs: `.test-data/ironclad-art-all-tests-final.log` and
  `ironclad-art-electron.log`. Archive resolver:31 focused checks passed.
- Packaged **148 gear +13 restart**, **316 workflow +16 restart +9 startup/window
  +33 network +5 cache**, **31+7 transfer**, **44 security** passed. Evidence:
  `.test-data/packaged-gear-1790315931895`, `packaged-smoke-1790315965073`,
  `packaged-transfer-1790316031024`, `packaged-security-1790316039231`.
  Armory upper/lower screenshots inspected: weapons, both boosters, Sai and cover
  show the new art. All eight local item images decoded offline; ownership and
  exclusion choices survived import/export and process restart.
- Installer/ZIP integrity, payload/source parity (486 files), notices and fuses
  passed: `.test-data/ironclad-art-artifact-inspection/report.json`.
  ASAR `0030fb8adcc5f820fd024183e9d9797fdadf96c034569ae98b410e4f55ab9a26`;
  installer `333bfd1f0a89d42f5ca9347e627d6ee883669ff65a855cde6ac79daf06586b0a`.
  Defender found no threats; not a security guarantee. Unsigned, installer
  inspected rather than executed. No new clean-Windows/physical/game-client
  comparison or owner hands-on pass claimed.
- Nine new rasters correctly classified with matching provenance and unresolved
  rights: `.test-data/ironclad-art-clearance-index.json`. Historical Ironclad
  artwork ledger remains exactly reproducible; original report not overwritten.
- Existing Desktop shortcut now targets `scripts/start-ironclad-art-review.cmd`
  with the same owner-review profile. Backup:
  `.test-data/ironclad-art-promotion-20260925-020057`.107 superseded fan-notice files
  archived/hash-verified under `.test-data/accepted-builds/fan-notice`; adjacent
  `fan-notice-move.json` records restoration. Old launcher/resolver retained.
  Installed baseline and owner-review save unchanged. Active dist contains only
  `installer-shell` and `ironclad-art`. No permanent deletion, duplicate Desktop
  files, version bump, commit or publication. Do not rerun the promotion script.
