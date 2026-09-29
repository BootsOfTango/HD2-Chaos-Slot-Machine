@echo off
setlocal
rem Same owner-review saves; separate from the installed app profile.
set "HD2CSM_USER_DATA_DIR=%~dp0..\.test-data\mission-owner-review"
set "HD2CSM_AUTOMATION="
set "HD2_ELECTRON_TEST_HARNESS="
set "ELECTRON_RUN_AS_NODE="
if not exist "%~dp0..\dist\galaxy-conditions\win-unpacked\HD2 Chaos Slot Machine.exe" (
  echo The galaxy conditions preview is missing. Keep its full runtime together.
  pause
  exit /b 1
)
start "" "%~dp0..\dist\galaxy-conditions\win-unpacked\HD2 Chaos Slot Machine.exe"
