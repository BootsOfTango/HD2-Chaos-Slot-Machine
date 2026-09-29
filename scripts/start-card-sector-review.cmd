@echo off
setlocal
set "HD2CSM_USER_DATA_DIR=%~dp0..\.test-data\mission-owner-review"
set "HD2CSM_AUTOMATION="
set "HD2_ELECTRON_TEST_HARNESS="
set "ELECTRON_RUN_AS_NODE="
set "PREVIEW_EXE=%~dp0..\dist\card-sector\win-unpacked\HD2 Chaos Slot Machine.exe"
if not exist "%PREVIEW_EXE%" set "PREVIEW_EXE=%~dp0..\.test-data\accepted-builds\card-sector\win-unpacked\HD2 Chaos Slot Machine.exe"
if not exist "%PREVIEW_EXE%" (
  echo The card sector preview is missing. Keep its full runtime together.
  pause
  exit /b 1
)
start "" "%PREVIEW_EXE%"
