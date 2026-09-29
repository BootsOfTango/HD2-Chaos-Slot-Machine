@echo off
setlocal
rem Same owner-review saves; separate from the installed app profile.
set "HD2CSM_USER_DATA_DIR=%~dp0..\.test-data\mission-owner-review"
set "HD2CSM_AUTOMATION="
set "HD2_ELECTRON_TEST_HARNESS="
set "ELECTRON_RUN_AS_NODE="
set "HD2CSM_REVIEW_RUNTIME=%~dp0..\dist\card-planets\win-unpacked\HD2 Chaos Slot Machine.exe"
if not exist "%HD2CSM_REVIEW_RUNTIME%" set "HD2CSM_REVIEW_RUNTIME=%~dp0..\.test-data\accepted-builds\card-planets\win-unpacked\HD2 Chaos Slot Machine.exe"
if not exist "%HD2CSM_REVIEW_RUNTIME%" (
  echo The saved planet preview is missing. Keep its full runtime together.
  pause
  exit /b 1
)
start "" "%HD2CSM_REVIEW_RUNTIME%"
