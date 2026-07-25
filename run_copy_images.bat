@echo off
if not exist "radiology-platform\radiology-platform\frontend\public" (
    mkdir "radiology-platform\radiology-platform\frontend\public"
)
node copy_images.js
echo [SUCCESS] Images copied to frontend/public/
pause
