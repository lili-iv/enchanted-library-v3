@echo off
cd /d "%~dp0"
if not exist node_modules (
  echo Installing, please wait...
  call npm install
)
echo Starting the Enchanted Library...
call npm run dev
pause
