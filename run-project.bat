@echo off
cd /d %~dp0
echo ===============================
echo Starting Gawde Account Service
echo ===============================

:: Check Node.js
node -v >nul 2>&1
IF %ERRORLEVEL% NEQ 0 (
    echo Node.js is not installed or not added to PATH.
    pause
    exit /b
)

:: Step 1 - Install dependencies
echo Installing dependencies...
call npm install || goto error

:: Step 2 - Build project
echo Building the project...
call npm run build || goto error

:: Step 3 - Preview the build
echo Starting preview server...
call npm run preview || goto error

pause
exit /b

:error
echo There was an error running the script.
pause
exit /b
