@echo off
setlocal
rem Isolated local review; never changes the installed app or personal profile.
set "HD2CSM_USER_DATA_DIR=%~dp0..\.test-data\protected-startup-owner-review"
set "HD2CSM_AUTOMATION="
set "HD2_ELECTRON_TEST_HARNESS="
set "ELECTRON_RUN_AS_NODE="
if not exist "%~dp0..\.test-data\desktop-cleanup-2026-09-16\superseded-protected-startup-candidate\protected-startup-review\win-unpacked\Helldivers 2 Chaos Slot Machine.exe" (
  echo The protected startup build is missing. Keep the complete runtime together.
  pause
  exit /b 1
)
start "" "%~dp0..\.test-data\desktop-cleanup-2026-09-16\superseded-protected-startup-candidate\protected-startup-review\win-unpacked\Helldivers 2 Chaos Slot Machine.exe"
