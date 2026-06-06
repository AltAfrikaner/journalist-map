' AI SoundStripper - GUI launcher (no console window).
' Finds pythonw/python on PATH and opens the click-to-run window.
Option Explicit
Dim sh, fso, base, py, cmd
Set sh  = CreateObject("WScript.Shell")
Set fso = CreateObject("Scripting.FileSystemObject")
base = fso.GetParentFolderName(WScript.ScriptFullName) & "\"

' Prefer pythonw (windowed, no console). Fall back to python / py.
py = ""
If FindOnPath("pythonw.exe") <> "" Then
    py = "pythonw"
ElseIf FindOnPath("pyw.exe") <> "" Then
    py = "pyw -3"
ElseIf FindOnPath("python.exe") <> "" Then
    py = "python"
ElseIf FindOnPath("py.exe") <> "" Then
    py = "py -3"
End If

If py = "" Then
    MsgBox "Python 3 was not found on this PC." & vbCrLf & vbCrLf & _
           "Install it from https://www.python.org/downloads/ and tick" & vbCrLf & _
           "'Add python.exe to PATH', then launch AI SoundStripper again.", _
           vbExclamation, "AI SoundStripper"
    WScript.Quit 1
End If

cmd = py & " """ & base & "provenance.py"" gui"
sh.Run cmd, 0, False   ' 0 = hidden console, async

Function FindOnPath(exeName)
    Dim paths, p
    FindOnPath = ""
    paths = Split(sh.ExpandEnvironmentStrings("%PATH%"), ";")
    For Each p In paths
        If Len(p) > 0 Then
            If Right(p, 1) <> "\" Then p = p & "\"
            If fso.FileExists(p & exeName) Then
                FindOnPath = p & exeName
                Exit Function
            End If
        End If
    Next
End Function
