# Hyena and Righteous Revenants — local implementation

Branch `codex/m2-hyena-revenants`. Resumed M2 after the owner accepted fullscreen behavior. Internal version remains 1.1.14; local label `hyena-revenants`, no public release.

## Changes and evidence

- Added `primary:r-4-hyena`, a marksman primary and Celestial Fence campaign reward, initially unowned/excluded. [Arrowhead's reward FAQ](https://arrowhead.zendesk.com/hc/en-us/articles/29563053705500-I-didn-t-get-a-campaign-reward) confirms the June 30–July 13, 2026 participation window. Slot/class are checked against the [community weapon page](https://helldivers.wiki.gg/wiki/R-4_Hyena). The app does not determine entitlement or grant in-game items.
- Added the Righteous Revenants Warbond record and bundled cover. Exactly three existing primaries: StA-52, PLAS-39, StA-11. [Official contents announcement](https://blog.playstation.com/2025/12/11/the-helldivers-2-x-killzone-items-return-as-a-legendary-warbond-dec-18/). No new weapon duplicates; W.A.S.P. remains a separate requisition unlock. Existing ownership defaults and saved choices for these three weapons are preserved, not reset by registration.
- Catalog now contains 206 items and 24 Warbond records. Independent hashes from the owner-reviewed Window Behavior ASAR protect all 205 prior items and 23 prior groups unchanged. Historical test projections remove only the two new records, never rewrite old identities/defaults/artwork to make a test pass.
- New-gear panel includes Hyena alongside the original five additions. The descriptive `hyena-revenants` review token is independent of application version. Previously dismissed `1.1.2` notices do not conceal the new item; recognized old/new tokens survive imports and saves. Dismissal never opts into gear.
- Existing name-only/custom Hyena entries resolve through its stable ID/alias without losing owned/enabled choices or private per-item metadata. Missing Hyena in an older save stays excluded. Results/scoring and save-format version are unchanged.

## Artwork and unresolved limits

The two PNGs were obtained through public Wiki imageinfo/file pages and visually inspected: Hyena is the scoped rifle render; the cover depicts Helldivers × Killzone with the Legendary Warbond heading. Bundled offline; uploader credits **Undeadender** and **PLord**, via Helldivers Wiki.gg. See `assets/catalog-additions/ATTRIBUTION.md` and `provenance.json`.

Important distinction: downloaded PNG dimensions agree with imageinfo, but delivered byte sizes/SHA-1 differ from the server's original-file metadata. Both sets of measurements are recorded. No local image edits were made; this is verified source association and delivered-file integrity, not a claim of original-archive byte identity or redistribution clearance.

The 89 older stratagem image records still lack reconciled source/version provenance. Their images are present; this update does not replace or silently certify them. Community SVG traces, including boosters, are not automatically original game-extracted icons. Exact-artwork and public-release rights review remain open. The dated completeness audit now has zero missing-item/Warbond findings but intentionally remains not ready because of the 89 artwork findings.

The legacy logo/rank source checklist now explains its limited scope instead of implying all catalog art is official. Ironclad Democracy remains deferred pending release review. No live-war/M3 changes.

## Review and safety

Use `scripts/start-catalog-review.cmd` to launch the candidate with isolated `.test-data/hyena-revenants-owner-review` saves. Installed app, player download and personal profile are not automatically updated. Keep all portable runtime companions together; no developer tools are needed to run it.

Review Hyena's Owned/Include controls and image, then the Righteous Revenants group and its three-item bulk controls. Confirm only equipment actually received/redeemed in Helldivers 2. Fullscreen acceptance and its safeguards are preserved.

This is a bounded catalog increment, not completion of M2 or the broader roadmap.

## Executed verification — September 15–16, 2026

- 287 unit tests passed; 247 local references, zero missing assets. Generator rerun was byte-idempotent. Logs: `.test-data/hyena-revenants-unit-final.log` and `.test-data/hyena-revenants-build.log`.
- Source software-rendering/lifecycle safety 7+8 and workflow 54+8 passed, sequentially with isolated profiles and normal exits.
- Packaged gear: 97 write + 11 restart checks; Hyena actual forced roll only after opt-in, old dismissal upgrade, Righteous three-item controls, unrelated ownership unchanged. Both artwork screenshots visually inspected in actual packaged UI.
- Packaged dedup/upgrade: 131 write + 28 restart + 18 real old-EXE seed + 30 upgrade checks; original save backup preserved. Transfer: 26+4. Source/association checks: 808+167. Each of these four suites also passed three file-backend roundtrip checks.
- Packaged workflow 51, restart 8, normal/fullscreen 7, controlled network/offline 14. Total 14 phases including old-EXE seed; every process exited normally. Software-rendered current candidate, shared exclusive test lock. No failed GUI runs in this increment.
- 381 packaged source comparisons passed; ZIP/runtime ASAR and player guide match; installer embedded payload inspected. Final ASAR SHA-256 `99ee654a728c69e8c29ff2b60c87db3f24da5891e60ab65d6a26a8e32c4666e3`. Evidence: `.test-data/hyena-revenants-source-parity.json`, `.test-data/hyena-revenants-acceptance.json` and its five recorded packaged run directories.
- Installer: `dist/hyena-revenants-review/HD2CSM-Setup-local-hyena-revenants-win-x64.exe`, 141,908,386 bytes, SHA-256 `29a2fed389dc577be5ef978fa46cbac825edaceda1bd755017e655cdf1b26d61`.
- ZIP: `dist/hyena-revenants-review/HD2CSM-local-hyena-revenants-win-x64.zip`, 181,632,631 bytes / 81 entries, SHA-256 `5744000b0791f8545fe65b91bf46efe3f8ac81d907e473f8ddf21d67107f9576`.
- Signature is **NotSigned**. Candidate installer not executed or promoted; native wizard/picker interactions, audible listening, physical DPI/mixed-monitor/trackpad and long-duration operation not newly verified. Public signing/rights review remains open.

## Preservation and cleanup observations

The accepted Desktop installer is hash-identical and its folder still has three files. The recorded LocalAppData installation is now absent; the actual Desktop shortcut points to `C:\Users\Chris\Desktop\Helldivers 2 Chaos Slot Machine\Helldivers 2 Chaos Slot Machine.exe`, v1.1.10. Its ASAR hash `7d170a0fa11612d9d54aad2ba7f8f1868a81136da2668ec8c9ee1e0562daefe4` matches accepted evidence. No reinstall, relocation or shortcut change was performed. Historical personal-profile comparison found 53 unchanged, 19 changed and 1 absent file; cause/timing is not established. No personal file was restored to make a preservation check pass. Isolated tests cannot certify current personal-profile health.

Archived/hash-verified all 87 superseded Window Behavior files under `.test-data/desktop-cleanup-2026-09-16/superseded-window-candidate/window-behavior-review`. Adjacent manifest/result records exact restoration paths. Existing window-review launcher retargeted there; accepted preview launcher unchanged. Active `dist` now contains accepted preview and latest candidate only. Nothing permanently deleted or published.
