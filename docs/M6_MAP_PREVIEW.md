# M6 packaged galaxy map preview — September 21, 2026

Branch `codex/galaxy-map-preview`. The owner approved packaging and replacing the
Desktop preview, and confirmed the previous app was closed. No public release or
native installation was performed. Internal package version remains1.1.14;
user-facing1.0 remains a local preview.

## Delivered

Existing Desktop `HD2 Chaos Slot Machine.lnk` now targets
`scripts/start-galaxy-map-review.cmd`, which launches:

`C:\Users\Chris\HD2CSM-Development\HD2CSM-Source\dist\galaxy-map\win-unpacked\HD2 Chaos Slot Machine.exe`

The same `.test-data/mission-owner-review` profile is retained. Planet chooser
and mission Change planet open the original map; Use list instead retains the
legacy controls. Source behavior is described in `M6_APP_INTEGRATION.md`,
`M6_OFFLINE_IDENTITIES.md` and `M6_SECTORS_SUPPLY_SYNC.md`.

Installer:
`C:\Users\Chris\HD2CSM-Development\HD2CSM-Source\dist\galaxy-map\HD2-Chaos-Slot-Machine-Setup-local-galaxy-map-win-x64.exe`

ZIP is adjacent: `HD2-Chaos-Slot-Machine-local-galaxy-map-win-x64.zip`.
No installer is needed to test through the existing Desktop shortcut.

## Verification actually run

- **735 units**, CSP/catalog/assets passed; `.test-data/galaxy-map-units-final.log`.
  247 local pictures, zero missing, seven existing placeholders.
- Installer/ZIP integrity, SHA256 sidecars, embedded installer payload/notices,
  hardened Electron fuses and **456 source-file comparisons** passed;
  `.test-data/galaxy-map-artifact-inspection/report.json`. All nine new runtime
  map resources were explicitly confirmed present/source-matched. Installer and
  embedded uninstaller inspected, **not executed**.
- Actual packaged EXE: **288 workflow +13 restart +7 normal/fullscreen +33
  controlled network +5 cached restart** checks, plus **14 mission lifecycle**;
  `.test-data/packaged-smoke-1789971802927/report.json`.
  Packaged map screenshot visually reviewed:273 markers,56 sectors,274 total
  records with offline label; selected Charbal-VII and real link highlighting.
- Actual packaged transfer **31 +7 restart** checks;
  `.test-data/packaged-transfer-1789971874658/report.json`.
- Actual packaged renderer security **44** checks;
  `.test-data/packaged-security-1789971896331/report.json`.
- Defender custom scan of `dist/galaxy-map` with remediation disabled: no threats
  reported; `.test-data/galaxy-map-defender.log`. This is a bounded scan, not a
  guarantee against all malware or vulnerabilities. Authenticode: **NotSigned**.
- Post-archive resolver regression:23 passed;
  `.test-data/galaxy-map-archive-tests-final.log`.

All GUI runs were isolated, sequential, software-rendered and exited gracefully.
The first packaged run (`packaged-smoke-1789971718177`) failed a new full-map
screenshot assertion because the preceding test intentionally left a one-planet
search filter active. Confirmed will-quit, no remaining processes or test lock,
cleared view filters in the test and reran successfully. Packaged source bytes
were not changed to address that test setup issue. Failure evidence retained.

Prior151 source window checks are prior evidence, not newly packaged physical
DPI/pinch tests. Native picker interaction, audible sound, hardware rendering,
long-term stability, clean Windows install/uninstall and exact ship mission lists
remain unverified. No fresh real-server observation in this slice; network cases
used controlled responses. Exact sector borders remain unavailable in reviewed
API data; the implementation does not fabricate them.

## Hashes and preserved files

- Installer SHA256:
  `187e5c3ad53fe5c66598c175b14bea365cc9c71a53482ab206aa2a14a16a3aa4`
- Packaged ASAR:
  `45f9a3d80095ef1bfb707242ec3d6578e3039f819a347dd8bf101215d0dff93b`
- Packaged EXE:
  `13b97617467d3ddbba600d8624b7316690ca5ef9ba8b3e3bc1e8107416369cbc`
- Review save copied/hash-verified unchanged to
  `.test-data/galaxy-map-save-backup-20260921-022538/state.json`.
- Shortcut backup:
  `.test-data/desktop-galaxy-map-shortcut-20260921-022538/HD2 Chaos Slot Machine.lnk`.
- All107 superseded `mission-clean` files moved/hash-verified under
  `.test-data/accepted-builds/mission-clean`; restoration paths/hashes recorded in
  adjacent `mission-clean-move.json`. Recoverable archive, no permanent deletion.
  Do not rerun `.test-data/promote-galaxy-map.ps1`.
- Active dist only `installer-shell` (installed baseline) and `galaxy-map` (current
  Desktop preview). No duplicate Desktop files were created.
- Installed LocalAppData application ASAR unchanged:
  `F8E05A940DA3F200796E7DAC55B4166458B7E5C18549726C63E665D7EBCC37E0`.

Next: owner hands-on map review using the same Desktop shortcut. Public release
still needs outstanding rights, signing and M7 acceptance decisions; no GitHub
commit/push/tag/publication was performed.
