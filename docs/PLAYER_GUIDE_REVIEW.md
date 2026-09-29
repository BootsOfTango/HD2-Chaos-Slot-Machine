# Player guide and draft release notes review

September28, 2026 — branch `codex/player-guide-review`. Documentation-only;
no build, installation, save edit, commit, remote write or publication.

## Outcome

- Reorganized `README-FIRST.txt` and repository `README.md` around installation,
  first solo dive, guided results, ownership, map/missions, controls and backups.
  Technical release-history paragraphs no longer precede installation steps.
- Corrected stale claims: map still planned, activity unavailable, original
  mission placeholders, older runtime version, old scoring/editor directions,
  and legacy version headings. Current source is explicitly a local preview,
  not an announcement of a new downloadable 1.0 release.
- Explained one-minute visible-map checks versus five-minute normal refresh,
  cooldown/backoff, stale data, partial mission coverage, reported activity
  limits, approximate sectors and reference saved-card geography.
- Clarified permanently locked card fields versus later comments, decimal
  minutes, side-objective counts, provisional Solo ratings and Legacy-only
  Compare/analytics. No implication that self-entered outcomes isolate loadout
  effectiveness or measure armor directly.
- Kept Setup as the simplest download; portable extraction, shared profile,
  separate developer review saves, backup/import and Windows-warning guidance
  are explicit. No instructions to disable protection or delete saves.
- Expanded `RELEASE_NOTES_1.0_DRAFT.md` to cover implemented features. Public
  URLs/hashes/signatures/date/acceptance/approval remain pending. No readiness
  gate was marked passed, and existing rights/security notices were not changed.
- Corrected conflicting current tag/version instructions in `RELEASE.md`, while
  retaining historical release and signing sections. No tag commands executed.
- Recorded owner "looks good so far" as general feedback only, not proof of
  a completed real dive, audible sound/DPI or restart acceptance.

## Evidence

Reviewed current source: `release-identity.json`, item/mission catalogs,
mission artwork provenance/UI, `card-entry.js`, `solo-score.js`, map view/session,
activity service, refresh service, `card-planet.js`, visible `index.html` labels,
and builder guide inclusion. Existing activity and latest artifact reports
provide context; no new claim about current game data or GitHub release state.

- **872 unit tests**, CSP, catalog and assets pass. Log:
  `.test-data/player-guide-unit.log`.
- Four new guide tests check catalog/runtime count consistency, removed stale
  claims, safety/control-label and bundling contracts, and local Markdown link
  targets/HTTPS URL syntax. Remote pages were not availability-tested.
- Compared source against the accepted yellow-missions artifact inventory:
  546 packaged source files unchanged; only bundled `README.md` differs.
  `package.json` excluded from byte comparison because of builder normalization.
  Accepted ASAR remains `2b8ea909ef461bbcd74977fe3a30ef4216a328e1d07c93ee18426c11d6610ce3`.
- Desktop shortcut still targets `start-yellow-missions-review.cmd`. No new
  runtime, installer, ZIP, Desktop copy or cleanup operation was needed.

## Delivery limit and next task

These edits are in source only. The previously verified Desktop runtime,
installer and ZIP still contain the earlier README/standalone guide. Do not
modify those artifacts in place. At the next candidate build, bundle the new
guides and verify their exact contents in both Setup and ZIP before distribution.

Next bounded technical task: refresh the dependency/security/release-package
review, keeping existing release gates honest. Clean-Windows lifecycle needs a
separate environment; physical audio/DPI and specific owner-run checks remain
unreported. Artwork rights, signing/distribution choice and final publication
approval remain separate/open. No new legal clearance or security guarantee.
