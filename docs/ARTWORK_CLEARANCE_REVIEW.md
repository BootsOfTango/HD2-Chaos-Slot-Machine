# Artwork clearance preparation — September 24, 2026

## Outcome

The current Ironclad preview now has a reproducible, sanitized **file-level artwork review index**. This is preparation for permission/independent-origin review, **not legal clearance**. The working Desktop app, images, saved data and installed copy are unchanged. No new build, publication, external message or paid service was needed.

Branch: `codex/artwork-clearance-inventory`. The primary engineering deliverables are `scripts/audit-artwork-clearance.js`, its regression tests and `docs/artwork-clearance-inventory.json`. The September16 `distribution-inventory.json` remains historical and was not rewritten to describe newer bytes.

## Scope and evidence

One row per media file actually shipped in `dist/ironclad-gear/win-unpacked/resources/app.asar`, not merely files present in the source checkout. ASAR SHA256: `b8eff8d74a16c62ee5cf685dcd76951004f6cbc00d075fff0b25b895b6cf5176`.

| Check | Result | Meaning |
| --- | ---: | --- |
| Shipped media files | 380 | Includes retained variants and branding, not just current catalog choices |
| Unique content hashes | 374 | Six duplicate pairs remain recorded; no deletion authorized by this audit |
| Direct catalog equipment/cover references | 239 | 214 equipment and25 covers |
| Not directly catalog-referenced | 141 | Not automatically unused: UI, fallback, history and branding need reachability review |
| Files with recorded HTTPS source URLs | 230 | Source attribution is not a permission grant |
| Files with matching pre-existing recorded hashes | 150 | No conflicts detected; all380 additionally have observed package hashes |
| Files without prior per-file hash records | 230 | Wider shipped-file scope, not the same count as the89 active stratagem findings |
| Media with bundled independent-origin notes | 49 | Nine Ironclad visuals,24 mission symbols,13 biome globes,three current brand/icon files; still origin/branding review, no exclusive-rights assertion |
| Catalog-associated crossover media | 14 | Scoped Warhammer40,000, Killzone and Halo associations; not exhaustive ownership determination |
| Active stratagem source/version findings | 89 | Unchanged; computing local hashes alone does not resolve upstream identity/version |

The index separates source URLs, observed hashes, prior hash claims, creator/source metadata, catalog relationships, crossover context and permission evidence. Every permission field remains **not-established**, including original-origin rows; the tool never converts a URL, credit, local generation claim or hash into legal approval. This conservative field means this tool establishes no legal permissions, not that original project code necessarily requires a third party's permission.

Shareable fields use repository-relative file names. Source URL credentials are rejected and query/fragment data is removed. No save contents, private correspondence, machine paths, executable attachments or screenshots are included. Manually review any future regenerated packet before external sharing. No packet has been sent.

## Audit-tool fixes

1. Ironclad's original vectors had been covered by a broad catalog-additions → Hyena/Killzone classification. They now have a separate original-symbol review group.
2. Historical distribution inspection assumed seven installer DLLs, including removed WinShell. An explicit current-project-shell profile now accepts only the reviewed six-DLL set and verifies exact component hashes/materials. The old profile stays the default for historical reproducibility. No installer runs; current outer inspection is not embedded-uninstaller or native install acceptance.
3. Review dates can be supplied explicitly and validated. The historical default date and historical output remain unchanged.

## Permission position / sources checked

Arrowhead's [official contact page](https://www.arrowheadgamestudios.com/contact/) still lists `contact@arrowheadgs.com` for business/general inquiries and asks people not to contact individual employees. This is a routing address, not confirmed licensing authority.

The [PlayStation website terms](https://www.playstation.com/en-us/legal/website-terms-of-use/), section3, restrict redistribution of site content and do not provide the app with a blanket distribution grant. The [U.S. Copyright Office FAQ](https://www.copyright.gov/help/faq/faq-fairuse.html) does not offer a fixed percentage-change rule that makes copied material safe. These sources were checked for this review; no fresh publisher permission was discovered or inferred. Application to a particular asset/jurisdiction can require professional advice.

Original mission/planet/Ironclad symbols should not be described as official game art. Game names/trademarks and AI-assisted ownership claims remain distinct from the source-code license. No modification of the existing Apache license is proposed here.

## Next actions, in order

1. Owner reviews the existing permission-request draft and the sanitized index. Confirm free distribution, advertising/donation plans, recipient and message before sending. No response is permission.
2. Ask Arrowhead to route publisher/game-art requests and identify whether Sony/crossover rights holders require separate requests. Community creator permissions are a separate layer, not a substitute for underlying game rights.
3. Independently reconcile the89 legacy files against original source/version/creator records, retaining the current bytes until a verified replacement is approved. Permission and visual fidelity remain separate checks.
4. Perform a source-reference/fallback audit of the141 non-catalog files, including six duplicate pairs. Only then propose excluding genuinely unnecessary legacy copies from future packages; retain recovery assets outside the shipped runtime when safe. Do not delete by count alone.
5. If permission is unavailable, agree on specific assets to replace with independent, non-imitative artwork. No automatic mass artwork swap or claim that close imitation avoids copyright.
6. Keep public release blocked until permission/use-basis evidence, final notices/security checks and remaining Windows acceptance are complete. Clean Windows install/uninstall remains deferred; this audit does not test it.

## Reproduction

From the active checkout:

```powershell
node scripts/audit-artwork-clearance.js --check --candidate=dist/ironclad-gear --reviewed-at=2026-09-24
node --test test/artwork-clearance.test.js test/distribution-inventory.test.js
npm run verify:distribution-inventory
npm test
npm run verify:public-release
```

`--write` regenerates the new artwork index only. `--check` compares exact current bytes/metadata and fails if stale. The public-release command is expected to remain blocked. This is code-driven repository verification, not an analysis of private player data.

## Executed checks

- **833 unit tests +CSP/catalog/assets passed**, including10 new artwork-index tests (`.test-data/artwork-clearance-tests.log`). Tests cover exact file identity, duplicates/orphans, recorded-hash conflicts, absent origin notes, crossover associations, credential/query removal and non-approval defaults. An initial privacy assertion incorrectly matched the ordinary word “private” in the explanatory limitations; it was narrowed to the actual injected query value and passed.
- Current `--check` matches the generated index (`.test-data/artwork-clearance-current-check.log`). The historical distribution inventory also still matches its original archived candidate (`.test-data/artwork-clearance-historical-check.log`). No historical JSON was overwritten.
- `verify:public-release` exits1 as expected (`.test-data/artwork-clearance-release-gate.log`). Artwork, other outstanding review categories and local-preview channel still block publication.
- Desktop ASAR, owner-review save and installed baseline hashes remain identical to the Ironclad handoff. Existing shortcut still targets `start-ironclad-gear-review.cmd`. No new runtime/installer, Desktop copy, GUI launch, install/uninstall, scan, permission email, commit or publication in this review.
