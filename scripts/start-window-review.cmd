@echo off
setlocal
rem Isolated review profile; does not overwrite the installed app or personal saves.
set "HD2CSM_USER_DATA_DIR=%~dp0..\.test-data\window-behavior-owner-review"
set "HD2CSM_AUTOMATION="
set "HD2_ELECTRON_TEST_HARNESS="
set "ELECTRON_RUN_AS_NODE="
if not exist "%~dp0..\.test-data\desktop-cleanup-2026-09-16\superseded-window-candidate\window-behavior-review\win-unpacked\Helldivers 2 Chaos Slot Machine.exe" (
  echo The window review build is missing. Keep its complete win-unpacked folder together.
  pause
  exit /b 1
)
start "" "%~dp0..\.test-data\desktop-cleanup-2026-09-16\superseded-window-candidate\window-behavior-review\win-unpacked\Helldivers 2 Chaos Slot Machine.exe"
