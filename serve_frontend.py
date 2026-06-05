import http.server
import socketserver
import os
import sys

PORT = 8080
DIRECTORY = "frontend"

class Handler(http.server.SimpleHTTPRequestHandler):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=DIRECTORY, **kwargs)

try:
    with socketserver.TCPServer(("", PORT), Handler) as httpd:
        print(f"Serving frontend at http://localhost:{PORT}", file=sys.stderr)
        httpd.serve_forever()
except Exception as e:
    print(f"Error starting frontend server: {e}", file=sys.stderr)
    sys.exit(1)
