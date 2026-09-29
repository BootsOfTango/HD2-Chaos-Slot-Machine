# M6 main-app map integration — September 21, 2026

Branch: `codex/galaxy-app-integration`. Source integration only; no build,
installation, Desktop promotion, release, version change or personal-save test.

## Implemented

- Planet chooser and mission-screen Change planet now open the original SVG map
  in a native modal dialog. Existing list is available through Use list instead.
- Selection uses the existing manual planet candidate/confirmation flow, with
  current-run editability checked at opening and selection. Mission eligibility,
  equipment, reroll allowances and finalized-run rules remain shared.
- One app adapter joins the shared war service and separate atlas service. It
  starts atlas synchronization without waiting for the network or duplicating
  the shared campaign lifecycle. Missing atlas bundle retains campaign/list access.
- Native focus containment, opener focus restoration, Close map and Escape;
  Escape closes this dialog before leaving fullscreen. Background number-key
  tab navigation is suppressed while the modal is open. Map scroll is separate
  from the wide desktop canvas; sticky close/list controls fit small windows.
- Explicit local protocol resource entries and regenerated inline CSP hash;
  no wildcard allowlist, remote script permission or CSP relaxation.

## Evidence run in this slice

All GUI suites ran sequentially, software-rendered, using isolated profiles.

| Check | Result / evidence under `.test-data` |
| --- | --- |
| Final units, CSP, catalog, assets | 726 passed; `galaxy-integrated-units-final.log`; 247 pictures, 0 missing, 7 pre-existing placeholders |
| Main app workflow and restart | 289 workflow + 18 restart; `electron-smoke-1789969821011`; includes offline map selection, list fallback and mission Change planet |
| Native window/layout | 151 passed; `window-smoke-1789969894799`; graceful exit recorded; fullscreen, focus/inert background, Escape, 640x480 and page zoom |
| Renderer security | 44 desktop + 44 browser; `renderer-security-1789970053914`; intentional hostile iframe blocked by CSP |

Reviewed `galaxy-fullscreen.png` and `galaxy-small-2.png` in the window evidence.
Page zoom is **not** physical Windows display-scaling validation. Sound checks
do not establish audible quality. These are source app tests, not packaged EXE,
installer, real hardware GPU, accessibility-reader or long-running stability tests.
The earlier real API component sync (35 checks) remains prior evidence in
`M6_SECTORS_SUPPLY_SYNC.md`, not a new live-server run in this slice.

First unit run found an obsolete map-absent expectation and missing explicit
protocol routes. Corrected both; retained `galaxy-integrated-units-first.log`.

## Remaining issue found by visual review — before packaging

The first-launch offline dataset contains name-only legacy records. The model
deliberately does not infer an API ID from a similar display name. Consequently,
the integrated offline view currently contains **505 records / 104 sector labels**
against a **273-planet / 56-sector atlas**: many name-only fallback choices appear
beside corresponding atlas context entries, including sector suffix variants.
Those legacy choices remain selectable through the map's list/detail panel but
cannot be selected from a positioned atlas marker without a verified identity
mapping. This is not 505 distinct verified game planets and is not ready for
preview promotion. Passing interaction tests do not negate this visual/data issue.

**Next bounded task:** audit a stable-ID crosswalk for bundled planets against
the retained atlas/provenance; preserve name aliases and saved selections. Test
unique matches, ambiguous/missing/renamed entries, disabled preferences, legacy
cache/imports, zero mutation of historical runs and offline marker→mission parity.
Do not use fuzzy matching or treat atlas membership/owner as current playability.
Then repeat source map tests, build/test a local candidate and promote only after
the offline identity problem is resolved. Retain list fallback for unresolved rows.

Exact game sector polygons remain unavailable in the reviewed API; labels and
waypoint lines are API-sourced, not a claim of exact territory borders. Physical
pinch/DPI and exact named-planet visual acceptance remain open.

## Unchanged local installation

- Desktop shortcut still points to `scripts/start-mission-clean-review.cmd`.
- Active `dist` remains `installer-shell` and accepted `mission-clean` only.
- Installed `resources/app.asar` SHA256 remains
  `F8E05A940DA3F200796E7DAC55B4166458B7E5C18549726C63E665D7EBCC37E0`.
- No duplicate Desktop files or obsolete build candidates created or removed.
