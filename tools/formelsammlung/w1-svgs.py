#!/usr/bin/env python3
"""Erzeugt die Figuren der Formelsammlung „Grundbegriffe, Baumdiagramme und Vierfeldertafel“.

Die Häufigkeitskurve wird aus einer festen Folge von Würfen gerechnet, Baum, Flächenmodell und
Tafeln aus den Kugelzahlen. Jede Figur prüft sich selbst (Summen 1, Flächen füllen das Quadrat).

    python3 w1-svgs.py      schreibt w1-figuren.txt (eine Figur je Zeile)
"""
import pathlib
from fractions import Fraction as Q

from tf_kopf import BLAU, ROT, GRUEN, ORANGE, GRAU, SCHWARZ, VIOLETT, de, lin, polyline, setze_flaeche, svg, txt
from ws_kopf import baum, quadrat, tafel, zahl

ROT_K, BLAU_K = 4, 6   # die Urne der Lernseite: 4 rote, 6 blaue Kugeln


# ---------- Figur 1: relative Häufigkeit der Sechs, 600 Würfe ----------

def fig_gesetz():
    B_, H_ = 300.0, 104.0
    setze_flaeche(B_, H_)
    # Eine feste, gleichverteilte Folge (lineare Kongruenz): Das Bild ist bei jedem Lauf dasselbe.
    z, sechsen, punkte = 20240917, 0, []
    n_max = 600
    links, rechts, oben, unten = 26.0, 8.0, 10.0, 16.0
    X = lambda n: links + (n / n_max) * (B_ - links - rechts)
    Y = lambda h: H_ - unten - (h / 0.5) * (H_ - oben - unten)
    for n in range(1, n_max + 1):
        z = (1103515245 * z + 12345) % 2 ** 31
        if (z >> 16) % 6 == 5:
            sechsen += 1
        # Gezeichnet ab n = 20: Bei den ersten Würfen springt die Kurve zwischen 0 und 1 und
        # verließe die Achse; der Text unter der Figur nennt den Beginn.
        if n >= 20:
            assert sechsen / n <= 0.5, "Gesetz der großen Zahlen: Kurve verlässt die Achse"
            punkte.append((X(n), Y(sechsen / n)))
    t = []
    for h in (0.0, 0.1, 0.2, 0.3, 0.4, 0.5):
        t.append(lin((links, Y(h)), (B_ - rechts, Y(h)), "#d5dae0", 0.6))
        t.append(txt(links - 3, Y(h) + 2.3, de(h, 1), GRAU, 6.0, 400, "end"))
    t.append(lin((links, Y(1 / 6)), (B_ - rechts, Y(1 / 6)), VIOLETT, 1.0, "4 2"))
    t.append(txt(B_ - rechts, Y(1 / 6) - 3, "1/6 ≈ 0,167", VIOLETT, 6.4, 700, "end"))
    t.append(polyline(punkte, BLAU, 1.1))
    for n in (100, 200, 300, 400, 500, 600):
        t.append(txt(X(n), H_ - unten + 9, str(n), GRAU, 6.0))
    t.append(txt(B_ - rechts, H_ - 2, "Anzahl der Würfe n", GRAU, 6.2, 400, "end"))
    t.append(txt(links + 3, oben - 2, "relative Häufigkeit der Sechs", GRAU, 6.2, 400, "start"))
    assert abs(sechsen / n_max - 1 / 6) < 0.05, "Gesetz der großen Zahlen: die Folge ist nicht gleichverteilt"
    return svg(B_, H_, t)


def urne(ohne):
    n = ROT_K + BLAU_K
    s1 = [("rot", Q(ROT_K, n)), ("blau", Q(BLAU_K, n))]
    if ohne:
        s2 = {"rot": [("rot", Q(ROT_K - 1, n - 1), f"{ROT_K - 1}/{n - 1}"), ("blau", Q(BLAU_K, n - 1), f"{BLAU_K}/{n - 1}")],
              "blau": [("rot", Q(ROT_K, n - 1), f"{ROT_K}/{n - 1}"), ("blau", Q(BLAU_K - 1, n - 1), f"{BLAU_K - 1}/{n - 1}")]}
    else:
        s2 = {k: [("rot", Q(ROT_K, n)), ("blau", Q(BLAU_K, n))] for k in ("rot", "blau")}
    return s1, s2


# ---------- Figur 2: Baum mit Zurücklegen ----------

def fig_baum_mit():
    s1, s2 = urne(False)
    return svg(250.0, 96.0, baum(250.0, 96.0, s1, s2, markiert={("blau", "rot")}))


# ---------- Figur 3: Flächenmodell mit Zurücklegen ----------

def fig_quadrat():
    a, x = ROT_K / 10, ROT_K / 10
    t = quadrat(260.0, 196.0, a, x, x, spalten=("1. rot", "1. blau"), zeilen=("2. rot", "2. blau"),
                markiert={"AB", "AqB"}, rahmen={"AqB"}, titel="Pfad blau → rot: 0,6 · 0,4 = 0,24",
                farben=(ROT, BLAU), rahmenfarbe=SCHWARZ)
    return svg(260.0, 196.0, t)


# ---------- Figur 4: Baum ohne Zurücklegen ----------

def fig_baum_ohne():
    s1, s2 = urne(True)
    return svg(250.0, 96.0, baum(250.0, 96.0, s1, s2, markiert={("rot", "blau"), ("blau", "rot")}))


# ---------- Figur 5: die zugehörige Vierfeldertafel ----------

def fig_tafel_ohne():
    s1, s2 = urne(True)
    werte = [[p1 * a[1] for a in s2[n1]] for n1, p1 in s1]
    assert sum(sum(r) for r in werte) == 1
    return tafel(["1. rot", "1. blau"], ["2. rot", "2. blau"], werte, hervor={(0, 1), (1, 0)})


# ---------- Figur 6: Tafel einer Musterrechnung mit absoluten Zahlen ----------

MR = dict(N=200, M=120, R=90, MR=50)   # 200 Befragte, 120 Mädchen, 90 fahren Rad, 50 Mädchen mit Rad


def fig_tafel_mr():
    N, M, R, MR_ = MR["N"], MR["M"], MR["R"], MR["MR"]
    werte = [[MR_, M - MR_], [R - MR_, N - M - R + MR_]]
    return tafel(["Mädchen", "Jungen"], ["Rad", "kein Rad"], werte, fmt=lambda v: str(v), hervor={(1, 0), (1, 1)})


FIGUREN = [fig_gesetz, fig_baum_mit, fig_quadrat, fig_baum_ohne, fig_tafel_ohne, fig_tafel_mr]

if __name__ == "__main__":
    zeilen = [fn() for fn in FIGUREN]
    pfad = pathlib.Path(__file__).parent / "w1-figuren.txt"
    pfad.write_text("\n".join(zeilen) + "\n", encoding="utf-8")
    print(f"{len(zeilen)} Figuren geschrieben")
