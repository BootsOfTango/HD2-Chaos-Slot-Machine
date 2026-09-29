@echo off
setlocal
rem Visual mission preview; preserve the existing isolated owner-review saves.
set "HD2CSM_USER_DATA_DIR=%~dp0..\.test-data\mission-owner-review"
set "HD2CSM_AUTOMATION="
set "HD2_ELECTRON_TEST_HARNESS="
set "ELECTRON_RUN_AS_NODE="
if not exist "%~dp0..\.test-data\accepted-builds\mission-visual\win-unpacked\HD2 Chaos Slot Machine.exe" (
  echo The visual mission preview is missing. Keep its complete runtime together.
  pause
  exit /b 1
)
start "" "%~dp0..\.test-data\accepted-builds\mission-visual\win-unpacked\HD2 Chaos Slot Machine.exe"
