@echo off
:: Batch script to commit and push project to GitHub
echo ===================================================
echo     Chest X-Ray Diagnosis System Git Push
echo ===================================================
echo.

cd /d "%~dp0"

echo [1/5] Initializing Git repository...
git init

echo [2/5] Configuring Remote Origin...
git remote remove origin 2>nul
git remote add origin https://github.com/vranasinghe/Chest-X-Ray-Diagnosis-System.git

echo [3/5] Staging files...
git add .

echo [4/5] Creating commit...
git commit -m "Chest X Ray Diagnosis System"

echo [5/5] Pushing to GitHub repository (main branch)...
git branch -M main
git push -u origin main

echo.
echo ===================================================
echo     PUSH COMPLETED!
echo ===================================================
pause
