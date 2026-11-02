"""Static fixture server; one test context can simulate an unavailable origin."""
from http.server import ThreadingHTTPServer, SimpleHTTPRequestHandler

class Handler(SimpleHTTPRequestHandler):
    def do_GET(self):
        if 'motorradar-test-outage=1' in self.headers.get('Cookie', ''):
            self.send_response(503)
            self.end_headers()
            self.wfile.write(b'Origin unavailable (test fixture)')
            return
        super().do_GET()

ThreadingHTTPServer(('127.0.0.1', 8000), Handler).serve_forever()
