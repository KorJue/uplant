#!/usr/bin/env python3
"""Erzeugt die Figuren der Formelsammlung „Integralrechnung“ (MSS 11, Analysis, Thema 4).

Jeder Graph und jede Fläche wird aus der Funktion gerechnet. Das Skript prüft mit: Unter- und
Obersumme stimmen mit den gezeichneten Rechtecken überein und schließen das Integral ein, die
orientierten Teilflächen ergeben das numerisch berechnete Integral, die Schnittstellen der
Flächen zwischen zwei Graphen sind echte Nullstellen der Differenz, das Mittelwert-Rechteck hat
den Inhalt der Fläche, und die Scheibensumme des Kegels nähert die Kegelformel.

    python3 f5-svgs.py      schreibt f5-figuren.txt (eine Figur je Zeile)
"""
import math
import pathlib

from tf_kopf import (BLAU, GRUEN, ORANGE, ROT, VIOLETT, GRAU, SCHWARZ, GITTER,
                     de, f, kreis, lin, polyline, pruefe_im_bild, rect, setze_flaeche, svg, txt)


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


def integral(fn, a, b, n=2000):
    """Simpson-Regel — die Prüfgröße für jede gezeichnete Fläche."""
    h = (b - a) / n
    s = fn(a) + fn(b)
    for i in range(1, n):
        s += (4 if i % 2 else 2) * fn(a + i * h)
    return s * h / 3


def vieleck_flaeche(punkte):
    """Gaußsche Trapezformel, vorzeichenlos."""
    s = 0.0
    for i in range(len(punkte)):
        (x1, y1), (x2, y2) = punkte[i], punkte[(i + 1) % len(punkte)]
        s += x1 * y2 - x2 * y1
    return abs(s) / 2


def flaeche(A, fn, gn, a, b, farbe, deckung=0.3, n=120):
    """Die Fläche zwischen fn und gn über [a; b] als gefülltes Vieleck. Zurück kommt auch ihr Inhalt
    in Datenkoordinaten, gemessen am Vieleck selbst — so prüft das Skript, was es zeichnet."""
    oben = [(a + (b - a) * i / n, fn(a + (b - a) * i / n)) for i in range(n + 1)]
    unten = [(a + (b - a) * i / n, gn(a + (b - a) * i / n)) for i in range(n, -1, -1)]
    daten = oben + unten
    bild = [(A.X(x), A.Y(y)) for x, y in daten]
    for p in bild:
        pruefe_im_bild(p[0], p[1], "Fläche")
    pkt = " ".join(f"{f(x)},{f(y)}" for x, y in bild)
    A.t.append(f'<polygon points="{pkt}" fill="{farbe}" fill-opacity="{f(deckung)}" stroke="none"/>')
    return vieleck_flaeche(daten)


# ---------- Figur 1: Unter- und Obersumme ----------

def fig_summen():
    UNTERLAGE[0] = WEISS
    fn = lambda x: x * x
    b, n = 2.0, 4
    dx = b / n
    A = Achsen(150.0, 86.0, -0.15, 2.25, 0, 4.4, 0.5, 1, "f(x) = x², n = 4")
    U = O = 0.0
    for k in range(n):
        u, o = k * dx, (k + 1) * dx
        # Höchster und tiefster Wert im Streifen, nicht einfach der rechte und linke Rand angenommen.
        werte = [fn(u + dx * i / 50) for i in range(51)]
        hoch, tief = max(werte), min(werte)
        O += hoch * dx
        U += tief * dx
        A.t.append(rect(A.X(u), A.Y(hoch), A.X(o) - A.X(u), A.Y(0) - A.Y(hoch), ORANGE, ORANGE, 0.6, 0.12))
        if tief > 0:
            A.t.append(rect(A.X(u), A.Y(tief), A.X(o) - A.X(u), A.Y(0) - A.Y(tief), GRUEN, GRUEN, 0.6, 0.3))
    I = integral(fn, 0, b)
    assert abs(U - 1.75) < 1e-9 and abs(O - 3.75) < 1e-9 and U < I < O, "Summen: U₄, O₄ falsch"
    A.graph(fn, 0, 2.08)
    A.t.append(etikett(A.X(0.62), A.Y(3.2), "O₄ = 3,75", ORANGE, 5.2, 700))
    A.t.append(etikett(A.X(0.62), A.Y(2.5), "U₄ = 1,75", GRUEN, 5.2, 700))
    return svg(A.B, A.H, A.t)


# ---------- Figur 2: orientierte Fläche ----------

def fig_orientiert():
    UNTERLAGE[0] = MERK
    fn = lambda x: 0.5 * x ** 3 - 1.5 * x
    a, b = -1.0, 2.0
    A = Achsen(150.0, 84.0, -2.2, 2.4, -1.6, 2.4, 1, 1, "f(x) = 0,5x³ − 1,5x")
    teile = [a] + [z for z in vzw(fn, a, b) if a + 1e-9 < z < b - 1e-9] + [b]
    summe = 0.0
    for u, o in zip(teile, teile[1:]):
        wert = integral(fn, u, o)
        gemessen = flaeche(A, fn, lambda x: 0.0, u, o, GRUEN if wert > 0 else ORANGE)
        assert abs(gemessen - abs(wert)) < 2e-3, "orientiert: gezeichnete Teilfläche falsch"
        summe += wert
    assert abs(summe - integral(fn, a, b)) < 1e-9 and abs(summe + 0.375) < 1e-9, "orientiert: Summe der Teilflächen ≠ Integral"
    A.graph(fn, -2.2, 2.4)
    for x in (a, b):
        A.t.append(lin((A.X(x), A.Y(-1.6)), (A.X(x), A.Y(2.4)), ROT, 0.5, "2 1.5"))
    A.t.append(etikett(A.X(-0.5), A.Y(0.25), "+", GRUEN, 6.4, 700))
    A.t.append(etikett(A.X(0.95), A.Y(-0.42), "−", ORANGE, 6.4, 700))
    A.t.append(etikett(A.X(a) - 2, A.Y(2.05), "a", ROT, 5.2, 700, "end"))
    A.t.append(etikett(A.X(b) - 2, A.Y(2.05), "b", ROT, 5.2, 700, "end"))
    return svg(A.B, A.H, A.t)


# ---------- Figur 3: Integralfunktion und Hauptsatz ----------

def fig_hauptsatz():
    UNTERLAGE[0] = WEISS
    fn = lambda x: 0.5 * x * x + 1
    x, h = 1.0, 0.5
    A = Achsen(150.0, 80.0, -0.15, 2.3, 0, 4.0, 0.5, 1, "f(x) = 0,5x² + 1")
    bis = flaeche(A, fn, lambda t: 0.0, 0, x, BLAU, 0.15)
    streifen = flaeche(A, fn, lambda t: 0.0, x, x + h, VIOLETT, 0.35)
    assert abs(bis - integral(fn, 0, x)) < 2e-3 and abs(streifen - integral(fn, x, x + h)) < 2e-3, "Hauptsatz: Flächen falsch"
    # Der Streifen liegt zwischen den Rechtecken f(x) · h und f(x + h) · h.
    assert fn(x) * h < integral(fn, x, x + h) < fn(x + h) * h, "Hauptsatz: Streifen nicht eingeklemmt"
    A.t.append(rect(A.X(x), A.Y(fn(x + h)), A.X(x + h) - A.X(x), A.Y(0) - A.Y(fn(x + h)), VIOLETT, "none", 0.6, 1.0))
    A.t.append(lin((A.X(x), A.Y(fn(x))), (A.X(x + h), A.Y(fn(x))), VIOLETT, 0.6, "2 1.2"))
    A.graph(fn, -0.15, 2.3)
    A.t.append(etikett(A.X(0.5), A.Y(0.55), "I(x)", BLAU, 5.2, 700))
    A.t.append(etikett(A.X(x + h / 2), A.Y(fn(x + h)) - 3.5, "h", VIOLETT, 5.2, 700))
    A.t.append(etikett(A.X(x), A.Y(0) + 7, "x", SCHWARZ, 5.0, 700))
    return svg(A.B, A.H, A.t)


# ---------- Figur 4: Fläche zwischen zwei Graphen ----------

def fig_zwischen():
    UNTERLAGE[0] = WEISS
    fn = lambda x: 4 - x * x
    gn = lambda x: x + 2
    s = vzw(lambda x: fn(x) - gn(x), -4, 4)
    assert [round(z, 9) for z in s] == [-2, 1], "zwischen: Schnittstellen falsch"
    A = Achsen(150.0, 86.0, -3, 2.2, -2.2, 4.6, 1, 2, "f(x) = 4 − x², g(x) = x + 2")
    inhalt = flaeche(A, fn, gn, s[0], s[1], GRUEN)
    assert abs(inhalt - 4.5) < 2e-3 and abs(integral(lambda x: fn(x) - gn(x), s[0], s[1]) - 4.5) < 1e-9, "zwischen: Fläche ≠ 4,5"
    A.graph(fn, -3, 2.2)
    A.gerade(1, 0, 2, ORANGE, 1.0)
    for z in s:
        A.punkt(z, fn(z), ROT, 1.5)
    # Ganz innerhalb der Fläche: bei x = −0,5 … 0,1 liegt sie zwischen y = 2,1 und 3,75.
    A.t.append(etikett(A.X(-0.2), A.Y(2.55), "A = 4,5", GRUEN, 5.4, 700))
    A.t.append(etikett(A.X(1.75), A.Y(4.2), "g", ORANGE, 5.4, 700))
    A.t.append(etikett(A.X(-2.8), A.Y(-1.85), "f", BLAU, 5.4, 700))
    return svg(A.B, A.H, A.t)


# ---------- Figur 5: Mittelwert ----------

def fig_mittelwert():
    UNTERLAGE[0] = MERK
    T = lambda t: -0.5 * t * t + 3 * t + 10
    b = 6.0
    m = integral(T, 0, b) / b
    assert abs(m - 13) < 1e-9, "Mittelwert: m ≠ 13"
    A = Achsen(150.0, 78.0, 0, 6.3, 0, 16, 1, 4, "T(t) = −0,5t² + 3t + 10")
    inhalt = flaeche(A, T, lambda t: 0.0, 0, b, GRUEN, 0.22)
    assert abs(inhalt - m * b) < 2e-3, "Mittelwert: Rechteck und Fläche nicht gleich groß"
    A.t.append(rect(A.X(0), A.Y(m), A.X(b) - A.X(0), A.Y(0) - A.Y(m), VIOLETT, "none", 0.8, 1.0))
    A.graph(T, 0, 6.3)
    for t in vzw(lambda t: T(t) - m, 0, b):
        A.punkt(t, m, VIOLETT, 1.4)
    A.t.append(etikett(A.X(3), A.Y(m) + 7, "m = 13", VIOLETT, 5.4, 700))
    return svg(A.B, A.H, A.t)


# ---------- Figur 6: uneigentliches Integral ----------

def fig_uneigentlich():
    UNTERLAGE[0] = WEISS
    f1 = lambda x: 1 / (x * x)
    f2 = lambda x: 1 / math.sqrt(x)
    A = Achsen(150.0, 74.0, 0, 8.4, 0, 1.4, 1, 0.5, None)
    inhalt = flaeche(A, f1, lambda x: 0.0, 1, 8.4, GRUEN, 0.3, 300)
    assert abs(inhalt - (1 - 1 / 8.4)) < 2e-3, "uneigentlich: Fläche unter 1/x² falsch"
    A.graph(f2, 0.52, 8.4, ORANGE, 300, 1.0)
    A.graph(f1, 0.85, 8.4, BLAU, 300, 1.2)
    A.t.append(lin((A.X(1), A.Y(0)), (A.X(1), A.Y(1.4)), ROT, 0.5, "2 1.5"))
    A.t.append(etikett(A.X(5.6), A.Y(0.56), "1/√x: divergent", ORANGE, 5.0, 700))
    A.t.append(etikett(A.X(5.6), A.Y(0.17), "1/x²: Fläche 1", BLAU, 5.0, 700))
    return svg(A.B, A.H, A.t)


# ---------- Figur 7: Rotationskörper ----------

def fig_rotation():
    UNTERLAGE[0] = WEISS
    fn = lambda x: 0.5 * x
    a, b, n = 0.0, 4.0, 6
    dx = (b - a) / n
    A = Achsen(150.0, 74.0, -0.3, 4.4, -2.3, 2.3, 1, 1, "Kegel: f(x) = 0,5x")
    summe = 0.0
    for k in range(n):
        r = fn(a + (k + 0.5) * dx)
        summe += math.pi * r * r * dx
        A.t.append(rect(A.X(a + k * dx), A.Y(r), A.X(a + (k + 1) * dx) - A.X(a + k * dx), A.Y(-r) - A.Y(r), BLAU, BLAU, 0.5, 0.15))
    V = math.pi * integral(lambda x: fn(x) ** 2, a, b)
    assert abs(V - 16 * math.pi / 3) < 1e-9 and abs(summe - V) < 0.2, "Rotation: Scheibensumme oder Volumen falsch"
    A.graph(fn, a, b, BLAU, 50, 1.2)
    A.graph(lambda x: -fn(x), a, b, BLAU, 50, 1.2)
    A.t.append(etikett(A.X(1.2), A.Y(1.5), "V = 16π/3", BLAU, 5.2, 700))
    return svg(A.B, A.H, A.t)


FIGUREN = [fig_summen, fig_orientiert, fig_hauptsatz, fig_zwischen, fig_mittelwert, fig_uneigentlich, fig_rotation]

if __name__ == "__main__":
    zeilen = [fn() for fn in FIGUREN]
    pfad = pathlib.Path(__file__).parent / "f5-figuren.txt"
    pfad.write_text("\n".join(zeilen) + "\n", encoding="utf-8")
    print(f"{len(zeilen)} Figuren geschrieben")
