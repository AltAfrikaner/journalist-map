@echo off
REM  AI SoundStripper - uninstaller. Removes the install dir and shortcuts.
REM  (Does not modify PATH automatically; remove the entry by hand if wanted.)
setlocal
set "INSTALL_DIR=%LOCALAPPDATA%\AISoundStripper"
set "STARTMENU=%APPDATA%\Microsoft\Windows\Start Menu\Programs"

echo Removing %INSTALL_DIR% ...
if exist "%INSTALL_DIR%" rmdir /S /Q "%INSTALL_DIR%"

for %%D in ("%USERPROFILE%\Desktop" "%STARTMENU%") do (
    if exist "%%~D\AI SoundStripper.lnk" del /Q "%%~D\AI SoundStripper.lnk"
)

echo Done. If you added it to PATH, remove "%INSTALL_DIR%" from your user PATH manually.
pause
endlocal
