#!/bin/bash
# InnoCheck Frontend Startup Script
# Run this script to start the React frontend development server

echo "=== InnoCheck Frontend Setup ==="

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "Error: Node.js is not installed"
    echo "Please install Node.js from https://nodejs.org/"
    exit 1
fi

echo "Node.js version: $(node --version)"

# Check if npm is installed
if ! command -v npm &> /dev/null; then
    echo "Error: npm is not installed"
    echo "Please install npm from https://nodejs.org/"
    exit 1
fi

echo "npm version: $(npm --version)"

# Change to frontend directory
cd frontend

# Check if package.json exists
if [ ! -f "package.json" ]; then
    echo "Error: package.json not found in frontend directory"
    exit 1
fi

# Install dependencies
echo "Installing Node.js dependencies..."
npm install

if [ $? -ne 0 ]; then
    echo "Error: Failed to install dependencies"
    exit 1
fi

echo "Dependencies installed successfully"

# Start the development server
echo "Starting InnoCheck Frontend Server..."
echo "Frontend will be available at: http://localhost:3000"
echo "Make sure the backend server is running at http://localhost:8000"
echo ""
echo "Press Ctrl+C to stop the server"

npm start
