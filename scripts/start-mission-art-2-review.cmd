@echo off
setlocal
rem Same owner-review saves; separate from the installed app profile.
set "HD2CSM_USER_DATA_DIR=%~dp0..\.test-data\mission-owner-review"
set "HD2CSM_AUTOMATION="
set "HD2_ELECTRON_TEST_HARNESS="
set "ELECTRON_RUN_AS_NODE="
set "REVIEW_RUNTIME=%~dp0..\dist\mission-art-2\win-unpacked\HD2 Chaos Slot Machine.exe"
if not exist "%REVIEW_RUNTIME%" set "REVIEW_RUNTIME=%~dp0..\.test-data\accepted-builds\mission-art-2\win-unpacked\HD2 Chaos Slot Machine.exe"
if not exist "%REVIEW_RUNTIME%" (
  echo The mission artwork batch 2 preview is missing. Keep its full runtime together.
  pause
  exit /b 1
)
start "" "%REVIEW_RUNTIME%"
