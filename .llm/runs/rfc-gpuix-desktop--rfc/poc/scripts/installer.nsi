; NetScript GPUIX PoC: per-user Windows installer (no admin rights needed).
; Built from Linux with makensis; see scripts/package.sh.
Unicode true
!include "MUI2.nsh"

!define APPNAME "NetScript GPUIX PoC"
!define EXENAME "NetScript.exe"
!ifndef VERSION
  !define VERSION "0.1.0"
!endif

Name "${APPNAME}"
OutFile "${OUTFILE}"
InstallDir "$LOCALAPPDATA\Programs\${APPNAME}"
RequestExecutionLevel user
SetCompressor /SOLID lzma

!define MUI_ICON "${ICON}"
!define MUI_UNICON "${ICON}"
!define MUI_FINISHPAGE_RUN "$INSTDIR\${EXENAME}"
!define MUI_FINISHPAGE_RUN_TEXT "Launch NetScript"
!insertmacro MUI_PAGE_WELCOME
!insertmacro MUI_PAGE_DIRECTORY
!insertmacro MUI_PAGE_INSTFILES
!insertmacro MUI_PAGE_FINISH
!insertmacro MUI_UNPAGE_CONFIRM
!insertmacro MUI_UNPAGE_INSTFILES
!insertmacro MUI_LANGUAGE "English"

Section "Install"
  SetOutPath "$INSTDIR"
  File "${PAYLOAD}\${EXENAME}"
  File "${PAYLOAD}\README.txt"
  File "${PAYLOAD}\bench.cmd"
  SetOutPath "$INSTDIR\webview"
  File /r "${PAYLOAD}\webview\*.*"
  ; The real NetScript graph: shared Deno runtime, dependency cache, self-contained Garnet, workspace.
  SetOutPath "$INSTDIR\stack"
  File /r "${PAYLOAD}\stack\*.*"
  SetOutPath "$INSTDIR"
  CreateDirectory "$SMPROGRAMS\${APPNAME}"
  CreateShortcut "$SMPROGRAMS\${APPNAME}\NetScript (GPUIX, real stack).lnk" "$INSTDIR\${EXENAME}"
  CreateShortcut "$SMPROGRAMS\${APPNAME}\NetScript (GPUIX-first, real stack).lnk" "$INSTDIR\${EXENAME}" "--ui=native"
  CreateShortcut "$SMPROGRAMS\${APPNAME}\NetScript (webview, real stack).lnk" "$INSTDIR\webview\NetScript-Webview.exe"
  CreateShortcut "$SMPROGRAMS\${APPNAME}\NetScript (GPUIX, embedded demo).lnk" "$INSTDIR\${EXENAME}" "--stack=embedded"
  CreateShortcut "$SMPROGRAMS\${APPNAME}\Run benchmark.lnk" "$INSTDIR\bench.cmd"
  CreateShortcut "$DESKTOP\NetScript (GPUIX).lnk" "$INSTDIR\${EXENAME}"
  WriteUninstaller "$INSTDIR\Uninstall.exe"
  WriteRegStr HKCU "Software\Microsoft\Windows\CurrentVersion\Uninstall\${APPNAME}" "DisplayName" "${APPNAME}"
  WriteRegStr HKCU "Software\Microsoft\Windows\CurrentVersion\Uninstall\${APPNAME}" "DisplayVersion" "${VERSION}"
  WriteRegStr HKCU "Software\Microsoft\Windows\CurrentVersion\Uninstall\${APPNAME}" "Publisher" "NetScript"
  WriteRegStr HKCU "Software\Microsoft\Windows\CurrentVersion\Uninstall\${APPNAME}" "DisplayIcon" "$INSTDIR\${EXENAME}"
  WriteRegStr HKCU "Software\Microsoft\Windows\CurrentVersion\Uninstall\${APPNAME}" "UninstallString" "$\"$INSTDIR\Uninstall.exe$\""
  WriteRegDWORD HKCU "Software\Microsoft\Windows\CurrentVersion\Uninstall\${APPNAME}" "NoModify" 1
  WriteRegDWORD HKCU "Software\Microsoft\Windows\CurrentVersion\Uninstall\${APPNAME}" "NoRepair" 1
SectionEnd

Section "Uninstall"
  Delete "$INSTDIR\${EXENAME}"
  Delete "$INSTDIR\README.txt"
  Delete "$INSTDIR\bench.cmd"
  Delete "$INSTDIR\Uninstall.exe"
  RMDir /r "$INSTDIR\webview"
  RMDir /r "$INSTDIR\stack"
  RMDir "$INSTDIR"
  Delete "$SMPROGRAMS\${APPNAME}\*.lnk"
  RMDir "$SMPROGRAMS\${APPNAME}"
  Delete "$DESKTOP\NetScript (GPUIX).lnk"
  DeleteRegKey HKCU "Software\Microsoft\Windows\CurrentVersion\Uninstall\${APPNAME}"
SectionEnd
