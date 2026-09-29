# Local development labels and the planned official release

Owner decision, September 15, 2026: do not keep incrementing numbered local previews. Continue the roadmap, then publish **HD2CSM 1.0 Official** only when the owner decides it is ready.

## During development

- Label app headers and local installer/ZIP filenames descriptively, e.g. `Local Development — Defensive Audit`, `HD2CSM-Setup-local-defensive-win-x64.exe` and `HD2CSM-local-defensive-win-x64.zip`.
- Internal `package.json`/lockfile version stays **1.1.14** temporarily. This is compatibility metadata, not an announced new release. Do not reset it prematurely or claim Windows metadata is already 1.0. Save-format version remains independent and unchanged.
- Build with `HD2CSM_LOCAL_BUILD_LABEL=defensive`, an explicit candidate directory and `--publish never`; clear the task-specific environment variable afterwards. Labels are validated lower-case alphanumeric/hyphen names, at most 48 characters. Verify with `python scripts/verify_win_zip.py --dist dist/defensive-review --local-label defensive`.
- Without that environment variable, existing versioned public-artifact naming remains unchanged. The public workflow is not repurposed to publish local labels. Require explicit owner approval for all publication.
- Each review batch records its label/date, branch, artifact hashes and exact tests. Do not identify different local builds solely by the frozen internal version. Keep historical numbered reports/fixtures unchanged.
- Retain accepted downloads/installation until upgrade approval; after testing, archive the superseded candidate with hashes. No extra Desktop copies. See `DESKTOP_CLEANUP_POLICY.md`.

## Official 1.0 release gate (still future work)

Read-only `git ls-remote --tags origin` on September 15 confirmed existing `v1.0.0` through `v1.0.9` and `hd2csm-v1.1.0`. Do not move/delete/reuse those tags or replace their assets. A distinct tag such as `hd2csm-v1.0.0` is currently absent, but must be rechecked and explicitly chosen at release time. The current workflow expects `v${package.version}` and needs a tested adjustment for any new tag scheme; none was made now.

Present the final product as **HD2CSM 1.0 Official**, as requested. Before choosing its technical package/Windows version, test install/upgrade behavior from already distributed and local versions, preserved user data, shortcut/uninstall registration and any future update mechanism. A numerical drop from 1.1.x is not proven safe by changing a label; it may require separate monotonic technical metadata or an explicitly tested transition. Do not change the app ID or profile directory merely to avoid this gate. No current installer downgrade was attempted.

In the current storage implementation, `applicationVersion` is a nonempty metadata string; supported-save validation uses `saveFormatVersion`, not semver order. That alone does not establish Windows installer or future updater compatibility. Complete M7 and signing/rights checks, then obtain owner publication approval.
