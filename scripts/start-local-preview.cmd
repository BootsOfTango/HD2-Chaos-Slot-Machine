@echo off
setlocal
rem Review only: the normal application path, with a separate save directory.
set "HD2CSM_USER_DATA_DIR=%~dp0..\dist\review-profile-v1.1.5"
set "HD2CSM_AUTOMATION="
set "HD2_ELECTRON_TEST_HARNESS="
set "ELECTRON_RUN_AS_NODE="
if not exist "%~dp0..\dist\win-unpacked\Helldivers 2 Chaos Slot Machine.exe" (
  echo The local preview build is missing. Expected dist\win-unpacked.
  pause
  exit /b 1
)
start "" "%~dp0..\dist\win-unpacked\Helldivers 2 Chaos Slot Machine.exe"
