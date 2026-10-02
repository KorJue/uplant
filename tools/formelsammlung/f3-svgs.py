#!/usr/bin/env python3
"""Erzeugt die Figuren der Formelsammlung „Differentialrechnung“ (MSS 11, Analysis, Thema 3).

Jeder Graph wird aus der Funktion gerechnet. Das Skript prüft mit: Die Sekantensteigungen sind die
Differenzenquotienten, die Tangente hat die Steigung der numerisch bestimmten Ableitung, Tangente und
Normale stehen senkrecht, die Nullstellen von f′ liegen unter den Extrempunkten von f, und jede
markierte Nullstelle hat die angegebene Vielfachheit.

    python3 f3-svgs.py      schreibt f3-figuren.txt (eine Figur je Zeile)
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


# ---------- Figur 1: mittlere Änderungsrate ----------

def fig_sekante():
    UNTERLAGE[0] = WEISS
    fn = lambda x: x * x
    a, b = 1.0, 2.0
    m = (fn(b) - fn(a)) / (b - a)
    assert abs(m - 3) < 1e-12, "Sekante: Steigung ist nicht 3"
    A = Achsen(150.0, 96.0, -0.5, 2.6, -0.5, 5, 0.5, 1, "f(x) = x², [1; 2]")
    A.graph(fn, -0.5, 2.6)
    A.gerade(m, a, fn(a), ORANGE, 1.0)
    A.t.append(lin((A.X(a), A.Y(fn(a))), (A.X(b), A.Y(fn(a))), GRAU, 0.9))
    A.t.append(lin((A.X(b), A.Y(fn(a))), (A.X(b), A.Y(fn(b))), VIOLETT, 1.3))
    A.punkt(a, fn(a), ORANGE)
    A.punkt(b, fn(b), ORANGE)
    A.t.append(txt(A.X(1.5), A.Y(fn(a)) + 7, "Δx = 1", GRAU, 5.4, 700))
    A.t.append(txt(A.X(b) + 3, A.Y(2.5), "Δy = 3", VIOLETT, 5.4, 700, "start"))
    A.t.append(txt(A.X(a) - 3, A.Y(fn(a)) - 3, "A", ORANGE, 5.6, 700, "end"))
    A.t.append(txt(A.X(b) - 3, A.Y(fn(b)) - 2, "B", ORANGE, 5.6, 700, "end"))
    return svg(A.B, A.H, A.t)


# ---------- Figur 2: Sekanten werden zur Tangente ----------

def fig_sekanten():
    UNTERLAGE[0] = MERK
    fn = lambda x: x * x
    x0 = 1.0
    A = Achsen(150.0, 96.0, -0.5, 2.6, -0.5, 5, 0.5, 1, "Sekanten → Tangente in P(1 | 1)")
    A.graph(fn, -0.5, 2.6)
    # x₀-Methode wie auf der Seite: der zweite Punkt heißt Q(x | f(x)), der Quotient ist x + x₀.
    for x, farbe, strich in ((2.0, ORANGE, None), (1.5, ORANGE, "3 1.5"), (1.25, ORANGE, "1 1.2")):
        m = (fn(x) - fn(x0)) / (x - x0)
        assert abs(m - (x + x0)) < 1e-12, "Sekanten: Differenzenquotient ist nicht x + x₀"
        A.gerade(m, x0, fn(x0), farbe, 0.8, strich)
        A.punkt(x, fn(x), ORANGE, 1.3)
    mt = ableitung(fn, x0)
    assert abs(mt - 2) < 1e-6, "Tangente: Steigung ist nicht 2"
    A.gerade(mt, x0, fn(x0), GRUEN, 1.3)
    A.punkt(x0, fn(x0), BLAU)
    # Rechts unterhalb der Tangente ist frei: Dort stören die Steigungen keine Linie.
    A.t.append(etikett(A.X(2.55), A.Y(1.75), "x = 2: 3", ORANGE, 5.0, 700, "end"))
    A.t.append(etikett(A.X(2.55), A.Y(1.25), "x = 1,5: 2,5", ORANGE, 5.0, 700, "end"))
    A.t.append(etikett(A.X(2.55), A.Y(0.75), "x = 1,25: 2,25", ORANGE, 5.0, 700, "end"))
    A.t.append(etikett(A.X(2.55), A.Y(0.2), "Tangente: 2", GRUEN, 5.4, 700, "end"))
    return svg(A.B, A.H, A.t)


# ---------- Figur 3: f und f′ untereinander ----------

def fig_f_fstrich():
    UNTERLAGE[0] = WEISS
    fn = lambda x: 0.5 * x ** 3 - 1.5 * x
    fd = lambda x: 1.5 * x * x - 1.5
    for xe in (-1.0, 1.0):
        assert abs(ableitung(fn, xe)) < 1e-6 and abs(fd(xe)) < 1e-12, "f/f′: Extremstelle und Nullstelle von f′ fallen nicht zusammen"
    B_, H_ = 150.0, 124.0
    setze_flaeche(B_, H_)
    oben = Achsen(B_, 64.0, -2.4, 2.4, -3.5, 3.5, 2, 2, "f(x) = 0,5x³ − 1,5x", (0.0, 0.0), gesamt=(B_, H_))
    oben.graph(fn, -2.4, 2.4)
    oben.punkt(-1, 1, BLAU)
    oben.punkt(1, -1, BLAU)
    oben.t.append(txt(oben.X(-1), oben.Y(1) - 4, "H", BLAU, 5.4, 700))
    oben.t.append(txt(oben.X(1) + 5, oben.Y(-1) + 8, "T", BLAU, 5.4, 700))
    unten = Achsen(B_, 60.0, -2.4, 2.4, -2, 7, 2, 3, "f′(x) = 1,5x² − 1,5", (0.0, 64.0), gesamt=(B_, H_))
    unten.graph(lambda x: fd(x) if fd(x) >= 0 else float("nan"), -2.4, -1, GRUEN, 200, 1.3)
    unten.graph(lambda x: fd(x) if fd(x) <= 0 else float("nan"), -1, 1, ORANGE, 200, 1.3)
    unten.graph(lambda x: fd(x) if fd(x) >= 0 else float("nan"), 1, 2.4, GRUEN, 200, 1.3)
    setze_flaeche(B_, H_)
    teile = oben.t + unten.t
    # Die Hilfslinien laufen nur durch die beiden Zeichenflächen, nicht durch die Überschrift
    # dazwischen — sonst stünde der Strich mitten im Term von f′.
    for xe in (-1.0, 1.0):
        teile.append(lin((oben.X(xe), oben.Y(fn(xe))), (oben.X(xe), oben.Y(-3.5)), GRAU, 0.6, "2 1.5"))
        teile.append(lin((unten.X(xe), unten.Y(7)), (unten.X(xe), unten.Y(0)), GRAU, 0.6, "2 1.5"))
    teile.append(etikett(unten.X(-2.1), unten.Y(1.0), "f′ > 0", GRUEN, 5.2, 700))
    teile.append(etikett(unten.X(-0.5), unten.Y(1.6), "f′ < 0", ORANGE, 5.2, 700))
    teile.append(etikett(unten.X(2.1), unten.Y(1.0), "f′ > 0", GRUEN, 5.2, 700))
    return svg(B_, H_, teile)


# ---------- Figur 4: Knick ----------

def fig_knick():
    UNTERLAGE[0] = WEISS
    A = Achsen(150.0, 80.0, -2, 2, -0.4, 2.2, 1, 1, "f(x) = |x|: Knick bei 0")
    A.graph(abs, -2, 2)
    links = (abs(0) - abs(-0.5)) / 0.5
    rechts = (abs(0.5) - abs(0)) / 0.5
    assert links == -1 and rechts == 1, "Knick: einseitige Steigungen sind nicht −1 und 1"
    A.punkt(0, 0, BLAU)
    A.t.append(txt(A.X(-1.1), A.Y(1.5), "links: −1", ORANGE, 5.4, 700))
    A.t.append(txt(A.X(1.1), A.Y(1.5), "rechts: 1", VIOLETT, 5.4, 700))
    return svg(A.B, A.H, A.t)


# ---------- Figur 5: Tangente und Normale ----------

def fig_tangente_normale():
    UNTERLAGE[0] = MERK
    fn = lambda x: x * x
    x0, y0 = 1.0, 1.0
    m = ableitung(fn, x0)
    mn = -1 / m
    assert abs(m * mn + 1) < 1e-9, "Tangente und Normale stehen nicht senkrecht"
    # Unverzerrt: gleiche Länge je Einheit in beide Richtungen, sonst sähe der rechte Winkel schief aus.
    B_, H_ = 150.0, 150.0
    xmin, xmax = -1.5, 2.5
    breite_px = B_ - 26.0
    hoehe_px = H_ - 26.0
    yspan = (xmax - xmin) * hoehe_px / breite_px
    A = Achsen(B_, H_, xmin, xmax, -1.0, -1.0 + yspan, 1, 1, "f(x) = x², P(1 | 1)")
    A.graph(fn, xmin, xmax)
    A.gerade(m, x0, y0, GRUEN, 1.2)
    A.gerade(mn, x0, y0, VIOLETT, 1.2)
    # Rechter-Winkel-Zeichen in P.
    e = 0.18
    dt = (1 / math.hypot(1, m), m / math.hypot(1, m))
    dn = (-m / math.hypot(1, m), 1 / math.hypot(1, m))
    p1 = (x0 + e * dt[0], y0 + e * dt[1])
    p2 = (x0 + e * (dt[0] + dn[0]), y0 + e * (dt[1] + dn[1]))
    p3 = (x0 + e * dn[0], y0 + e * dn[1])
    A.t.append(polyline([(A.X(p1[0]), A.Y(p1[1])), (A.X(p2[0]), A.Y(p2[1])), (A.X(p3[0]), A.Y(p3[1]))], SCHWARZ, 0.6))
    A.punkt(x0, y0, BLAU)
    # Steigungswinkel α der Tangente an ihrer Nullstelle x = 0,5.
    xs = x0 - y0 / m
    al = math.degrees(math.atan(m))
    A.t.append(polyline([(A.X(xs) + 9 * math.cos(math.radians(t)), A.Y(0) - 9 * math.sin(math.radians(t))) for t in [al * i / 20 for i in range(21)]], VIOLETT, 0.8))
    A.t.append(txt(A.X(xs) + 12, A.Y(0) - 3, f"α ≈ {zahl(al, 2)}°", VIOLETT, 5.0, 700, "start"))
    A.t.append(etikett(A.X(0.95), A.Y(2.75), "t(x) = 2x − 1", GRUEN, 5.2, 700, "end"))
    A.t.append(etikett(A.X(-1.45), A.Y(2.4), "n(x) = −0,5x + 1,5", VIOLETT, 5.2, 700, "start"))
    return svg(B_, H_, A.t)


# ---------- Figur 6: Nullstellen und Vielfachheit ----------

def fig_vielfachheit():
    UNTERLAGE[0] = WEISS
    fn = lambda x: 0.1 * (x + 2) ** 2 * (x - 1) * (x - 3)
    # Vorzeichen an den Nullstellen unabhängig nachgerechnet: −2 ohne, 1 und 3 mit Wechsel.
    wechsel = lambda r: fn(r - 1e-3) * fn(r + 1e-3) < 0
    assert not wechsel(-2) and wechsel(1) and wechsel(3), "Vielfachheit: Vorzeichenwechsel passen nicht"
    A = Achsen(150.0, 90.0, -3.5, 4, -3, 5, 1, 2, "f(x) = 0,1(x + 2)²(x − 1)(x − 3)")
    A.graph(fn, -3.5, 4)
    A.punkt(-2, 0, GRUEN, 1.9, True)
    A.punkt(1, 0, GRUEN, 1.7)
    A.punkt(3, 0, GRUEN, 1.7)
    # −2 berührt von oben: Unter der Achse ist dort Platz. Zwischen 1 und 3 liegt der Graph unten,
    # darüber ist frei.
    A.t.append(etikett(A.X(-2), A.Y(-1.1), "−2: doppelt, berührt", GRUEN, 5.0, 700))
    A.t.append(etikett(A.X(2), A.Y(2.6), "1 und 3: einfach, schneidet", GRUEN, 5.0, 700))
    return svg(A.B, A.H, A.t)


# ---------- Figur 7: Monotonie und Extrema der Quartik ----------

def fig_quartik():
    UNTERLAGE[0] = MERK
    fn = lambda x: 0.5 * x ** 4 - x * x + 0.5
    fd = lambda x: 2 * x ** 3 - 2 * x
    for xe in (-1.0, 0.0, 1.0):
        assert abs(fd(xe)) < 1e-12, "Quartik: f′ hat dort keine Nullstelle"
    assert fd(-1.5) < 0 < fd(-0.5) and fd(0.5) < 0 < fd(1.5), "Quartik: Vorzeichen von f′ falsch"
    A = Achsen(150.0, 92.0, -1.8, 1.8, -0.4, 2.6, 0.5, 1, "f(x) = 0,5x⁴ − x² + 0,5")
    fallend = lambda x: fd(x) < 0
    for a, b in ((-1.8, -1), (-1, 0), (0, 1), (1, 1.8)):
        farbe = ORANGE if fallend((a + b) / 2) else GRUEN
        A.graph(fn, a, b, farbe, 120, 1.4)
    A.punkt(-1, 0, BLAU)
    A.punkt(1, 0, BLAU)
    A.punkt(0, 0.5, BLAU)
    A.t.append(etikett(A.X(0), A.Y(0.5) - 4, "H(0 | 0,5)", BLAU, 5.2, 700))
    A.t.append(txt(A.X(-1), A.Y(0) - 4, "T₁", BLAU, 5.2, 700))
    A.t.append(txt(A.X(1), A.Y(0) - 4, "T₂", BLAU, 5.2, 700))
    A.t.append(etikett(A.X(-1.2), A.Y(1.9), "fällt", ORANGE, 5.2, 700))
    A.t.append(etikett(A.X(1.2), A.Y(1.9), "steigt", GRUEN, 5.2, 700))
    return svg(A.B, A.H, A.t)


# ---------- Figur 8: Verhalten für x → ±∞ ----------

def fig_aussen():
    UNTERLAGE[0] = WEISS
    B_, H_ = 300.0, 60.0
    setze_flaeche(B_, H_)
    teile = []
    faelle = [(lambda x: x ** 4, "n gerade, aₙ > 0", "↑ … ↑"), (lambda x: -x ** 4, "n gerade, aₙ < 0", "↓ … ↓"),
              (lambda x: x ** 3, "n ungerade, aₙ > 0", "↓ … ↑"), (lambda x: -x ** 3, "n ungerade, aₙ < 0", "↑ … ↓")]
    for i, (fn, name, pfeile) in enumerate(faelle):
        # Rechts und links: das Vorzeichen bei großem |x| entscheidet.
        r, l = fn(100), fn(-100)
        soll = {"↑ … ↑": (1, 1), "↓ … ↓": (-1, -1), "↓ … ↑": (-1, 1), "↑ … ↓": (1, -1)}[pfeile]
        assert (math.copysign(1, l), math.copysign(1, r)) == soll, f"Verhalten: {name} falsch"
        A = Achsen(75.0, H_ - 6, -1.3, 1.3, -1.4, 1.4, 1, 1, None, (75.0 * i, 0.0), zahlen=False, gesamt=(B_, H_))
        A.graph(fn, -1.3, 1.3, BLAU, 120, 1.2)
        teile += A.t
        teile.append(txt(75.0 * i + 41, H_ - 3, name, SCHWARZ, 5.0, 700))
    setze_flaeche(B_, H_)
    return svg(B_, H_, teile)


FIGUREN = [fig_sekante, fig_sekanten, fig_f_fstrich, fig_knick, fig_tangente_normale, fig_vielfachheit, fig_quartik, fig_aussen]

if __name__ == "__main__":
    zeilen = [fn() for fn in FIGUREN]
    pfad = pathlib.Path(__file__).parent / "f3-figuren.txt"
    pfad.write_text("\n".join(zeilen) + "\n", encoding="utf-8")
    print(f"{len(zeilen)} Figuren geschrieben")
