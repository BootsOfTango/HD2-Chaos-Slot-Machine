# Unified HD2 Chaos Slot Machine 1.0 handoff

Prepared September 29, 2026. **Not yet published.** The owner rejected a separate stream-only release: local acceptance, GitHub downloads, branding, changelog and update instructions are one deliverable. Streaming follows the completed release preparation, not a substitute for it.

## Identity and repository

- Canonical repository: [BootsOfTango/HD2-Chaos-Slot-Machine](https://github.com/BootsOfTango/HD2-Chaos-Slot-Machine), renamed in place with the same repository ID1166485092 and preserved history. Description updated; local origin and active support/API-contact links match.
- Product/app/Setup/ZIP: **HD2 Chaos Slot Machine 1.0**. Distinct intended tag `hd2-chaos-slot-machine-v1.0.0`; do not reuse old tags or replace historical assets.
- Source channel is `release`; that describes prepared package presentation, not GitHub publication. Internal compatibility version1.1.14, app ID, normal profile path and old import aliases stay unchanged to protect upgrades.
- Application updates are manual Setup upgrades. War-data refresh does not update software/catalogs. No auto-updater is claimed or newly added. Internal `latest.yml` and blockmaps are not player-facing downloads.
- Current README remains explicit that publication is pending. Historical reports/tags keep their original names and dated findings; do not rewrite history to look like new evidence.

## Exact prepared files

Output: `dist/release-final`. These are new bytes, not the previous local-preview candidate.

| File | SHA-256 |
| --- | --- |
| HD2-Chaos-Slot-Machine-Setup-v1.0.0-win-x64.exe | `bf1d0557b87fee242730ad7931423d567c548e9532e54701c73b2f6f44368cc5` |
| HD2-Chaos-Slot-Machine-v1.0.0-win-x64.zip | `1aeae708cfb00638ce7e7cefa8c0648dd41a96c2b395ed2b67962ae70028eb98` |

ASAR: `89893b2bc9f1b86065869afd5ba725bbc6aea3dc42798242cd46e2ec403a80cf`.

`RELEASE-NOTES.md` is generated from the reviewed note source and actual binary hashes; it contains exact future download URLs, installation, changes, upgrade/save caveats and unsigned warnings. These URLs become available only when that release is published. No public link is claimed active yet.

The release workflow transports four explicit download files plus generated notes by immutable artifact ID. It verifies filenames, binary/checksum parity and note digest entries before creating a **draft only**. It no longer generates placeholder prose. Release writer has no source checkout and runs no downloaded scripts/executables. If a hosted build is selected for publication instead, record its distinct hashes and install/test those exact bytes locally before claiming identical local/download packages. Do not treat another build's hashes as these files.

## Verified evidence

- Source:924/924 local tests; CSP/catalog/assets pass. Focused release/identity/guide/refresh/lifecycle guards:58 pass. Dependency audit:0 known vulnerabilities at preparation.
- Package inspection:552 ASAR files match source; ZIP/Setup payloads, bundled guide/component notices and hardening fuses verified. `.test-data/release-final-artifact-inspection/report.json`.
- Actual packaged EXE:333 workflow,16 restart,9 startup/fullscreen,33 controlled-network and5 cache checks; card rules25+6; transfer31+7+3 real backend checks; renderer security44. All app exits graceful; synthetic profiles only. Reports `packaged-smoke-1790721215798`, `packaged-smoke-1790721285009`, `packaged-transfer-1790721291451`, `packaged-security-1790721299767` under `.test-data`.
- Exact app/Setup/embedded uninstaller all verified **NotSigned** as intended. Defender custom scan of the final output exited0 and reported no threats. Logs `.test-data/unified-release-signatures.log` and `unified-release-defender.log`. Bounded checks, not a security guarantee.
- Owner installation: fresh398-file verified backup, Setup exit0,99 installed runtime files and exact uninstaller match;295 personal/review/legacy profile files unchanged. Existing Desktop shortcut restored byte-for-byte to preserve its review-card route; Start uses the normal profile. Recovery `.test-data/unified-release-upgrade-2026-09-29`; do not rerun its one-off promotion.
- Actual installed final EXE then passed333+16+9+33+5 checks with an isolated synthetic profile and graceful shutdown. Report `.test-data/packaged-smoke-1790721435395/report.json`; owner cards were not used for testing.
- Desktop canonical `HD2CSM` folder replaced with this same Setup/ZIP, their checksums, matching guide and generated release notes. Six old kit files moved/hash-verified into the private recovery directory, not permanently deleted. No personal data or developer shortcuts in the download kit. No extra Desktop app/runtime copy.

## Remaining before calling the handoff ready

1. Record fresh hosted CI on the renamed repository/current commit. Earlier hosted273-check lifecycle remains valid for its recorded prior commit; do not call it a run on these new bytes. The final installed-EXE check above is complete.
2. Record the owner's explicit artwork-use decision. Authentic images retained; attribution is not confirmed permission. Risk acknowledgement must never be described as rights-holder clearance. No rights-holder request sent.
3. Finish truthful readiness evidence and select one exact file set for the GitHub draft. If rebuilt, repeat hash-bound package/scan and matching local installation checks. No silent asset replacement.
4. Prepare the tag/draft against the approved source, verify uploaded/downloaded bytes and complete README publication status. Publish only after owner approval. Main remains unmerged and no new release is public at this checkpoint.

Broader physical audio/DPI, tools-free consumer Windows, all-users, native-picker and disconnected-install acceptance limitations remain documented; automated Windows Server tests must not be represented as all of those scenarios.
