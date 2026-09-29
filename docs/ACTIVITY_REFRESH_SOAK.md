# Activity refresh endurance checks — September 24, 2026

September27 evidence correction: the historical workflow below left the current
selection empty before this soak. Saved-card/cache/timer checks remain valid, but
its "confirmed run" byte-equality did not exercise a populated locked run. The
harness now seeds and asserts one before timing; restart checks saved cards and
the intentional reset of unsaved rolls. See `RUNTIME_ENDURANCE_CHECK.md` for the
new runtime evidence. Original September24 report is retained below as history.

Branch: `codex/activity-refresh-soak`. Test-only follow-up to
`PLANET_ACTIVITY_MAP.md`; no runtime/catalog/save-format changes or new build.

## Scope and reusable checks

`test/activity-refresh-soak.test.js` exercises the production activity service
and map session together, using a chronological deterministic clock. The view
is stubbed in these Node tests; real packaged view coverage is separate below.

- 72 simulated hours alternate normal updates, unchanged counters, malformed
  responses, server rate limits, offline periods and hidden windows. More than
  1,000 service requests exercise deduplication, bounded polling and backoff.
- 200 repeated map open/close and connection transitions check timer cleanup.
- Three simulated days of unchanged counters retain the original report date
  and stale status until the counter advances.
- A war rollover after repeated failures clears old in-memory effects; recovery
  and cache rehydration use the new war ID.
- Recent reconnects skip unnecessary fetches; stale reconnects probe the server
  and preserve unconfirmed data if the response is malformed.
- No writes touch the unrelated save sentinel. Disposed sessions leave no
  timers/listeners and make no subsequent requests. These are not multi-day
  wall-clock, Windows sleep, game-client or physical-device tests.

`scripts/activity-soak-phase.js` and the existing safe packaged runner add:

```
node scripts/run-packaged-smoke.js "dist/activity-map/win-unpacked/HD2 Chaos Slot Machine.exe" --activity-soak
```

This explicitly targets the accepted runtime, verifies software rendering, uses
an isolated synthetic profile and blocks external network requests. It first
creates realistic test cards through the existing workflow, then opens a
controlled activity view. The first automatic five-minute service interval uses
**real renderer time**, not accelerated timers. Subsequent disconnect, malformed
reconnect, recovery and hidden/resume checks use explicit simulated freshness
offsets. A final cache record is re-dated to real test time before a separate
process restart; that checks persisted codes, not simulated future freshness.
The ordinary restart checks run afterward. Shutdown is graceful and exclusive;
there is no forced-kill fallback.

## Evidence

- Five new endurance tests passed:
  `.test-data/activity-refresh-soak-units-final.log`.
- Full **815 units**, CSP, catalog and assets passed:
  `.test-data/activity-refresh-soak-all-tests-final.log`.
- Final packaged run **passed**: **311 workflow +14 activity-soak +5 cache
  restart +15 ordinary saved-state restart** checks, with verified graceful
  shutdown after each process. Evidence:
  `.test-data/packaged-activity-soak-1790227710883/report.json` and
  `.test-data/activity-refresh-soak-packaged-final.log`.
- The first real five-minute interval made exactly one discovery/status follow-up
  transaction. The badge updated from the controlled Hive Lords fixture to Jet
  Brigade. Offline, failed stale reconnect, recovery and hidden/resume behavior
  passed. Confirmed run and saved Results stayed byte-identical through refreshes
  and process restart. This is controlled packaged-renderer acceptance, not a new
  live-server observation or a multi-day stability certification.

The first packaged attempt passed the real-time interval but failed a subsequent
test assertion: the test advanced only one minute before expecting a reconnect
fetch, while the implementation correctly skips reports younger than five
minutes. The scenario now explicitly advances past staleness, with a new unit
case covering both behaviors. No production change was made to accommodate the
test. Failure evidence and matching normal quit diagnostics remain at
`.test-data/packaged-activity-soak-1790227314911`; do not call that whole run passed.

## Review boundaries

No new feature files, installer, Desktop duplicate, upgrade, publication,
version change or personal-save test is required for test-only changes. The
accepted activity-map Desktop shortcut/build stays in place. This bounded check
does not certify elimination of the historical BSOD or long-duration stability.
Still open: player comparison with in-game reports, physical DPI/touch/audio,
clean-machine install/uninstall, artwork rights/provenance, final security and
signing/public-release approval.
