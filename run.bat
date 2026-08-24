@echo off
echo Starting IMuse localhost server...
if not exist node_modules\ (
    echo node_modules not found. Installing dependencies...
    call npm install
)
call npm run dev
pause
