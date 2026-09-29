# Logo and rank artwork source checklist

This legacy checklist covers only the logo and rank-tier visuals below. Its target is official-source replacements; it is not a certification that all bundled catalog artwork is official or extracted from the game. Rank placeholders remain where source art has not been imported.

Catalog art has separate provenance in `item-images.json`, `new-gear/`, `catalog-additions/` and `warbonds/`. Community SVG tracings must be identified as such. Source attribution, visual similarity and local hashes are distinct from original-byte verification or redistribution rights. The 89 older stratagem records still need source/version reconciliation; no new hash alone closes that review.

| Asset | Official source URL | Usage note | Local implementation path |
|---|---|---|---|
| Helldivers 2 logo | https://www.playstation.com/en-us/games/helldivers-2/ | App chrome branding (global rank button + page background watermark). | `assets/branding/helldivers-2-logo.svg` (fallback: `assets/placeholders/branding/helldivers-2-logo-fallback.svg`) |
| Cadet tier visual | https://www.playstation.com/en-us/games/helldivers-2/ | Rank tier card artwork for Cadet (Levels 1-3). | `assets/placeholders/rank-tiers/cadet-placeholder.svg` (replace with official when available) |
| Veteran tier visual | https://www.playstation.com/en-us/games/helldivers-2/ | Rank tier card artwork for Veteran (Levels 4-6). | `assets/placeholders/rank-tiers/veteran-placeholder.svg` (replace with official when available) |
| Helldiver tier visual | https://www.playstation.com/en-us/games/helldivers-2/ | Rank tier card artwork for Helldiver (Levels 7-10). | `assets/placeholders/rank-tiers/helldiver-placeholder.svg` (replace with official when available) |

## Implementation constraints

- No hotlinking: all UI references must point to files under `assets/`.
- If an official tier image is not yet available locally, keep placeholder SVGs active until the official file is added.
- When replacing a placeholder with an official file, preserve the local path contract used by the UI or update the path in this checklist and `index.html` together.
