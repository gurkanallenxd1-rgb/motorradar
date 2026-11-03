"""Static fixture server; one test context can simulate an unavailable origin."""
from http.server import ThreadingHTTPServer, SimpleHTTPRequestHandler

class Handler(SimpleHTTPRequestHandler):
    def do_GET(self):
        if 'motorradar-test-outage=1' in self.headers.get('Cookie', ''):
            self.send_response(503)
            self.end_headers()
            self.wfile.write(b'Origin unavailable (test fixture)')
            return
        if 'motorradar-test-invalid=1' in self.headers.get('Cookie', '') and self.path.startswith('/data/cost-sources.json'):
            import json
            from pathlib import Path
            data = json.loads(Path('data/cost-sources.json').read_text())
            data['notary']['rate'] = 999
            self.send_response(200)
            self.send_header('Content-Type', 'application/json')
            self.end_headers()
            self.wfile.write(json.dumps(data).encode())
            return
        super().do_GET()

ThreadingHTTPServer(('127.0.0.1', 8000), Handler).serve_forever()
