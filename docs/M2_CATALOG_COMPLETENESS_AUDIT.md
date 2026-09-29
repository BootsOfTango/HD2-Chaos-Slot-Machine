# M2 catalog and artwork completeness review — September 15, 2026

## Outcome

M2 is **not complete**. Acquisition review covered the 205 existing records; it did not establish that every current item or Warbond was represented. This read-only audit finds one missing released weapon and one missing Warbond record. No runtime content, ownership, save, installer or installed application was changed in this session.

Branch: `codex/m2-catalog-completeness`. Version remains internally 1.1.14. No release publication.

## Findings and next fixes

| Finding | Evidence and required treatment |
|---|---|
| R-4 Hyena missing | [Arrowhead campaign-reward FAQ](https://arrowhead.zendesk.com/hc/en-us/articles/29563053705500-I-didn-t-get-a-campaign-reward) confirms the Celestial Fence reward and participation window. Add as a campaign-reward primary, initially unowned/excluded; preserve saved choices. Verify and bundle artwork before changing runtime data. |
| Righteous Revenants lacks a registered Warbond card/cover | Its StA-11, StA-52 and PLAS-39 weapons already exist with reviewed acquisition sources. Add the missing group and cover without duplicating weapons or granting ownership. [Official announcement](https://news.xbox.com/en-us/2025/12/17/helldivers-2-killzone/). W.A.S.P. remains separate requisition equipment. |
| Seven announced Ironclad Democracy additions | AR-11 Arbitrator, GL-15 Evictor, P-34 Breacher, G-60 Anti-Tank Seeker, G-8 Immolation, Integrated Extinguishers and Surplus EAT Allocation. [Official announcement](https://blog.playstation.com/2026/09/15/helldivers-2-ironclad-democracy-warbond-launches-sept-22/) gives September 22, 2026 as release date. Keep out of runtime rolls; re-review after release. Merely advancing the date must not add or enable gear. |
| M-104 Incinerator FRV is not a missing current unlock | [Community procurement page](https://helldivers.wiki.gg/wiki/Incinerator_FRV) says it was not made available after the campaign choice. Do not add it to rolls on category membership alone. This is community-tier evidence, not authoritative telemetry. |
| Full Hot Dog designation | The dated community title is AX/FLAM-75 Hot Dog. It maps to the existing stable ID `stratagem:hot-dog`; review aliases in the next catalog edit, never create a duplicate. |

Correction to earlier backpack/vehicle coverage language: eight vehicle pages include the unavailable Incinerator. Seven currently eligible vehicles and thirteen backpack entries are represented in these category lists; overlapping support categories must not be summed as independent gear. Prior reports remain historical evidence, not current completeness certification.

## Inventory method and limits

The checked-in fixture `test/fixtures/catalog-inventory-2026-09-15.json` records twelve dated community category responses. Only namespace-zero titles are retained; pagination was absent. Commands, disambiguation pages, April Fools content, unavailable equipment and announced gear are explicitly separated. Empty guessed categories were not accepted as evidence.

With reviewed full-designation mappings, all 205 catalog items resolve in the consulted inventory. The additional Hyena makes 206 current eligible entries in this comparison, not a claim that an unofficial category API proves the entire live game catalog. Twenty-four released Warbond titles compare against twenty-three registered groups. Existing group membership matches item acquisition IDs.

`node scripts/audit_catalog_completeness.js` emits JSON without network access or mutations. Add `--strict` for a nonzero exit while findings remain. Its present 91 findings are the two content gaps and 89 missing stored artwork hashes. The seven audit unit tests passing means the detector works, **not** that the completeness gate passed. The fixture is dated evidence and must be explicitly reviewed before updating.

## Artwork review

- All 205 item images and 23 registered Warbond covers rendered into nine diagnostic contact sheets; all nine were visually inspected. No obvious item/slot swap was observed. Speargun was additionally rendered individually at 256 and 112 pixels after a contact-sheet ambiguity; it is not a missing image.
- 116 item-image SHA-256 records match their local files. The other 89 stratagem records lack stored artwork hashes. Missing provenance is not the same as a missing image; do not certify provenance merely by calculating a new local hash.
- Of 108 SVG item images, 107 embed a Dogo314 tracing credit; Eagle Gas has separate community-source attribution. These are community recreations, not certified original game-extracted icons. Exact in-game fidelity, particularly the user's booster requirement, is still open.
- A dated MediaWiki imageinfo comparison found 19 byte-identical SVGs and 89 different from the currently hosted source SHA-1. CRLF normalization did not explain those differences. Differences may reflect local edits or source revisions; they do not independently prove corruption. Reconcile versions/transforms and attribution before replacing or certifying those files.
- The SVG heuristic found no script, foreignObject, event-handler or external-link indicators. This is a limited inspection, not a complete SVG security proof.
- Warbond images include promotional artwork rather than a guaranteed set of exact in-game covers. Righteous Revenants currently falls back to a generic card. The seven static placeholder references reported by the existing validator concern rank/fallback art, not seven missing weapons.
- The legacy `assets/ASSET_SOURCE_CHECKLIST.md` title says official-only but covers logo/rank placeholders; it must not be read as provenance certification for all catalog art. Correct its scope in the next artwork update. Attribution is not redistribution clearance, and the code license does not confer rights to game imagery.

Ignored diagnostic evidence lives under `.test-data/completeness-research`: dated category/page responses, SVG source metadata, contact sheets and standalone Speargun renders. No asset was replaced during this review.

## Next bounded implementation

1. Add Hyena and the Righteous Revenants group/cover with verified local artwork and explicit acquisition/ownership behavior.
2. Add save-upgrade/import/ownership regression checks; preserve all prior equipment IDs and user choices.
3. Reconcile the 89 legacy SVGs with their source versions and record provenance truthfully; address exact-artwork requirements separately from file existence.
4. Run desktop/package checks under the graphics-safety policy before creating a single replacement local candidate. Do not duplicate Desktop installers or overwrite the accepted installation automatically.

M3 live-war service and unrestricted planet selection follow M2; no live-war behavior changed in this audit.

## Verification performed in this session

- Baseline: 272 unit tests, catalog validator and asset validator passed.
- Final: **279 unit tests**, catalog validator and asset validator passed. Asset validator: 245 local references, zero missing files, seven existing placeholder references. Log: `.test-data/completeness-final-tests.log`.
- Existing Support Weapon candidate: all **377 packaged source comparisons** passed; ZIP/runtime ASAR, guide and icons still match. ASAR SHA-256 remains `998de220575a03271263caeb535a3aa8f6fc8eca9b0342d47ab6fe85230e07a1`. This is file parity, not a new GUI run.
- `git diff --check` passed; existing line-ending warnings are informational. The offline audit intentionally remains `ready: false` with 91 findings and seven deferred entries.
- No new GUI run, native installation, audible test, exact in-game-art comparison or public release was performed. Prior packaged GUI evidence belongs to the Support Weapon session and is not presented as a new test.
