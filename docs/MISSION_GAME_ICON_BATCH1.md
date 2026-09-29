# Mission game icons — first verified batch

September 27, 2026. Branch: `codex/mission-game-icons`.

## Scope

Owner requested correct in-game mission images, continuing the earlier explicit
approval for exact screenshot crops. This bounded batch replaces presentation
for 23 of the 60 catalog identities. The other 37 retain original placeholders;
they are not presented as verified game icons. Custom missions keep their generic
symbol. No names, IDs, eligibility, durations, scoring or saved records changed.

Sources are public in-game mission-description screenshots hosted by the
Helldivers Wiki. We did not import contributor SVG tracings, extract game files,
redraw, recolor, remove backgrounds or generate imitations. The small screenshot
background around each white hexagonal badge is deliberately retained.

## Reproducibility and credit

- `assets/missions/game-icons/provenance.json`: per-mission source/file URLs,
  uploader, original dimensions, crop rectangle, original and output SHA-256.
- `scripts/prepare-mission-game-icons.js`: offline exact-pixel crop generator.
- `.test-data/mission-game-icon-sources/originals`: original screenshots retained
  for recovery and pixel comparison; not shipped. The 23 downloads created for
  this task were moved here with exact-path and hash checks, not duplicated.
- `.test-data/mission-game-icon-sources/crops.png`: inspected contact sheet.
- `assets/missions/ORIGIN.md` and `THIRD_PARTY_NOTICES.md`: distinguish these
  game-derived PNGs from the existing 24 original SVGs.

Game-image rights remain unestablished. User preference for noncommercial local
use does not change the public-release clearance state. The distribution audit
classifies these separately and includes their source records.

## Tests and delivery

- 857 units, CSP, catalog and local assets pass. Seven focused visual/pixel tests
  initially passed; the final unit suite also includes archive-recovery coverage.
- Actual packaged EXE: 321 workflow, 16 restart, 9 normal startup, 33 network,
  5 cache, 31+7 transfer, 44 security and 152+13 gear checks pass. All23 PNGs
  decode offline. The selected ICBM hero uses the correct image and credit title.
- Reports: `.test-data/packaged-smoke-1790485979649`,
  `packaged-transfer-1790486072293`, `packaged-security-1790486080571`,
  `packaged-gear-1790486085369`. Packaged mission screenshot inspected.
- 510 packaged source files, ZIP, installer payload, fuses and notices verified:
  `.test-data/mission-game-art-artifact-inspection/report.json`. Per-file source
  inventory verified in `.test-data/mission-game-art-inventory.json`.
- Defender custom scan found no threats; this is not a security guarantee.
  Unsigned installer was inspected, not executed. No new clean-Windows, physical
  display/audio or in-game acceptance claim.
- Same Desktop shortcut now launches `dist/mission-game-art/win-unpacked/HD2
  Chaos Slot Machine.exe` through `scripts/start-mission-game-art-review.cmd`.
  Backup `.test-data/mission-game-art-promotion-20260927-011528`.
  107 prior card-sector files archived and hash-verified; no permanent deletion.
  Installed baseline and owner-review save unchanged. No extra Desktop copies,
  version bump, commit, push or publication. Do not rerun the promotion script.

ASAR SHA-256: `badbf157d82e1f9faa60f135330f484951a4dd87b996ff7f49d92e2ce30039dc`.
Setup SHA-256: `158c6db079b1d81fcbf4a8f18d8d26d733e29a912c62737c0899081db3212b89`.

## Remaining artwork work

Verify exact sources for the remaining 37 mission identities, especially newer
Illuminate, regional/event and Commando missions. Do not borrow a similar icon
solely from its name, and do not claim the entire mission catalog is now complete.
