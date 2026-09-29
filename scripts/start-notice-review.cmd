@echo off
setlocal
rem Isolated notice-complete candidate. New M3 source foundation is not connected.
set "HD2CSM_USER_DATA_DIR=%~dp0..\.test-data\installer-notices-owner-review"
set "HD2CSM_AUTOMATION="
set "HD2_ELECTRON_TEST_HARNESS="
set "ELECTRON_RUN_AS_NODE="
set "REVIEW_RUNTIME=%~dp0..\dist\installer-notices\win-unpacked\HD2 Chaos Slot Machine.exe"
if not exist "%REVIEW_RUNTIME%" set "REVIEW_RUNTIME=%~dp0..\.test-data\accepted-builds\installer-notices\win-unpacked\HD2 Chaos Slot Machine.exe"
if not exist "%REVIEW_RUNTIME%" (
  echo The notice-complete preview is missing. Keep the complete runtime together.
  pause
  exit /b 1
)
start "" "%REVIEW_RUNTIME%"
