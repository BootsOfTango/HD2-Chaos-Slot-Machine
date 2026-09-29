# Runtime reliability follow-up — September 27, 2026

Branch: `codex/runtime-endurance-checks`. Bounded test-only follow-up to
`RUNTIME_PATCH_44_4_5.md`; no production change or replacement build.

## Coverage

- Run the existing packaged activity soak against the accepted `runtime-patch`
  EXE with `--expected-electron=44.4.5`. The first automatic interval uses real
  five-minute renderer time. Later reconnect/resume cases use explicit simulated
  freshness offsets and controlled responses, not the live game or public API.
- Exercise source desktop save-health using the pinned runtime. Add truncated
  JSON with no valid backup (protected state, original bytes in recovery, no
  replacement defaults) and with a valid backup (pilot restored, original damaged
  bytes and source backup preserved). Existing future-version, semantically
  invalid, injected write-failure/retry and pending-close cases remain.
- Every source save-health report records the actual Electron version, which the
  runner checks against the exact dependency pin. All GUI phases are sequential,
  software-rendered and gracefully closed with isolated synthetic profiles.

The save-health failure scenarios use the source main process, not the packaged
EXE. Injected write failures do not emulate every filesystem failure or an actual
power loss. The activity soak uses the packaged EXE. Neither is long-duration,
physical sleep/wake, clean-Windows installation or in-game accuracy acceptance.

## Evidence

Focused33 unit checks and the full849 unit suite plus CSP/catalog/assets passed.
Logs `.test-data/runtime-endurance-units-final.log` and
`.test-data/runtime-endurance-all-tests-final.log`.

Source save-health: **35 checks across six phases**, all on Electron44.4.5 with
matching graceful shutdown evidence. Report:
`.test-data/save-health-1790483346842/report.json`; log
`.test-data/runtime-endurance-save-health.log`. Expected injected load/write
errors appear in the log; all asserted protection/retry outcomes passed.
The corrupt-save screenshot was visually inspected: protection warning and
session-export control are visible, and bundled equipment remains available.

The initial packaged run (`packaged-activity-soak-1790482979055`) passed the
five-minute timer, cache and saved-card checks. Inspection revealed its inherited
workflow left `state.current` empty: its byte-equality check did **not** demonstrate
preservation of a locked run. Historical claims of confirmed-run preservation in
this specific soak were too broad. Other focused workflow tests are separate.
The harness now explicitly seeds and asserts populated equipment and a confirmed
planet before timing. On restart it checks the actual application contract:
unsaved rolls reset, saved cards persist. No production behavior was changed.
Three harness unit regressions prevent empty-fixture acceptance, verify cloned
planet/mission data, and enforce the reset-versus-persistence distinction.
Strengthened packaged rerun **passed**:
`.test-data/packaged-activity-soak-1790483434093/report.json`, log
`.test-data/runtime-endurance-packaged-final.log`. **316 workflow +16 soak
+5 cache restart +16 saved-state restart** checks; matching graceful shutdowns.
The real interval lasted300832ms with exactly one discovery/status follow-up
transaction. Evidence contains populated primary/four stratagems, locked=true,
planetConfirmed=true and four saved cards. Refresh/reconnect/resume preserve
that locked in-memory run and saved Results; restart restores saved cards/cache
and resets the unsaved roll as designed. Electron44.4.5 independently asserted.

## Preservation baseline

Existing owner-review state SHA256:
`0124cc917304ec6f3e3a653235e03ee6eb9a4f2227f9c58b12b33c0e8ddf9ac6`.
Existing Desktop shortcut SHA256:
`e7c8ff801add0fda99103add7dfeae1c8bcbcb82d643f0d97cba0bd5bcc4db4e`.
Installed baseline ASAR SHA256:
`f8e05a940da3f200796e7dac55b4166458b7e5c18549726c63e665d7ebcc37e0`.
All three hashes matched after all tests; the exclusive GUI lock was released.
No installer execution, archive movement, Desktop files, public upload or
personal-save tests are authorized or needed for this test-only follow-up.
Desktop remains `start-runtime-patch-review.cmd`. Active dist remains
`installer-shell` + `runtime-patch`. No build or promotion needed.

Next: owner one-run acceptance using `OWNER_RUN_ACCEPTANCE.md`. Physical
audio/DPI, live-game comparison, longer-duration use, clean Windows lifecycle,
artwork permission, signing/distribution policy and final approval remain open.
