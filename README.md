# HD2 Chaos Slot Machine

A solo-dive companion: roll equipment, choose a planet and mission, then record your results. It does not launch missions, unlock gear, read game memory or access your Steam account.

**HD2 Chaos Slot Machine 1.0 — prepared for publication, not yet published.** The app, Setup and portable ZIP use this same release identity. Existing public downloads may have older names and fewer features; read the notes for the release you download. Windows/package version remains **1.1.14** for upgrade compatibility. “Official Project Release” means this project's release, not publisher endorsement. [1.0 changes and upgrade information](docs/RELEASE_NOTES_1.0_DRAFT.md).

## Install once, then use your shortcut

1. Open this project's [GitHub Releases](https://github.com/BootsOfTango/HD2-Chaos-Slot-Machine/releases), read the chosen release's notes and expand **Assets**.
2. Download its **Windows x64 Setup .exe**, not **Source code** or **Code → Download ZIP**.
3. Close any running copy. Run Setup and keep the normal Windows apps location—not the Desktop, download folder or source checkout.
4. Open **HD2 Chaos Slot Machine** from Start or Setup's desktop shortcut. You do not need Setup again until an update.

Setup includes the images and runtime. No Git, Node.js, npm or Python is needed. Leave the installed supporting files together.

**Prefer no installation?** Download the release's app ZIP, extract the **entire ZIP**, and run **HD2 Chaos Slot Machine.exe** inside it. Do not run inside the archive or move only the EXE. Portable and installed copies normally share the same Windows save folder; use one copy at a time. A developer's local shortcut will not work on another PC.

This release is **unsigned**. Windows may warn about an unknown publisher. Check the release source and signature/checksum information; a checksum is not proof of safety. **Do not disable Windows protection.**

### Updates

Application updates are manual: export your cards, download the newer Setup from the release page, close the app and install it. Cards stay in the separate save folder. **Refresh war data** updates planets/activity, not the application or gear catalog. There is no automatic application-update downloader. Review card-rule changes before applying them; no automatic recalibration or card deletion occurs.

## Your first solo dive

1. Dismiss **Just for fun** with **Let's dive**.
2. In **Armory**, review **Owned** and **Include in rolls / Enabled**. Mark only your actual unlocks; buying a Warbond does not unlock every item.
3. **Spin → SPIN LOADOUT**: choose difficulty and wait for the reels.
4. Use **SPECIAL EVENT: REROLL** if offered, then **LOCK LOADOUT**.
5. Keep the planet, **REROLL PLANET**, or **MANUALLY SEARCH FOR PLANET?** using the map/list. Then **CONFIRM PLANET**.
6. Choose a mission icon or **Roll mission**, then **Play this**. Check that the mission exists in your actual game operation.
7. Enter your player name → **CONFIRM PLAYER AND CREATE CARD**.
8. Play in Helldivers 2, then open the pending card in **Results** to record the dive.

Starting another Spin replaces the unfinished spin. Created Result cards and supported settings persist; unfinished equipment spins do not survive restart.

The **Seed** name is a themed codename, not a reproducible random seed or damage prediction. Equipment intensity and recorded planet/faction/mission context influence it. The generator avoids names already in your saved collection, not all names worldwide; deleting history removes that reservation.

## Results, radar and ranking

The guided card editor asks one question at a time. Use **Next / Back**, review all answers and **Edit** anything incorrect. Enter real score-screen numbers; **0 means none**, not unknown. Mission time is decimal minutes: **12.5 = 12m30s**. Record side objectives completed and total available; sample counts are not required.

**Cancel** or Escape discards the unsaved entry session, not the card. Tick the review checkbox and choose **Save & lock** only when ready: **numbers, outcomes and the original note become permanent**. You can still add comments later.

Saved cards show the radar, planet visual and a sector locator when available. Expand **Loadout**, **Stats** or **Scoring** for details. The locator is reference geography, not a live or historical territory replay.

Solo ratings use six provisional app benchmarks:

- **Firepower:** kills per minute, with the gentler Solo v2 curve.
- **Precision:** entered accuracy.
- **Survivability:** deaths relative to time—not a measurement of armor or damage absorbed.
- **Speed:** completion time relative to the mission limit; failed missions receive zero.
- **Utility:** completed/available side objectives. Zero available means N/A, not zero.
- **Mission:** main-mission completion; extraction is recorded separately.

**Rank** groups comparable Solo runs by difficulty, faction, mission/time limit and available objectives, ordering successful missions first, then rating. Unknown required scoring inputs leave a card unranked. **Compare and derived equipment analytics remain Legacy-only**; Solo profiles can be compared side by side in Rank. These are your recorded outcomes, not a controlled test isolating loadout strength or official game balance ratings.

Use **Results → Review card rules** to preview a scoring update. Nothing is recalibrated or removed automatically. **Later** keeps your old ratings in separate comparison groups. **Back up & apply** updates complete older Solo cards from their recorded inputs and removes only supported, genuinely incomplete finalized cards listed in the review. Pending cards are kept. Invalid/unknown records block the update instead of being deleted. No filling in missing old stats is required.

Original records, ratings, notes and later comments are retained for kept cards; rating revisions appear under Scoring and in exports. Desktop updates create a verified, byte-exact `card-upgrades/<unique-id>/before.json` recovery copy with a checksum manifest in **Open save folder**. These copies are outside the 20-file rolling backup limit. Data remains separate from the installation directory, even with a custom install location. Restore a recovery file through Import JSON only after reviewing newer dives/comments: import replaces the whole active collection, not a merge. Export current data first. Oversized native backups need assisted recovery; JSON import/export remains limited to 32 MiB/10,000 cards and never truncates history. Browser recovery copies remain in browser storage, so export them before clearing browser data. New history-bearing saves use format 2; older apps must not edit them. Unsupported future formats are preserved, not downgraded. Compatibility is tested for documented formats, not guaranteed for arbitrary damaged/unknown saves.

## Armory

Search names, aliases, roles and Warbonds. Browse collapsible equipment categories or Warbond/source cards. **CLEAR FILTERS** restores hidden results; filtering does not change roll eligibility. Warbond bulk controls affect the entire group, not just visible search matches. Search text resets on launch; supported browsing preferences are saved/exported.

The reviewed catalog contains **214 items and 25 Warbond groups**. It is bundled, not automatically updated when the game adds equipment. New paid/reward additions start excluded; existing ownership choices are preserved.

- **Castellan's Creed:** four rollable items, including **40-K Meltagun as a support stratagem**.
- **Ironclad Democracy:** seven additions. **LAS-12 Sai** is a separate Superstore primary.
- **Eagle Gas Airstrike:** a campaign reward, distinct from **Orbital Gas Strike**.
- An empty roll category does not silently re-enable unowned/excluded gear. Review your choices in Armory.

## Planet map and live-data limits

Drag from blank space **or a planet** to pan; wheel/pinch zooms. A normal click inspects a planet. Search to focus or choose **Use list instead**. **Eligible only** starts checked each time the chooser opens. Context/inactive planets are not automatically selectable. Sector shading and faction colors are approximate; supply links use available source data, not copied game-map artwork.

Hover, focus or inspect a planet to see environment/weather and **Reported activity**. Reviewed community reports can show Hive Lords, Jet Brigade, enemy surges, Terminid strains and SEAF presence. Unknown or missing reports **do not mean no special enemies**. Badges are not guaranteed encounters, and environment labels are not weather measured at this instant.

- Refresh at startup and every **five minutes while open and visible**.
- While the map is open and visible, refresh checks run **once per minute**.
- Stale reconnect/resume and **REFRESH WAR DATA** can request updates. Manual refresh has a **30-second cooldown**; failures/rate limits extend retries.
- No per-hover requests or updates while closed. Planet refresh does not install new gear catalogs or app updates.
- Community feeds can lag the game. Retrieval times do not prove when game conditions changed. Check timestamps and the in-game map before diving.
- Offline cached/bundled data is **not confirmed currently playable**.
- Random/manual selection share enabled active planets across factions. The chosen planet sets the enemy; rerolls avoid the current planet when another is eligible.
- Refresh does not silently alter locked runs or historical Results. Unfinished incompatible mission choices can require reconfirmation.

### Missions are suggestions, not an exact operation list

The bundled catalog has **60 mission identities**, with sourced game-image icons displayed yellow/gold. Coverage is partial, not a complete list of all current game content. Suggestions use known faction, difficulty and campaign context; some event/region restrictions require player confirmation. Custom/unknown missions use fallback symbols.

Optional tools live under **Armory → Advanced → Mission tools → My operation**. Choose/confirm a planet in Spin first, then check the missions you actually see. **Add missing mission** requires an explicit scoring category; duration alone does not determine scoring. Manual choices and roulette use the same confirmed shortlist. An empty shortlist remains empty until changed or **Reset to suggestions** is chosen. Planet, difficulty, event or catalog changes can require reconfirmation. **Back to mission** returns to Spin.

## Window controls

Normal launch starts fullscreen. **F11** or **Fullscreen** toggles windowed mode. **Escape** closes the open dialog first; otherwise it exits fullscreen. Smaller windows retain the desktop layout: use scrollbars, wheel/trackpad, or **Space + drag on empty background**. Map dragging is separate and needs no Space key.

## Saves, backups and updates

- **Results → EXPORT JSON:** make a separate backup before updating, importing or changing PCs. Keep it outside the app folder until restoration is verified.
- **Results → IMPORT JSON:** can replace cards/settings; export your current data first. Supported older desktop/browser exports are accepted.
- Transfers allow up to **32 MiB and 10,000 cards**, with nesting/complexity limits. Oversized transfers are refused, not truncated. Desktop autosaves do not have this transfer limit; browser storage can fill earlier.
- **Results → OPEN SAVE FOLDER** opens the active profile. Normal installed/portable saves are at **%APPDATA%\Helldivers 2 Chaos Slot Machine\state.json**, with backups/recovery nearby.
- The developer's review shortcut uses a separate profile; use **OPEN SAVE FOLDER** to find the correct one.
- Close the app before running new Setup. Do not delete the save folder or recovery files. Do not open newer-format saves in older builds.
- **CLEAR ALL DATA** is a reset, not routine troubleshooting. Automatic recovery backups do not replace your own exports.
- Exports can contain player names/history; review before sharing.

### If saving fails

Keep the app open and use **Retry saving** or **Export session JSON**. **Close without saving** requires confirmation and discards unsaved session changes. If startup cannot safely read an existing save, the session protects it from overwrite. Close and resolve the read problem or use a compatible newer app; do not delete the original to bypass protection. Cache-preservation warnings may mean new data is memory-only; preserve backups and report the warning.

## Troubleshooting and credits

**Missing gear?** Clear filters and check Owned/Included. The app cannot verify your purchases. **No sound?** Check Windows volume and the selected output device. **Slow or unstable?** Software rendering may use more CPU. If you encounter freezing, display trouble or a blue screen, stop and report the time/build/steps rather than repeatedly reproducing it.

[Report an issue](https://github.com/BootsOfTango/HD2-Chaos-Slot-Machine/issues) with the build label/version, Setup/portable/review-copy choice and a screenshot. Do not post passwords, tokens or private saves.

This independent fan project is not endorsed by Arrowhead or Sony. The existing Apache 2.0 code license permits compliant reuse; it does not grant rights to third-party images or trademarks. Game/crossover artwork and community contributions retain their owners' rights. Credits do not establish redistribution permission. See [NOTICE](NOTICE.txt), [third-party notices](THIRD_PARTY_NOTICES.md) and [security guidance](SECURITY.md). No copyright-clearance, malware-free or crash-free guarantee is made.

## Development and release status

Players need no source checkout. Maintainers: [development](docs/DEVELOPMENT.md), [current status and remaining work](docs/PROJECT_STATUS.md), [release checklist](docs/RELEASE.md), [draft 1.0 notes](docs/RELEASE_NOTES_1.0_DRAFT.md). The [standalone player guide](README-FIRST.txt) is bundled by the build process; editing its source does not update an existing installer or ZIP.
