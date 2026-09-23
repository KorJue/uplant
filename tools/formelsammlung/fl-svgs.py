#!/usr/bin/env python3
"""Erzeugt die SVG-Figuren der Formelsammlung „Flächeninhalte“.

Jede Figur wird gerechnet, nicht gezeichnet: Die Eckpunkte kommen aus denselben Maßen, die im
Text daneben stehen (g = 6 cm, h = 4 cm …), umgerechnet mit einem festen Maßstab. Dadurch kann
keine Skizze etwas anderes behaupten als die Formel. Wo eine Figur eine Flächengleichheit zeigt,
rechnet dieses Skript sie zusätzlich nach (Gaußsche Trapezformel) und bricht ab, wenn sie nicht
stimmt — und tf_kopf.pruefe_im_bild schlägt an, sobald etwas aus der Fläche ragt.

    python3 fl-svgs.py      schreibt fl-figuren.txt (eine Zeichnung je Zeile)
"""
import math
import pathlib

from tf_kopf import (BLAU, GRUEN, ORANGE, ROT, VIOLETT, GRAU, SCHWARZ,
                     de, f, lin, polyline, pruefe_im_bild, setze_flaeche, svg, txt)


class Bild:
    """Rechnet Zentimeter in Zeichenpunkte um. Nullpunkt links unten, y nach oben — wie im
    Heft und wie auf der Lernseite."""

    def __init__(self, ox, oy, skala):
        self.ox, self.oy, self.s = ox, oy, skala

    def __call__(self, p):
        return (self.ox + p[0] * self.s, self.oy - p[1] * self.s)


def flaeche(punkte):
    """Gaußsche Trapezformel — zur Selbstkontrolle der Figuren."""
    s = 0.0
    for i, a in enumerate(punkte):
        b = punkte[(i + 1) % len(punkte)]
        s += a[0] * b[1] - b[0] * a[1]
    return abs(s) / 2


def poly(bild, punkte, rand, fuell="none", deckung=0.16, breite=1.4, strich=None):
    q = [bild(p) for p in punkte]
    for x, y in q:
        pruefe_im_bild(x, y, "Vieleck")
    d = f' stroke-dasharray="{strich}"' if strich else ""
    pts = " ".join(f"{f(x)},{f(y)}" for x, y in q)
    return (f'<polygon points="{pts}" fill="{fuell}" fill-opacity="{f(deckung)}" stroke="{rand}" '
            f'stroke-width="{f(breite)}" stroke-linejoin="round"{d}/>')


def strecke(bild, a, b, farbe, breite=1.4, strich=None):
    return lin(bild(a), bild(b), farbe, breite, strich)


def punkt(bild, p, name, farbe=SCHWARZ, dx=0.0, dy=-4.5, groesse=7.0):
    x, y = bild(p)
    return [f'<circle cx="{f(x)}" cy="{f(y)}" r="1.9" fill="{farbe}"/>',
            txt(x + dx, y + dy, name, farbe, groesse, 700)]


def rechter_winkel(bild, v, p, q, farbe=VIOLETT, s=6.0):
    """Das Kästchen am rechten Winkel bei v, ausgerichtet auf p und q (in Zeichenpunkten)."""
    V, P, Q = bild(v), bild(p), bild(q)

    def richtung(z):
        dx, dy = z[0] - V[0], z[1] - V[1]
        laenge = math.hypot(dx, dy) or 1.0
        return (dx / laenge * s, dy / laenge * s)
    u, w = richtung(P), richtung(Q)
    return polyline([(V[0] + u[0], V[1] + u[1]), (V[0] + u[0] + w[0], V[1] + u[1] + w[1]),
                     (V[0] + w[0], V[1] + w[1])], farbe, 1.0)


def pfeil(von, bis, farbe, breite=1.1):
    """Ein Bewegungspfeil in Zeichenpunkten."""
    dx, dy = bis[0] - von[0], bis[1] - von[1]
    laenge = math.hypot(dx, dy)
    ux, uy = dx / laenge, dy / laenge
    spitze = [(bis[0] - 5 * ux + 2.6 * uy, bis[1] - 5 * uy - 2.6 * ux), bis,
              (bis[0] - 5 * ux - 2.6 * uy, bis[1] - 5 * uy + 2.6 * ux)]
    return [lin(von, bis, farbe, breite), polyline(spitze, farbe, breite)]


def mass(bild, a, b, text, farbe, dx=0.0, dy=0.0, groesse=6.9):
    x, y = bild(((a[0] + b[0]) / 2, (a[1] + b[1]) / 2))
    return txt(x + dx, y + dy, text, farbe, groesse, 700, halo=True)


def dreh(p, m, winkel):
    co, si = math.cos(winkel), math.sin(winkel)
    dx, dy = p[0] - m[0], p[1] - m[1]
    return (m[0] + dx * co - dy * si, m[1] + dx * si + dy * co)


def tiefstellen(zeichnung, *namen):
    """Aus „h_b“ wird h mit tiefgestelltem b. Erst in der fertigen Zeichnung ersetzt: txt()
    schätzt die Textbreite aus der Zeichenzahl und würde das Markup mitzählen."""
    for n in namen:
        grund, index = n.split("_")
        zeichnung = zeichnung.replace(n, f'{grund}<tspan dy="1.8" font-size="72%">{index}</tspan><tspan dy="-1.8">​</tspan>')
    return zeichnung


def gleich(x, soll, was):
    assert abs(x - soll) < 1e-9, f"{was}: {x} statt {soll}"


# ---------- Figur 1: Scherung — die Höhe bleibt, die schräge Seite wächst ----------

def fig_scherung():
    B, H = 300.0, 170.0
    setze_flaeche(B, H)
    g, h, s = 6.0, 4.0, 2.0
    b = Bild(40.0, 128.0, 26.0)
    A, Bp, C, D = (0, 0), (g, 0), (g + s, h), (s, h)
    R1, R2 = (0, h), (g, h)
    gleich(flaeche([A, Bp, C, D]), g * h, "Scherung")
    t = [poly(b, [A, (s, h), R1], ORANGE, ORANGE, 0.22, 0.8),          # fällt links weg
         poly(b, [Bp, C, R2], GRUEN, GRUEN, 0.22, 0.8),                # kommt rechts dazu
         poly(b, [A, Bp, R2, R1], GRAU, breite=1.0, strich="4 3"),
         poly(b, [A, Bp, C, D], BLAU, BLAU, 0.08, 1.6),
         strecke(b, A, Bp, BLAU, 2.4),
         strecke(b, (s, 0), D, VIOLETT, 1.4, "4 3"),
         rechter_winkel(b, (s, 0), (s + 1, 0), D),
         strecke(b, A, D, ORANGE, 2.0),
         mass(b, A, Bp, f"g = {de(g)} cm", BLAU, 0, 12),
         mass(b, (s, 0), D, f"h = {de(h)} cm", VIOLETT, 22, 3),
         mass(b, A, D, "b", ORANGE, -9, 0, 7.6)]
    t += punkt(b, A, "A", dx=-6, dy=9) + punkt(b, Bp, "B", dx=6, dy=9)
    t += punkt(b, C, "C", dx=6, dy=-3) + punkt(b, D, "D", dx=-6, dy=-3)
    t.append(txt(B / 2, H - 5, f"A = g · h = {de(g * h)} cm² — bei jedem Versatz; nur b wird länger", SCHWARZ, 7.2, 700))
    return svg(B, H, t)


# ---------- Figur 2: Dreieck — ergänzen zum Rechteck ----------

def fig_dreieck():
    B, H = 300.0, 176.0
    setze_flaeche(B, H)
    g, h, cx = 7.0, 4.0, 2.0
    b = Bild(52.0, 132.0, 28.0)
    A, Bp, C = (0, 0), (g, 0), (cx, h)
    R1, R2, F = (0, h), (g, h), (cx, 0)
    ML, MR = ((A[0] + C[0]) / 2, h / 2), ((Bp[0] + C[0]) / 2, h / 2)
    rest_l, rest_r = [A, C, R1], [Bp, R2, C]
    # Die halbe Drehung um M₁ bzw. M₂ legt jedes Reststück genau auf seinen Dreiecksteil.
    for rest, m, teil in ((rest_l, ML, [A, F, C]), (rest_r, MR, [F, Bp, C])):
        gedreht = [dreh(p, m, math.pi) for p in rest]
        gleich(flaeche(gedreht), flaeche(teil), "Dreieck: Reststück gegen Dreiecksteil")
    gleich(flaeche(rest_l) + flaeche(rest_r), flaeche([A, Bp, C]), "Dreieck: Reststücke")
    t = [poly(b, [A, Bp, R2, R1], GRAU, breite=1.0, strich="4 3"),
         poly(b, rest_l, ORANGE, ORANGE, 0.24, 1.0),
         poly(b, rest_r, ORANGE, ORANGE, 0.24, 1.0),
         poly(b, [A, Bp, C], BLAU, BLAU, 0.10, 1.6),
         strecke(b, A, Bp, BLAU, 2.4),
         strecke(b, F, C, VIOLETT, 1.4, "4 3"),
         rechter_winkel(b, F, (cx + 1, 0), C),
         mass(b, A, Bp, f"g = {de(g)} cm", BLAU, 0, 12),
         mass(b, F, C, f"h = {de(h)} cm", VIOLETT, 22, 8)]
    t += punkt(b, ML, "M₁", ORANGE, -9, -2) + punkt(b, MR, "M₂", ORANGE, 9, -2)
    t += punkt(b, A, "A", dx=-6, dy=9) + punkt(b, Bp, "B", dx=6, dy=9) + punkt(b, C, "C", dy=-4)
    t.append(txt(B / 2, H - 5, "Reststücke (orange) = Dreieck  ⟹  2 · A = g · h", SCHWARZ, 7.2, 700))
    return svg(B, H, t)


# ---------- Figur 3: Welche Höhe gehört zu welcher Seite — auch außerhalb ----------

def fig_hoehen():
    B, H = 300.0, 176.0
    setze_flaeche(B, H)
    A, Bp, C = (0.0, 0.0), (8.0, 0.0), (3.0, 2.5)          # dasselbe Dreieck wie auf der Seite
    b = Bild(46.0, 132.0, 26.0)
    # Winkel bei C stumpf: Skalarprodukt CA · CB negativ.
    assert (A[0] - C[0]) * (Bp[0] - C[0]) + (A[1] - C[1]) * (Bp[1] - C[1]) < 0, "C ist nicht stumpf"
    ux, uy = A[0] - C[0], A[1] - C[1]
    lam = ((Bp[0] - C[0]) * ux + (Bp[1] - C[1]) * uy) / (ux * ux + uy * uy)
    assert lam < 0, "der Fußpunkt der Höhe auf b liegt nicht außerhalb"
    L = (C[0] + lam * ux, C[1] + lam * uy)
    weiter = (C[0] + (lam - 0.12) * ux, C[1] + (lam - 0.12) * uy)
    t = [poly(b, [A, Bp, C], GRAU, BLAU, 0.08, 1.2),
         strecke(b, C, weiter, GRAU, 1.0, "3 3"),
         strecke(b, A, C, BLAU, 2.2),
         strecke(b, Bp, L, VIOLETT, 1.4, "4 3"),
         rechter_winkel(b, L, A, Bp),
         strecke(b, (C[0], 0), C, VIOLETT, 1.0, "2 2"),
         mass(b, A, C, "b", BLAU, -8, -2, 7.6),
         mass(b, Bp, L, "h_b", VIOLETT, 12, 0),
         mass(b, (C[0], 0), C, "h_c", VIOLETT, 9, 6, 6.4)]
    t += punkt(b, A, "A", dx=-6, dy=9) + punkt(b, Bp, "B", dx=6, dy=9) + punkt(b, C, "C", dx=-4, dy=-5)
    t.append(txt(B / 2, H - 5, "Winkel bei C stumpf: der Fußpunkt von h_b liegt außerhalb von b", SCHWARZ, 7.0, 700))
    return tiefstellen(svg(B, H, t), "h_b", "h_c")


# ---------- Figur 4: Parallelogramm — abschneiden und umlegen ----------

def fig_parallelogramm():
    B, H = 300.0, 156.0
    setze_flaeche(B, H)
    g, h, s = 6.0, 3.5, 2.0
    b = Bild(40.0, 112.0, 26.0)
    A, Bp, C, D, F = (0, 0), (g, 0), (g + s, h), (s, h), (s, 0)
    schnitt = [A, F, D]
    umgelegt = [(p[0] + g, p[1]) for p in schnitt]
    gleich(flaeche([F, Bp, C, D]) + flaeche(umgelegt), g * h, "Parallelogramm")
    t = [poly(b, schnitt, GRUEN, GRUEN, 0.10, 1.0, "3 3"),
         poly(b, [F, Bp, C, D], BLAU, BLAU, 0.10, 1.6),
         poly(b, umgelegt, GRUEN, GRUEN, 0.26, 1.4),
         strecke(b, A, Bp, BLAU, 2.4),
         strecke(b, F, D, VIOLETT, 1.4, "4 3"),
         rechter_winkel(b, F, Bp, D),
         mass(b, A, Bp, f"g = {de(g)} cm", BLAU, -14, 12),
         mass(b, F, D, f"h = {de(h, 1)} cm", VIOLETT, 26, 6)]
    t += pfeil(b((s / 2, h / 3)), b((g + s / 2 - 0.35, h / 3)), GRUEN)
    t += punkt(b, A, "A", dx=-6, dy=9) + punkt(b, Bp, "B", dx=0, dy=10)
    t += punkt(b, C, "C", dx=6, dy=-3) + punkt(b, D, "D", dx=-6, dy=-3)
    t.append(txt(B / 2, H - 5, f"Rechteck g · h = {de(g)} cm · {de(h, 1)} cm = {de(g * h)} cm²", SCHWARZ, 7.2, 700))
    return svg(B, H, t)


# ---------- Figur 5: Trapez, erster Weg — an der Mittellinie abtrennen ----------

def fig_mittellinie():
    B, H = 300.0, 176.0
    setze_flaeche(B, H)
    a, c, h, v = 9.0, 5.0, 4.0, 2.0
    b = Bild(36.0, 132.0, 25.0)
    A, Bp, C, D = (0, 0), (a, 0), (v + c, h), (v, h)
    P, Q = (v / 2, h / 2), ((a + v + c) / 2, h / 2)
    m = Q[0] - P[0]
    gleich(m, (a + c) / 2, "Mittellinie")
    RU1, RU2, RO1, RO2 = (P[0], 0), (Q[0], 0), (P[0], h), (Q[0], h)
    ecke_l, ecke_r = [A, RU1, P], [Bp, Q, RU2]
    neu_l = [dreh(p, P, math.pi) for p in ecke_l]
    neu_r = [dreh(p, Q, math.pi) for p in ecke_r]
    # Die gedrehten Ecken füllen genau die Lücken oben: Das Rechteck m · h entsteht.
    gleich(flaeche([A, Bp, C, D]), m * h, "Mittellinie: Trapez gegen Rechteck")
    gleich(flaeche(neu_l), flaeche([RO1, D, P]), "Mittellinie: linke Lücke")
    t = [poly(b, [RU1, RU2, RO2, RO1], GRAU, breite=1.0, strich="4 3"),
         poly(b, [RU1, RU2, Q, C, D, P], BLAU, BLAU, 0.10, 1.6),
         poly(b, ecke_l, ORANGE, ORANGE, 0.26, 1.0),
         poly(b, ecke_r, ORANGE, ORANGE, 0.26, 1.0),
         poly(b, neu_l, ORANGE, ORANGE, 0.12, 1.0, "3 2"),
         poly(b, neu_r, ORANGE, ORANGE, 0.12, 1.0, "3 2"),
         strecke(b, P, Q, GRUEN, 2.0, "6 3"),
         strecke(b, A, Bp, BLAU, 2.2),
         strecke(b, D, C, BLAU, 2.2),
         strecke(b, RU1, RO1, VIOLETT, 1.2, "4 3"),
         mass(b, P, Q, f"m = {de(m)} cm", GRUEN, 0, -5),
         mass(b, A, Bp, f"a = {de(a)} cm", BLAU, 0, 12),
         mass(b, D, C, f"c = {de(c)} cm", BLAU, 0, -6),
         mass(b, RU1, (RU1[0], h / 2), f"h = {de(h)} cm", VIOLETT, 22, 4)]
    t += punkt(b, P, "P", GRUEN, -7, -2) + punkt(b, Q, "Q", GRUEN, 7, -2)
    t.append(txt(B / 2, H - 5, "Ecken um P und Q drehen: aus dem Trapez wird das Rechteck m · h", SCHWARZ, 7.0, 700))
    return svg(B, H, t)


# ---------- Figur 6: Trapez, zweiter Weg — verdoppeln ----------

def fig_verdoppeln():
    B, H = 300.0, 150.0
    setze_flaeche(B, H)
    a, c, h, v = 7.0, 3.0, 3.0, 1.2
    b = Bild(34.0, 108.0, 23.0)
    A, Bp, C, D = (0, 0), (a, 0), (v + c, h), (v, h)
    M = ((Bp[0] + C[0]) / 2, h / 2)
    kopie = [dreh(p, M, math.pi) for p in (A, Bp, C, D)]
    ziel = [(0, 0), (a + c, 0), (v + c + a, h), (v, h)]
    gleich(flaeche([A, Bp, C, D]) + flaeche(kopie), flaeche(ziel), "Verdoppeln")
    gleich(flaeche(ziel), (a + c) * h, "Verdoppeln: Parallelogramm")
    t = [poly(b, kopie, ORANGE, ORANGE, 0.22, 1.2),
         poly(b, [A, Bp, C, D], BLAU, BLAU, 0.10, 1.6),
         strecke(b, A, (a + c, 0), BLAU, 2.2),
         strecke(b, (v, 0), D, VIOLETT, 1.2, "4 3"),
         rechter_winkel(b, (v, 0), (v + 1, 0), D),
         mass(b, A, Bp, f"a = {de(a)} cm", BLAU, 0, 12),
         mass(b, Bp, (a + c, 0), f"c = {de(c)} cm", ORANGE, 0, 12),
         mass(b, D, C, "c", BLAU, 0, -6),
         mass(b, (v, 0), D, "h", VIOLETT, 8, 3, 7.4)]
    t += punkt(b, M, "M", SCHWARZ, 8, 2)
    t.append(txt(B / 2, H - 5, f"Parallelogramm mit Grundseite a + c = {de(a + c)} cm: 2 · A = (a + c) · h", SCHWARZ, 7.0, 700))
    return svg(B, H, t)


# ---------- Figur 7: eine Formel, drei Figuren ----------

def fig_sonderfaelle():
    B, H = 300.0, 104.0
    setze_flaeche(B, H)
    t = []
    a, h, v = 3.0, 2.0, 0.8
    for i, (c, name, formel) in enumerate([(0.0, "c = 0: Dreieck", "½ · a · h"),
                                            (1.6, "0 &lt; c &lt; a: Trapez", "½ · (a + c) · h"),
                                            (3.0, "c = a: Parallelogramm", "a · h")]):
        b = Bild(18.0 + i * 98.0, 62.0, 18.0)
        ecken = [(0, 0), (a, 0), (v + c, h), (v, h)] if c > 0 else [(0, 0), (a, 0), (v, h)]
        t.append(poly(b, ecken, BLAU, BLAU, 0.10, 1.4))
        t.append(strecke(b, (0, 0), (a, 0), BLAU, 2.0))
        t.append(strecke(b, (v, 0), (v, h), VIOLETT, 1.0, "3 2"))
        x0 = b((a / 2 + 0.4, 0))[0]
        t.append(txt(x0, 76.0, name, SCHWARZ, 6.8, 700))
        t.append(txt(x0, 88.0, "A = " + formel, GRUEN, 7.2, 700))
    return svg(B, H, t)


FIGUREN = [fig_scherung, fig_dreieck, fig_hoehen, fig_parallelogramm,
           fig_mittellinie, fig_verdoppeln, fig_sonderfaelle]

if __name__ == "__main__":
    zeilen = [fn() for fn in FIGUREN]
    pfad = pathlib.Path(__file__).parent / "fl-figuren.txt"
    pfad.write_text("\n".join(zeilen) + "\n", encoding="utf-8")
    print(f"{len(zeilen)} Figuren geschrieben")
