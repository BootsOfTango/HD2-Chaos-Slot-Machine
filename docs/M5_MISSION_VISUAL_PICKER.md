# Visual mission picker — September 17, 2026

Branch: `codex/mission-visual-picker`. Owner requested fewer words and more images after choosing a planet. This is a presentation change, not a mission-catalog or scoring update.

## Interface

- Native button cards with original yellow mission symbols, short names, durations, visible selected checkmark and `aria-pressed` state. Accessible names/tooltips retain full catalog names. Click/Enter uses the existing shared eligibility engine.
- A selected-mission symbol and compact name replace the text-only heading. Play this and Roll mission remain the main actions.
- My operation is collapsed initially; its checklist has matching icons. Add missing mission is separately collapsed. About missions contains the detailed caveats and optional text-list alternative.
- Suggestions retain a visible Check in-game reminder. Offline/cached availability remains explicitly unconfirmed; cached timestamps remain visible. Empty pools and changed/missing context remain actionable rather than silently reverting to another pool.
- Eleven locally bundled SVGs are original generic symbols, not official game assets. `assets/missions/ORIGIN.md` records this. Unknown/custom entries use the generic flag; imported names cannot supply artwork URLs.
- No save schema, mission eligibility, scoring, catalog facts, network policy or historical Result changes. Existing confirmed shortlists remain compatible.

## Verification

- Final unit/CSP/catalog/assets run: **540 tests pass**, `.test-data/mission-visual-unit-final.log`; all 247 existing picture references present (seven previous placeholders elsewhere). New icon tests separately verify all 14 mission mappings, 11 SVG files and hostile/custom IDs; archive routing is also tested.
- Source gameplay `.test-data/electron-smoke-1789623563874/report.json`: 122 workflow and 16 separate-process restart checks; mission lifecycle and controlled-network phases also pass. Added real-renderer offline decode of every symbol, visual/manual/random pool parity, card click/focus/selected-state checks and custom-text safety. The final subsequent layout adjustment moves Text list inside About missions; covered by the final window and packaged checks.
- Final source window `.test-data/window-smoke-1789623694876/report.json`: 102 checks, including native Enter on a card, keyboard custom-operation workflow, 640x480/100%/200% page-zoom control reachability, and separate browser responsive layout. `mission-picker-1280.png` visually inspected. Physical Windows DPI/assistive-technology testing is not claimed.
- All GUI tests use sequential isolated software-rendered profiles and graceful exits. Packaging and actual packaged verification are recorded below when complete.

## Packaged artifacts

- Setup: `dist/mission-visual/HD2-Chaos-Slot-Machine-Setup-local-mission-visual-win-x64.exe` (150,352,736 bytes), SHA-256 `7689d4d13dfeaa74f4417bd07ca78e080cbbc3b4275d41141dfdde3439e4f835`.
- Portable ZIP: `dist/mission-visual/HD2-Chaos-Slot-Machine-local-mission-visual-win-x64.zip`. Full runtime remains together under `dist/mission-visual/win-unpacked`.
  ZIP SHA-256: `b823917527314cf1eb39fa35c8c1457d172d755db0e8c68eeb2a25deb738b72a`.
- `.test-data/mission-visual-zip-verify.log` and `.test-data/mission-visual-artifact-inspection/report.json`: ZIP CRC, NSIS embedded payload, **412 source files /29 embedded comparisons**, source notices/components and hardened fuses pass. ASAR SHA-256 `bac8058a9d43397bcced45a995c020fda117f91be0e1fdf6419c3739d9af27d0`. No native installer execution. Final build log: `.test-data/mission-visual-build-final.log`.

## Handoff boundaries

Unsigned local review only. No native installation, personal-save mutation, public release or version increment. The Desktop shortcut targets the validated replacement using the same isolated owner-review profile. The prior runtime remains recoverable off Desktop.

## Completed packaged checks and Desktop handoff

- Actual packaged EXE `.test-data/packaged-smoke-1789624042708/report.json`: **119 workflow, 11 restart, 7 normal/fullscreen startup, 33 controlled-network and 5 war-cache restart** checks, plus the mission lifecycle phase. All 11 symbols decode offline; card selection, singular confirmed-shortlist status, hostile custom text, scoring, Results and persistence tested. All phases shut down gracefully.
- `.test-data/packaged-transfer-1789624118048/report.json`: **28 import/export +6 restart** checks, including custom operation and historical mission identities.
- `.test-data/packaged-security-1789624126296/report.json`: **44** checks; expected CSP blocks are test evidence, not unexpected errors.
- Defender custom scan completed with no threats (`mission-visual-defender.log`); npm audit reports zero known vulnerabilities (`mission-visual-npm-audit.json`). Neither guarantees security. Setup/runtime are unsigned. No native installer run, physical Windows DPI, audible listening, assistive-technology certification or long-duration stability claimed.
- Exact backup: `.test-data/desktop-visual-shortcut-20260917-015011/HD2 Chaos Slot Machine.lnk`. Existing shortcut now targets `scripts/start-mission-visual-review.cmd`, icon from the new EXE, separate profile `.test-data/mission-owner-review` unchanged. Saved shortcut target/icon verified; not manually clicked during handoff. Installed baseline hashes match previous evidence.
- **107** prior review files moved with before/after hashes to `.test-data/accepted-builds/mission-planner`. Adjacent `mission-planner-move.json` records restoration; historical launcher and resolver use the archive. No permanent deletion or duplicate Desktop files. The ignored one-off archive script must not be rerun.
