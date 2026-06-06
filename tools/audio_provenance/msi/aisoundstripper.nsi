; ===================================================================
; AI SoundStripper - Windows Setup.exe installer (NSIS / MUI2)
; Wraps the self-contained AISoundStripper.exe (Python + Tcl/Tk bundled,
; nothing to preinstall). Produces AISoundStripper-Setup.exe:
;   - wizard install to Program Files
;   - branded icon on the installer, shortcuts, and Add/Remove Programs
;   - Start Menu + Desktop shortcuts
;   - clean uninstaller
;
; Build on Linux:  makensis aisoundstripper.nsi
; ===================================================================
Unicode true
!include "MUI2.nsh"
!include "x64.nsh"

!define APPNAME    "AI SoundStripper"
!define APPEXE     "AISoundStripper.exe"
!define COMPANY    "AI SoundStripper"
!define VERSION    "1.0.0"
!define ARP        "Software\Microsoft\Windows\CurrentVersion\Uninstall\AISoundStripper"

Name "${APPNAME}"
OutFile "AISoundStripper-Setup.exe"
InstallDir "$PROGRAMFILES64\${APPNAME}"
InstallDirRegKey HKLM "Software\AISoundStripper" "InstallDir"
RequestExecutionLevel admin
SetCompressor /SOLID lzma
BrandingText "${APPNAME} ${VERSION}"

; --- branding / icon ---
!define MUI_ICON   "aisoundstripper.ico"
!define MUI_UNICON "aisoundstripper.ico"
!define MUI_ABORTWARNING

; --- wizard pages ---
!insertmacro MUI_PAGE_WELCOME
!insertmacro MUI_PAGE_DIRECTORY
!insertmacro MUI_PAGE_INSTFILES
!define MUI_FINISHPAGE_RUN "$INSTDIR\${APPEXE}"
!define MUI_FINISHPAGE_RUN_TEXT "Launch ${APPNAME} now"
!insertmacro MUI_PAGE_FINISH

!insertmacro MUI_UNPAGE_CONFIRM
!insertmacro MUI_UNPAGE_INSTFILES

!insertmacro MUI_LANGUAGE "English"

Section "Install"
  SetOutPath "$INSTDIR"
  File "dist\${APPEXE}"
  File "..\README.md"

  ; shortcuts (icon pulled from the exe's own embedded icon)
  CreateDirectory "$SMPROGRAMS\${APPNAME}"
  CreateShortCut  "$SMPROGRAMS\${APPNAME}\${APPNAME}.lnk" "$INSTDIR\${APPEXE}" "" "$INSTDIR\${APPEXE}" 0
  CreateShortCut  "$DESKTOP\${APPNAME}.lnk"               "$INSTDIR\${APPEXE}" "" "$INSTDIR\${APPEXE}" 0

  ; uninstaller + Add/Remove Programs entry (with branded icon)
  WriteUninstaller "$INSTDIR\Uninstall.exe"
  WriteRegStr   HKLM "Software\AISoundStripper" "InstallDir" "$INSTDIR"
  WriteRegStr   HKLM "${ARP}" "DisplayName"     "${APPNAME}"
  WriteRegStr   HKLM "${ARP}" "DisplayIcon"     "$INSTDIR\${APPEXE}"
  WriteRegStr   HKLM "${ARP}" "DisplayVersion"  "${VERSION}"
  WriteRegStr   HKLM "${ARP}" "Publisher"       "${COMPANY}"
  WriteRegStr   HKLM "${ARP}" "UninstallString" "$\"$INSTDIR\Uninstall.exe$\""
  WriteRegStr   HKLM "${ARP}" "InstallLocation" "$INSTDIR"
  WriteRegDWORD HKLM "${ARP}" "NoModify" 1
  WriteRegDWORD HKLM "${ARP}" "NoRepair" 1
SectionEnd

Section "Uninstall"
  Delete "$INSTDIR\${APPEXE}"
  Delete "$INSTDIR\README.md"
  Delete "$INSTDIR\Uninstall.exe"
  RMDir  "$INSTDIR"
  Delete "$SMPROGRAMS\${APPNAME}\${APPNAME}.lnk"
  RMDir  "$SMPROGRAMS\${APPNAME}"
  Delete "$DESKTOP\${APPNAME}.lnk"
  DeleteRegKey HKLM "${ARP}"
  DeleteRegKey HKLM "Software\AISoundStripper"
SectionEnd
