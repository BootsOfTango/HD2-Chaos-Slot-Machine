# M6 offline atlas identities — September 21, 2026

Branch `codex/galaxy-offline-identities`. Fixes the duplicate-looking first-launch
offline map found during main-app integration. Source changes only in this slice.

## Audited identity association

`assets/galaxy-identities.js` is a static, reviewed, display-only crosswalk between
the 232 retained default planet rows in `index.html` and the local atlas observed
at **2026-09-21T05:33:43.060Z**. Atlas source/provenance and checksum remain in
`assets/galaxy-atlas-provenance.json`; no new network scrape or artwork was used.

- 219 names and sectors agree after case and redundant ` Sector` comparison.
- Three legacy curly-apostrophe planet names correspond to explicit straight-
  apostrophe API names: Widow’s Harbor (ID3), Martyr’s Bay (ID14), Angel’s Venture
  (ID127). Seven L’estrade sector spellings similarly differ by apostrophe style.
- Exact unique names MERIDIA (ID64) and ALDERIDGE COVE (ID273) have stale legacy
  sectors Celeste/Guang versus observed API Umlaut/Omega. The static associations
  retain both labels; map display uses the atlas sector, not a save rewrite.
- Mars has no corresponding record in this retained atlas. No ID or position is
  invented; it stays list-only under Sol, with its existing eligibility unchanged.

Total: **231 reviewed mappings**, 1 unresolved default. The map now contains
**274 records: 273 positioned atlas planets plus Mars**, **56 sector groups** and
all **336 unique API waypoint links**. Links use associated metadata IDs but keep
the legacy selection keys of joined entries.

## Compatibility and fail-closed behavior

- This is deliberately **not a data migration**. Existing save/import/export
  payloads, original names, IDs, factions, run history and ownership preferences
  are not modified. A map click returns the same shared selector result as the
  existing text list. Mission/scoring context is unchanged.
- Only explicit crosswalk records can borrow atlas metadata. No runtime fuzzy
  name matching, inferred spelling corrections, proximity joins or network-
  provided alias instructions. Atlas identity is checked against its reviewed
  ID and canonical name; missing/renamed/ambiguous records stay unresolved.
- Present but incompatible legacy sectors stay unresolved. Missing sectors in
  old name-only caches may use the explicit reviewed identity association.
- Duplicate disabled/conflicting records retain the shared selector exclusion.
  Multiple alias keys or an existing ID campaign are **not silently merged**:
  doing so could suppress an opt-out or change the authoritative roll pool.
  Such unusual custom/imported combinations can remain separate list entries.
- Atlas identity, dated ownership and sector membership never grant live mission
  availability. Offline/cached labeling remains visible; historical runs are
  untouched by refresh. Unverified custom names remain list-only as necessary.

## Verification

- **734 units**, CSP, catalog and assets passed;
  `.test-data/galaxy-identities-units-final.log`. Eight new regression tests cover
  all 231 associations, counts/positions/edges, duplicate exclusion, invalid
  identities, old-cache and JSON-roundtrip compatibility, immutable selection and
  mission parity for every eligible bundled planet at difficulties1/5/10.
- **292 workflow +18 restart** checks passed;
  `.test-data/electron-smoke-1789970486100/report.json`. Includes offline default
  deduplication, positioned legacy marker selection through existing confirmation,
  unchanged legacy run identity, mission path, equipment/reroll preservation and
  existing saves/imports/Results checks. Marker click in this workflow test is a
  DOM-dispatched event, not a new physical mouse validation.
- Initial unit fixture incorrectly asked the fallback normalizer to construct
  enemy-free/all-disabled snapshots; it correctly rejected them. Tests now use
  the valid full bundled snapshot plus separate editable preference fixtures.
  Production fallback validation unchanged; initial log retained.
- **151 native window checks** passed with graceful exit;
  `.test-data/window-smoke-1789970551051`. Reviewed the fullscreen map screenshot:
  274 list records, 56 sectors, positioned Charbal-VII with highlighted real links
  and no repeated default planet row. Existing small-window/Escape/focus checks
  passed. DPI cases use page zoom, not physical Windows scaling.
- **44 desktop +44 browser renderer security** checks passed;
  `.test-data/renderer-security-1789970620175`. Intentional hostile frame requests
  were blocked by CSP. New crosswalk script has an explicit local resource route.

GUI evidence is isolated, software-rendered and sequential. No personal save,
installer, Desktop shortcut, package version, publication or duplicate build
change. Physical DPI/pinch, audible sound and long-duration stability remain
separate gates. Exact game sector polygons remain unavailable; these labels and
API supply lines do not claim exact territory boundaries.

Next: build and validate the integrated map candidate before promoting the existing
Desktop shortcut. Keep the accepted
`mission-clean` preview until that candidate passes; no extra Desktop copies.

Installed ASAR SHA256 was rechecked unchanged:
`F8E05A940DA3F200796E7DAC55B4166458B7E5C18549726C63E665D7EBCC37E0`.
Desktop still targets `scripts/start-mission-clean-review.cmd`; active dist remains
`installer-shell` plus `mission-clean`. No current build candidate to clean up.
