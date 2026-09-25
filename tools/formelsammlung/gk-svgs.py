#!/usr/bin/env python3
"""Erzeugt die SVG-Figuren der Formelsammlung „Grundkonstruktionen und besondere Linien am Dreieck“.

Jedes Dreieck entsteht wie auf der Lernseite aus c, α und β; M, I, S und H werden gerechnet, und
das Skript prüft ihre Eigenschaften mit, bevor es zeichnet: MA = MB = MC, gleiche Abstände von I
zu allen Seiten, S teilt 2 : 1, H liegt auf allen Höhen, M–S–H im Verhältnis 1 : 2. Eine Skizze,
die etwas anderes zeigte als der Text daneben, bräche hier ab.

    python3 gk-svgs.py      schreibt gk-figuren.txt (eine Zeichnung je Zeile)
"""
import math
import pathlib

from tf_kopf import (BLAU, GRUEN, ORANGE, ROT, VIOLETT, GRAU, SCHWARZ,
                     f, kreis, lin, polyline, pruefe_im_bild, setze_flaeche, svg, txt)

RAD = math.pi / 180


# ---------- Geometrie in Zentimetern ----------

def dreieck(c, alpha, beta):
    ta, tb = math.tan(alpha * RAD), math.tan(beta * RAD)
    if abs(alpha - 90) < 1e-9:
        x, y = 0.0, c * tb
    elif abs(beta - 90) < 1e-9:
        x, y = c, c * ta
    else:
        x = c * tb / (ta + tb)
        y = x * ta
    return (0.0, 0.0), (c, 0.0), (x, y)


def ab(p, q):
    return math.hypot(q[0] - p[0], q[1] - p[1])


def mitte(p, q):
    return ((p[0] + q[0]) / 2, (p[1] + q[1]) / 2)


def umkreis(A, B, C):
    d = 2 * (A[0] * (B[1] - C[1]) + B[0] * (C[1] - A[1]) + C[0] * (A[1] - B[1]))
    a2, b2, c2 = (A[0] ** 2 + A[1] ** 2), (B[0] ** 2 + B[1] ** 2), (C[0] ** 2 + C[1] ** 2)
    return ((a2 * (B[1] - C[1]) + b2 * (C[1] - A[1]) + c2 * (A[1] - B[1])) / d,
            (a2 * (C[0] - B[0]) + b2 * (A[0] - C[0]) + c2 * (B[0] - A[0])) / d)


def inkreis(A, B, C):
    a, b, c = ab(B, C), ab(C, A), ab(A, B)
    u = a + b + c
    return ((a * A[0] + b * B[0] + c * C[0]) / u, (a * A[1] + b * B[1] + c * C[1]) / u)


def schwer(A, B, C):
    return ((A[0] + B[0] + C[0]) / 3, (A[1] + B[1] + C[1]) / 3)


def hoehenschnitt(A, B, C):
    M = umkreis(A, B, C)
    return (A[0] + B[0] + C[0] - 2 * M[0], A[1] + B[1] + C[1] - 2 * M[1])


def lotfuss(P, Q, R):
    ux, uy = R[0] - Q[0], R[1] - Q[1]
    t = ((P[0] - Q[0]) * ux + (P[1] - Q[1]) * uy) / (ux * ux + uy * uy)
    return (Q[0] + t * ux, Q[1] + t * uy), t


def abstand_gerade(P, Q, R):
    return abs((R[0] - Q[0]) * (P[1] - Q[1]) - (R[1] - Q[1]) * (P[0] - Q[0])) / ab(Q, R)


def pruefe_punkte(A, B, C):
    """Die Sätze, die die Formelsammlung behauptet — an genau diesem Dreieck nachgerechnet."""
    M, I, S, H = umkreis(A, B, C), inkreis(A, B, C), schwer(A, B, C), hoehenschnitt(A, B, C)
    r = [ab(M, E) for E in (A, B, C)]
    assert max(r) - min(r) < 1e-9, "Umkreis: MA, MB, MC verschieden"
    d = [abstand_gerade(I, P, Q) for P, Q in ((A, B), (B, C), (C, A))]
    assert max(d) - min(d) < 1e-9, "Inkreis: Abstände zu den Seiten verschieden"
    Ma = mitte(B, C)
    assert abs(ab(A, S) - 2 * ab(S, Ma)) < 1e-9, "Schwerpunkt teilt nicht 2 : 1"
    for E, P, Q in ((A, B, C), (B, C, A), (C, A, B)):
        u, v = (H[0] - E[0], H[1] - E[1]), (Q[0] - P[0], Q[1] - P[1])
        assert abs(u[0] * v[0] + u[1] * v[1]) < 1e-9, "H liegt nicht auf einer Höhe"
    assert ab(S, (M[0] + (H[0] - M[0]) / 3, M[1] + (H[1] - M[1]) / 3)) < 1e-9, "Euler: S teilt MH nicht 1 : 2"
    return M, I, S, H


class Bild:
    """Zentimeter → Zeichenpunkte; Nullpunkt links unten, y nach oben wie im Heft."""

    def __init__(self, ox, oy, s):
        self.ox, self.oy, self.s = ox, oy, s

    def __call__(self, p):
        return (self.ox + p[0] * self.s, self.oy - p[1] * self.s)


def passend(punkte, B_, H_, rand=10.0, oben=10.0, unten=10.0):
    """Maßstab und Lage so, dass alle Punkte in die Fläche passen."""
    xs, ys = [p[0] for p in punkte], [p[1] for p in punkte]
    s = min((B_ - 2 * rand) / (max(xs) - min(xs)), (H_ - oben - unten) / (max(ys) - min(ys)))
    ox = rand + ((B_ - 2 * rand) - (max(xs) - min(xs)) * s) / 2 - min(xs) * s
    oy = H_ - unten + min(ys) * s
    return Bild(ox, oy, s)


def poly(bild, punkte, rand, fuell="none", deckung=0.1, breite=1.3):
    q = [bild(p) for p in punkte]
    for x, y in q:
        pruefe_im_bild(x, y, "Vieleck")
    pts = " ".join(f"{f(x)},{f(y)}" for x, y in q)
    return (f'<polygon points="{pts}" fill="{fuell}" fill-opacity="{f(deckung)}" stroke="{rand}" '
            f'stroke-width="{f(breite)}" stroke-linejoin="round"/>')


def punkt(bild, p, name, farbe=SCHWARZ, dx=0.0, dy=-4.0, groesse=6.8):
    x, y = bild(p)
    teile = [f'<circle cx="{f(x)}" cy="{f(y)}" r="1.7" fill="{farbe}"/>']
    if name:
        teile.append(txt(x + dx, y + dy, name, farbe, groesse, 700, halo=True))
    return teile


def strecke(bild, p, q, farbe, breite=1.2, strich=None):
    return lin(bild(p), bild(q), farbe, breite, strich)


def gerade(bild, p, u, lang, farbe, breite=1.0, strich=None):
    return strecke(bild, (p[0] - lang * u[0], p[1] - lang * u[1]), (p[0] + lang * u[0], p[1] + lang * u[1]), farbe, breite, strich)


def rw(bild, v, p, q, farbe, s=4.0):
    V, P, Q = bild(v), bild(p), bild(q)

    def r(z):
        dx, dy = z[0] - V[0], z[1] - V[1]
        l = math.hypot(dx, dy) or 1.0
        return (dx / l * s, dy / l * s)
    u, w = r(P), r(Q)
    return polyline([(V[0] + u[0], V[1] + u[1]), (V[0] + u[0] + w[0], V[1] + u[1] + w[1]), (V[0] + w[0], V[1] + w[1])], farbe, 0.9)


def txt_index(x, y, haupt, index, farbe, groesse=6.4):
    """„M“ mit tiefgestelltem „b“ — für b gibt es kein Unicode-Tiefzeichen. Die Breite wird am
    sichtbaren Text geschätzt, nicht am Markup."""
    breite = (len(haupt) + len(index) * 0.7) * groesse * 0.56
    pruefe_im_bild(x - breite / 2, y, f"Index {haupt}{index}")
    pruefe_im_bild(x + breite / 2, y, f"Index {haupt}{index}")
    return (f'<text x="{f(x)}" y="{f(y)}" fill="{farbe}" font-size="{f(groesse)}" font-weight="700" text-anchor="middle" '
            f'font-family="system-ui,Segoe UI,Helvetica,Arial,sans-serif">{haupt}'
            f'<tspan baseline-shift="sub" font-size="{f(groesse * 0.72)}">{index}</tspan></text>')


def ecken(bild, A, B, C):
    S = bild(schwer(A, B, C))
    t = []
    for p, n in ((A, "A"), (B, "B"), (C, "C")):
        q = bild(p)
        l = math.hypot(q[0] - S[0], q[1] - S[1]) or 1.0
        t += punkt(bild, p, n, SCHWARZ, (q[0] - S[0]) / l * 7, (q[1] - S[1]) / l * 7 + 2.4)
    return t


def einheits(u):
    l = math.hypot(*u)
    return (u[0] / l, u[1] / l)


# ---------- Figur 1: Mittelsenkrechte ----------

def fig_mittelsenkrechte():
    B_, H_ = 200.0, 118.0
    setze_flaeche(B_, H_)
    A, B = (0.0, 0.0), (6.0, 0.0)
    r = 4.0
    h = math.sqrt(r * r - 9)
    S1, S2, M = (3.0, h), (3.0, -h), (3.0, 0.0)
    assert abs(ab(S1, A) - r) < 1e-12 and abs(ab(S1, B) - r) < 1e-12
    bild = passend([(-1.2, -3.4), (7.2, 3.4)], B_, H_)
    t = []
    for P, von, bis in ((A, -55, 55), (B, 125, 235)):
        m = bild(P)
        rr = r * bild.s
        for a0, a1 in ((von, von + 22), (bis - 22, bis)):
            x1, y1 = m[0] + rr * math.cos(a0 * RAD), m[1] - rr * math.sin(a0 * RAD)
            x2, y2 = m[0] + rr * math.cos(a1 * RAD), m[1] - rr * math.sin(a1 * RAD)
            t.append(f'<path d="M {f(x1)} {f(y1)} A {f(rr)} {f(rr)} 0 0 0 {f(x2)} {f(y2)}" fill="none" stroke="{GRAU}" stroke-width="0.9"/>')
    t.append(gerade(bild, M, (0, 1), 3.3, ROT, 1.4))
    t.append(strecke(bild, A, B, SCHWARZ, 1.6))
    t.append(strecke(bild, A, S1, BLAU, 0.9, "3 2"))
    t.append(strecke(bild, B, S1, BLAU, 0.9, "3 2"))
    t.append(txt(*[a + b for a, b in zip(bild(mitte(A, S1)), (-5, -1))], "r", BLAU, 6.8, 700))
    t.append(txt(*[a + b for a, b in zip(bild(mitte(B, S1)), (5, -1))], "r", BLAU, 6.8, 700))
    t.append(rw(bild, M, B, S1, ROT))
    t += punkt(bild, A, "A", dx=-5, dy=7) + punkt(bild, B, "B", dx=5, dy=7)
    t += punkt(bild, S1, "S₁", dx=8, dy=-1) + punkt(bild, S2, "S₂", dx=8, dy=6)
    t += punkt(bild, M, "M", dx=-6, dy=8)
    # „m“ zwischen M und S₁, rechts der Geraden — oben stünde es auf der Beschriftung S₁.
    t.append(txt(bild((3.0, 1.5))[0] + 4, bild((3.0, 1.5))[1], "m", ROT, 7.2, 700, "start"))
    return svg(B_, H_, t)


# ---------- Figur 2: Umkreis ----------

def fig_umkreis():
    B_, H_ = 200.0, 128.0
    setze_flaeche(B_, H_)
    A, B, C = dreieck(7, 55, 65)
    M, _, _, _ = pruefe_punkte(A, B, C)
    r = ab(M, A)
    bild = passend([(M[0] - r - 0.3, M[1] - r - 0.3), (M[0] + r + 0.3, M[1] + r + 0.3)], B_, H_, rand=8, oben=6, unten=6)
    t = [kreis(bild(M), r * bild.s, BLAU, "none", 1.2)]
    # Jede Mittelsenkrechte von knapp außerhalb der Seite bis ein Stück über M hinaus.
    for P, Q in ((A, B), (B, C), (C, A)):
        m = mitte(P, Q)
        n = einheits((M[0] - m[0], M[1] - m[1]))
        t.append(strecke(bild, (m[0] - 0.7 * n[0], m[1] - 0.7 * n[1]), (M[0] + 0.7 * n[0], M[1] + 0.7 * n[1]), ROT, 1.0))
        t.append(rw(bild, m, Q, M, ROT, 3.2))
    t.append(poly(bild, [A, B, C], SCHWARZ, BLAU, 0.07, 1.3))
    for E in (A, B, C):
        t.append(strecke(bild, M, E, BLAU, 0.8, "2.5 2"))
    t += ecken(bild, A, B, C)
    t += punkt(bild, M, "M", ROT, dx=6, dy=-2)
    return svg(B_, H_, t)


# ---------- Figur 3: Lage von M und H je nach Winkel ----------

def fig_lage():
    B_, H_ = 300.0, 96.0
    setze_flaeche(B_, H_)
    t = []
    for i, (alpha, beta, titel) in enumerate(((60, 65, "spitzwinklig"), (50, 40, "rechtwinklig"), (30, 25, "stumpfwinklig"))):
        A, B, C = dreieck(6, alpha, beta)
        M, _, _, H = pruefe_punkte(A, B, C)
        r = ab(M, A)
        pts = [A, B, C, H, (M[0] - r, M[1] - r), (M[0] + r, M[1] + r)]
        setze_flaeche(100.0, 96.0)
        bild = passend(pts, 100.0, 96.0, rand=8, oben=18, unten=4)
        teil = [kreis(bild(M), r * bild.s, BLAU, "none", 0.8), poly(bild, [A, B, C], SCHWARZ, BLAU, 0.07, 1.1)]
        # Höhen, bis H verlängert
        for E, P, Q in ((A, B, C), (B, C, A), (C, A, B)):
            F, _ = lotfuss(E, P, Q)
            teil.append(strecke(bild, E, F, VIOLETT, 0.7))
            if ab(E, H) > 1e-9 and ab(F, H) > 1e-9:
                far = F if ab(E, H) > ab(E, F) and ab(F, H) < ab(E, H) else E
                teil.append(strecke(bild, far, H, VIOLETT, 0.6, "2 1.5"))
        teil += punkt(bild, M, "M", ROT, dx=-5, dy=-2)
        # H steht beim stumpfen Winkel ganz oben — die Beschriftung dann seitlich daneben.
        teil += punkt(bild, H, "H", VIOLETT, dx=6, dy=3)
        teil.append(txt(50, 8.0, titel, SCHWARZ, 6.6, 700))
        t.append(f'<g transform="translate({f(i * 100.0)},0)">' + "".join(teil) + "</g>")
    setze_flaeche(B_, H_)
    return svg(B_, H_, t)


# ---------- Figur 4: Winkelhalbierende ----------

def fig_winkelhalbierende():
    B_, H_ = 200.0, 118.0
    setze_flaeche(B_, H_)
    alpha = 64.0
    S = (0.0, 0.0)
    u1, u2 = (1.0, 0.0), (math.cos(alpha * RAD), math.sin(alpha * RAD))
    w = (math.cos(alpha / 2 * RAD), math.sin(alpha / 2 * RAD))
    r0 = 2.6
    X, Y = (r0, 0.0), (r0 * u2[0], r0 * u2[1])
    Z = (X[0] + Y[0], X[1] + Y[1])
    assert abs(ab(X, Z) - r0) < 1e-12 and abs(ab(Y, Z) - r0) < 1e-12
    # P deutlich jenseits von Z (|SZ| ≈ 4,4), sonst lägen beide Beschriftungen übereinander.
    P = (6.3 * w[0], 6.3 * w[1])
    F1, _ = lotfuss(P, S, u1)
    F2, _ = lotfuss(P, S, u2)
    assert abs(ab(P, F1) - ab(P, F2)) < 1e-12
    bild = passend([(-0.6, -0.5), (7.6, 6.8)], B_, H_)
    t = [strecke(bild, S, (7.0, 0.0), SCHWARZ, 1.4), strecke(bild, S, (7.0 * u2[0], 7.0 * u2[1]), SCHWARZ, 1.4)]
    for E, a0, a1 in ((S, -8, alpha + 8), (X, 20, 65), (Y, alpha - 70, alpha - 20)):
        m = bild(E)
        rr = r0 * bild.s
        x1, y1 = m[0] + rr * math.cos(a0 * RAD), m[1] - rr * math.sin(a0 * RAD)
        x2, y2 = m[0] + rr * math.cos(a1 * RAD), m[1] - rr * math.sin(a1 * RAD)
        t.append(f'<path d="M {f(x1)} {f(y1)} A {f(rr)} {f(rr)} 0 0 0 {f(x2)} {f(y2)}" fill="none" stroke="{GRAU}" stroke-width="0.9"/>')
    t.append(strecke(bild, S, (7.6 * w[0], 7.6 * w[1]), GRUEN, 1.4))
    for E in (X, Y):
        t.append(strecke(bild, E, Z, GRAU, 0.7, "2 1.5"))
    t.append(strecke(bild, P, F1, VIOLETT, 1.0, "3 2"))
    t.append(strecke(bild, P, F2, VIOLETT, 1.0, "3 2"))
    t.append(rw(bild, F1, S, P, VIOLETT))
    t.append(rw(bild, F2, S, P, VIOLETT))
    t += punkt(bild, S, "S", dx=-4, dy=6) + punkt(bild, X, "X", dx=0, dy=7) + punkt(bild, Y, "Y", dx=-6, dy=0)
    t += punkt(bild, Z, "Z", dx=6, dy=0) + punkt(bild, P, "P", GRUEN, dx=5, dy=-3)
    t.append(txt(bild((7.6 * w[0], 7.6 * w[1]))[0] - 3, bild((7.6 * w[0], 7.6 * w[1]))[1] - 1, "w", GRUEN, 7.2, 700, "end"))
    return svg(B_, H_, t)


# ---------- Figur 5: Inkreis ----------

def fig_inkreis():
    B_, H_ = 200.0, 112.0
    setze_flaeche(B_, H_)
    A, B, C = dreieck(7, 70, 40)
    _, I, _, _ = pruefe_punkte(A, B, C)
    bild = passend([A, B, C], B_, H_, rand=12, oben=10, unten=10)
    rho = abstand_gerade(I, A, B)
    t = [poly(bild, [A, B, C], SCHWARZ, BLAU, 0.07, 1.3)]
    for E, P, Q in ((A, B, C), (B, C, A), (C, A, B)):
        # bis zur Gegenseite
        wv = einheits((I[0] - E[0], I[1] - E[1]))
        ux, uy = Q[0] - P[0], Q[1] - P[1]
        s = ((P[0] - E[0]) * uy - (P[1] - E[1]) * ux) / (wv[0] * uy - wv[1] * ux)
        t.append(strecke(bild, E, (E[0] + s * wv[0], E[1] + s * wv[1]), GRUEN, 1.0))
    t.append(kreis(bild(I), rho * bild.s, BLAU, "none", 1.2))
    for P, Q in ((A, B), (B, C), (C, A)):
        F, _ = lotfuss(I, P, Q)
        t.append(strecke(bild, I, F, VIOLETT, 0.9, "2.5 2"))
        t.append(rw(bild, F, Q, I, VIOLETT, 3.2))
    t += ecken(bild, A, B, C)
    t += punkt(bild, I, "I", GRUEN, dx=-5, dy=-2)
    F, _ = lotfuss(I, A, B)
    t.append(txt(bild(mitte(I, F))[0] + 3, bild(mitte(I, F))[1] + 2, "ρ", VIOLETT, 7.4, 700, "start"))
    return svg(B_, H_, t)


# ---------- Figur 6: Seitenhalbierende und Schwerpunkt ----------

def fig_schwerpunkt():
    B_, H_ = 200.0, 108.0
    setze_flaeche(B_, H_)
    A, B, C = dreieck(7, 60, 50)
    _, _, S, _ = pruefe_punkte(A, B, C)
    bild = passend([A, B, C], B_, H_, rand=14, oben=10, unten=12)
    t = [poly(bild, [A, B, C], SCHWARZ, BLAU, 0.07, 1.3)]
    for E, P, Q, n in ((A, B, C, "a"), (B, C, A, "b"), (C, A, B, "c")):
        Mn = mitte(P, Q)
        t.append(strecke(bild, E, S, ORANGE, 1.6))
        t.append(strecke(bild, S, Mn, ORANGE, 0.9))
        dx, dy = (6, 7) if n == "c" else (7, -3) if n == "a" else (-8, -3)
        t += punkt(bild, Mn, "", SCHWARZ)
        t.append(txt_index(bild(Mn)[0] + dx, bild(Mn)[1] + dy, "M", n, SCHWARZ))
    t += ecken(bild, A, B, C)
    t += punkt(bild, S, "S", ORANGE, dx=6, dy=-3)
    # „2“ und „1“ an s_a
    Ma = mitte(B, C)
    t.append(txt(bild(mitte(A, S))[0], bild(mitte(A, S))[1] - 3, "2", ORANGE, 7.0, 700, halo=True))
    t.append(txt(bild(mitte(S, Ma))[0], bild(mitte(S, Ma))[1] - 3, "1", ORANGE, 7.0, 700, halo=True))
    return svg(B_, H_, t)


# ---------- Figur 7: Eulersche Gerade ----------

def fig_euler():
    B_, H_ = 200.0, 118.0
    setze_flaeche(B_, H_)
    # 30°/70°: M, S, H, I je rund 0,9 cm auseinander — bei fast gleichseitigen Dreiecken
    # lägen die vier Beschriftungen übereinander.
    A, B, C = dreieck(7, 30, 70)
    M, I, S, H = pruefe_punkte(A, B, C)
    r = ab(M, A)
    bild = passend([(M[0] - r, M[1] - r), (M[0] + r, M[1] + r), H], B_, H_, rand=8, oben=6, unten=6)
    t = [kreis(bild(M), r * bild.s, BLAU, "none", 0.8), poly(bild, [A, B, C], SCHWARZ, BLAU, 0.07, 1.3)]
    u = einheits((H[0] - M[0], H[1] - M[1]))
    t.append(gerade(bild, S, u, 2.6, SCHWARZ, 0.8, "4 2"))
    t += ecken(bild, A, B, C)
    n = (-u[1], u[0])   # quer zur Eulerschen Geraden, nach oben
    for P, name, farbe, seite in ((M, "M", ROT, 1), (S, "S", ORANGE, -1), (H, "H", VIOLETT, 1)):
        t += punkt(bild, P, name, farbe, dx=seite * n[0] * 7, dy=-seite * n[1] * 7 + 2.4)
    t += punkt(bild, I, "I", GRUEN, dx=5, dy=2.4)
    return svg(B_, H_, t)


FIGUREN = [fig_mittelsenkrechte, fig_umkreis, fig_lage, fig_winkelhalbierende, fig_inkreis, fig_schwerpunkt, fig_euler]

if __name__ == "__main__":
    zeilen = [fn() for fn in FIGUREN]
    pfad = pathlib.Path(__file__).parent / "gk-figuren.txt"
    pfad.write_text("\n".join(zeilen) + "\n", encoding="utf-8")
    print(f"{len(zeilen)} Figuren geschrieben")
