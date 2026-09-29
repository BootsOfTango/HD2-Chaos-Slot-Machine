@echo off
setlocal
rem Same owner-review saves; separate from the installed app profile.
set "HD2CSM_USER_DATA_DIR=%~dp0..\.test-data\mission-owner-review"
set "HD2CSM_AUTOMATION="
set "HD2_ELECTRON_TEST_HARNESS="
set "ELECTRON_RUN_AS_NODE="
set "REVIEW_EXE=%~dp0..\dist\mission-art-final\win-unpacked\HD2 Chaos Slot Machine.exe"
if not exist "%REVIEW_EXE%" set "REVIEW_EXE=%~dp0..\.test-data\accepted-builds\mission-art-final\win-unpacked\HD2 Chaos Slot Machine.exe"
if not exist "%REVIEW_EXE%" (
  echo The final mission artwork preview is missing. Keep its full runtime together.
  pause
  exit /b 1
)
start "" "%REVIEW_EXE%"
