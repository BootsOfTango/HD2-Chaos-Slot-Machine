; Fixture only. No registry, installed-app directory, Desktop or Start menu writes.
Unicode true
RequestExecutionLevel user
SilentInstall silent
AutoCloseWindow true
OutFile "${TEST_ROOT}\shell-probe.exe"
!include "${PROJECT_ROOT}\installer\integration.nsh"
Section
  StrCpy $INSTDIR "${TEST_ROOT}"
  !insertmacro HD2_BuilderSetAppId "${TEST_ROOT}\new identity.lnk" "${TEST_APP_ID}"
  WriteINIStr "${TEST_ROOT}\native.ini" "result" "wrapperSet" "$HD2ShellResult"
  !insertmacro HD2_BuilderSetAppId "${TEST_ROOT}\missing.lnk" "${TEST_APP_ID}"
  WriteINIStr "${TEST_ROOT}\native.ini" "result" "wrapperMissing" "$HD2ShellResult"
  StrCpy $0 "preserve-zero"
  StrCpy $8 "preserve-eight"
  StrCpy $R0 "preserve-Rzero"
  Push "stack-sentinel"
  !insertmacro HD2_SetShortcutAppId "${TEST_ROOT}\new identity.lnk" "${TEST_APP_ID}" $R9
  WriteINIStr "${TEST_ROOT}\native.ini" "result" "set" "$R9"
  WriteINIStr "${TEST_ROOT}\native.ini" "registers" "zero" "$0"
  WriteINIStr "${TEST_ROOT}\native.ini" "registers" "eight" "$8"
  WriteINIStr "${TEST_ROOT}\native.ini" "registers" "Rzero" "$R0"
  Pop $R8
  WriteINIStr "${TEST_ROOT}\native.ini" "registers" "stack" "$R8"
  !insertmacro HD2_SetShortcutAppId "${TEST_ROOT}\new identity.lnk" "${TEST_APP_ID}" $R9
  WriteINIStr "${TEST_ROOT}\native.ini" "result" "repeat" "$R9"
  StrCpy $7 "${TEST_ROOT}\register-input.lnk"
  StrCpy $8 "${TEST_APP_ID}"
  !insertmacro HD2_SetShortcutAppId "$7" "$8" $R9
  WriteINIStr "${TEST_ROOT}\native.ini" "result" "registerInput" "$R9"
  !insertmacro HD2_SetShortcutAppId "${TEST_ROOT}\replace identity.lnk" "${TEST_APP_ID}.old" $R9
  WriteINIStr "${TEST_ROOT}\native.ini" "result" "oldId" "$R9"
  !insertmacro HD2_SetShortcutAppId "${TEST_ROOT}\replace identity.lnk" "${TEST_APP_ID}" $R9
  WriteINIStr "${TEST_ROOT}\native.ini" "result" "replaceId" "$R9"
  !insertmacro HD2_SetShortcutAppId "${TEST_ROOT}\new identity.lnk" "" $R9
  WriteINIStr "${TEST_ROOT}\native.ini" "result" "empty" "$R9"
  !insertmacro HD2_SetShortcutAppId "${TEST_ROOT}\missing.lnk" "${TEST_APP_ID}" $R9
  WriteINIStr "${TEST_ROOT}\native.ini" "result" "missing" "$R9"
  !insertmacro HD2_SetShortcutAppId "${TEST_ROOT}\damaged.lnk" "${TEST_APP_ID}" $R9
  WriteINIStr "${TEST_ROOT}\native.ini" "result" "damaged" "$R9"
  !insertmacro HD2_SetShortcutAppId "${TEST_ROOT}\read-only.lnk" "${TEST_APP_ID}" $R9
  WriteINIStr "${TEST_ROOT}\native.ini" "result" "readonly" "$R9"
  !insertmacro HD2_SetShortcutAppId "${TEST_ROOT}\not-a-shortcut.txt" "${TEST_APP_ID}" $R9
  WriteINIStr "${TEST_ROOT}\native.ini" "result" "extension" "$R9"
  !insertmacro HD2_SetShortcutAppId "${TEST_ROOT}\new identity.lnk" "${TEST_APP_ID}${TEST_APP_ID}${TEST_APP_ID}" $R9
  WriteINIStr "${TEST_ROOT}\native.ini" "result" "longId" "$R9"
  !insertmacro HD2_SetShortcutAppId "${TEST_ROOT}\unicode-漢字.lnk" "${TEST_APP_ID}" $R9
  WriteINIStr "${TEST_ROOT}\native.ini" "result" "unicode" "$R9"
  !insertmacro HD2_UnpinShortcut "${TEST_ROOT}\new identity.lnk" $R9
  WriteINIStr "${TEST_ROOT}\native.ini" "result" "unpin" "$R9"
  !insertmacro HD2_UnpinShortcut "${TEST_ROOT}\missing.lnk" $R9
  WriteINIStr "${TEST_ROOT}\native.ini" "result" "unpinMissing" "$R9"
  !insertmacro HD2_ClearAppDestinations "" $R9
  WriteINIStr "${TEST_ROOT}\native.ini" "result" "emptyCleanup" "$R9"
  !insertmacro HD2_ClearAppDestinations "${TEST_APP_ID}" $R9
  WriteINIStr "${TEST_ROOT}\native.ini" "result" "cleanup" "$R9"
  WriteUninstaller "${TEST_ROOT}\shell-probe-uninstall.exe"
  SetErrorLevel 0
SectionEnd

; This test-only uninstaller only changes private fixture properties/INI.
; It never deletes application files, removes registry keys or touches shell folders.
Section "Uninstall"
  !insertmacro HD2_BuilderUnpin "${TEST_ROOT}\new identity.lnk"
  WriteINIStr "${TEST_ROOT}\uninstall.ini" "result" "wrapperUnpin" "$HD2ShellResult"
  !insertmacro HD2_BuilderClearDestinations "${TEST_APP_ID}"
  WriteINIStr "${TEST_ROOT}\uninstall.ini" "result" "wrapperCleanup" "$HD2ShellResult"
  !insertmacro HD2_SetShortcutAppId "${TEST_ROOT}\new identity.lnk" "${TEST_APP_ID}.uninstall" $R9
  WriteINIStr "${TEST_ROOT}\uninstall.ini" "result" "set" "$R9"
  !insertmacro HD2_UnpinShortcut "${TEST_ROOT}\new identity.lnk" $R9
  WriteINIStr "${TEST_ROOT}\uninstall.ini" "result" "unpin" "$R9"
  !insertmacro HD2_ClearAppDestinations "${TEST_APP_ID}" $R9
  WriteINIStr "${TEST_ROOT}\uninstall.ini" "result" "cleanup" "$R9"
  SetErrorLevel 0
SectionEnd
