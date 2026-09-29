@echo off
setlocal
rem Isolated local review; never changes the installed app or personal profile.
set "HD2CSM_USER_DATA_DIR=%~dp0..\.test-data\runtime-security-owner-review"
set "HD2CSM_AUTOMATION="
set "HD2_ELECTRON_TEST_HARNESS="
set "ELECTRON_RUN_AS_NODE="
if not exist "%~dp0..\.test-data\desktop-cleanup-2026-09-16\superseded-runtime-security-candidate\runtime-security-review\win-unpacked\Helldivers 2 Chaos Slot Machine.exe" (
  echo The runtime security build is missing. Keep the full runtime folder together.
  pause
  exit /b 1
)
start "" "%~dp0..\.test-data\desktop-cleanup-2026-09-16\superseded-runtime-security-candidate\runtime-security-review\win-unpacked\Helldivers 2 Chaos Slot Machine.exe"
