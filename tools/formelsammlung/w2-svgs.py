#!/usr/bin/env python3
"""Erzeugt die Figuren der Formelsammlung „Bedingte Wahrscheinlichkeit“.

Baum, Flächenmodell und Tafeln werden aus denselben drei Zahlen gerechnet wie die Musterrechnungen
(P(A) = 0,4, P_A(B) = 0,7, P_Ā(B) = 0,3). So kann keine Figur etwas anderes zeigen als der Text.

    python3 w2-svgs.py      schreibt w2-figuren.txt (eine Figur je Zeile)
"""
import pathlib
from fractions import Fraction as Q

from tf_kopf import BLAU, GRUEN, ORANGE, GRAU, SCHWARZ, f, rect, setze_flaeche, svg, txt
from ws_kopf import baum, quadrat, tafel

A, X, Y = Q(4, 10), Q(7, 10), Q(3, 10)
AB, AQB = A * X, (1 - A) * Y
PB = AB + AQB
assert (AB, PB) == (Q(28, 100), Q(46, 100)), "Zahlen der Formelsammlung haben sich verschoben"


# ---------- Figur 1: Baum — die zweite Stufe sind bedingte Wahrscheinlichkeiten ----------

def fig_baum():
    s1 = [("A", A), ("Ā", 1 - A)]
    s2 = {"A": [("B", X), ("B̄", 1 - X)], "Ā": [("B", Y), ("B̄", 1 - Y)]}
    return svg(250.0, 96.0, baum(250.0, 96.0, s1, s2, markiert={("A", "B")}))


# ---------- Figur 2: reduzierte Ergebnismenge beim Würfel ----------

def fig_wuerfel():
    B_, H_ = 250.0, 62.0
    setze_flaeche(B_, H_)
    ereignis_a, ereignis_b = {2, 4, 6}, {4, 5, 6}
    t = []
    for i in range(1, 7):
        x = 12 + (i - 1) * 38
        in_a, in_b = i in ereignis_a, i in ereignis_b
        t.append(rect(x, 14, 30, 30, BLAU if in_a else GRAU, GRUEN if in_b else "none", 2.0 if in_a else 0.8, 0.35 if in_b else 1.0, 3))
        t.append(txt(x + 15, 33, str(i), SCHWARZ if in_a else GRAU, 11.0, 700 if in_a else 400))
    anteil = Q(len(ereignis_a & ereignis_b), len(ereignis_a))
    assert anteil == Q(2, 3)
    t.append(txt(12, 9, "blau umrandet: A = „gerade“ — die neue Welt", BLAU, 6.6, 700, "start"))
    t.append(txt(12, 57, f"grün: B = „größer als 3“ — in A liegen 2 von 3: P<tspan baseline-shift=\"sub\" font-size=\"5\">A</tspan>(B) = {anteil.numerator}/{anteil.denominator}", GRUEN, 6.6, 700, "start"))
    return svg(B_, H_, t)


# ---------- Figur 3/4: das Flächenmodell mit Bedingung A bzw. B ----------

def fig_quadrat_a():
    t = quadrat(180.0, 150.0, float(A), float(X), float(Y), markiert={"AB", "ABq"}, rahmen={"AB", "ABq"},
                titel="Bedingung A: nur die Spalte A zählt")
    return svg(180.0, 150.0, t)


def fig_quadrat_b():
    t = quadrat(180.0, 150.0, float(A), float(X), float(Y), markiert={"AB", "AqB"}, rahmen={"AB", "AqB"},
                titel="Bedingung B: der untere Streifen zählt")
    return svg(180.0, 150.0, t)


# ---------- Figur 5: Tafel mit Anzahlen — Zeile oder Spalte als Bedingung ----------

RB = [[36, 84], [24, 256]]   # Raucher/Nichtraucher × Husten/kein Husten, 400 Befragte


def fig_tafel():
    return tafel(["Raucher", "Nichtraucher"], ["Husten", "kein Husten"], RB, fmt=lambda v: str(v), hervor={(0, 0)})


# ---------- Figur 6/7: Leons Stolperstelle — Baum aus der Tafel, falsch und richtig ----------

def leon(falsch):
    N = sum(map(sum, RB))
    zeilen = [sum(r) for r in RB]
    s1 = [("R", Q(zeilen[0], N), f"{zeilen[0]}/{N}"), ("R̄", Q(zeilen[1], N), f"{zeilen[1]}/{N}")]
    if falsch:
        # Leon schreibt die Zellen (Anteile an allen) direkt an die Äste.
        s2 = {n: [("H", Q(RB[i][0], N), f"{RB[i][0]}/{N}"), ("H̄", Q(RB[i][1], N), f"{RB[i][1]}/{N}")] for i, (n, _, _) in enumerate(s1)}
    else:
        s2 = {n: [("H", Q(RB[i][0], zeilen[i]), f"{RB[i][0]}/{zeilen[i]}"), ("H̄", Q(RB[i][1], zeilen[i]), f"{RB[i][1]}/{zeilen[i]}")] for i, (n, _, _) in enumerate(s1)}
    return svg(210.0, 90.0, baum(210.0, 90.0, s1, s2, pfade=False, falsch=falsch, dx=62.0, x0=40.0))


def fig_leon_falsch():
    return leon(True)


def fig_leon_richtig():
    return leon(False)


FIGUREN = [fig_baum, fig_wuerfel, fig_quadrat_a, fig_quadrat_b, fig_tafel, fig_leon_falsch, fig_leon_richtig]

if __name__ == "__main__":
    zeilen = [fn() for fn in FIGUREN]
    pfad = pathlib.Path(__file__).parent / "w2-figuren.txt"
    pfad.write_text("\n".join(zeilen) + "\n", encoding="utf-8")
    print(f"{len(zeilen)} Figuren geschrieben")
