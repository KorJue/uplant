#!/usr/bin/env python3
"""Erzeugt die Figuren und Tabellen der Formelsammlung „Thermische Ausdehnung“ (Physik, Klasse 8).

Jede Figur wird aus denselben Größen gerechnet wie die Lernseite: mittlere Geschwindigkeiten aus
v = √(8RT/(πM)), die Erwärmungskurve aus Wärmekapazitäten und Umwandlungswärmen, die Energiemulde,
die Gasgesetze. Das Skript prüft dabei, was die Formelsammlung behauptet — Plateaus, Verhältnisse,
gleiche Rechtecksflächen, p · V : T vor und nach den zwei Schritten — und rechnet die Zahlen im Text
der Quelle nach (wie tm-svgs.py). Stimmt etwas nicht, bricht es ab.

    python3 ta-svgs.py      schreibt ta-figuren.txt (eine Zeichnung oder Tabelle je Zeile)
"""
import math
import pathlib
import re

from tf_kopf import (BLAU, GRUEN, ORANGE, ROT, VIOLETT, GRAU, SCHWARZ,
                     de, f, lin, rect, kreis, polyline, pruefe_im_bild, setze_flaeche, svg, txt)

T0 = 273.15
R_GAS, M_WASSER = 8.314462618, 0.018015
TUERKIS = "#0f766e"


def gleich(x, soll, was, eps=1e-9):
    assert abs(x - soll) < eps, f"{was}: {x} statt {soll}"


def v_mittel(theta):
    return math.sqrt(8 * R_GAS * (theta + T0) / (math.pi * M_WASSER))


class Rahmen:
    """Ein Diagramm mit Weltkoordinaten."""
    def __init__(self, x0, y0, b, h, xmin, xmax, ymin, ymax):
        self.x0, self.y0, self.b, self.h = x0, y0, b, h
        self.xmin, self.xmax, self.ymin, self.ymax = xmin, xmax, ymin, ymax

    def X(self, x):
        return self.x0 + (x - self.xmin) / (self.xmax - self.xmin) * self.b

    def Y(self, y):
        return self.y0 + self.h - (y - self.ymin) / (self.ymax - self.ymin) * self.h

    def achsen(self, xmarken, ymarken, xname, yname, xst=0, yst=0):
        t = []
        for y in ymarken:
            t.append(lin((self.x0, self.Y(y)), (self.x0 + self.b, self.Y(y)), "#d5dae0", 0.5))
            t.append(txt(self.x0 - 2, self.Y(y) + 2, de(y, yst), GRAU, 5.4, 400, "end"))
        for x in xmarken:
            t.append(lin((self.X(x), self.Y(self.ymin)), (self.X(x), self.Y(self.ymin) + 2), SCHWARZ, 0.6))
            t.append(txt(self.X(x), self.Y(self.ymin) + 8, de(x, xst), GRAU, 5.4))
        y_achse = self.Y(0) if self.ymin <= 0 <= self.ymax else self.Y(self.ymin)
        t.append(lin((self.x0, y_achse), (self.x0 + self.b, y_achse), SCHWARZ, 0.8))
        xa = self.X(min(max(0, self.xmin), self.xmax))
        t.append(lin((xa, self.y0), (xa, self.Y(self.ymin)), SCHWARZ, 0.8))
        t.append(txt(self.x0 + self.b, self.Y(self.ymin) + 15, xname, GRAU, 5.6, 400, "end"))
        t.append(txt(self.x0 + 2, self.y0 - 2, yname, GRAU, 5.6, 400, "start"))
        return t

    def kurve(self, fn, a, b, farbe, breite=1.3, n=160, strich=None):
        return polyline([(self.X(a + (b - a) * i / n), self.Y(fn(a + (b - a) * i / n))) for i in range(n + 1)], farbe, breite, strich)

    def zug(self, pts, farbe, breite=1.3, strich=None):
        return polyline([(self.X(x), self.Y(y)) for x, y in pts], farbe, breite, strich)


# ---------- Figur 1: Teilchenmodell, drei Zustände bei je zwei Temperaturen ----------

def fig_teilchen():
    B_, H_ = 300.0, 128.0
    setze_flaeche(B_, H_)
    zust = [("fest", "Eis", (-150, -5), BLAU), ("flüssig", "Wasser", (5, 95), TUERKIS), ("gasförmig", "Dampf", (110, 400), ORANGE)]
    v_bezug = v_mittel(20)
    t = [txt(108, 7, "kälter", SCHWARZ, 6.2, 700), txt(234, 7, "wärmer", SCHWARZ, 6.2, 700)]
    winkel = [0.3, 2.2, 4.0, 5.4, 1.1, 3.3, 0.8, 2.8, 4.6, 5.9]
    for zi, (name, stoff, temps, farbe) in enumerate(zust):
        y0 = 11 + zi * 39
        t.append(txt(2, y0 + 13, name, SCHWARZ, 6.0, 700, "start"))
        t.append(txt(2, y0 + 21, f"({stoff})", GRAU, 5.2, 400, "start"))
        v = [v_mittel(th) for th in temps]
        assert v[1] > v[0], f"{name}: wärmer muss schneller sein"
        for c, th in enumerate(temps):
            x0 = 48 + c * 126
            t.append(rect(x0, y0, 120, 29, "#c9d0d8", "#f6f8fa", 0.5, 1.0, 2))
            # Pfeillänge bzw. Schwingungskreis proportional zur mittleren Geschwindigkeit.
            l = 9.0 * v[c] / v_bezug
            if name == "fest":
                pos = [(x0 + 12 + 19 * i, y0 + 8 + 13 * j) for j in range(2) for i in range(6)]
            elif name == "flüssig":
                # Dicht, aber ungeordnet: drei versetzte Reihen mit Lücken.
                pos = [(x0 + 9 + 14 * i + (j % 2) * 6 + (2 if (i * 7 + j) % 3 == 0 else -1), y0 + 6 + 8.5 * j + (1.5 if i % 2 else 0))
                       for j in range(3) for i in range(8) if (i * 3 + j) % 7 != 2]
            else:
                pos = [(x0 + 14, y0 + 9), (x0 + 52, y0 + 20), (x0 + 88, y0 + 10), (x0 + 30, y0 + 21)]
            for k, (px, py) in enumerate(pos):
                if name == "fest":
                    t.append(kreis((px, py), 2.6 + l / 3, farbe, "none", 0.5).replace("/>", ' stroke-dasharray="1 0.8"/>'))
                t.append(kreis((px, py), 2.6, farbe, "#ffffff", 0.9))
                if name != "fest" and k % (3 if name == "flüssig" else 2) == 0:
                    w = winkel[k % len(winkel)]
                    # Bliebe die Pfeilspitze nicht im Feld, zeigt der Pfeil in die Gegenrichtung.
                    sx, sy = px + (3 + l) * math.cos(w), py - (3 + l) * math.sin(w)
                    if not (x0 + 2 <= sx <= x0 + 118 and y0 + 2 <= sy <= y0 + 27):
                        w += math.pi
                    ax, ay = px + 3 * math.cos(w), py - 3 * math.sin(w)
                    bx, by = px + (3 + l) * math.cos(w), py - (3 + l) * math.sin(w)
                    t.append(lin((ax, ay), (bx, by), farbe, 0.7))
                    for dw in (2.6, -2.6):
                        t.append(lin((bx, by), (bx - 2 * math.cos(w + dw / 6), by + 2 * math.sin(w + dw / 6)), farbe, 0.7))
            t.append(txt(x0 + 60, y0 + 36, f"{de(th, 0)} °C · {de(v[c], 0)} m/s", SCHWARZ, 5.2, 700))
    return svg(B_, H_, t)


# ---------- Figur 2: Erwärmungskurve von 1 kg Wasser ----------

C_EIS, C_WASSER, C_DAMPF, Q_S, Q_V = 2.1, 4.19, 2.0, 334, 2256


def fig_erwaermung():
    q1 = C_EIS * 20
    q2 = q1 + Q_S
    q3 = q2 + C_WASSER * 100
    q4 = q3 + Q_V
    q5 = q4 + C_DAMPF * 20
    pts = [(0, -20), (q1, 0), (q2, 0), (q3, 100), (q4, 100), (q5, 120)]
    gleich(q2 - q1, 334, "Schmelzen")
    gleich(q4 - q3, 2256, "Verdampfen")
    gleich(q3 - q2, 419, "Wasser erwärmen")
    assert Q_V > 5 * (q3 - q2), "Verdampfen braucht nicht mehr als fünfmal so viel wie das Erwärmen"
    B_, H_ = 300.0, 104.0
    setze_flaeche(B_, H_)
    r = Rahmen(24, 8, 266, 74, 0, 3200, -30, 130)
    t = r.achsen([0, 1000, 2000, 3000], [-20, 0, 50, 100], "Q in kJ", "ϑ in °C")
    t.append(r.zug(pts, BLAU, 1.6))
    t.append(txt(r.X((q1 + q2) / 2), r.Y(-12), "Schmelzen", VIOLETT, 5.4, 700))
    t.append(txt(r.X((q3 + q4) / 2), r.Y(100) - 3, f"Verdampfen: {de(Q_V, 0)} kJ", VIOLETT, 5.4, 700))
    t.append(txt(r.X(q3) + 6, r.Y(50), f"Wasser erwärmen: {de(q3 - q2, 0)} kJ", GRAU, 5.2, 400, "start"))
    return svg(B_, H_, t)


# ---------- Figur 3: Energiemulde ----------

A_M = 3.0


def mulde(r):
    return (1 - math.exp(-A_M * (r - 1))) ** 2 - 1


def umkehr(W):
    s = math.sqrt(W)
    return 1 - math.log(1 + s) / A_M, 1 - math.log(1 - s) / A_M


def fig_mulde():
    B_, H_ = 300.0, 104.0
    setze_flaeche(B_, H_)
    r = Rahmen(24, 8, 266, 76, 0, 3, -1.15, 0.45)
    t = r.achsen([0, 1, 2, 3], [-1, -0.5, 0], "Abstand in r₀", "Energie (Bindungsenergie = 1)", 0, 1)
    r_start = 1 - math.log(1 + math.sqrt(1.45)) / A_M
    gleich(mulde(r_start), 0.45, "Mulde, oberer Rand")
    t.append(r.kurve(mulde, r_start, 3, BLAU, 1.4))
    mitten = []
    for W, farbe in [(0.2, ORANGE), (0.6, ROT)]:
        r1, r2 = umkehr(W)
        gleich(mulde(r1), W - 1, "Umkehrpunkt innen", 1e-9)
        gleich(mulde(r2), W - 1, "Umkehrpunkt außen", 1e-9)
        m = (r1 + r2) / 2
        mitten.append(m)
        t.append(lin((r.X(r1), r.Y(W - 1)), (r.X(r2), r.Y(W - 1)), farbe, 1.2))
        t.append(lin((r.X(m), r.Y(W - 1)), (r.X(m), r.Y(-1.15)), GRUEN, 0.8, "2 1.4"))
        t.append(txt(r.X(r2) + 3, r.Y(W - 1) + 2, f"Mitte {de(m, 2)} r₀", farbe, 5.2, 700, "start"))
    assert 1 < mitten[0] < mitten[1], "Die Mitte muss mit der Energie nach außen wandern"
    t.append(lin((r.X(2.7), r.Y(-1)), (r.X(2.7), r.Y(0)), ROT, 1.0))
    t.append(txt(r.X(2.7) - 2, r.Y(-0.5), 'E<tspan baseline-shift="sub" font-size="4.2">B</tspan>', ROT, 6.0, 700, "end"))
    return svg(B_, H_, t)


# ---------- Tabellen: α und γ, die Beispielwerte gerechnet ----------

ALPHA = [("Aluminium", 0.023), ("Kupfer", 0.017), ("Stahl", 0.012), ("Beton", 0.012), ("Glas", 0.009)]
GAMMA = [("Ethanol", 1.1), ("Benzin", 1.0), ("Glycerin", 0.5), ("Wasser (20 °C)", 0.21), ("Quecksilber", 0.18)]


def tabelle_alpha():
    kopf = "<tr><th>Stoff</th>" + "".join(f"<th>{n}</th>" for n, _ in ALPHA) + "</tr>"
    z1 = "<tr><td class='l b'>α in mm/(m · K)</td>" + "".join(f"<td>{de(a, 3)}</td>" for _, a in ALPHA) + "</tr>"
    # ΔL für 10 m und 50 K: α · 10 · 50 — die Zeile rechnet das Gesetz vor.
    werte = [a * 10 * 50 for _, a in ALPHA]
    for (n, a), w in zip(ALPHA, werte):
        gleich(w, a * 500, f"ΔL {n}")
    z2 = "<tr><td class='l b'>ΔL für 10 m, 50 K</td>" + "".join(f"<td>{de(w, 1)} mm</td>" for w in werte) + "</tr>"
    return "<table>" + kopf + z1 + z2 + "</table>"


def tabelle_gamma():
    kopf = "<tr><th>Stoff</th>" + "".join(f"<th>{n}</th>" for n, _ in GAMMA) + "</tr>"
    z1 = "<tr><td class='l b'>γ in ml/(l · K)</td>" + "".join(f"<td>{de(g, 2)}</td>" for _, g in GAMMA) + "</tr>"
    werte = [g * 1 * 20 for _, g in GAMMA]
    z2 = "<tr><td class='l b'>ΔV für 1 l, 20 K</td>" + "".join(f"<td>{de(w, 1)} ml</td>" for w in werte) + "</tr>"
    return "<table>" + kopf + z1 + z2 + "</table>"


# ---------- Figur 4: Gay-Lussac und der absolute Nullpunkt ----------

def fig_gay_lussac():
    B_, H_ = 300.0, 100.0
    setze_flaeche(B_, H_)
    r = Rahmen(24, 8, 266, 72, -300, 200, 0, 2)
    t = r.achsen([-273.15, -200, -100, 0, 100, 200], [0, 0.5, 1, 1.5, 2], "ϑ in °C", "V in l", 0, 1)
    V = lambda th: (th + T0) / T0
    gleich(V(-T0), 0, "absoluter Nullpunkt")
    gleich(V(0), 1, "V bei 0 °C")
    t.append(r.zug([(-T0, 0), (-100, V(-100))], BLAU, 1.1, "3 2"))
    t.append(r.zug([(-100, V(-100)), (200, V(200))], BLAU, 1.6))
    t.append(kreis((r.X(-T0), r.Y(0)), 1.8, ROT, ROT, 0.8))
    t.append(txt(r.X(-T0) + 2, r.Y(0.6), "−273,15 °C = 0 K", ROT, 5.4, 700, "start"))
    t.append(lin((r.X(-T0), r.Y(0.5)), (r.X(-T0), r.Y(0.06)), ROT, 0.6, "1.5 1"))
    t.append(txt(r.X(60), r.Y(V(60)) - 6, "V ~ T  (p konstant)", BLAU, 5.6, 700, "end"))
    return svg(B_, H_, t)


# ---------- Figur 5: Boyle-Mariotte — gleiche Rechtecke ----------

def fig_boyle():
    B_, H_ = 300.0, 100.0
    setze_flaeche(B_, H_)
    r = Rahmen(24, 8, 266, 72, 0, 4.5, 0, 4.5)
    t = r.achsen([0, 1, 2, 3, 4], [0, 1, 2, 3, 4], "V in l", "p in bar")
    p = lambda v: 2.0 / v
    for v, farbe, strich in [(2.0, GRAU, "3 2"), (0.5, GRUEN, None)]:
        gleich(v * p(v), 2.0, "p · V")
        rr = rect(r.X(0), r.Y(p(v)), r.X(v) - r.X(0), r.Y(0) - r.Y(p(v)), farbe, farbe if strich is None else "none", 0.8, 0.18)
        t.append(rr.replace("/>", f' stroke-dasharray="{strich}"/>') if strich else rr)
    t.append(r.kurve(p, 2.0 / 4.5, 4.5, BLAU, 1.5))
    t.append(txt(r.X(1.2), r.Y(3.2), "grün: p · V = 2 bar · l", GRUEN, 5.6, 700, "start"))
    t.append(txt(r.X(2.05), r.Y(1) - 4, "gleich groß", GRAU, 5.4, 400, "start"))
    return svg(B_, H_, t)


# ---------- Figur 6: Amontons — Gerade durch 0 K ----------

def fig_amontons():
    B_, H_ = 300.0, 100.0
    setze_flaeche(B_, H_)
    r = Rahmen(24, 8, 266, 72, 0, 600, 0, 2)
    t = r.achsen([0, 100, 200, 300, 400, 500, 600], [0, 0.5, 1, 1.5, 2], "T in K", "p in bar", 0, 1)
    p = lambda T: T / (20 + T0)
    gleich(p(20 + T0), 1.0, "1 bar bei 20 °C")
    t.append(r.zug([(0, 0), (T0 - 50, p(T0 - 50))], BLAU, 1.1, "3 2"))
    t.append(r.zug([(T0 - 50, p(T0 - 50)), (T0 + 250, p(T0 + 250))], BLAU, 1.6))
    t.append(txt(r.X(T0), r.Y(0) - 3, "0 °C", GRAU, 5.2))
    t.append(txt(r.X(400), r.Y(p(400)) - 6, "p ~ T  (V konstant)", BLAU, 5.6, 700, "end"))
    return svg(B_, H_, t)


# ---------- Figur 7: allgemeine Gasgleichung in zwei Schritten ----------

def fig_gasgleichung():
    p1, V1, T1 = 1.0, 2.0, 293.15
    V2, T2 = 1.5, 353.15
    p_stern = p1 * V1 / V2
    p2 = p_stern * T2 / T1
    gleich(p2 * V2 / T2, p1 * V1 / T1, "allgemeine Gasgleichung")
    B_, H_ = 300.0, 100.0
    setze_flaeche(B_, H_)
    r = Rahmen(24, 8, 266, 72, 0, 3.5, 0, 2.5)
    t = r.achsen([0, 1, 2, 3], [0, 1, 2], "V in l", "p in bar")
    t.append(r.kurve(lambda v: p1 * V1 / v, p1 * V1 / 2.5, 3.5, GRAU, 0.8, strich="3 2"))
    t.append(r.kurve(lambda v: p1 * V1 * T2 / (T1 * v), p1 * V1 * T2 / (T1 * 2.5), 3.5, GRAU, 0.8, strich="3 2"))
    t.append(r.kurve(lambda v: p1 * V1 / v, V2, V1, ORANGE, 1.8))
    t.append(r.zug([(V2, p_stern), (V2, p2)], ORANGE, 1.8))
    for (v, p, farbe, name, dx) in [(V1, p1, BLAU, "1", 4), (V2, p_stern, VIOLETT, "*", -4), (V2, p2, GRUEN, "2", 4)]:
        t.append(kreis((r.X(v), r.Y(p)), 2.0, farbe, farbe, 0.8))
        t.append(txt(r.X(v) + dx, r.Y(p) - 3, name, farbe, 6.0, 700, "start" if dx > 0 else "end"))
    t.append(txt(r.X(3.4), r.Y(p1 * V1 / 3.4) + 7, "T₁", GRAU, 5.2, 400, "end"))
    t.append(txt(r.X(3.4), r.Y(p1 * V1 * T2 / (T1 * 3.4)) - 3, "T₂", GRAU, 5.2, 400, "end"))
    t.append(txt(r.X(2.45), r.Y(2.2), "1 → *: T bleibt  ·  * → 2: V bleibt", SCHWARZ, 5.4, 700))
    return svg(B_, H_, t)


# ---------- Die Zahlen im Text der Quelle ----------
# Jede Rechnung steht wörtlich in der Quelle und wird hier nachgerechnet (Zahlen mit Komma, · und :).

def wert(ausdruck):
    s = ausdruck.replace("−", "-").replace("·", "*").replace(":", "/").replace(",", ".")
    assert re.fullmatch(r"[0-9+\-*/(). ]+", s), f"nicht lesbar: {ausdruck!r}"
    return eval(s, {"__builtins__": {}}, {})


RECHNUNGEN = [
    # (Rechnung wie in der Quelle, Ergebnis, Toleranz der angegebenen Stellen)
    ("0,012 · 30 · 40", "14,4", 1e-9),
    ("1,1 · 0,5 · 10", "5,5", 1e-9),
    ("5,5 : 0,2", "27,5", 1e-9),
    ("1,0 · 2,0 : 0,5", "4,0", 1e-9),
    ("3,0 · 323,15 : 293,15", "3,31", 0.005),
    ("3,0 · 333,15 : 293,15", "3,41", 0.005),
    ("4,0 · 1,0 : 0,26 · 223,15 : 288,15", "11,91", 0.005),
    ("37 + 273,15", "310,15", 1e-9),
]


def pruefe_quelle():
    quelle = (pathlib.Path(__file__).parent / "formelsammlung-ta-quelle.html").read_text(encoding="utf-8")
    for rechnung, ergebnis, tol in RECHNUNGEN:
        zeile = f"{rechnung} {'=' if tol < 1e-6 else '≈'} {ergebnis}"
        assert zeile in quelle, f"nicht wörtlich in der Quelle: {zeile}"
        gleich(wert(rechnung), wert(ergebnis), zeile, tol + 1e-12)
    return len(RECHNUNGEN)


FIGUREN = [fig_teilchen, fig_erwaermung, fig_mulde, tabelle_alpha, tabelle_gamma, fig_gay_lussac, fig_boyle, fig_amontons, fig_gasgleichung]

if __name__ == "__main__":
    print(f"{pruefe_quelle()} Rechnungen der Quelle nachgerechnet")
    zeilen = [fn() for fn in FIGUREN]
    pfad = pathlib.Path(__file__).parent / "ta-figuren.txt"
    pfad.write_text("\n".join(zeilen) + "\n", encoding="utf-8")
    print(f"{len(zeilen)} Figuren und Tabellen geschrieben")
