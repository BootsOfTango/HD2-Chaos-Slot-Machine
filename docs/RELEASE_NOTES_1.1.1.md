# HD2 Chaos Slot Machine v1.1.1 — release notes

**Release-note source; publication is confirmed on GitHub, not by this document's existence.** The owner approved v1.1.1 with the current images, explicitly acknowledging unconfirmed redistribution permission. Credits/notices remain; no copyright-clearance claim is made. Download links and checksums are generated from the exact built files by `scripts/prepare-release-notes.js`, not copied from an earlier candidate. Manual consumer-Windows coverage limitations remain documented.

## What's prepared

- **Full-name branding:** HD2 Chaos Slot Machine, with an original yellow/black app mark. Public 1.1.1 is separate from Windows/package compatibility version 1.1.14; saves retain their existing profile identity.
- **Repository rename:** the project is now [BootsOfTango/HD2-Chaos-Slot-Machine](https://github.com/BootsOfTango/HD2-Chaos-Slot-Machine). Historical tags/downloads remain unchanged. The installed application and GitHub packages use the same release candidate, not a separate stream build.
- **Desktop controls:** fullscreen startup, F11/toggle button and Escape handling. Smaller windows keep a scrollable desktop layout, including background Space-drag and reachable dialogs.
- **Armory:** collapsible equipment/Warbond groups, search, filters, locally bundled images, separate Owned/Included controls and Warbond bulk controls. The reviewed catalog contains 214 items and 25 Warbond groups.
- **New equipment:** Castellan's Creed, Ironclad Democracy and separately acquired rewards/Superstore gear. New additions are opt-in; LAS-12 Sai is not granted by Ironclad's bulk action. Eagle Gas Airstrike remains separate from Orbital Gas Strike. Meltagun uses a cyan support-stratagem icon.
- **Planet selection:** shared random/manual eligibility across factions; the planet determines the enemy, and rerolls avoid repeats when another eligible planet exists.
- **Interactive galaxy map:** pan/zoom, planet search, eligible-only default, sector/faction shading, available supply links, planet visuals and accessible list fallback. Dragging can start on a planet without losing normal click selection.
- **Reported conditions:** environment/weather and reviewed community-reported activity badges, with explicit cached/unconfirmed states. Refresh checks are five-minute normally and one-minute while inspecting the visible map, subject to cooldown/backoff.
- **Mission selection:** 60 mission identities in the bundled, partial catalog and individually sourced game-image icons displayed yellow/gold. Suggested compatibility and optional player-confirmed shortlists use one selection path. Advanced/custom tools stay in Armory.
- **Themed run names:** equipment intensity and recorded context influence original codenames; names already in the current saved collection are avoided. Not replayable seeds or globally unique IDs.
- **Solo results:** one-question-at-a-time entry, cancel/back/edit, final review and Save & lock. Permanent numbers/outcomes/original note; later comments remain available. Compact cards show radar, planet and reference sector visuals.
- **Solo scoring and ranking:** Firepower, Precision, Survivability, Speed, Utility and Mission; utility counts side objectives, not samples. Comparable rule-version groups and successful-mission-first ranking. Gentler Solo v2 Firepower recalibration retains original ratings and requires confirmation.
- **Durable card rules:** Results offers Review card rules, exact update/removal counts, Later, and Back up & apply. Complete older Solo cards are rescored from recorded inputs; listed incomplete finalized cards leave active history only after confirmation and verified backup. Pending cards stay; malformed/unsupported data blocks. Original records and rating revisions survive format-2 exports. Desktop recovery sets are outside rolling autosave cleanup.
- **Save and security protections:** compatible import preparation, backups/recovery, protected-load behavior, restricted local resources/IPC, hardened renderer and Electron 44.4.5. Bundled component notices and artwork provenance. These do not establish security or artwork-clearance guarantees.

## Install and first use

Use the release's **Windows x64 Setup .exe** for the simplest experience. Close older running copies, keep the normal installation location, and then use Start or Setup's shortcut. No development tools required. GitHub's **Source code** ZIP is not the app.

The optional app ZIP needs no Setup: extract it completely and run **HD2 Chaos Slot Machine.exe** inside. Keep DLLs/resources/notices together. Installed and portable copies normally share Windows app-data saves; use one copy at a time.

Review your actual unlocks in **Armory**, spin and lock a loadout, confirm a planet, choose a mission and select **Play this**. Create the card, play the solo dive in Helldivers 2, then record real results. Check every answer before **Save & lock**. See [the player guide](../README-FIRST.txt) for controls, backups and troubleshooting.

## Know before you update

- Export JSON before updating/importing, close the app before Setup, and preserve the original backup until restoration is verified. Normal saves remain at **%APPDATA%\Helldivers 2 Chaos Slot Machine**; developer review profiles are separate.
- Finalized card numbers/outcomes/original notes cannot be edited. Comments can be added. Unfinished spins are not restart-persistent; created Result cards are.
- Older Solo v1 ratings stay unchanged until Review card rules is confirmed. Original ratings remain available; recalibrated ratings/ranks may increase. Review listed incomplete-card removals carefully. Open save folder contains verified card-upgrades recovery copies. Restoring a whole backup replaces newer dives/comments, so export first and review it; oversized native backups need assisted recovery. Do not edit format-2 saves in older apps. Compare/equipment analytics remain Legacy-only; Solo comparisons are in Rank.
- Community data is not second-by-second game synchronization. Check retrieval times and the in-game map. Missing activity reports do not mean no special enemies; approximate sectors are not exact game borders. Saved-card locators are reference geography, not a historical war replay.
- Mission choices are compatible suggestions, not the ship's exact operation list. Regional/event cases can require a player-confirmed shortlist. Gear/catalog changes require app updates; refresh only updates war data. Nothing updates while the app is closed.
- App updates are manual: export cards, download the newer Setup, close the app and install it. No automatic app updater is shipped. Internal updater metadata/blockmap files are not player downloads.
- The 1.1.1 download is **unsigned**, by the maintainer's choice. Windows may show Unknown publisher or a SmartScreen warning. Keep Windows protection enabled; if Windows blocks it or you are unsure, stop and report the message. A checksum detects changed bytes, not malware. Download only from this project's release page; do not disable protection to run it.
- If saving fails, keep the app open and retry or export the session. Do not delete an unreadable save or recovery files to force startup. If freezing/display trouble/blue screens occur, stop and report the build, time and steps rather than repeatedly reproducing a crash.

## Publication fields — final approved local build

- Tag: `hd2-chaos-slot-machine-v1.1.1`. The [release page](https://github.com/BootsOfTango/HD2-Chaos-Slot-Machine/releases/tag/hd2-chaos-slot-machine-v1.1.1) is the authority for publication time and current availability.
- Recommended Setup: `HD2-Chaos-Slot-Machine-Setup-v1.1.1-win-x64.exe`; SHA-256 `e171f7000f7de7d0b367a7f93d56b0ccd78395d62d972618dd5cd60eab4131c5`.
- Optional app ZIP: `HD2-Chaos-Slot-Machine-v1.1.1-win-x64.zip`; SHA-256 `5a82f53b679713bd592b6ab73c53eb7137345b226e563178443cb72cd1310db1`.
- Distribution: **unsigned**; app, Setup and embedded uninstaller signature status verified. Windows warnings remain possible.
- Tests and limitations: [v1.1.1 verification report](RELEASE_V1_1_1_REPORT.md). Hosted lifecycle builds are separate from these locally built, hash-identified downloads; broader manual scenarios are not implied.
- Artwork rights remain unconfirmed. Owner explicitly approved publishing v1.1.1 with the current images, accepting that risk; this is not rights-holder permission. See [distribution decisions](DISTRIBUTION_DECISIONS.md).
- Historical releases are retained. This version supersedes the abandoned public-1.0 reset plan, not historical evidence or previous downloads.

The original code retains its existing license. Game/crossover artwork, trademarks and community contributions retain their own rights. Credits are not permission. “Official Project Release” refers only to the maintainer's release, not endorsement by Arrowhead, Sony or any crossover owner.
