# Mission symbols

September28 display update: CSS applies a yellow tint to game-icon PNGs in the
mission hero, choices and Armory checklist. The stored images and source hashes
remain unchanged; displayed colors are no longer the unmodified source colors.

Root SVG files: original vector UI symbols created for HD2 Chaos Slot Machine, September 17, 2026.
The game-icons PNG subfolder is game-derived screenshot artwork; see the scope update below.
Not extracted or traced from Helldivers 2 artwork; not official game objective icons.
Yellow silhouettes identify broad mission types. Full mission names remain available
as visible text and accessible button names. Custom/unknown missions use a clipboard.
These assets are bundled locally and require no network connection.

September 18: added original fuel pump, broadcast tower, flag, bunker and
geological drill symbols for the basic-mission coverage batch, using the same
local vector style and origin conditions.

September 18 redesign (tactical-v2): all sixteen symbols redrawn as bold,
mostly solid silhouettes for readability at 32, 48 and 56 CSS pixels. Generic
mission objects suggest the task, not an official in-game icon. No game files,
wiki tracings, downloaded paths or third-party icon packs were used.
The owner approved this original-design direction in place of the earlier
original-game-assets-only request. Similarity or a percentage of changes is
not a copyright clearance test; this provenance note is not legal clearance.

September 18 refinement (tactical-line-v3): the owner requested thinner, fancier
artwork. All sixteen silhouettes are now open 2-unit rounded line drawings,
with restrained 1.25-unit secondary accents. Distinct mission subjects remain,
with panel seams, signal arcs and small technical details. No official artwork
was traced or imported. Files remain self-contained and offline.

September 19: added two original tactical-line-v3 symbols: a reticle for marked
target hunts and an egg cluster for Purge Hatcheries. They follow the existing
2-unit outline/1.25-unit accent system, not publisher or contributor artwork.
Transmission Network reuses the original broadcast-tower symbol. Total: 18.

September19 sabotage batch: three original thin-line symbols depict a nursery
demolition drill, airbase control tower/aircraft and upward-pointing cannon.
Supply Bases reuses the crate. Total:21 local symbols; no official paths,
downloaded icons or tracing. Same tactical-line-v3 sizes and stroke weights.

September19 Illuminate batch: original spire and crossed blossom symbols added
using the same thin-line visual system. Other entries reuse the appropriate
existing data, fuel, flag, ship, tunnel and defense symbols. Total:23 offline
symbols. These are original project UI graphics, not official game icons.

September20 Commando/city batch: an original outlined video-camera symbol adds
the evidence-recording type, following tactical-line-v3 stroke weights and
dimensions. Remaining new missions reuse existing data, crate, spire and
blossom symbols. Total:24 locally bundled symbols; no tracing or game artwork.
# Scope update — September 27, 2026

The historical original-design notes above apply to the 24 root SVG files only.
`game-icons/` now contains 60 exact in-game screenshot crops (September 28), with sources,
contributors, pixel rectangles and hashes in `game-icons/provenance.json`.
These new PNGs are not original project artwork. No tracing, AI generation,
recoloring or background removal was applied. Seven sources are paused browser
captures of gameplay video, so video/browser compression and scaling are present
in those sources. All crops preserve their retained decoded source pixels without
additional resampling. Source screenshots are retained outside the bundle for
pixel-verification. All 60 catalog missions are covered; custom/unknown missions
still use the original SVG fallback. JPEG/WebP sources are
decoded to lossless RGBA PNG intermediates, with both download and decoded hashes
retained. `scripts/decode-mission-sources.py --check` verifies decoded pixels.
Redistribution rights
for the game-derived crops remain unestablished; credits are not clearance.
