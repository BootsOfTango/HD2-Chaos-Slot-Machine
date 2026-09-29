# Release workflow and repository review

## September29 unsigned distribution update

Owner explicitly set signing aside. Reviewed mode in `docs/release-distribution.json` is unsigned; its evidence is `DISTRIBUTION_DECISIONS.md`. Metadata validates the mode/evidence before dependency installation. Tags use that policy; manual signing remains explicit. No signing credentials are passed in unsigned mode. Signature verification always runs: ZIP app, Setup and extracted uninstaller must match the selected mode; an invalid/unexpected signature is not accepted as unsigned. Existing readiness gates, exact artifact handoff, hashes, minimal permissions and draft-only creation are retained. No tags, official release, service application or purchase are authorized by this update. Historical signed-only statements below are superseded for this policy, not evidence of a new hosted release build.

September 16, 2026. Local branch `codex/release-workflow-review`. This bounded stage changes development/release automation, not the installed application. **Public release remains blocked.**

## Implemented locally

- Build job gets `contents: read`, no stored checkout credential, no publication token. The only write-token job runs on a separate hosted runner, does not check out source or run dependencies/artifacts, and can create only a new draft through the supplied workflow. Its token could technically publish if that workflow were maliciously changed; this is not a repository-wide enforcement mechanism.
- All external actions pinned to exact commits verified against their upstream release tags on the review date: checkout v7.0.1 `3d3c42e5aac5ba805825da76410c181273ba90b1`, setup-node v7.0.0 `820762786026740c76f36085b0efc47a31fe5020`, upload-artifact v7.0.1 `043fb46d1a93c77aae656e7c1c64a875d1fc6a0a`, download-artifact v8.0.1 `3e5f45b2cfb9172054b4087a40e8e0b5a5461e7c`. Their action metadata uses Node 24; the app's CI tooling stays Node 22. Full action-code review is not claimed.
- Readiness gate and exact version/tag check run before dependency installation. Untrusted ref values reach PowerShell through environment variables, not script interpolation. Cache reuse disabled; timeouts and per-ref release concurrency set.
- Signing credentials are exposed only to the build step when signing is required/requested. Signature verification receives only publisher identity. This reduces exposure but is **not** full signing isolation: earlier install/build code on the same runner can persist malicious changes. Protected signing environments/OIDC and scoped provider credentials remain an owner setup decision; no protection is claimed merely because an environment has a name.
- Electron-builder receives `--publish never`. Only four exact versioned files are uploaded (no broad directory/globs/private profiles). Draft job downloads the same run's immutable artifact ID, checks exact entries and SHA-256 sidecars, then creates a draft with `--verify-tag`. No overwrite/edit/clobber path. The SHA-256 checks detect transfer differences, not compromise of both original bytes and checksums.
- Tag builds still require valid Windows signatures. Manual unsigned test builds remain possible but do not create releases. Existing unsigned local-build policy is unchanged. No silent relaxation to obtain a green pipeline.
- New `Validate source` workflow runs locked installation, dependency audit and tests on ordinary pull requests/main pushes. It uses read-only permissions, no secrets, no `pull_request_target`, no credential persistence and no cache. This check must first run remotely before a reviewed required-status-check rule can safely reference it.

References: [GitHub Actions secure use](https://docs.github.com/en/actions/reference/security/secure-use), [workflow permissions](https://docs.github.com/en/actions/reference/workflows-and-actions/workflow-syntax), [draft/verify-tag CLI options](https://cli.github.com/manual/gh_release_create). No remote workflow has been dispatched or updated by this session.

## Local Git credential-pattern audit

`python scripts/audit_git_secrets.py --report .test-data/security-workflow-review/git-pattern-audit.json` scans all locally reachable Git blobs and commit/tag objects plus current nonignored files. Historical file names are checked separately, including reused blobs. It emits rule names and object/path locations only, never matched values; no content is uploaded. Regression fixtures construct fake patterns without leaving plausible credentials in source.

Final executed scan: **873 commits, 1,065 blobs, 570 current files**, **zero matches**, no skipped symlinks. Report preserves the exact timestamp/scope. Remote `main` and local `origin/main` both resolved to `035e47a6480bf6b2a1c5c7aca2eaf0820dfcd7c3` during this review. This does not certify every remote ref, deleted/unreachable objects, private ignored files or arbitrary passwords. Selected private-key/GitHub/AWS/Slack/npm/credential-URL patterns are not an entropy, malware or comprehensive professional secret scan.

## Read-only GitHub observations

Unauthenticated official REST requests returned:

- Public repository, default branch `main`, `protected: true`.
- Active ruleset **protect main** (15033342): blocks deletion/non-fast-forward changes and requires pull requests. Required approving review count is **0**; the returned rules contain no required-status-check rule. This does not establish independent review or passing-CI enforcement.
- Private vulnerability reporting: **`enabled: false`**.
- Classic branch-protection endpoint returned **401**. Authenticated settings/secret scanning/Actions policies/environment protection and account 2FA were not inspected. No credential was requested/read and no settings were changed.

Recommended next owner-approved settings step: enable private vulnerability reporting; after source CI exists and passes remotely, require its exact status on main. Do not impose a second-reviewer requirement on a solo maintainer without agreeing a workable reviewer/bypass arrangement. Review release-tag protection and signing environment restrictions before signing setup.

## Packaged Electron assessment (read-only)

Read the fuse wire from the existing `dist/runtime-security-review/win-unpacked/Helldivers 2 Chaos Slot Machine.exe` using the installed `@electron/fuses` library; **did not modify it**.

| Capability | Observed | Follow-up |
| --- | --- | --- |
| Run as Node | Enabled | Disable in a separately rebuilt/tested production candidate if unused |
| NODE_OPTIONS handling | Enabled | Disable; verify source tooling remains separate |
| Node inspector arguments | Enabled | Disable; confirm packaged test harness compatibility |
| Embedded ASAR integrity | Disabled | Assess builder support, enable/test before signing |
| Load only from ASAR | Disabled | Pair with integrity checks and package tamper-negative tests |
| Extra file-protocol privileges | Enabled | Replace `loadFile` with a scoped custom protocol before disabling |

Cookie encryption/browser-specific snapshot were disabled; neither was changed. Newer runtime fuse index 8 was enabled and is not named by the installed library's enum, so no broad/strict flip was attempted. [Electron's fuse documentation](https://www.electronjs.org/docs/latest/tutorial/fuses) explains package-time controls; [security guidance](https://www.electronjs.org/docs/latest/tutorial/security) recommends custom-protocol use. These hardening options are not evidence that the PC was compromised.

Current app uses `loadFile`; IPC guards compare exact file URLs. A custom protocol changes origin/localStorage behavior and must preserve old saves and fallback migration. Do not simply flip the file-privilege fuse and break offline catalog fetches. Remaining data-to-DOM review also stays open; the sink inventory is not a completed audit.

## Verification and limitations

- Workflow YAML parsed in tests; permission/event/secrets/action pins/artifact boundary/draft invariants checked. The actual inline transfer-validation PowerShell ran locally against valid, corrupted, missing, extra, wrong-tag, wrong-sidecar and directory-instead-of-file fixtures. Real GitHub upload/download, hosted-runner action compatibility, Azure signing and draft creation were **not executed**.
- First fixture run failed because Windows PowerShell inherited PowerShell 7 module paths and could not find `Get-FileHash`. Test subprocess now initializes its own module paths; no global environment or security setting changed. The unchanged validator then passed all fixtures.
- Full `npm test`: **312 passed**, log `.test-data/security-workflow-review/unit-tests.log`. Catalog/CSP/assets checks pass. Public-release gate remains intentionally blocked. All 382 runtime source comparisons still pass, and existing installer SHA-256 remains `e7f10a79daa4f3755f5d8dca71ce953bcd8375f89d5dbc57ee437ec61a57a7ae`.
- No application runtime/asset/source entry code changed, no GUI or installer launched, no rebuild required for this automation-only stage. Previous packaged tests remain historical evidence, not reruns. Existing installers, personal saves and Desktop layout remain untouched. No commit, push, tag, release, account setting, signing payment or rights-holder message.

## Next bounded task

Review remaining data-to-DOM paths, then implement scoped local-protocol/production-fuse hardening with explicit old-origin/save migration and packaged regressions. Do not close the overall security gate yet. Artwork permissions, final dependency/asset notices, full-word branding, 1.0 version transition, native installation and final signed/explicitly unsigned distribution policy remain release gates.
