# Distribution inventory and license review — September 16, 2026

## Outcome and limits

The existing protected-startup candidate now has a reproducible file/hash and notice inventory. **Inventory enumeration is complete for the stated scopes; public license clearance is not.** This is a technical review record, not a legal opinion, full SPDX SBOM, malware certification or permission grant.

Branch: `codex/distribution-license-inventory`. No app code, artwork, runtime dependency or installer configuration was changed by this pass. Updated source notices and package scripts are **not** in the existing candidate. No installer was run, no personal saves accessed, and no Desktop copies, deletion, commit, push, release or rights-holder message occurred.

## Examined bytes

Candidate: `dist/protected-startup-review`.

| Scope | Observed |
| --- | --- |
| Runtime files, including ASAR and companion notices | 81 |
| Files inside ASAR | 386 |
| Media files inside ASAR, including unused alternatives | 333 |
| Sections in upstream Chromium/component notices | 780 |
| npm lockfile dependency entries | 315 |
| npm node_modules files inside ASAR | 0 |
| Embedded installer DLL plugins | 7 |

The 315 lock entries describe the build graph, not 315 application runtime dependencies. Electron itself is declared as a development dependency while its binary is shipped. Upstream notice sections may include optional/build/test components; counting them does not prove each is executed. The media count differs from the UI validator's 247 picture references because packaging includes additional assets and alternatives.

Installer SHA-256: `1464973a5be4d57bc9599635106e903ce42657a81d0eb9cb5318648e9296d307`.

Portable ZIP SHA-256: `b7641d934ad159a9fee9a0c607048ceeef3d84803c648133e66193f7a5d2ef30`.

`distribution-inventory.json` records every runtime/ASAR file hash, both artifact hashes, media grouping/source records, full upstream notice-text hashes, lock metadata and outer installer member hashes. The inspection reads archives and extracts small installer members into memory; it never executes installer/plugin code. The embedded application archive is covered by the prior protected-startup installer-payload equality test, not re-extracted by this inventory script. The generated uninstaller is hashed here, not recursively analyzed.

## Software findings

- Locked Electron 44.4.1's `LICENSE` and `LICENSES.chromium.html` match the shipped `LICENSE.electron.txt` and `LICENSES.chromium.html` byte-for-byte. The latter includes Node.js, Chromium, V8, ffmpeg and other upstream components. These full files must remain with the runtime.
- The application Apache license, NOTICE, third-party notice overview and SECURITY file are present as companion files. Presence does not prove all obligations are satisfied.
- All current npm lock entries have reported license metadata. Metadata alone is not a review of package contents, transitive exceptions or shipped binaries.
- The installer contains **System.dll, UAC.dll, StdUtils.dll, nsDialogs.dll, nsExec.dll, nsis7z.dll and WinShell.dll**, plus wizard art, application archive and uninstaller. Their individual hashes are in the inventory.
- Read-only SHA-256 comparisons matched System/nsDialogs/nsExec to the cached `nsis-3.0.4.1` x86-unicode plugins; UAC/StdUtils/nsis7z/WinShell match `nsis-resources-3.4.1` x86-unicode plugins. These toolset labels do **not** establish the individual source revision of each DLL.
- Cached NSIS `COPYING` covers core/default materials under zlib/libpng with separately described compression modules and exceptions. Do not apply that default to separately licensed plugins. No plugin license files were found in the inspected nsis-resources cache.
- [StdUtils's author documentation](https://nsis.sourceforge.io/StdUtils_plug-in) describes LGPL 2.1-or-later and clarifies installers using verbatim plugins through the NSIS interface. [Nsis7z's author page](https://nsis.sourceforge.io/Nsis7z_plug-in) describes LGPL/7-Zip licensing and source availability. Their exact bundled source revisions and full notice/source-delivery materials still need matching. A link to a current repository is not proof of complete corresponding source for these older binaries.
- [UAC's author page](https://nsis.sourceforge.io/UAC_plug-in) lists zlib and marks the plugin deprecated; that is a maintenance signal, not proof of an exploitable vulnerability in this installer. [WinShell's page](https://nsis.sourceforge.io/WinShell_plug-in) lists Freeware, not a standard license grant that can simply be mapped to Apache. Exact-version terms remain to be recovered.

**Next software step:** map the hashed DLLs to the electron-builder toolset's source/release artifacts; retain full applicable notices and supply the required matching source through a verified compliant delivery route. Do not invent a source offer on the owner's behalf. Review installer art/uninstaller as well. Then wire the reviewed materials into packaging and validate their presence in the rebuilt installer and ZIP. No claim is made that adding this overview alone fixes compliance.

## Artwork findings and decision path

All 333 media files remain explicitly `not-established-by-this-inventory`. Of those, 103 lack an individual source record in the inspected JSON manifests. This is a provenance gap count, **not** 103 confirmed infringements: it includes locally generated placeholders and branding. It is also distinct from the earlier 89 legacy stratagem provenance/version findings.

| Group | Required resolution |
| --- | --- |
| Game equipment, faction/rank marks, logo and promotional Warbond covers | Verify a distribution use basis covering offline bundling and public downloads; retain exact file/source records. |
| Warhammer, Killzone and Halo crossover imagery | Check any additional rights-holder scope; do not assume a HELLDIVERS permission covers all franchises. |
| Wiki renders/traces, including Dogo314 credits | Check contributor terms separately from underlying game rights. Eagle Gas's recorded condition restricts use to free, publicly accessible content and requires attribution. |
| Project placeholders and generated branding | Record origin, source/generation history and review against third-party marks; do not promise exclusive copyright for AI-only output. |
| Old alternative/unused artwork and platform logos | Review or intentionally exclude from a future package after usage checks, preserving original source assets recoverably. |

[PlayStation website terms](https://www.playstation.com/en-us/legal/website-terms-of-use/) do not establish blanket permission for this app's redistribution of artwork. Website access, public image availability, free distribution and credit alone are not equivalent to a permission grant. The wiki licensing-template page returned an access error in this review; no license scope was inferred from unavailable text.

Prepared `ARTWORK_PERMISSION_REQUEST_DRAFT.md` for owner review. No email, account action or upload was made. Permission requests must identify actual asset groups, intended distribution and crossover exclusions. If permission is unavailable, choose removal or independently created non-infringing alternatives with the owner; do not silently substitute fake in-game icons.

## Reproduction and validation

Run from the active checkout on Windows with locked dependencies and the unchanged candidate present:

```text
npm run inventory:distribution
npm run verify:distribution-inventory
npm test
npm run verify:public-release
```

The first command intentionally regenerates the review snapshot. The second must be used to detect drift without accepting it. The public-release command is **expected to refuse** while recorded blockers remain. Inventory commands use the locally installed archive reader, require the reviewed plugin set and reject unexpected paths; they are local artifact checks, not mandatory dist-dependent CI unit tests. Unit tests use the checked-in snapshot and synthetic notice/listing fixtures without needing GUI processes or private profiles.

Final release requires a new inventory of its actual artifacts, not reuse of these internal 1.1.14 hashes. This review does not rerun native installation, packaged feature tests, Defender or signing. Prior runtime test results remain historical evidence in `PROTECTED_STARTUP_REVIEW.md`.

Executed results: **343/343 unit tests pass**, including six new inventory/parser checks; CSP, catalog and assets pass (247 UI references, zero missing, seven pre-existing placeholders). Regenerated inventory passes exact `--check` comparison. Public-release readiness refuses with the six outstanding gates, including the newly specific installer-license blocker; this is expected safety behavior, not a successful release test.
