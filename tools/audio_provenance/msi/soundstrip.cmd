@echo off
REM AI SoundStripper - command-line launcher (installed to PATH by the MSI).
REM   soundstrip inspect "song.mp3"
REM   soundstrip clean   "song.mp3"
REM   soundstrip gui
set "PYEXE="
where py >nul 2>nul && set "PYEXE=py -3"
if not defined PYEXE ( where python >nul 2>nul && set "PYEXE=python" )
if not defined PYEXE (
    echo Python 3 not found. Install from https://www.python.org/downloads/
    echo and tick "Add python.exe to PATH" during setup.
    exit /b 1
)
%PYEXE% "%~dp0provenance.py" %*
