#!/usr/bin/env python3
"""Erzeugt die SVG-Figuren der Formelsammlung „Satz des Thales“.

Jede Figur wird gerechnet, nicht gezeichnet: Die Punkte kommen aus den Formeln, die im
Text danebenstehen. Dadurch kann keine Skizze etwas anderes behaupten als die Formel —
und tf_kopf.pruefe_im_bild schlägt an, sobald etwas aus der Fläche ragt.

    python3 th-svgs.py      schreibt th-figuren.txt (eine Zeichnung je Zeile)
"""
import math
import pathlib

from tf_kopf import (BLAU, GRUEN, ORANGE, ROT, VIOLETT, GRAU, SCHWARZ,
                     bogen, de, kreis, lin, polyline, setze_flaeche, svg, txt)

GRAD = math.pi / 180


def auf_kreis(m, r, grad):
    """Punkt auf dem Kreis. Der Winkel wird wie in der Schule gemessen: gegen den
    Uhrzeigersinn von der Rechtsachse aus — in SVG-Koordinaten also nach oben."""
    return (m[0] + r * math.cos(grad * GRAD), m[1] - r * math.sin(grad * GRAD))


def punkt(p, name, farbe=SCHWARZ, dx=0.0, dy=-5.0, groesse=7.4):
    return [
        f'<circle cx="{p[0]:.2f}" cy="{p[1]:.2f}" r="2.1" fill="{farbe}"/>',
        txt(p[0] + dx, p[1] + dy, name, farbe, groesse, 700),
    ]


def rechter_winkel(v, p, q, farbe=ROT, s=8.0):
    """Das Kästchen am rechten Winkel — ausgerichtet auf die beiden Schenkel."""
    def richtung(z):
        dx, dy = z[0] - v[0], z[1] - v[1]
        laenge = math.hypot(dx, dy) or 1.0
        return (dx / laenge * s, dy / laenge * s)
    u = richtung(p)
    w = richtung(q)
    return polyline([(v[0] + u[0], v[1] + u[1]),
                     (v[0] + u[0] + w[0], v[1] + u[1] + w[1]),
                     (v[0] + w[0], v[1] + w[1])], farbe, 1.2)


def gleich_strich(a, b, farbe):
    """Der Querstrich, mit dem gleich lange Strecken gekennzeichnet werden."""
    mx, my = (a[0] + b[0]) / 2, (a[1] + b[1]) / 2
    dx, dy = b[0] - a[0], b[1] - a[1]
    laenge = math.hypot(dx, dy) or 1.0
    qx, qy = -dy / laenge * 3.4, dx / laenge * 3.4
    return lin((mx - qx, my - qy), (mx + qx, my + qy), farbe, 1.2)


def winkel_bogen(v, p, q, r, farbe, name=None, groesse=7.0):
    """Winkelbogen bei v zwischen den Richtungen nach p und nach q, kürzester Weg."""
    a1 = math.degrees(math.atan2(v[1] - p[1], p[0] - v[0]))
    a2 = math.degrees(math.atan2(v[1] - q[1], q[0] - v[0]))
    delta = ((a2 - a1 + 540) % 360) - 180
    teile = [bogen(v, r, a1, a1 + delta, farbe, 1.2, gross=0)]
    if name:
        mitte = a1 + delta / 2
        teile.append(txt(v[0] + (r + 7) * math.cos(mitte * GRAD),
                         v[1] - (r + 7) * math.sin(mitte * GRAD) + 2.5,
                         name, farbe, groesse, 700))
    return teile


# ---------- Figur 1: der Satz ----------

def fig_satz():
    B, H = 320.0, 230.0
    setze_flaeche(B, H)
    M = (160.0, 128.0)
    R = 84.0
    A = (M[0] - R, M[1])
    Bp = (M[0] + R, M[1])
    C = auf_kreis(M, R, 58)
    t = [kreis(M, R, BLAU, breite=1.3)]
    t.append(lin(A, Bp, BLAU, 2.0))
    t.append(lin(A, C, GRUEN, 1.6))
    t.append(lin(Bp, C, ORANGE, 1.6))
    t += winkel_bogen(A, Bp, C, 20, GRUEN, "α")
    t += winkel_bogen(Bp, C, A, 20, ORANGE, "β")
    t.append(rechter_winkel(C, A, Bp))
    t += punkt(A, "A", SCHWARZ, -6, 10)
    t += punkt(Bp, "B", SCHWARZ, 6, 10)
    t += punkt(C, "C", SCHWARZ, 0, -6)
    t += punkt(M, "M", VIOLETT, 0, 11)
    t.append(txt(M[0], M[1] - 5, "Durchmesser", BLAU, 6.6, 600))
    t.append(txt(M[0], H - 6, "γ = 90° — für jedes C auf dem Kreis", ROT, 7.4, 700))
    return svg(B, H, t)


# ---------- Figur 2: der Beweis ----------

def fig_beweis():
    B, H = 320.0, 230.0
    setze_flaeche(B, H)
    M = (160.0, 128.0)
    R = 84.0
    A = (M[0] - R, M[1])
    Bp = (M[0] + R, M[1])
    phi = 62
    C = auf_kreis(M, R, phi)
    t = [kreis(M, R, "#c9d0d8", breite=1.0)]
    # Die beiden gleichschenkligen Teildreiecke — sie tragen den ganzen Beweis.
    t.append(f'<polygon points="{A[0]:.2f},{A[1]:.2f} {M[0]:.2f},{M[1]:.2f} {C[0]:.2f},{C[1]:.2f}" '
             f'fill="{GRUEN}" fill-opacity="0.13" stroke="none"/>')
    t.append(f'<polygon points="{Bp[0]:.2f},{Bp[1]:.2f} {M[0]:.2f},{M[1]:.2f} {C[0]:.2f},{C[1]:.2f}" '
             f'fill="{ORANGE}" fill-opacity="0.13" stroke="none"/>')
    t.append(lin(A, Bp, BLAU, 1.8))
    t.append(lin(A, C, GRUEN, 1.5))
    t.append(lin(Bp, C, ORANGE, 1.5))
    t.append(lin(M, C, VIOLETT, 1.6))
    for P in (A, Bp, C):
        t.append(gleich_strich(M, P, VIOLETT))
    t += winkel_bogen(A, Bp, C, 18, GRUEN, "α")
    t += winkel_bogen(C, A, M, 16, GRUEN, "α")
    t += winkel_bogen(Bp, C, A, 18, ORANGE, "β")
    t += winkel_bogen(C, M, Bp, 25, ORANGE, "β")
    t += punkt(A, "A", SCHWARZ, -6, 10)
    t += punkt(Bp, "B", SCHWARZ, 6, 10)
    t += punkt(C, "C", SCHWARZ, 0, -6)
    t += punkt(M, "M", VIOLETT, -8, 11)
    t.append(txt((M[0] + C[0]) / 2 + 9, (M[1] + C[1]) / 2, "r", VIOLETT, 7.2, 700))
    t.append(txt((M[0] + A[0]) / 2, M[1] + 11, "r", VIOLETT, 7.2, 700))
    t.append(txt((M[0] + Bp[0]) / 2, M[1] + 11, "r", VIOLETT, 7.2, 700))
    t.append(txt(B / 2, H - 6, "γ = α + β  und  α + β + γ = 180°  ⟹  γ = 90°", SCHWARZ, 7.4, 700))
    return svg(B, H, t)


# ---------- Figur 3: die Konstruktion ----------

def fig_konstruktion():
    B, H = 320.0, 230.0
    setze_flaeche(B, H)
    A = (76.0, 126.0)
    Bp = (244.0, 126.0)
    M = ((A[0] + Bp[0]) / 2, A[1])
    R = (Bp[0] - A[0]) / 2
    # Hilfsradius wie beim Konstruieren: größer als die halbe Strecke.
    rh = R * 1.24
    hoehe = math.sqrt(rh * rh - R * R)
    S1 = (M[0], M[1] - hoehe)
    S2 = (M[0], M[1] + hoehe)
    t = []
    # Die vier Zirkelbögen um A und um B.
    for zentrum, ziel in ((A, S1), (A, S2), (Bp, S1), (Bp, S2)):
        mitte = math.degrees(math.atan2(zentrum[1] - ziel[1], ziel[0] - zentrum[0]))
        t.append(bogen(zentrum, rh, mitte - 16, mitte + 16, GRAU, 0.9, gross=0))
    t.append(lin((M[0], M[1] - hoehe - 16), (M[0], M[1] + hoehe + 16), ROT, 1.2, strich="4 3"))
    t.append(kreis(M, R, BLAU, breite=1.6))
    t.append(lin(A, Bp, SCHWARZ, 1.8))
    t += punkt(A, "A", SCHWARZ, -6, 11)
    t += punkt(Bp, "B", SCHWARZ, 6, 11)
    t += punkt(M, "M", VIOLETT, 9, 11)
    t.append(txt(M[0] + 46, M[1] - hoehe - 8, "Mittelsenkrechte", ROT, 6.6, 600, halo=True))
    t.append(txt(M[0], M[1] - R - 7, "Thaleskreis", BLAU, 6.8, 700))
    t.append(txt(B / 2, H - 6, "1. Mittelsenkrechte → M · 2. Kreis um M durch A", SCHWARZ, 7.4, 700))
    return svg(B, H, t)


# ---------- Figur 4: die Lage von C entscheidet ----------

def fig_lage():
    B, H = 360.0, 150.0
    setze_flaeche(B, H)
    t = []
    faelle = [
        (0.55, "C innen", "γ > 90°", ROT),
        (1.00, "C auf dem Kreis", "γ = 90°", GRUEN),
        (1.55, "C außen", "γ < 90°", BLAU),
    ]
    for i, (anteil, was, urteil, farbe) in enumerate(faelle):
        ox = 60.0 + i * 120.0
        M = (ox, 84.0)
        R = 36.0
        A = (M[0] - R, M[1])
        Bp = (M[0] + R, M[1])
        C = auf_kreis(M, R * anteil, 72)
        t.append(kreis(M, R, "#c9d0d8", breite=1.0))
        t.append(lin(A, Bp, BLAU, 1.5))
        t.append(lin(A, C, farbe, 1.3))
        t.append(lin(Bp, C, farbe, 1.3))
        if anteil == 1.0:
            t.append(rechter_winkel(C, A, Bp, farbe, 6.5))
        else:
            t += winkel_bogen(C, A, Bp, 11, farbe)
        t.append(f'<circle cx="{C[0]:.2f}" cy="{C[1]:.2f}" r="2.1" fill="{farbe}"/>')
        t.append(txt(C[0], C[1] - 5, "C", farbe, 7.0, 700))
        t.append(txt(M[0], M[1] + 22, was, SCHWARZ, 7.0, 600))
        t.append(txt(M[0], M[1] + 33, urteil, farbe, 7.8, 700))
    return svg(B, H, t)


# ---------- Figur 5: Tangenten ----------

def fig_tangenten():
    B, H = 340.0, 228.0
    setze_flaeche(B, H)
    M = (92.0, 112.0)
    P = (280.0, 112.0)
    r = 38.0
    d = P[0] - M[0]
    Z = ((M[0] + P[0]) / 2, M[1])
    # Berührpunkte: Abstand r² : d längs MP, Höhe (r : d) · √(d² − r²).
    tx = r * r / d
    ty = (r / d) * math.sqrt(d * d - r * r)
    T1 = (M[0] + tx, M[1] - ty)
    T2 = (M[0] + tx, M[1] + ty)
    t = [kreis(Z, d / 2, BLAU, breite=1.1)]
    t.append(lin(M, P, BLAU, 1.0, strich="4 3"))
    t.append(kreis(M, r, VIOLETT, breite=1.6))
    for T in (T1, T2):
        t.append(lin(M, T, VIOLETT, 1.4))
        t.append(lin(P, T, GRUEN, 1.6))
        t.append(rechter_winkel(T, M, P, ROT, 7.0))
    t += punkt(M, "M", SCHWARZ, -7, 11)
    t += punkt(P, "P", SCHWARZ, 8, 4)
    t += punkt(Z, "Z", BLAU, 0, 11)
    t.append(f'<circle cx="{T1[0]:.2f}" cy="{T1[1]:.2f}" r="2.1" fill="{SCHWARZ}"/>')
    t.append(txt(T1[0] - 8, T1[1] - 4, "T₁", SCHWARZ, 7.4, 700))
    t.append(f'<circle cx="{T2[0]:.2f}" cy="{T2[1]:.2f}" r="2.1" fill="{SCHWARZ}"/>')
    t.append(txt(T2[0] - 8, T2[1] + 10, "T₂", SCHWARZ, 7.4, 700))
    t.append(txt(Z[0] + 4, Z[1] - d / 2 - 5, "Thaleskreis über MP", BLAU, 6.8, 700))
    t.append(txt(B / 2, H - 5, "PT = √(d² − r²)", GRUEN, 8.2, 700))
    return svg(B, H, t)


FIGUREN = [fig_satz, fig_beweis, fig_konstruktion, fig_lage, fig_tangenten]

if __name__ == "__main__":
    zeilen = [f() for f in FIGUREN]
    pfad = pathlib.Path(__file__).parent / "th-figuren.txt"
    pfad.write_text("\n".join(zeilen) + "\n", encoding="utf-8")
    print(f"{len(zeilen)} Figuren geschrieben")
