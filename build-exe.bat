@echo off
title Halftone Studio Pro - Package Windows Installer
cd /d "%~dp0"

echo ========================================================
echo Building Halftone Studio Pro Standalone .exe Installer...
echo ========================================================
echo.

call npm run electron:build

if %ERRORLEVEL% EQU 0 (
    echo.
    echo ========================================================
    echo Build completed successfully!
    echo Check the 'release' folder for your .exe installer.
    echo ========================================================
) else (
    echo.
    echo Build failed. Please inspect the logs above.
)

pause
