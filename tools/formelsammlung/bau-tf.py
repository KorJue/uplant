#!/usr/bin/env python3
"""Setzt die erzeugten SVG-Figuren an die Platzhalter der Quelldatei."""
import pathlib
hier = pathlib.Path(__file__).parent
figuren = (hier / "tf-figuren.txt").read_text(encoding="utf-8").splitlines()
s = (hier / "formelsammlung-tf-quelle.html").read_text(encoding="utf-8")
for i, fig in enumerate(figuren, start=1):
    marke = f"[[FIG{i}]]"
    assert marke in s, f"Platzhalter {marke} fehlt in der Quelldatei"
    s = s.replace(marke, fig)
assert "[[FIG" not in s, "Es sind Platzhalter ohne Figur übrig"
(hier / "formelsammlung-tf.html").write_text(s, encoding="utf-8")
print(f"{len(figuren)} Figuren eingesetzt")
