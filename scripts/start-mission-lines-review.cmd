@echo off
setlocal
rem Refined line icons, existing isolated owner-review profile.
set "HD2CSM_USER_DATA_DIR=%~dp0..\.test-data\mission-owner-review"
set "HD2CSM_AUTOMATION="
set "HD2_ELECTRON_TEST_HARNESS="
set "ELECTRON_RUN_AS_NODE="
if not exist "%~dp0..\.test-data\accepted-builds\mission-lines\win-unpacked\HD2 Chaos Slot Machine.exe" (
  echo The mission line icons preview is missing. Keep its complete runtime together.
  pause
  exit /b 1
)
start "" "%~dp0..\.test-data\accepted-builds\mission-lines\win-unpacked\HD2 Chaos Slot Machine.exe"
