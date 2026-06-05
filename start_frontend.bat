@echo off
REM InnoCheck Frontend Startup Script for Windows
REM Run this script to start the React frontend development server

echo === InnoCheck Frontend Setup ===

REM Check if Node.js is installed
node --version >nul 2>&1
if %errorlevel% neq 0 (
    echo Error: Node.js is not installed
    echo Please install Node.js from https://nodejs.org/
    pause
    exit /b 1
)

echo Node.js version: 
node --version

REM Check if npm is installed
npm --version >nul 2>&1
if %errorlevel% neq 0 (
    echo Error: npm is not installed
    echo Please install npm from https://nodejs.org/
    pause
    exit /b 1
)

echo npm version: 
npm --version

REM Change to frontend directory
cd frontend

REM Check if package.json exists
if not exist "package.json" (
    echo Error: package.json not found in frontend directory
    pause
    exit /b 1
)

REM Install dependencies
echo Installing Node.js dependencies...
npm install

if %errorlevel% neq 0 (
    echo Error: Failed to install dependencies
    pause
    exit /b 1
)

echo Dependencies installed successfully

REM Start the development server
echo Starting InnoCheck Frontend Server...
echo Frontend will be available at: http://localhost:3000
echo Make sure the backend server is running at http://localhost:8000
echo.
echo Press Ctrl+C to stop the server

npm start
