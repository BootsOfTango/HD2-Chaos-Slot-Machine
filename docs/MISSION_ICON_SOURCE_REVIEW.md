# Mission icon source review — September 18, 2026

## Superseding owner decision — original redesign

Later September 18 the owner requested recognizable but original mission symbols.
The tactical-v2 set replaces all sixteen project SVGs with independently constructed,
bold generic pictograms; no official asset or contributor tracing is imported.
This supersedes the original-game-assets-only direction below, which is retained
as historical research. Permission inquiries remain unsent, not an active blocker
for this original-design task. Existing third-party artwork release gates remain.
Small changes or visual similarity are not a copyright clearance rule:
[Copyright Office guidance](https://www.copyright.gov/help/faq/faq-fairuse.html).

Owner accepted planet visuals and pointed out that the mission symbols are not the
official in-game images. The current 16 SVGs are original generic project symbols,
as documented in `assets/missions/ORIGIN.md`. They have not been replaced in this review.

Branch: `codex/mission-icon-source-review`; prior changes preserved.

## Confirmed owner decision — original assets only

The owner clarified: original game assets are wanted only if their use does not violate
copyright. Permission-cleared community tracings are not the selected replacement path.
The contributor draft below is retained for history, **not queued for sending**.

Reviewed official sources on September 18, 2026:

- The [EULA linked by the game's Steam listing](https://store.steampowered.com/eula/553850_eula_0),
  section 1.4, grants limited personal use and reserves other rights. It does not establish
  a grant to bundle original icon files in this independent companion.
- [PlayStation website terms](https://www.playstation.com/en-us/legal/website-terms-of-use/),
  section 3, distinguish personal website-content use from redistribution. A downloadable
  image on that website is not by itself a fan-app redistribution license.
- [Arrowhead's official contact page](https://www.arrowheadgamestudios.com/contact/)
  lists `contact@arrowheadgs.com` for business/general inquiries, and asks that individual
  employees not be contacted directly. It is a routing contact, not a verified licensing grantor.
- [U.S. Copyright Office guidance](https://www.copyright.gov/help/faq/faq-fairuse.html)
  explains that fair use depends on circumstances; no zero-risk legal assurance is made here.

No applicable public permission covering original mission-icon redistribution was established
in this bounded search. This is not proof that such permission cannot be obtained. The next
step is the updated **unsent** Arrowhead/Sony inquiry asking for an authorized original asset
source and a written permission or applicable license covering the installer, ZIP and GitHub
repository. No game extraction, asset replacement, external message or new build performed.
Until that basis is documented, retain the currently working original project placeholders.

## Verified source findings

The normal browser could open these public pages; text-fetch requests returned 403.
No login, CAPTCHA interaction, permission request, download/import into the project,
game-file extraction or security-setting change was performed.

- [Launch ICBM mission page](https://helldivers.wiki.gg/wiki/Launch_ICBM) links to
  [Launch ICBM Mission Icon.svg](https://helldivers.wiki.gg/wiki/File:Launch_ICBM_Mission_Icon.svg).
  Its current file history identifies a January 23, 2026 upload by **Dogo314**; the
  description identifies it as a hand tracing of a game asset, not a publisher-issued
  original SVG. The file metadata also credits that contributor.
- [Evacuate Colonists](https://helldivers.wiki.gg/wiki/Evacuate_Colonists) uses
  [Emergency Evacuation Mission Icon.svg](https://helldivers.wiki.gg/wiki/File:Emergency_Evacuation_Mission_Icon.svg).
  The current file record likewise identifies a Dogo314 hand tracing of a game asset.
  Sharing a design here is supported by the page, not proof that every evacuation
  mission should be mapped to it.
- Both file records include an instruction to obtain the contributor's permission
  for reuse beyond the wiki, alongside wording limiting use to free, public content.
  These overlapping conditions are not a clear blanket grant for bundled desktop-app
  redistribution. Both also identify underlying Arrowhead/licensor copyright and link
  the game EULA. The page-wide wiki license does not settle this asset-specific question.
- The [2024 community mission pack](https://www.reddit.com/r/Helldivers/comments/1c0da3u/)
  explicitly describes recreations and includes joke icons. It is not a verified
  original game-asset set and was not downloaded or substituted.

This is a bounded source check of the reported ICBM/evacuation examples, not clearance
or a complete audit of every mission icon. Retrieve Data and the other catalog entries
still need their own exact file/version mapping. No claim that reusable originals do
not exist elsewhere, and no general legal conclusion about every possible use.

## Decision / next action

Do not silently substitute community redraws and call them official game files.
Preserve the functioning planet-art build and simple mission-card layout while sourcing
is resolved. A matching, permission-cleared community tracing may achieve the owner's
visual aim, but its provenance must remain accurately labeled. If the owner requires
raw original assets, find a documented original source instead; do not extract the
installed game or launch/mod it without a separately agreed workflow.

A contributor request is drafted below, **not sent**. Before any external communication,
the owner must approve the recipient/channel and exact wording, including promises about
free distribution, source availability, advertising and donations. Contributor permission
does not establish permission for all underlying game IP; the existing Arrowhead inquiry
in `ARTWORK_PERMISSION_REQUEST_DRAFT.md` now explicitly includes mission icons.

## Contributor request — DRAFT, NOT SENT

Superseded as the preferred route by the owner's original-game-assets-only decision above.

Intended contributor: [Dogo314](https://helldivers.wiki.gg/wiki/User:Dogo314).
Contact channel not selected or verified. No account sign-in or public post authorized.

Subject: Permission to include your HD2 mission icon tracings in a free fan companion

Hello Dogo314,

I'm Boots Of Tango, the developer of HD2 Chaos Slot Machine, an unofficial Windows fan
companion for randomized Helldivers 2 loadouts and mission suggestions. The repository is
https://github.com/BootsOfTango/Helldivers-2-Roulette.

I would like to use your mission icon tracings so players can recognize the same designs
they see in the game. I found your Launch ICBM and Emergency Evacuation SVG file records
on the Helldivers Wiki and saw the permission conditions. May I include approved icons
locally inside the app, its Windows installer and portable ZIP, and its public GitHub
source repository? The planned public download would be free.

I would credit you and the Helldivers Wiki, retain the applicable notices, distinguish
your tracings from the app's original artwork, and not claim Arrowhead endorsement or
relicense your files under the app's code license. Please let me know which exact icons
and versions you can authorize, the required attribution, whether resizing or color
changes are allowed, and any conditions concerning source redistribution, advertising,
donations or future monetization. We can keep the original colors if required.

Could you also clarify how the wiki-only permission wording and the free/public-use
wording on the file pages apply to this proposed desktop distribution? I understand your
permission would cover only rights you can grant, not all underlying game IP. No response
will be treated as permission. I can supply the precise proposed icon list for review.

Thank you,
Boots Of Tango

## Current application / tests

No runtime code, icons, mission catalog, saves, shortcuts, installers or download folder
changed. No new build, GUI regression test, commit, push or release was needed for this
documentation-only review. Desktop remains on the previously tested `planet-art` build;
its verification is recorded in `PLANET_ARTWORK_REVIEW.md`, not rerun or newly claimed here.
