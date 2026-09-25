#!/usr/bin/env python3
"""Erzeugt die Figuren der Formelsammlung „Stochastische Unabhängigkeit“.

Die Urne (3 grüne, 4 rote Kugeln) und die beiden Tafeln der Lernseite werden hier nachgerechnet;
das Skript prüft mit, dass „mit Zurücklegen“ wirklich unabhängig und „ohne“ wirklich abhängig ist,
und dass die Tafeln das Urteil tragen, das der Text fällt.

    python3 w4-svgs.py      schreibt w4-figuren.txt (eine Figur je Zeile)
"""
import pathlib
from fractions import Fraction as Q

from tf_kopf import svg
from ws_kopf import P_, baum, quadrat, tafel

G, R = 3, 4


def urne(mit):
    n = G + R
    s1 = [("grün", Q(G, n), f"{G}/{n}"), ("rot", Q(R, n), f"{R}/{n}")]
    if mit:
        s2 = {k: [("grün", Q(G, n), f"{G}/{n}"), ("rot", Q(R, n), f"{R}/{n}")] for k in ("grün", "rot")}
    else:
        s2 = {"grün": [("grün", Q(G - 1, n - 1), f"{G - 1}/{n - 1}"), ("rot", Q(R, n - 1), f"{R}/{n - 1}")],
              "rot": [("grün", Q(G, n - 1), f"{G}/{n - 1}"), ("rot", Q(R - 1, n - 1), f"{R - 1}/{n - 1}")]}
    gleich = s2["grün"][1][1] == s2["rot"][1][1]
    assert gleich == mit, "Urne: das Urteil passt nicht zum Ziehen"
    return svg(200.0, 86.0, baum(200.0, 86.0, s1, s2, pfade=False, markiert={("grün", "rot"), ("rot", "rot")}, x0=30.0, dx=66.0))


def fig_mit():
    return urne(True)


def fig_ohne():
    return urne(False)


def fig_unabhaengig():
    return svg(170.0, 150.0, quadrat(170.0, 150.0, 0.4, 0.6, 0.6, markiert={"AB", "AqB"}, titel=f"{P_('A', 'B')} = {P_('Ā', 'B')} = 0,6: unabhängig"))


def fig_abhaengig():
    return svg(170.0, 150.0, quadrat(170.0, 150.0, 0.4, 0.6, 0.3, markiert={"AB", "AqB"}, titel=f"{P_('A', 'B')} = 0,6, {P_('Ā', 'B')} = 0,3: abhängig"))


ARBEIT = [[213, 132], [126, 50]]
SCHAL = [[35, 15], [5, 45]]


def urteil(werte):
    N = sum(map(sum, werte))
    pa = Q(sum(werte[0]), N)
    pb = Q(werte[0][0] + werte[1][0], N)
    return Q(werte[0][0], N), pa * pb


def fig_arbeit():
    ab, prod = urteil(ARBEIT)
    assert abs(float(ab) - 0.409) < 5e-4 and abs(float(prod) - 0.431) < 5e-4 and ab != prod
    return tafel(["mehr als 40 h", "bis 40 h"], ["ruhig", "unruhig"], ARBEIT, fmt=lambda v: str(v), hervor={(0, 0)})


def fig_schal():
    ab, prod = urteil(SCHAL)
    assert (ab, prod) == (Q(35, 100), Q(20, 100))
    return tafel(["Schal", "kein Schal"], ["erkältet", "nicht erk."], SCHAL, fmt=lambda v: str(v), hervor={(0, 0)})


FIGUREN = [fig_mit, fig_ohne, fig_unabhaengig, fig_abhaengig, fig_arbeit, fig_schal]

if __name__ == "__main__":
    zeilen = [fn() for fn in FIGUREN]
    pfad = pathlib.Path(__file__).parent / "w4-figuren.txt"
    pfad.write_text("\n".join(zeilen) + "\n", encoding="utf-8")
    print(f"{len(zeilen)} Figuren geschrieben")
