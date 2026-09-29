# M3 live-war integration review

September 16, 2026 (Eastern), branch `codex/live-war-integration`. Owner requested a longer local implementation/testing session while away. No publication or personal installation replacement is authorized by this review.

## Implemented

The renderer now loads the shared selector, snapshot normalizer and refresh service, plus a small planet-preference adapter. The old fetch/cache implementation is no longer loaded or called. The desktop resource allowlist permits only the four specific new scripts; CSP's inline hash was regenerated without broadening script policy.

- One service checks at startup and every five minutes while the window/page is visible. Visibility, focus, online/offline and page lifecycle signals supply stale resume/reconnect handling and teardown. No closed-app updater/task is created.
- Spin and Armory have **Refresh war data** controls, cooldown feedback, last-successful date, source/availability labels and cache-preservation warnings. Randomization never waits for fetch. Failures retain dated cache or bundled editable planets, explicitly not confirmed currently playable.
- Random, reroll and manual choices use one active/enabled/known-enemy pool across factions. A valid live/cache list does not silently fall back to a different front if its planets are all disabled. Rerolls exclude the previous planet when alternatives exist, including a name-only offline selection gaining an API ID after refresh.
- The selected planet sets current/loadout enemy faction. Manual confirmation revalidates eligibility, so a candidate removed or disabled after being clicked cannot be confirmed. Changing a planet clears the previous mission choice, preserving equipment and equipment-reroll allowance.
- Background updates change available choices, not confirmed runs or historical Results. Selected planets retain their snapshot timestamp/source and an explicit selection-time notice. This is separate from the latest live-list status.
- User eligibility lives in `items.planets`, independently of refreshed war facts. Stable IDs take priority over old name matching; duplicate opt-outs cannot resurrect an excluded planet. New campaign planets can be disabled directly in Armory. IDs are persisted as **text**, consistent with the existing item-save validator; normalized API snapshots retain numeric IDs. JSON import/export and restart preserve preferences.
- Offline editable/custom planets remain available only when no usable campaign snapshot exists. Unknown enemies, inactive campaigns and unresolved/conflicting data remain outside the roll pool. No exact live mission-list claim, score rebalancing or new galaxy map was introduced.

Player documentation updated in README.md, README-FIRST.txt and draft release notes. Full name, public Local preview label, internal 1.1.14, app ID and personal profile location are unchanged.

## Problems found and corrected

1. Desktop allowlist initially rejected the newly linked external scripts. The unit resource-policy check caught this before launch; added exact script paths, not a wildcard.
2. First full desktop integration run caught numeric planet IDs violating the existing text-only saved item-ID contract. Fixed the adapter instead of relaxing the global save validator; added a transfer-validation regression. Failure preserved at `.test-data/electron-smoke-1789606811376`; app exited normally and no personal data was used.
3. Inspection found a removed old-cache helper still referenced by the selected-planet label. Replaced that branch with the immutable selection snapshot date/source.
4. Added nonrepeat protection for a name-only current planet when a live refresh supplies its ID. A different explicit ID is not equated by name.
5. Screenshot harness now waits for two animation frames after tab selection; initial screenshots could capture the previous tab before paint. Test code is not included in the installer.

## Verification evidence

- **446/446 unit tests**, CSP, catalog and asset validation pass: `.test-data/live-war-unit-final.log`. 247 local picture references, zero missing; seven preexisting placeholders remain outside the earlier corrected weapon/booster cases.
- Source safety: **7 + 8** checks, `.test-data/desktop-safety-1789606794226`.
- Source workflow: **57** checks, controlled network/selection **31**, separate-process restart **13** (includes five new war-cache/preference checks), `.test-data/electron-smoke-1789607155879`.
- Renderer security: **44 desktop + 44 browser-emulation** checks, `.test-data/renderer-security-1789607212721`.
- Import/export: **36 + 5 desktop/restart, 29 + 5 browser-emulation/restart**, `.test-data/transfer-health-1789607223174`. Browser emulation is real renderer/localStorage inside isolated Electron, not standalone Chrome/Firefox certification. Native picker dialogs are stubbed.
- All source GUI checks sequential under the shared exclusive lock, software rendered, isolated profiles, ordinary shutdown. No force kill, graphics/driver change or security-setting change.
- Packaged artifact inspection: **393 ASAR source comparisons**, **29 embedded payload comparisons**, 14 original installer legal/source files, shell/builder materials, ZIP CRC/runtime contents, fuses, installer/uninstaller component checks pass. WinShell absent. `.test-data/live-war-artifact-inspection/report.json`, `.test-data/live-war-zip-verify.log`.
- Defender candidate-directory scan exit 0/no threats, `.test-data/live-war-defender.log`. npm audit reports zero known vulnerabilities, `.test-data/live-war-npm-audit.json`. These are bounded checks, not guarantees of safety.
- Packaged EXE core **54**, ordinary separate-process restart **8**, normal fullscreen startup **7**, network/selection **31**, war-cache restart **5** checks passed as individual phases in `.test-data/packaged-smoke-1789607433340`. Real desktop startup fetch returned **36 live planets at 2026-09-17 01:11:13 UTC**. Controlled failure fixtures are separately recorded; external availability is not assumed permanent.
- Real five-minute packaged timer test **passed, six checks** in the same report: 300,746.9 ms elapsed, exactly two calls (startup + one automatic refresh), active/fresh state and byte-identical confirmed run/Results. Real clock and timers, controlled response fixture, no extra external API traffic. This is one interval, not a long-duration stability certification.
- Final repeat against the **same packaged bytes** added actual manual search CHOOSE/CONFIRM button checks: **54 + 8 + 7 + 33 + 5** passed, `.test-data/packaged-smoke-1789607847494`. Packaged renderer security **44** checks passed, `.test-data/packaged-security-1789607914705`. All processes exited normally, with matching shutdown evidence.

## Local candidate (unsigned, not installed)

`dist/live-war/HD2-Chaos-Slot-Machine-Setup-local-live-war-win-x64.exe`

- Setup SHA-256: `597f57d2c57f1f306d3b6955c63acd09022a91eded471572e84829813c04583a`
- ZIP: `HD2-Chaos-Slot-Machine-local-live-war-win-x64.zip`
- ZIP SHA-256: `aca49bbac9a44c7e40ce72a5574d2b00522bf300af9f4aa8c618eee471efa4aa`
- App EXE SHA-256: `607e10159b6dcb5cd5430d75299e12466e3f0904f0880109ce72f7c834618477`
- ASAR SHA-256: `794e563893f78c04618858af6f4a178be685fd98158dade367c746e1336aaae6`
- Setup and app Authenticode: **NotSigned**. No signing credentials used, no public release created. Installer/ZIP include runtime, assets and player guide; no development tools needed to play.

`scripts/start-live-war-review.cmd` launches the complete packaged runtime with `.test-data/live-war-owner-review`, separate from personal saves. Installed Installer Shell and the Desktop player handoff remain unchanged. Do not move the bare runtime EXE away from its supporting files.

After packaged acceptance, **107** superseded Installer Notices files were moved/hash-verified at `.test-data/accepted-builds/installer-notices`; restoration manifest `installer-notices-move.json` is adjacent. Nothing permanently deleted. Old notice launcher and artifact resolver follow the archive. `dist` now contains only installed-baseline `installer-shell` and latest review `live-war`. The installed app EXE hash still equals `4976e83cacbad5588bb2164a0fba8d1cd80466c6392eaf716963dfb2409c56d9`; no installation upgrade was performed.

## Remaining boundaries / next work

- This session does not run the native installer or uninstall, replace the personal app, or perform an actual OS sleep/reconnect cycle. Clean-machine/uninstall remains deferred by owner. Physical DPI/trackpad, audible listening/native pickers and long-duration acceptance remain open.
- One five-minute controlled run is not a soak/stability certification or proof the prior BSOD is resolved. No hardware acceleration enabled.
- Network response streaming/size limits and cross-instance atomic cache coordination remain potential hardening work. Damaged/unsupported cache writes fail closed; an explicit user-friendly recovery workflow can be added later without deleting preserved originals.
- M4 visual/collapsible Armory remains the next main implementation milestone after owner feedback on this candidate. Begin with search/owned filters and category collapsibles against the existing shared ownership model; do not recatalog equipment or alter scoring. M5 planet-aware suggested/confirmed missions and M6 SVG map remain future work.
- Rights/branding review, separate Windows clean-install/uninstall, hosted CI/signing and final release acceptance still apply. No GitHub push/tag/release, no personal save reset and no new Desktop duplicate.
