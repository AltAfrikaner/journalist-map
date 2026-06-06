@echo off
REM ===================================================================
REM  AI SoundStripper - Windows installer (no admin rights required)
REM
REM  Installs the provenance inspector + Layer-1 metadata cleaner into
REM  %LOCALAPPDATA%\AISoundStripper, registers a "soundstrip" command on
REM  your PATH, and creates Desktop + Start Menu shortcuts that open the
REM  click-to-run window.
REM
REM  This is a METADATA cleaner, not a watermark remover. It strips
REM  Layer-1 container tags (ID3/RIFF/FLAC) losslessly; it does not and
REM  cannot remove signal watermarks or model fingerprints (Layer 3).
REM ===================================================================
setlocal EnableDelayedExpansion

set "APPNAME=AI SoundStripper"
set "INSTALL_DIR=%LOCALAPPDATA%\AISoundStripper"
set "SRC=%~dp0provenance.py"

echo.
echo === %APPNAME% installer ===
echo.

REM --- locate Python -------------------------------------------------
set "PYEXE="
where py >nul 2>nul && set "PYEXE=py -3"
if not defined PYEXE (
    where python >nul 2>nul && set "PYEXE=python"
)
if not defined PYEXE (
    echo [!] Python 3 was not found on this machine.
    echo     Install it first, then re-run this installer. Easiest options:
    echo        winget install -e --id Python.Python.3.12
    echo     or download from https://www.python.org/downloads/
    echo     ^(During setup, tick "Add python.exe to PATH".^)
    echo.
    pause
    exit /b 1
)
echo [+] Found Python launcher: %PYEXE%

REM --- check the engine file is present -------------------------------
if not exist "%SRC%" (
    echo [!] Cannot find provenance.py next to this installer.
    echo     Keep install.bat and provenance.py in the same folder.
    pause
    exit /b 1
)

REM --- copy files ----------------------------------------------------
echo [+] Installing to: %INSTALL_DIR%
if not exist "%INSTALL_DIR%" mkdir "%INSTALL_DIR%"
copy /Y "%SRC%" "%INSTALL_DIR%\provenance.py" >nul
if exist "%~dp0README.md" copy /Y "%~dp0README.md" "%INSTALL_DIR%\README.md" >nul

REM --- create the launcher command (GUI if no file, else clean) ------
set "LAUNCHER=%INSTALL_DIR%\soundstrip.cmd"
> "%LAUNCHER%" echo @echo off
>> "%LAUNCHER%" echo REM AI SoundStripper launcher
>> "%LAUNCHER%" echo set "PYEXE="
>> "%LAUNCHER%" echo where py ^>nul 2^>nul ^&^& set "PYEXE=py -3"
>> "%LAUNCHER%" echo if not defined PYEXE set "PYEXE=python"
>> "%LAUNCHER%" echo %%PYEXE%% "%INSTALL_DIR%\provenance.py" %%*
echo [+] Created launcher: %LAUNCHER%

REM --- GUI shortcut target (double-click opens the window) -----------
set "GUILAUNCH=%INSTALL_DIR%\AISoundStripper-GUI.cmd"
> "%GUILAUNCH%" echo @echo off
>> "%GUILAUNCH%" echo set "PYEXE="
>> "%GUILAUNCH%" echo where pyw ^>nul 2^>nul ^&^& set "PYEXE=pyw -3"
>> "%GUILAUNCH%" echo if not defined PYEXE ( where pythonw ^>nul 2^>nul ^&^& set "PYEXE=pythonw" )
>> "%GUILAUNCH%" echo if not defined PYEXE set "PYEXE=python"
>> "%GUILAUNCH%" echo start "" %%PYEXE%% "%INSTALL_DIR%\provenance.py" gui

REM --- add install dir to the user PATH ------------------------------
echo %PATH% | find /I "%INSTALL_DIR%" >nul
if errorlevel 1 (
    for /f "skip=2 tokens=2,*" %%A in ('reg query "HKCU\Environment" /v PATH 2^>nul') do set "USERPATH=%%B"
    if not defined USERPATH (
        setx PATH "%INSTALL_DIR%" >nul
    ) else (
        setx PATH "!USERPATH!;%INSTALL_DIR%" >nul
    )
    echo [+] Added %INSTALL_DIR% to your user PATH ^(restart your terminal^).
) else (
    echo [=] PATH already contains the install dir.
)

REM --- Desktop + Start Menu shortcuts via PowerShell ----------------
set "STARTMENU=%APPDATA%\Microsoft\Windows\Start Menu\Programs"
powershell -NoProfile -Command ^
  "$w=New-Object -ComObject WScript.Shell;" ^
  "foreach($d in @([Environment]::GetFolderPath('Desktop'), '%STARTMENU%')){" ^
  "  $lnk=$w.CreateShortcut((Join-Path $d 'AI SoundStripper.lnk'));" ^
  "  $lnk.TargetPath='%GUILAUNCH%'; $lnk.WorkingDirectory='%INSTALL_DIR%';" ^
  "  $lnk.IconLocation='%%SystemRoot%%\System32\imageres.dll,165';" ^
  "  $lnk.Description='Inspect AI provenance + strip container metadata'; $lnk.Save() }" >nul 2>nul
echo [+] Created Desktop and Start Menu shortcuts.

echo.
echo === Done. ===
echo   * Double-click the "AI SoundStripper" desktop icon for the window.
echo   * Or from a new terminal:
echo        soundstrip inspect  "song.mp3"
echo        soundstrip clean    "song.mp3"
echo        soundstrip gui
echo.
echo   Output is written next to the input as song.clean.mp3 (same format).
echo.
pause
endlocal
