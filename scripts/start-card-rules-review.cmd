@echo off
setlocal
rem Upgraded installed runtime, with the same owner-review saves as before.
rem Start-menu launches still use the separate normal Windows app-data profile.
set "HD2CSM_USER_DATA_DIR=%~dp0..\.test-data\mission-owner-review"
set "HD2CSM_AUTOMATION="
set "HD2_ELECTRON_TEST_HARNESS="
set "ELECTRON_RUN_AS_NODE="
set "HD2CSM_REVIEW_EXE=%LOCALAPPDATA%\Programs\HD2 Chaos Slot Machine\HD2 Chaos Slot Machine.exe"
if not exist "%HD2CSM_REVIEW_EXE%" (
  echo The installed app is missing. Reinstall the current approved build.
  echo Do not launch archived versions against newer saves.
  pause
  exit /b 1
)
start "" "%HD2CSM_REVIEW_EXE%"
