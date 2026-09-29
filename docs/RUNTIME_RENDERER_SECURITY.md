# Runtime and renderer security — local review

Branch `codex/runtime-renderer-hardening`, September 16, 2026. This is a bounded continuation of `RELEASE_RIGHTS_SECURITY_REVIEW.md`, not approval to publish artwork or a claim that security review is complete.

## Implemented

- Updated Electron from 43.3.0 to the registry's current stable **44.4.1**, pinned exactly in package/lock files. Ran `npm ci` to install the lock. Software rendering and graceful exclusive-test safeguards retained; no drivers or Windows protections changed. Application version remains 1.1.14 internally.
- Replaced broad inline-JavaScript allowance with the SHA-256 hash of the one reviewed inline application script. Inline HTML event attributes are explicitly forbidden; eval is not allowed. Packaged external script files remain allowed from the app's own origin. Inline CSS remains allowed because existing layout uses it.
- Added one early-loading external image-error handler, removed all eight inline image-error attributes, kept local rank fallback behavior and safe N/A text. Remote image URLs remain provenance metadata; runtime image helpers no longer request them. CSP allows only same-origin, data and blob images, preserving local image/export decoding. HTTP-browser JSON fetches require same-origin `connect-src`; the only external connection origin allowed by CSP remains the live-war API.
- Fixed **20 unescaped imported card-ID attribute interpolations** in Results and its modal. This was an HTML-attribute injection risk; do not describe it as proven operating-system code execution. The fix preserves literal legacy IDs and escapes them for HTML instead of changing saves. Actual malicious-looking import fixtures exercise both Results and modal rendering.
- Added renderer security tests to exercise real CSP enforcement and local fallbacks. Source tests cover desktop and a no-preload browser-emulation window; packaged runner supports `--security` and checks its actual Electron version.
- Packaging verification now requires IPC/image safeguards, project rights/security notices and Electron/Chromium notices. Public-release readiness remains blocked independently of passing these tests.

## CSP maintenance

`python scripts/renderer_csp.py --write` mechanically refreshes the meta policy/hash **after reviewing script changes**. `npm test` and the Windows prebuild check reject a stale hash. The catalog generator uses the same helper, so reviewed catalog regeneration keeps the hash aligned. Hashing normalizes CRLF/CR to LF, matching HTML parser text; tests verify both line endings. A hash is a content allowlist, not proof that the allowed script is trustworthy.

Do not re-add `unsafe-inline` for scripts to bypass a stale hash or failing test. Programmatic listeners/functions from reviewed scripts remain usable; untrusted HTML must still be escaped. Filesystem `file:` loading and same-origin script permissions remain subjects for the next security review; this change does not claim protection if the local installation itself is already compromised.

## Evidence and limits

New notices/security fixes cannot be claimed for an older installer simply by updating its README. No native installer execution, personal-profile use, paid signing, GitHub publication or artwork permission request is part of this bounded test build.

Reference: [Electron security guidance](https://www.electronjs.org/docs/latest/tutorial/security), [script CSP and hashes](https://developer.mozilla.org/en-US/docs/Web/HTTP/Reference/Headers/Content-Security-Policy/script-src). Dependency version was read from npm's registry; installed source and packaged runtime versions are checked separately.

## Executed verification

- `npm ci` completed from the updated lock. npm audit reports **zero known vulnerabilities** across 315 dependencies, not proof of no flaws. Some build-tool transitive packages still emit deprecation warnings (inflight, rimraf, glob, boolean); no blind forced upgrade performed. Log `.test-data/runtime-renderer-npm-audit.json`.
- **304 unit tests**, catalog/assets and exact CSP checks passed; 247 local references, zero missing. `.test-data/runtime-renderer-unit-final.log`.
- Source lifecycle safety **7+8**, `.test-data/desktop-safety-1789544985732/report.json`; workflow **54+8**, `.test-data/electron-smoke-1789545053191/report.json`; transfer **36+5 desktop / 29+5 browser emulation**, `.test-data/transfer-health-1789545266574/report.json`.
- Final source security **26 desktop + 26 browser-emulation** checks, `.test-data/renderer-security-1789545172748/report.json`. Verifies blocked inline/attribute/remote-script/image/frame probes, no probe network dispatch, legitimate data/blob images, local fallback termination, four gear categories and actual hostile-looking JSON import through Results/modal. Expected CSP frame warnings are intentional probes, not startup failures. All GUI processes exited normally under the exclusive software-rendered harness.
- A generator byte-idempotence check initially detected 45 line-ending conversions, with **identical normalized HTML**. Fixed the generator to preserve surrounding/matched-block line endings. Restored only the previous line-ending bytes after asserting normalized equality; repeated generation and package/source parity then passed. Added an isolated temporary-file regression. No runtime behavior was changed to make the hash check pass.
- Actual packaged EXE passed **13 phases**, including security **26**, core workflow **51**, restart **8**, normal/fullscreen **7**, controlled network **14**, gear **97+11**, dedup **131+28**, real old-EXE seed/upgrade **18+30**, transfer **26+4**. Gear/dedup/transfer each add three file-backend roundtrip checks. Every phase exited normally; old save backup preserved. Packaged security also verifies Electron **44.4.1** from CDP runtime metadata. Evidence `.test-data/runtime-security-acceptance.json` lists all five run directories.
- Inspected packaged Armory screenshot; local images and established layout remain present. Existing acronym logo still exists and is explicitly pending full-word branding; this is not the final public design.
- ZIP CRC/runtime/installer embedded payload verified. **382 packaged source comparisons** passed; ZIP ASAR matches unpacked runtime. All five ZIP companion guides/notices byte-match source; Electron/Chromium license notices are present. `.test-data/runtime-security-source-parity.json`, `.test-data/runtime-security-artifacts.log`.
- Microsoft Defender custom scan of the exact new `dist/runtime-security-review` folder returned exit 0 and **found no threats**, remediation disabled, `.test-data/runtime-security-defender.log`. No protection disabled or exclusion added. Signature is **NotSigned**. Scan/hash consistency does not prove publisher identity or immunity to attacks.

### Artifacts

`dist/runtime-security-review/`:

- `HD2CSM-Setup-local-runtime-security-win-x64.exe`: 153,703,134 bytes; SHA-256 `e7f10a79daa4f3755f5d8dca71ce953bcd8375f89d5dbc57ee437ec61a57a7ae`.
- `HD2CSM-local-runtime-security-win-x64.zip`: 195,306,988 bytes / 83 entries; SHA-256 `d42a4302bc9cd1be7a781397ec054771dca554dfef6ca1b79c6ddb2737d2a364`.
- App ASAR SHA-256 `74406b262ccdc540d139855cd5272ad297218f441adfdb7db4cc824efc9ee122`.

Use `scripts/start-security-review.cmd` for separate `.test-data/runtime-security-owner-review` saves. The packaged EXE was launched; **the native installer was not executed**. Native dialogs, upgrade/uninstall registration, audible playback, physical Windows DPI/trackpad and long-duration stability are not certified by these tests.

### Cleanup and remaining work

Archived/hash-verified 87 superseded Hyena/Revenants files at `.test-data/desktop-cleanup-2026-09-16/superseded-hyena-revenants-candidate/hyena-revenants-review`. Adjacent manifest/result records restoration paths. Prior catalog launcher retargeted there; no profile deleted. Only accepted `preview-v1.1.10` and latest `runtime-security-review` remain active in `dist`. No Desktop duplicate, installed-app replacement or permanent deletion.

Public release remains blocked. Next: release workflow least-privilege/action pinning, full Git-history/sensitive-file and remaining DOM review, evaluate file-protocol/fuse hardening, verify/report repository protection settings. Artwork permission/provenance, exact dependency/license inventory, full-word branding and safe public-1.0 version transition remain separate gates. These local artifact filenames are historical internal labels, not the requested final full-word public filenames.
