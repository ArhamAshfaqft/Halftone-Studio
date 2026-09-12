@echo off
title Halftone Studio Pro - Desktop Development Mode
cd /d "%~dp0"

echo ========================================================
echo Starting Halftone Studio Pro Desktop Suite (Dev Mode)...
echo ========================================================
echo.

:: Automatically free port 5173 if any previous instance was left running
for /f "tokens=5" %%a in ('netstat -aon ^| findstr :5173') do (
    taskkill /f /pid %%a >nul 2>&1
)

call npm run electron:dev

if %ERRORLEVEL% NEQ 0 (
    echo.
    echo An error occurred while running the desktop app.
    pause
)
