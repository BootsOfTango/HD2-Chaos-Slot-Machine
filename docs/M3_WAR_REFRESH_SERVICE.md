# M3 war refresh service

September 16, 2026 (Eastern), branch `codex/war-refresh-service`.

## Delivered scope

Added `assets/war-refresh.js` and `test/war-refresh.test.js`. This is an explicit, injectable service, **not yet loaded by index.html or shipped in an EXE**. It uses the existing snapshot normalizer and exposes a synchronous immutable snapshot for selection; callers never need to await a refresh before rolling.

No installer/build, GUI launch, personal storage access, installed-app change, Desktop duplicate, deletion or publication occurred. Internal version is unchanged. Installed Installer Shell and latest Installer Notices candidate remain unchanged. Separate clean-install/uninstall testing remains deferred by the owner.

## Refresh policy implemented and tested

- `start()` refreshes once when active/online. Construction does not fetch or schedule work. `stop()` cancels pending work and clears all service timers; no closed-app/background process is created.
- After success, one timer requests another snapshot in five minutes while active and online. `setActive()` and `setOnline()` are explicit lifecycle inputs. Inactive periods schedule no new automatic requests; a request already started may finish. Manual refresh is allowed while inactive.
- Stale resume/reconnect refreshes; a fresh snapshot is retained without an unnecessary request. The renderer still needs to connect visibility/focus/online/offline/resume signals. Suspended timer catch-up and lifecycle transitions are covered by fake-clock tests, not actual Windows sleep/resume testing.
- Every request starts a 30-second cooldown. All callers share the same in-flight promise; timer, manual, startup and lifecycle requests cannot bypass cooldown/backoff.
- Fetch plus body decoding has a ten-second timeout. Abort and explicit promise cancellation protect against late results even when a test transport ignores its abort signal. Cancelled/stopped/disconnected jobs cannot update cache or snapshot, nor clear a newer job's state.
- Failures keep the last valid snapshot and use 30-second exponential backoff capped at 30 minutes. A valid server Retry-After can extend that delay beyond the cap; timer chunks prevent overflow. Both seconds and HTTP dates are supported. Successful recovery resets failures. Limits apply within one service instance; server retry deadlines are not persisted across application closure.
- Network requests target the fixed community campaigns HTTPS endpoint, request English JSON, omit credentials, reject redirects and bypass the HTTP cache. Application/repository contact headers are sent; no personal/game account data is required. HTTP error bodies are aborted rather than left open. This is not a complete transport-security or denial-of-service audit.
- View-listener exceptions cannot break the service. State/snapshot objects are immutable and old references remain unchanged after refresh; this enables, but does not by itself implement, locked-run/history protection in the renderer.

References checked: [community API usage guidance](https://github.com/helldivers-2/api), [HTTP Retry-After semantics](https://www.rfc-editor.org/rfc/rfc9110.html#name-retry-after). The local 30-second cooldown/backoff values are our policy, not claims about the server's current rate limit.

## Storage contract

The caller explicitly supplies a synchronous `getItem`/`setItem` adapter (or null for memory-only). The module does not reach into global localStorage or Electron files by itself.

- New key: `hd2csm_war_snapshot_v1`. Legacy read-only key: `hd2_live_planets_cache_v1`.
- Prefer a valid new cache over legacy. If no new key exists, copy validated legacy data into the new key, preserving original legacy bytes and initial disabled flags. This migration can run during service construction when storage is supplied.
- Cache loads retain their original successful timestamp and are always labeled cached, never live. Missing/invalid data falls back to caller-provided bundled planets; the bundle has no fabricated fetch date.
- Damaged, oversized, unsupported-schema and future-dated primary data are preserved untouched; writes are blocked for that service instance. Legacy data can still supply the in-memory fallback. Future UI must explain the warning and offer a deliberate recovery path rather than silently delete data.
- Read failures prevent writes; write failures are reported separately and do not turn a successful live fetch into a network failure. A changed primary value between reads prevents this instance from overwriting it. This comparison is best-effort protection, not an atomic cross-process transaction.
- No delete/remove operation is used. Parsed cache text and serialized snapshot cache size are bounded at four million characters. Network body streaming/size limits are not implemented by this change.
- **Ownership is separate from war facts.** New normalized API rows have enabled=true as factual default; the next renderer integration must apply persistent player opt-outs by stable identity/legacy name and must not overwrite ownership with these defaults. Cache migration alone does not solve UI preference migration.

## Verification

Final `npm test`: **437/437 pass**, including **26 new refresh-service tests**. CSP, catalog and asset validation pass (247 local pictures, zero missing references; seven existing placeholders). Log: `.test-data/war-refresh-unit.log`.

Deterministic tests cover startup/offline rolling, five-minute cadence, inactive/resume/reconnect behavior, cooldown/deduplication, HTTP 429/503 and Retry-After, capped exponential backoff, hung fetch/body decoding, abort-ignoring late responses, shutdown/restart, preserved damaged/future/changed caches, copy-only legacy migration, quota/access failure, immutable snapshots and throwing/reentrant listeners. Browser UMD load-order test confirms no automatic initialization. It is not an independent browser UI certification.

One real Node fetch through the actual service at **2026-09-17 00:42:06 UTC** succeeded: 36 eligible planets, live/fresh state, no cache warning. Reconstructing the service offline against the same **in-memory storage fixture** restored 36 planets as cache/cached. Log: `.test-data/war-refresh-api-probe.log`. This was not a physical disk persistence test, installed-app restart, browser CORS check or five-minute wall-clock soak. No personal cache was read or written.

## Exact next task

Integrate these three M3 modules into the renderer as one bounded slice:

1. Initialize with real bundled planets and guarded origin storage; connect lifecycle signals and teardown. Remove the old competing fetch/cache path, not just add another timer.
2. Expose manual Refresh war data, last successful time, source/staleness, loading/cooldown/failure and cache-preservation warnings. Keep synchronous rolls available offline.
3. Map user-enabled planets using stable IDs plus legacy names; preserve opt-outs/exports and keep ownership independent of snapshot replacement.
4. Use the same all-faction eligibility path for Spin, planet rerolls and manual selection; nonrepeat when alternatives exist. Update the enemy from the chosen planet, not the other way around. Protect locked runs, equipment/reroll allowances and historical Results from background updates.
5. Add renderer workflow/restart/network regressions; refresh CSP only if inline source changes. Run sequential software-rendered isolated desktop checks under the existing safety lock. Build one replacement candidate only after integrated checks pass. Do not mark the UI bug fixed based on these source-only tests.

Planet-aware mission suggestions and the interactive map remain later milestones. This API snapshot is not an exact copy of a player's mission screen.
