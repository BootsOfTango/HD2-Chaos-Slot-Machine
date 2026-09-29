# Public identity preparation — September 16, 2026

## Implemented, not published

Branch `codex/public-identity`. Public name **HD2 Chaos Slot Machine**, displayed target version **1.0**, public artifact version **1.0.0**. The current channel and on-screen label are **Local preview**. No official release or new installer is claimed by this source checkpoint.

`release-identity.json` holds public name/version, artifact stem and distinct tag prefix. Native title, main heading, accessible name, favicon, icon generation, future EXE/shortcut/uninstall display name and export dialog filename use full words. Browser export filenames already used full words. Internal compatibility identifiers containing `HD2CSM` are intentionally not renamed.

The new original code-native slot-machine mark uses yellow, black-outlined letters, dark body and a lever. No game artwork or external font was used to make it. `scripts/brand-art.js` generates identical SVG and Windows PNG geometry; `prepare:icons` creates the ICO. The original emblem remains unchanged and recoverable in the source. See `assets/branding/ORIGIN.md`. The full words are readable at larger icon sizes; tiny Windows icons cannot render all words legibly, so their silhouette plus full accessible title/Windows metadata identifies the app. Physical taskbar/DPI appearance remains to be reviewed.

## Version and upgrade policy

| Identity | Before | Prepared source |
| --- | --- | --- |
| Public label | Internal preview numbers | 1.0, explicitly Local preview |
| package.json / Windows compatibility version | 1.1.14 | **1.1.14 unchanged** |
| App ID | com.bootsoftango.helldivers2chaosslotmachine | **Unchanged** |
| Save directory | `%APPDATA%\Helldivers 2 Chaos Slot Machine` | **Unchanged** |
| Local resource origin | hd2-slot://app | **Unchanged** |
| Save format / browser storage keys | Existing formats/keys | **Unchanged** |
| Future public tag | Historical tags retained | hd2-chaos-slot-machine-v1.0.0 |

The public reset does not decrement the Windows package version or rewrite old save history. Save readers validate schema, not the marketing label. Reusing the existing internal version is an intentional reinstall/upgrade compatibility choice, **not proof native installer upgrade works**. Before a future native test, close the old app, isolate fixtures and verify previous install registration, shortcut replacement, old executable cleanup and save hashes. Never silently create a second profile because the display name changed. Windows may show 1.1.14 in file properties/installed-app details; this is explained in the guide.

`getAppInfo()` now includes `publicVersion`, `compatibilityVersion` and `releaseChannel`, while retaining `version` for the Electron-reported running application value. Script-based development harnesses report Electron's version there, unlike ordinary packaged startup. Tests now distinguish those fields correctly.

## Future artifact naming

- Installer: `HD2-Chaos-Slot-Machine-Setup-v1.0.0-win-x64.exe`
- ZIP: `HD2-Chaos-Slot-Machine-v1.0.0-win-x64.zip`
- Packaged application: `HD2 Chaos Slot Machine.exe`
- Local candidates: `HD2-Chaos-Slot-Machine[-Setup]-local-<label>-win-x64.<ext>` (no new local version increments).

Builder, artifact verifier, signature verifier and the draft-only workflow now use the public naming/version. The workflow validates the distinct full-word tag; old `v1.0.0`/historical tags are not reused or edited. The public-release gate also refuses a `local-preview` channel even if other checklist statuses are changed. Publishing requires deliberate label/channel review and all existing rights/security/artifact gates. The hosted workflow has not been run.

## Executed checks

- **352/352 unit tests** plus CSP/catalog/assets passed. Five identity tests cover stable profile/app ID, old 1.1.14 save read/persist without changing historical data, public/internal version separation, full-word header/mark, deterministic bounded icon geometry and workflow/signature naming. Existing actual PowerShell transfer-validator tests also pass with the new names/tag prefix.
- **7 windowed + 8 fullscreen/restart safety checks**, isolated and software-rendered, normal exits: `.test-data/desktop-safety-1789595135185`.
- **57 desktop workflow + 8 separate-process restart checks**, plus the existing controlled-network phase: `.test-data/electron-smoke-1789595297769`. Covers offline equipment/planets, Spin, locks/rerolls, WebAudio initialization, Results/scoring, Compare, Armory, Rank, bridge exports/imports and persistence. New full-word title, public/internal metadata and local SVG decoding pass. No audible listening or real native file-picker test is claimed.
- Generated 256px mark and the app's rendered header were visually inspected. The header fits the tested desktop layout. Existing tab screenshot filenames are not a claim that every captured image independently proves that tab's current state.
- Early safety attempts caught a misplaced CSS rule inside the app script; it was fixed and inline-script compilation added to the identity regression test. Two workflow attempts then exposed the development harness's Electron version instead of package version; explicit compatibility metadata fixed that check. Failure evidence remains under `.test-data`, not removed or counted as passes. Processes exited normally.

No rebuild, native install/uninstall/upgrade, packaged-branding test, fresh Defender scan or signing check this turn. The existing protected-startup EXE/ZIP are unchanged and **do not contain these changes**. No Desktop duplicate, personal-save access, deletion, commit, push or release. Runtime catalog/gear facts and gameplay rules were not changed.

## Exact next work

Resolve remaining WinShell terms/replacement and owner-approved artwork permission outreach; local preview work can continue while permissions remain open. Next build must include the full-name identity plus prepared installer notices/source materials. Verify package/source/icon/notice equality, run packaged regressions and an isolated native old-install upgrade before updating the versionAndBranding/finalArtifactTests gates. Do not publish a 1.0 claim based on these source-only tests. Live-war service, unrestricted planets, visual Armory, mission engine and galaxy map remain queued, not delivered by this branding change.
