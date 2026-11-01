@echo off
set SHORTCUT_PATH=%APPDATA%\Microsoft\Windows\Start Menu\Programs\Startup\Launchpad.lnk
if exist "%SHORTCUT_PATH%" (
    del "%SHORTCUT_PATH%"
    echo Launchpad has been removed from Windows Startup.
) else (
    echo Launchpad was not found in Windows Startup.
)
pause
