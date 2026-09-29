# HD2 Chaos Slot Machine 1.0 — release-candidate acceptance

September29,2026. **Not a public-release certificate or announcement.** Latest unified1.0 packages use the prepared release presentation; no official tag/release has been created. [Unified release evidence](UNIFIED_RELEASE_1_0.md) supersedes the older preview artifact hashes below. This report preserves earlier evidence without overwriting the historical v1.1.0 report.

## Evidence at this checkpoint

| Area | Observed result | Detail |
| --- | --- | --- |
| Application/source tests |922 local tests pass; CSP/catalog/assets pass |`.test-data/hosted-lifecycle-2026-09-29/accessibility-local-tests.log` |
| Hosted source CI |dce5c9d head:922 total,921 pass,1 expected private-source skip,0 failures; audit0 |Run36637328715; Linux36637328713 also passes |
| Actual personal-PC upgrade |Passed after397-file verified backup;99 installed runtime files match,295 profile files unchanged |[Upgrade report](INSTALLER_1_0_UPGRADE.md) |
| Installed-EXE workflow |333 workflow,16 restart,9 fullscreen startup,33 controlled network,5 cache-restart checks pass |Synthetic profiles only; upgrade report |
| Installed card-rule checks |25 checks+6 restart checks, verified recovery copy |Synthetic profiles only; no recalibration of personal cards |
| Candidate transfer/security/gear |Transfer31+7+3; renderer security44; gear155+13 passed |[Candidate report](RELEASE_CANDIDATE_1_0.md) |
| Owner basic use |Owner reported the basic route works |[Owner acceptance](OWNER_RUN_ACCEPTANCE.md); not certification of all manual scenarios |
| Separate fresh lifecycle |273 checks passed on disposable Windows Server2022: install, normal launch/close, actual uninstall, reinstall, graceful launch/close, exact synthetic-save preservation |[Hosted lifecycle](HOSTED_INSTALLER_LIFECYCLE.md), run36637328640; not all manual consumer-Windows cases |
| Unsigned distribution |Owner chose unsigned; current candidate ZIP app,Setup and embedded uninstaller all verified NotSigned |Workflow now explicitly checks selected mode; signing services not pursued |
| Final-byte security scan |Existing candidate's Defender scan reported no threats; final public build still needs its own scan/checks |Bounded result, not a security guarantee |

## Exact owner candidate remains unchanged

Setup SHA256: `c060a0869ff6b9333ee5881c1d3b6a397a66150d76e066fbdd2953191a58dbbb`.

ZIP SHA256: `ed18ddaf57d3c5be85f93be23e85dd06e52d6123fd6f57720d1c2a88a2f0938c`.

Both hashes rechecked after non-executing signature inspection. Inspection extraction archived with99 matching file hashes under `.test-data/hosted-lifecycle-2026-09-29/signature-inspection`; no Desktop duplicates or permanent deletion. Hosted test builds have their own hashes and are not these same files. Desktop shortcut still uses the installed EXE with the same separate owner-review profile; Start menu retains the normal profile. No silent profile consolidation.

## Still required before publication

Stream-test follow-up, September29: all99 installed runtime files rechecked against the unchanged candidate; fresh installed-EXE workflow333+restart16+startup9+network33+cache5 passed with synthetic profiles and graceful exits (`.test-data/packaged-smoke-1790720404351/report.json`). Defender repeated custom scan of candidate directory: exit0, no threats reported. Six-file local viewer kit copied/hash-verified to Desktop\HD2CSM; no public upload, installation/save changes or official-channel relabeling. Manifest `.test-data/stream-kit-2026-09-29.json`.

1. Review remaining manual consumer-Windows wizard, portable first-run, physical audio/DPI/native-picker and genuinely disconnected-install limitations. Do not claim Windows Server tests cover those. Automated lifecycle is complete; do not rerun it on the owner's PC.
2. Resolve the existing artwork-use release decision; inventory/attribution is not permission. Request remains unsent. No artwork replacements or rights-holder messages performed here.
3. Finalize release-channel wording and date, build the exact approved Setup/ZIP, verify bundled guides/notices, tests, scan and SHA256. Current preview files cannot be relabeled as a tested final release without that work.
4. Review final source CI and download contents, obtain final publication approval, then create the new full-name1.0 release without replacing historical assets. Release automation stays draft-only.

Signing is not a remaining purchase/setup task. Accurate unsigned warnings and checks remain required. Development PR407 and temporary Actions artifacts are not an official release.
