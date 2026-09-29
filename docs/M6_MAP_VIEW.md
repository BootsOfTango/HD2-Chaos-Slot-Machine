# M6 first SVG map view — September 21, 2026

Branch: `codex/galaxy-map-view`. **Isolated development component; not yet integrated into index.html or the Desktop application.**

## Delivered

- The API became reachable. A successful loader probe returned 273 planets and passed a separate-instance, memory-cache offline read. A subsequent bounded loader request captured the complete normalized atlas at **2026-09-21T05:03:00.626Z**, zero issues. `assets/galaxy-atlas-bundled.json` holds that dated observation, not a live campaign list. `galaxy-atlas-provenance.json` records source, date, normalized checksum and limitations.
- All six prior coordinate anchors match the full bundle exactly. All 273 positions render; no coordinates were guessed. The fixed projection preserves the reference's broad faction orientation: Super Earth center, red upper-left, yellow right, purple below in this observation. Exact named-planet comparison with a sufficiently detailed in-game screenshot is still an owner acceptance gate.
- `assets/galaxy-map-view.js` and `.css`: reusable original SVG component with circular navigation grid, subdued decorative stars, faction-colored markers, details, alphabetical text list, search, eligible-only filter, zoom/reset, wheel zoom, mouse-drag panning, arrow-key panning and keyboard zoom/reset. The list provides keyboard-accessible inspection; selected list focus survives rerendering. Missing coordinates keep list access.
- Selection is deliberately two-stage: inspect a marker/list entry, then Choose planet. The callback receives a freshly revalidated result from the shared selector. Inactive metadata cannot become eligible; stale clicks cannot bypass changed ownership preferences. No equipment, mission, score, save or campaign state is changed by the view itself.
- All names/details are rendered as text, not HTML. The view performs no network/storage access. Map inputs/callbacks are injected. It preserves its camera on snapshot updates and removes event handlers on disposal.
- Colors mean campaign enemy where known, otherwise dated atlas ownership. Rings/spokes are explicitly **navigation grid, not sector borders**. No fabricated sector polygons, territory fills, supply lines or MO symbols are claimed as accurate. No official game image or AI mockup was bundled.

The test page is `scripts/galaxy-map-preview.html`, initialized by the isolated harness. It is not a player launcher or an installer. Its small-width responsive arrangement is specific to this component preview; the approved desktop fixed-layout policy remains unchanged and needs separate dialog integration tests.

## Verification and evidence

- Full `npm test`: **712 units**, CSP/catalog/assets passed. `.test-data/galaxy-view-units-final.log`. Eight new unit tests cover camera limits, zoom anchors, search, valid complete dated bundle, six coordinate anchors, offline first-load service use, provenance checksum and rendering/security boundaries.
- Isolated software-rendered Electron component test: **22 checks passed**. `.test-data/galaxy-view-1789967514305/report.json`; normal `will-quit` evidence is adjacent. Includes native marker clicks, wheel, background drag and keyboard reset; search/focus/filter; real 273-planet offline render; synthetic campaign callback and stale-click rejection; untrusted text and missing positions; 640-wide reachability and cleanup.
- Reviewed `galaxy-overview.png`, `galaxy-small.png` and `galaxy-small-details.png` in that evidence directory. Screenshots show the dated atlas with **no live campaign claim**. Synthetic campaigns exist only for interaction assertions, not the overview screenshots.
- Initial harness failure tried returning the function-bearing widget through Electron's serialization boundary (`galaxy-view-1789967296213`). Corrected the harness to return a primitive. Native wheel checks then exposed test-input sign and pointer/timing assumptions (`1789967402266`, `1789967480566`); corrected native delta convention, moved the pointer explicitly and used a bounded state wait. Failure evidence retained; each process quit normally and lock/PID checks preceded reruns. Passing intermediate runs are retained too.
- This is not main-application mission-flow testing, packaging, installer testing, physical Windows DPI, multi-touch pinch testing, live refresh lifecycle integration or public-release acceptance.

## Protected state

No edits to the main page this slice, no personal saves read/written, no build/version bump, cleanup, publication or Desktop duplicate. Desktop shortcut still targets `scripts/start-mission-clean-review.cmd`. Active dist remains `installer-shell` plus `mission-clean`. Installed ASAR remains `F8E05A940DA3F200796E7DAC55B4166458B7E5C18549726C63E665D7EBCC37E0`.

## Exact next

Connect this component to the main app's Change planet flow in an accessible closeable map dialog. Pass the existing war snapshot/preferences into it and route Choose through the existing manual selection/mission-context path; retain list access. Load the dated bundle without making Spin await network, wire the atlas cache and lifecycle without duplicate timers, and validate live/cache/offline/stale/locked-run behavior. Then run source GUI/restart/security and packaged checks before promoting a replacement Desktop preview. Verified sector geometry and pinch/multitouch support remain later tasks, not implied by the current mouse drag/wheel implementation.
