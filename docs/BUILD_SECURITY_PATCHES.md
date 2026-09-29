# Build security patches — September 29, 2026

## Delivered scope

Owner approved the remediation proposed in
`RELEASE_READINESS_REVIEW_2026_09_28.md`. Branch:
`codex/build-security-patches`. Existing working changes preserved.

Targeted `npm update fast-uri undici --ignore-scripts --no-fund` changed exactly
three lockfile package entries, within existing compatible dependency ranges:

| Package path | Before | After |
| --- | --- | --- |
| node_modules/fast-uri | 3.1.6 | 3.1.8 |
| node_modules/undici | 6.28.0 | 6.29.0 |
| node_modules/@electron/get/node_modules/undici | 7.29.0 | 7.30.0 |

No forced upgrades, overrides, direct dependency additions or package version
change. Electron remains 44.4.5; electron-builder remains 26.15.3. Root manifest
entry is unchanged. Local pre-update lockfile retained in the evidence directory.

`.github/workflows/blank.yml` retains Linux catalog checks, now with explicit
read-only contents permissions, the same SHA-pinned checkout as the reviewed
workflows, disabled credential persistence and a five-minute timeout. Removed
the redundant release-publication trigger; push/PR/manual checks remain.

Three new tests enumerate every workflow and check permissions, pinned actions,
timeouts, checkout credentials and shell-expression handling. Eleven synthetic
unsafe mutations are rejected, including a newly added workflow. Existing tests
still separately enforce the narrowly privileged draft-release job.

## Verification

- Fresh npm audit: **zero known vulnerabilities** (not a safety guarantee).
- **908 unit tests**, CSP/catalog/assets: pass.
- Installer license/source checks: pass; builder notice version unchanged.
- Fresh unpacked Windows packaging with patched tooling: pass. **All 97 output
  files match the accepted card-rules runtime byte-for-byte**, including EXE,
  app ASAR, Electron files, artwork, player guides and bundled legal materials.
- An initial whole-directory equality check rejected two absent files. Inspection
  confirmed `resources/elevate.exe` and `resources/app-update.yml` belong to the
  full installer/publish packaging stages, not the `--dir` check. The final check
  permits exactly these two omissions, no additions and no changed file bytes.
  This is not a new installer/ZIP or installer execution test.
- ASAR remains `72f1e404fb43bbe0e63eb96f4dd70b2c1745f6f6788ae7108ac767f32dc8c22c`.
- Public-release check still deliberately blocks publication. Security evidence
  reference refreshed, status remains pending. Other historical evidence fields
  need final-candidate refresh; no gate is waived.

Evidence: `.test-data/build-security-2026-09-29/` contains pre-update lockfile,
lockfile delta, audit, test/license/packaging logs and `package-parity.json`.
Temporary `packaging-check` output remains there: a scoped cleanup attempt was
blocked by execution policy, and no bypass was attempted. It is not a Desktop
download, accepted candidate, or installation; it can be regenerated. Do not
promote it as a complete installer/portable release.

## Unchanged and next

Desktop remains the accepted **card-rules** preview, with the same saves and
shortcut. No gameplay/scoring/UI changes, installation, personal-save access,
new Desktop duplicates, version bump, commit, push or release publication.
No fresh GUI/Defender/clean-Windows test is claimed.

Next: owner end-to-end acceptance of the accepted app (roll → map/planet →
mission → guided results → save → restart → comments/export and synthetic-copy
card-rule review), then hosted CI/repository checks and remaining M7 gates.
Keep clean-Windows lifecycle, physical audio/DPI, longer-duration/game-client
checks, final notices/artwork/signing decisions and public approval separate.
