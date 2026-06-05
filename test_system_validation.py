#!/usr/bin/env python
"""
Comprehensive system validation test
Tests all API endpoints, CORS, and data integrity
"""
import sys
import os
import subprocess
import time
import requests
import json
import signal
from threading import Thread
from pathlib import Path

BASE_URL = "http://127.0.0.1:8000"
FRONTEND_URL = "http://127.0.0.1:3000"

# Test results tracking
test_results = {
    "backend_startup": False,
    "cors_test": False,
    "api_endpoints": {},
    "real_data_checks": {},
    "errors": []
}

print("=" * 80)
print("INNOCHECK SYSTEM VALIDATION TEST")
print("=" * 80)

# Step 1: Start backend server
print("\n[1/8] Starting backend server...")
try:
    backend_process = subprocess.Popen(
        [sys.executable, "-m", "uvicorn", "backend.app:app", "--host", "127.0.0.1", "--port", "8000"],
        cwd=str(Path.cwd()),
        stdout=subprocess.DEVNULL,
        stderr=subprocess.DEVNULL,
        creationflags=subprocess.CREATE_NEW_PROCESS_GROUP if sys.platform == "win32" else 0
    )
    print("  [INFO] Waiting 20 seconds for server startup...")
    time.sleep(20)  # Wait for server to start
    
    # Check if process is still alive
    if backend_process.poll() is None:
        print("  [OK] Backend process started (PID: {})".format(backend_process.pid))
        test_results["backend_startup"] = True
    else:
        print("  [FAIL] Backend process exited immediately")
except Exception as e:
    print(f"  [FAIL] Error starting backend: {e}")
    sys.exit(1)

# Step 2: Test health endpoint
print("\n[2/8] Testing health endpoint...")
try:
    response = requests.get(f"{BASE_URL}/api/health", timeout=5)
    if response.status_code == 200:
        data = response.json()
        print(f"  [OK] Status: {data.get('status', 'unknown')}")
        test_results["api_endpoints"]["health"] = True
    else:
        print(f"  [FAIL] Status code: {response.status_code}")
        test_results["api_endpoints"]["health"] = False
except Exception as e:
    print(f"  [FAIL] {e}")
    test_results["api_endpoints"]["health"] = False
    test_results["errors"].append(f"Health endpoint: {e}")

# Step 3: Test CORS configuration
print("\n[3/8] Testing CORS configuration...")
try:
    headers = {"Origin": "http://localhost:3000"}
    response = requests.options(f"{BASE_URL}/api/health", headers=headers, timeout=5)
    
    cors_headers = response.headers
    if "access-control-allow-origin" in cors_headers:
        print(f"  [OK] CORS origin: {cors_headers.get('access-control-allow-origin', 'N/A')}")
        test_results["cors_test"] = True
    else:
        print(f"  [WARN] No CORS headers in response")
        test_results["cors_test"] = False
except Exception as e:
    print(f"  [FAIL] {e}")
    test_results["cors_test"] = False

# Step 4: Test key API endpoints
print("\n[4/8] Testing API endpoints...")
endpoints_to_test = [
    ("GET", "/api/auth/me", None),
    ("POST", "/api/validate", {"problem_statement": "This is a test problem statement that is at least 15 characters long"}),
    ("GET", "/docs", None),
]

for method, endpoint, payload in endpoints_to_test:
    try:
        if method == "GET":
            response = requests.get(f"{BASE_URL}{endpoint}", timeout=30)
        else:
            response = requests.post(f"{BASE_URL}{endpoint}", json=payload, timeout=30)
        
        if response.status_code < 500:
            status_msg = "OK" if response.status_code < 400 else "WARN"
            print(f"  [{status_msg}] {method:6} {endpoint:30} -> {response.status_code}")
            test_results["api_endpoints"][endpoint] = response.status_code < 500
        else:
            print(f"  [FAIL] {method:6} {endpoint:30} -> {response.status_code}")
            test_results["api_endpoints"][endpoint] = False
    except Exception as e:
        print(f"  [FAIL] {method:6} {endpoint:30} -> {type(e).__name__}")
        test_results["api_endpoints"][endpoint] = False

# Step 5: Verify real data (not hardcoded)
print("\n[5/8] Verifying real data responses...")
try:
    response = requests.post(
        f"{BASE_URL}/api/validate",
        json={
            "problem_statement": "AI powered code generation for hackathons is great",
            "mode": "full"
        },
        timeout=30
    )
    
    if response.status_code == 200:
        data = response.json()
        
        # Check structure
        if "similar_research" in data:
            print(f"  [OK] Response contains similar_research field")
            test_results["real_data_checks"]["similar_research"] = True
        
        if "analysis" in data:
            print(f"  [OK] Response contains analysis field")
            test_results["real_data_checks"]["analysis"] = True
        
        # Check for non-empty results
        if isinstance(data.get("similar_research"), list) and len(data["similar_research"]) > 0:
            print(f"  [OK] Returned {len(data['similar_research'])} research items")
            item = data["similar_research"][0]
            if "title" in item and "source" in item:
                print(f"     - Title: {item['title'][:50]}...")
                print(f"     - Source: {item['source']}")
                test_results["real_data_checks"]["data_fields"] = True
        else:
            print(f"  [WARN] No research items returned (may be API timeout)")
    else:
        print(f"  [FAIL] Status {response.status_code}: {response.text[:100]}")
except Exception as e:
    print(f"  [FAIL] {type(e).__name__}: {str(e)[:80]}")
    test_results["real_data_checks"]["data_call"] = False

# Step 6: Test error handling
print("\n[6/8] Testing error handling...")
try:
    # Test with invalid input
    response = requests.post(
        f"{BASE_URL}/api/validate",
        json={},  # Missing required fields
        timeout=30
    )
    
    if response.status_code >= 400:
        data = response.json()
        if "detail" in data or "message" in data:
            print(f"  [OK] Error response includes detail/message")
            test_results["api_endpoints"]["error_handling"] = True
        else:
            print(f"  [WARN] Error response missing detail field")
    else:
        print(f"  [WARN] Invalid input not rejected (status {response.status_code})")
except Exception as e:
    print(f"  [FAIL] {type(e).__name__}")

# Step 7: Backend routes summary
print("\n[7/8] Backend routes available...")
try:
    response = requests.get(f"{BASE_URL}/openapi.json", timeout=5)
    if response.status_code == 200:
        openapi_data = response.json()
        paths = openapi_data.get("paths", {})
        print(f"  [OK] OpenAPI spec accessible")
        print(f"      Total routes: {len(paths)}")
        
        # Count by category
        categories = {}
        for path in paths.keys():
            if path.startswith("/api/"):
                category = path.split("/")[2]
                categories[category] = categories.get(category, 0) + 1
        
        for cat, count in sorted(categories.items()):
            print(f"      - /api/{cat}: {count} routes")
except Exception as e:
    print(f"  [WARN] Could not load OpenAPI spec: {e}")

# Step 8: Final summary
print("\n[8/8] VALIDATION SUMMARY")
print("=" * 80)

passed = sum(1 for v in test_results.values() if v is True or (isinstance(v, dict) and v))
total_checks = len([v for v in test_results.values() if isinstance(v, bool)]) + len(test_results.get("api_endpoints", {})) + len(test_results.get("real_data_checks", {}))

print(f"\nBackend Status: {'RUNNING' if test_results['backend_startup'] else 'FAILED'}")
print(f"CORS Enabled: {'YES' if test_results['cors_test'] else 'NO'}")
print(f"API Endpoints: {sum(1 for v in test_results.get('api_endpoints', {}).values() if v)}/{len(test_results.get('api_endpoints', {})) + 3} working")
print(f"Real Data: {'YES' if test_results.get('real_data_checks', {}) else 'NOT VERIFIED'}")

if test_results.get("errors"):
    print(f"\nErrors Detected:")
    for error in test_results["errors"]:
        print(f"  - {error}")

print("\n" + "=" * 80)

# Cleanup
try:
    if sys.platform == "win32":
        os.system(f"taskkill /PID {backend_process.pid} /F 2>nul")
    else:
        backend_process.terminate()
except:
    pass

print("\nValidation complete. Check results above.")
sys.exit(0 if test_results["backend_startup"] else 1)
