#!/usr/bin/env python3
"""Erzeugt die SVG-Figuren der Formelsammlung „Bernoulli-Ketten und Binomialverteilung“.

Jede Säule wird aus der Formel von Bernoulli gerechnet, nicht gezeichnet. Das Skript prüft dabei
mit, dass die Säulen jeder Verteilung zusammen 1 ergeben — eine falsche Formel fiele sofort auf.

    python3 bk-svgs.py      schreibt bk-figuren.txt (eine Zeichnung je Zeile)
"""
import math
import pathlib

from tf_kopf import (BLAU, GRUEN, ORANGE, ROT, VIOLETT, GRAU, SCHWARZ,
                     de, f, lin, rect, setze_flaeche, svg, txt)


def B(n, p, k):
    return math.comb(n, k) * p ** k * (1 - p) ** (n - k)


def F(n, p, k):
    return sum(B(n, p, i) for i in range(0, k + 1))


def histogramm(B_, H_, daten, farbe_von, *, ymax, schritt, x_jede=1, mu=None, band=None, titel=None, y_name="P(X = k)", x_name="k"):
    """Säulendiagramm in Zeichenpunkten; daten = [(x, p)]."""
    setze_flaeche(B_, H_)
    links, rechts, oben, unten = 30.0, 10.0, 16.0, 20.0
    xs = [x for x, _ in daten]
    xmin, xmax = min(xs) - 0.5, max(xs) + 0.5
    sx = (B_ - links - rechts) / (xmax - xmin)
    sy = (H_ - oben - unten) / ymax
    X = lambda x: links + (x - xmin) * sx
    Y = lambda y: H_ - unten - y * sy
    t = []
    y = 0.0
    while y <= ymax + 1e-9:
        t.append(lin((links, Y(y)), (B_ - rechts, Y(y)), "#d5dae0", 0.6))
        t.append(txt(links - 4, Y(y) + 2.4, de(y, 2 if schritt < 0.1 else 1), GRAU, 6.2, 400, "end"))
        y += schritt
    if band:
        a, b = band
        t.append(rect(X(a), oben, X(b) - X(a), H_ - oben - unten, ROT, ROT, 0.8, 0.07))
    for x, p in daten:
        farbe = farbe_von(x)
        t.append(rect(X(x - 0.5), Y(p), sx, p * sy, farbe, farbe, 0.6, 0.45 if farbe != GRAU else 0.25))
    t.append(lin((links, Y(0)), (B_ - rechts, Y(0)), SCHWARZ, 0.9))
    t.append(lin((links, oben - 4), (links, Y(0)), SCHWARZ, 0.9))
    for x, _ in daten:
        if x % x_jede == 0:
            t.append(txt(X(x), H_ - unten + 9, de(x), GRAU, 6.2))
    t.append(txt(B_ - rechts, H_ - 3, x_name, GRAU, 6.4, 400, "end"))
    t.append(txt(links + 3, oben - 5, y_name, GRAU, 6.4, 400, "start"))
    if mu is not None:
        t.append(lin((X(mu), oben), (X(mu), Y(0)), VIOLETT, 1.4))
        t.append(txt(X(mu) + 5, oben + 7, "μ", VIOLETT, 7.4, 700))
    if titel:
        # Der Titel steht in der Kopfzeile über der Zeichenfläche, rechts neben der Achsenbeschriftung.
        # Innerhalb der Fläche läge er je nach p auf der μ-Linie oder auf einer Säule.
        t.append(txt(B_ - rechts, oben - 5, titel, SCHWARZ, 6.8, 700, "end"))
    return t


# ---------- Figur 1: Zufallsgröße — Augensumme zweier Würfel ----------

def fig_augensumme():
    daten = []
    for s in range(2, 13):
        anzahl = sum(1 for a in range(1, 7) for b in range(1, 7) if a + b == s)
        daten.append((s, anzahl / 36))
    assert abs(sum(p for _, p in daten) - 1) < 1e-12, "Augensumme: Verteilung ergibt nicht 1"
    t = histogramm(300.0, 118.0, daten, lambda x: GRUEN if x == 7 else GRAU, ymax=0.2, schritt=0.05,
                   mu=7, y_name="P(X = x)", x_name="x", titel="X: Augensumme")
    return svg(300.0, 118.0, t)


# ---------- Figur 2: Baum einer Bernoulli-Kette der Länge 3 ----------

def fig_baum():
    B_, H_ = 300.0, 150.0
    setze_flaeche(B_, H_)
    t = []
    x0, dx, y0, dy = 16.0, 62.0, 16.0, 16.0
    blaetter = []

    def knoten(wort, tiefe, oben, unten):
        y = (oben + unten) / 2
        x = x0 + tiefe * dx
        if tiefe == 3:
            k = wort.count("T")
            farbe = GRUEN if k == 2 else GRAU
            t.append(txt(x + 5, y + 2.4, wort, farbe, 6.8, 700 if k == 2 else 400, "start"))
            pfad = " · ".join("p" if c == "T" else "(1 − p)" for c in wort)
            if k == 2:
                t.append(txt(x + 30, y + 2.4, "p² · (1 − p)", GRUEN, 6.4, 700, "start"))
            blaetter.append((wort, pfad))
            return
        mitte = (oben + unten) / 2
        for c, a, b in (("T", oben, mitte), ("N", mitte, unten)):
            ziel = (x + dx, (a + b) / 2)
            farbe = GRUEN if c == "T" else ORANGE
            t.append(lin((x, y), ziel, farbe, 1.0))
            if tiefe == 0:
                t.append(txt((x + ziel[0]) / 2 - 6, (y + ziel[1]) / 2 + (-5 if c == "T" else 10), "p" if c == "T" else "1 − p", farbe, 6.6, 700))
            knoten(wort + c, tiefe + 1, a, b)
        t.append(f'<circle cx="{f(x)}" cy="{f(y)}" r="1.9" fill="{SCHWARZ}"/>')

    knoten("", 0, y0, y0 + 8 * dy)
    zwei = [w for w, _ in blaetter if w.count("T") == 2]
    assert len(zwei) == math.comb(3, 2), "Baum: falsche Zahl der Pfade mit 2 Treffern"
    t.append(txt(B_ - 4, H_ - 4, f"{len(zwei)} Pfade mit k = 2: P(X = 2) = (3 über 2) · p² · (1 − p)", GRUEN, 6.6, 700, "end"))
    return svg(B_, H_, t)


# ---------- Figur 3: Einfluss von p — B(10; p; k) für p = 0,2 / 0,5 / 0,8 ----------

def fig_einfluss_p():
    B_, H_ = 300.0, 100.0
    setze_flaeche(B_, H_)
    t = []
    for i, p in enumerate((0.2, 0.5, 0.8)):
        n = 10
        daten = [(k, B(n, p, k)) for k in range(n + 1)]
        assert abs(sum(q for _, q in daten) - 1) < 1e-12
        teil = histogramm(100.0, 100.0, daten, lambda x: BLAU, ymax=0.35, schritt=0.1, x_jede=5, mu=n * p,
                          titel=f"p = {de(p, 1)}")
        t.append(f'<g transform="translate({f(i * 100.0)},0)">' + "".join(teil) + "</g>")
    setze_flaeche(B_, H_)
    return svg(B_, H_, t)


# ---------- Figur 4: kumulierte Verteilung und die Ereignistypen ----------

def fig_kumuliert():
    n, p = 20, 0.2
    daten = [(k, B(n, p, k)) for k in range(n + 1)]
    t = histogramm(300.0, 120.0, daten, lambda x: GRUEN if x >= 6 else ORANGE, ymax=0.25, schritt=0.05, x_jede=2,
                   titel="n = 20, p = 0,2: P(X ≥ 6)")
    wert = 1 - F(n, p, 5)
    t.append(txt(290, 42, f"grün: 1 − F(20; 0,2; 5) ≈ {de(wert, 4)}", GRUEN, 6.6, 700, "end"))
    t.append(txt(290, 52, f"orange: F(20; 0,2; 5) ≈ {de(F(n, p, 5), 4)}", ORANGE, 6.6, 700, "end"))
    return svg(300.0, 120.0, t)


# ---------- Figur 5: μ und σ — B(40; 0,3; k) mit Band ----------

def fig_mu_sigma():
    n, p = 40, 0.3
    mu, s = n * p, math.sqrt(n * p * (1 - p))
    daten = [(k, B(n, p, k)) for k in range(0, 26)]
    innen = [k for k in range(n + 1) if mu - s <= k <= mu + s]
    anteil = sum(B(n, p, k) for k in innen)
    t = histogramm(300.0, 120.0, daten, lambda x: GRUEN if x in innen else GRAU, ymax=0.15, schritt=0.05, x_jede=5,
                   mu=mu, band=(mu - s, mu + s), titel="n = 40, p = 0,3")
    t.append(txt(290, 40, f"μ = 12, σ ≈ {de(s, 2)}", VIOLETT, 6.6, 700, "end"))
    t.append(txt(290, 50, f"P({innen[0]} ≤ X ≤ {innen[-1]}) ≈ {de(anteil, 3)}", GRUEN, 6.6, 700, "end"))
    return svg(300.0, 120.0, t)


FIGUREN = [fig_augensumme, fig_baum, fig_einfluss_p, fig_kumuliert, fig_mu_sigma]

if __name__ == "__main__":
    zeilen = [fn() for fn in FIGUREN]
    pfad = pathlib.Path(__file__).parent / "bk-figuren.txt"
    pfad.write_text("\n".join(zeilen) + "\n", encoding="utf-8")
    print(f"{len(zeilen)} Figuren geschrieben")
