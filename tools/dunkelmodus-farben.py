#!/usr/bin/env python3
"""Ergänzt in jedem Lernpfad-Stylesheet einen Block für den Dunkelmodus.

Die Seiten benutzen durchgehend eine Palette, die für hellen Grund gewählt
wurde. Auf dem dunklen Kartengrund (#1c2128) bleibt davon zu wenig übrig: Das
Grün #157347 hat dort einen Leuchtdichteabstand von 29, das Violett #6d28d9
sogar nur 21 — nötig sind gut 45. Fast-Schwarz kommt auf 2 und ist damit
unsichtbar.

Dieses Werkzeug sucht deshalb in jeder lernpfad.css alle Regeln, die Text eine
dieser Farben geben, und hängt am Ende der Datei einen Block an, der dieselben
Selektoren im Dunkelmodus auf die helle Entsprechung setzt. Angehängt wird er,
damit er bei gleicher Spezifität gewinnt.

Umgestellt wird nur Textfarbe:

* `color:` — das ist immer Text.
* `fill:` nur dort, wo die Regel selbst Schrifteigenschaften setzt, ihr
  Selektor Text benennt oder eine ihrer Klassen anderswo eine Schriftgröße
  bekommt — `.me-blatt.ereignis` erbt sie von `.me-blatt`. Eine Fläche mit
  `fill` bliebe sonst grell.

Aufruf:  python3 tools/dunkelmodus-farben.py [--pruefen]
"""

import pathlib
import re
import sys

WURZEL = pathlib.Path(__file__).resolve().parent.parent
BEREICH = WURZEL / "mathematik" / "grundwissen-5-10"

# Helle Entsprechungen. Sie sind dieselben, die die Kartenfarben und die
# Rückmeldungen im Dunkelmodus schon benutzen, damit das Blatt eine Handschrift
# behält.
ERSATZ = {
    "#157347": "#6fd68f",   # grün
    "#6d28d9": "#c4a7ff",   # violett
    "#b3261e": "#ff8a8a",   # rot
    "#1d4ed8": "#8ab4ff",   # blau
    "#2563eb": "#8ab4ff",   # zweites Blau, dieselbe Rolle
    "#b3650a": "#ffbf6e",   # orange
    "#0f5132": "#6fd68f",   # dunkles Grün in Merkkästen
    "#8a1c16": "#ff8a8a",   # dunkles Rot
    "#8a4b0a": "#ffc078",   # dunkles Orange
    "#1f2933": "#e6e8eb",   # Fast-Schwarz in Zeichnungen
    "#1f2328": "#e6e8eb",
    "#000000": "#e6e8eb",
    "#000": "#e6e8eb",
}

MARKE = "/* ---------- Dunkelmodus: Textfarben aufhellen (erzeugt von tools/dunkelmodus-farben.py) ---------- */"

KOPF = MARKE + """

/* Die Farben oben sind für hellen Grund gewählt. Auf #1c2128 hat etwa das
   Grün #157347 nur noch einen Leuchtdichteabstand von 29 (nötig sind gut 45),
   das Violett 21 und Fast-Schwarz 2. Die folgenden Regeln setzen dieselben
   Selektoren im Dunkelmodus auf die helle Entsprechung; sie stehen am Ende
   der Datei, damit sie bei gleicher Spezifität gewinnen. */
"""

REGEL = re.compile(r"([^{}]+)\{([^{}]*)\}")
SCHRIFT = re.compile(r"\bfont-(size|weight|family)\b")
TEXT_SELEKTOR = re.compile(r"text|schrift|label|beschriftung|zahl|wert|name|titel|caption", re.I)


def klassen(selektor):
    return set(re.findall(r"\.([A-Za-z0-9_-]+)", selektor))


def schriftklassen(css):
    """Klassen, die irgendwo Schrifteigenschaften bekommen — sie stehen für Text."""
    gefunden = set()
    for selektor, koerper in REGEL.findall(css):
        if SCHRIFT.search(koerper):
            gefunden |= klassen(selektor)
    return gefunden


def farben_einer_regel(selektor, koerper, textklassen=frozenset()):
    """Welche Farben dieser Regel gehören zu Text?"""
    treffer = {}
    fuehrt_schrift = bool(SCHRIFT.search(koerper)) or bool(klassen(selektor) & textklassen)
    benennt_text = bool(TEXT_SELEKTOR.search(selektor))
    for eigenschaft, wert in re.findall(r"(color|fill)\s*:\s*([^;]+);", koerper):
        farbe = wert.strip().lower()
        if farbe not in ERSATZ:
            continue
        if eigenschaft == "fill" and not (fuehrt_schrift or benennt_text):
            continue        # eine Fläche, kein Text
        treffer[eigenschaft] = ERSATZ[farbe]
    return treffer


def block_fuer(css):
    zeilen = []
    textklassen = schriftklassen(css)
    for selektor, koerper in REGEL.findall(css):
        selektor = " ".join(selektor.split())
        if not selektor or selektor.startswith("@") or "data-theme" in selektor:
            continue
        treffer = farben_einer_regel(selektor, koerper, textklassen)
        if not treffer:
            continue
        # Mehrere Selektoren einer Regel einzeln qualifizieren.
        teile = ", ".join(f':root[data-theme="dark"] {s.strip()}' for s in selektor.split(","))
        inhalt = " ".join(f"{e}: {f};" for e, f in sorted(treffer.items()))
        zeilen.append(f"{teile} {{ {inhalt} }}")
    return zeilen


def main():
    nur_pruefen = "--pruefen" in sys.argv
    geaendert = 0
    for datei in sorted(BEREICH.glob("*/*/lernpfad.css")):
        css = datei.read_text(encoding="utf-8")
        # Einen früheren Lauf zuerst entfernen, damit das Werkzeug wiederholbar ist.
        if MARKE in css:
            css = css[: css.index(MARKE)].rstrip() + "\n"
        zeilen = block_fuer(css)
        neu = css if not zeilen else css.rstrip() + "\n\n" + KOPF + "\n" + "\n".join(zeilen) + "\n"
        if neu != datei.read_text(encoding="utf-8"):
            geaendert += 1
            print(f"{datei.relative_to(WURZEL)}: {len(zeilen)} Regeln")
            if not nur_pruefen:
                datei.write_text(neu, encoding="utf-8")
    print(f"{geaendert} Dateien {'wären betroffen' if nur_pruefen else 'geändert'}")


if __name__ == "__main__":
    main()
