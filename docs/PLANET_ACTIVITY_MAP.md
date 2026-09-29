# Reported planet activity — local review, September 24, 2026

Branch: `codex/planet-activity-map`. Continues the reviewed source foundation in
`PLANET_ACTIVITY_SOURCE_AUDIT.md`. Local implementation, not a public release.

## Player behavior

Hover/focus a planet or open its details to see original line icons and short
**Reported activity** labels when the community raw-status feed supplies a
reviewed code for that exact planet ID. The mapping covers 15 groups / 23 codes:
Jet Brigade, Hive Lords, several Terminid strains/rampages, Incineration Corps,
Dragonroaches, heavy/Factory Strider/Hulk/Devastator surges and heavy SEAF presence.
Paired codes collapse to one badge. No activity is inferred from a planet name,
weather, faction, Major Order wording, or another planet's report.

Unknown codes are counted as unreviewed. Missing reports do **not** mean no
special enemies. These are community-reported conditions, not guaranteed
encounters or verified copies of a player's game client. No new mission
availability, selection eligibility, equipment odds, naming or scoring rules.
Historical cards remain unchanged.

The optional service refreshes at startup, every five minutes while active,
and on stale reconnect/resume. The open map requests an inspection refresh
at one-minute intervals through the existing shared refresh lifecycle. Its
Refresh control also refreshes activity. Hover itself makes no requests.
Each service transaction discovers the current war ID before fetching status.
Requests are anonymous, bounded, timed out, deduplicated, and subject to a
30-second cooldown, server Retry-After and exponential backoff. This is not
second-by-second synchronization; the community service can lag the game.

The report date is local retrieval UTC, **not source-update UTC**. An unchanged
internal war counter does not renew that date. Regressed or conflicting counters
are rejected. Offline/failed/old reports say **Cached activity · Unconfirmed**;
first launch without a report shows no fabricated activity. A newly discovered
war invalidates the previous in-memory report before status fetching.

## Code and storage

- `assets/planet-activity.js`: strict pure decoder and reviewed mapping, promoted
  from the research adapter; the old script now imports this implementation.
- `assets/planet-activity-service.js`: independent lifecycle/cache. Key
  `hd2csm_planet_activity_v1`; no player save schema change. Invalid, future-version
  or externally changed caches are preserved. Storage failures allow memory-only
  operation. Network activity never blocks randomization.
- Map model/session/app/view share this optional service and the same hover,
  keyboard and details rendering. Renderer source is allowlisted locally.
- Original repo-native SVG symbols. Pinned community dictionary attribution and
  MIT notice bundled as `assets/planet-activity-LICENSE.txt`, with an entry in
  `THIRD_PARTY_NOTICES.md`. No downloaded game icons or third-party map artwork.

## Executed verification

- **810 unit tests**, CSP/catalog/assets passed. 247 local image references,
  zero missing; seven pre-existing fallback references. Evidence:
  `.test-data/activity-map-units-final.log`.
- **62** isolated source map-view checks, including badges, paired-code collapse,
  unknown labels, keyboard preview, cached/unavailable transitions and narrow
  action reachability. Normal and 640px screenshots visually inspected:
  `.test-data/galaxy-view-1790226572833`. These are explicitly synthetic activity
  fixtures, not claims about Hellmire's live activity.
- Source workflow **308 + 20 restart** and window suite **151** passed:
  `.test-data/electron-smoke-1790226473980`,
  `.test-data/window-smoke-1790226601513`. Window sizing uses Electron emulation,
  not physical Windows scaling. Six additional activity integration assertions
  were subsequently added and run through the packaged workflow below.
- Actual public service probe passed with **273 planets / 118 effect records**:
  `.test-data/activity-service-1790226582997/report.json`. One bounded live
  observation, not continuous monitoring or game-client comparison.
- Built Windows installer and portable ZIP under `dist/activity-map`. ZIP CRC,
  runtime/content checks, **463 source file matches**, installer payload/fuses
  and notices verified: `.test-data/activity-map-artifact-inspection/report.json`.
- Actual packaged EXE: **311 workflow + 15 restart + 7 normal startup + 33 network
  + 5 cache** passed with graceful shutdown. Includes production activity service
  plus actual map view under controlled responses, restart-cache decoding,
  network failure and unchanged current/historical cards:
  `.test-data/packaged-smoke-1790226858138`.
- Bounded Defender scan of `dist/activity-map`: no threats reported
  (`.test-data/activity-map-defender.log`); not a security guarantee.
  Authenticode remains `NotSigned`.
- Packaged import/export **31 + 7 restart**, renderer security **44** passed:
  `.test-data/packaged-transfer-1790226954440`,
  `.test-data/packaged-security-1790226962962`. GUI suites ran sequentially with
  isolated profiles, software rendering and verified graceful shutdown.

## Desktop handoff

Existing Desktop shortcut now targets `scripts/start-activity-map-review.cmd`,
launching `dist/activity-map/win-unpacked/HD2 Chaos Slot Machine.exe` with the
same `.test-data/mission-owner-review` profile. Save and shortcut backed up at
`.test-data/activity-map-promotion-20260924-011712`. All 107 superseded card-planets
build files moved into `.test-data/accepted-builds/card-planets` and hash-verified;
adjacent recovery manifest and old-launcher fallback retained. Installed app and
review save hashes unchanged. No permanent deletion or extra Desktop files.
**Do not rerun `.test-data/promote-activity-map.ps1`.** Active dist keeps only
the installer-shell baseline and activity-map preview. Desktop download package
was not republished or silently replaced; this is the existing review shortcut.

Installer SHA-256:
`df6e1a0e2126f1d180f4b4a8ea27e0f140d9b9e9fdc0dd50510321c1adc4dffa`

ZIP SHA-256:
`ebe6f002a72d06731c650ed075d6290ad9612979a5207bf915ac27d81e9738d9`

ASAR SHA-256:
`d47ea9060df765b7983b5f1009f2aebfac24c013e26821c534d94cd4648422ae`

An initial unit fixture incorrectly combined a fixed test clock with a
wall-clock atlas timestamp; the fixture was corrected and the final suite
passed. Initial screenshot framing was also corrected; earlier evidence is
retained, not represented as final visual acceptance.

## Remaining limitations / next task

Owner should check a reported planet in-game and confirm label/icon readability.
Absence of a badge never establishes absence of an enemy. Source mappings remain
reviewed/release-based; raw feed changes may temporarily leave activity unknown.
Run a longer refresh/reconnect soak before public release. Physical touch/DPI,
audible playback and long-duration stability remain unverified here. Installer
and uninstaller were inspected, **not executed** in this task; clean Windows
install/uninstall testing remains deferred. Existing rights/signing/public
release gates remain open. No version bump, commit or publication.
