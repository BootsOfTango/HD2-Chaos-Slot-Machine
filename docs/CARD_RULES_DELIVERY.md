# Versioned card rules — local delivery

September 28, 2026. Branch `codex/card-recalibration`. Public release still pending.

## Behavior

- Separate Windows per-user save directory remains independent of the chosen installation directory. Open save folder reveals `state.json`, rolling backups and protected `card-upgrades` recovery sets.
- No automatic v1-to-v2 recalibration on load/import/export. Results has Review card rules, a quiet count, per-card old/new scores and reasons, Later and explicit Back up & apply.
- Complete Solo v1 cards use frozen Solo v2 calculations; original inputs/records/ratings and append-only rating revisions remain. Existing v2 records are kept, not compounded. Future releases must add rule versions rather than edit shipped equations.
- Known incomplete finalized legacy/Solo records may be removed only as listed in the confirmed review. Pending cards are kept. Invalid stats, tampered scores, duplicate IDs, unknown context, ambiguous duration aliases and future schemas block instead of causing deletion. Missing shots/stims/distance alone cannot disqualify current Solo v2.
- Raw locked records are captured before existing renderer normalization can invent zeros/default context. Previously erased provenance cannot be recovered; no heuristic treats 0 or 500 as proof of synthetic data. Older defaults remain characterized, with original evidence retained for future adapters.
- Native review is bound to the entire on-disk save SHA-256. Comments/imports/autosaves invalidate stale proposals. The renderer also checks its exact current payload. Tokens are single-use; the main process derives candidates itself, never trusts a supplied replacement/removal list.
- Full candidate validation precedes the backup/publication. The exact old save is durably written and read-back SHA-256 verified under a unique `card-upgrades/<id>/before.json`; checksum manifest records the old/new save hashes and removed IDs/reasons. The entire new save is published with one durable replace. Recovery copies are not part of the 20-file autosave rotation or limited by JSON export size.
- A prepared manifest whose after-hash matches the current file identifies a commit even if writing `committed.json` was interrupted. No automatic rollback can overwrite newer dives/comments. Full manual recovery requires reviewing subsequent data and exporting it first; conflict-aware merge/rollback UI remains a separate feature, not required to apply rules safely.
- Ranking groups already separate scoring versions; visible rule-version labels now reflect retained v1 correctly. Card Scoring shows original and revision ratings. Legacy Compare/equipment analytics stay separate.
- History-bearing native/browser exports use envelope format 2, supported alongside v1/raw legacy imports. Older readers reject the newer envelope. Native saves retain history without export-size truncation. Ordinary JSON transfer still caps 32 MiB/10,000 cards/complexity; oversized native recovery needs assisted handling. Browser backup copies live under unique localStorage keys, so export before clearing browser data.

## Scope and safeguards

No real card was recalibrated or deleted during development. Synthetic fixtures/profiles only. A Desktop preview promotion does not confirm recalibration on the owner's behalf. No install/uninstall, version bump, commit, push or public release.

No claim of arbitrary all-version compatibility, cryptographic authenticity of player-entered scores, or protection against every OS/disk/power failure. Frozen v1/v2 fixtures and old readers remain. Unknown historical modes such as unrecognized defense aliases block for an adapter, rather than being incorrectly removed.

## Verification

**905 unit tests + CSP/catalog/assets passed.** `.test-data/card-rules-delivery-unit.log`. Focused native tests include zero/false vs missing, pending, unknown future data (including original records), ambiguous lock/context, original/revision tampering, later comments, duplicate confirmation, backup obstruction/corruption, source changes during staging, injected failures around publication, interrupted post-commit marker, restart/transfer, and saves exceeding ordinary export size limits.

Final actual packaged reports:

- `.test-data/packaged-smoke-1790649225812/report.json`:25 card-rule checks +6 restart checks and file-level exact recovery hash verification. Exercises native consent/Later/stale review, browser cross-tab/retry refusal, browser backup/commit, no automatic startup upgrade, preserved original/current history, comments, pending cards and repeat-calibration prevention. `card-rules.png` visually inspected.
- `.test-data/packaged-smoke-1790649232448/report.json`:333 workflow +16 restart,9 normal startup,33 network,5 cache.
- `.test-data/packaged-transfer-1790649321002/report.json`:31 transfer +7 restart; retained v1 import no longer upgrades implicitly.
- `.test-data/packaged-security-1790649329343/report.json`:44 security checks.
- `.test-data/packaged-gear-1790649334125/report.json`:155 gear +13 restart.
- `.test-data/card-rules-artifact-inspection/report.json`:552 source files, ZIP/installer payload/fuses/notices/updated guides verified. `.test-data/card-rules-inventory.json`:all60 mission crop sources/hashes retained. Defender found no threats (`card-rules-delivery-defender.log`), not a guarantee. Unsigned installer inspected, not executed.

Existing Desktop shortcut promoted to `scripts/start-card-rules-review.cmd` with the same isolated owner-review profile. Save/shortcut backup `.test-data/card-rules-promotion-20260928-223634`.107 superseded preview files archived and hash-verified under `.test-data/accepted-builds/yellow-missions`; adjacent manifest records recovery. No permanent deletion or extra Desktop files. Actual owner cards and installed baseline unchanged. Do not rerun the promotion script. Recalibration remains the owner's explicit choice inside the app.

Final ASAR `72f1e404fb43bbe0e63eb96f4dd70b2c1745f6f6788ae7108ac767f32dc8c22c`; Setup `0871adb3d2f9114dcd05fb6ae8b74804b13bd74317e7bf20db0bc18eda8de96e`; ZIP `cded6fc26117bd1f36bcf866b57afb689fef6717d8897c141387d713efbb11f5`.
