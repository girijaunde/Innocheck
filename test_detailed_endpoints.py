#!/usr/bin/env python
"""
Detailed API endpoint test with correct paths
"""
import requests
import json
import subprocess
import time
import sys
import os

BASE_URL = "http://127.0.0.1:8000"

print("=" * 80)
print("DETAILED API ENDPOINT TEST")
print("=" * 80)

# Start backend
print("\n[START] Launching backend server...")
try:
    backend_process = subprocess.Popen(
        ["python", "-m", "uvicorn", "backend.app:app", "--host", "127.0.0.1", "--port", "8000"],
        stdout=subprocess.DEVNULL,
        stderr=subprocess.DEVNULL,
        creationflags=subprocess.CREATE_NEW_PROCESS_GROUP if sys.platform == "win32" else 0
    )
    time.sleep(3)
    print(f"[OK] Backend running (PID: {backend_process.pid})")
except Exception as e:
    print(f"[FAIL] {e}")
    sys.exit(1)

# Get correct endpoints from OpenAPI
print("\n[INFO] Fetching OpenAPI spec...")
try:
    response = requests.get(f"{BASE_URL}/openapi.json", timeout=5)
    openapi = response.json()
    endpoints = {}
    
    for path, methods in openapi.get("paths", {}).items():
        if "/api/" in path:
            for method in methods.keys():
                if method.upper() in ["GET", "POST", "PUT", "DELETE"]:
                    key = f"{method.upper()} {path}"
                    endpoints[key] = (method.upper(), path)
    
    print(f"[OK] Found {len(endpoints)} endpoints")
except Exception as e:
    print(f"[FAIL] {e}")
    sys.exit(1)

# Test each endpoint with appropriate method
print("\n[TEST] Testing API endpoints...")
print("-" * 80)

success_count = 0
fail_count = 0
test_data = {
    "POST /api/auth/register": {"username": "testuser", "password": "TestPass123!", "email": "test@test.com"},
    "POST /api/validate": {"problem_statement": "Create an AI system for hackathon idea validation"},
    "POST /api/plagiarism/check": {"text": "Sample code to check for plagiarism", "sources": []},
    "POST /api/literature/search": {"query": "machine learning", "year_from": 2020, "year_to": 2025},
    "POST /api/generate/code": {"description": "Hello world app", "framework": "python"},
    "POST /api/prototype/generate": {"description": "Landing page design", "framework": "html"},
}

for endpoint_key, (method, path) in sorted(endpoints.items()):
    try:
        headers = {"Origin": "http://localhost:3000"}
        
        # Prepare request
        if method == "GET":
            response = requests.request(method, f"{BASE_URL}{path}", headers=headers, timeout=5)
        elif method == "POST":
            payload = test_data.get(endpoint_key, {})
            response = requests.request(method, f"{BASE_URL}{path}", json=payload, headers=headers, timeout=5)
        else:
            response = requests.request(method, f"{BASE_URL}{path}", headers=headers, timeout=5)
        
        status_code = response.status_code
        status_text = "OK" if status_code < 400 else "ERR" if status_code >= 500 else "WARN"
        
        if status_text == "OK":
            success_count += 1
        else:
            fail_count += 1
        
        # Show response info
        resp_len = len(response.text) if response.text else 0
        print(f"[{status_text}] {method:6} {path:40} -> {status_code} ({resp_len}B)")
        
        # Check for real data in select endpoints
        if status_code == 200 and "validate" in path.lower():
            data = response.json()
            if isinstance(data, dict) and "similar_research" in data:
                items = data.get("similar_research", [])
                print(f"     └─ Found {len(items)} research items")
                if items:
                    print(f"     └─ First item: {items[0].get('title', 'N/A')[:60]}")
        
    except requests.exceptions.Timeout:
        print(f"[TIMEOUT] {method:6} {path:40} (request timeout)")
        fail_count += 1
    except requests.exceptions.ConnectionError:
        print(f"[CONN]    {method:6} {path:40} (connection failed)")
        fail_count += 1
    except Exception as e:
        print(f"[ERROR]   {method:6} {path:40} ({type(e).__name__})")
        fail_count += 1

# Summary
print("\n" + "=" * 80)
print("SUMMARY")
print("-" * 80)
print(f"Total endpoints tested: {success_count + fail_count}")
print(f"Successful (< 400):    {success_count}")
print(f"Errors (>= 400):       {fail_count}")
print(f"Success rate:          {100 * success_count // (success_count + fail_count) if (success_count + fail_count) > 0 else 0}%")

# Detailed feature checks
print("\n[FEATURE] Testing specific features...")
print("-" * 80)

features = {
    "Idea Validation": "/api/validate",
    "Literature Search": "/api/literature/search",
    "Plagiarism Check": "/api/plagiarism/check",
    "Code Generation": "/api/generate/code",
    "Prototype Generation": "/api/prototype/generate",
    "Authentication": "/api/auth/register",
}

for feature_name, feature_path in features.items():
    found = any(feature_path in endpoint for endpoint in endpoints.keys())
    status = "OK" if found else "MISSING"
    print(f"[{status}] {feature_name:25} {feature_path}")

print("\n" + "=" * 80)

# Cleanup
try:
    if sys.platform == "win32":
        os.system(f"taskkill /PID {backend_process.pid} /F 2>nul")
    else:
        backend_process.terminate()
except:
    pass

print("\nTest complete!")
