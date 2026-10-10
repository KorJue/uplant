#!/usr/bin/env python3
"""Erzeugt die Figuren der Formelsammlung „Untersuchung weiterer Funktionen“ (MSS 11, Analysis, Thema 3.2).

Jeder Graph wird aus der Funktion gerechnet, jeder markierte Punkt numerisch nachgeprüft: Hoch- und
Wendepunkte sind Vorzeichenwechsel von f′ bzw. f″, die Ortskurven gehen durch die Punkte jedes
gezeichneten Scharmitglieds, die Asymptoten sind Grenzwerte weit draußen, der Wendepunkt des
logistischen Wachstums liegt bei S/2, die Hochpunkte der gedämpften Schwingung liegen links der
Berührpunkte mit der Hüllkurve, und die Wendetangenten der Glockenkurve treffen die x-Achse bei ±2σ.

    python3 f32-svgs.py      schreibt f32-figuren.txt (eine Figur je Zeile)
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
                # Aufaddierte Gitterwerte landen bei −2,7 · 10⁻¹⁷ statt 0 — gerundet, sonst stünde „−0“ da.
                self.t.append(txt(self.X(xmin) - 2.5, self.Y(y) + 1.8, zahl(round(y, 9) + 0.0, 1), GRAU, 5.0, 400, "end"))
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
    return {0: "0", 1: "π/2", 2: "π", 3: "3π/2", 4: "2π", 5: "5π/2", 6: "3π", 7: "7π/2", 8: "4π"}.get(k, "")


def ableitung2(fn, x, h=1e-4):
    return (fn(x + h) - 2 * fn(x) + fn(x - h)) / (h * h)


# ---------- Figur 1: Musterrechnung x · e⁻ˣ mit Hochpunkt, Wendepunkt und Asymptote ----------

def fig_muster():
    UNTERLAGE[0] = WEISS
    fn = lambda x: x * math.exp(-x)
    ext = nullstellen(lambda x: ableitung(fn, x), -0.9937, 7)
    wen = nullstellen(lambda x: ableitung2(fn, x), -0.9937, 7)
    assert len(ext) == 1 and abs(ext[0] - 1) < 1e-6, f"x · e⁻ˣ: Extremstellen {ext}"
    assert len(wen) == 1 and abs(wen[0] - 2) < 1e-5, f"x · e⁻ˣ: Wendestellen {wen}"
    assert abs(fn(60)) < 1e-20, "x · e⁻ˣ: kein Grenzwert 0 für x → ∞"
    A = Achsen(150.0, 80.0, -0.8, 7, -0.9, 0.55, 1, 0.2, "f(x) = x · e⁻ˣ")
    A.graph(fn, -0.8, 7, BLAU, 300, 1.2)
    A.gerade(0.0, 0, 0, ROT, 1.2, "3 1.5", 3.6, 7)
    A.punkt(1, fn(1), BLAU)
    A.punkt(2, fn(2), VIOLETT)
    A.t.append(etikett(A.X(1), A.Y(fn(1)) - 4, f"H(1 | {zahl(fn(1), 4)})", BLAU, 5.0, 700))
    # Rechts oberhalb von W ist frei — der Graph fällt dort schon flach ab.
    A.t.append(etikett(A.X(2.2), A.Y(fn(2)) - 3, f"W(2 | {zahl(fn(2), 4)})", VIOLETT, 5.0, 700, "start"))
    A.t.append(etikett(A.X(6.9), A.Y(-0.12), "Asymptote y = 0", ROT, 5.0, 700, "end"))
    return svg(A.B, A.H, A.t)


# ---------- Figur 2: Schar x · e^(−kx) mit den Ortskurven der Hoch- und Wendepunkte ----------

def fig_schar():
    UNTERLAGE[0] = MERK
    # Oben Platz für den Titel: Die Ortskurve der Hochpunkte endet sonst in ihm.
    A = Achsen(150.0, 90.0, -0.3, 8.5, -0.15, 2.0, 1, 0.5, "fₖ(x) = x · e^(−kx)")
    for k in (0.25, 0.5, 1, 2):
        fn = lambda x, k=k: x * math.exp(-k * x)
        h = nullstellen(lambda x: ableitung(fn, x), 0.01, 20)[0]
        w = nullstellen(lambda x: ableitung2(fn, x), 0.01, 20)[0]
        assert abs(fn(h) - h / math.e) < 1e-9 and abs(fn(w) - w / math.e ** 2) < 1e-6, f"k = {k}: Punkte nicht auf den Ortskurven"
        A.graph(fn, -0.3, 8.5, BLAU, 300, 0.9)
        A.punkt(h, fn(h), BLAU, 1.3)
        A.punkt(w, fn(w), VIOLETT, 1.3)
    A.gerade(1 / math.e, 0, 0, ROT, 0.9, "3 1.5", 0, 4.4)
    A.gerade(1 / math.e ** 2, 0, 0, VIOLETT, 0.9, "3 1.5", 0, 8.5)
    A.t.append(etikett(A.X(4.5), A.Y(4.5 / math.e) + 2, "y = x/e", ROT, 5.0, 700, "start"))
    A.t.append(etikett(A.X(8.4), A.Y(8.4 / math.e ** 2) - 3, "y = x/e²", VIOLETT, 5.0, 700, "end"))
    return svg(A.B, A.H, A.t)


# ---------- Figur 3: drei Wachstumsmodelle ----------

def fig_wachstum():
    UNTERLAGE[0] = WEISS
    ex = lambda t: 5 * math.exp(0.15 * t)
    be = lambda t: 100 - 90 * math.exp(-0.2 * t)
    lo = lambda t: 100 / (1 + 9 * math.exp(-0.4 * t))
    tw = nullstellen(lambda t: ableitung2(lo, t), 0.5, 20)
    assert len(tw) == 1 and abs(tw[0] - math.log(9) / 0.4) < 1e-4 and abs(lo(tw[0]) - 50) < 1e-4, "logistisch: Wendepunkt nicht bei S/2"
    assert all(ableitung2(be, t) < 0 for t in (0, 5, 10, 20)) and all(ableitung2(ex, t) > 0 for t in (0, 5, 10, 20)), "Krümmung der Modelle falsch"
    A = Achsen(150.0, 84.0, 0, 20, 0, 115, 5, 20, None)
    A.gerade(0.0, 0, 100, ROT, 0.8, "3 1.5")
    A.graph(ex, 0, 20, ORANGE, 200, 1.1)
    A.graph(be, 0, 20, GRUEN, 200, 1.1)
    A.graph(lo, 0, 20, BLAU, 200, 1.2)
    A.punkt(tw[0], 50, VIOLETT)
    A.t.append(etikett(A.X(19.8), A.Y(106), "S = 100", ROT, 5.0, 700, "end"))
    A.t.append(etikett(A.X(15.3), A.Y(62), "exponentiell", ORANGE, 5.0, 700, "end"))
    # Links oben ist frei: Die beschränkte Kurve steigt dort schon steil, die logistische noch nicht.
    A.t.append(etikett(A.X(0.6), A.Y(80), "beschränkt", GRUEN, 5.0, 700, "start"))
    A.t.append(etikett(A.X(tw[0] + 0.6), A.Y(44), "logistisch, W bei S/2", BLAU, 5.0, 700, "start"))
    return svg(A.B, A.H, A.t)


# ---------- Figur 4: gedämpfte Schwingung — Hochpunkte links der Berührpunkte ----------

def fig_schwingung():
    UNTERLAGE[0] = WEISS
    d = 0.2
    fn = lambda x: math.exp(-d * x) * math.sin(x)
    ext = nullstellen(lambda x: ableitung(fn, x), 0.01, 4 * math.pi - 0.01)
    assert len(ext) == 4 and abs(ext[0] - math.atan(1 / d)) < 1e-6, f"Schwingung: Extremstellen {ext}"
    assert all(abs(ext[i + 1] - ext[i] - math.pi) < 1e-6 for i in range(3)), "Schwingung: Abstand der Extremstellen nicht π"
    A = Achsen(150.0, 72.0, 0, 4 * math.pi, -1.1, 1.1, math.pi / 2, 0.5, None, xbeschrift=pi_text)
    A.graph(lambda x: math.exp(-d * x), 0, 4 * math.pi, GRAU, 200, 0.7, "2 1.5")
    A.graph(lambda x: -math.exp(-d * x), 0, 4 * math.pi, GRAU, 200, 0.7, "2 1.5")
    A.graph(fn, 0, 4 * math.pi, BLAU, 400, 1.2)
    for i, x in enumerate(ext):
        xb = math.pi / 2 + i * math.pi
        assert x < xb, "Schwingung: Der Hochpunkt liegt nicht links vom Berührpunkt"
        A.punkt(x, fn(x), BLAU, 1.4)
        A.punkt(xb, fn(xb), ROT, 1.5, hohl=True)
    # Rechts unterhalb des ersten Hochpunkts fällt der Graph schon — dort ist Platz.
    A.t.append(etikett(A.X(ext[0]) + 6, A.Y(0.42), "H: tan x = 5", BLAU, 5.0, 700, "start"))
    A.t.append(etikett(A.X(3 * math.pi / 2 + 0.3), A.Y(0.75), "Hüllkurve ±e^(−0,2x)", GRAU, 5.0, 700, "start"))
    return svg(A.B, A.H, A.t)


# ---------- Figur 5: Glockenkurve mit Wendepunkten und Wendetangenten ----------

def fig_glocke():
    UNTERLAGE[0] = WEISS
    s = 1.0
    fn = lambda x: math.exp(-x * x / (2 * s * s))
    wen = nullstellen(lambda x: ableitung2(fn, x), -3.9937, 4)
    assert len(wen) == 2 and abs(wen[0] + s) < 1e-5 and abs(wen[1] - s) < 1e-5, f"Glocke: Wendestellen {wen}"
    A = Achsen(150.0, 70.0, -3.5, 3.5, -0.1, 1.15, 1, 0.5, "f(x) = e^(−x²/2), σ = 1")
    for w in wen:
        m = ableitung(fn, w)
        nst = w - fn(w) / m
        assert abs(abs(nst) - 2 * s) < 1e-5, "Glocke: Die Wendetangente trifft die x-Achse nicht bei ±2σ"
        A.gerade(m, w, fn(w), VIOLETT, 0.8, "3 1.5", min(w, nst), max(w, nst))
        A.punkt(nst, 0, GRAU, 1.2)
    A.graph(fn, -3.5, 3.5, BLAU, 300, 1.2)
    for w in wen:
        A.punkt(w, fn(w), VIOLETT)
    A.punkt(0, 1, BLAU)
    A.t.append(etikett(A.X(1.15), A.Y(fn(1)) + 1, f"W(±σ | {zahl(fn(1), 4)})", VIOLETT, 5.0, 700, "start"))
    # Über dem Schnittpunkt ist frei — die Zahl 2 der Achse steht darunter.
    A.t.append(etikett(A.X(2) + 4, A.Y(0.12), "2σ", GRAU, 5.0, 700, "start"))
    return svg(A.B, A.H, A.t)


FIGUREN = [fig_muster, fig_schar, fig_wachstum, fig_schwingung, fig_glocke]

if __name__ == "__main__":
    zeilen = [fn() for fn in FIGUREN]
    pfad = pathlib.Path(__file__).parent / "f32-figuren.txt"
    pfad.write_text("\n".join(zeilen) + "\n", encoding="utf-8")
    print(f"{len(zeilen)} Figuren geschrieben")
