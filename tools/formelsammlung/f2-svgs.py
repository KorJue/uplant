#!/usr/bin/env python3
"""Erzeugt die Figuren der Formelsammlung „Grenzwerte und Stetigkeit“ (MSS 11, Analysis, Thema 2).

Jeder Graph wird aus der Funktion gerechnet und an Polstellen und Lücken aufgetrennt. Das Skript
prüft mit: x₀ zum ε-Streifen ist scharf, das Loch liegt auf dem Grenzwert, und jedes Intervall der
Halbierung enthält die Nullstelle.

    python3 f2-svgs.py      schreibt f2-figuren.txt (eine Figur je Zeile)
"""
import math
import pathlib

from tf_kopf import (BLAU, GRUEN, ORANGE, ROT, VIOLETT, GRAU, SCHWARZ, GITTER,
                     de, f, kreis, lin, polyline, rect, setze_flaeche, svg, txt)


def zahl(x, stellen=2):
    s = de(round(x, stellen), stellen)
    if "," in s:
        s = s.rstrip("0").rstrip(",")
    return s


class Achsen:
    def __init__(self, B_, H_, xmin, xmax, ymin, ymax, dx, dy, titel=None):
        setze_flaeche(B_, H_)
        self.B, self.H = B_, H_
        self.l, self.r, self.o, self.u = 20.0, 6.0, 12.0, 14.0
        self.xmin, self.xmax, self.ymin, self.ymax = xmin, xmax, ymin, ymax
        self.t = []
        x = math.ceil(xmin / dx) * dx
        while x <= xmax + 1e-9:
            self.t.append(lin((self.X(x), self.o), (self.X(x), H_ - self.u), GITTER, 0.4))
            self.t.append(txt(self.X(x), H_ - self.u + 7, zahl(x, 1), GRAU, 5.2))
            x += dx
        y = math.ceil(ymin / dy) * dy
        while y <= ymax + 1e-9:
            self.t.append(lin((self.l, self.Y(y)), (B_ - self.r, self.Y(y)), GITTER, 0.4))
            self.t.append(txt(self.l - 2.5, self.Y(y) + 1.8, zahl(y, 1), GRAU, 5.2, 400, "end"))
            y += dy
        ya = 0 if ymin <= 0 <= ymax else ymin
        xa = 0 if xmin <= 0 <= xmax else xmin
        self.t.append(lin((self.l, self.Y(ya)), (B_ - self.r, self.Y(ya)), SCHWARZ, 0.7))
        self.t.append(lin((self.X(xa), self.o - 3), (self.X(xa), H_ - self.u), SCHWARZ, 0.7))
        if titel:
            self.t.append(txt(B_ - self.r, self.o - 3, titel, SCHWARZ, 5.8, 700, "end"))

    def X(self, x):
        return self.l + (x - self.xmin) / (self.xmax - self.xmin) * (self.B - self.l - self.r)

    def Y(self, y):
        return self.H - self.u - (y - self.ymin) / (self.ymax - self.ymin) * (self.H - self.o - self.u)

    def graph(self, fn, x1, x2, farbe=BLAU, n=300, breite=1.1):
        """Ein Graph, aufgetrennt, wo er aus dem Bild läuft — kein Strich über eine Polstelle."""
        stueck = []
        for i in range(n + 1):
            x = x1 + (x2 - x1) * i / n
            try:
                y = fn(x)
            except ZeroDivisionError:
                y = None
            if y is None or not (self.ymin - 1e-9 <= y <= self.ymax + 1e-9):
                if len(stueck) > 1:
                    self.t.append(polyline(stueck, farbe, breite))
                stueck = []
                continue
            stueck.append((self.X(x), self.Y(y)))
        if len(stueck) > 1:
            self.t.append(polyline(stueck, farbe, breite))

    def svg(self):
        return svg(self.B, self.H, self.t)


# ---------- Figur 1: ε-Streifen für x → ∞ ----------

def fig_epsilon():
    eps, g = 0.2, 2.0
    fn = lambda x: 2 + 1 / x
    x0 = 1 / eps
    assert abs(abs(fn(x0) - g) - eps) < 1e-12 and all(abs(fn(x0 + k * 0.01) - g) < eps for k in range(1, 3000)), "ε-Streifen: x₀ ist nicht scharf"
    A = Achsen(150.0, 96.0, 0, 20, 0, 4, 5, 1, "f(x) = 2 + 1/x, ε = 0,2")
    A.t.append(rect(A.X(0), A.Y(g + eps), A.X(20) - A.X(0), A.Y(g - eps) - A.Y(g + eps), VIOLETT, VIOLETT, 0.4, 0.12))
    A.t.append(lin((A.X(0), A.Y(g)), (A.X(20), A.Y(g)), VIOLETT, 0.8, "3 2"))
    A.graph(lambda x: fn(x) if x > 0.2 else None, 0.25, x0, ROT)
    A.graph(fn, x0, 20, GRUEN)
    A.t.append(lin((A.X(x0), A.o), (A.X(x0), A.Y(0)), GRUEN, 0.7, "2 1.5"))
    A.t.append(txt(A.X(x0) + 2, A.o + 8, "x₀ = 5", GRUEN, 5.8, 700, "start"))
    A.t.append(txt(A.X(14), A.Y(g + eps) - 3, "y = 2: Asymptote", VIOLETT, 5.6, 700))
    return A.svg()


# ---------- Figur 2: Testfolgen an einer hebbaren Lücke ----------

def fig_testfolgen():
    fn = lambda x: (x * x - 1) / (x - 1)
    A = Achsen(150.0, 96.0, -0.5, 2.5, 0, 4, 0.5, 1, "(x² − 1)/(x − 1)")
    A.graph(lambda x: None if abs(x - 1) < 1e-9 else fn(x), -0.5, 2.5)
    for n in range(1, 6):
        for x, farbe in ((1 - 1 / n, ORANGE), (1 + 1 / n, BLAU)):
            A.t.append(kreis((A.X(x), A.Y(fn(x))), 1.6, farbe, farbe))
    # Das Loch liegt genau auf dem Grenzwert — numerisch von beiden Seiten nachgerechnet.
    g = (fn(1 - 1e-9) + fn(1 + 1e-9)) / 2
    assert abs(g - 2) < 1e-6
    A.t.append(kreis((A.X(1), A.Y(2)), 2.2, BLAU, "#ffffff", 0.9))
    A.t.append(txt(A.X(1) + 4, A.Y(2) + 9, "Grenzwert 2", GRUEN, 5.6, 700, "start"))
    return A.svg()


# ---------- Figur 3: Sprung — einseitige Grenzwerte verschieden ----------

def fig_sprung():
    A = Achsen(150.0, 96.0, -1, 3, -1, 4, 1, 1, "x² für x < 1, x + 2 für x ≥ 1")
    A.graph(lambda x: x * x, -1, 1)
    A.graph(lambda x: x + 2, 1, 3)
    A.t.append(kreis((A.X(1), A.Y(1)), 2.0, BLAU, "#ffffff", 0.9))
    A.t.append(kreis((A.X(1), A.Y(3)), 2.0, BLAU, BLAU))
    A.t.append(lin((A.X(1), A.Y(1)), (A.X(1), A.Y(3)), ROT, 0.8, "2 1.5"))
    # Rechts unten ist frei: Dort stört die Beschriftung weder die y-Achse noch den Graphen.
    A.t.append(txt(A.X(1.35), A.Y(1.9), "links → 1", ROT, 5.4, 700, "start"))
    A.t.append(txt(A.X(1.35), A.Y(1.3), "rechts → 3", ROT, 5.4, 700, "start"))
    return A.svg()


# ---------- Figur 4: hebbare Lücke und Polstelle ----------

def fig_luecke_pol():
    B_, H_ = 300.0, 92.0
    links = Achsen(150.0, H_, -1, 4, -1, 6, 1, 1, "(x² − 4)/(x − 2): hebbar")
    links.graph(lambda x: None if abs(x - 2) < 1e-9 else (x * x - 4) / (x - 2), -1, 4)
    links.t.append(kreis((links.X(2), links.Y(4)), 2.2, BLAU, "#ffffff", 0.9))
    links.t.append(txt(links.X(2) + 4, links.Y(4) + 8, "f(2) := 4", GRUEN, 5.6, 700, "start"))
    rechts = Achsen(150.0, H_, -2, 4, -5, 5, 1, 2.5, "1/(x − 1): Polstelle")
    rechts.t.append(lin((rechts.X(1), rechts.o), (rechts.X(1), H_ - rechts.u), VIOLETT, 0.8, "3 2"))
    rechts.graph(lambda x: None if abs(x - 1) < 1e-9 else 1 / (x - 1), -2, 0.999, n=400)
    rechts.graph(lambda x: None if abs(x - 1) < 1e-9 else 1 / (x - 1), 1.001, 4, n=400)
    setze_flaeche(B_, H_)
    teile = [f'<g>{"".join(links.t)}</g>', f'<g transform="translate(150,0)">{"".join(rechts.t)}</g>']
    return svg(B_, H_, teile)


# ---------- Figur 5: Intervallhalbierung ----------

def fig_halbierung():
    fn = lambda x: x ** 3 - 2 * x - 5
    lo, hi = 2.0, 3.0
    # Die Nullstelle unabhängig sehr genau: 60 Halbierungen.
    a, b = 2.0, 3.0
    for _ in range(60):
        m = (a + b) / 2
        if fn(m) > 0:
            b = m
        else:
            a = m
    wurzel = a
    B_, H_ = 200.0, 84.0
    setze_flaeche(B_, H_)
    X = lambda x: 10 + (x - 2.0) * 110   # rechts bleibt Platz für die Intervallgrenzen
    t = [lin((X(2), 9), (X(3), 9), SCHWARZ, 0.6)]
    for x in (2, 2.25, 2.5, 2.75, 3):
        t.append(lin((X(x), 7), (X(x), 11), SCHWARZ, 0.6))
        t.append(txt(X(x), 5.5, zahl(x, 2), GRAU, 5.0))
    for k in range(0, 6):
        assert lo <= wurzel <= hi, "Halbierung: die Nullstelle liegt nicht im Intervall"
        y = 16 + k * 9
        t.append(lin((X(lo), y), (X(hi), y), GRUEN if k else BLAU, 2.6))
        t.append(txt(X(hi) + 3, y + 2, f"[{zahl(lo, 5)}; {zahl(hi, 5)}]", SCHWARZ, 5.2, 400, "start"))
        m = (lo + hi) / 2
        if fn(m) > 0:
            hi = m
        else:
            lo = m
    t.append(lin((X(wurzel), 12), (X(wurzel), 66), ROT, 0.6, "2 1.5"))
    t.append(txt(X(wurzel) + 2, 75, f"Nullstelle ≈ {zahl(wurzel, 4)}", ROT, 5.6, 700, "start"))
    return svg(B_, H_, t)


FIGUREN = [fig_epsilon, fig_testfolgen, fig_sprung, fig_luecke_pol, fig_halbierung]

if __name__ == "__main__":
    zeilen = [fn() for fn in FIGUREN]
    pfad = pathlib.Path(__file__).parent / "f2-figuren.txt"
    pfad.write_text("\n".join(zeilen) + "\n", encoding="utf-8")
    print(f"{len(zeilen)} Figuren geschrieben")
