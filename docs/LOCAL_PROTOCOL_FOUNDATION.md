# Local protocol and origin migration — first checkpoint

September 16, 2026, `codex/local-protocol-foundation`. **Foundation and isolated proof complete; normal startup is not switched.** No EXE rebuilt or installed. The existing installer does not contain this or the preceding Results selector fix.

## Implemented

- `electron/local-protocol.js`: `hd2-slot://app/index.html` resource handler with a fixed script/JSON/root-image allowlist plus image types under `assets/`. Other HTML, scripts, source, package metadata, private/test files and unsupported methods are denied. Reject malformed encoding, separators/dot segments/Windows alternate streams, ambiguous paths and foreign authorities. Real-path containment and link checks deny symlink/junction escape. Responses have explicit MIME types, `nosniff`, no-store and frame/object/base restrictions; existing page CSP stays intact.
- Scheme registration requests standard/secure/fetch privileges, **not** CSP bypass or service workers. No listening TCP server, external web proxy or credential-based service is introduced. The module is not registered by normal `electron/main.js` yet.
- `assets/origin-bootstrap.html`: script-free, restrictive-CSP page for copying storage before the real renderer boots. Read-only access on the old file origin and writable access on the new origin were tested separately. No preload/application IPC in the experimental migration window.
- `assets/origin-storage.js`: explicitly allowlists 15 save/recovery/cache/preference keys. Snapshot limits: 32 MiB per value / 64 MiB total. Preserves raw damaged recovery values, does not interpret/execute them, and excludes unrelated keys. Any destination save-family data (including backup/damaged data) prevents introduction of an older source save family; existing preferences also win. Completion marker prevents reimporting later-deleted values. Newly inserted keys roll back on write failure; incomplete rollback reports a distinct stop condition. Original storage is never written by the helper.

This copy primitive is **not** a complete transactional startup coordinator. It has not yet created a durable pre-migration recovery snapshot, implemented crash-resume journaling or promoted a browser fallback into the desktop file backend. Do not activate normal migration until those recovery rules are implemented and tested. Malformed state/cache is preserved as data for existing validators, not called valid simply because it copied.

Resource requests can already be URL-normalized by Chromium before reaching the handler. Canonicalized requests still must resolve to an allowed, contained resource; no claim that the handler can reconstruct rejected original traversal syntax. The handler protects renderer exposure, not a locally compromised installation/account.

Reference: [Electron protocol registration, storage and session requirements](https://www.electronjs.org/docs/latest/api/protocol), [Electron security guidance](https://www.electronjs.org/docs/latest/tutorial/security).

## Executed checks

- **326 unit tests passed**, including 12 new router/migration tests; exact CSP/catalog/assets checks pass (247 local references, zero missing). `.test-data/local-protocol-unit.log`.
- Unit cases include allowed resources/MIME types, GET/HEAD, private paths, malformed/traversal/encoded paths, foreign hosts, unsupported methods, outside-root directory junction, valid/missing/damaged/existing-destination/already-copied data, quota failure rollback/retry, incomplete rollback and unsupported/oversized snapshots.
- Source lifecycle safety **7 + 8**, `.test-data/desktop-safety-1789589737318/report.json`.
- Real three-process isolated protocol test **7 seed + 31 migrate + 24 restart** checks, `.test-data/local-protocol-1789589822660/report.json` (supersedes the smaller first proof at `local-protocol-1789589741879`). Uses the actual current file-origin source application to seed synthetic storage, then a script-free reader to prove access without running the old app again. Loads the real renderer on the new origin without desktop preload; the migrated fallback card and offline catalog work.
- Embedded existing renderer/CSP suite: **43 checks** on the custom origin, `.test-data/local-protocol-1789589822660/custom-origin-security.json`. Includes prior quoted-ID/hostile-text probes. The ordinary runner's additional network-dispatch assertion is not included in this count; external requests are canceled by this harness.
- **206 mapped equipment images decoded**, no failures, via the actual protocol; `.test-data/local-protocol-1789589822660/local-image-decode.json`. Additional runtime requests prove catalog reads succeed while private/source/script reads and POST fail; arbitrary `file:` fetch rejected. This is not all possible artwork or a packaged image audit.
- New-origin preferences/card survived process restart; deliberately deleted cache was not resurrected; all allowlisted old-origin values matched exactly afterwards and unrelated original data remained untouched.
- All GUI processes sequential, software-rendered, isolated profile, graceful shutdown, no remaining test lock/process. No normal-entry protocol switch, IPC change, fuse flip, personal profile, native picker/install, audible test, packaged/ASAR test or remote publication. No broad workflow re-run beyond the listed suites; prior workflow evidence remains historical.
- Existing Runtime Security installer SHA-256 remains `e7f10a79daa4f3755f5d8dca71ce953bcd8375f89d5dbc57ee437ec61a57a7ae`. `dist` and Desktop unchanged; no duplicate output or cleanup deletion.

## Exact next implementation

1. Add a main-process startup coordinator: one exclusive profile, a durable bounded allowlisted recovery snapshot/journal, script-free old/new-origin bootstrap, clear failure/retry semantics and no normal renderer save before migration completes. Do not load the old application HTML merely to read storage. Completed migrations must not reintroduce deleted data, including after a partial-copy crash/rollback failure.
2. Preserve precedence of current native `state.json` and its normal backup/recovery path. If no native save exists, validate and normalize the appropriate old-origin/new-origin fallback through existing transfer/state preparation rules before committing to the native backend. Future-version or damaged unrecoverable state must block automatic default overwrites. Existing new-origin state wins over old copies.
3. Switch ordinary main-window load and exact-main-frame IPC/navigation checks together; protect bootstrap windows from application IPC. Update packaged CDP target discovery (currently file-only). Preserve standalone browser startup.
4. Production fuse configuration: disable unused Node entry/options/inspect flags, enable/test ASAR-only/integrity support. Turn off extra file-protocol privileges only after the read-only legacy-storage bridge passes with them disabled. No bit flips in already-tested binaries.
5. Test actual old-EXE seed → new packaged startup, missing/damaged/current-native/fallback/new-origin/interrupted migrations, renderer/workflow/transfer/fullscreen/restart, rejected resources and fuse state. Build one labelled candidate, verify installer/ZIP and normal close; archive old candidate recoverably only after replacement passes. Do not hand out a new installer merely for this isolated foundation checkpoint.

All broader release gates remain pending; this is not artwork permission, final branding, signed distribution or security certification.
