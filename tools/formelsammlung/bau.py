#!/usr/bin/env python3
"""Setzt die erzeugten SVG-Figuren an die Platzhalter einer Quelldatei.

    python3 bau.py <praefix>

liest <praefix>-figuren.txt (eine SVG-Zeichnung je Zeile) und
formelsammlung-<praefix>-quelle.html und schreibt formelsammlung-<praefix>.html.
"""
import pathlib
import sys

praefix = sys.argv[1] if len(sys.argv) > 1 else "tf"
hier = pathlib.Path(__file__).parent
figuren = (hier / f"{praefix}-figuren.txt").read_text(encoding="utf-8").splitlines()
s = (hier / f"formelsammlung-{praefix}-quelle.html").read_text(encoding="utf-8")
for i, fig in enumerate(figuren, start=1):
    marke = f"[[FIG{i}]]"
    assert marke in s, f"Platzhalter {marke} fehlt in der Quelldatei"
    s = s.replace(marke, fig)
assert "[[FIG" not in s, "Es sind Platzhalter ohne Figur übrig"
(hier / f"formelsammlung-{praefix}.html").write_text(s, encoding="utf-8")
print(f"{len(figuren)} Figuren eingesetzt")
