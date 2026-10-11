#!/usr/bin/env python3
"""Erzeugt die Figuren der Formelsammlung „Integration weiterer Funktionen“ (MSS 11, Analysis,
Thema 4.2, Leistungskurs; die e-Funktionen auch Grundkurs).

Jeder Graph und jede Fläche wird aus der Funktion gerechnet. Das Skript prüft mit: Die Fläche
unter e^(0,5x) ist 2e − 2, die Stammfunktion aus dem Ansatz hat numerisch die Ableitung x · e^(−x),
der Bestand nähert sich seiner Grenze und erreicht sie nie, die Teilflächen unter sin heben sich
über eine Periode auf, die Fläche unter 1/x von 1 bis e ist 1, die Fläche unter 1/x² nähert sich 1,
und die Scheibensumme unter 2e^(−0,5x) nähert 4π(1 − e^(−4)).

    python3 f52-svgs.py      schreibt f52-figuren.txt (eine Figur je Zeile)
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


# ---------- Figur 1: Fläche unter e^(0,5x) ----------

def fig_ekx():
    UNTERLAGE[0] = MERK
    fn = lambda x: math.exp(0.5 * x)
    A = Achsen(150.0, 72.0, -1.2, 2.6, 0, 4.2, 0.5, 1, "f(x) = e^(0,5x)")
    inhalt = flaeche(A, fn, lambda x: 0.0, 0, 2, GRUEN)
    assert abs(inhalt - (2 * math.e - 2)) < 2e-3 and abs(integral(fn, 0, 2) - (2 * math.e - 2)) < 1e-9, "e^(kx): Fläche ≠ 2e − 2"
    A.graph(fn, -1.2, 2.6)
    A.t.append(etikett(A.X(1), A.Y(0.75), "2e − 2 ≈ 3,44", GRUEN, 5.2, 700))
    return svg(A.B, A.H, A.t)


# ---------- Figur 2: Stammfunktion aus dem Ansatz ----------

def fig_ansatz():
    UNTERLAGE[0] = MERK
    fn = lambda x: x * math.exp(-x)
    F = lambda x: -(x + 1) * math.exp(-x)
    for x in (-0.5, 0.0, 1.0, 2.5):
        assert abs(ableitung(F, x) - fn(x)) < 1e-6, "Ansatz: F′ ≠ f"
    x0 = 1.0
    A = Achsen(150.0, 74.0, -0.6, 4.2, -1.2, 0.6, 1, 0.5, "f(x) = x · e^(−x) und F")
    A.graph(fn, -0.6, 4.2, BLAU)
    A.graph(F, -0.6, 4.2, GRUEN, 300, 1.2)
    # Tangente an F in x₀: Steigung f(x₀) — die Probe als Bild.
    A.gerade(fn(x0), x0, F(x0), VIOLETT, 0.8, None, 0.2, 1.8)
    A.punkt(x0, F(x0), GRUEN, 1.4)
    A.t.append(etikett(A.X(3.4), A.Y(0.25), "f", BLAU, 5.4, 700))
    A.t.append(etikett(A.X(3.4), A.Y(-0.32), "F", GRUEN, 5.4, 700))
    return svg(A.B, A.H, A.t)


# ---------- Figur 3: Bestand bei abklingender Rate ----------

def fig_bestand():
    UNTERLAGE[0] = WEISS
    r = lambda t: 8 * math.exp(-0.25 * t)
    B = lambda t: 20 + integral(r, 0, t, 200)
    grenze = 20 + integral(r, 0, 200, 4000)
    assert abs(grenze - 52) < 1e-6 and abs(B(4) - 40.2283) < 1e-3 and B(30) < grenze, "Bestand: Grenze oder B(4) falsch"
    A = Achsen(150.0, 72.0, 0, 21, 0, 60, 5, 20, "B(t) = 20 + 32 · (1 − e^(−0,25t))")
    A.t.append(lin((A.X(0), A.Y(grenze)), (A.X(21), A.Y(grenze)), ROT, 0.6, "2 1.5"))
    A.graph(B, 0, 21, GRUEN, 200, 1.2)
    A.punkt(4, B(4), GRUEN, 1.4)
    A.t.append(etikett(A.X(14), A.Y(grenze) + 6, "Grenze 52", ROT, 5.0, 700))
    A.t.append(etikett(A.X(4) + 2, A.Y(B(4)) + 5, "B(4) ≈ 40,23", GRUEN, 5.0, 700, "start"))
    return svg(A.B, A.H, A.t)


# ---------- Figur 4: Sinus über eine Periode ----------

def fig_sinus():
    UNTERLAGE[0] = WEISS
    A = Achsen(150.0, 66.0, -0.3, 6.7, -1.3, 1.3, 1, 1, "f(x) = sin(x)")
    oben = flaeche(A, math.sin, lambda x: 0.0, 0, math.pi, GRUEN)
    unten = flaeche(A, lambda x: 0.0, math.sin, math.pi, 2 * math.pi, ORANGE)
    assert abs(oben - 2) < 2e-3 and abs(unten - 2) < 2e-3 and abs(integral(math.sin, 0, 2 * math.pi)) < 1e-9, "Sinus: Teilflächen ≠ 2 oder Integral ≠ 0"
    A.graph(math.sin, -0.3, 6.7)
    A.t.append(etikett(A.X(math.pi / 2), A.Y(0.35), "+2", GRUEN, 5.4, 700))
    A.t.append(etikett(A.X(3 * math.pi / 2), A.Y(-0.55), "−2", ORANGE, 5.4, 700))
    return svg(A.B, A.H, A.t)


# ---------- Figur 5: Fläche unter 1/x ----------

def fig_ln():
    UNTERLAGE[0] = WEISS
    fn = lambda x: 1 / x
    A = Achsen(150.0, 66.0, 0, 4.3, 0, 2.2, 1, 1, "f(x) = 1/x")
    inhalt = flaeche(A, fn, lambda x: 0.0, 1, math.e, GRUEN)
    assert abs(inhalt - 1) < 2e-3 and abs(integral(fn, 1, math.e) - 1) < 1e-9, "1/x: Fläche von 1 bis e ≠ 1"
    A.graph(fn, 0.46, 4.3)
    for x in (1, math.e):
        A.t.append(lin((A.X(x), A.Y(0)), (A.X(x), A.Y(2.2)), ROT, 0.5, "2 1.5"))
    A.t.append(etikett(A.X(1.85), A.Y(0.25), "1", GRUEN, 5.6, 700))
    A.t.append(etikett(A.X(math.e) + 2, A.Y(1.6), "e", ROT, 5.2, 700, "start"))
    return svg(A.B, A.H, A.t)


# ---------- Figur 6: uneigentliches Integral ----------

def fig_uneigentlich():
    UNTERLAGE[0] = WEISS
    f1 = lambda x: 1 / (x * x)
    f2 = lambda x: 1 / math.sqrt(x)
    A = Achsen(150.0, 70.0, 0, 8.4, 0, 1.4, 1, 0.5, None)
    inhalt = flaeche(A, f1, lambda x: 0.0, 1, 8.4, GRUEN, 0.3, 300)
    assert abs(inhalt - (1 - 1 / 8.4)) < 2e-3, "uneigentlich: Fläche unter 1/x² falsch"
    A.graph(f2, 0.52, 8.4, ORANGE, 300, 1.0)
    A.graph(f1, 0.85, 8.4, BLAU, 300, 1.2)
    A.t.append(lin((A.X(1), A.Y(0)), (A.X(1), A.Y(1.4)), ROT, 0.5, "2 1.5"))
    A.t.append(etikett(A.X(5.6), A.Y(0.56), "1/√x: divergent", ORANGE, 5.0, 700))
    A.t.append(etikett(A.X(5.6), A.Y(0.17), "1/x²: Fläche 1", BLAU, 5.0, 700))
    return svg(A.B, A.H, A.t)


# ---------- Figur 7: Rotationskörper unter einer e-Funktion ----------

def fig_rotation():
    UNTERLAGE[0] = WEISS
    fn = lambda x: 2 * math.exp(-0.5 * x)
    a, b, n = 0.0, 4.0, 8
    dx = (b - a) / n
    A = Achsen(150.0, 70.0, -0.3, 4.4, -2.3, 2.3, 1, 1, "f(x) = 2e^(−0,5x)")
    summe = 0.0
    for k in range(n):
        rr = fn(a + (k + 0.5) * dx)
        summe += math.pi * rr * rr * dx
        A.t.append(rect(A.X(a + k * dx), A.Y(rr), A.X(a + (k + 1) * dx) - A.X(a + k * dx), A.Y(-rr) - A.Y(rr), BLAU, BLAU, 0.5, 0.15))
    V = math.pi * integral(lambda x: fn(x) ** 2, a, b)
    assert abs(V - 4 * math.pi * (1 - math.exp(-4))) < 1e-9 and abs(summe - V) < 0.2, "Rotation: Scheibensumme oder Volumen falsch"
    A.graph(fn, a, b, BLAU, 80, 1.2)
    A.graph(lambda x: -fn(x), a, b, BLAU, 80, 1.2)
    A.t.append(etikett(A.X(2.9), A.Y(1.35), "V = 4π(1 − e⁻⁴)", BLAU, 5.0, 700))
    return svg(A.B, A.H, A.t)


FIGUREN = [fig_ekx, fig_ansatz, fig_bestand, fig_sinus, fig_ln, fig_uneigentlich, fig_rotation]

if __name__ == "__main__":
    zeilen = [fn() for fn in FIGUREN]
    pfad = pathlib.Path(__file__).parent / "f52-figuren.txt"
    pfad.write_text("\n".join(zeilen) + "\n", encoding="utf-8")
    print(f"{len(zeilen)} Figuren geschrieben")
