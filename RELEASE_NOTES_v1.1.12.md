# HD2CSM v1.1.12 — local import-safety candidate

- Check and prepare an imported session before committing it to disk or replacing the active session. Failed validation/commit leaves the previous session active.
- Share desktop/browser import/export limits: 32 MiB, 10,000 cards, bounded nesting/field count. Export refuses unsupported/oversized data before replacing a target; desktop autosave limits are unchanged.
- Reject malformed metadata, unusable equipment rows, duplicate/reserved card IDs, unsafe object keys and invalid field shapes. Retain supported legacy name/ID aliases and planet text.
- Pause editing/autosave/closing during import commit; provide clear success/failure messages. Keep a separate pre-import browser backup, subject to browser storage capacity.
- Preserve an explicitly saved zero bonus percentage during normalization; no scoring formula or balance change.

Unsigned, unpublished, separate from accepted v1.1.10 and the preserved v1.1.11 health candidate. See [tests and remaining limits](docs/IMPORT_EXPORT_HARDENING.md).
