# Public development handoff — September 29, 2026

Owner explicitly approved a public development branch/PR and private vulnerability
reporting. This is **not approval to merge, tag or publish the official1.0 release**.
Branch: `codex/release-readiness`; target: `main`.

## Prepared source

Accumulated project features, reviewed assets/provenance, license materials,
source tests and release safeguards are included. Initial inventory:972 source
files,601 changed/new paths,47.7MB total source content. Only known source roots
and reviewed root files were staged. No tracked deletions, symlinks, files over
20MiB or unexpected binary archives. Four installer-license/source archives are
intentional. All item-image references resolve to included source files.

Excluded: dependencies, installed/runtime builds, personal cards, backups,
credentials, local test profiles/screenshots and downloaded research recordings.
Paths inside historical reports refer to local evidence, not included user data.
This scope review is not exhaustive malware or artwork-rights clearance.

## Clean checkout issue fixed

A clean index export exposed two failing tests: CRLF conversion changed retained
Ironclad vector hashes and the deterministic brand SVG. Extended `.gitattributes`
to preserve all `assets/**/*.svg` bytes; re-indexed the original working bytes.
Added a regression test. No artwork redraw or runtime behavior change.

- Development checkout: **909/909 tests pass**, CSP/catalog/assets pass.
- Fresh source-only checkout with independent `npm ci --ignore-scripts`:
  **908 pass,0 fail,1 expected skip** (private retained screenshot-source pixel
  reproduction). No personal evidence folder was copied. Normal hosted CI uses
  `npm ci` including lifecycle hooks, which this local clean check does not prove.
- Fresh npm audit:0 known vulnerabilities. Fresh bounded credential-pattern
  scan retained locally; no matched values are printed or uploaded.
- Existing packaged end-to-end checks and owner basic acceptance are recorded in
  `OWNER_RUN_ACCEPTANCE.md`. Hosted CI still requires actual run evidence.

Local evidence: `.test-data/github-review-2026-09-29/`, including the reviewed
source manifest, clean installation/test logs, initial line-ending failures,
fixed clean test results, final tests/audit and credential scan.

## Repository setting

Private vulnerability reporting was enabled via the authenticated owner and
verified true on September29. Updated `SECURITY.md`; existing Desktop/download
copies still contain their previously bundled guide. No other repository setting
was changed. Main protections remain as observed in `GITHUB_READINESS_CHECK_2026_09_29.md`.

## Remaining release boundary

Do not treat a green PR as official-release approval. Final candidate packaging,
clean-Windows lifecycle decision, notices/rights/signing/distribution decisions,
final-byte scan/checksums and owner approval remain separate. Source stays labeled
local preview and the release gate is not bypassed. No account security setting,
main merge, release workflow dispatch or publication is authorized by this handoff.
