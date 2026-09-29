@echo off
setlocal
rem Isolated full-name preview; never uses the installed app or personal profile.
set "HD2CSM_USER_DATA_DIR=%~dp0..\.test-data\combined-preview-owner-review"
set "HD2CSM_AUTOMATION="
set "HD2_ELECTRON_TEST_HARNESS="
set "ELECTRON_RUN_AS_NODE="
if not exist "%~dp0..\.test-data\accepted-builds\combined-preview\win-unpacked\HD2 Chaos Slot Machine.exe" (
  echo The combined preview is missing. Keep the complete runtime together.
  pause
  exit /b 1
)
start "" "%~dp0..\.test-data\accepted-builds\combined-preview\win-unpacked\HD2 Chaos Slot Machine.exe"
