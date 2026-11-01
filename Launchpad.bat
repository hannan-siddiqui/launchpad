@echo off
title Launchpad
cd /d "%~dp0"
set ELECTRON_RUN_AS_NODE=
start "" "%~dp0node_modules\electron\dist\electron.exe" "%~dp0."
exit
