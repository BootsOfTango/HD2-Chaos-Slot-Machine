# HD2 Chaos Slot Machine v1.1.1 verification

Verified September 29, 2026. This report identifies the final local Windows x64 downloads; a report alone does not prove publication. Check the [release page](https://github.com/BootsOfTango/HD2-Chaos-Slot-Machine/releases/tag/hd2-chaos-slot-machine-v1.1.1) for availability.

## Exact files

| File | SHA-256 |
| --- | --- |
| HD2-Chaos-Slot-Machine-Setup-v1.1.1-win-x64.exe | `e171f7000f7de7d0b367a7f93d56b0ccd78395d62d972618dd5cd60eab4131c5` |
| HD2-Chaos-Slot-Machine-v1.1.1-win-x64.zip | `5a82f53b679713bd592b6ab73c53eb7137345b226e563178443cb72cd1310db1` |

The inspected app archive is `c8a5ffde865ec1a6146c86f66b14e52520b2bd569a1f6ba8316d4b9a03bbb785`; executable is `b4da37dd64aad604db841fa9197474c245bd10c4cd16af45f4b7a8c952bfa743`. Public/display version is **1.1.1**; internal package/Windows version intentionally remains **1.1.14** for upgrade compatibility. Save identities are unchanged. Electron is **44.4.5**.

## Observed checks

- **925/925 source tests**, renderer CSP, catalog and asset validation pass. Dependency audit reports **0 known vulnerabilities** at verification time.
- Final ZIP and Setup payload inspection passes: **552 bundled source files** match local source, component notices and installer plugin inventories match, hardened Electron fuses verified. README includes the creator introduction and final v1.1.1 download instructions. Earlier pre-final-README bytes were archived, not promoted.
- Actual packaged EXE: **333 workflow**, **16 restart**, **9 startup/fullscreen**, **33 controlled-network**, **5 war-cache restart** checks pass. All processes exit gracefully using isolated synthetic profiles.
- Card-rule migration/recalibration **25 + 6** checks pass; renderer security **44** pass; export/import transfer **31 + 7** checks pass, including restart persistence. Personal cards are not used in these tests.
- Exact final directory scanned with Windows Defender: exit 0, no threats found. App, Setup and embedded uninstaller are verified **NotSigned**, matching the approved unsigned distribution. These checks are not a security guarantee or trusted publisher signature.
- GitHub source, Linux and Windows lifecycle CI passed on version-corrected commit `342969b6be6a32b1286fe5856ccfc8e58b211bac`: runs [36644601911](https://github.com/BootsOfTango/HD2-Chaos-Slot-Machine/actions/runs/36644601911), [36644601939](https://github.com/BootsOfTango/HD2-Chaos-Slot-Machine/actions/runs/36644601939), [36644601908](https://github.com/BootsOfTango/HD2-Chaos-Slot-Machine/actions/runs/36644601908). The release PR must also have all current-head checks green before merge; earlier run IDs are not a claim about later commits. Hosted lifecycle artifacts are separately built, not these identical local bytes.
- The earlier failed local smoke run expected public version 1.0.0. Updated that strict test assertion to 1.1.1 (retaining the distinct 1.1.14 compatibility check), then rebuilt for final README parity and reran all checks above. The earlier hosted compiler timeout was bounded at 60 seconds with spawn errors surfaced; selectors and product behavior were not relaxed.

## Distribution decisions and limits

The owner explicitly approved publishing **v1.1.1 with the existing images**, knowing redistribution permission is unconfirmed. Artwork status is **owner-accepted-risk**, not copyright clearance. Credits and notices remain; no rights-holder approval is claimed. See [distribution decisions](DISTRIBUTION_DECISIONS.md). Technical release checks cannot be waived through that artwork-specific decision.

The owner requested the installed app be removed for their own installation test. It remains uninstalled; existing profiles and verified recovery copies stay intact. Only the canonical Desktop download kit is to be updated, with previous files archived off Desktop. Do not automatically run Setup or merge personal/review profiles.

Consumer-Windows wizard clicks, all-users installation, audible listening, all DPI/hardware combinations and long-duration gameplay are not covered by these automated checks. Hosted lifecycle uses Windows Server with preinstalled tools. Live war data is community-sourced and delayed; it is not second-by-second game state. Unsigned downloads can show Windows warnings; do not disable protections.

## Private evidence index

Evidence stays outside public packages and Git: `.test-data/release-v1.1.1-final-*.log`, `.test-data/release-1-1-1-artifact-inspection/report.json`, workflow `packaged-smoke-1790724698993`, card rules `packaged-smoke-1790724766853`, security `packaged-security-1790724772950`, transfer `packaged-transfer-1790724775375`. The publication helper records current-head checks, immutable merge/tag, uploaded asset IDs, downloaded-byte verification and preserved historical release IDs in `.test-data/v1.1.1-publication.json` as each step succeeds. Never treat a missing step as completed.
