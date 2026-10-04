#!/usr/bin/env python3
"""Erzeugt die Figuren der Formelsammlung „Funktionsuntersuchung“ (MSS 11, Analysis, Thema 3).

Jeder Graph wird aus der Funktion gerechnet. Das Skript prüft mit: Die markierten Extrem- und
Wendepunkte sind numerisch bestimmte Nullstellen von f′ bzw. f″ (mit Vorzeichenwechsel), die
Krümmungsfarbe folgt dem Vorzeichen von f″, das Randmaximum ist wirklich der größte Wert, die
Extrempunkte der Schar liegen auf der Ortskurve, das Schachtelvolumen ist am Maximum, und jede
Newton-Tangente schneidet die x-Achse beim nächsten Näherungswert.

    python3 f4-svgs.py      schreibt f4-figuren.txt (eine Figur je Zeile)
"""
import math
import pathlib

from tf_kopf import (BLAU, GRUEN, ORANGE, ROT, VIOLETT, GRAU, SCHWARZ, GITTER,
                     de, f, kreis, lin, polyline, rect, setze_flaeche, svg, txt)


# Die Farbe der Unterlage ist die des Kastens, in dem die Figur steht: weiß, in den grünen
# Merkkästen deren Hellgrün — sonst stünde jede Beschriftung auf einem weißen Fleck.
UNTERLAGE = ["#ffffff"]
WEISS, MERK = "#ffffff", "#f4fbf6"


def etikett(x, y, inhalt, farbe=SCHWARZ, groesse=7.0, gewicht=400, anker="middle"):
    """Ein Text mit weißer Unterlage, damit Linien darunter ihn nicht durchkreuzen. Eine Unterlage
    statt eines Konturhofs: Den Hof setzt der PDF-Druck als Umriss jedes Buchstabens ab, und die
    Datei würde viermal so groß."""
    import re
    breite = len(re.sub(r"<[^>]+>", "", str(inhalt))) * groesse * 0.56
    links = x - (breite / 2 if anker == "middle" else breite if anker == "end" else 0)
    unterlage = rect(links - 0.8, y - groesse * 0.82, breite + 1.6, groesse * 1.05, "none", UNTERLAGE[0], 0, 1.0)
    return unterlage + txt(x, y, inhalt, farbe, groesse, gewicht, anker)


def zahl(x, stellen=2):
    s = de(round(x, stellen), stellen)
    if "," in s:
        s = s.rstrip("0").rstrip(",")
    return s


def ableitung(fn, x, h=1e-6):
    return (fn(x + h) - fn(x - h)) / (2 * h)


class Achsen:
    def __init__(self, B_, H_, xmin, xmax, ymin, ymax, dx, dy, titel=None, versatz=(0.0, 0.0), zahlen=True, gesamt=None):
        # Bei mehreren Feldern in einem Bild wird gegen das ganze Bild geprüft, nicht gegen das Feld.
        setze_flaeche(*(gesamt or (B_, H_)))
        self.B, self.H = B_, H_
        self.ox, self.oy = versatz
        self.l, self.r, self.o, self.u = 20.0, 6.0, 12.0, 14.0
        self.xmin, self.xmax, self.ymin, self.ymax = xmin, xmax, ymin, ymax
        self.t = []
        x = math.ceil(xmin / dx - 1e-9) * dx
        while x <= xmax + 1e-9:
            self.t.append(lin((self.X(x), self.Y(ymax)), (self.X(x), self.Y(ymin)), GITTER, 0.4))
            if zahlen:
                self.t.append(txt(self.X(x), self.Y(ymin) + 7, zahl(x, 1), GRAU, 5.0))
            x += dx
        y = math.ceil(ymin / dy - 1e-9) * dy
        while y <= ymax + 1e-9:
            self.t.append(lin((self.X(xmin), self.Y(y)), (self.X(xmax), self.Y(y)), GITTER, 0.4))
            if zahlen:
                self.t.append(txt(self.X(xmin) - 2.5, self.Y(y) + 1.8, zahl(y, 1), GRAU, 5.0, 400, "end"))
            y += dy
        ya = 0 if ymin <= 0 <= ymax else ymin
        xa = 0 if xmin <= 0 <= xmax else xmin
        self.t.append(lin((self.X(xmin), self.Y(ya)), (self.X(xmax), self.Y(ya)), SCHWARZ, 0.7))
        self.t.append(lin((self.X(xa), self.Y(ymax) - 3), (self.X(xa), self.Y(ymin)), SCHWARZ, 0.7))
        if titel:
            self.t.append(etikett(self.X(xmax), self.Y(ymax) - 3, titel, SCHWARZ, 5.6, 700, "end"))

    def X(self, x):
        return self.ox + self.l + (x - self.xmin) / (self.xmax - self.xmin) * (self.B - self.l - self.r)

    def Y(self, y):
        return self.oy + self.H - self.u - (y - self.ymin) / (self.ymax - self.ymin) * (self.H - self.o - self.u)

    def graph(self, fn, x1, x2, farbe=BLAU, n=300, breite=1.1, strich=None):
        """Ein Graph, aufgetrennt, wo er aus dem Bild läuft."""
        stueck = []
        for i in range(n + 1):
            x = x1 + (x2 - x1) * i / n
            y = fn(x)
            if not (self.ymin - 1e-9 <= y <= self.ymax + 1e-9):
                if len(stueck) > 1:
                    self.t.append(polyline(stueck, farbe, breite, strich))
                stueck = []
                continue
            stueck.append((self.X(x), self.Y(y)))
        if len(stueck) > 1:
            self.t.append(polyline(stueck, farbe, breite, strich))

    def gerade(self, m, x0, y0, farbe, breite=0.9, strich=None, von=None, bis=None):
        """Eine Gerade, auf den sichtbaren Teil gekürzt."""
        a, b = (self.xmin if von is None else von), (self.xmax if bis is None else bis)
        pkt = []
        for x in (a, b):
            pkt.append((x, y0 + m * (x - x0)))
        # Auf den y-Bereich kürzen.
        (xa, ya), (xb, yb) = pkt
        if m != 0:
            for grenze in (self.ymin, self.ymax):
                xg = x0 + (grenze - y0) / m
                if ya < self.ymin and grenze == self.ymin or ya > self.ymax and grenze == self.ymax:
                    xa, ya = xg, grenze
                if yb < self.ymin and grenze == self.ymin or yb > self.ymax and grenze == self.ymax:
                    xb, yb = xg, grenze
        self.t.append(lin((self.X(xa), self.Y(ya)), (self.X(xb), self.Y(yb)), farbe, breite, strich))

    def punkt(self, x, y, farbe=BLAU, r=1.6, hohl=False):
        self.t.append(kreis((self.X(x), self.Y(y)), r, farbe, "#ffffff" if hohl else farbe, 0.9))



def ableitung2(fn, x, h=1e-4):
    return (fn(x + h) - 2 * fn(x) + fn(x - h)) / (h * h)


def vzw(g, lo, hi, n=4000):
    """Einfache Nullstellen von g auf [lo, hi]: Vorzeichenwechsel, dann Bisektion."""
    aus = []
    for i in range(n):
        a, b = lo + (hi - lo) * i / n, lo + (hi - lo) * (i + 1) / n
        if g(a) == 0:
            aus.append(a)
        elif g(a) * g(b) < 0:
            for _ in range(60):
                m = (a + b) / 2
                if (g(m) > 0) == (g(a) > 0):
                    a = m
                else:
                    b = m
            aus.append((a + b) / 2)
    return aus


def bunt(A, fn, x1, x2, n=300, breite=1.3):
    """Graph in Krümmungsfarben: violett, wo f″ > 0 (Linkskurve), orange, wo f″ < 0."""
    stueck, farbe_alt = [], None
    for i in range(n + 1):
        x = x1 + (x2 - x1) * i / n
        y = fn(x)
        farbe = VIOLETT if ableitung2(fn, x) >= 0 else ORANGE
        if not (A.ymin - 1e-9 <= y <= A.ymax + 1e-9):
            if len(stueck) > 1:
                A.t.append(polyline(stueck, farbe_alt, breite))
            stueck, farbe_alt = [], None
            continue
        if farbe_alt and farbe != farbe_alt:
            A.t.append(polyline(stueck + [(A.X(x), A.Y(y))], farbe_alt, breite))
            stueck = [stueck[-1]]
        stueck.append((A.X(x), A.Y(y)))
        farbe_alt = farbe
    if len(stueck) > 1:
        A.t.append(polyline(stueck, farbe_alt, breite))


# ---------- Figur 1: Krümmung ----------

def fig_kruemmung():
    UNTERLAGE[0] = MERK
    fn = lambda x: 0.5 * x ** 3 - 1.5 * x
    w = vzw(lambda x: ableitung2(fn, x), -2, 2)
    assert len(w) == 1 and abs(w[0]) < 1e-6, "Krümmung: Wendestelle ist nicht 0"
    A = Achsen(150.0, 92.0, -2.4, 2.4, -2.6, 2.6, 1, 1, "f(x) = 0,5x³ − 1,5x")
    bunt(A, fn, -2.4, 2.4)
    for x0 in (-1.4, 1.4):
        m = ableitung(fn, x0)
        A.gerade(m, x0, fn(x0), GRUEN, 0.8, None, x0 - 0.9, x0 + 0.9)
        A.punkt(x0, fn(x0), GRUEN, 1.4)
        # Die Seite der Tangente, auf der der Graph liegt, wird nachgerechnet.
        seite = fn(x0 + 0.4) - (fn(x0) + m * 0.4)
        assert (seite > 0) == (x0 > 0), "Krümmung: Graph liegt auf der falschen Seite der Tangente"
    A.punkt(0, 0, VIOLETT, 1.8)
    A.t.append(etikett(A.X(0) + 4, A.Y(0) - 3, "W", VIOLETT, 5.4, 700, "start"))
    A.t.append(etikett(A.X(-1.75), A.Y(-2.15), "Rechtskurve, f″ < 0", ORANGE, 5.0, 700))
    A.t.append(etikett(A.X(1.6), A.Y(-2.15), "Linkskurve, f″ > 0", VIOLETT, 5.0, 700))
    return svg(A.B, A.H, A.t)


# ---------- Figur 2: f, f′ und f″ untereinander ----------

def fig_drei():
    UNTERLAGE[0] = WEISS
    fn = lambda x: x ** 3 - 6 * x * x + 9 * x
    d1 = lambda x: ableitung(fn, x)
    d2 = lambda x: ableitung2(fn, x)
    ex = vzw(d1, -0.5, 4.5)
    we = vzw(d2, -0.5, 4.5)
    assert [round(x, 6) for x in ex] == [1, 3] and [round(x, 6) for x in we] == [2], "f, f′, f″: besondere Stellen falsch"
    B_, H_ = 150.0, 150.0
    setze_flaeche(B_, H_)
    p1 = Achsen(B_, 56.0, -0.5, 4.5, -1.5, 5.5, 1, 2, "f(x) = x³ − 6x² + 9x", (0.0, 0.0), gesamt=(B_, H_))
    p1.graph(fn, -0.5, 4.5)
    p1.punkt(1, fn(1), BLAU)
    p1.punkt(3, fn(3), BLAU)
    p1.punkt(2, fn(2), VIOLETT)
    p1.t.append(txt(p1.X(1), p1.Y(4) - 3, "H", BLAU, 5.2, 700))
    p1.t.append(txt(p1.X(3) + 4, p1.Y(0) - 2, "T", BLAU, 5.2, 700, "start"))
    p1.t.append(txt(p1.X(2) + 4, p1.Y(2) - 2, "W", VIOLETT, 5.2, 700, "start"))
    p2 = Achsen(B_, 48.0, -0.5, 4.5, -4, 10, 1, 4, "f′(x) = 3x² − 12x + 9", (0.0, 54.0), gesamt=(B_, H_))
    p2.graph(d1, -0.5, 4.5, GRUEN, 200, 1.2)
    p3 = Achsen(B_, 48.0, -0.5, 4.5, -16, 16, 1, 8, "f″(x) = 6x − 12", (0.0, 102.0), gesamt=(B_, H_))
    p3.graph(d2, -0.5, 4.5, VIOLETT, 100, 1.2)
    setze_flaeche(B_, H_)
    teile = p1.t + p2.t + p3.t
    for x, farbe in ((1, BLAU), (3, BLAU), (2, VIOLETT)):
        teile.append(lin((p1.X(x), p1.Y(fn(x))), (p1.X(x), p3.Y(-16)), farbe, 0.5, "2 1.5"))
    return svg(B_, H_, teile)


# ---------- Figur 3: globales Maximum am Rand ----------

def fig_global():
    UNTERLAGE[0] = WEISS
    fn = lambda x: 0.5 * x ** 3 - 1.5 * x
    a, b = -1.5, 2.5
    werte = [fn(a + (b - a) * i / 4000) for i in range(4001)]
    assert abs(max(werte) - fn(b)) < 1e-9 and abs(min(werte) - fn(1)) < 1e-6, "global: Extrema falsch"
    A = Achsen(150.0, 86.0, -2.2, 3.0, -2.2, 4.6, 1, 2, "[−1,5; 2,5]")
    A.graph(fn, -2.2, 3.0, GRAU, 200, 0.6, "2 1.5")
    A.graph(fn, a, b, BLAU, 200, 1.3)
    for x in (a, b):
        A.t.append(lin((A.X(x), A.Y(-2.2)), (A.X(x), A.Y(4.6)), ROT, 0.6, "2 1.5"))
    A.punkt(-1, 1, BLAU, 1.5)
    A.punkt(1, -1, BLAU, 1.8)
    A.punkt(b, fn(b), ROT, 1.9)
    A.punkt(a, fn(a), ROT, 1.4)
    A.t.append(etikett(A.X(b) - 3, A.Y(fn(b)) - 1, "Randmaximum", ROT, 5.0, 700, "end"))
    A.t.append(etikett(A.X(-1), A.Y(1) - 3.5, "lokal", BLAU, 4.8, 700))
    A.t.append(etikett(A.X(1), A.Y(-1) + 7, "Minimum", BLAU, 4.8, 700))
    return svg(A.B, A.H, A.t)


# ---------- Figur 4: Schar und Ortskurve ----------

def fig_schar():
    UNTERLAGE[0] = WEISS
    A = Achsen(150.0, 96.0, -2.3, 2.3, -7.2, 7.2, 1, 3, "fₐ(x) = x³ − 3a²x")
    A.graph(lambda x: -2 * x ** 3, -1.55, 1.55, ROT, 200, 0.9, "3 1.5")
    for a in (0.5, 1.0, 1.5):
        fn = lambda x, a=a: x ** 3 - 3 * a * a * x
        A.graph(fn, -2.3, 2.3, BLAU, 300, 0.9 if a != 1 else 1.3)
        ex = vzw(lambda x: ableitung(fn, x), -2.3, 2.3)
        assert len(ex) == 2, "Schar: zwei Extremstellen erwartet"
        for x in ex:
            assert abs(fn(x) + 2 * x ** 3) < 1e-6, "Schar: Extrempunkt liegt nicht auf y = −2x³"
            A.punkt(x, fn(x), BLAU, 1.4)
    A.t.append(etikett(A.X(-1.35), A.Y(6.6), "y = −2x³", ROT, 5.2, 700, "end"))
    A.t.append(etikett(A.X(1.9), A.Y(-1.2), "a = 0,5; 1; 1,5", BLAU, 4.8, 700, "end"))
    return svg(A.B, A.H, A.t)


# ---------- Figur 5: Schachtel ----------

def fig_schachtel():
    UNTERLAGE[0] = MERK
    V = lambda x: x * (12 - 2 * x) ** 2
    xs = [i / 1000 for i in range(1, 6000)]
    xm = max(xs, key=V)
    assert abs(xm - 2) < 1e-3 and abs(V(2) - 128) < 1e-9, "Schachtel: Maximum nicht bei x = 2"
    B_, H_ = 150.0, 70.0
    setze_flaeche(B_, H_)
    teile = []
    # Links das Netz (Maßstab 4 px je cm), rechts V(x).
    s, ox, oy, x = 4.6, 6.0, 6.0, 2.0
    teile.append(rect(ox, oy, 12 * s, 12 * s, BLAU, "#eef2ff", 0.8))
    for (cx, cy) in ((0, 0), (12 - x, 0), (0, 12 - x), (12 - x, 12 - x)):
        teile.append(rect(ox + cx * s, oy + cy * s, x * s, x * s, ROT, "#f6d7d5", 0.6))
    teile.append(rect(ox + x * s, oy + x * s, (12 - 2 * x) * s, (12 - 2 * x) * s, GRUEN, "#dff1e5", 0.8))
    teile.append(txt(ox + x * s / 2, oy + x * s / 2 + 1.8, "x", ROT, 5.0, 700))
    teile.append(txt(ox + 6 * s, oy + 6 * s + 1.8, "12 − 2x", GRUEN, 5.0, 700))
    A = Achsen(86.0, H_, 0, 6, 0, 140, 2, 40, "V(x)", (64.0, 0.0), gesamt=(B_, H_))
    A.graph(V, 0, 6, BLAU, 200, 1.2)
    A.punkt(2, 128, BLAU, 1.6)
    A.t.append(etikett(A.X(2) + 3, A.Y(128) + 6, "Max (2 | 128)", BLAU, 4.8, 700, "start"))
    setze_flaeche(B_, H_)
    return svg(B_, H_, teile + A.t)


# ---------- Figur 6: Newton-Verfahren ----------

def fig_newton():
    UNTERLAGE[0] = WEISS
    fn = lambda x: x ** 3 - 2 * x - 5
    A = Achsen(150.0, 90.0, 1.4, 3.3, -6, 22, 0.5, 5, "f(x) = x³ − 2x − 5")
    A.graph(fn, 1.4, 3.3)
    x = 3.0
    for k in range(2):
        m = ableitung(fn, x)
        neu = x - fn(x) / m
        assert abs(fn(x) + m * (neu - x)) < 1e-9, "Newton: Tangente schneidet die x-Achse nicht beim nächsten Wert"
        A.t.append(lin((A.X(x), A.Y(0)), (A.X(x), A.Y(fn(x))), GRAU, 0.5, "2 1.5"))
        A.gerade(m, x, fn(x), ORANGE, 0.8, None, neu - 0.05, x + 0.05)
        A.punkt(x, fn(x), ORANGE, 1.3)
        A.t.append(etikett(A.X(x), A.Y(0) + 7, f"x{'₀₁₂'[k]}", ORANGE, 5.0, 700))
        x = neu
    A.punkt(x, 0, GRUEN, 1.6)
    A.t.append(etikett(A.X(x) - 1, A.Y(0) - 3, "x₂", GRUEN, 5.0, 700, "end"))
    return svg(A.B, A.H, A.t)


FIGUREN = [fig_kruemmung, fig_drei, fig_global, fig_schar, fig_schachtel, fig_newton]

if __name__ == "__main__":
    zeilen = [fn() for fn in FIGUREN]
    pfad = pathlib.Path(__file__).parent / "f4-figuren.txt"
    pfad.write_text("\n".join(zeilen) + "\n", encoding="utf-8")
    print(f"{len(zeilen)} Figuren geschrieben")
