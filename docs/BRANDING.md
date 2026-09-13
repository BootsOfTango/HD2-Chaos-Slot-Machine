# HD2CSM artwork

The product is **Helldivers 2 Chaos Slot Machine**; its visual mark is **HD2CSM** in yellow with a black outline.

The original slot-machine emblem is stored at `assets/branding/hd2csm-emblem.png`. It was generated with the built-in image-generation tool on September 13, 2026, inspected for the exact six-character lettering and transparent margins, and copied into this project. The source image is 1254 × 1254 pixels and contains transparent pixels. Existing artwork remains in the repository.

`npm run prepare:icons` copies the complete emblem to `build/icon.png` and produces a Windows ICO with 16, 32, 48, and 256 pixel representations. The icon is used by the installed executable, installer, taskbar, and shortcuts. At the smallest sizes the cabinet silhouette carries recognition; the full lettering is clearest at 32 pixels and above. The app header pairs the emblem with a large yellow/black HD2CSM wordmark and exposes the full product name to accessibility tools.

## Generation prompt

> Use case: logo-brand. Create one original polished Windows application icon and matching emblem for Helldivers 2 Chaos Slot Machine. Square composition, transparent outer background with genuine alpha. A bold compact front-facing dark gunmetal slot-machine cabinet with three broad mechanical reel windows, subtle beveled metal edges, yellow trim, and a short lever. The exact text "HD2CSM" is the primary focus, large bright yellow heavy condensed block capitals with a thick crisp black outline, centered prominently across the reel windows as one continuous readable line (H D 2 C S M, exactly six characters). Strong simple silhouette, generous text size, minimal texture, high contrast, readable as a small Windows icon. Cabinet occupies most of square with small even transparent margins, all edges and lever fully inside canvas. No other text, no casino money/chips, no extra logos, no watermark, no mockup scene. Colors yellow, black, charcoal metal only. Stylish industrial sci-fi fan-app emblem, clean professional raster artwork.
