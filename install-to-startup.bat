@echo off
set SCRIPT_DIR=%~dp0
set VBS_TARGET=%SCRIPT_DIR%Start-Launchpad-Silent.vbs
set SHORTCUT_PATH=%APPDATA%\Microsoft\Windows\Start Menu\Programs\Startup\Launchpad.lnk

echo Creating Windows Startup Shortcut...
powershell -NoProfile -Command "$ws = New-Object -ComObject WScript.Shell; $s = $ws.CreateShortcut('%SHORTCUT_PATH%'); $s.TargetPath = '%VBS_TARGET%'; $s.WorkingDirectory = '%SCRIPT_DIR%'; $s.Save()"

if exist "%SHORTCUT_PATH%" (
    echo.
    echo ========================================================
    echo SUCCESS: Launchpad will now automatically start on boot!
    echo Shortcut created in Startup folder.
    echo ========================================================
) else (
    echo Error creating startup shortcut.
)
pause
