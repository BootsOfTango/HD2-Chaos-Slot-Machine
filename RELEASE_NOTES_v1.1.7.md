# HD2CSM v1.1.7 — local Warbond review preview

Unpublished, unsigned Windows x64 preview, September 14, 2026. Bounded M2 catalog increment; not the live-war, map, mission or full Armory redesign. Automated local acceptance passed: 174 unit tests, desktop safety/workflow, packaged Warbond controls, legacy imports, restart and old-EXE save migration. Installer/ZIP integrity and source parity passed. Exact counts and unverified native/hardware checks are recorded in `docs/M2B_WARBOND_BATCH4_TEST_REPORT.md`.

- Review 14 existing acquisitions across Masters of Ceremony, Force of Law and Dust Devils. Each has an explicit five-item rollable set; the previously reviewed Saber remains unchanged.
- Correct six stratagem associations, add full-name aliases and place the K-9 in the backpack subgroup. Preserve canonical names, stable IDs, eligibility defaults, historical Results and existing gear artwork.
- Add three original official promotional images, including a Warbond-specific Dust Devils banner. Thirteen reviewed Warbond groups support full-set ownership/include/exclude controls; separate Superstore items and custom entries stay excluded.
- Distinguish evidence: 13 new primary-source acquisitions and one community-source acquisition, Sample Scanner. Catalog now has 82 reviewed and 123 pending records, still 205 unique items. Buying a Warbond never automatically grants item ownership in HD2CSM.
- Retain software rendering, graceful fullscreen exit and exclusive/non-forcing desktop tests. These do not prove the previous Windows blue-screen cause is fixed.

Local installer: `C:\Users\Chris\Desktop\HD2CSM-Source\Helldivers-2-Chaos-Slot-Machine-Setup-v1.1.7-win-x64.exe` (moved to the top level after verification; bytes unchanged).

ZIP: `C:\Users\Chris\Desktop\HD2CSM-Source\dist\preview-v1.1.7\Helldivers-2-Chaos-Slot-Machine-v1.1.7-win-x64.zip`.

The top-level `Helldivers 2 Chaos Slot Machine` shortcut points to the isolated review launcher `scripts/start-local-preview.cmd`; the v1.1.7 profile is `dist/review-profile-v1.1.7`. Keep all portable runtime files together. Older builds, including the damaged v1.1.6 installer, were later recycled at the owner's request; see `docs/LOCAL_BUILD_LAYOUT.md`. The v1.1.3 migration-test runtime remains preserved separately.

Still separate: owner hands-on review, native installer integration/upgrade/uninstall, physical DPI/multi-monitor/trackpad, native file pickers, audible sound and long-duration stability. Public distribution needs owner approval, code-signing credentials and artwork-rights review. Nothing is published automatically.

[Source research and evidence limits](docs/M2B_WARBOND_BATCH4_RESEARCH.md).
