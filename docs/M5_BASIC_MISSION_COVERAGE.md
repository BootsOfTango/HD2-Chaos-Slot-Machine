# M5 basic mission coverage — September 18, 2026

Branch `codex/mission-coverage-basics`. Bounded mission-catalog batch; no map implementation or public release. Catalog revision `review-2026-09-18-a` remains explicitly partial: **22 identities, 16 suggestion-enabled, 6 confirmation-only**.

## Reviewed additions

All eight have a 40-minute limit and retain the existing `Normal (40)` scoring category. This mapping preserves app scoring; it is not a new game scoring formula.

| Mission / community reference | Suggested fronts | Difficulty | Treatment |
| --- | --- | --- | --- |
| [Upload Escape Pod Data](https://helldivers.wiki.gg/wiki/Upload_Escape_Pod_Data) | All three | 1–2 | Main mission only; higher-level side objective excluded |
| [Start Fuel Pumps](https://helldivers.wiki.gg/wiki/Start_Fuel_Pumps) | Terminids, Automatons | 1–2 | Former title is not an extra weighted entry |
| [Terminate Illegal Broadcast](https://helldivers.wiki.gg/wiki/Terminate_Illegal_Broadcast) | All three | 1–2 | Optional tower objectives are not standalone high-level missions |
| [Spread Democracy](https://helldivers.wiki.gg/wiki/Spread_Democracy) | Terminids, Automatons | 1–10 | Main mission only; no extra Gloom side-objective row |
| [Activate Oil Pumps](https://helldivers.wiki.gg/wiki/Activate_Oil_Pumps) | Terminids | 2–3 | Separate low-level mission, not every occurrence of its objective |
| [Enable Oil Extraction](https://helldivers.wiki.gg/wiki/Enable_E-710_Extraction) | Terminids | 4–10 | One identity, including the former E-710 wording |
| [Destroy Command Bunkers](https://helldivers.wiki.gg/wiki/Destroy_Command_Bunkers) | Automatons | 5–10 | Layout/objective counts do not add duplicate missions |
| [Conduct Geological Survey](https://helldivers.wiki.gg/wiki/Conduct_Geological_Survey) | All three, observed only | 1–10 metadata | Confirmation-only because low-level evidence conflicts |

## Evidence and exclusions

Read indexed community page text on September 18. Direct page requests returned HTTP 403 for the pod, fuel and difficulty pages. Source records therefore say `community-reference` / `indexed-text`, not publisher verification or a direct game API feed. No mission briefing text or official mission icon was copied.

Start Fuel Pumps and Spread Democracy have broad Any infobox values but explicitly describe only Terminids/Automatons in their main text. This batch conservatively suggests only those two fronts; it does not claim the excluded front is impossible in-game.

Geological Survey's mission page lists Trivial onward, whereas the [Difficulty table](https://helldivers.wiki.gg/wiki/Difficulty) lists its introduction at Medium. The app holds it for player confirmation instead of choosing a conflicting minimum as fact. The mission page's broad range remains descriptive metadata, not automatic eligibility.

Reviewed but not added: [Sabotage Supply Bases](https://helldivers.wiki.gg/wiki/Sabotage_Supply_Bases) has contradictory current-region/high-difficulty wording versus its recent change history. [Retrieve Essential Personnel](https://helldivers.wiki.gg/wiki/Retrieve_Essential_Personnel) remains documented as disabled; do not restore it just because a generic mission index lists it.

Existing unresolved regional missions stay confirmation-only. No new verified event-rule key, MO-keyword inference, or claim of exact operation availability. Further faction-specific/Illuminate/Gloom/temporary mission coverage is still pending.

## UI and compatibility

Added five original offline symbols (fuel, broadcast, flag, bunker, survey); pod upload reuses the data symbol. All 22 entries have compact visual labels; custom entries retain the generic flag. Existing card layout and collapsed details are preserved. Help now says Play this confirms a recommendation and Create a Result saves it, avoiding a persistence implication for unfinished spins.

Compared source against the previous `dist/mission-visual/win-unpacked/resources/app.asar`: all **14 prior mission records and their source records are unchanged**. Only the new revision, review date, sources, eight rows and visual mappings are added. A catalog revision change intentionally requires operation reconfirmation; historical Result snapshots and scores remain readable and unchanged. No save-format or package-version change.

## Verification and handoff

Unit/CSP/catalog/assets and source/package evidence are recorded at completion below. Low-level pool tests must not remove the genuinely-empty-pool safety test merely because basic missions now fill the old fixture. Keep random/manual pool equality, old-revision rejection, explicit recovery, hostile-text safety and offline icon decoding covered.

- **551 unit tests**, CSP/catalog/assets pass (`.test-data/mission-basics-unit-final.log`). Added full 3-front × 10-difficulty boundary checks for each new suggested mission, confirmation-only survey checks, low-level random/manual parity, previous-revision and historical-record preservation, and exact recovery path checks. Existing empty-pool tests now use an explicitly restricted catalog instead of relying on an accidental content gap.
- Source `.test-data/electron-smoke-1789783324279/report.json`: **128 workflow +14 mission lifecycle +33 controlled-network +16 restart**. All 16 original mission symbols decode offline. Real-renderer tests cover low-level choices, stale-catalog notice/disabled actions, preservation of the old operation, and explicit reset to new suggestions.
- Source window `.test-data/window-smoke-1789783398125/report.json`: **103 checks**; includes decoded low-level cards, native keyboard/card focus, custom operations, 640x480 scrolling at 100%/200% page zoom, and browser responsiveness. `mission-picker-basics-1280.png` visually inspected. The partial synthetic loadout shown beside the picker is a test fixture, not an artwork regression. No physical Windows DPI claim.
- One earlier source run (`electron-smoke-1789783224311`) stopped at an obsolete assertion that D1 bots/bugs had no suggestions. That expectation was the content gap fixed here. Confirmed exact PID 23852 absent, `will-quit` recorded, and exclusive lock released before correcting the assertion and rerunning. No production selection rule was weakened, forced process termination, or Windows setting changed.

## Packaged verification and Desktop handoff

- Setup: `dist/mission-basics/HD2-Chaos-Slot-Machine-Setup-local-mission-basics-win-x64.exe`, 150,355,457 bytes, SHA-256 `4b1134d0592eedc6ba0d1d9bfbe834315e14916ad564cc00dbc847feb3db1a90`.
- ZIP: `dist/mission-basics/HD2-Chaos-Slot-Machine-local-mission-basics-win-x64.zip`, SHA-256 `1a6887f63008a1cd4ef9b3b63500daa49ff5c8d2738641627506fb4986b4a893`.
- EXE SHA-256 `fa7e716c1b84f238a5d6dd38e48ce87d9232f896f5c0d3a19eb69b0ed648f23b`; ASAR `7a26fc7bdc6986ccfc1f3af959cb6a7966fd11b895210cf854f0b95d49b3d08c`. Setup and EXE signatures both report `NotSigned`.
- `.test-data/mission-basics-zip-verify.log`, `.test-data/mission-basics-artifact-inspection/report.json`: ZIP CRC, NSIS payload, notices/components/fuses, **417 source /29 embedded** comparisons pass. Native installer was not executed.
- Actual packaged EXE `.test-data/packaged-smoke-1789783609462/report.json`: **124 workflow +11 restart +7 normal/fullscreen +33 network +5 cache restart**, plus 14 mission lifecycle checks. Tests include first-offline use, all 16 icons, low-level card/roulette parity, old-revision review/reset and preservation, historical Results, scoring and all shared workflows. Sound checked through WebAudio, not human listening.
- Packaged transfers **28+6 restart**, `.test-data/packaged-transfer-1789783694817/report.json`; security **44**, `.test-data/packaged-security-1789783702959/report.json`. All GUI processes exited gracefully, exclusive test lock released. Native pickers are stubbed, not clicked.
- Defender custom scan found no threats (`mission-basics-defender.log`), npm audit zero known vulnerabilities (`mission-basics-npm-audit.json`). These are bounded checks, not security guarantees. Clean Windows install/uninstall, physical DPI, audible listening, long-duration stability and release/artwork permissions remain separate gates.
- Existing Desktop shortcut backed up/hash-verified at `.test-data/desktop-basics-shortcut-20260918-220937/HD2 Chaos Slot Machine.lnk`, then retargeted to `scripts/start-mission-basics-review.cmd` with its runtime icon. Uses the unchanged isolated owner-review profile, not personal saves. Shortcut target/icon verified; manual Desktop clicking not part of this handoff.
- **107** superseded Visual Mission files archived/hash-verified at `.test-data/accepted-builds/mission-visual`; adjacent manifest preserves recovery paths and hashes. Historical launcher/resolver retargeted. Active outputs contain installed baseline and latest review only. No permanent deletion, new Desktop file, native installation, publication or version increment. Do not rerun the one-off archive script.
