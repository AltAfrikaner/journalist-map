@echo off
REM Launch DiskMap with Administrator rights (UAC prompt).
REM Admin lets DiskMap read the NTFS Master File Table for the fastest scans
REM and access otherwise-locked / protected system files.
powershell -NoProfile -Command "Start-Process -FilePath '%~dp0diskmap.exe' -Verb RunAs"
