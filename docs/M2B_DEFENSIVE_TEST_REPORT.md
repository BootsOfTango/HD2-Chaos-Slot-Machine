# Local Development — Defensive Audit: test evidence

September 15, 2026. Branch `codex/m2b-defensive-audit`. Internal package version frozen at 1.1.14; **this is not another numbered release**. No installation, publication, tag change, personal-profile write or Windows/driver/security change.

## Implemented

- Fourteen existing defensive-stratagem acquisitions corrected to community-reviewed requisition purchases, with individual source URLs and review dates. No identities/names/aliases/subgroups/art/defaults/scoring changes, ownership grants or historical Results changes.
- All eighteen ordinary defensive entries in the consulted sentry/emplacement lists are represented: these fourteen plus four prior Warbond items. The explicitly labeled April Fools/Budget Helldiver page is excluded. Broader game-wide completeness remains unproven.
- Catalog coverage: **178/205 reviewed (108 primary, 70 community), 27 pending**. All 23 Warbond groups preserved.
- Descriptive app header and local installer/ZIP filenames replace per-batch version increments. Both builder and verifier validate local labels; public naming defaults remain unchanged. Package/lockfile version and save-format version unchanged.
- Owner's planned **HD2CSM 1.0 Official** release recorded in `LOCAL_BUILD_POLICY.md`; existing remote tags verified read-only and left intact. Technical downgrade/upgrade and future tag/workflow choices remain a release gate, not presumed solved.

## Checks run

- Baseline **249** units/catalog/assets passed. Final **258** tests plus catalog/assets passed: 245 local pictures, zero missing, seven pre-existing placeholders. Six added catalog regressions and three local naming/validation tests. `.test-data/defensive-baseline.log`, `defensive-unit.log`.
- Independent orbital/Eagle ASAR baseline protects 191 unrelated records, all 205 protected item fields and all 23 Warbond groups. Tests cover immutable inputs/history, idempotence, all ownership states, ID/name/alias imports, removed/changed identity detection and EMS/gas/campaign distinctions. Historical pre-review fixture digests remain enforced.
- Local naming tests cover default public filenames, exact labeled installer/ZIP names, path traversal, empty/oversized/case/whitespace/newline/macro labels and mismatched installer names. An initial test passed `-start` as a separate argparse token and expected application validation instead of argparse rejection; fixed the test to pass `--local-label=<value>`. Final 258 passed. The validator also explicitly rejects trailing line terminators in JavaScript, matching Python fullmatch behavior. No app/runtime failure was involved.
- Source desktop-safety: 7 initial + 8 restart/fullscreen/graceful-close checks. `.test-data/desktop-safety-1789510122337`.
- Source workflow: 54 + 8 separate-process restart checks. `.test-data/electron-smoke-1789510129252`.
- Descriptively named offline NSIS installer and portable ZIP built with `--publish never`; ZIP CRC, required/runtime/content checks, 7-Zip installer payload test and SHA-256 sidecars passed. Installer Authenticode: `NotSigned`.
- **375 packaged source comparisons**, external guide/icons and ZIP/runtime ASAR equality passed. `.test-data/defensive-source-parity.json`. ProductVersion remains 1.1.14.0 and FileVersion 1.1.14 as intended; visible header has no release number.

| Actual packaged EXE suite | Checks | Evidence under `.test-data` |
| --- | --- | --- |
| Defensive facts, all Warbond controls, history, restart | 1819 + 375; backend roundtrip 3 | `packaged-acquisition-1789510310552` |
| Transfer / restart | 26 + 4; backend 3 | `packaged-transfer-1789510368868` |
| Duplicate identities / restart | 131 + 28; backend 3 | `packaged-dedup-1789510374933` |
| Actual v1.1.3 EXE save upgrade | Seed 18 + upgrade 29 + backup/version checks 3 | Same dedup directory |
| New gear ownership / restart | 81 + 10; backend 3 | `packaged-gear-1789510388484` |
| Earlier source audit / restart | 808 + 167; backend 3 | `packaged-sources-1789510396401` |
| Core / restart / normal fullscreen / network | 51 + 8 + 7 + 14 | `packaged-smoke-1789510400135` |

All **16 packaged phases** exited normally using isolated profiles and sequential exclusive tests; no forced shutdowns or failed GUI runs. Fifteen current-app phases have matching process/software-rendering/`will-quit` diagnostics; the older seed process also exited normally. Aggregate: `.test-data/defensive-acceptance.json`.

Core checks exercise offline Spin, locks/rerolls, WebAudio initialization, Results/scoring, Compare, Armory, Rank, persistence and existing network/cache/bundled fallback. Dedicated suites check real storage-backend imports/exports and old saved choices/history. Source-audit screenshot visually inspected: descriptive header, correct 108/70/27 counts and local defensive image at one captured window size. These assertion counts are not percentages of user-testing coverage.

## Artifacts

Directory: `C:\Users\Chris\HD2CSM-Development\HD2CSM-Source\dist\defensive-review`.

- `HD2CSM-Setup-local-defensive-win-x64.exe`: 139,611,729 bytes; SHA-256 `a80005aa12d6f5c2520facfb54830da15a112da3520ac071846c11eb2e3f5e46`.
- `HD2CSM-local-defensive-win-x64.zip`: 179,300,625 bytes; SHA-256 `c4805430e2a8d133bf9b89e099e73230f29df23193601ac9fa6e42406db3d18b`.
- ASAR SHA-256 `0306f0b021ad46e88f0b741b35cc35dca54ca794a7c3449d6abac79f71528784`.

## Preservation / cleanup

Installed app and accepted download remain v1.1.10 with verified unchanged hashes. All 73 existing personal-profile files still match the prior backup. Desktop download remains its three accepted player files. No Desktop copies or folder visibility changes.

After all checks passed, moved/hash-verified all 87 superseded orbital/Eagle candidate files under `.test-data/desktop-cleanup-2026-09-15/superseded-orbital-eagle-candidate/orbital-eagle-review-v1.1.14`. Adjacent manifest/result files record exact restoration paths. No permanent deletion. Active `dist` now contains only `preview-v1.1.10` and `defensive-review`; historical reports/fixtures retain their original evidence bytes and labels.

## Limits and next work

Candidate native installer/upgrade/uninstall/wizard and real native pickers were not exercised; the actual packaged runtime was. No personal-profile gameplay, audible listening, physical DPI/trackpad/multi-monitor or long-duration/OS-shutdown tests. A same-internal-version native upgrade and a future 1.0 numerical transition are not established by these checks. Unsigned; public signing/asset-rights checks remain.

Next: the remaining 27 support/backpack/vehicle acquisition records in bounded batches, starting with backpacks/vehicles and their requisition/campaign distinctions, plus missing-content checks. M2 remains open; M3–M7 remain queued. Keep the accepted install/download unchanged until owner upgrade approval. Official publication waits for completion and the owner's decision.
