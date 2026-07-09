@echo off
REM EnviEL - Run Everything Script
REM Starts Next.js server and Python ML bridge
REM Closes Arduino IDE to free COM port

echo ================================================
echo  EnviEL - Full Stack Startup
echo ================================================

REM Kill Arduino IDE if running
taskkill /F /IM arduino.exe >nul 2>&1
if %ERRORLEVEL% EQU 0 (
    echo [1/3] Arduino IDE closed - COM3 freed
) else (
    echo [1/3] Arduino IDE was not running
)

REM Give the port time to release
timeout /t 2 /nobreak >nul

REM Start Next.js dev server in a new window
echo [2/3] Starting Next.js server...
start "EnviEL - Next.js Server" cmd /k npm run dev

REM Wait for Next.js to start
timeout /t 5 /nobreak >nul

REM Start Python ML bridge in a new window
echo [3/3] Starting Python ML bridge...
start "EnviEL - ML Bridge" cmd /k python arduino/serial_bridge.py

echo.
echo ================================================
echo  All systems running!
echo ================================================
echo.
echo Web Dashboard: http://localhost:3000/dashboard/ml-debug
echo Terminal 1: Next.js server logs
echo Terminal 2: Python bridge logs
echo.
echo Press any key to close this window...
pause >nul
