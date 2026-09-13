# HD2CSM approved implementation roadmap

Approved September 13, 2026. This is incremental work, not authorization to publish every milestone. Read `PROJECT_STATUS.md` first in each session.

## Invariants

- Preserve saves, imports, ownership choices, scoring history, and existing web functionality.
- Develop in `C:\Users\Chris\Desktop\HD2CSM-Source`. The older `Helldivers-2-Roulette` folder contains runtime files; its missing Git sources are **not** intentional deletions to commit.
- Keep source, installed apps, `dist/` artifacts, and `.test-data/` profiles separate. Never use personal saves for tests.
- Each milestone ends with an independently tested local build and a hands-on checklist. Publish only with the owner's approval; never replace published release assets with changed binaries.
- No Steam credentials, memory reading, private game APIs, or game-control automation.

## Milestones and gates

### 0 — Workspace and baseline

Clone the published v1.1.0 source into the new folder, install locked dependencies with `npm ci`, run baseline tests, and record evidence and exact next work. Keep the existing app and personal saves untouched.

Gate: separate usable development environment with passing baseline and a working `codex/` branch.

### 1 — Fullscreen and smaller windows

True fullscreen on every normal launch. F11 and an accessible toggle enter/exit; Escape closes a custom dialog before leaving fullscreen. Windowed minimum: 640 × 480. Desktop layout minimum: 1280 CSS pixels; shrinking the window exposes native scrolling and Space-drag background panning, not mobile layout. Dialogs follow the actual viewport, support keyboard focus, and retain reachable close/confirm controls. Web layout remains responsive.

Gate: focused real-Electron input/window tests, small-window dialogs and panning, browser-layout regression check, existing feature/restart smoke suite, and local packaged EXE launch. Separate emulated zoom testing from physical Windows DPI testing.

### 2 — Gear catalog and ownership

Add Castellan's Creed Legendary Warbond: R/40-K Hot-Shot Marksman Rifle, P/40-K Bolt Pistol, G/40-K Melta Mine (alias Meltamine), and support stratagem 40-K Meltagun. No booster is implied. Add Eagle Gas Airstrike under Campaign rewards without replacing Orbital Gas Strike or assuming the reward is owned.

Introduce stable catalog IDs/aliases alongside legacy names, source/acquisition associations, local attributed artwork and Warbond cover. Separate facts from owned/enabled state. Provide a compact new-gear panel and Warbond bulk ownership controls. Audit existing Warbond assignments; distinguish base game, Warbond, Superstore, campaign reward, and custom. Catalog changes remain reviewed release content, not silent scraping.

Gate: names/categories/sources, opt-in roll eligibility, offline images, ownership upgrade compatibility, and complete equipment associations verified.

Sources to recheck when implementing:

- [Official Castellan's Creed announcement](https://news.xbox.com/en-us/2026/08/07/helldivers-2-x-warhammer-40000-warbond-xbox/)
- [Arrowhead campaign reward support](https://arrowhead.zendesk.com/hc/en-us/articles/29563053705500-I-didn-t-get-a-campaign-reward)

### 3 — Shared live-war data and planet selection

One snapshot service for Spin, Armory, missions and map. Startup refresh, five-minute refresh while open/active, stale reconnect/resume refresh, prominent manual refresh and last-successful timestamp. Deduplicate, cool down manual requests, honor rate limits and back off. Never block randomization on network. Preserve valid cached data; bundle offline planets and label their playability unconfirmed.

Roll uniformly across enabled active planets from every faction; rerolls exclude the current planet if another is eligible. Derive defense enemies from invasion/event context before ownership/campaign fallback. Planet selection sets faction and invalidates incompatible mission context, but preserves equipment/reroll allowances. Random/manual/map selection share one validation path. Refresh never mutates locked runs or historical Results.

Gate: all-faction distribution/exclusion tests, defense faction fixtures, stale/corrupt/outage/resume tests, and clear freshness UI.

### 4 — Visual Armory

Search plus owned/enabled filters above collapsed Weapons, Stratagems, Boosters, Warbonds. Group by slot/role; Warbond cover cards expand into equipment and acquisition/ownership controls. Shared ownership state in every view. Search names, aliases, categories and Warbond names; reveal matching sections and useful empty states. Put statistics, manual editing and advanced tools in collapsed areas. Remember browsing preferences but do not restore stale searches that hide new content.

Gate: quick item lookup, accurate associations/covers, consistent ownership controls and no text-wall navigation.

### 5 — Planet-aware missions

Curated specific mission names, durations and verified restrictions. Filter suggestions by faction, difficulty, liberation/defense context and verified events. Label them **Suggested compatible missions**. Public war data does not supply each player's exact in-game operation list.

Provide **Match my in-game operation**, a player-confirmed checklist shared by manual/roulette selection. Scope to planet, difficulty and relevant event context; do not clear on unchanged refresh. Allow explicitly confirmed event missions absent from suggestions without changing the global catalog. Do not infer exact availability from Major Order wording. Explain unknown/empty pools. "Play this" finalizes this app's recommendation only.

Specific mission identity is separate from legacy scoring family. Retain historic labels/scores; no implicit scoring rebalance.

Gate: shared eligibility tests, confirmation invalidation/isolation, legacy scoring preservation, honest suggestion/confirmation labels.

### 6 — Interactive galaxy map

Original locally rendered SVG using planet coordinates, not screenshot/third-party embedding. Mouse pan, wheel/pinch zoom, zoom/reset controls; sectors, faction colors, active planets, defense/liberation state and supported MO indicators. Inactive planets contextual only. Search-to-focus, selection highlighting/details and accessible text-list fallback. Selecting eligible planets opens M5 missions through M3's shared rules. Bundle map/background assets; same freshness labeling offline. Map gestures stay separate from page panning.

Gate: visual find/inspect/select/mission flow matches Spin and works offline/with keyboard fallback.

### 7 — Integration and approved release

Full startup → equipment → planet → mission → Results → restart flow; window/fullscreen/scaling/keyboard tests; clean install and v1.1.0 upgrades; legacy imports/exports; damaged caches, first-launch offline, API outages and campaign changes. Launch the installed EXE, verify installer/ZIP/checksums/artwork, write exact patch notes and state save compatibility. New version for each approved release. Label unsigned local builds; public signing requires configured credentials.

## Shared boundaries

Catalog: stable IDs, aliases, acquisition, artwork provenance, independent ownership.
War snapshot: IDs/coordinates, active state, enemy resolution, events, timestamps/freshness.
Missions: identity/restrictions, legacy scoring family, suggested vs confirmed provenance.
Selection: single planet/mission validation path.
Persistence: explicit compatible migrations, export coverage for supported new preferences.

[Community API documentation](https://github.com/helldivers-2/api) and [schema](https://helldivers-2.github.io/api/openapi/Helldivers-2-API.json) must be checked again before M3/M5 implementation.

## Daily handoff

1. Read status and inspect branch/worktree, preserving existing changes.
2. Choose one bounded task in the current milestone.
3. Implement and run proportionate tests.
4. Record evidence, limitations, and exact next task.
5. At the gate, provide local build and hands-on checklist.
6. Incorporate owner feedback before publication.
