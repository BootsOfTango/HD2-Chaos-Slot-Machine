# Third-party rights and attribution

This record separates the project's own contributions from third-party material. It is not a redistribution license, permission letter or legal opinion. Public release clearance is **incomplete** as of September 16, 2026.

## Game and community artwork

September28 presentation update: mission screenshot crops are displayed with a
yellow CSS tint; stored source pixels remain unchanged. Meltagun now uses the cyan
support-stratagem icon traced by Torakhan, Helldivers Wiki.gg, rather than the
weapon render. File-page attribution and transformation details are recorded in
`assets/new-gear/ATTRIBUTION.md` and `provenance.json`. This community tracing is
not claimed to be extracted game artwork or cleared for public redistribution.

Mission image batches (September 27–28, 2026): 60 in-game icon crops, including 48
from public mission screenshots hosted by the Helldivers Wiki. Wiki contributors:
Betta7776, Qt23, Warmowed, SoundwaveAeron, Joe Rippa, AkuBC, Takapy, TauCetiV,
and TBot. Five additional screenshots: PC Gamer/Sean Martin (syndicated by inkl),
GameLeap/Ivan Valev, Steam guide author ♿ (Easy XP farm! [UPDATED]), and N4G
Unlocked (articles by Vukan Truc and Ksenija Grgurovic). The PC Gamer and GameLeap
publisher articles credit Arrowhead Game Studios for their game screenshots.
Seven further crops are from paused public gameplay videos by Sarge, DemoStorm,
Maplewood, Sjór Deansson, Skybass - Patrick, Zaper and Millsonius. Retained browser
captures include video/browser compression and scaling; they are not original
encoded game frames. No AI redraw, recoloring or retouching was applied.
JPEG/WebP originals are retained alongside losslessly decoded PNG intermediates;
decoding is not retouching. Per-file source links,
crop rectangles and hashes are in `assets/missions/game-icons/provenance.json`.
These are game-derived pixels, not project-created symbols or wiki SVG tracings.
Underlying game artwork remains the property of its respective rights holders.
Public redistribution permission has not been established. All 60 catalog
entries now have source-identified in-game crops. Custom/unknown missions retain
the original fallback. This coverage is not a claim of publisher approval.

HD2 Chaos Slot Machine is an independent, unofficial companion. Game artwork, names, logos, and trademarks remain subject to the rights of their respective owners. Arrowhead Game Studios and Sony Interactive Entertainment are not the only possible rights holders: crossover content and community-authored renders/traces must be checked individually. Do not imply ownership of HELLDIVERS branding or endorsement by its owners.

Source and creator records are maintained in:

- `assets/new-gear/` attribution/provenance files.
- `assets/catalog-additions/ATTRIBUTION.md` and `provenance.json`.
- `assets/catalog-additions/ironclad/ATTRIBUTION.md` and `provenance.json` (game imagery, screenshot publishers and retained original alternatives).
- `assets/warbonds/ATTRIBUTION.md` and `provenance.json`.
- `assets/warbonds/official/ATTRIBUTION.md` and `provenance.json`.
- `assets/ARTWORK_AUDIT.md`, individual asset metadata and the dated catalog completeness audit.

An official announcement verifies facts; an officially hosted image is not automatically licensed for redistribution inside another app. A community uploader's credit or wiki text license does not necessarily license the underlying game artwork. Delivered-file hashes prove consistency with recorded bytes, not permission. Noncommercial use and attribution alone do not resolve rights questions. No blanket fair-use claim is made.

There are 89 unresolved legacy stratagem provenance/version findings. Resolving those findings does not by itself clear all other images: permission or another supportable use basis must also be documented for each asset group. Unresolved assets need permission, removal, or genuinely original alternatives before a cleared public build can be claimed. Redrawing protected artwork or generating imitations is not an automatic solution.

## Bundled software

The reviewed planet-activity ID/label subset references the MIT-licensed
`helldivers-2/json` catalog at commit `c7425990a1ef5891005b0ecb387fbea5def471b7`.
Its attribution and full license are bundled in `assets/planet-activity-LICENSE.txt`.
The application's activity icons are original code-drawn symbols. This catalog
notice does not grant rights to game artwork or imply verified in-game encounters.

Electron and its included Chromium, Node.js and other components have their own licenses. Keep Electron's `LICENSE.electron.txt` and `LICENSES.chromium.html` (and any other required component notices) with the complete runtime. Do not rename the application EXE and distribute it without its companion files.

Build dependencies are listed in `package-lock.json`; runtime packaging and third-party notice coverage still require a final inventory check for the exact release. The root Apache license is not a replacement for component-specific notices.

The September 16 local candidate inventory is recorded in `docs/distribution-inventory.json` and explained in `docs/DISTRIBUTION_LICENSE_REVIEW.md` in the source repository. It distinguishes shipped runtime files, application assets, upstream notice entries and build-only dependencies. It is a review record, not a complete SPDX bill of materials or a declaration of license compliance. Regenerate it against the final release; counts and hashes describe only the named candidate.

### Windows installer components

The compiled installer templates originate from electron-builder / app-builder-lib 26.15.3 (MIT; Copyright (c) 2015 Loopline Systems). Their unmodified MIT notice and a description of the project's ten-call template adaptation are supplied in `licenses/builder/`. The original NSIS wizard bitmap is also matched against the reviewed NSIS toolset and covered by its accompanying COPYING; it is not project-created game artwork.

The current installer configuration uses NSIS components and six plugins: System, UAC, StdUtils, nsDialogs, nsExec and nsis7z. These are distributed software even though they are absent from the application's npm runtime dependency list. Electron's notices do not substitute for their notices. Earlier Combined Preview builds also used WinShell; their historical inventories must not be treated as inventories of this build.

StdUtils is attributed to LoRd_MuldeR and identifies LGPL 2.1-or-later with an installer-interface clarification. Its shipped DLL matches the author's 1.14 release. Nsis7z is attributed to Nik Medved, with updates by Marek Mizanin and Stuart Welch, and uses code by Igor Pavlov; its DLL matches the 19.00 release. Full unmodified notices and matching source packages, including LZMA SDK 19.00, are prepared under `licenses/installer/` for inclusion in future builds. That folder explains differing upstream license statements without rewriting them. This overview is not a source offer or a substitute for those materials. See [StdUtils documentation](https://nsis.sourceforge.io/StdUtils_plug-in) and [Nsis7z documentation](https://nsis.sourceforge.io/Nsis7z_plug-in).

The same folder retains the toolset's full NSIS COPYING and UAC's matching zlib notice/source archive. Current builds replace WinShell with original project helper source under `licenses/hd2-shell/`, licensed under the accompanying project Apache-2.0 license. This helper uses NSIS System and documented Windows interfaces; it does not copy WinShell code. Both installer and embedded uninstaller must be checked for absence of WinShell in each release. This removes that dependency, not the need for broader rights and release review; no upstream component is relicensed by the application's license.

## Rights concerns

Contact the maintainer through the canonical repository/profile to arrange a suitable contact channel. Do not post private identity documents, signatures, correspondence or other confidential evidence in a public issue. A concern should identify the specific asset, claimed rights and requested action. The maintainer should preserve evidence, assess the claim and seek qualified advice where necessary; this document promises neither automatic rejection nor automatic removal.

## References used in this review

- [Apache License 2.0](https://www.apache.org/licenses/LICENSE-2.0)
- [U.S. Copyright Office: copyright basics](https://www.copyright.gov/help/faq/faq-general.html)
- [U.S. Copyright Office: permissions and fair use](https://www.copyright.gov/help/faq/faq-fairuse.html)
- [U.S. Copyright Office: AI and human authorship](https://www.copyright.gov/newsnet/2025/1060.html)
- [PlayStation website terms](https://www.playstation.com/en-us/legal/website-terms-of-use/)

These references inform review; they are not a grant of permission for this application. Rules vary by jurisdiction.
