# Saved-card planet visuals — September 24, 2026

Owner-approved bounded feature, branch `codex/saved-card-planet-visuals`.

Card Details now includes a compact sector locator and the existing original
biome globe, visible outside collapsed Loadout. Guided entry stays unchanged;
the visuals appear after saving or when choosing View details. No score,
ownership, selection rule, export field or save format changed.

## Historical honesty and offline behavior

- Name, sector, faction and biome come only from the saved run. Colors use its
  recorded enemy, not current war ownership. Globe is illustrative, not official.
- Recorded coordinates take precedence. Otherwise exact stable IDs or the existing
  audited legacy identity crosswalk may resolve bundled reference coordinates.
  Unrecognized/ambiguous identities stay unplaced, with a neutral globe if needed.
- Locator reuses the galaxy projection (X right, Y up), zoomed to reference sector
  members. Neighbor dots are neutral. No historical territory, availability,
  supply routes or weather is reconstructed. Sector mismatch suppresses neighbors.
- A short reference-map caption and accessible description explain the distinction;
  tooltip dates the bundled geography. This is not a captured map from the run date.
- Local bundled atlas only, cached in memory; no community requests or persistence.
  Missing atlas still allows recorded coordinates. Old cards are never migrated.
- DOM text assignment, bounded values and local allowlisted image paths prevent
  imported names or biome fields from becoming markup or remote resources.

## Verification

Initial geometry test was corrected for floating-point rounding at viewport bounds
(under 1e-12 pixels); no product coordinate change required.

- 778 units plus CSP/catalog/assets: `.test-data/card-planets-units-final.log`.
 247 pictures, zero missing, seven pre-existing placeholder references.
- Source 308 workflow +18 restart: `.test-data/electron-smoke-1790224310135/report.json`.
- 151 source window checks: `.test-data/window-smoke-1790224408269/report.json`.
- Installer/ZIP/fuses/notices and460 source matches:
 `.test-data/card-planets-artifact-inspection/report.json`.
- Actual packaged305 workflow +15 restart +7 normal startup +33 controlled
 network +5 cache restart: `.test-data/packaged-smoke-1790224525995/report.json`.
 Includes new read-only historical view, offline image decode, literal hostile
 text/missing-location fallback, process-restart locator and emulated640x480 layout.
 Normal/small `saved-card-planet*.png` screenshots in that directory inspected.
- Packaged transfer31+7: `.test-data/packaged-transfer-1790224613808/report.json`.
- Packaged security44: `.test-data/packaged-security-1790224622291/report.json`.
- Bounded Defender scan with remediation disabled reported no threats:
 `.test-data/card-planets-defender.log`. This is not a security guarantee.
- Tests used isolated profiles, software rendering, sequential GUI harnesses and
 graceful exits. Installer/uninstaller inspected, not installed/run. No fresh
 physical Windows DPI/touch/audio, live community-server or long-soak claim.

## Local artifacts and promotion

Unsigned Setup: `dist/card-planets/HD2-Chaos-Slot-Machine-Setup-local-card-planets-win-x64.exe`.
Portable ZIP: `dist/card-planets/HD2-Chaos-Slot-Machine-local-card-planets-win-x64.zip`.

SHA-256:

- Setup: `0130e2ea6e5952ded8526b9494d4e257ac515197a375ad479d5858b13f7326af`
- ZIP: `58f2ef3a7a86f94e213c6710da30735d22df25f180cd35f15ffbef0bedd6993c`
- ASAR: `e877eb4aa637952e9ab42ee3b4f31ecb7c974c6204087bdf12983e873c18a8e7`
- EXE: `de570ed3d0e4ee2c34296d815159eb0ecd7aa66d111af1565ac2b160d78ebf4a`

Existing Desktop shortcut now uses `scripts/start-card-planets-review.cmd` and
the same `.test-data/mission-owner-review` profile. Save/shortcut backup:
`.test-data/card-planets-promotion-20260924-003734`.107 old eligible-map build files
archived/hash-verified at `.test-data/accepted-builds/eligible-map`, with adjacent
recovery manifest. Installed baseline and review save unchanged. No duplicate
Desktop files or permanent deletion. Active dist: installer-shell +card-planets.
Do not rerun the one-off `.test-data/promote-card-planets.ps1`.
Post-archive27 inventory regression checks passed in
`.test-data/card-planets-archive-tests.log`; shortcut target and cleared test lock verified.
No version bump, GitHub publication or commit. Next: owner feedback and verified
special-activity source research; outstanding rights/signing/M7 gates unchanged.
