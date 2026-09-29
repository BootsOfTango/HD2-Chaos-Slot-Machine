; Original HD2 Chaos Slot Machine integration, Apache-2.0 (root LICENSE.txt).
; Included in BOTH passes of the stock electron-builder NSIS script.
!ifndef HD2_BUILDER_SHELL_INCLUDED
!define HD2_BUILDER_SHELL_INCLUDED
!include "${__FILEDIR__}\shell-properties.nsh"
Var HD2ShellResult

!macro HD2_BuilderSetAppId shortcut appId
  !insertmacro HD2_SetShortcutAppId "${shortcut}" "${appId}" $HD2ShellResult
  ${If} $HD2ShellResult < 0
    DetailPrint "WARNING: Shortcut identity could not be saved: ${shortcut} (HRESULT $HD2ShellResult)"
    ; Keep the installed app usable, but do not silently hide shortcut failures.
    ; A silent installer retains this warning in the installation directory.
    Push $0
    FileOpen $0 "$INSTDIR\installer-shell-warnings.log" a
    IfErrors +3
    FileWrite $0 "Shortcut identity failed: ${shortcut}; HRESULT $HD2ShellResult$\r$\n"
    FileClose $0
    Pop $0
    MessageBox MB_OK|MB_ICONEXCLAMATION "The application was installed, but Windows could not save a shortcut identity. The shortcut may not group correctly on the taskbar. See installer-shell-warnings.log in the installation folder." /SD IDOK
  ${EndIf}
!macroend

!macro HD2_BuilderUnpin shortcut
  !insertmacro HD2_UnpinShortcut "${shortcut}" $HD2ShellResult
  DetailPrint "Shortcut unpin request: ${shortcut} (HRESULT $HD2ShellResult; actual pin removal is Windows-controlled)"
!macroend

!macro HD2_BuilderClearDestinations appId
  !insertmacro HD2_ClearAppDestinations "${appId}" $HD2ShellResult
  DetailPrint "Application jump-list cleanup request (HRESULT $HD2ShellResult)"
!macroend
!endif
