# Durable cards and versioned recalibration

September28, 2026. Branch `codex/card-compatibility-audit`.
Historical audit/plan; implementation follow-through is recorded in
`CARD_RULES_DELIVERY.md`. The statements below describe the audit baseline.
This was the approved direction plus a bounded compatibility audit, **not an
implemented recalibration/removal feature**. No personal profile was opened,
modified or scanned. No installer or application process was started.

## Owner decisions and boundaries

- Keep player data separate from program installation files and accessible
  through an app button. Updating/reinstalling program files must not replace it.
- Do not ask players to fill in missing statistics on old cards.
- Older finalized cards **genuinely missing data required by the selected new
  scoring rules** may be removed from active history/rankings during a confirmed
  recalibration. Show affected counts/cards and verify a recovery backup first.
- Complete old cards are retained and recalculated from recorded input, not
  their previous rating. Retain original records/ratings and version history.
- Never remove cards at startup, on download, just because they are old, or
  because parsing/evaluation threw an error. Pending unfinished cards are not
  obsolete finalized results. Invalid/unknown/future data blocks the operation.
- Provide Later; a deferred upgrade keeps prior ratings separate from current
  scoring groups. Recalibration is once per applicable card/input/rule version,
  not once globally per installation. Later imports can add eligible old cards.
- This is not permission to delete the current owner's cards now. The future
  user-facing transaction requires an explicit summary and confirmation.

## Audit evidence — current implementation

13 in-memory characterization tests and synthetic fixtures:
`test/card-compatibility-audit.test.js`, `test/fixtures/card-compatibility.json`.
These are not claimed to be authentic exports from every historical release.
Focused evidence: `.test-data/card-compatibility-audit.log`.

| Case examined | Current result | Required future handling |
| --- | --- | --- |
| Raw older browser-shaped export / desktop envelope v1 | Transfer parser preserves card, text planet, notes/comments and ordinary extra fields before renderer normalization | Preserve exact source bytes and format provenance before adapting |
| Complete locked Solo v1 | Can evaluate under v2 without mutation; pinned example 67.5 -> 71.67, Firepower 25 -> 50 | Offer preview, retain original rating and frozen inputs |
| Already upgraded v2 | Current one-off upgrade does not compound; originalResult survives transfer | Generalize to a registry and multiple immutable rating revisions |
| Legacy card with main-order/extraction outcome | Those do not establish Solo mission success, elapsed time or total side objectives | Never derive missing Solo inputs from unrelated outcomes |
| Valid Solo card with explicit null time/outcome/total | Can be stored unranked, with null rating | Potential removal only after target-rule assessment and confirmed backup |
| Missing required stats / malformed input / tampered rating | Current transfer validation rejects rather than dropping individual cards | Distinguish documented incomplete old formats from corruption before strict adaptation; never turn a caught error into removal eligibility |
| Real zero / failed mission / zero available objectives | Valid measurements; zero available gives N/A utility | Do not mistake zero/false for missing |
| Pending card | Remains unfinished and outside scored ranking | Preserve; not a removal candidate |
| Future save/scoring/mission version | Transfer parsing stops with unsupported-version error | Preserve original; require compatible software, no downgrade/deletion |
| Invalid JSON / duplicate IDs | Parsing fails | Block the transaction; retain original |

### Findings that constrain the design

1. `normalizeMissionStats` supplies zeros for absent fields, maps older aliases
   and clamps values (accuracy to100, distance to20, shots to15000). It does not
   record which values were entered versus inferred. A raw-input assessment must
   precede this function; normalized output is not proof of original completeness.
2. `migrateLegacyCardShots` can directly fill absent shots with500. In the examined
   normalizer-first order, absent shots have already become0 and this fallback
   does not run. Neither 0 nor500 identifies synthetic values reliably: players
   can enter those numbers too. Do not mass-delete or relabel by numeric value.
3. Missing difficulty can default to10 and missing faction toTerminids. These
   defaults must not establish historical scoring context. Preserve aliases and
   explicit original fields through version-specific adapters.
4. `HD2SoloScore.upgrade` runs inside `normalizeCardRecord` and currently converts
   v1 to v2 automatically, retaining one originalResult. It is not a general
   versioned, consent-based rating history. Removing that automatic behavior
   requires coordinated load, import, export, rendering and ranking changes.
5. Normal autosave rotation keeps20 matching backups. Upgrade backups must be
   outside that rotation. JSON transfers are limited to32MiB/10,000 cards and
   complexity limits, while native saves can be larger. A safety backup cannot
   rely exclusively on the ordinary Export JSON path or silently truncate.
6. Existing durable writes and import preparation provide useful foundations,
   but do not implement a recalibration transaction. Current transfer/native/
   renderer validation is layered, not one identical entry point. The future
   coordinator must validate the target through every required layer before
   publishing a new active state.
7. `SoloScore.duration` supports recorded mission duration or a limited legacy
   mode map. Historical aliases need explicit tested adapters (for example the
   broader mission system recognizes Defense (20min)). Adapter omissions are
   not evidence that a card never recorded its time limit.

These tests characterize current gaps; they must be deliberately revised with
the implementation, not weakened or interpreted as endorsing those defaults.
Shots/stims/distance are not inputs to current Solo v2, so their absence alone
must not remove a card eligible for that target. Future rules declare their own
required fields. Where an old normalization already erased provenance, do not
pretend it can be recovered without retained source evidence.

## Incremental implementation sequence

### A. Compatibility contract and fixtures — audit completed

Record decisions, current entry points, synthetic old/raw/v1/v2 cases and safety
gaps. Extend coverage with sanitized, permission-appropriate known historical
export samples before claiming support for their full formats. No claim of
universal all-version compatibility or hardware-failure immunity.

### B. Pure raw-record assessment and frozen rule registry — NEXT

- Separate save-envelope, card-record and scoring-rule versions. Source app
  version is provenance, not a substitute for schema identification.
- Build explicit old-format adapters returning a canonical view, original
  snapshot and provenance/unknown-field report. Missing stays distinct from0.
- Define immutable rule IDs, required inputs, algorithm/benchmark version and
  validation. Freeze shipped Solo v1/v2 behavior before adding newer formulas;
  algorithm corrections create a new rule version, never silently edit old rules.
- Return explicit outcomes: recalculable, already current, pending, genuinely
  incomplete, invalid/ambiguous, unsupported. The last two block the proposed
  transaction; no catch-and-delete fallback. Only known format/target-required
  missing fields can produce an incomplete-card removal proposal.
- Missing/new/retired equipment IDs use preserved recorded names and aliases;
  live catalogs/planet refresh must not rewrite historic mission/loadout context.
- Keep original entered stats/note and original rating immutable. Ratings are
  derived revisions with source input fingerprint, rule ID and evaluation date.
  Ordinary unknown metadata remains round-trippable without executing anything.
- Implement/test as pure modules first; do not wire into startup or deletion yet.

### C. Protected upgrade transaction

- Work on a disposable candidate. Stable identities and source fingerprint tie
  the preview/consent to the exact active revision. Any edit/import/new comment
  invalidates a stale preview; never apply to a changed collection silently.
- Store a byte-exact, verified pre-upgrade file plus manifest outside rolling
  autosave backups. Verify source and target paths, available writeability and
  checksums; refuse recalibration if backup cannot be verified. Never overwrite
  another backup. Cleanup of these recovery sets is a separate explicit action.
- Validate the whole transformed save, recomputed ratings and removal list.
  Do not delete per-card files first. One durable publication switches to the
  complete candidate; stage/journal recovery distinguishes prepared vs committed.
- Disk-full, permission, interruption, double-click and concurrent-instance
  cases must retain a valid old or new state, not a partially removed collection.
  Test injected failures before/after backup and commit; do not claim fsync/rename
  guarantees against all OS, storage or power failures.
- Recovery must not blindly restore an old whole profile over newer dives or
  comments. Offer a reviewed recovery workflow with conflict detection and a
  fresh backup; future rollback implementation remains a separate bounded task.
- Canonical player data remains in the stable per-user profile. No required
  change to one file per card; avoid extra multi-file consistency problems.

### D. User interface and integration

Show affected cards and counts: update / remove / preserve pending / blocked.
Preview changed ratings and removed-card reasons; provide Later and explicit
confirmation. Explain backup location and original/current scoring views.
Update Compare/Rank/card displays to consistently use compatible rating versions
and contexts. Preserve new comments/history during save and recovery workflows.
Require confirmation again if the proposed changes differ. No repeated prompt
for cards already evaluated under the same rule/input version; later old imports
must still be noticed. Revisit transfer size/field limits as rating history grows,
without removing earlier history to make an export fit.

### E. Acceptance and future release discipline

- Run fixtures for every supported schema, supported older rule and direct
  skipped-release upgrade; include legacy browser and desktop import paths.
- Check zero/false, missing/invalid values, legacy aliases, removed catalog IDs,
  pending cards, imported duplicates, future versions, mixed collections,
  repeated application, tampered scores and unchanged notes/comments.
- Exercise backup failure, interrupted commit, source revision conflict, restart,
  export/reimport and recovery. Never use the owner's history as disposable data.
- Build/test the actual packaged app with isolated profiles before promotion.
  Keep Desktop/save paths stable; archive superseded candidates recoverably.
- A future release cannot drop old adapters without a separately reviewed plan.
  Preserve old readers/rule fixtures and evidence. Update player docs only when
  the behavior actually ships; current Desktop still uses automatic v1->v2.

## Explicitly not done in this audit

No recalibration button, deletion logic, rule registry, new save schema or upgrade
backup transaction has been activated. No real cards were examined or removed.
No Desktop build, installation, cleanup, version bump, commit or public release.
The broader release/security review is deferred behind this owner-prioritized work.
