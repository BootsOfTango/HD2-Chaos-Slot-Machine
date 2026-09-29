@echo off
setlocal
rem Isolated live-war review. Personal saves and the installed app are not used.
set "HD2CSM_USER_DATA_DIR=%~dp0..\.test-data\live-war-owner-review"
set "HD2CSM_AUTOMATION="
set "HD2_ELECTRON_TEST_HARNESS="
set "ELECTRON_RUN_AS_NODE="
set "HD2CSM_REVIEW_EXE=%~dp0..\dist\live-war\win-unpacked\HD2 Chaos Slot Machine.exe"
if not exist "%HD2CSM_REVIEW_EXE%" set "HD2CSM_REVIEW_EXE=%~dp0..\.test-data\accepted-builds\live-war\win-unpacked\HD2 Chaos Slot Machine.exe"
if not exist "%HD2CSM_REVIEW_EXE%" (
  echo The live-war preview is missing. Keep the complete runtime together.
  pause
  exit /b 1
)
start "" "%HD2CSM_REVIEW_EXE%"
