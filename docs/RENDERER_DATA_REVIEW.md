# Renderer data review — local source fix

September 16, 2026. Branch `codex/renderer-data-review`. This increment fixes Results ID lookup and expands security regression coverage. **Not yet included in an installer.** Existing Runtime Security artifacts remain untouched; final production startup hardening is a separate next increment.

## Finding and fix

Three Results paths interpolated imported card IDs directly into CSS selectors: synchronizing edited stats, finding the new-comment field and checking required fields before finalization. An otherwise supported ID containing quotes/brackets could throw `SyntaxError` or alter which elements the selector matched. Previous HTML-attribute escaping prevented HTML injection but did not make a value safe as CSS selector syntax. No OS code execution or credential theft was demonstrated.

Added `findCardFields(root, cardId, key)`: query a fixed `[data-id][data-k]` selector and compare the literal ID/key attributes. All three paths now share that helper. IDs are not rewritten; existing saves remain compatible. Unit cases cover ordinary/quoted/bracketed/backslash/Unicode IDs and attempted selector expansion; unrelated fields stay excluded. The main-script CSP hash was regenerated using the existing checked-in tool, not relaxed.

The first expanded desktop probe failed against the old code. An initial DOMException lost details across Electron's execution bridge; a second diagnostic run exposed the same reporting limitation. The harness now rethrows a normal Error inside the renderer and provides a string fallback outside it. Both failed runs exited normally, no force termination; diagnostics/lock/process checks were inspected before retrying. Final regression explicitly reproduces the old raw selector's `SyntaxError`, then verifies successful synchronization, literal comment insertion and finalization through the fixed paths.

Reference: [MDN selector syntax and exceptions](https://developer.mozilla.org/en-US/docs/Web/API/Document/querySelector). We use exact data equality rather than constructing a selector from external data.

## Review coverage

Inventory: `.test-data/renderer-sink-inventory.txt` (initial line numbers before edits). Reviewed relevant template builders, class/color helpers, numeric formatters, image path lookup and imported-record normalization, plus dynamic-selector uses. External asset scripts use literal toolbar markup or DOM text/property assignment; image sources come from bundled mappings. This is a bounded manual review and synthetic regression suite, not an exhaustive proof of all possible inputs.

| Surface exercised | Result |
| --- | --- |
| Results summary and modal | Literal card IDs, metadata, loadout, environment, textarea notes and comments preserved without injected elements |
| Results edits/comments/finalization | Quoted ID works through the real import/edit/action functions |
| Rank detail, fallback rows, item insights | Markup-like saved names/notes remain text |
| Compare radars/overlay/hover builder | Hostile-looking seed/player/loadout/planet text produces no probe elements |
| Image-export HTML builder | Markup is escaped and literal text retained; this test does not certify PNG raster output |
| Live planet row renderer | Names/faction/sector/biome escaped; real external API availability not tested here |

Tests import benign marker strings containing `<img>`, SVG event syntax, quotes and ampersands. Assert both absence of injected elements/attributes and retention of literal text, rather than relying only on CSP to block script execution. Existing CSP injection/fallback/local-image checks remain active. Synthetic imports are restored inside isolated test profiles only.

Remaining concerns: exhaustive arbitrary JSON shape/fuzz/performance coverage, other advanced render interaction combinations, file-origin privileges and production fuses, and final package validation. No new CVE, full penetration test or malware-free guarantee is claimed.

## Executed checks

- **314 unit tests passed**, CSP/catalog/assets valid; 247 local image references, zero missing. `.test-data/renderer-data-unit.log`.
- Source lifecycle safety **7 + 8**, `.test-data/desktop-safety-1789588923948/report.json`.
- Expanded renderer security **44 desktop + 44 browser-emulation** checks, `.test-data/renderer-security-1789589086638/report.json`. Browser emulation uses isolated Chromium without the preload, not a separate Chrome/Firefox validation. Expected blocked-frame CSP warning is an intentional negative probe.
- Source full workflow **54 + 8 restart** checks, `.test-data/electron-smoke-1789589122255/report.json`.
- Transactional transfer **36 + 5 desktop / 29 + 5 browser-emulation restart** checks, `.test-data/transfer-health-1789589158960/report.json`.
- GUI processes ran sequentially under the shared lock, software-rendered, isolated saves and normal exits. File pickers stubbed; sound context tested but no audible listening. No native install/upgrade, packaged EXE rerun or build in this increment. Previous installer bytes cannot be claimed to contain this fix.

## Startup-hardening implementation plan (not implemented here)

The app currently loads `file:` HTML, and IPC authorization checks the exact file entry URL. Main-process storage is independent of renderer origin, but live-planet cache, audit/browsing preferences and old browser keys are not. The current desktop loader does not simply import every localStorage save, so silent origin replacement is unsafe.

1. Implement a pure tested resource router for one local application host; allow only shipped renderer entry/assets, reject traversal (including encoded/backslash variants), external hosts, credentials, unsupported methods and access to electron/source/private files. Preserve MIME types and CSP; do not register CSP bypass or service-worker privileges.
2. Design a one-time, bounded, non-destructive old-origin storage bridge. Allowlist relevant keys, preserve corrupt/legacy backups, prefer valid existing new-origin/current file saves, never overwrite the original. Exercise missing/damaged/already-migrated/fallback-only cases with isolated old-runtime fixtures before switching normal startup.
3. Register the standard/secure scheme before readiness; install its handler on the actual session. Change main-frame IPC/navigation checks to the exact new entry URL. Keep standalone browser behavior unchanged. [Electron protocol documentation](https://www.electronjs.org/docs/latest/api/protocol).
4. Disable unused production Node entry/options/inspector fuses and assess ASAR integrity/ASAR-only loading in the builder. Disable extra file privileges only after migration/resource tests pass. Preserve source test tooling separately; the packaged harness currently discovers only `file:` targets and needs deliberate updating.
5. Run unit, safety, migration, source workflow and transfer tests, then build one labelled candidate and verify actual packaged/upgrade/security cases. Archive superseded artifacts only after replacement passes. Do not flip bits in an already-tested/signed EXE or change personal profiles to experiment.

Public release stays blocked for broader security work, artwork rights/provenance, dependency/asset notices, full-word branding, version transition and final installer checks. No commits/pushes/tags/releases/settings changes/rights-holder messages, Desktop copies, save resets or cleanup deletions occurred.
