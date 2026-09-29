# Installer license/source materials — September 16, 2026

## Completed locally

Branch `codex/installer-license-materials`, preserving prior uncommitted work. Recovered upstream archives through their release/author pages and **matched all four separately supplied DLLs byte-for-byte** to the existing protected-startup installer's inventory:

| Component | Matched archive | License/source materials prepared |
| --- | --- | --- |
| StdUtils 1.14 | Author's October 27, 2018 ZIP | LGPL 2.1, author's clarification/README, complete source `.tbz2` |
| Nsis7z 19.00 | Author-page 19.00 `.7z` | Original license/README, plugin release sources, documented LZMA SDK 19.00 prerequisite |
| UAC 0.2.4c | Author-page ZIP | zlib notice and original source/binary ZIP |
| WinShell | Author-page ZIP | Binary identity established; full terms/source absent, still unresolved |

Sources: [StdUtils release](https://github.com/lordmulder/stdutils/releases/tag/1.14), [Nsis7z author page](https://nsis.sourceforge.io/Nsis7z_plug-in), [UAC author page](https://nsis.sourceforge.io/UAC_plug-in), [WinShell author page](https://nsis.sourceforge.io/WinShell_plug-in). Exact download URLs/hashes and plugin member hashes are recorded in `licenses/installer/manifest.json`.

The NSIS COPYING downloaded from the `nsis-3.0.4.1` toolset tag matches the existing cached toolset's COPYING SHA-256 `3c8de989f6504d52f5f8dfafedb6668cd47201f5d01f1319570727c091425dd6`. Its full terms are retained, not replaced with an SPDX guess.

The StdUtils release ZIP's embedded source TAR and separately published `.tbz2` both expand to the same 972800-byte TAR, SHA-256 `db9f98d7a947d5a6b7cd341e01edd412ea04510c5faee19a23b1e84582d86121`. This establishes the author's source/binary release association, not a reproducible compiler build. Source headers, project files and embedded third-party license files remain in the archive. Windows tar could not decompress bzip2 directly (missing filter); the existing archive reader decompressed in memory and tar listed that stream successfully. No new system tool was installed.

Nsis7z's 19.00 README names LZMA SDK 19.00 and VS 2017. The actual SDK archive was fetched from 7-zip.org and retained; this is not the different full 7-Zip source tree. Its README describes the SDK as public domain, while the plugin README retains older LGPL wording. Both original documents remain intact. Do not claim the entire plugin is public domain merely because the SDK is.

## Implemented safeguards

- `licenses/installer/` contains 12 hash-recorded, unmodified upstream legal/source files plus manifest and explanatory README. Source archives total about 1.8 MB. Some original upstream archives include prebuilt examples; they remain inert, are never invoked, and are not installed as application dependencies.
- `.gitattributes` disables text conversion for this folder so Windows/Linux checkouts preserve the reviewed bytes.
- `prepare-installer-licenses.js --prepare` only consumes already-downloaded, hash-pinned inputs, checks four DLL matches against the reviewed installer, compares the two StdUtils source TARs and refuses changed vendored files. It neither downloads automatically nor executes upstream code. Research downloads remain under ignored `.test-data/installer-license-review`.
- `npm run validate:installer-licenses` is offline and runs before future Windows builds. Unit tests exercise hashes, missing/corrupt files and unsafe paths.
- Builder `extraFiles` now includes the legal/source folder. The future ZIP verifier checks every file against the checkout, including unique ZIP membership, rather than trusting an inclusion glob alone.
- Source notices and release-gate evidence now distinguish recovered materials from the remaining WinShell/final-artifact work. No app/game artwork was altered and no copyright ownership expanded.

## Validation and unchanged artifacts

**347/347 units passed**, plus CSP/catalog/assets validation (247 UI picture references; zero missing; seven existing placeholders). Twelve-file material validation and the old candidate's exact distribution-inventory check passed. These are source/fixture checks, **not** a fresh packaged installation test.

No app launch, build, install, Defender scan, signing, Desktop write, deletion, personal-save access, commit, push, release or external message this pass. Existing installer/ZIP hashes are unchanged from `DISTRIBUTION_LICENSE_REVIEW.md`. New notices/materials are **not in that EXE yet**. The enhanced ZIP verifier deliberately will not accept an old package that lacks the new folder; do not misreport that expected incompatibility as corruption or overwrite historical evidence.

## Remaining decisions and next work

1. WinShell still needs a supported distribution-term conclusion or a tested replacement. Its author's page says Freeware; the ZIP contains only two DLLs. No license text/source was found in that archive. Other software named WinShell is unrelated and cannot supply this plugin's terms.
2. Verify the complete new installer/uninstaller and portable ZIP after the final packaging changes, including byte equality and source delivery. Do not mark the license gate passed solely because local source files exist.
3. Artwork permissions remain independent: game publishers, crossover owners and community contributors can hold different rights. `ARTWORK_PERMISSION_REQUEST_DRAFT.md` is ready for owner review but remains **unsent**. No reply/silence can be treated as permission. Source credits alone do not resolve this.
4. Full-word public branding and the safe internal-version/public-1.0 transition can be developed locally while these permissions remain open. Publication remains blocked until all recorded release gates are satisfied.

This review provides technical evidence, not a legal opinion or guarantee against copyright claims.
