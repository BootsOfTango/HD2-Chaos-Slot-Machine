@echo off
setlocal
rem Local review using isolated saves; does not run Setup or alter installed data.
set "HD2CSM_USER_DATA_DIR=%~dp0..\.test-data\installer-shell-owner-review"
set "HD2CSM_AUTOMATION="
set "HD2_ELECTRON_TEST_HARNESS="
set "ELECTRON_RUN_AS_NODE="
if not exist "%~dp0..\dist\installer-shell\win-unpacked\HD2 Chaos Slot Machine.exe" (
  echo The installer-shell preview is missing. Keep the complete runtime together.
  pause
  exit /b 1
)
start "" "%~dp0..\dist\installer-shell\win-unpacked\HD2 Chaos Slot Machine.exe"
