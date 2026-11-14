#!/usr/bin/env python3
"""Erzeugt die SVG-Figuren der Formelsammlung „Zusammengesetzte Figuren“ (Klasse 8, Geometrie, Thema 6).

Jede Figur wird gerechnet, nicht gezeichnet: Punkte kommen aus denselben Maßen, die im Text
daneben stehen, umgerechnet mit einem festen Maßstab. Es sind die drei Beispiele der Lernseite mit
ihren Anfangsmaßen. Das Skript rechnet mit, was die Formelsammlung behauptet — Teilflächen, Summe
und Umfang (Gaußsche Trapezformel und Sehnensumme, Bögen fein unterteilt) — und bricht ab, wenn
eine Zahl nicht stimmt. tf_kopf.pruefe_im_bild schlägt an, sobald etwas aus der Fläche ragt.

    python3 zf-svgs.py      schreibt zf-figuren.txt (eine Zeichnung je Zeile)
"""
import math
import pathlib

from tf_kopf import (BLAU, GRUEN, ORANGE, ROT, VIOLETT, GRAU, SCHWARZ,
                     f, lin, polyline, pruefe_im_bild, setze_flaeche, svg, txt)

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


def laenge(punkte):
    return sum(math.hypot(b[0] - a[0], b[1] - a[1]) for a, b in zip(punkte, punkte[1:]))


# 3° je Sehne: im Druck so glatt wie ein echter Bogen, und das PDF bleibt klein. Für die
# Selbstkontrolle der Flächen und Längen wird feiner unterteilt (FEIN).
GROB = math.pi / 60
FEIN = math.pi / 3600


def bogen_punkte(m, r, g0, g1, schritt=GROB):
    """Punkte eines Bogens um m, Winkel in Grad; g1 < g0 läuft im Uhrzeigersinn."""
    a0, a1 = math.radians(g0), math.radians(g1)
    n = max(2, math.ceil(abs(a1 - a0) / schritt))
    return [(m[0] + r * math.cos(a0 + (a1 - a0) * i / n), m[1] + r * math.sin(a0 + (a1 - a0) * i / n)) for i in range(n + 1)]


def schieb(punkte, dx, dy=0.0):
    return [(x + dx, y + dy) for x, y in punkte]


def poly(bild, punkte, rand, fuell="none", deckung=0.2, breite=0.9, strich=None):
    q = [bild(p) for p in punkte]
    for x, y in q:
        pruefe_im_bild(x, y, "Vieleck")
    d = f' stroke-dasharray="{strich}"' if strich else ""
    pts = " ".join(f"{f(x)},{f(y)}" for x, y in q)
    return (f'<polygon points="{pts}" fill="{fuell}" fill-opacity="{f(deckung)}" stroke="{rand}" '
            f'stroke-width="{f(breite)}" stroke-linejoin="round"{d}/>')


def zug(bild, punkte, farbe, breite=1.4, strich=None):
    return polyline([bild(p) for p in punkte], farbe, breite, strich)


def beschrift(bild, p, text, farbe, dx=0.0, dy=0.0, groesse=6.9, anker="middle"):
    x, y = bild(p)
    return txt(x + dx, y + dy, text, farbe, groesse, 700, anker, halo=True)


def masslinie(bild, p, q, text, versatz, farbe=BLAU, groesse=6.4, bei=0.5):
    """Maßlinie neben der Strecke p→q, um `versatz` Zeichenpunkte nach links (in Laufrichtung;
    negativ: nach rechts) herausgerückt, mit Endstrichen und der Beschriftung außen daneben."""
    (x1, y1), (x2, y2) = bild(p), bild(q)
    l = math.hypot(x2 - x1, y2 - y1)
    nx, ny = (y2 - y1) / l, -(x2 - x1) / l
    a = (x1 + nx * versatz, y1 + ny * versatz)
    c = (x2 + nx * versatz, y2 + ny * versatz)
    t = [lin(a, c, farbe, 0.6)]
    for e in (a, c):
        t.append(lin((e[0] - nx * 1.8, e[1] - ny * 1.8), (e[0] + nx * 1.8, e[1] + ny * 1.8), farbe, 0.6))
    s = -1 if versatz < 0 else 1
    px, py = nx * s, ny * s
    mx, my = a[0] + (c[0] - a[0]) * bei, a[1] + (c[1] - a[1]) * bei
    anker = "middle" if abs(px) <= 0.4 else ("start" if px > 0 else "end")
    t.append(txt(mx + px * 3, my + py * 5.4 + 2.2, text, farbe, groesse, 700, anker, halo=True))
    return t


def gleich(x, soll, was, tol=1e-6):
    assert abs(x - soll) <= tol * max(1.0, abs(soll)), f"{was}: {x} statt {soll}"


# ---------- Beispiel 1: Rechteck mit zwei Viertelkreisen (r = 4 cm, b = 6 cm) ----------

R1, B1 = 4.0, 6.0


def viertel_figur(schritt=GROB):
    """Die drei Teile und der Rand, in Zentimetern."""
    r, b = R1, B1
    bogen_l = bogen_punkte((r, r), r, 180, 270, schritt)      # (0 | r) → (r | 0)
    bogen_r = bogen_punkte((r + b, 0), r, 0, 90, schritt)     # (2r + b | 0) → (r + b | r)
    links = [(r, r)] + bogen_l
    mitte = [(r, 0), (r + b, 0), (r + b, r), (r, r)]
    rechts = [(r + b, 0)] + bogen_r
    rand = bogen_l + [(r + b, 0)] + bogen_r + [(r, r), (0, r)]
    return links, mitte, rechts, rand


def pruefe_beispiel_1():
    r, b = R1, B1
    links, mitte, rechts, rand = viertel_figur(FEIN)
    gleich(flaeche(links), PI * r * r / 4, "Beispiel 1, Viertelkreis links")
    gleich(flaeche(mitte), b * r, "Beispiel 1, Rechteck")
    gleich(flaeche(rechts), PI * r * r / 4, "Beispiel 1, Viertelkreis rechts")
    gleich(flaeche(rand), PI * r * r / 2 + b * r, "Beispiel 1, ganze Figur")
    gleich(laenge(rand), PI * r + 2 * (b + r), "Beispiel 1, Umfang")
    # Die Zahlen, die in der Formelsammlung stehen.
    assert f"{PI * r * r / 4:.2f}" == "12.57" and f"{PI * r * r / 2 + b * r:.2f}" == "49.13"
    assert f"{PI * r / 2:.2f}" == "6.28" and f"{PI * r + 2 * (b + r):.2f}" == "32.57"


# Figur 1: auseinandergezogen — drei Teile, die man kennt.
def fig_zerlegt():
    pruefe_beispiel_1()
    B, H = 250.0, 92.0
    setze_flaeche(B, H)
    r, b, luecke = R1, B1, 0.9
    s = 13.4
    bild = Bild(12.0, H - 14.0, s)
    links, mitte, rechts, _ = viertel_figur()
    mitte, rechts = schieb(mitte, luecke), schieb(rechts, 2 * luecke)
    k = 4 * r / (3 * PI)
    t = [poly(bild, links, GRUEN, GRUEN), poly(bild, mitte, GRUEN, GRUEN), poly(bild, rechts, GRUEN, GRUEN)]
    t.append(beschrift(bild, (r - k, r - k), "①", GRUEN, 0, 2.6, 8.4))
    t.append(beschrift(bild, (r + luecke + b / 2, r / 2), "②", GRUEN, 0, 2.6, 8.4))
    t.append(beschrift(bild, (r + 2 * luecke + b + k, k), "③", GRUEN, 0, 2.6, 8.4))
    t += masslinie(bild, (0, r), (r, r), "r = 4 cm", 4.5)
    t += masslinie(bild, (r + luecke, r), (r + luecke + b, r), "b = 6 cm", 4.5)
    t += masslinie(bild, (r + 2 * luecke + b, 0), (2 * r + 2 * luecke + b, 0), "r = 4 cm", -4.5)
    return svg(B, H, t)


# Figur 2: zusammengesetzt — der Rand orange, die Schnittkanten rot gestrichelt.
def fig_rand():
    B, H = 250.0, 92.0
    setze_flaeche(B, H)
    r, b = R1, B1
    s = 13.4
    bild = Bild(34.0, H - 14.0, s)
    _, _, _, rand = viertel_figur()
    t = [poly(bild, rand, GRUEN, GRUEN, 0.16, 0.4)]
    t.append(zug(bild, rand + [rand[0]], ORANGE, 2.2))
    for x in (r, r + b):
        t.append(zug(bild, [(x, 0), (x, r)], ROT, 1.0, "3 2"))
    t.append(beschrift(bild, (r, r / 2), "zählt nicht", ROT, 3.5, 2.2, 6.0, "start"))
    t.append(beschrift(bild, (r - 0.82 * r * math.sqrt(0.5), r - 0.82 * r * math.sqrt(0.5)), "①", ORANGE, 0, 2.6, 8.0))
    t.append(beschrift(bild, (r + b / 2, 0.55), "②", ORANGE, 0, 2.6, 8.0))
    t.append(beschrift(bild, (r + b + 0.82 * r * math.sqrt(0.5), 0.82 * r * math.sqrt(0.5)), "③", ORANGE, 0, 2.6, 8.0))
    t.append(beschrift(bild, (r + b / 2, r - 0.55), "④", ORANGE, 0, 2.6, 8.0))
    x0, y0 = bild((0, r))
    t.append(f'<circle cx="{f(x0)}" cy="{f(y0)}" r="2" fill="{SCHWARZ}"/>')
    t.append(txt(x0 - 4, y0 + 2.2, "Start", SCHWARZ, 6.2, 700, "end"))
    t += masslinie(bild, (0, r), (r, r), "r = 4 cm", 4.5)
    t += masslinie(bild, (r, r), (r + b, r), "b = 6 cm", 4.5)
    return svg(B, H, t)


# ---------- Beispiel 2: Rechteck, Dreieck und Kreisausschnitt (b = 4, h = 4, c = 3, s = 5, α = 60°) ----------

def fig_dreiteile():
    b, h, c, s_, alpha = 4.0, 4.0, 3.0, 5.0, 60.0
    gleich(c * c + h * h, s_ * s_, "Beispiel 2, das Dreieck 3 : 4 : 5")
    P_, Q, T = (b, h), (b, 0.0), (b + c, h)
    w0 = math.degrees(math.atan2(Q[1] - T[1], Q[0] - T[0]))
    fein = bogen_punkte(T, s_, w0, w0 + alpha, FEIN)
    rand_fein = [(0.0, 0.0), Q] + fein + [T, P_, (0.0, h)]
    A1, A2, A3 = b * h, c * h / 2, alpha / 360 * PI * s_ * s_
    gleich(flaeche([T] + fein), A3, "Beispiel 2, Kreisausschnitt")
    gleich(flaeche(rand_fein), A1 + A2 + A3, "Beispiel 2, ganze Figur")
    G, Bg = 2 * b + h + c + s_, alpha / 360 * 2 * PI * s_
    gleich(laenge(rand_fein + [rand_fein[0]]), G + Bg, "Beispiel 2, Umfang")
    assert f"{A3:.2f}" == "13.09" and f"{A1 + A2 + A3:.2f}" == "35.09" and f"{Bg:.2f}" == "5.24" and f"{G + Bg:.2f}" == "25.24"

    B, H = 250.0, 116.0
    setze_flaeche(B, H)
    s = 15.5
    bild = Bild(46.0, H - 26.0, s)
    bog = bogen_punkte(T, s_, w0, w0 + alpha)
    E = bog[-1]
    wm = math.radians(w0 + alpha / 2)
    t = [poly(bild, [(0, 0), Q, P_, (0, h)], GRUEN, GRUEN), poly(bild, [Q, T, P_], GRUEN, GRUEN), poly(bild, [T] + bog, GRUEN, GRUEN)]
    t.append(zug(bild, [(0, 0), Q] + bog + [T, P_, (0, h), (0, 0)], SCHWARZ, 1.4))
    t.append(zug(bild, [Q, P_], GRAU, 0.8, "3 2"))
    t.append(zug(bild, [Q, T], GRAU, 0.8, "3 2"))
    t.append(poly(bild, [T] + bogen_punkte(T, 0.6, w0, w0 + alpha), VIOLETT, VIOLETT, 0.25, 0.7))
    t.append(beschrift(bild, (T[0] + 1.5 * math.cos(wm), T[1] + 1.5 * math.sin(wm)), "α = 60°", VIOLETT, 0, 2.2, 6.2))
    t.append(beschrift(bild, (b / 2, h / 2), "①", GRUEN, 0, 2.6, 8.4))
    t.append(beschrift(bild, (b + c / 3, 2 * h / 3), "②", GRUEN, 0, 2.6, 8.4))
    t.append(beschrift(bild, (T[0] + 0.72 * s_ * math.cos(wm), T[1] + 0.72 * s_ * math.sin(wm)), "③", GRUEN, 0, 2.6, 8.4))
    t += masslinie(bild, (0, 0), Q, "b = 4 cm", -4.5)
    t += masslinie(bild, (0, 0), (0, h), "h = 4 cm", 4.5, VIOLETT)
    t += masslinie(bild, P_, T, "c = 3 cm", 4.5)
    t += masslinie(bild, T, E, "s = 5 cm (gemessen)", 4.5)
    return svg(B, H, t)


# ---------- Beispiel 3: ergänzen und abziehen (b = 4, h = 4, a = 1 — also R = 2, r = 1) ----------

def fig_abziehen():
    b, h, a = 4.0, 4.0, 1.0
    R, r = h / 2, h / 2 - a
    N, Z = (0.0, R), (b, R)

    def figur(schritt):
        kerbe = bogen_punkte(N, r, 90, -90, schritt)       # (0 | R + r) → (r | R) → (0 | R − r)
        gross = bogen_punkte(Z, R, -90, 90, schritt)       # (b | 0) → (b + R | R) → (b | h)
        rechteck = [(0.0, 0.0), (b, 0.0), (b, h), (0.0, h)] + kerbe
        stueck = bogen_punkte(N, r, -90, 90, schritt)
        rand = [(0.0, 0.0)] + gross + [(0.0, h)] + kerbe
        return rechteck, gross, stueck, rand, kerbe

    rechteck, gross, stueck, rand, _ = figur(FEIN)
    A1, A2, A3 = b * h, PI * R * R / 2, PI * r * r / 2
    gleich(flaeche(rechteck), A1 - A3, "Beispiel 3, Rechteck mit Lücke")
    gleich(flaeche(gross), A2, "Beispiel 3, Halbkreis")
    gleich(flaeche(stueck), A3, "Beispiel 3, ausgeschnittener Halbkreis")
    gleich(flaeche(rand), A1 + A2 - A3, "Beispiel 3, ganze Figur")
    U = 2 * b + 2 * a + PI * R + PI * r
    gleich(laenge(rand + [rand[0]]), U, "Beispiel 3, Umfang")
    ohne = 2 * b + h + PI * R
    assert f"{A1 + A2 - A3:.2f}" == "20.71" and f"{U:.2f}" == "19.42" and f"{ohne:.2f}" == "18.28" and U > ohne

    B, H = 250.0, 98.0
    setze_flaeche(B, H)
    s = 17.0
    bild = Bild(92.0, H - 18.0, s)
    rechteck, gross, stueck, rand, kerbe = figur(GROB)
    weg = -(r + 1.1)
    t = [poly(bild, rand, GRUEN, GRUEN, 0.2, 0.4), zug(bild, rand + [rand[0]], SCHWARZ, 1.4)]
    t.append(zug(bild, [(b, 0), (b, h)], GRAU, 0.8, "3 2"))
    t.append(zug(bild, kerbe, ORANGE, 2.2))
    t.append(poly(bild, schieb(stueck, weg), ORANGE, ORANGE, 0.3, 1.0))
    t.append(beschrift(bild, (weg + 4 * r / (3 * PI), R), "③", ORANGE, 0, 2.6, 8.0))
    t.append(beschrift(bild, ((r + b) / 2, R), "①", GRUEN, 0, 2.6, 8.4))
    t.append(beschrift(bild, (b + 4 * R / (3 * PI), R), "②", GRUEN, 0, 2.6, 8.4))
    t += masslinie(bild, (0, 0), (b, 0), "b = 4 cm", -4.5)
    t += masslinie(bild, (b + R, 0), (b + R, h), "h = 4 cm", -4.5, VIOLETT)
    t += masslinie(bild, (0, h - a), (0, h), "a = 1 cm", 4.5)
    # Rechtsbündig am herausgenommenen Stück: Mittig darunter reichte das Wort bis an das Rechteck.
    t.append(txt(bild((weg + r, 0))[0], bild((0, R - r))[1] + 9, "herausgenommen", ORANGE, 6.0, 700, "end"))
    return svg(B, H, t)


FIGUREN = [fig_zerlegt, fig_rand, fig_abziehen, fig_dreiteile]

if __name__ == "__main__":
    zeilen = [fn() for fn in FIGUREN]
    pfad = pathlib.Path(__file__).parent / "zf-figuren.txt"
    pfad.write_text("\n".join(zeilen) + "\n", encoding="utf-8")
    print(f"{len(zeilen)} Figuren geschrieben")
