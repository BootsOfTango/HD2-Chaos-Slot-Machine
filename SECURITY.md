# Security policy — HD2 Chaos Slot Machine

No version is guaranteed malware-free or immune to attack. Passing a dependency audit, antivirus scan or checksum check does not establish complete security.

## Download and use safely

- Obtain installer/portable files from the canonical [project Releases page](https://github.com/BootsOfTango/Helldivers-2-Roulette/releases). GitHub source archives are not installers.
- Compare downloads with the release checksums. Checksums detect byte differences; they do not authenticate the publisher if both the file and checksum are compromised.
- Current local review builds are unsigned. Do not disable antivirus, SmartScreen, Controlled Folder Access or other protections to install. An unexpected warning needs investigation, not a security exclusion.
- No Steam/game credentials or administrator account is required for ordinary app use. Do not share credentials, tokens or private saves with someone claiming to support the app.
- Back up through Results -> Export JSON before imports/updates. Importing a save is a data-replacement operation, not a way to install plugins or execute code.
- Keep Windows and security software updated. The app ships its own Electron runtime; Windows updates alone do not update that runtime. Older releases may lack later fixes.

## Reporting a suspected vulnerability

Do not publish exploits, passwords, tokens or personal save files in a public issue. Use GitHub's **Security -> Report a vulnerability** option on this repository. Private vulnerability reporting was enabled and verified on September 29, 2026. If that option is unavailable, contact the maintainer through their profile to arrange a private channel. A public request to establish contact should contain no exploit or private information. No response-time guarantee or legal safe-harbor promise is made.

Useful private details: exact version/file hash, Windows version, reproduction steps using synthetic data, expected/actual behavior, and a minimal example. Never attack other players, external services, or systems you do not control to test this application.

## Release security checks

Before publishing, review the exact locked dependencies and bundled Electron version; inspect application IPC/navigation/import/network boundaries; exclude secrets and private profiles; verify third-party notices; test installer and extracted portable runtime; scan the final artifacts; verify hashes again after download. Preserve signing requirements in the existing release workflow. Any unsigned exception must be explicitly documented, never called signed or certified.

The current local security changes are not retroactively present in previously built installers. See `docs/RELEASE_RIGHTS_SECURITY_REVIEW.md` for exact tests and unresolved work.
