@echo off
title Smart Queue Management System Launcher
color 0A

echo.
echo  ╔══════════════════════════════════════════════════════════════╗
echo  ║              Smart Queue Management System                   ║
echo  ║                   Quick Start Launcher                       ║
echo  ╚══════════════════════════════════════════════════════════════╝
echo.

REM Check if Python is installed
python --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ❌ Python is not installed or not in PATH
    echo 💡 Please install Python 3.8+ from https://python.org
    pause
    exit /b 1
)

echo ✅ Python found
echo.

REM Check if pip is available
pip --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ❌ pip is not available
    echo 💡 Please ensure pip is installed with Python
    pause
    exit /b 1
)

echo ✅ pip found
echo.

REM Install requirements if requirements.txt exists
if exist requirements.txt (
    echo 📦 Installing Python packages...
    pip install -r requirements.txt
    if %errorlevel% neq 0 (
        echo ❌ Failed to install requirements
        echo 💡 Check your internet connection and try again
        pause
        exit /b 1
    )
    echo ✅ All packages installed
    echo.
)

REM Create directories if they don't exist
if not exist "backend" mkdir backend
if not exist "frontend" mkdir frontend
if not exist "frontend\css" mkdir frontend\css
if not exist "frontend\js" mkdir frontend\js
if not exist "database" mkdir database

echo ✅ Directory structure ready
echo.

REM Check if backend file exists
if not exist "backend\enhanced_app.py" (
    echo ❌ Backend file not found: backend\enhanced_app.py
    echo 💡 Please ensure the enhanced backend is available
    pause
    exit /b 1
)

echo ✅ Enhanced backend file found
echo.

REM Start the system
echo 🚀 Starting Smart Queue Management System...
echo.
echo ⏳ Enhanced backend server starting on http://localhost:5000
echo 🌐 Frontend available at http://localhost:8080
echo.
echo 🔥 ENHANCED FEATURES AVAILABLE:
echo    ✅ Enhanced QR code booking system
echo    ✅ AI-powered queue predictions
echo    ✅ Real-time queue monitoring
echo    ✅ Staff & Manager dashboards
echo    ✅ Interactive alert system
echo    ✅ Role-based interfaces
echo.
echo 📱 ACCESS POINTS:
echo    Public:  http://localhost:8080
echo    Staff:   http://localhost:8080/staff.html
echo    Manager: http://localhost:8080/manager.html
echo.
echo Press Ctrl+C to stop the system
echo ==========================================
echo.

REM Run the enhanced Python launcher
python run_enhanced.py

echo.
echo 👋 System stopped. Thank you for using Smart Queue Management System!
pause