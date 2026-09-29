# M5 mission catalog expansion and interface acceptance

September 16, 2026; branch `codex/mission-catalog-expansion`. Local work, not publication or owner acceptance.

## Reviewed catalog

`assets/mission-catalog.json` now has 14 distinct identities, revision `review-2026-09-16-a`, still explicitly **partial**. Nine are eligible for compatible suggestions when their restrictions match; five require an observed in-game operation. Specific mission identity remains separate from the unchanged legacy scoring family. No new scoring formula, automatic content scraping or save-format version.

The nine additions are:

| Identity | Front | Reviewed difficulty | Time | Treatment |
| --- | --- | --- | --- | --- |
| Retrieve Valuable Data | All three | 3–10 | 40 min | Suggested |
| Emergency Evacuation | Terminids / Automatons | 3–10 | 40 min | Suggested |
| Evacuate Colonists | Illuminate | 1–10 | 40 min | Suggested; city name Evacuate Citizens is not double-weighted |
| Blitz: Search and Destroy (Terminids) | Terminids | 2–10 | 12 min | Suggested |
| Blitz: Search and Destroy (Automatons) | Automatons | 3–10 | 12 min | Suggested |
| Blitz: Destroy Illuminate Warp Ships | Illuminate | Normally 3–10 | 12 min | Confirmation-only; low-difficulty and regional exceptions |
| Rapid Acquisition | Automatons | 3–10 | 15 min | Confirmation-only; regional availability unresolved |
| Chart Terminid Tunnels | Terminids | 3–10 | 40 min | Confirmation-only; Gloom context not verified by adapter |
| Blitz: Destroy Illuminate Warp Gateways | Illuminate | 1–10 | 12 min | Confirmation-only; Void Source Planet context not verified |

The earlier five identities are retained. Defend Evacuation Site remains confirmation-only. The generic old Blitz minimum of Challenging is not applied to faction-specific versions. A player can explicitly confirm a lower-difficulty Illuminate ship mission; its recorded conflicts retain the override instead of changing global eligibility.

## Evidence and limits

Facts were reviewed against indexed community wiki text on September 16. Direct requests to several wiki.gg pages returned 403; the structured source records truthfully say `community-reference` / `indexed-text`, **not publisher-verified**. No page artwork or mission descriptions were copied into the app.

- [Retrieve Valuable Data](https://helldivers.wiki.gg/wiki/Retrieve_Valuable_Data): the page includes all three fronts and notes the Illuminate addition.
- [Emergency Evacuation](https://helldivers.wiki.gg/wiki/Emergency_Evacuation) and [Evacuate Colonists](https://helldivers.wiki.gg/wiki/Evacuate_Colonists): the second page distinguishes the Illuminate naming. Do not conflate these with asset defense or the removed Retrieve Essential Personnel mission.
- [Terminid Blitz](https://helldivers.wiki.gg/wiki/Blitz_Search_And_Destroy/Terminid) and [Automaton Blitz](https://helldivers.wiki.gg/wiki/Blitz_Search_And_Destroy/Automaton): faction-specific infoboxes list different minimum difficulties.
- [Illuminate ships](https://helldivers.wiki.gg/wiki/Blitz%3A_Destroy_Illuminate_Warp_Ships): the infobox minimum includes special operations; the body says normal availability begins at Medium, with Trivial/Easy restricted to Avert Void operations on Exostorm planets. [Gateways](https://helldivers.wiki.gg/wiki/Blitz%3A_Destroy_Illuminate_Warp_Gateways) replaces that mission on the Void Source Planet. Without structured regional identification, neither variant is automatically suggested.
- [Rapid Acquisition](https://helldivers.wiki.gg/wiki/Rapid_Acquisition): basic identity and timing are documented, but its wording about expansion beyond Magma planets is tentative. This is not adequate evidence to assume every Automaton operation can include it.
- [Chart Terminid Tunnels](https://helldivers.wiki.gg/wiki/Chart_Terminid_Tunnels): Gloom context requires confirmation, not Major Order keyword matching.

Campaign restrictions not documented for ordinary missions remain unspecified, not proof of universal availability. The UI continues to say **Suggested compatible missions**, not an exact live operation list. Catalog revision changes require reconfirmation; old shortlists and historical Result snapshots remain structurally readable and recoverable.

## Validation

- **531/531 units**, CSP/catalog/assets pass: `.test-data/mission-catalog-final-unit.log`. All 247 local picture references exist; seven previously recorded placeholders elsewhere remain. Four new unit cases cover faction-specific boundaries, evacuation naming, data retrieval and held regional missions. Uniform-draw assertions now cover the actual enlarged pool instead of assuming two choices.
- Source Electron **106 workflow +14 mission lifecycle +33 network +16 restart**, `.test-data/electron-smoke-1789615544426/report.json`. Lifecycle acceptance includes real timer expiry, failed-save feedback, unchanged-refresh stability, finalized snapshot preservation, stale-draft rejection, and expired event-only enemies blocking selection without inventing a winner. This run predates the CSS-only header fix; the final window suite below tests that fix.
- Window regression **101 checks**, `.test-data/window-smoke-1789615849124/report.json`, graceful runner result. Adds ten-control scroll/focus/hit-testing at 640×480 with 100% and 200% Electron page zoom, native Tab order and Enter activation for adding/confirming/rolling a custom mission. Both mission screenshots were produced; `mission-checklist-200-percent.png` was visually inspected. Browser-mode responsiveness remains intact. Page zoom is not physical Windows DPI testing; this is not full screen-reader or touchpad acceptance.
- Transfers **48+9 desktop /39+9 browser-path**, `.test-data/transfer-health-1789615913432/report.json`. Both use isolated profiles; browser mode is Electron without the desktop preload, not independent browser-vendor testing. Native file dialogs are stubbed.
- Renderer security **44 desktop +44 browser-path**, `.test-data/renderer-security-1789615980905/report.json`. Injected frame was blocked by the existing CSP as expected. No policy relaxation.

The native window check found a real occlusion: the sticky app header covered mission controls in the short, high-zoom desktop viewport. `assets/desktop-window.css` now makes that header scroll normally below a 600-CSS-pixel viewport height. It does not compact the 1280px canvas or alter browser header styling; the fullscreen toolbar stays fixed. The final tests hit the actual controls, not just their bounding boxes.

Player guides now explain suggestions, confirmed/custom operations, reconfirmation, score separation and source-only availability. Removed a contradictory old README claim that planet rerolls remain faction-locked. No claim that the source mission changes are already packaged or public.

The renderer lifecycle test uses a normalized synthetic campaign with a short real wall-clock expiry, without network refresh. It separately exercises independent campaign enemy evidence and event-only enemy evidence. Failure injection changes only the isolated test's save callback; no personal profile is used. Timer expiry must not invent a battle winner or overwrite a finalized Result.

### Failed attempts retained, not counted as passes

- `.test-data/electron-smoke-1789615344986` / `1789615429801`: the new synthetic fixture lacked a display faction, causing an empty class-token exception. Corrected the fixture; no production eligibility change. Error serialization now retains cross-context/string errors, and the runner checks the failure report before trying to read a nonexistent success report.
- `.test-data/electron-smoke-1789615501800`: the assertion incorrectly expected a still-known enemy after an event-derived attacker expired. Corrected the fixture to distinguish independently evidenced campaign enemies from event-only evidence and added explicit checks for both safe outcomes.
- `.test-data/window-smoke-1789615632060` / `1789615705610`: control-center hit tests failed against the sticky `HEADER`. Adding frame-settling did not fix it; rect/hit diagnostics established actual header occlusion. The scoped CSS fix above resolves it.
- `.test-data/window-smoke-1789615758690`: geometry and Tab order passed, but the harness sent keyDown/keyUp only for Enter. Corrected native injection to include the Windows carriage-return character; no synthetic DOM click fallback. See [Electron KeyboardInputEvent documentation](https://www.electronjs.org/docs/latest/api/structures/keyboard-input-event/) and [Electron's Enter-event discussion](https://github.com/electron/electron/issues/8977).

Each stopped GUI attempt was reviewed for graceful `will-quit`, absence of its exact process and a released test lock before retrying. No force kill or Windows/graphics/security change. All GUI suites run sequentially with exclusive locks and software rendering.

This does not certify full mission coverage, actual game operation availability, physical DPI, real OS suspend/resume, audible sound, or clean Windows installation. M6 galaxy navigation and M7 release/upgrade gates remain separate work.

## Next bounded task

Finish consistent mission-name display/search across Results, Compare and exported share views while retaining score-category filters and legacy cards; test hostile/long custom names. Then build and launch one local M5 candidate, verify artifact contents/compatibility and archive only the superseded review after its replacement passes. Catalog remains partial and region identification remains unresolved; do not hold it out as exact live mission coverage.

This slice creates no new installer, installation change, Desktop duplicate, personal-save mutation, artifact deletion, version increment, commit, push or publication. Installed baseline and Armory Browser candidate remain unchanged.
