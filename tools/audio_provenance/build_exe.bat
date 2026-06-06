@echo off
REM ===================================================================
REM  AI SoundStripper - build a TRUE standalone .exe (no Python needed
REM  on the target machine).
REM
REM  Run this once on a Windows box that has Python 3. It uses
REM  PyInstaller to bundle the interpreter + the engine into a single
REM  file: dist\AISoundStripper.exe
REM
REM  Double-clicking that .exe opens the click-to-run window. You can
REM  also drag an audio file onto it, or run it from a terminal:
REM      AISoundStripper.exe clean "song.mp3"
REM ===================================================================
setlocal

set "PYEXE="
where py >nul 2>nul && set "PYEXE=py -3"
if not defined PYEXE (
    where python >nul 2>nul && set "PYEXE=python"
)
if not defined PYEXE (
    echo Python 3 not found. Install from https://www.python.org/downloads/
    pause
    exit /b 1
)

echo [+] Ensuring PyInstaller is installed...
%PYEXE% -m pip install --upgrade pyinstaller || (
    echo [!] Could not install PyInstaller ^(check your internet/pip^).
    pause
    exit /b 1
)

echo [+] Building single-file executable...
REM --windowed: no console window when the GUI opens.
%PYEXE% -m PyInstaller --onefile --windowed --name AISoundStripper "%~dp0provenance.py"

echo.
echo === Build complete ===
echo   Your standalone app:  %~dp0dist\AISoundStripper.exe
echo   Copy it anywhere; it needs no Python install.
echo.
pause
endlocal
