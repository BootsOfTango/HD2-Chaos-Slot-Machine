# Electron patch update — September27,2026

Owner approved the bounded runtime patch after the local security health check.
Electron changes from exact44.4.1 to exact44.4.5. App version remains1.1.14
(display1.0 Local preview); no catalog, artwork, UI, save schema or gameplay change.
Lockfile comparison against `.test-data/runtime-patch-baseline` permits changes
only to root Electron declaration and node_modules/electron. `npm ci` completed;
other315-tree dependencies were not opportunistically upgraded.

## Why

The official [44.4.2 notes](https://releases.electronjs.org/release/v44.4.2)
include Chromium152.0.7977.130 and upstream fixes;
[44.4.3](https://releases.electronjs.org/release/v44.4.3) includes ASAR file-access
improvements; [44.4.4](https://releases.electronjs.org/release/v44.4.4) includes
window-ready and DevTools fixes; [44.4.5](https://releases.electronjs.org/release/v44.4.5)
backports more browser-engine fixes. Primary notes and npm44.4 version list
reviewed September27. No claim that a particular vulnerability was exploitable
in this app, nor that patching proves complete security.

## Prior bounded health check

September27 npm audit: zero reported known advisories; npm ls --all exits0.
Source pattern audit initially flagged a synthetic credential-shaped URL in
an artwork test. The fixture now constructs that deliberately rejected URL
at runtime, preserving the test and strict scanner; no real credential found.
Final local scan: zero findings across locally reachable history/current
nonignored files. Reports under `.test-data/security-check-20260927-*`.
33 focused source checks,12 fixture checks, and44 prior-packaged security
checks passed (`packaged-security-1790482036204`). Not comprehensive detection.

## Candidate validation

Software rendering, exclusive sequential GUI testing, graceful shutdown and
isolated saves retained. Completed checks:

- `npm ci`, zero reported npm advisories, 845 unit tests plus CSP/catalog/assets.
- Source desktop safety: 7 write +8 restart checks; 151 window checks.
- Installer/ZIP inspection: 486 source files, runtime fuses and bundled notices.
  Report: `.test-data/runtime-patch-artifact-inspection/report.json`.
- Packaged security: 44 checks (`packaged-security-1790482539241`).
- Actual old-EXE origin upgrades: fallback/native/interrupted scenarios, each
  with migration and restart (`packaged-smoke-1790482568750`).
- Runtime evidence records `Browser.getVersion` in each phase and asserts
  Electron44.4.5 for the candidate, not the legacy migration fixture.
- Defender candidate scan found no threats; not a security guarantee.

The app ASAR is unchanged (`2e3e78b714c18ed4735e1278740639c3af0e5285877bb5cd1d21d34fc7083fce`),
as expected for a runtime-only change. The EXE hash is
`1d5f9435bcc8ad195e49ec6ca8f5ead9da216a2dda27e237be03795fb81a0c8b`;
installer hash `5702e4c79ef950475f6b9affafbd4d27cfcd411d14d1cadf36cb850f6a7e33fc`.

- Packaged workflow: 316 write +16 restart +9 startup/window +33 controlled
  network +5 cache checks (`packaged-smoke-1790482614465`).
- Packaged import/export: 31 +7 restart (`packaged-transfer-1790482693954`).
- Packaged gear: 152 +13 restart (`packaged-gear-1790482702238`).
- Fullscreen startup and Ironclad Armory screenshots visually inspected; clean
  transparent weapon art and common thumbnail backdrop retained.

## Local delivery

Existing Desktop shortcut now targets `scripts/start-runtime-patch-review.cmd`.
Same owner-review profile; save/shortcut backup:
`.test-data/runtime-patch-promotion-20260927-001903`.
All107 superseded weapon-thumbs files moved and hash-verified under
`.test-data/accepted-builds/weapon-thumbs`, with adjacent restoration manifest.
Historical launcher and inventory resolver support that exact archive.
Installed baseline and owner-review save hashes unchanged. Active dist contains
only `installer-shell` and `runtime-patch`; no new Desktop duplicates, permanent
deletion, version bump, commit or publication. Do not rerun the promotion script.

Installer remains unsigned/local and was inspected, not executed. No public
publication or personal uninstall. Physical DPI/audio, clean Windows lifecycle,
long-duration use, artwork permissions and owner acceptance remain separate gates.
