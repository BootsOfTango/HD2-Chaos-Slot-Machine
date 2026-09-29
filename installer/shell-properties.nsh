; HD2 Chaos Slot Machine -- original shell helper, Apache-2.0.
; Uses licensed NSIS core System.dll/COM headers and documented Windows APIs.
; Integrated through guarded stock-builder template substitutions.
; Callers must supply their own exact shortcut/app ID, never a wildcard/default ID.
!ifndef HD2_SHELL_PROPERTIES_INCLUDED
!define HD2_SHELL_PROPERTIES_INCLUDED
!include LogicLib.nsh
!include Win\COM.nsh
!include Win\Propkey.nsh

; Modifies only AppUserModel.ID of an EXISTING shortcut. Returns HRESULT;
; nonnegative means successful SetValue, Commit and Save. Does not create/resolve a link,
; launch its target, alter its arguments, or suppress an error as success.
; All registers are restored except the explicitly supplied result register.
!macro HD2_SetShortcutAppId shortcut appId result
  ; Capture inputs before borrowing registers (arguments may themselves be $7/$8).
  Push "${shortcut}"
  Push "${appId}"
  System::Store "S"
  Pop $7
  Pop $8
  StrCpy $0 0
  StrCpy $1 0
  StrCpy $2 0
  StrCpy $3 0
  StrCpy $4 0
  StrCpy $5 0
  StrCpy $6 -1
  StrCpy $9 0x80070057 ; E_INVALIDARG
  ${Do}
    ${If} $7 == ""
      ${Break}
    ${EndIf}
    StrLen $9 $7
    ${If} $9 > 128
      StrCpy $9 0x80070057
      ${Break}
    ${EndIf}
    StrCpy $9 $8 4 -4
    ${If} $9 != ".lnk"
      StrCpy $9 0x80070057
      ${Break}
    ${EndIf}
    System::Call 'ole32::CoInitializeEx(p0,i2)i.r6'
    StrCpy $9 $6
    ${If} $9 < 0
      ${Break}
    ${EndIf}
    !insertmacro ComHlpr_CreateInProcInstance ${CLSID_ShellLink} ${IID_IShellLink} r0 ".r9"
    ${If} $9 < 0
      ${Break}
    ${EndIf}
    ${IUnknown::QueryInterface} $0 '("${IID_IPersistFile}",.r1).r9'
    ${If} $9 < 0
      ${Break}
    ${EndIf}
    ${IPersistFile::Load} $1 '(r8,2).r9'
    ${If} $9 < 0
      ${Break}
    ${EndIf}
    ${IUnknown::QueryInterface} $0 '("${IID_IPropertyStore}",.r2).r9'
    ${If} $9 < 0
      ${Break}
    ${EndIf}
    System::Call 'oleaut32::SysAllocString(w r7)p.r5'
    System::Call '*${SYSSTRUCT_PROPERTYKEY}(${PKEY_AppUserModel_ID})p.r3'
    System::Call '*${SYSSTRUCT_PROPVARIANT}(${VT_BSTR},,p r5)p.r4'
    ${If} $3 P= 0
    ${OrIf} $4 P= 0
    ${OrIf} $5 P= 0
      StrCpy $9 0x8007000E ; E_OUTOFMEMORY
      ${Break}
    ${EndIf}
    ${IPropertyStore::SetValue} $2 '(r3,r4).r9'
    ; Accept S_OK/S_FALSE, but not positive truncation warnings.
    ${If} $9 > 1
      StrCpy $9 0x80004005
    ${EndIf}
    ${If} $9 < 0
      ${Break}
    ${EndIf}
    ${IPropertyStore::Commit} $2 '().r9'
    ${If} $9 < 0
      ${Break}
    ${EndIf}
    ${IPersistFile::Save} $1 '(r8,1).r9'
    ${Break}
  ${Loop}
  System::Call 'oleaut32::SysFreeString(p r5)'
  ${If} $4 P<> 0
    System::Free $4
  ${EndIf}
  ${If} $3 P<> 0
    System::Free $3
  ${EndIf}
  !insertmacro ComHlpr_SafeRelease $2
  !insertmacro ComHlpr_SafeRelease $1
  !insertmacro ComHlpr_SafeRelease $0
  ${If} $6 >= 0
    System::Call 'ole32::CoUninitialize()'
  ${EndIf}
  Push $9
  System::Store "L"
  Pop ${result}
!macroend

; Requests supported Windows unpin cleanup, but never deletes a shortcut.
; API success is NOT proof a Windows 10/11 pin was removed; observe separately.
!macro HD2_UnpinShortcut shortcut result
  System::Store "S"
  StrCpy $8 "${shortcut}"
  StrCpy $0 0
  StrCpy $1 0
  StrCpy $6 -1
  StrCpy $9 0x80070057
  ${Do}
    ${If} $8 == ""
      ${Break}
    ${EndIf}
    StrCpy $9 $8 4 -4
    ${If} $9 != ".lnk"
      StrCpy $9 0x80070057
      ${Break}
    ${EndIf}
    System::Call 'ole32::CoInitializeEx(p0,i2)i.r6'
    StrCpy $9 $6
    ${If} $9 < 0
      ${Break}
    ${EndIf}
    System::Call 'shell32::SHCreateItemFromParsingName(w r8,p0,g "${IID_IShellItem}",*p.r0)i.r9'
    ${If} $9 != 0
      ${Break}
    ${EndIf}
    !insertmacro ComHlpr_CreateInProcInstance ${CLSID_StartMenuPin} ${IID_IStartMenuPinnedList} r1 ".r9"
    ${If} $9 != 0
      ${Break}
    ${EndIf}
    ${IStartMenuPinnedList::RemoveFromList} $1 '(r0).r9'
    ${Break}
  ${Loop}
  !insertmacro ComHlpr_SafeRelease $1
  !insertmacro ComHlpr_SafeRelease $0
  ${If} $6 >= 0
    System::Call 'ole32::CoUninitialize()'
  ${EndIf}
  Push $9
  System::Store "L"
  Pop ${result}
!macroend

; Explicit-ID jump-list cleanup. No empty/null ID fallback to the current app.
; Interface UUIDs/vtable slots are Windows ABI constants (see review sources).
; Preserves the first failure rather than hiding it with the second result.
!macro HD2_ClearAppDestinations appId result
  System::Store "S"
  StrCpy $8 "${appId}"
  StrCpy $0 0
  StrCpy $1 0
  StrCpy $6 -1
  StrCpy $9 0x80070057
  ${Do}
    ${If} $8 == ""
      ${Break}
    ${EndIf}
    StrLen $9 $8
    ${If} $9 > 128
      StrCpy $9 0x80070057
      ${Break}
    ${EndIf}
    System::Call 'ole32::CoInitializeEx(p0,i2)i.r6'
    StrCpy $9 $6
    ${If} $9 < 0
      ${Break}
    ${EndIf}
    !insertmacro ComHlpr_CreateInProcInstance {86c14003-4d6b-4ef3-a7b4-0506663b2e68} {12337D35-94C6-48A0-BCE7-6A9C69D4D600} r0 ".r9"
    ${If} $9 = 0
      System::Call '$0->3(w r8)i.r9' ; IApplicationDestinations::SetAppID
      ${If} $9 = 0
        System::Call '$0->5()i.r9' ; RemoveAllDestinations
      ${EndIf}
    ${EndIf}
    !insertmacro ComHlpr_CreateInProcInstance {77f10cf0-3db5-4966-b520-b7c54fd35ed6} {6332debf-87b5-4670-90c0-5e57b408a49e} r1 ".r7"
    ${If} $7 = 0
      System::Call '$1->10(w r8)i.r7' ; ICustomDestinationList::DeleteList
    ${EndIf}
    ${If} $9 = 0
      StrCpy $9 $7
    ${EndIf}
    ${Break}
  ${Loop}
  !insertmacro ComHlpr_SafeRelease $1
  !insertmacro ComHlpr_SafeRelease $0
  ${If} $6 >= 0
    System::Call 'ole32::CoUninitialize()'
  ${EndIf}
  Push $9
  System::Store "L"
  Pop ${result}
!macroend
!endif
