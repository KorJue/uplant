#!/usr/bin/env python3
"""Erzeugt die Figuren der Formelsammlung „Ableitung weiterer Funktionen“ (MSS 11, Analysis, Thema 2.2).

Jeder Graph wird aus der Funktion gerechnet. Das Skript prüft mit: Die Tangente an eˣ in (0 | 1) hat
die Steigung 1, die an 2ˣ und 3ˣ die Steigungen ln 2 und ln 3; die markierten Extrem- und Nullstellen
sind Nullstellen der numerisch bestimmten Ableitung beziehungsweise der Funktion; die Steigungen an
P und am Spiegelpunkt Q sind Kehrwerte; die Ableitung des Sinus ist der Kosinus.

    python3 f22-svgs.py      schreibt f22-figuren.txt (eine Figur je Zeile)
"""
import math
import pathlib

from tf_kopf import (BLAU, GRUEN, ORANGE, ROT, VIOLETT, GRAU, SCHWARZ, GITTER,
                     de, kreis, lin, polyline, rect, setze_flaeche, svg, txt)


# Die Farbe der Unterlage ist die des Kastens, in dem die Figur steht.
UNTERLAGE = ["#ffffff"]
WEISS, MERK = "#ffffff", "#f4fbf6"


def etikett(x, y, inhalt, farbe=SCHWARZ, groesse=7.0, gewicht=400, anker="middle"):
    """Ein Text mit Unterlage in der Kastenfarbe, damit Linien darunter ihn nicht durchkreuzen."""
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


def nullstellen(g, lo, hi, n=4000):
    """Vorzeichenwechsel von g auf [lo; hi], halbiert — unabhängig von jeder Formel."""
    aus, h = [], (hi - lo) / n
    for i in range(n):
        a, b = lo + i * h, lo + (i + 1) * h
        if g(a) * g(b) < 0:
            for _ in range(80):
                m = (a + b) / 2
                if g(a) * g(m) <= 0:
                    b = m
                else:
                    a = m
            aus.append((a + b) / 2)
    return aus


class Achsen:
    def __init__(self, B_, H_, xmin, xmax, ymin, ymax, dx, dy, titel=None, versatz=(0.0, 0.0), zahlen=True, gesamt=None, xbeschrift=None):
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
                self.t.append(txt(self.X(x), self.Y(ymin) + 7, xbeschrift(x) if xbeschrift else zahl(x, 1), GRAU, 5.0))
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
        """Ein Graph, aufgetrennt, wo er aus dem Bild läuft oder nicht definiert ist."""
        stueck = []
        for i in range(n + 1):
            x = x1 + (x2 - x1) * i / n
            try:
                y = fn(x)
            except (ValueError, ZeroDivisionError, OverflowError):
                y = float("nan")
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
        (xa, ya), (xb, yb) = [(x, y0 + m * (x - x0)) for x in (a, b)]
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


def pi_text(x):
    """Beschriftung einer x-Achse in Vielfachen von π/2."""
    k = round(x / (math.pi / 2))
    return {0: "0", 1: "π/2", 2: "π", 3: "3π/2", 4: "2π", -1: "−π/2", -2: "−π", -3: "−3π/2", -4: "−2π"}.get(k, "")


# ---------- Figur 1: 2ˣ, eˣ, 3ˣ und ihre Tangenten in (0 | 1) ----------

def fig_basis():
    UNTERLAGE[0] = WEISS
    A = Achsen(150.0, 96.0, -1.6, 1.6, -0.5, 3.6, 0.5, 1, "Steigung in (0 | 1)")
    for b, farbe, strich in ((2.0, ORANGE, "3 1.5"), (math.e, BLAU, None), (3.0, VIOLETT, "3 1.5")):
        A.graph(lambda x, b=b: b ** x, -1.6, 1.6, farbe, 200, 1.2 if b == math.e else 0.9, strich)
        c = ableitung(lambda x, b=b: b ** x, 0)
        assert abs(c - math.log(b)) < 1e-6, f"Basis {b}: Die Steigung in (0 | 1) ist nicht ln b"
    assert abs(ableitung(math.exp, 0) - 1) < 1e-9, "eˣ: Die Steigung in (0 | 1) ist nicht 1"
    A.gerade(1.0, 0, 1, GRUEN, 1.1)
    A.punkt(0, 1, BLAU)
    A.t.append(etikett(A.X(1.05), A.Y(2.75), "3ˣ: ln 3 ≈ 1,1", VIOLETT, 5.0, 700, "end"))
    A.t.append(etikett(A.X(1.58), A.Y(2.0), "eˣ: 1", BLAU, 5.2, 700, "end"))
    A.t.append(etikett(A.X(1.58), A.Y(1.4), "2ˣ: ln 2 ≈ 0,69", ORANGE, 5.0, 700, "end"))
    A.t.append(etikett(A.X(-0.3), A.Y(0.25), "Tangente y = x + 1", GRUEN, 5.0, 700, "end"))
    return svg(A.B, A.H, A.t)


# ---------- Figur 2: x² · e⁻ˣ mit Hoch- und Tiefpunkt ----------

def fig_produkt():
    UNTERLAGE[0] = MERK
    fn = lambda x: x * x * math.exp(-x)
    ext = nullstellen(lambda x: ableitung(fn, x), -0.7, 6)
    # x = 0 ist Berührstelle von f′ mit Vorzeichenwechsel: Der Wechsel wird über das Raster erkannt.
    assert len(ext) == 2 and abs(ext[0]) < 1e-6 and abs(ext[1] - 2) < 1e-6, f"x² · e⁻ˣ: Extremstellen {ext} statt 0 und 2"
    A = Achsen(150.0, 84.0, -0.8, 7, -0.3, 0.85, 1, 0.2, "f(x) = x² · e⁻ˣ")
    A.graph(fn, -0.8, 7, BLAU, 300, 1.2)
    A.punkt(0, 0, BLAU)
    A.punkt(2, fn(2), BLAU)
    A.t.append(etikett(A.X(2), A.Y(fn(2)) - 4, f"H(2 | {zahl(fn(2), 3)})", BLAU, 5.2, 700))
    # Unter der Achse ist rechts von 0 frei — darüber steigt der Graph.
    A.t.append(etikett(A.X(0) + 3, A.Y(-0.17), "T(0 | 0)", BLAU, 5.2, 700, "start"))
    A.t.append(etikett(A.X(6.9), A.Y(0.12), "→ 0 für x → ∞", GRAU, 5.0, 700, "end"))
    return svg(A.B, A.H, A.t)


# ---------- Figur 3: sin und cos — die Ableitung des Sinus ist der Kosinus ----------

def fig_sinus():
    UNTERLAGE[0] = WEISS
    for x in (0.0, 0.7, 1.9, 3.3, 5.0):
        assert abs(ableitung(math.sin, x) - math.cos(x)) < 1e-8, "sin′ ist nicht cos"
        assert abs(ableitung(math.cos, x) + math.sin(x)) < 1e-8, "cos′ ist nicht −sin"
    A = Achsen(150.0, 74.0, 0, 2 * math.pi, -1.3, 1.3, math.pi / 2, 1, None, xbeschrift=pi_text)
    A.graph(math.sin, 0, 2 * math.pi, BLAU, 240, 1.2)
    A.graph(math.cos, 0, 2 * math.pi, GRUEN, 240, 1.1, "3 1.5")
    # Tangente an sin bei 0 mit Steigung cos 0 = 1, waagerecht bei π/2.
    A.gerade(1.0, 0, 0, GRUEN, 0.7, None, 0, 1.1)
    A.gerade(0.0, math.pi / 2, 1, GRUEN, 0.7, None, math.pi / 2 - 0.6, math.pi / 2 + 0.6)
    # Oben rechts liegen beide Kurven tief (sin) bzw. erst knapp über 0 (cos): Platz für die Namen.
    A.t.append(etikett(A.X(2.3), A.Y(1.12), "sin x", BLAU, 5.2, 700))
    A.t.append(etikett(A.X(4.6), A.Y(1.12), "cos x = sin′ x", GRUEN, 5.2, 700))
    return svg(A.B, A.H, A.t)


# ---------- Figur 4: ln als Spiegelbild von eˣ, Steigungen als Kehrwerte ----------

def fig_ln():
    UNTERLAGE[0] = WEISS
    a = 0.5
    P, Q = (a, math.exp(a)), (math.exp(a), a)
    mP, mQ = ableitung(math.exp, a), ableitung(math.log, math.exp(a))
    assert abs(mP * mQ - 1) < 1e-6, "ln: Die Steigungen in P und Q sind keine Kehrwerte"
    B_, H_ = 150.0, 150.0
    xmin, xmax = -1.2, 3.6
    yspan = (xmax - xmin) * (H_ - 26.0) / (B_ - 26.0)
    A = Achsen(B_, H_, xmin, xmax, -1.2, -1.2 + yspan, 1, 1, None)
    A.gerade(1.0, 0, 0, GRAU, 0.6, "2 1.5")
    A.graph(math.exp, xmin, xmax, BLAU, 240, 0.9, "3 1.5")
    A.graph(lambda x: math.log(x) if x > 0 else float("nan"), 0.02, xmax, BLAU, 300, 1.3)
    A.gerade(mP, P[0], P[1], GRUEN, 0.8, "3 1.5", P[0] - 0.7, P[0] + 0.6)
    A.gerade(mQ, Q[0], Q[1], GRUEN, 1.0, None, Q[0] - 1.2, Q[0] + 1.6)
    A.t.append(lin((A.X(P[0]), A.Y(P[1])), (A.X(Q[0]), A.Y(Q[1])), GRAU, 0.6, "1.5 1.5"))
    A.punkt(*P, ORANGE)
    A.punkt(*Q, BLAU)
    A.t.append(etikett(A.X(P[0]) - 3, A.Y(P[1]) - 3, f"P: m = {zahl(mP, 2)}", ORANGE, 5.0, 700, "end"))
    A.t.append(etikett(A.X(Q[0]) + 3, A.Y(Q[1]) + 8, f"Q: 1/m = {zahl(mQ, 2)}", BLAU, 5.0, 700, "start"))
    A.t.append(etikett(A.X(3.5), A.Y(3.3), "y = x", GRAU, 5.0, 700, "end"))
    A.t.append(etikett(A.X(3.5), A.Y(math.log(3.5)) - 3, "ln x", BLAU, 5.2, 700, "end"))
    return svg(B_, H_, A.t)


# ---------- Figur 5: Die e-Funktion setzt sich durch ----------

def fig_grenzwerte():
    UNTERLAGE[0] = WEISS
    B_, H_ = 150.0, 64.0
    setze_flaeche(B_, H_)
    f1 = lambda x: x ** 3 * math.exp(-x)
    f2 = lambda x: x * x * math.exp(x)
    assert f1(30) < 1e-8 and f2(-30) < 1e-9, "Grenzwerte: Die Produkte gehen nicht gegen 0"
    li = Achsen(75.0, H_, 0, 14, -0.15, 1.5, 4, 0.5, None, (0.0, 0.0), gesamt=(B_, H_))
    li.graph(f1, 0, 14, BLAU, 240, 1.1)
    li.t.append(etikett(li.X(13.8), li.Y(1.3), "x³ · e⁻ˣ", BLAU, 5.0, 700, "end"))
    re = Achsen(75.0, H_, -10, 1, -0.15, 1.5, 4, 0.5, None, (75.0, 0.0), gesamt=(B_, H_))
    re.graph(f2, -10, 1, BLAU, 240, 1.1)
    re.t.append(etikett(re.X(-9.8), re.Y(1.3), "x² · eˣ", BLAU, 5.0, 700, "start"))
    setze_flaeche(B_, H_)
    return svg(B_, H_, li.t + re.t)


# ---------- Figur 6: Periode und Symmetrie des Sinus ----------

def fig_periode():
    UNTERLAGE[0] = WEISS
    for x in (0.3, 1.7, 4.1):
        assert abs(math.sin(x + 2 * math.pi) - math.sin(x)) < 1e-12 and abs(math.sin(-x) + math.sin(x)) < 1e-12, "sin: Periode oder Symmetrie falsch"
    # Die Sinuskurve füllt das Band −1 … 1 ganz aus; die Beschriftungen stehen darüber und darunter.
    A = Achsen(150.0, 74.0, -2 * math.pi, 2 * math.pi, -1.9, 1.9, math.pi, 1, None, xbeschrift=pi_text)
    A.graph(math.sin, -2 * math.pi, 2 * math.pi, BLAU, 400, 1.2)
    A.punkt(0, 0, ROT, 1.4)
    y = 1.3
    A.t.append(lin((A.X(-math.pi * 1.5), A.Y(y)), (A.X(math.pi / 2), A.Y(y)), VIOLETT, 0.8))
    for xr in (-math.pi * 1.5, math.pi / 2):
        A.t.append(lin((A.X(xr), A.Y(y) - 2), (A.X(xr), A.Y(y) + 2), VIOLETT, 0.8))
    A.t.append(etikett(A.X(-math.pi / 2), A.Y(y) - 2.5, "Periode 2π", VIOLETT, 5.0, 700))
    A.t.append(etikett(A.X(0), A.Y(-1.55), "punktsymmetrisch zu O(0 | 0)", ROT, 5.0, 700))
    return svg(A.B, A.H, A.t)


# ---------- Figur 7: sin x = 0,5 hat in [0; 2π) zwei Lösungen ----------

def fig_sinusgleichung():
    UNTERLAGE[0] = WEISS
    c = 0.5
    ls = nullstellen(lambda x: math.sin(x) - c, 0, 2 * math.pi)
    assert len(ls) == 2 and abs(ls[0] - math.pi / 6) < 1e-9 and abs(ls[1] - 5 * math.pi / 6) < 1e-9, "sin x = 0,5: Lösungen falsch"
    A = Achsen(150.0, 66.0, 0, 2 * math.pi, -1.3, 1.3, math.pi / 2, 1, None, xbeschrift=pi_text)
    A.graph(math.sin, 0, 2 * math.pi, BLAU, 240, 1.2)
    A.gerade(0.0, 0, c, VIOLETT, 0.9)
    for x, name in zip(ls, ("x₁ = π/6", "x₂ = 5π/6")):
        A.t.append(lin((A.X(x), A.Y(c)), (A.X(x), A.Y(0)), GRAU, 0.6, "1.5 1.5"))
        A.punkt(x, c, GRUEN)
    # Unter der Achse ist bei π/6 und 5π/6 frei — der Sinus ist dort positiv.
    A.t.append(etikett(A.X(ls[0]), A.Y(-0.35), "π/6", GRUEN, 5.0, 700))
    A.t.append(etikett(A.X(ls[1]), A.Y(-0.35), "5π/6", GRUEN, 5.0, 700))
    A.t.append(etikett(A.X(4.4), A.Y(c) + 7, "y = 0,5", VIOLETT, 5.0, 700))
    return svg(A.B, A.H, A.t)


# ---------- Figur 8: (x² − 3) · eˣ mit Hoch- und Tiefpunkt ----------

def fig_musterrechnung():
    UNTERLAGE[0] = WEISS
    fn = lambda x: (x * x - 3) * math.exp(x)
    ext = nullstellen(lambda x: ableitung(fn, x), -5, 1.6)
    assert len(ext) == 2 and abs(ext[0] + 3) < 1e-6 and abs(ext[1] - 1) < 1e-6, f"(x² − 3) · eˣ: Extremstellen {ext}"
    A = Achsen(150.0, 84.0, -5, 1.6, -6, 2, 1, 2, "f(x) = (x² − 3) · eˣ")
    A.graph(fn, -5, 1.6, BLAU, 300, 1.2)
    A.punkt(-3, fn(-3), BLAU)
    A.punkt(1, fn(1), BLAU)
    A.t.append(etikett(A.X(-3), A.Y(fn(-3)) - 4, f"H(−3 | {zahl(fn(-3), 3)})", BLAU, 5.0, 700))
    # Links von T auf gleicher Höhe ist frei: Der Graph kommt von oben herab.
    A.t.append(etikett(A.X(-0.2), A.Y(fn(1)) + 2, f"T(1 | {zahl(fn(1), 2)})", BLAU, 5.0, 700, "end"))
    return svg(A.B, A.H, A.t)


FIGUREN = [fig_basis, fig_produkt, fig_sinus, fig_ln, fig_grenzwerte, fig_periode, fig_sinusgleichung, fig_musterrechnung]

if __name__ == "__main__":
    zeilen = [fn() for fn in FIGUREN]
    pfad = pathlib.Path(__file__).parent / "f22-figuren.txt"
    pfad.write_text("\n".join(zeilen) + "\n", encoding="utf-8")
    print(f"{len(zeilen)} Figuren geschrieben")
