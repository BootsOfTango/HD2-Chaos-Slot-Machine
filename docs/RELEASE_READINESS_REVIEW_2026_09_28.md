# Release security/package review — September 28, 2026

## Outcome

Bounded review complete; **not public-release clearance**. Two remediation areas
remain: vulnerable build dependencies and an older, less-restricted CI workflow.
No application, dependency, installer, Desktop shortcut or personal-save changes
were made. No publication, repository-settings mutation or credential upload.
Branch remains `codex/card-recalibration`; existing working changes preserved.

## Findings

### 1. Build dependency audit fails (fix before release)

Fresh `npm audit --json` reports two vulnerable packages: one high (`fast-uri`)
and one moderate (`undici`), covering three advisories. Exact installed paths:

- electron-builder 26.15.3 → app-builder-lib → ajv 8.20.0 → fast-uri **3.1.6**.
- electron-builder → app-builder-lib → @electron/rebuild → node-gyp → undici **6.28.0**.
- electron 44.4.5 npm downloader → @electron/get 5.1.0 → undici **7.29.0**.

Maintainer patches: fast-uri **3.1.7**, undici **6.28.1 / 7.29.1** for these
respective major lines. Review compatible resolution and lockfile changes; do not
blindly use `npm audit fix --force` or change Electron major versions.

Primary sources, checked September 28:

- [fast-uri authority injection](https://github.com/fastify/fast-uri/security/advisories/GHSA-qw65-cvwx-89v3)
- [fast-uri malformed authority host confusion](https://github.com/fastify/fast-uri/security/advisories/GHSA-58mr-gqgx-xq4g)
- [undici compressed WebSocket denial of service](https://github.com/nodejs/undici/security/advisories/GHSA-3wwx-pv8p-q78v)

Exposure distinction: these npm dependencies are build/download tooling. The
accepted app ASAR contains 585 entries and **no node_modules, fast-uri or undici
entries**, consistent with builder exclusions. No WebSocket/undici/fast-uri use
was found in application `electron`/`assets` JavaScript. This is not proof of a
player-exploitable path or infection. It also does not audit Electron's separately
embedded Node/Chromium code; npm's dev-dependency label alone cannot establish
runtime safety. Electron is pinned to 44.4.5, matching the npm latest lookup at
review time. Recheck runtime advisories before publication.

### 2. Legacy workflow does not follow current hardening policy

`.github/workflows/blank.yml:17` uses mutable `actions/checkout@v4`. The workflow
has no explicit token permissions, checkout credential-persistence override or
job timeout; it also runs on published/prereleased releases. Actual token rights
depend on repository defaults, which were not newly inspected here.

The newer validation/release workflows already pin actions and restrict tokens.
Consolidate this redundant catalog check into that coverage, or apply the same
pinning/read-only/no-persisted-credentials/timeout policy. Add a test covering
**every** workflow so an older file cannot silently escape the policy.

### 3. Release evidence manifest needs refreshing, not gate bypassing

`docs/public-release-readiness.json` still cites earlier Installer Shell/Ironclad
counts and audits. Its pending/blocked state is appropriate, but the reasons are
historical rather than a current candidate summary. Replace evidence references
when remediation and final checks finish; do not mark gates passed merely because
unit tests pass. `npm run verify:public-release` correctly exits 1 with all six
approval/evidence gates unresolved and channel `local-preview`.

## Verified protections and evidence

- Fresh **905/905 unit tests**, CSP, catalog and asset validation pass.
- Sandboxed/context-isolated renderer, Node integration disabled, exact trusted
  IPC sender checks, denied permissions/downloads, constrained local protocol,
  navigation restrictions and packaged runtime fuses reviewed. These follow the
  [Electron security checklist](https://www.electronjs.org/docs/latest/tutorial/security)
  but are not a complete independent penetration test.
- Card recalibration uses native reviewed-state hashing, explicit confirmation,
  verified recovery copy, validated whole-save candidate and durable replacement.
  Browser conflict handling and bounded import validation remain covered by tests.
  No real player card was recalibrated, removed or opened for this review.
- Selected credential-pattern scan: **873 reachable commits, 1,065 blobs, 969
  nonignored working files; zero matches**. Does not cover arbitrary passwords,
  entropy, malware, unreachable history or remote-only refs. No values uploaded.
- Fresh SHA256 checks match the accepted ASAR, Setup and ZIP exactly. Prior final
  artifact inspection checked 552 source files, 14 legal files, embedded installer
  components, ZIP/installer payload parity and fuses. That inspection and packaged
  smoke tests are prior delivery evidence, not newly executed GUI/installer tests.
- No new Defender scan: previous final-byte delivery scan reported no threats.
  Hash equality preserves artifact identity, not a guarantee of safety against
  new signatures. Scan the eventual public artifacts again.

Fresh local evidence: `.test-data/release-review-2026-09-28/` contains
`npm-audit.json`, `dependency-tree.json`, `electron-latest.json`,
`git-pattern-audit.json`, `public-gates.log`, `unit-tests.log` and
`artifact-check.json`. These diagnostic files remain local/ignored.

Accepted hashes:

- ASAR: `72f1e404fb43bbe0e63eb96f4dd70b2c1745f6f6788ae7108ac767f32dc8c22c`
- Setup: `0871adb3d2f9114dcd05fb6ae8b74804b13bd74317e7bf20db0bc18eda8de96e`
- ZIP: `cded6fc26117bd1f36bcf866b57afb689fef6717d8897c141387d713efbb11f5`

## Next bounded task

After owner approval: update only the affected dependency resolutions, harden or
consolidate the legacy workflow, add regression coverage, then rerun dependency
audit/full tests/license preparation checks. Rebuild and reverify a candidate if
packaging inputs change; preserve the accepted Desktop build until validation.

Still separate: hosted CI and current repository enforcement/reporting checks,
owner end-to-end run, physical audio/DPI/game-client/long-duration checks, isolated
clean-Windows install/uninstall, final media/license inventory, artwork-rights and
signing/distribution decisions, final artifact scan and explicit public approval.
