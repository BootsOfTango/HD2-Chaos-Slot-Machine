# M4 — Armory browser, first integrated source slice

September 16, 2026 · `codex/armory-dashboard` · local source only

## Implemented

- Equipment browsing is now the first Armory panel, outside the collapsed advanced editor.
- Top search supports existing names, aliases, source/Warbond names, types and subgroup labels.
- Owned, not owned, included and excluded filters use the existing catalog ownership state. They never alter eligibility merely by filtering. Type filters now also work in Warbond view.
- Clear Filters resets search, type and ownership, with match totals and a recoverable empty state.
- Weapons (primary/sidearm/throwable), Stratagems and Boosters have collapsible sections. Source/Warbond entries are collapsible cover cards with existing shared per-item and bulk ownership controls.
- Search automatically opens matching sections. User expansion choices survive rerenders within the session. Search-driven expansion is temporary. Existing saved view/type preferences remain supported; first-time browsing defaults to categories.
- Source details are expandable, with the existing reviewed source metadata retained. Statistics are collapsed; custom additions/reset remain in advanced tools. Notices and artwork caveats are preserved.
- Ownership rerenders restore focus, or move focus to the ownership filter if the item disappears from the current filter.
- Compact readable controls replace the old inherited 150% Armory control scaling within the new browser only. Fullscreen and browser layout mechanisms were not replaced.

No catalog facts, artwork, scoring rules, save schema, catalog ownership storage or historical Results were changed. The UI mounts existing containers once, preserving their IDs and handlers. No new executable/build, installation, publication, Desktop copies or cleanup operation in this slice.

## Evidence

- `npm test`: **451/451** unit tests, CSP/catalog/assets pass. `.test-data/armory-dashboard-unit-final.log`. Five focused filter tests include legacy ownership, inconsistent records, complementary eligibility, mutation protection and no parallel ownership store.
- Real source Electron UI, offline fixtures and separate-process restart: **77 workflow +33 controlled-network +13 restart** checks, `.test-data/electron-smoke-1789608625338`. Includes twenty new browser controls/search/focus/state checks. Import/export, Spin, reroll, Results/scoring, Compare and Rank remain in the shared regression. Sound is a WebAudio output-context check, not human listening.
- Source renderer security: **44 desktop +44 browser-emulation** checks, `.test-data/renderer-security-1789608492757`. Browser emulation is Electron with browser-style storage, not an independent browser product.
- Existing native-window regression: **93 checks**, `.test-data/window-smoke-1789608671449`; graceful exit and test lock released. Includes fullscreen/windowed, keyboard/panning and browser responsive-layout checks. DPI cases use Electron page zoom, not physical Windows display scaling; these are not exhaustive new-Armory keyboard acceptance.
- Reviewed final `items.png` and `armory-warbonds.png` from the successful final smoke. The first captures were stale compositor frames despite updated DOM; the harness now resets viewport position and waits briefly after frame callbacks. Final screenshots show the correct active tab and compact controls. Earlier runs retained as diagnostic evidence.
- GUI tests use exclusive locks, software rendering, isolated profiles and graceful shutdown. No personal saves used.

## Still queued before completing M4

- Stratagem role subgroups and final Warbond/card layout polish; comprehensive cover/association audit gate remains separate from this unchanged-facts UI work.
- Deliberate persisted browsing preferences with validated migration/export coverage. Current expansion/search/ownership-filter state is session-only; old saved view/type behavior is unchanged.
- Expanded keyboard/small-window interaction acceptance for the new controls, actual Windows scaling and owner review.
- Build one named candidate after remaining M4 integration; packaged verification, then archive superseded review artifacts under the cleanup policy. The installed Installer Shell and current Live War review artifacts **do not contain this Armory change**.
- M5 missions, M6 map and M7 final release acceptance remain. No public-release/signing/artwork-rights gate is waived.

Next bounded task: stratagem role grouping plus explicit browsing-preference persistence/export tests, then the M4 candidate build and packaged review.
