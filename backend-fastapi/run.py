#!/usr/bin/env python3
"""
FastAPI Aquaculture Management System
JunctionX Algeria Challenge 4

Run this script to start the FastAPI server.
"""

import os
import sys
import subprocess

def install_dependencies():
    """Install required dependencies"""
    print("Installing dependencies...")
    subprocess.check_call([sys.executable, "-m", "pip", "install", "-r", "requirements.txt"])

def run_server():
    """Run the FastAPI server"""
    print("Starting FastAPI server...")
    subprocess.run([
        sys.executable, "-m", "uvicorn", 
        "app.main:app", 
        "--reload", 
        "--host", "0.0.0.0", 
        "--port", "8000"
    ])

if __name__ == "__main__":
    if len(sys.argv) > 1 and sys.argv[1] == "install":
        install_dependencies()
    else:
        run_server()
