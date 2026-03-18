@echo off
setlocal

set "ROOT=%~dp0"
set "BACKEND_DIR=%ROOT%backend"
set "FRONTEND_DIR=%ROOT%"
set "VENV_PYTHON=%ROOT%.venv\Scripts\python.exe"

if not exist "%BACKEND_DIR%\main.py" (
  echo [ERROR] Cannot find backend\main.py
  pause
  exit /b 1
)

if not exist "%FRONTEND_DIR%\package.json" (
  echo [ERROR] Cannot find package.json in project root
  pause
  exit /b 1
)

if not exist "%VENV_PYTHON%" (
  echo [ERROR] Cannot find venv Python: %VENV_PYTHON%
  echo Please create venv and install backend dependencies first.
  echo Example:
  echo   py -m venv .venv
  echo   .\.venv\Scripts\activate
  echo   pip install -r backend\requirements.txt
  pause
  exit /b 1
)

echo Starting backend server...
start "MusicId Backend" /D "%BACKEND_DIR%" cmd /k ""%VENV_PYTHON%" -m uvicorn main:app --reload"

echo Starting Expo frontend...
start "MusicId Frontend" /D "%FRONTEND_DIR%" cmd /k "npx expo start"

echo.
echo Demo is starting in two terminal windows:
echo - MusicId Backend (FastAPI)
echo - MusicId Frontend (Expo)
echo.
echo Close this window or press any key to finish.
pause >nul
