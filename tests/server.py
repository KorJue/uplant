#!/usr/bin/env python3
"""Kleiner Prüfserver für die Testläufe.

Die Seiten sind reine statische Dateien; sie brauchen aber einen HTTP-Ursprung,
weil sie als ES-Module geladen werden. Der Server liefert deshalb nur das
Projektverzeichnis aus und schweigt dabei.
"""
import http.server
import os
import socketserver
import sys

WURZEL = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
PORT = int(os.environ.get("UPLANT_PORT", "8936"))


class Leise(http.server.SimpleHTTPRequestHandler):
    def log_message(self, *args):
        pass


class Server(socketserver.ThreadingTCPServer):
    allow_reuse_address = True
    daemon_threads = True


if __name__ == "__main__":
    os.chdir(WURZEL)
    with Server(("127.0.0.1", PORT), Leise) as s:
        print(f"Prüfserver auf http://127.0.0.1:{PORT} (Wurzel {WURZEL})", file=sys.stderr)
        s.serve_forever()
