@echo off
setlocal
rem Same owner-review saves; separate from the installed app profile.
set "HD2CSM_USER_DATA_DIR=%~dp0..\.test-data\mission-owner-review"
set "HD2CSM_AUTOMATION="
set "HD2_ELECTRON_TEST_HARNESS="
set "ELECTRON_RUN_AS_NODE="
if exist "%~dp0..\.test-data\accepted-builds\yellow-missions\win-unpacked\HD2 Chaos Slot Machine.exe" (
  rem Historical recovery runtime only. It must not open newer format-2 saves.
  echo This older preview is archived. Use the current Desktop shortcut.
  pause
  exit /b 1
)
if not exist "%~dp0..\dist\yellow-missions\win-unpacked\HD2 Chaos Slot Machine.exe" (
  echo The yellow mission / Meltagun icon preview is missing. Keep its full runtime together.
  pause
  exit /b 1
)
start "" "%~dp0..\dist\yellow-missions\win-unpacked\HD2 Chaos Slot Machine.exe"
