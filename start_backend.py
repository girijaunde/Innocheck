#!/usr/bin/env python3
"""
InnoCheck Backend Startup Script
Run this script to start the FastAPI backend server
"""

import os
import sys
import subprocess
import socket
from pathlib import Path


HOST = "127.0.0.1"
PORT = 8000

def check_python_version():
    """Check if Python version is compatible"""
    if sys.version_info < (3, 8):
        print("Error: Python 3.8 or higher is required")
        sys.exit(1)
    print(f"Python version: {sys.version}")

def check_env_file():
    """Check if .env file exists"""
    env_file = Path(".env")
    if not env_file.exists():
        print("Warning: .env file not found")
        print("Please copy .env.example to .env and configure your API keys")
        return False
    print("Found .env file")
    return True

def install_dependencies():
    """Install required Python packages"""
    print("Installing dependencies...")
    try:
        subprocess.run([sys.executable, "-m", "pip", "install", "-r", "requirements.txt"], 
                      check=True, capture_output=True, text=True)
        print("Dependencies installed successfully")
    except subprocess.CalledProcessError as e:
        print(f"Error installing dependencies: {e}")
        return False
    return True


def is_port_in_use(host: str, port: int) -> bool:
    """Return True if the host/port is already accepting connections."""
    with socket.socket(socket.AF_INET, socket.SOCK_STREAM) as sock:
        sock.settimeout(0.3)
        return sock.connect_ex((host, port)) == 0

def start_server():
    """Start the FastAPI server"""
    if is_port_in_use(HOST, PORT):
        print(f"Error: Backend appears to already be running on http://{HOST}:{PORT}")
        print("Stop the existing server before starting a new one.")
        print("\nTip (Windows): netstat -ano | findstr :8000")
        return

    print("Starting InnoCheck Backend Server...")
    print(f"Server will be available at: http://{HOST}:{PORT}")
    print(f"API Documentation: http://{HOST}:{PORT}/docs")
    print("\nPress Ctrl+C to stop the server")
    
    try:
        import uvicorn
        uvicorn.run("backend.app:app", host=HOST, port=PORT, reload=True)
    except KeyboardInterrupt:
        print("\nServer stopped by user")
    except Exception as e:
        print(f"Error starting server: {e}")

def main():
    """Main function"""
    print("=== InnoCheck Backend Setup ===")
    
    # Change to backend directory
    backend_dir = Path(__file__).parent
    os.chdir(backend_dir)
    
    # Check Python version
    check_python_version()
    
    # Check .env file
    env_exists = check_env_file()
    if not env_exists:
        print("\nPlease configure your .env file before running the server")
        print("Copy .env.example to .env and add your API keys")
        return
    
    # Install dependencies
    if not install_dependencies():
        print("Failed to install dependencies")
        return
    
    # Start server
    start_server()

if __name__ == "__main__":
    main()
