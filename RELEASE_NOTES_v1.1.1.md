# HD2CSM v1.1.1 — local fullscreen preview

Local review only. Not published or approved for public distribution.

- Normal desktop launches start in true fullscreen.
- F11 and a keyboard-accessible toolbar button toggle fullscreen. Escape closes the current custom dialog first; when none is open it exits fullscreen.
- Windowed mode can shrink to 640 × 480. The desktop canvas stays at least 1280 CSS pixels wide, with native scrollbars and Space-drag on empty backgrounds.
- Dialogs remain sized to the actual window, with focus containment and return focus. Background tab shortcuts are disabled while a dialog is open.
- The standalone browser version retains responsive layout behavior.
- Build-tool security patch updates are confined to three compatible transitive dependencies; no Electron/builder feature upgrade.

Saves and export format are unchanged. New gear, all-faction planet rerolls, scheduled war refresh, richer missions, visual Armory and galaxy map are **not** in this preview; see `docs/ROADMAP.md`.

This local installer is unsigned. Windows may display an unknown-publisher/SmartScreen warning. No credentials or development tools are needed to run the packaged app, but trusted public distribution still needs Windows code-signing configuration.
