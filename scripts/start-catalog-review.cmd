@echo off
setlocal
rem Local candidate only, with isolated review saves and no developer tools needed.
set "HD2CSM_USER_DATA_DIR=%~dp0..\.test-data\hyena-revenants-owner-review"
set "HD2CSM_AUTOMATION="
set "HD2_ELECTRON_TEST_HARNESS="
set "ELECTRON_RUN_AS_NODE="
if not exist "%~dp0..\.test-data\desktop-cleanup-2026-09-16\superseded-hyena-revenants-candidate\hyena-revenants-review\win-unpacked\Helldivers 2 Chaos Slot Machine.exe" (
  echo The catalog review build is missing. Keep its whole win-unpacked folder together.
  pause
  exit /b 1
)
start "" "%~dp0..\.test-data\desktop-cleanup-2026-09-16\superseded-hyena-revenants-candidate\hyena-revenants-review\win-unpacked\Helldivers 2 Chaos Slot Machine.exe"
