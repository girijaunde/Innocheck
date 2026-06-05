#!/usr/bin/env python
"""Quick backend startup test"""
import sys
import signal
from threading import Timer

print("Testing backend startup...")

try:
    print("  1. Importing app...")
    from backend.app import app
    print("  ✓ App imported successfully")
    
    print("  2. Checking routes...")
    routes = [route.path for route in app.routes]
    print(f"  ✓ Found {len(routes)} routes")
    for route in routes[:5]:
        print(f"    - {route}")
    
    print("  3. Checking CORS config...")
    from backend.core.config import CORS_ORIGINS
    print(f"  ✓ CORS enabled for: {', '.join(CORS_ORIGINS)}")
    
    print("  4. Testing database connection...")
    from backend.database.connection import engine
    with engine.connect() as conn:
        print("  ✓ Database connection successful")
    
    print("\n✅ Backend startup verification PASSED")
    sys.exit(0)
    
except Exception as e:
    print(f"\n❌ Backend startup verification FAILED")
    print(f"Error: {type(e).__name__}: {str(e)}")
    import traceback
    traceback.print_exc()
    sys.exit(1)
