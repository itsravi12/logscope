@echo off
title Pushing LOGSCOPE to GitHub
echo ==========================================================
echo   Pushing LOGSCOPE to https://github.com/itsravi12/logscope.git
echo ==========================================================
cd /d "D:\AI cloud project"
git remote set-url origin https://github.com/itsravi12/logscope.git
git push -u origin main
echo.
echo ==========================================================
if %ERRORLEVEL% EQU 0 (
    echo   [SUCCESS] Code successfully pushed to GitHub!
) else (
    echo   [ERROR] Push failed. If prompted, please authorize in your browser.
)
echo ==========================================================
pause
