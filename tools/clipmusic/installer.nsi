; ClipMusic installer (NSIS). Wraps the PyInstaller ClipMusic.exe.
!define APPNAME "ClipMusic"
!define VERSION "1.0.0"
!define PUBLISHER "ClipMusic"
!define UNINSTKEY "Software\Microsoft\Windows\CurrentVersion\Uninstall\ClipMusic"

Name "${APPNAME}"
OutFile "ClipMusic-Setup.exe"
InstallDir "$PROGRAMFILES64\ClipMusic"
InstallDirRegKey HKLM "Software\ClipMusic" "InstallDir"
RequestExecutionLevel admin
SetCompressor /SOLID lzma
Unicode true

Page directory
Page instfiles
UninstPage uninstConfirm
UninstPage instfiles

Section "Install"
  SetOutPath "$INSTDIR"
  File "ClipMusic.exe"
  WriteUninstaller "$INSTDIR\uninstall.exe"

  CreateDirectory "$SMPROGRAMS\ClipMusic"
  CreateShortcut "$SMPROGRAMS\ClipMusic\ClipMusic.lnk" "$INSTDIR\ClipMusic.exe"
  CreateShortcut "$SMPROGRAMS\ClipMusic\Uninstall ClipMusic.lnk" "$INSTDIR\uninstall.exe"
  CreateShortcut "$DESKTOP\ClipMusic.lnk" "$INSTDIR\ClipMusic.exe"

  WriteRegStr HKLM "Software\ClipMusic" "InstallDir" "$INSTDIR"
  WriteRegStr HKLM "${UNINSTKEY}" "DisplayName" "${APPNAME}"
  WriteRegStr HKLM "${UNINSTKEY}" "DisplayVersion" "${VERSION}"
  WriteRegStr HKLM "${UNINSTKEY}" "Publisher" "${PUBLISHER}"
  WriteRegStr HKLM "${UNINSTKEY}" "DisplayIcon" "$INSTDIR\ClipMusic.exe"
  WriteRegStr HKLM "${UNINSTKEY}" "UninstallString" "$INSTDIR\uninstall.exe"
  WriteRegDWORD HKLM "${UNINSTKEY}" "NoModify" 1
  WriteRegDWORD HKLM "${UNINSTKEY}" "NoRepair" 1
SectionEnd

Section "Uninstall"
  Delete "$INSTDIR\ClipMusic.exe"
  Delete "$INSTDIR\uninstall.exe"
  Delete "$SMPROGRAMS\ClipMusic\ClipMusic.lnk"
  Delete "$SMPROGRAMS\ClipMusic\Uninstall ClipMusic.lnk"
  RMDir "$SMPROGRAMS\ClipMusic"
  Delete "$DESKTOP\ClipMusic.lnk"
  RMDir "$INSTDIR"
  DeleteRegKey HKLM "${UNINSTKEY}"
  DeleteRegKey HKLM "Software\ClipMusic"
SectionEnd
