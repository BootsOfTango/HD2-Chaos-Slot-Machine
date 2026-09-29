# M2B Warbond batch 4 — v1.1.7 local preview

September 14, 2026. Branch `codex/m2b-warbond-audit-4`; earlier uncommitted work preserved. Local-only bounded M2 increment, not the complete catalog/Armory/live-war roadmap. The installed app, original runtime folder and personal saves are untouched.

**Later owner-requested folder cleanup:** the unchanged Setup EXE/checksum are now at the source-checkout top level; obsolete build folders were recycled, and the v1.1.3 runtime moved to `.test-data/legacy-runtimes/v1.1.3/`. Paths and source parity below describe the original verification time. Source README location instructions were subsequently updated without rebuilding or modifying packaged bytes. See `LOCAL_BUILD_LAYOUT.md` for the current layout and post-move checks.

## Scope

Fourteen existing acquisition reviews across Masters of Ceremony, Force of Law and Dust Devils, with three exact five-item equipment sets (one member, Saber, already reviewed). Thirteen new primary-source reviews and one explicitly community-source review, Sample Scanner. Six stratagem associations, K-9 backpack subgroup, full-designation aliases and three official promotional images. No new names, stable IDs, default eligibility or item artwork changes. Catalog: 69 primary + 13 community + 123 pending = 205; 82 reviewed acquisitions.

Source research, artwork provenance, publisher attribution, separate shop exclusions and uncertainty are documented in `M2B_WARBOND_BATCH4_RESEARCH.md`. Promotional images are not claimed as exact in-game covers.

## Verification completed

- Baseline: 165 unit tests and catalog/assets passed before changes.
- Updated units: 174 passed, including nine new batch-specific tests. Catalog and asset validators pass: 236 local pictures, zero missing, seven pre-existing placeholder references.
- Pre-change v1.1.6 catalog independently matched the verified packaged catalog before fixture capture. Historical projection reproduces its semantic digest; all 191 unreviewed rows and ten earlier Warbond definitions match independent pre-change digests. Protected fields of all 205 rows are unchanged. The first negative default-mutation test accidentally assigned an already-false value; corrected to invert it, then passed.
- Generator idempotence: a repeated `python scripts/sync_item_catalog.py` left index/catalog/image-map hashes unchanged.
- `npm run test:desktop-safety`: 7 windowed + 8 restart/fullscreen/close checks passed; `.test-data/desktop-safety-1789434413404/report.json`.
- `npm run test:electron`: 54 development workflow + 8 restart checks passed; `.test-data/electron-smoke-1789434428837/report.json`. Real storage IPC used stubbed native picker responses in an isolated profile. This is not native picker interaction.

All GUI suites ran sequentially, after packaging had finished, with isolated profiles and software rendering. No force-kills. Counts include repeated per-item assertions, not distinct user workflows. Durable units evidence: `.test-data/warbond-batch4-units.log` and `.json`.

| Packaged check | Passed | Evidence directory under `.test-data/` |
| --- | --- | --- |
| New Warbonds / batch 4 | 1195 integration + 254 restart + 3 storage-backend file checks | `packaged-warbonds-1789434735333` |
| Complete workflow | 51 workflow + 8 restart + 7 normal-startup/fullscreen + 14 controlled network | `packaged-smoke-1789434777626` |
| Earlier Warbond batch 3 | 1201 integration + 248 restart + 3 file checks | `packaged-warbonds-1789434828568` |
| Earlier Warbond batch 2 | 1175 integration + 242 restart + 3 file checks | `packaged-warbonds-1789434854258` |
| Earlier source audit | 808 integration + 167 restart + 3 file checks | `packaged-sources-1789434877829` |
| New gear and ownership | 81 integration + 10 restart + 3 file checks | `packaged-gear-1789434889272` |
| Duplicate identity regression | 131 integration + 28 restart + 3 file checks | `packaged-dedup-1789434903605` |
| Actual v1.1.3 EXE save → v1.1.7 EXE | 18 seed + 29 first-boot + 3 backup/version checks | Same dedup directory, report `upgrade` field |

Every directory contains a passing `report.json`, phase checks and graceful-close evidence. Aggregate `.test-data/warbond-batch4-acceptance.json` cross-checks all seven reports: **18 packaged phases exited normally**, prepared windowed before closing; **17 current-app lifecycle files** match the process IDs and contain `will-quit`, software rendering and no recorded abnormal child/renderer exits. The one preserved v1.1.3 seed predates lifecycle diagnostics; it received `--disable-gpu` and verified windowed close/zero exit. No GUI process or lock remained at the end.

The Warbond tests exercise all 13 declared equipment sets, real bulk/per-item controls, hidden search members, separate ownership/inclusion, custom-item exclusion, aliases, bundled artwork, old/plain/enveloped imports, exact historical Result preservation and restart. File checks export/import/load the packaged renderer's actual payload using the real storage backend, without native dialogs. The actual older-EXE upgrade preserves original save bytes in automatic backup; it is not a native installer upgrade and does not substitute for every historical executable version.

Visually inspected the three new packaged panel captures in the batch-4 directory: `Masters-of-Ceremony.png`, `Force-of-Law.png`, `Dust-Devils.png`. Promotional images, titles, counts and bulk controls display correctly. Artificial `Unverified custom equipment` rows are deliberate isolated-test fixtures, not bundled catalog additions. The layout remains the existing Manual pool view; this is not M4's full visual redesign.

The main packaged suite passed first-launch offline Spin, item lock/reroll animation handling, existing faction-bound planet/mission behavior, Results, scoring, Compare, Armory, Rank and restart. WebAudio context/output initializes; no listening claim. Controlled network cases cover success, offline, rate-limit, invalid/empty responses, timeout and recovery. A separate real API request succeeded with 36 active planets at **21:13:36 EDT**; availability at other times is not guaranteed. Cross-faction planet rerolls and the new refresh service remain M3, not changes in this preview.

At **21:15:32 EDT**, a bounded Windows System warning/error/critical query since 21:06 found no matching Display, nvlddmkm, WHEA, BugCheck or WER-SystemErrorReporting records. The query returned the normal no-matching-events result, boot time remained 19:52:28.5 and no app test processes/shared lock remained. Evidence: `.test-data/warbond-batch4-system-check.json`. This short interval is not proof of a BSOD fix or long-duration stability.

## Output and limits

Verified directory: `C:\Users\Chris\Desktop\HD2CSM-Source\dist\preview-v1.1.7`.

Installer: `Helldivers-2-Chaos-Slot-Machine-Setup-v1.1.7-win-x64.exe`. ZIP: `Helldivers-2-Chaos-Slot-Machine-v1.1.7-win-x64.zip`.

| Artifact | Bytes | SHA-256 |
| --- | ---: | --- |
| Installer | 131991650 | `e783695da83e48dc9a4a123b8b3ba2006f12df75df52104b5df987aeae43362b` |
| ZIP | 171535629 | `09ea3553c28030c3ba3a01237dc7d56350003da804fc4a214097bef1a9904c03` |

Build completed with Electron 43.3.0 / electron-builder 26.15.3, locked dependencies unchanged. `python scripts/verify_win_zip.py --dist dist/preview-v1.1.7` passed ZIP CRC, 81 entries, executable headers, required runtime/assets, forbidden-file exclusion and embedded offline installer payload (131660386 bytes). SHA-256 sidecars are beside the artifacts. Authenticode reports **NotSigned**.

`dist/preview-v1.1.7/source-parity.json` records **353 bundled files** byte-equal to source, builder-normalized package identity/version/main metadata, external README and both extra icons. ASAR SHA-256: `1023994d14441fd8c0cf0a9c26054c868bc912415fc88bd7f70a536422d989d4`. Only excluded documentation and the local launcher were edited after packaging.

The EXE actually launched/tested is `dist/preview-v1.1.7/win-unpacked/Helldivers 2 Chaos Slot Machine.exe`, with all companion files. It is not a native-installed copy. `scripts/start-local-preview.cmd` now targets that verified runtime with `dist/review-profile-v1.1.7`; the profile starts separate from personal and automated-test data. Existing `dist/safety-preview-v1.1.6` and older artifacts are preserved. The damaged interrupted installer directly under `dist` must not be used.

No native installer installation/upgrade/uninstall, physical DPI/multi-monitor/trackpad, native file-picker interaction or audible listening test is claimed. Long-duration stability and elimination of the prior BSOD remain unproven. Public signing, artwork-rights review and owner publication approval remain separate. No GitHub upload is authorized by this local checkpoint.

## Owner review and next task

1. Use the isolated review launcher. In Armory → Manual pool management → Source / Warbond-first, search Masters of Ceremony, Force of Law and Dust Devils. Check each image and five-item set.
2. Change ownership and include/exclude choices, narrow search to one item and inspect the whole-set warning, then restart. Only declare all items unlocked when that matches your game ownership.
3. After feedback, the next bounded M2B source/artwork audit candidates are Viper Commandos, Truth Enforcers and Steeled Veterans. Confirm complete sets and separate shop/reward exclusions before edits; do not start M3–M7 concurrently.

Still queued: 123 acquisition reviews and remaining Warbond art; unrestricted planet rolls/shared refresh, full visual Armory, compatible missions/confirmed shortlists, galaxy map and final integration/release. No personal saves were accessed or replaced.
