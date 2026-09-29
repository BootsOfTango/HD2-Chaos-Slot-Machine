# Themed run names — September 24, 2026

Branch `codex/themed-run-names`. Owner requested a much larger Helldivers-themed
vocabulary and names that reflect equipment intensity and battlefield context.
Local preview only, not a public release or a change to random equipment odds.

## Behavior

- Original vocabulary: 894 bank entries, 883 distinct case-folded words/compounds.
  Five elemental themes with four 16-word tiers, six general equipment roles,
  faction banks, nine environmental banks, six mission banks, neutral patriotic
  fallback vocabulary and 134 military/bureaucratic operation endings.
- Three-part grammar: equipment descriptor + contextual word + operation noun.
  It is deliberately not every word multiplied by every word: preserve relevance.
- Primary weight4, sidearm2, throwable1, four stratagems2 each, booster1. Theme
  percentage = weighted thematic contributions /16 *100. Explicit effect tags
  contribute1 or0.5. These are **editorial naming weights, not damage ratings**.
- Elemental tiers: under20,20–under45,45–under70,70+. Strongest recognized elemental
  theme leads; comparable second element can enter context vocabulary. Broad
  catalog roles are fallback when no elemental theme is known. This intentionally
  lets one fire grenade supply a mild fire accent without claiming fire dominance.
- Fire-rich planets affect context words, never inflate equipment fire percentage.
  No parsing of planet names or invented Jet Brigade/Hive Lord/SEAF activity.
  Uses only recorded metadata, not a claim about current in-game conditions.
- A deterministic content hash controls vocabulary traversal without consuming
  equipment RNG. Stratagem order and known item aliases do not change identity.
  Faction, planet, known mission ID, difficulty and metadata affect traversal.
- Name collisions compare all saved names, case-insensitively, with legacy Seed:
  prefixes stripped. A coprime traversal tries every fitting combination once,
  skipping repeated words. Only total bank exhaustion adds a serial number.
  Example fire+Automaton+Magma+ICBM bank has94,336 raw combinations (before skipping
  repeated words). No assertion that all loadouts worldwide have unique phrases.
- Another collision check runs at card creation in case a JSON import added a
  matching name after the reveal. Saved cards/imported names are never renamed.
  Deleted or cleared history no longer reserves names. No save-schema migration.
- Revealed names wrap within the existing panel. Hover help clarifies that these
  are codenames, not performance scores or codes that recreate a roll.

The feature does not prevent repeated equipment combinations. It distinguishes
new run names against the current collection. Run scores, locks, ownership,
loadout eligibility and random selection remain unchanged.

## Item theme coverage and evidence

Identity-based profiles in `assets/run-names.js` are curated qualitative tags;
unknown/custom gear is neutral. Broad role fallback uses shipped catalog
subgroups. This is an initial theme profile, not an exhaustive combat-mechanics
audit of every newly released weapon. Expand profiles only after reviewing gear.
In particular Scorcher is energy, not a flamethrower, and Hot-Shot does not get
fire tags merely because its name sounds hot. Partial fire effects use half
weight; no assertion of actual damage ratios.

Primary references reviewed for relevant effect identity (not naming weights):

- [Freedom's Flame](https://blog.playstation.com/2024/07/30/new-helldivers-2-freedoms-flame-warbond-burns-bright-on-august-8/): Torcher/Crisper flames, Cookout incendiary ammunition, Firebomb Hellpods.
- [Chemical Agents](https://blog.playstation.com/2024/09/12/helldivers-2-the-chemical-agents-warbond-launches-sept-19/): gas sprayer/drone/grenade and utility pistol.
- [Urban Legends](https://blog.playstation.com/2024/12/13/helldivers-2-urban-legends-warbond-drops-today/): Flame Sentry and defensive equipment.
- [Entrenched Division](https://blog.playstation.com/2026/03/10/helldivers-2-entrenched-division-premium-warbond-out-march-17/): Cremator, Stoker's fire attachment, Gas Mortar and explosive grenade.
- [Dust Devils](https://blog.playstation.com/2025/08/26/helldivers-2-into-the-unjust-launches-september-2/): Coyote incendiary ammunition, gas-impact Speargun, Expendable Napalm, Pineapple and Solo Silo.
- [Python Commandos](https://blog.playstation.com/2025/11/25/helldivers-2-python-commandos-premium-warbond-airdrops-dec-2/): Hot Dog flamethrower drone, checked in indexed official text after page timeout.
- [Cutting Edge](https://blog.playstation.com/2024/03/07/helldivers-2-new-warbond-launches-march-14-first-look-at-new-weapons-armor-and-more/): distinguishes arc, laser and plasma equipment.
- [Democratic Detonation](https://blog.playstation.com/?p=390656): explosive weapons and burning thermite.

Names and vocabulary were composed for this project, not copied from an official
operation-name list. This is not a blanket trademark/copyright clearance claim.

## Verification

- 767 units including 14 naming checks; `.test-data/themed-names-units-final.log`.
  CSP, catalog and local assets passed:247 images,0 missing,7 old placeholders.
- 2,000 varied synthetic runs generated distinct three-part names; full fitting
  bank exhaustion and serial fallback tested. Also intensity thresholds, unknown
  gear, partial effects, source IDs/aliases, mixed themes, no mutation/RNG use,
  recorded context and prefixed/case-insensitive legacy collisions.
- 300 source workflow +18 restart checks:
  `.test-data/electron-smoke-1790222591642/report.json`.
  Includes real UI confirmation, wrapped name reveal, card literal persistence,
  JSON round-trip and existing workflow regressions.
- 151 source window checks:
  `.test-data/window-smoke-1790222685494/report.json`.
  These use Electron zoom, not physical Windows DPI validation.

## Packaged checks and handoff

- Installer and portable ZIP verified, including checksums, embedded runtime,
  notices, hardened fuses and458 source-file comparisons:
  `.test-data/themed-names-artifact-inspection/report.json`.
- Actual packaged EXE:296 workflow,13 restart,7 normal/fullscreen startup,
  33 controlled network and5 cached-restart checks:
  `.test-data/packaged-smoke-1790222879352/report.json`.
- Packaged transfer31+7 restart:
  `.test-data/packaged-transfer-1790222949393/report.json`.
- Packaged security44:
  `.test-data/packaged-security-1790222957781/report.json`.
- Post-archive resolver25:
  `.test-data/themed-names-archive-tests.log`.
- Defender custom scan with remediation disabled found no threats:
  `.test-data/themed-names-defender.log`. Not a security guarantee.
  Installer remains unsigned. Installer/uninstaller inspected, not executed.

GUI tests were isolated/sequential/software-rendered with graceful exits.
Names were tested through actual confirmation and JSON persistence. Results
screenshot inspected; naming-panel wrapping checked by renderer dimensions.
Physical Windows DPI/gestures, audio listening and long stability remain untested.
No new real-server sync claim for this naming slice.

Existing Desktop shortcut now targets `scripts/start-themed-names-review.cmd`,
retaining `.test-data/mission-owner-review`. No reinstallation required.
Installer:
`C:\Users\Chris\HD2CSM-Development\HD2CSM-Source\dist\themed-names\HD2-Chaos-Slot-Machine-Setup-local-themed-names-win-x64.exe`
Portable ZIP is adjacent: `HD2-Chaos-Slot-Machine-local-themed-names-win-x64.zip`.

- Installer SHA256: `e59f442f937d2f1f3c6fa7a066c6905ef0b98ad0624e68b8b94ad10f48c89b7e`
- ZIP SHA256: `2f73c33405546b3ee403ba6a6869fa34b9b46ad203bce75338031c8d04c6f135`
- ASAR SHA256: `9f2c656167640946cff902aa342a473cf2704b7f945c2ee99e9a4b2a0b7af6c5`
- EXE SHA256: `92de8aa45ea4a7bfb0fc43e21fc5aaf0ee8f23dfe1102c7cb92a28963698b76c`

Save/shortcut backup `.test-data/themed-names-promotion-20260924-000944`.
All107 superseded galaxy-conditions files moved/hash-verified under
`.test-data/accepted-builds/galaxy-conditions`; adjacent recovery manifest
`galaxy-conditions-move.json`. Review save and installed baseline unchanged.
Active dist only `installer-shell` + `themed-names`; no Desktop duplicates or
permanent deletion. **Do not rerun promote-themed-names.ps1.**
No version bump or GitHub commit/push/tag/publication.

Next: owner review of newly generated names and any vocabulary/weight feedback.
Map special-activity provider research and saved-card sector visuals remain queued.
