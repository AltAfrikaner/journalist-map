@echo off
REM ===================================================================
REM  AI SoundStripper - build the SELF-CONTAINED .msi (bundles Python).
REM
REM  Produces AISoundStripper-Standalone.msi: an installer that needs
REM  NOTHING on the target machine - no Python required.
REM
REM  Run this on Windows. It does two steps:
REM    1. PyInstaller -> dist\AISoundStripper.exe (bundles the runtime)
REM    2. WiX v3 (candle/light) -> AISoundStripper-Standalone.msi
REM
REM  Prereqs on THIS build machine:
REM    * Python 3 + pip   (https://www.python.org/downloads/)
REM    * WiX Toolset v3.x  (https://github.com/wixtoolset/wix3/releases)
REM      candle.exe and light.exe must be on PATH.
REM ===================================================================
setlocal
cd /d "%~dp0"

set "PYEXE="
where py >nul 2>nul && set "PYEXE=py -3"
if not defined PYEXE ( where python >nul 2>nul && set "PYEXE=python" )
if not defined PYEXE (
    echo [!] Python 3 not found. Install from https://www.python.org/downloads/
    pause & exit /b 1
)

echo [1/3] Installing PyInstaller...
%PYEXE% -m pip install --upgrade pyinstaller || ( echo [!] pip failed & pause & exit /b 1 )

echo [2/3] Building bundled exe (dist\AISoundStripper.exe)...
%PYEXE% -m PyInstaller --onefile --windowed ^
    --icon "msi\aisoundstripper.ico" ^
    --name AISoundStripper --distpath "msi\dist" --workpath build --specpath build ^
    provenance.py || ( echo [!] PyInstaller failed & pause & exit /b 1 )

if not exist "msi\dist\AISoundStripper.exe" (
    echo [!] Expected msi\dist\AISoundStripper.exe was not produced.
    pause & exit /b 1
)

echo [3/3] Building self-contained MSI with WiX (candle/light)...
where candle >nul 2>nul || (
    echo [!] WiX Toolset v3 not found ^(need candle.exe/light.exe on PATH^).
    echo     Get it from https://github.com/wixtoolset/wix3/releases
    echo     The exe is ready at msi\dist\AISoundStripper.exe; rerun once WiX is installed.
    pause & exit /b 1
)
pushd msi
candle aisoundstripper-standalone.wxs || ( echo [!] candle failed & popd & pause & exit /b 1 )
light  aisoundstripper-standalone.wixobj -o ..\AISoundStripper-Standalone.msi ^
    || ( echo [!] light failed & popd & pause & exit /b 1 )
popd

echo.
echo === Done ===
echo   Self-contained installer:  %~dp0AISoundStripper-Standalone.msi
echo   It installs with no Python dependency on the target PC.
echo.
pause
endlocal
