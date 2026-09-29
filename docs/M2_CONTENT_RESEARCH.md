# M2 content and artwork verification

Checked September 13, 2026. This document records research and bundled source assets, not a claim that every existing Warbond or all M2 UI work is complete.

## Confirmed additions

The official announcement identifies **Castellan's Creed Legendary Warbond**, released August 12, 2026, with these four rollable equipment additions: R/40-K Hot-Shot Marksman Rifle, P/40-K Bolt Pistol, G/40-K Meltamine, and the 40-K Meltagun stratagem. It lists armor and cosmetics separately and does not list a booster. Acquisition requires the base game, Super Credits and progression. Do not mark it owned automatically. [Official Xbox Wire announcement, Sony Interactive Entertainment author](https://news.xbox.com/en-us/2026/08/07/helldivers-2-x-warhammer-40000-warbond-xbox/)

| App canonical name | Category | Source / naming decision |
|---|---|---|
| R/40-K Hot-Shot Marksman Rifle | Primary, energy-based | Official name; current wiki identifies it as a primary energy-based marksman rifle. |
| P/40-K Bolt Pistol | Sidearm | Official name and sidearm description. |
| G/40-K Melta Mine | Throwable | Current in-game/wiki spelling; keep `G/40-K Meltamine` and `Meltamine` as aliases for the official announcement spelling. |
| 40-K Meltagun | Support stratagem | Strip descriptive trailing `Stratagem` from the announcement title, not the weapon identifier. |
| Eagle Gas Airstrike | Eagle stratagem, campaign reward | Separate from Orbital Gas Strike; do not mark owned automatically. |

[Current rifle entry](https://helldivers.wiki.gg/wiki/R/40-K_Hot-Shot_Marksman_Rifle), [pistol entry](https://helldivers.wiki.gg/wiki/P/40-K_Bolt_Pistol), [mine entry](https://helldivers.wiki.gg/wiki/G/40-K_Melta_Mine), [Meltagun entry](https://helldivers.wiki.gg/wiki/40-K_Meltagun).

Arrowhead confirms **Eagle Gas Airstrike** was awarded to participants in **Counterdissident Hammer**, August 25, 2026 12:00 UTC through September 7, 2026 08:00 UTC. It is not universal ownership. Stratagem rewards appear in mission loadout selection, not the ship-management menu. The article does not promise when or how this reward will return. Retain an independent `Orbital Gas Strike` catalog entry. [Arrowhead reward support, updated September 12](https://arrowhead.zendesk.com/hc/en-us/articles/29563053705500-I-didn-t-get-a-campaign-reward)

## Bundled files

| Local file | Provenance |
|---|---|
| `assets/new-gear/r-40-k-hot-shot.png` | Game render via wiki, Squ'ith / Tech_Support_Squid; 1200 × 675. |
| `assets/new-gear/p-40-k-bolt-pistol.png` | Game render via wiki, Squ'ith / Tech_Support_Squid; 1200 × 675. |
| `assets/new-gear/g-40-k-melta-mine.png` | Steam promotional-art cutout via wiki, Undeadender; 1200 × 1200. |
| `assets/new-gear/40-k-meltagun.png` | Game render via wiki, Squ'ith / Tech_Support_Squid; 1200 × 675. |
| `assets/new-gear/eagle-gas-airstrike.svg` | Dogo314's faithful hand-traced game-icon reproduction; **not an original extracted game file**. |
| `assets/new-gear/castellans-creed-cover.png` | Official promotional cover via wiki, Snuffle; 1200 × 600. |

All five PNGs were visually inspected. Source assets were downloaded unmodified; no AI stand-ins, local crops, or redraws were made. The PNG thumbnails are derivatives supplied by the source wiki. For SVG, source inspection found no script, event handler or external reference; actual in-app rendering belongs to integration testing.

The SVG's contributor restricts reuse to free, publicly accessible content and requests attribution. Full credit and use-condition text is bundled in `assets/new-gear/ATTRIBUTION.md` and `provenance.json`. Game artwork remains third-party copyright, separate from the app's Apache-2.0 code license; attribution is not a grant of unrestricted distribution rights.

## Method and limitations

- Direct wiki HTML requests returned a Cloudflare challenge. The site's public MediaWiki API remained accessible and supplied page image lists, source descriptions, exact CDN links, uploader information and image dimensions.
- The official Xbox article supplied independent name/release confirmation and its matching promotional artwork was available. The wiki files were preferred for clean item renders rather than taking screenshots of promotional scenes.
- A candidate `Eagle Gas Airstrike Stratagem Icon.png` exists, but its file description explicitly calls it temporary and leaves origin/source fields blank. It was not used. The documented SVG has stronger provenance, with its traced nature made explicit.
- No exact original extracted Eagle icon with documented provenance was found in this bounded search. Do not claim every newly bundled file is an official extracted game icon.
- Complete auditing of all pre-existing Warbond equipment associations is separate from this five-item verification. Avoid claiming that audit has passed solely on these additions.
