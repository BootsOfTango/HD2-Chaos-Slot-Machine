# HD2 Chaos Slot Machine — release rights and security review

September 16, 2026. Branch `codex/release-rights-security`. Status: **initial local hardening complete; public release blocked**. Owner authorized choosing prudent protection measures and requested the public name **HD2 Chaos Slot Machine**, Version 1.0 Official. This is not completion of the release or the main feature roadmap.

## Licensing decision

Retain the existing Apache 2.0 license during release preparation. It already grants irrevocable permissions subject to its conditions; pretending to withdraw them, adding contradictory no-copy clauses, or claiming exclusive rights in AI-generated/third-party material would not reliably protect the owner. New NOTICE.txt identifies Chris Kim / Boots Of Tango and separates eligible original contributions from game artwork, community creations and dependencies. It adds attribution, not new restrictions. Existing Apache-compatible reuse is not theft. No copyright registration, trademark registration, new legal entity or paid service has been purchased.

Free protective steps adopted: consistent canonical project attribution, explicit third-party separation, preserved development history, security reporting guidance, local artifact hash records and publication gates. These are evidence/risk-management measures, not registrations or guarantees. Review human-authored contributions before making broader ownership claims; protect genuinely distinctive creator branding without claiming HELLDIVERS marks. Any future restrictive licensing needs a scoped ownership/contributor review and cannot erase prior grants.

References: [Apache terms](https://www.apache.org/licenses/LICENSE-2.0), [GitHub repository licensing](https://docs.github.com/en/repositories/managing-your-repositorys-settings-and-features/customizing-your-repository/licensing-a-repository), [Copyright Office basics](https://www.copyright.gov/help/faq/faq-general.html), [AI/human authorship](https://www.copyright.gov/newsnet/2025/1060.html). U.S. guidance is a starting point; jurisdiction-specific professional advice may be needed. No assertion that prompting alone creates copyright in generated output.

## Artwork decision and blocker

Armory now explains independence/non-endorsement, eligible project contributions, third-party rights, community creator rights and incomplete clearance. The software license is not represented as an artwork license. Root NOTICE.txt and THIRD_PARTY_NOTICES.md are configured for packaging inside/as companion notices; that packaging has not yet been rebuilt/verified.

89 legacy stratagem source/version findings remain. Even fully source-matched official promotional images need a documented permission or other supportable use basis for redistribution. Wiki attribution does not automatically license underlying game IP. No blanket publisher fan-app distribution permission was established during this initial review. [PlayStation website terms](https://www.playstation.com/en-us/legal/website-terms-of-use/) are not such a grant; [Copyright Office guidance](https://www.copyright.gov/help/faq/faq-fairuse.html) cautions that permission/fair-use questions are fact-specific.

Do not publish the new official build until asset-group rights are resolved. Obtain appropriate permission or use cleared/original alternatives; do not assume that tracing or AI imitation eliminates the issue. Contacting rights holders on the owner's behalf requires agreeing the recipient and message first. No external permission request, takedown or legal complaint has been sent.

## Security changes implemented locally

- All application IPC handlers (including storage read/write/import/export/clear and window controls) now require an attached application window, its exact live main frame and the expected local entry URL. Subframes, strangers, detached/destroyed senders and navigated documents fail before privileged handler effects. Hash-only entry navigation remains supported.
- Deny unused permission checks/requests and device access; deny browser-driven downloads. Native JSON save/open dialogs and ordinary sound playback use separate paths.
- Disable webview use explicitly, reject attachment and child-frame navigation; add `frame-src 'none'` to CSP.
- External YouTube navigation additionally rejects credentials and nonstandard ports. Existing HTTPS host allowlist, sandbox, context isolation, disabled renderer Node integration and software rendering retained.
- Add SECURITY.md; ignore common local credential/signing-file patterns. Ignoring files does not remove anything already committed or prove absence of secrets.
- Tag-release workflow runs a fail-closed readiness check and a moderate-or-higher dependency audit. Six explicit review categories currently block release. The JSON checklist records human review evidence; it does not itself certify rights/security or prevent a maintainer from bypassing the workflow. Existing signing requirements are not relaxed.

This follows relevant portions of [Electron's security guidance](https://www.electronjs.org/docs/latest/tutorial/security), not a claim of checklist completion or penetration testing.

## Checks actually run

- **297 Node tests passed**, including six new IPC/session and four release-policy/notice tests. Catalog/assets validation passed: 247 local references, zero missing. `.test-data/release-security-unit-final.log`.
- Sequential software-rendered source safety **7+8**: `.test-data/desktop-safety-1789542608545/report.json`. Source workflow **54+8**: `.test-data/electron-smoke-1789542631186/report.json`. Source transfer desktop **36+5**, browser-emulation **29+5**: `.test-data/transfer-health-1789542789954/report.json`. All graceful exits; isolated profiles. Browser emulation is not a separate vendor-browser test; file pickers are stubbed; no audible listening test.
- `npm audit --json`: zero reported known vulnerabilities across 315 dependencies at this check. Saved `.test-data/release-security-npm-audit.json`. Not a malware scan or proof of no vulnerabilities. Registry latest was Electron 44.4.1; latest listed 43.x was 43.7.1, while installed/locked runtime is 43.3.0. Runtime update compatibility/security review remains required despite the clean npm audit.
- Microsoft Defender custom scan of **existing** `dist/hyena-revenants-review`, using `MpCmdRun.exe -Scan -ScanType 3 -File <exact directory> -DisableRemediation`: exit 0, explicit **found no threats**. Defender product 4.18.26080.4, signatures last updated September 15 at 10:26:38 EDT. Antivirus and real-time protection enabled. No protections/exclusions were changed; no file remediation or uploads to multi-engine scanning sites requested. This did not scan a future official build or certify the PC as clean.
- Limited local pattern audit of **425 current nonignored text files** found no matches for selected high-confidence private-key/GitHub-token/AWS-key patterns. Existing packaged ASAR inventory showed no selected private-profile/.git/.env/signing-key paths. Not an exhaustive secret scan, full Git-history scan or malware analysis. Values were not printed or uploaded.
- `npm run verify:public-release` deliberately exits 1 with six unresolved categories. Regression tests verify the fail-closed behavior and workflow hook. No GitHub workflow run or remote repository settings changes were performed.

## Explicitly outstanding before publication

1. Resolve artwork use permissions/provenance and complete the exact third-party notice inventory.
2. Update/test Electron; review residual CSP `unsafe-inline` scripts/handlers, broad HTTPS image loading and file-protocol use. New IPC guards do not neutralize same-page script injection. Review other data-to-DOM paths and full Git history for secrets.
3. Review release workflow least privilege, mutable action references, private vulnerability reporting and repository protection settings. Do not claim settings are enabled without checking.
4. Complete full-word public title/icon/metadata and test safe upgrade from previous 1.1.x versions to a 1.0-labelled release. Preserve app ID/save paths/history and existing tags. Current `v1.0.0` is already used; select a distinct tag.
5. Rebuild installer and portable ZIP; verify notices/assets, run packaged regressions and actual native install/upgrade/uninstall checks with safe profile handling, scan those exact final bytes, verify signing status and published-download hashes. No final artifact exists for these source edits yet.
6. Publish source/docs/release assets only when gates are satisfied. Keep clear limitations about the unfinished feature roadmap; no new exact live missions, galaxy map or cross-faction reroll claim.

## Handoff

No commit, push, tag, release, installation, app identity/version change, permission request, personal-save access or Desktop duplicate was created this turn. Earlier dirty changes preserved. Source `dist/hyena-revenants-review` installer still hashes to `29a2fed389dc577be5ef978fa46cbac825edaceda1bd755017e655cdf1b26d61` and **does not contain these new hardening/notices**. At the final read-only check, the previously created Desktop `HD2CSM` download folder was absent and a Desktop `Helldivers 2 Chaos Slot Machine` folder existed; no Desktop recovery/cleanup was attempted. Do not assume historical Desktop paths still exist or relabel old bytes as the official release. No further build was created merely to change notices while rights/release gates are unresolved.

Next bounded engineering task: runtime update and renderer/CSP hardening, then exact package/security verification. In parallel with release preparation (not an automated background task), resolve asset permission scope using an owner-approved rights-holder request or agree a cleared-artwork replacement strategy.
