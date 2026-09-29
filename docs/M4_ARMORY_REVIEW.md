# M4 — integrated Armory review

September 16, 2026 · `codex/armory-dashboard` · local, unpublished

## Changes

The first browsing slice is now complemented by stratagem role sections: Orbital strikes, Eagle airstrikes, Support weapons / vehicles, Backpacks, Defenses, and Other / custom. These use the bundled reviewed subgroup field, not name guesses or changes to roll eligibility. Unknown custom rows remain available in their own group. Each stratagem appears once.

View mode, type filter, ownership filter and expanded sections now live in `settings.armoryBrowser`, a versioned, bounded preference object in the existing save envelope. Desktop/browser persistence, JSON export/import, Clear All and legacy view/type migration share this contract. Existing new preferences win over legacy local keys; old keys are read only and remain recoverable. Search text is intentionally not saved. Temporary search expansion does not replace deliberate open/closed choices. Clear Filters makes hidden equipment easy to recover.

Malformed preference imports fail before replacing working state. Newer preference versions use the existing unsupported-save guard, preventing silent downgrade. Unknown JSON fields, invalid enums, oversized group lists and invalid group identifiers are rejected. Custom labels outside the preference bounds can still be browsed without writing an invalid preference. No parallel ownership store was introduced.

Source/Warbond and category views retain shared per-item ownership and reviewed whole-Warbond bulk controls. Artwork/source facts, Results, scoring and equipment eligibility semantics are unchanged. The player guide describes filters, search reset, role groups and the scope of bulk controls.

## Source evidence

- **459/459** units plus CSP/catalog/assets pass: `.test-data/armory-browser-unit-final.log`.
- Source Electron workflow **89**, controlled network **33**, separate-process restart **16**: `.test-data/electron-smoke-1789609832284`. Source GUI run predates the final invalid-custom-group guard; the packaged checks below cover the final bytes.
- Transfer **36+5 desktop /29+5 browser emulation**: `.test-data/transfer-health-1789609934126`.
- Renderer security **44+44**: `.test-data/renderer-security-1789609959963`.
- Existing window regression **93**: `.test-data/window-smoke-1789609971821`. Page zoom emulates DPI; actual physical Windows scaling remains unverified.
- GUI checks are sequential, exclusive, software-rendered and isolated. They use graceful exit, never personal save data. Sound checks exercise WebAudio, not listening. Browser-emulation coverage is inside Electron, not independent browser-vendor acceptance.

An initial storage validation line was inserted in the wrong function; units caught it before packaging and it was corrected. A test incorrectly treated `parseSave` as returning an envelope; its assertion was corrected to the documented raw-data return. One source restart failed because source editing briefly invalidated the CSP hash (`.test-data/electron-smoke-1789609738928`); regenerated hash and a stable-source rerun passed. These failures remain as diagnostic evidence, not passing acceptance. The CSP policy was not relaxed.

## Artifact acceptance

- Unsigned Setup: `dist/armory-browser/HD2-Chaos-Slot-Machine-Setup-local-armory-browser-win-x64.exe`.
  SHA-256 `47571c2bf78052456be4b95a78c121bd85cdacda99ff02d54a09fa28374a22ad`.
- Portable ZIP: `dist/armory-browser/HD2-Chaos-Slot-Machine-local-armory-browser-win-x64.zip`.
  SHA-256 `aa4f7fab96bcb7356002bda5afb68ececb1e056b95fa99a6436ddc5f0b1a6eac`.
- EXE SHA-256 `d321e3c566cb2c7084e272e1ab99b3f4a2f19d46a407cee8d70945dd89eb9218`; ASAR `70c8c6013866da5126bf0503da1eadb74008852332c9300464c0249f959f8155`.
- ZIP/installer integrity and required files pass (`armory-browser-zip-verify.log`). **394 source-file comparisons /29 embedded comparisons**, fuses, notices/components and absence of WinShell pass (`.test-data/armory-browser-artifact-inspection/report.json`). Frozen internal version 1.1.14 unchanged; descriptive local filenames, no public version increment.
- Actual packaged EXE: **85 workflow +11 restart +7 normal/fullscreen +33 network +5 cache restart**, `.test-data/packaged-smoke-1789610455349`. All **24** displayed Warbond covers decode locally. Inspected `armory-stratagems.png` and `armory-warbond.png`. All five phases exited gracefully; matching lifecycle diagnostics present.
- Packaged renderer security **44**, `.test-data/packaged-security-1789610551232`; transfer/restart **26+4**, `.test-data/packaged-transfer-1789610559568`; Warbond batch-8/shared ownership/canonical-catalog regression **1817+370**, `.test-data/packaged-warbonds-1789610578436`. All graceful/exclusive/isolated. These counts include repeated assertions across items, not thousands of separate end-user scenarios. Native file-picker interaction remains excluded.
- First packaged attempt `.test-data/packaged-smoke-1789610266066` exceeded the former 20-second cold-start target budget and did not establish clean shutdown. Initial state was written after that deadline. Stopped GUI work, reviewed exact absent owner/child/descendant processes and bounded Windows logs, then preserved the reviewed lock in that evidence directory. No process was force-killed; no crash/graphics error attributed to this app was found. Increased the harness-only startup budget to 60 seconds and preserved primary failures before shutdown failures; unchanged 30-second graceful-close protection. Fresh-profile retry on identical artifact bytes passed. See that run's `MANUAL_REVIEW.md`; the exact reason the first process ended remains unproven, not claimed resolved as an application crash.
- Defender custom scan: exit 0, no threats found (`armory-browser-defender.log`). npm audit: zero known vulnerabilities (`armory-browser-npm-audit.json`). These checks do not guarantee freedom from malware or vulnerabilities. Setup and EXE report `NotSigned`.

## Handoff and cleanup

Use `scripts/start-armory-review.cmd` for a fullscreen separate-profile review (`.test-data/armory-owner-review`), without touching the installation or personal saves. The installer has **not** been run on this PC this session. Installed EXE/ASAR hashes still match the Installer Shell baseline. Desktop download/shortcuts and personal profile were not changed. No commit, push, tag, publication, security setting or graphics-driver change.

Archived and hash-verified **107** superseded Live War files at `.test-data/accepted-builds/live-war`; `live-war-move.json` records restoration paths/hashes. Old launcher/resolver now finds the archive. `dist` contains only installed baseline `installer-shell` and latest review `armory-browser`. No permanent deletion or new Desktop copies; do not rerun the one-off archive script.

## Remaining boundaries

This is an M4 local review, not official 1.0 publication. Owner hands-on acceptance, physical Windows scaling, a separate-environment clean install/uninstall, signing, unfinished artwork redistribution clearance and final release/CI gates remain open. Catalog UI tests are not legal clearance or a new game-content fact audit. M5 suggested/player-confirmed missions, M6 galaxy map and M7 final integration remain queued.

Exact next: owner Armory feedback/acceptance; start M5 with a bounded, source-backed mission catalog and pure eligibility engine, preserving legacy scoring categories. Do not present suggestions as exact live operations or infer them solely from Major Order wording.
