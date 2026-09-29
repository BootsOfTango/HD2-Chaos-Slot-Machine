@echo off
setlocal
rem Commando and city mission review; same isolated owner-review saves.
set "HD2CSM_USER_DATA_DIR=%~dp0..\.test-data\mission-owner-review"
set "HD2CSM_AUTOMATION="
set "HD2_ELECTRON_TEST_HARNESS="
set "ELECTRON_RUN_AS_NODE="
if not exist "%~dp0..\.test-data\accepted-builds\mission-city\win-unpacked\HD2 Chaos Slot Machine.exe" (
  echo The mission preview is missing. Keep its full runtime together.
  pause
  exit /b 1
)
start "" "%~dp0..\.test-data\accepted-builds\mission-city\win-unpacked\HD2 Chaos Slot Machine.exe"
