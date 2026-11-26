@echo off
title LOGSCOPE - Teacher & Academic Demonstration Mode
color 0A

echo ======================================================================
echo    LOGSCOPE - CLOUD LOG ANALYSIS & MONITORING (ELK STACK)
echo             ACADEMIC PROJECT DEMONSTRATION RUNNER
echo ======================================================================
echo.
cd /d "D:\AI cloud project"

echo [*] Step 1/3: Generating fresh realistic test dataset for demonstration...
python scripts\generate_test_dataset.py

echo.
echo [*] Step 2/3: Launching prototype services (Flask + Vite + Generator)...
echo     - React Dashboard:    http://localhost:5173
echo     - Flask Backend API:  http://localhost:5000/api/health
echo.

rem Launch browser automatically after 3 seconds
start "" cmd /c "timeout /t 3 /nobreak >nul && start http://localhost:5173"

echo [*] Step 3/3: Starting supervisor engine...
echo.
python run_prototype.py

pause
