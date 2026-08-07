@echo off
setlocal
cd /d "%~dp0"

where node >nul 2>nul
if errorlevel 1 (
  echo Node.js is required to run the local preview.
  echo Install Node.js, then run this file again.
  pause
  exit /b 1
)

start "VOID CASCADE Preview Server" /B node "%~dp0preview-server.js"
timeout /t 1 /nobreak >nul
start "" "http://127.0.0.1:4173/play/"
endlocal
