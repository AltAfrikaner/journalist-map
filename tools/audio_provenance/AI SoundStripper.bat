@echo off
REM ===================================================================
REM  AI SoundStripper - portable / drag-and-drop launcher
REM
REM  No install needed. Two ways to use it:
REM    * Drag an audio file (mp3/wav/flac) onto this .bat to clean it.
REM    * Double-click this .bat (no file) to open the click-to-run window.
REM
REM  Keep this file in the same folder as provenance.py.
REM  Metadata cleaner only - does NOT remove watermarks/fingerprints.
REM ===================================================================
setlocal
set "HERE=%~dp0"
set "ENGINE=%HERE%provenance.py"

if not exist "%ENGINE%" (
    echo Cannot find provenance.py next to this launcher.
    pause
    exit /b 1
)

set "PYEXE="
where py >nul 2>nul && set "PYEXE=py -3"
if not defined PYEXE (
    where python >nul 2>nul && set "PYEXE=python"
)
if not defined PYEXE (
    echo Python 3 not found. Install it from https://www.python.org/downloads/
    echo and tick "Add python.exe to PATH" during setup.
    pause
    exit /b 1
)

if "%~1"=="" (
    REM No file dropped -> open the GUI.
    %PYEXE% "%ENGINE%" gui
) else (
    REM File dropped -> inspect then clean it.
    echo Cleaning: %~1
    echo.
    %PYEXE% "%ENGINE%" clean "%~1"
    echo.
    pause
)
endlocal
