#!/usr/bin/env python3
"""Erzeugt die SVG-Figuren der Formelsammlung „Der Kreis“ (Klasse 8, Geometrie, Thema 5).

Jede Figur wird gerechnet, nicht gezeichnet: Punkte kommen aus denselben Maßen, die im Text
daneben stehen, umgerechnet mit einem festen Maßstab. Wo eine Figur eine Gleichheit zeigt —
Fast-Rechteck aus denselben Stücken, Ringe füllen das Dreieck, Ring gleich Rechteck aus Mittellinie
und Breite —, rechnet dieses Skript sie nach (Gaußsche Trapezformel, Bögen fein unterteilt) und
bricht ab, wenn sie nicht stimmt. tf_kopf.pruefe_im_bild schlägt an, sobald etwas aus der Fläche
ragt.

    python3 kr-svgs.py      schreibt kr-figuren.txt (eine Zeichnung je Zeile)
"""
import math
import pathlib

from tf_kopf import (BLAU, GRUEN, ORANGE, VIOLETT, GRAU, SCHWARZ,
                     de, f, lin, polyline, pruefe_im_bild, setze_flaeche, svg, txt)

PI = math.pi


class Bild:
    """Rechnet Zentimeter in Zeichenpunkte um. Nullpunkt links unten, y nach oben."""

    def __init__(self, ox, oy, skala):
        self.ox, self.oy, self.s = ox, oy, skala

    def __call__(self, p):
        return (self.ox + p[0] * self.s, self.oy - p[1] * self.s)


def flaeche(punkte):
    s = 0.0
    for i, a in enumerate(punkte):
        b = punkte[(i + 1) % len(punkte)]
        s += a[0] * b[1] - b[0] * a[1]
    return abs(s) / 2


# 3° je Sehne: im Druck so glatt wie ein echter Bogen, und das PDF bleibt klein. Für die
# Selbstkontrolle der Flächen reicht das (Fehler unter 0,05 %).
def bogen_punkte(m, r, a0, a1, schritt=math.pi / 60):
    n = max(2, math.ceil(abs(a1 - a0) / schritt))
    return [(m[0] + r * math.cos(a0 + (a1 - a0) * i / n), m[1] + r * math.sin(a0 + (a1 - a0) * i / n)) for i in range(n + 1)]


def poly(bild, punkte, rand, fuell="none", deckung=0.16, breite=1.2, strich=None):
    q = [bild(p) for p in punkte]
    for x, y in q:
        pruefe_im_bild(x, y, "Vieleck")
    d = f' stroke-dasharray="{strich}"' if strich else ""
    pts = " ".join(f"{f(x)},{f(y)}" for x, y in q)
    return (f'<polygon points="{pts}" fill="{fuell}" fill-opacity="{f(deckung)}" stroke="{rand}" '
            f'stroke-width="{f(breite)}" stroke-linejoin="round"{d}/>')


def zug(bild, punkte, farbe, breite=1.4, strich=None):
    return polyline([bild(p) for p in punkte], farbe, breite, strich)


def strecke(bild, a, b, farbe, breite=1.4, strich=None):
    return lin(bild(a), bild(b), farbe, breite, strich)


def punkt(bild, p, name, farbe=SCHWARZ, dx=0.0, dy=-4.5, groesse=7.0):
    x, y = bild(p)
    return [f'<circle cx="{f(x)}" cy="{f(y)}" r="1.8" fill="{farbe}"/>',
            txt(x + dx, y + dy, name, farbe, groesse, 700)]


def beschrift(bild, p, text, farbe, dx=0.0, dy=0.0, groesse=6.9, anker="middle"):
    x, y = bild(p)
    return txt(x + dx, y + dy, text, farbe, groesse, 700, anker, halo=True)


def gleich(x, soll, was, tol=1e-9):
    assert abs(x - soll) <= tol * max(1.0, abs(soll)), f"{was}: {x} statt {soll}"


def kurz(w):
    x = w % (2 * PI)
    if x > PI:
        x -= 2 * PI
    return x


def stuecke(r, theta, anzahl, start, ziel_x0):
    """Die Ausschnitte im fertigen Fast-Rechteck — dieselbe Lage wie auf der Lernseite."""
    c, h = 2 * r * math.sin(theta / 2), r * math.cos(theta / 2)
    out = []
    for k in range(anzahl):
        a0 = start + k * theta
        mitte = a0 + theta / 2
        unten = k % 2 == 0
        i = k // 2
        spitze = (ziel_x0 + (i + 0.5) * c, h) if unten else (ziel_x0 + (i + 1) * c, 0.0)
        achse = -PI / 2 if unten else PI / 2
        dw = kurz(achse - mitte)
        co, si = math.cos(dw), math.sin(dw)
        roh = [(0.0, 0.0)] + [(r * math.cos(a), r * math.sin(a)) for a in
                              [a0 + theta * j / 10 for j in range(11)]]
        out.append(([(spitze[0] + x * co - y * si, spitze[1] + x * si + y * co) for x, y in roh], unten))
    return out, c, h


# ---------- Figur 1: Abrollen — U = π · d ----------

def fig_abrollen():
    B, H = 300.0, 118.0
    setze_flaeche(B, H)
    d = 2.0
    U = PI * d
    b = Bild(22.0, 82.0, 36.0)
    M = (0.0 + 1.0, d / 2)
    t = [strecke(b, (-0.2, 0), (M[0] + U + 0.2, 0), GRAU, 0.9),
         f'<circle cx="{f(b(M)[0])}" cy="{f(b(M)[1])}" r="{f(d / 2 * b.s)}" fill="none" stroke="{BLAU}" stroke-width="1.6"/>',
         strecke(b, (M[0], 0), (M[0], d), BLAU, 1.4),
         beschrift(b, (M[0], d * 0.72), "d", BLAU, 6, 2)]
    # Die abgerollte Strecke beginnt im Berührpunkt des Rades.
    x0 = M[0]
    t.append(strecke(b, (x0, 0), (x0 + U, 0), ORANGE, 2.6))
    for k in range(4):
        t.append(strecke(b, (x0 + k * d, -0.28), (x0 + (k + 1) * d if k < 3 else x0 + U, -0.28), BLAU if k % 2 == 0 else GRAU, 2.2))
    for k in range(3):
        t.append(beschrift(b, (x0 + (k + 0.5) * d, -0.28), "d", BLAU, 0, 9))
    t.append(beschrift(b, (x0 + 3 * d + (U - 3 * d) / 2, -0.28), "Rest", GRAU, 0, 9, 6.0))
    t.append(beschrift(b, (x0 + U / 2, 0), "U = π · d", ORANGE, 0, -5))
    t.append(txt(B / 2, H - 6, f"Eine Umdrehung: U ≈ 3,14 · d — 3 Durchmesser und ein Rest von gut einem Siebtel", SCHWARZ, 6.8, 700))
    gleich(U / d, PI, "Abrollen")
    return svg(B, H, t)


# ---------- Figur 2: Einschachteln — 3 · d < U < 4 · d ----------

def fig_einschachteln():
    B, H = 300.0, 150.0
    setze_flaeche(B, H)
    r = 2.0
    b = Bild(B / 2, 68.0, 26.0)
    M = (0.0, 0.0)
    sechs = [(r * math.cos(PI / 2 + k * PI / 3), r * math.sin(PI / 2 + k * PI / 3)) for k in range(6)]
    quadrat = [(-r, -r), (r, -r), (r, r), (-r, r)]
    # Die sechs Dreiecke sind gleichseitig: jede Sechseckseite ist so lang wie der Radius.
    for k in range(6):
        p, q = sechs[k], sechs[(k + 1) % 6]
        gleich(math.hypot(p[0] - q[0], p[1] - q[1]), r, "Sechseckseite")
    t = [poly(b, quadrat, ORANGE, breite=1.4),
         f'<circle cx="{f(b(M)[0])}" cy="{f(b(M)[1])}" r="{f(r * b.s)}" fill="none" stroke="{BLAU}" stroke-width="1.6"/>',
         poly(b, sechs, GRUEN, GRUEN, 0.10, 1.4)]
    for p in sechs:
        t.append(strecke(b, M, p, GRUEN, 0.6))
    t.append(beschrift(b, (sechs[1][0] / 2, sechs[1][1] / 2), "r", GRUEN, -2, -3))
    t.append(beschrift(b, (0, -r), "d", ORANGE, 0, 9))
    t.append(beschrift(b, (-r, 0), "6 · r = 3 · d", GRUEN, -4, 0, 6.6, "end"))
    t.append(beschrift(b, (r, 0), "4 · d", ORANGE, 5, 0, 6.6, "start"))
    t += punkt(b, M, "M", dx=0, dy=8, groesse=6.4)
    t.append(txt(B / 2, H - 6, "Sechseck innen 3 · d  <  Kreis U  <  Quadrat außen 4 · d", SCHWARZ, 7.0, 700))
    return svg(B, H, t)


# ---------- Figur 3: Ausschnitte zum Fast-Rechteck ----------

def fig_ausschnitte():
    B, H = 300.0, 112.0
    setze_flaeche(B, H)
    r, n = 1.6, 12
    theta = 2 * PI / n
    b = Bild(14.0, 74.0, 26.0)
    C0 = (r, 0.55)
    t = []
    for k in range(n):
        a0 = PI / 2 + k * theta
        teil = [C0] + bogen_punkte(C0, r, a0, a0 + theta)
        t.append(poly(b, teil, GRUEN if k % 2 == 0 else ORANGE, GRUEN if k % 2 == 0 else ORANGE, 0.22, 0.7))
    x0 = 2 * r + 1.6
    teile, c, h = stuecke(r, theta, n, PI / 2, x0)
    summe = 0.0
    for punkte, unten in teile:
        summe += flaeche(punkte)
        t.append(poly(b, punkte, GRUEN if unten else ORANGE, GRUEN if unten else ORANGE, 0.22, 0.7))
    # Dieselben Stücke: Das Fast-Rechteck hat genau den Flächeninhalt des Kreises (bis auf die
    # Unterteilung der Bögen in Sehnen).
    gleich(summe, PI * r * r, "Fast-Rechteck", 2e-3)
    t.append(strecke(b, (x0 + c / 2, h), (x0 + c / 2, h - r), BLAU, 1.0, "3 2"))
    t.append(beschrift(b, (x0 + c / 2, h - r / 2), "r", BLAU, 5, 2))
    t.append(beschrift(b, (x0 + n / 4 * c, -(r - h)), "π · r  (halber Umfang)", ORANGE, 0, 10))
    t.append(txt(B / 2, H - 6, "Dieselben Stücke, umgelegt: A ≈ π · r · r = π · r²", SCHWARZ, 7.0, 700))
    return svg(B, H, t)


# ---------- Figur 4: Ringe zum Dreieck ----------

def fig_ringe():
    B, H = 300.0, 112.0
    setze_flaeche(B, H)
    r, n = 1.6, 5
    w = r / n
    U = 2 * PI * r
    b = Bild(B / 2, 84.0, 25.0)
    t = [poly(b, [(-U / 2, 0), (U / 2, 0), (0, r)], GRAU, breite=0.9, strich="3 2")]
    summe = 0.0
    for i in range(n):
        rho = r - (i + 0.5) * w
        L = 2 * PI * rho
        rechteck = [(-L / 2, i * w), (L / 2, i * w), (L / 2, (i + 1) * w), (-L / 2, (i + 1) * w)]
        # Jeder Streifen ist so lang wie die Mitte seines Rings: dieselbe Fläche wie der Ring.
        gleich(flaeche(rechteck), PI * ((r - i * w) ** 2 - (r - (i + 1) * w) ** 2), f"Ring {i}")
        summe += flaeche(rechteck)
        t.append(poly(b, rechteck, GRUEN if i % 2 == 0 else ORANGE, GRUEN if i % 2 == 0 else ORANGE, 0.24, 0.7))
    gleich(summe, 0.5 * U * r, "Ringe füllen das Dreieck")
    t.append(strecke(b, (-U / 2 - 0.25, 0), (-U / 2 - 0.25, r), BLAU, 1.0, "3 2"))
    t.append(beschrift(b, (-U / 2 - 0.25, r / 2), "r", BLAU, -5, 2))
    t.append(beschrift(b, (0, 0), "U = 2 · π · r", ORANGE, 0, 10))
    t += punkt(b, (0, r), "M", dx=0, dy=-4, groesse=6.4)
    t.append(txt(B / 2, H - 4, "Aufgebogene Ringe füllen das Dreieck: A = ½ · U · r = π · r²", SCHWARZ, 7.0, 700))
    return svg(B, H, t)


# ---------- Figur 5: Kreisring ----------

def fig_ring():
    B, H = 300.0, 132.0
    setze_flaeche(B, H)
    R, r = 1.7, 1.0
    w = R - r
    b = Bild(54.0, 66.0, 26.0)
    M = (0.0, 0.0)
    # Zwei echte Kreise in einem Pfad mit evenodd: Das Loch bleibt frei.
    cx, cy = b(M)
    def kreisbahn(rad):
        rr = rad * b.s
        pruefe_im_bild(cx - rr, cy - rr, "Ring")
        pruefe_im_bild(cx + rr, cy + rr, "Ring")
        return f"M {f(cx - rr)} {f(cy)} a {f(rr)} {f(rr)} 0 1 0 {f(2 * rr)} 0 a {f(rr)} {f(rr)} 0 1 0 {f(-2 * rr)} 0 "
    pfad = kreisbahn(R) + kreisbahn(r)
    t = [f'<path d="{pfad}" fill="{GRUEN}" fill-opacity="0.22" fill-rule="evenodd" stroke="{GRUEN}" stroke-width="1.2"/>',
         strecke(b, M, (R, 0), BLAU, 1.3),
         beschrift(b, ((R + r) / 2, 0), "R", BLAU, 0, -3),
         strecke(b, M, (r * math.cos(2.4), r * math.sin(2.4)), VIOLETT, 1.3),
         beschrift(b, (r / 2 * math.cos(2.4), r / 2 * math.sin(2.4)), "r", VIOLETT, -4, -2)]
    t += punkt(b, M, "M", dx=0, dy=8, groesse=6.4)
    # Aufgebogen: das Rechteck aus Mittellinie π · (R + r) und Breite R − r, im Trapez der Umfänge.
    b2 = Bild(197.0, 76.0, 16.5)
    L = PI * (R + r)
    rechteck = [(-L / 2, 0), (L / 2, 0), (L / 2, w), (-L / 2, w)]
    trapez = [(-PI * R, 0), (PI * R, 0), (PI * r, w), (-PI * r, w)]
    gleich(flaeche(rechteck), PI * (R * R - r * r), "Ring gegen Rechteck")
    gleich(flaeche(trapez), PI * (R * R - r * r), "Ring gegen Trapez")
    t += [poly(b2, trapez, GRAU, breite=0.9, strich="3 2"),
          poly(b2, rechteck, GRUEN, GRUEN, 0.22, 1.0),
          beschrift(b2, (0, 0), "2 · π · R", ORANGE, 0, 9, 6.4),
          beschrift(b2, (0, w), "2 · π · r", ORANGE, 0, -4, 6.4),
          beschrift(b2, (0, w / 2), "π · (R + r)", GRUEN, 0, 2.4, 6.2)]
    t.append(txt(B / 2, H - 6, "Großer Kreis ohne kleinen — aufgebogen ein Rechteck aus Mittellinie und Breite", SCHWARZ, 6.8, 700))
    return svg(B, H, t)


# ---------- Figur 6: Kreisbogen und Kreisausschnitt ----------

def fig_sektor():
    # Etwas höher als die anderen Figuren: Unter dem gestrichelten Vollkreis braucht die
    # Bildunterschrift eine eigene Zeile, sonst läuft sie durch den Kreis.
    B, H = 300.0, 142.0
    setze_flaeche(B, H)
    r, alpha = 2.0, 100.0
    a = math.radians(alpha)
    b = Bild(80.0, 68.0, 25.0)
    M = (0.0, 0.0)
    rand = bogen_punkte(M, r, 0, a)
    t = [f'<circle cx="{f(b(M)[0])}" cy="{f(b(M)[1])}" r="{f(r * b.s)}" fill="none" stroke="{GRAU}" stroke-width="0.8" stroke-dasharray="3 2"/>',
         poly(b, [M] + rand, GRUEN, GRUEN, 0.2, 0.8),
         strecke(b, M, (r, 0), BLAU, 1.4),
         strecke(b, M, (r * math.cos(a), r * math.sin(a)), BLAU, 1.4),
         zug(b, rand, ORANGE, 2.4),
         zug(b, bogen_punkte(M, 0.42, 0, a), VIOLETT, 1.0),
         beschrift(b, (0.62 * math.cos(a / 2), 0.62 * math.sin(a / 2)), "α", VIOLETT, 0, 2.5),
         beschrift(b, (r / 2, 0), "r", BLAU, 0, 8),
         beschrift(b, ((r + 0.22) * math.cos(a / 2), (r + 0.22) * math.sin(a / 2)), "b", ORANGE, 2, 0)]
    gleich(flaeche([M] + bogen_punkte(M, r, 0, a, math.pi / 3600)), alpha / 360 * PI * r * r, "Ausschnitt", 1e-6)
    t += punkt(b, M, "M", dx=-6, dy=7, groesse=6.4)
    t.append(txt(222.0, 40.0, "Anteil vom Ganzen:", SCHWARZ, 6.8, 700))
    t.append(txt(222.0, 54.0, "α : 360°", VIOLETT, 7.4, 700))
    t.append(txt(222.0, 70.0, "Bogen b vom Umfang", ORANGE, 6.6, 700))
    t.append(txt(222.0, 82.0, "Ausschnitt vom Kreis", GRUEN, 6.6, 700))
    t.append(txt(B / 2, H - 6, "Ausschnitt mit α = 100°: der Anteil 100 : 360 = 5 : 18 vom ganzen Kreis", SCHWARZ, 6.8, 700))
    return svg(B, H, t)


FIGUREN = [fig_abrollen, fig_einschachteln, fig_ausschnitte, fig_ringe, fig_ring, fig_sektor]

if __name__ == "__main__":
    zeilen = [fn() for fn in FIGUREN]
    pfad = pathlib.Path(__file__).parent / "kr-figuren.txt"
    pfad.write_text("\n".join(zeilen) + "\n", encoding="utf-8")
    print(f"{len(zeilen)} Figuren geschrieben")
