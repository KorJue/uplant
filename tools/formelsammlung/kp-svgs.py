#!/usr/bin/env python3
"""Erzeugt die SVG-Figuren der Formelsammlung „Körper“ (Klasse 8, Körper, Themen 1 bis 5).

Jede Figur wird gerechnet, nicht gezeichnet: Die Körper entstehen aus Raumpunkten und werden wie auf
den Lernseiten abgebildet — Prismen im Schrägbild (45°, Tiefe halbiert), Zylinder in der Ansicht
schräg von oben. Was verdeckt ist, ergibt sich aus den Außennormalen, nicht aus Handarbeit. Das
Skript rechnet mit, was die Formelsammlung behauptet — Ecken, Kanten und Flächen des Prismas, die
gezeichnete Tiefe, die Flächen des Netzes, das halbe Quadervolumen, die Mantelbreite 2 · π · r, die
Fläche des Fast-Rechtecks. Stimmt eine Zahl nicht, bricht es ab. tf_kopf.pruefe_im_bild schlägt an,
sobald etwas aus der Fläche ragt.

    python3 kp-svgs.py      schreibt kp-figuren.txt (eine Zeichnung je Zeile)
"""
import math
import pathlib

from tf_kopf import (BLAU, GRUEN, ORANGE, ROT, VIOLETT, GRAU, SCHWARZ,
                     bogen, de, f, lin, polyline, pruefe_im_bild, setze_flaeche, svg, txt)

C45 = math.cos(math.radians(45)) / 2          # Schrägbild: Tiefe unter 45° und halbiert
SICHT_KAV = (C45, C45, -1.0)                   # zum Betrachter (wie raum.js)
EPS_ANSICHT = math.radians(22)                 # Zylinder: Blick 22° von oben (wie auf den Seiten)


def gleich(x, soll, was, eps=1e-9):
    assert abs(x - soll) < eps, f"{was}: {x} statt {soll}"


def sub(a, b):
    return tuple(x - y for x, y in zip(a, b))


def add(a, b):
    return tuple(x + y for x, y in zip(a, b))


def dot(a, b):
    return sum(x * y for x, y in zip(a, b))


def cross(a, b):
    return (a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0])


def inhalt2(pts):
    """Flächeninhalt eines ebenen Vielecks in der Bildebene (Gaußsche Trapezformel)."""
    return abs(sum(pts[i][0] * pts[(i + 1) % len(pts)][1] - pts[(i + 1) % len(pts)][0] * pts[i][1] for i in range(len(pts)))) / 2


def vieleck(pts, rand, fuell, deckung, breite=1.0, strich=None):
    for p in pts:
        pruefe_im_bild(p[0], p[1], "Vieleck")
    d = f' stroke-dasharray="{strich}"' if strich else ""
    s = " ".join(f"{f(a)},{f(b)}" for a, b in pts)
    return (f'<polygon points="{s}" fill="{fuell}" fill-opacity="{f(deckung)}" stroke="{rand}" '
            f'stroke-width="{f(breite)}" stroke-linejoin="round"{d}/>')


class Kavalier:
    """Schrägbild: x nach rechts, y nach oben, z nach hinten (unter 45°, halbiert)."""
    def __init__(self, s, ox, oy):
        self.s, self.ox, self.oy = s, ox, oy

    def __call__(self, p):
        x, y, z = p
        return (self.ox + self.s * (x + C45 * z), self.oy - self.s * (y + C45 * z))


class Ansicht:
    """Schräg von oben (Zylinder): Ein Kreis in der Waagerechten wird eine Ellipse mit dem
    Achsenverhältnis sin ε."""
    def __init__(self, s, ox, oy, eps=EPS_ANSICHT):
        self.s, self.ox, self.oy, self.eps = s, ox, oy, eps

    def __call__(self, p):
        x, y, z = p
        return (self.ox + self.s * x, self.oy - self.s * (y * math.cos(self.eps) + z * math.sin(self.eps)))


def prisma(unten, v):
    """Ein Prisma aus der Grundfläche `unten` (Raumpunkte) und dem Verschiebungsvektor v.
    Liefert die Punkte und die Flächen als Indexlisten mit Außennormale."""
    n = len(unten)
    punkte = list(unten) + [add(p, v) for p in unten]
    mitte = tuple(sum(p[i] for p in punkte) / len(punkte) for i in range(3))
    roh = [("grund", list(range(n))), ("deckel", list(range(n, 2 * n)))]
    roh += [("seite", [i, (i + 1) % n, n + (i + 1) % n, n + i]) for i in range(n)]
    flaechen = []
    for art, idx in roh:
        a, b, c = punkte[idx[0]], punkte[idx[1]], punkte[idx[2]]
        nrm = cross(sub(b, a), sub(c, a))
        fm = tuple(sum(punkte[i][k] for i in idx) / len(idx) for k in range(3))
        if dot(nrm, sub(fm, mitte)) < 0:
            nrm = tuple(-x for x in nrm)
        flaechen.append({"art": art, "idx": idx, "normale": nrm})
    return punkte, flaechen


def kanten_von(flaechen):
    kanten = {}
    for k, fl in enumerate(flaechen):
        idx = fl["idx"]
        for i in range(len(idx)):
            schl = tuple(sorted((idx[i], idx[(i + 1) % len(idx)])))
            kanten.setdefault(schl, []).append(k)
    return kanten


def zeichne_prisma(kam, punkte, flaechen, farbe, sicht=SICHT_KAV, kantenfarbe=SCHWARZ):
    """Sichtbare Flächen gefüllt; Kanten durchgezogen, wenn eine angrenzende Fläche sichtbar ist,
    sonst gestrichelt (verdeckt)."""
    sichtbar = [dot(fl["normale"], sicht) > 1e-9 for fl in flaechen]
    t = []
    for fl, s in zip(flaechen, sichtbar):
        if s:
            fuell = farbe[fl["art"]]
            t.append(vieleck([kam(punkte[i]) for i in fl["idx"]], "none", fuell, 0.2, 0))
    verdeckt, offen = [], []
    for (i, j), an in kanten_von(flaechen).items():
        (offen if any(sichtbar[k] for k in an) else verdeckt).append((i, j))
    for i, j in verdeckt:
        t.append(lin(kam(punkte[i]), kam(punkte[j]), GRAU, 0.8, "2.4 1.6"))
    for i, j in offen:
        t.append(lin(kam(punkte[i]), kam(punkte[j]), kantenfarbe, 1.1))
    return t, sichtbar


def tief(text, index, groesse):
    """Ein Buchstabe mit Index (h_g); der Index zählt in txt() nicht zur Breite des Haupttexts."""
    return f'{text}<tspan font-size="{f(groesse * 0.72)}" dy="{f(groesse * 0.22)}">{index}</tspan>'


# ---------- Figur 1: ein Prisma — Grundfläche, Deckfläche, Mantel, Höhe; Ecken, Kanten, Flächen ----------

def fig_prisma():
    n, R, h = 5, 1.75, 2.6
    B, H = 250.0, 104.0
    setze_flaeche(B, H)
    kam = Kavalier(22.0, 62.0, 90.0)
    # Eine Ecke zeigt nach vorn (270°): So sind zwei Seitenflächen von vorn zu sehen und das Fünfeck
    # ist als Fünfeck zu erkennen — mit einer Ecke nach hinten sähe der Körper aus wie ein Quader.
    unten = [(R * math.cos(math.radians(270 + 72 * k)), 0.0, R * math.sin(math.radians(270 + 72 * k))) for k in range(n)]
    punkte, flaechen = prisma(unten, (0.0, h, 0.0))
    ecken, kanten, fl = len(punkte), len(kanten_von(flaechen)), len(flaechen)
    gleich(ecken, 2 * n, "Prisma, Ecken")
    gleich(kanten, 3 * n, "Prisma, Kanten")
    gleich(fl, n + 2, "Prisma, Flächen")
    gleich(ecken - kanten + fl, 2, "Prisma, Eulerscher Polyedersatz")
    t, sichtbar = zeichne_prisma(kam, punkte, flaechen, {"grund": BLAU, "deckel": BLAU, "seite": ORANGE})
    gleich(sum(1 for fl_, s in zip(flaechen, sichtbar) if s and fl_["art"] == "deckel"), 1, "Prisma, Deckfläche sichtbar")
    # Beschriftung: G auf der Deckfläche, die Höhe violett links neben dem Körper.
    dm = kam(tuple(sum(punkte[i][k] for i in range(n, 2 * n)) / n for k in range(3)))
    t.append(txt(dm[0], dm[1] + 2.6, "G", BLAU, 8.0, 700))
    xl = min(p[0] for p in unten) - 0.45
    a, b = kam((xl, 0.0, 0.0)), kam((xl, h, 0.0))
    t.append(lin(a, b, VIOLETT, 1.3))
    t.append(lin((a[0] - 2.5, a[1]), (a[0] + 2.5, a[1]), VIOLETT, 1.0))
    t.append(lin((b[0] - 2.5, b[1]), (b[0] + 2.5, b[1]), VIOLETT, 1.0))
    t.append(txt(a[0] - 5, (a[1] + b[1]) / 2 + 2.5, "h", VIOLETT, 8.0, 700, "end"))
    seite = next(fl_ for fl_, s in zip(flaechen, sichtbar) if s and fl_["art"] == "seite" and abs(fl_["normale"][2]) > 0.5 * math.hypot(*fl_["normale"]))
    sm = kam(tuple(sum(punkte[i][k] for i in seite["idx"]) / 4 for k in range(3)))
    t.append(txt(sm[0], sm[1] + 2.4, "M", ORANGE, 7.4, 700, halo=True))
    xt = 150
    for i, (z, farbe, gew) in enumerate([(f"Fünfeckprisma, n = {n}:", SCHWARZ, 700),
                                         (f"Ecken: 2 · {n} = {ecken}", SCHWARZ, 400),
                                         (f"Kanten: 3 · {n} = {kanten}", SCHWARZ, 400),
                                         (f"Flächen: {n} + 2 = {fl}", SCHWARZ, 400),
                                         ("G Grund- und Deckfläche", BLAU, 700),
                                         ("M Mantel (die Seitenflächen)", ORANGE, 700)]):
        t.append(txt(xt, 22 + i * 11.5, z, farbe, 6.2, gew, "start"))
    return svg(B, H, t)


# ---------- Figur 2: Schrägbild eines Quaders — Tiefe unter 45°, halbiert ----------

def fig_schraegbild():
    a, c, b = 4.0, 2.0, 3.0          # Breite, Höhe, Tiefe in cm
    B, H = 250.0, 92.0
    setze_flaeche(B, H)
    s = 17.0
    kam = Kavalier(s, 34.0, 78.0)
    unten = [(0.0, 0.0, 0.0), (a, 0.0, 0.0), (a, 0.0, b), (0.0, 0.0, b)]
    punkte, flaechen = prisma(unten, (0.0, c, 0.0))
    t, sichtbar = zeichne_prisma(kam, punkte, flaechen, {"grund": BLAU, "deckel": BLAU, "seite": BLAU})
    gleich(sum(1 for s_ in sichtbar if s_), 3, "Quader, sichtbare Flächen")
    # Die gezeichnete Tiefe ist die Hälfte der wahren — gemessen im Bild.
    p, q = kam((a, 0.0, 0.0)), kam((a, 0.0, b))
    gleich(math.dist(p, q), s * b / 2, "Schrägbild, gezeichnete Tiefe", 1e-9)
    gleich(math.degrees(math.atan2(p[1] - q[1], q[0] - p[0])), 45.0, "Schrägbild, Winkel", 1e-9)
    # 45°-Winkel an der vorderen rechten Ecke: waagerechte Hilfslinie und Bogen.
    t.append(lin(p, (p[0] + 34, p[1]), GRAU, 0.8, "2 1.5"))
    t.append(bogen(p, 15, 0, 45, ROT, 1.1))
    t.append(txt(p[0] + 25, p[1] - 2.5, "45°", ROT, 6.4, 700, "start"))
    # Maße: Breite unten, Höhe links, Tiefe an der Tiefenkante.
    v0, v1, v2 = kam((0.0, 0.0, 0.0)), kam((a, 0.0, 0.0)), kam((0.0, c, 0.0))
    t.append(txt((v0[0] + v1[0]) / 2, v0[1] + 9, f"{de(a)} cm", BLAU, 6.6, 700))
    t.append(txt(v0[0] - 3, (v0[1] + v2[1]) / 2 + 2.4, f"{de(c)} cm", BLAU, 6.6, 700, "end"))
    # Die Tiefe steht an der oberen linken Tiefenkante — unten rechts liegen schon Bogen und „45°“.
    o0, o1 = kam((0.0, c, 0.0)), kam((0.0, c, b))
    t.append(txt((o0[0] + o1[0]) / 2 - 4, (o0[1] + o1[1]) / 2 + 1, f"{de(b)} cm", ROT, 6.6, 700, "end"))
    xt = 150
    for i, (z, farbe, gew) in enumerate([("Breite, Höhe: wahre Länge", BLAU, 700),
                                         ("nach hinten: unter 45°", ROT, 700),
                                         ("und auf die Hälfte verkürzt", ROT, 400),
                                         (f"{de(b)} cm tief → {de(b / 2, 1)} cm gezeichnet", ROT, 400),
                                         ("verdeckte Kanten gestrichelt", GRAU, 400)]):
        t.append(txt(xt, 20 + i * 11.5, z, farbe, 6.0, gew, "start"))
    return svg(B, H, t)


# ---------- Figur 3: Netz eines Quaders — zwei Grundflächen und der Mantel als ein Rechteck ----------

def fig_quadernetz():
    a, b, c = 4.0, 3.0, 2.0          # Grundfläche a × b, Höhe c
    B, H = 250.0, 96.0
    setze_flaeche(B, H)
    s, x0, y0 = 9.5, 22.0, 8.0
    ym = y0 + b * s                  # Oberkante des Mantelstreifens
    teile = []                       # (x, y, breite, höhe, art, name)
    xs = x0
    for breite, name in [(b, ""), (a, ""), (b, ""), (a, "")]:
        teile.append((xs, ym, breite * s, c * s, "mantel", name))
        xs += breite * s
    teile.append((x0 + b * s, y0, a * s, b * s, "grund", "G"))
    teile.append((x0 + b * s, ym + c * s, a * s, b * s, "grund", "G"))
    t = []
    for (x, y, w, hh, art, name) in teile:
        farbe = BLAU if art == "grund" else ORANGE
        t.append(vieleck([(x, y), (x + w, y), (x + w, y + hh), (x, y + hh)], SCHWARZ, farbe, 0.18, 0.9))
        if name:
            t.append(txt(x + w / 2, y + hh / 2 + 2.8, name, BLAU, 8.0, 700))
    flaeche = sum(w * hh for (_, _, w, hh, _, _) in teile) / s ** 2
    O = 2 * a * b + 2 * (a + b) * c
    gleich(flaeche, O, "Quadernetz, Flächeninhalt")
    u = 2 * (a + b)
    gleich((xs - x0) / s, u, "Quadernetz, Mantel so lang wie der Umfang")
    t.append(txt(x0 + (b + a / 2) * s, ym + c * s / 2 + 2.4, "M", ORANGE, 7.6, 700))
    t.append(txt(x0 + b * s - 2.5, y0 + b * s / 2 + 2.4, f"{de(b)} cm", SCHWARZ, 6.0, 400, "end"))
    t.append(txt(x0 + b * s + a * s / 2, y0 + 7.5, f"{de(a)} cm", SCHWARZ, 6.0, 400))
    t.append(txt(x0 - 2.5, ym + c * s / 2 + 2.4, f"{de(c)} cm", VIOLETT, 6.0, 700, "end"))
    t.append(txt(x0 + (2 * b + 1.5 * a) * s, ym - 3, f"u = {de(u)} cm", ORANGE, 6.4, 700))
    G, M = a * b, u * c
    xt = 158
    for i, (z, farbe, gew) in enumerate([(f"G = {de(a)} · {de(b)} = {de(G)} cm²", BLAU, 700),
                                         (f"M = u · h = {de(u)} · {de(c)} = {de(M)} cm²", ORANGE, 700),
                                         (f"O = 2 · {de(G)} + {de(M)} = {de(O)} cm²", GRUEN, 700)]):
        t.append(txt(xt, ym + c * s + 12 + i * 11, z, farbe, 6.0, gew, "start"))
    gleich(2 * G + M, O, "Quadernetz, O = 2 · G + M")
    return svg(B, H, t)


# ---------- Figur 4: Das Dreiecksprisma ist ein halber Quader ----------

def fig_halbquader():
    g, hg, h = 4.0, 2.5, 3.0
    B, H = 250.0, 90.0
    setze_flaeche(B, H)
    s = 17.0
    kam = Kavalier(s, 30.0, 74.0)
    dreieck = [(0.0, 0.0, 0.0), (g, 0.0, 0.0), (g, hg, 0.0)]
    punkte, flaechen = prisma(dreieck, (0.0, 0.0, h))
    t, sichtbar = zeichne_prisma(kam, punkte, flaechen, {"grund": BLAU, "deckel": BLAU, "seite": BLAU})
    # Der Rest des Quaders als orange gestrichelter Umriss — dieselbe Form, umgedreht.
    for p, q in [((0, 0, 0), (0, hg, 0)), ((0, hg, 0), (g, hg, 0)), ((0, hg, 0), (0, hg, h)),
                 ((0, hg, h), (g, hg, h)), ((0, hg, h), (0, 0, h))]:
        t.append(lin(kam(p), kam(q), ORANGE, 1.0, "2.4 1.6"))
    # Volumen: das Prisma (Tetraederzerlegung) ist die Hälfte des Quaders.
    def tetra(a, b, c, d):
        return abs(dot(sub(b, a), cross(sub(c, a), sub(d, a)))) / 6
    A, Bp, C, A2, B2, C2 = punkte
    V = tetra(A, Bp, C, A2) + tetra(Bp, C, A2, B2) + tetra(C, A2, B2, C2)
    gleich(V, g * hg * h / 2, "Dreiecksprisma, halber Quader")
    v0, v1, v2 = kam((0.0, 0.0, 0.0)), kam((g, 0.0, 0.0)), kam((g, hg, 0.0))
    t.append(txt((v0[0] + v1[0]) / 2, v0[1] + 9, "g", BLAU, 7.4, 700))
    # Mit Schutzrand: Hinter dem Dreieck läuft die verdeckte hintere Kante.
    t.append(txt(v1[0] - 3, (v1[1] + v2[1]) / 2 + 5, tief("h", "g", 7.4), VIOLETT, 7.4, 700, "end", halo=True))
    w0, w1 = kam((g, 0.0, 0.0)), kam((g, 0.0, h))
    t.append(txt((w0[0] + w1[0]) / 2 + 5, (w0[1] + w1[1]) / 2 + 7, "h", VIOLETT, 7.4, 700, "start"))
    xt = 150
    for i, (z, farbe, gew) in enumerate([("Quader: g · " + tief("h", "g", 6.4) + " · h", ORANGE, 700),
                                         ("Dreiecksprisma: die Hälfte", BLAU, 700),
                                         ("V = ½ · g · " + tief("h", "g", 6.4) + " · h = G · h", BLAU, 400)]):
        t.append(txt(xt, 26 + i * 12, z, farbe, 6.4, gew, "start"))
    return svg(B, H, t)


# ---------- Figur 5: ein Zylinder — Grundfläche, Mantel, Radius, Höhe ----------

def ellipse_punkte(kam, r, y, von=0.0, bis=2 * math.pi, n=96):
    return [kam((r * math.cos(von + (bis - von) * i / n), y, r * math.sin(von + (bis - von) * i / n))) for i in range(n + 1)]


def fig_zylinder():
    r, h = 1.55, 2.6
    B, H = 250.0, 104.0
    setze_flaeche(B, H)
    kam = Ansicht(24.0, 64.0, 88.0)
    # Die Ellipse ist so breit wie der Durchmesser und sin ε mal so hoch.
    oben = ellipse_punkte(kam, r, h)
    breite = max(p[0] for p in oben) - min(p[0] for p in oben)
    hoehe = max(p[1] for p in oben) - min(p[1] for p in oben)
    gleich(hoehe / breite, math.sin(EPS_ANSICHT), "Zylinder, Ellipse", 1e-3)
    vorn_unten = ellipse_punkte(kam, r, 0.0, math.pi, 2 * math.pi, 48)     # z < 0: vorn
    hinten_unten = ellipse_punkte(kam, r, 0.0, 0.0, math.pi, 48)
    vorn_oben = ellipse_punkte(kam, r, h, math.pi, 2 * math.pi, 48)
    t = [vieleck(vorn_unten + vorn_oben[::-1], "none", ORANGE, 0.2, 0),
         polyline(hinten_unten, GRAU, 0.8, "2.4 1.6"),
         polyline(vorn_unten, SCHWARZ, 1.1),
         vieleck(oben[:-1], SCHWARZ, BLAU, 0.2, 1.1),
         lin(kam((-r, 0.0, 0.0)), kam((-r, h, 0.0)), SCHWARZ, 1.1),
         lin(kam((r, 0.0, 0.0)), kam((r, h, 0.0)), SCHWARZ, 1.1)]
    m, p = kam((0.0, h, 0.0)), kam((r, h, 0.0))
    t.append(lin(m, p, GRUEN, 1.3))
    t.append(txt((m[0] + p[0]) / 2, m[1] - 2.5, "r", GRUEN, 7.4, 700))
    t.append(txt(m[0] - 9, m[1] + 2.6, "G", BLAU, 7.6, 700))
    a, b = kam((-r - 0.45, 0.0, 0.0)), kam((-r - 0.45, h, 0.0))
    t += [lin(a, b, VIOLETT, 1.3), lin((a[0] - 2.5, a[1]), (a[0] + 2.5, a[1]), VIOLETT, 1.0),
          lin((b[0] - 2.5, b[1]), (b[0] + 2.5, b[1]), VIOLETT, 1.0),
          txt(a[0] - 4, (a[1] + b[1]) / 2 + 2.5, "h", VIOLETT, 8.0, 700, "end")]
    # Auf drei Viertel der Höhe: In halber Höhe läge „M“ auf der gestrichelten hinteren Bodenkante.
    t.append(txt(m[0], kam((0.0, 0.75 * h, -r))[1] + 2.4, "M", ORANGE, 7.6, 700))
    xt = 150
    for i, (z, farbe, gew) in enumerate([("G Grund- und Deckfläche:", BLAU, 700), ("zwei gleiche Kreise", BLAU, 400),
                                         ("M Mantel: gebogenes Rechteck", ORANGE, 700),
                                         ("r Radius, d = 2 · r", GRUEN, 700),
                                         ("h Höhe: Abstand der Kreise", VIOLETT, 700)]):
        t.append(txt(xt, 22 + i * 11.5, z, farbe, 6.2, gew, "start"))
    return svg(B, H, t)


# ---------- Figur 6: Netz eines Zylinders — Rechteck u × h und zwei Kreise ----------

def fig_zylindernetz():
    r, h = 1.0, 2.0
    B, H = 250.0, 104.0
    setze_flaeche(B, H)
    s, x0 = 15.5, 26.0
    y_rect = 6.0 + 2 * r * s
    w, hh = 2 * math.pi * r * s, h * s
    gleich(w / s, 2 * math.pi * r, "Zylindernetz, Mantel so lang wie der Umfang")
    t = [vieleck([(x0, y_rect), (x0 + w, y_rect), (x0 + w, y_rect + hh), (x0, y_rect + hh)], SCHWARZ, ORANGE, 0.18, 0.9)]
    m_oben = (x0 + r * s + 6, y_rect - r * s)              # berührt die Oberkante
    m_unten = (x0 + w - r * s - 6, y_rect + hh + r * s)    # berührt die Unterkante
    gleich(y_rect - m_oben[1], r * s, "Zylindernetz, oberer Kreis berührt")
    gleich(m_unten[1] - (y_rect + hh), r * s, "Zylindernetz, unterer Kreis berührt")
    for m in (m_oben, m_unten):
        pts = [(m[0] + r * s * math.cos(2 * math.pi * i / 96), m[1] + r * s * math.sin(2 * math.pi * i / 96)) for i in range(96)]
        t.append(vieleck(pts, SCHWARZ, BLAU, 0.18, 0.9))
    t.append(lin(m_oben, (m_oben[0] + r * s, m_oben[1]), GRUEN, 1.2))
    t.append(txt(m_oben[0] + r * s / 2, m_oben[1] - 2.5, "r", GRUEN, 7.0, 700))
    t.append(txt(m_unten[0], m_unten[1] + 2.6, "G", BLAU, 7.6, 700))
    t.append(txt(x0 + w / 2 + 14, y_rect + hh / 2 + 2.4, "M = 2 · π · r · h", ORANGE, 6.8, 700))
    t.append(txt(x0 + w - 4, y_rect - 3, "u = 2 · π · r", ORANGE, 6.4, 700, "end"))
    t.append(txt(x0 - 3, y_rect + hh / 2 + 2.6, "h", VIOLETT, 7.6, 700, "end"))
    xt = 150
    for i, (z, farbe, gew) in enumerate([("Abgewickelt ist der Mantel", ORANGE, 700), ("ein Rechteck:", ORANGE, 700),
                                         ("so lang wie der Umfang,", SCHWARZ, 400), ("so breit wie die Höhe.", SCHWARZ, 400)]):
        t.append(txt(xt, 30 + i * 11.5, z, farbe, 6.4, gew, "start"))
    return svg(B, H, t)


# ---------- Figur 7: Oberfläche als Rechteck 2 · π · r × (r + h) — das Fast-Rechteck ----------

def fig_fastrechteck():
    r, h, n = 1.0, 1.35, 12          # n Sektoren je Kreis
    B, H = 250.0, 92.0
    setze_flaeche(B, H)
    s, x0, yb = 21.0, 22.0, 80.0     # yb: Unterkante des Mantels
    th = 2 * math.pi / n
    w = 2 * r * math.sin(th / 2)     # Breite eines Sektors an der Sehne
    L = 2 * math.pi * r
    t = [vieleck([(x0, yb - h * s), (x0 + L * s, yb - h * s), (x0 + L * s, yb), (x0, yb)], SCHWARZ, ORANGE, 0.18, 0.9)]
    # Die Sektoren beider Kreise abwechselnd mit der Spitze nach unten und nach oben gelegt. Die
    # Bögen wölben sich um r · (1 − cos(θ/2)) über die Sehnen; um so viel bleibt Luft über dem Mantel.
    luft = r * (1 - math.cos(th / 2)) + 0.06
    y0 = h + luft                    # Höhe der unteren Spitzen (in cm über der Unterkante)
    flaeche = 0.0
    gesamt = 2 * n
    x_start = (L - (n * w + w / 2)) / 2   # mittig über dem Mantel
    for k in range(gesamt):
        nach_unten = k % 2 == 0
        spitze_x = x_start + w / 2 + k * w / 2
        if nach_unten:
            spitze = (spitze_x, y0)
            winkel = [math.pi / 2 - th / 2 + th * i / 12 for i in range(13)]
            bogenpkt = [(spitze[0] + r * math.cos(a), spitze[1] + r * math.sin(a)) for a in winkel]
        else:
            spitze = (spitze_x, y0 + r * math.cos(th / 2))
            winkel = [-math.pi / 2 - th / 2 + th * i / 12 for i in range(13)]
            bogenpkt = [(spitze[0] + r * math.cos(a), spitze[1] + r * math.sin(a)) for a in winkel]
        pts = [spitze] + bogenpkt
        flaeche += th / 2 * r * r
        # Spitze unten: Sektoren des einen Kreises, Spitze oben: des anderen.
        t.append(vieleck([(x0 + x * s, yb - y * s) for x, y in pts], BLAU, BLAU, 0.18 if nach_unten else 0.36, 0.6))
    gleich(flaeche, 2 * math.pi * r * r, "Fast-Rechteck, zwei Kreise", 1e-9)
    # Seiten benachbarter Sektoren fallen zusammen: Die rechte Seite eines Sektors mit der Spitze
    # unten endet dort, wo die linke Seite des folgenden beginnt.
    rechts = (x_start + w / 2 + r * math.sin(th / 2), y0 + r * math.cos(th / 2))
    gleich(rechts[0], x_start + w, "Fast-Rechteck, Sektoren schließen an")
    # Oben liegen die n Bögen des einen Kreises, unten die des anderen: Jede Reihe ist so lang wie
    # ein Umfang, 2 · π · r. Die Sehnen sind etwas kürzer — daher „fast“ ein Rechteck.
    gleich(n * th * r, L, "Fast-Rechteck, Bögen einer Reihe")
    assert 0.97 * L < n * w < L, f"Fast-Rechteck: Sehnen {n * w} statt knapp {L}"
    oben = y0 + r
    t.append(txt(x0 + L * s / 2, yb - h * s / 2 + 2.4, "M = 2 · π · r · h", ORANGE, 6.8, 700))
    t.append(txt(x0 + L * s / 2, yb - oben * s - 3, "2 Kreise: 2 · π · r²", BLAU, 6.6, 700))
    t.append(txt(x0 + L * s / 2, yb + 9, "2 · π · r", SCHWARZ, 6.6, 700))
    t.append(txt(x0 - 3, yb - h * s / 2 + 2.4, "h", VIOLETT, 7.4, 700, "end"))
    t.append(txt(x0 - 3, yb - (y0 + r / 2) * s + 2.4, "r", GRUEN, 7.4, 700, "end"))
    xr = x0 + L * s + 6
    t.append(lin((xr, yb), (xr, yb - oben * s), SCHWARZ, 0.8))
    t.append(txt(xr + 4, yb - oben * s / 2 + 2.4, "r + h", SCHWARZ, 6.6, 700, "start"))
    return svg(B, H, t)


# ---------- Figur 8: Hohlzylinder — die Grundfläche ist ein Kreisring ----------

def fig_ring():
    R, r = 2.0, 1.15
    B, H = 250.0, 92.0
    setze_flaeche(B, H)
    s, m = 20.0, (52.0, 46.0)
    for k in (-1, 1):
        pruefe_im_bild(m[0] + k * R * s, m[1] + k * R * s, "Ring")
    d = (f"M {f(m[0] - R * s)} {f(m[1])} a {f(R * s)} {f(R * s)} 0 1 0 {f(2 * R * s)} 0 a {f(R * s)} {f(R * s)} 0 1 0 {f(-2 * R * s)} 0 Z "
         f"M {f(m[0] - r * s)} {f(m[1])} a {f(r * s)} {f(r * s)} 0 1 0 {f(2 * r * s)} 0 a {f(r * s)} {f(r * s)} 0 1 0 {f(-2 * r * s)} 0 Z")
    t = [f'<path d="{d}" fill="{BLAU}" fill-opacity="0.2" fill-rule="evenodd" stroke="{SCHWARZ}" stroke-width="0.9"/>']
    a1, a2 = math.radians(35), math.radians(200)
    pR = (m[0] + R * s * math.cos(a1), m[1] - R * s * math.sin(a1))
    pr = (m[0] + r * s * math.cos(a2), m[1] - r * s * math.sin(a2))
    gleich(math.dist(m, pR), R * s, "Ring, Außenradius")
    gleich(math.dist(m, pr), r * s, "Ring, Innenradius")
    t += [lin(m, pR, GRUEN, 1.2), lin(m, pr, ROT, 1.2)]
    # „R“ mitten im Ring über seine Linie, „r“ mitten im Loch — auf halber Länge des Außenradius läge
    # „R“ genau auf dem inneren Kreis.
    def an(a, abstand, quer):
        return (m[0] + abstand * math.cos(a) - quer * math.sin(a), m[1] - abstand * math.sin(a) - quer * math.cos(a))
    lR, lr = an(a1, (R + r) / 2 * s, 6), an(a2, r / 2 * s, -6)
    t.append(txt(lR[0], lR[1] + 2.5, "R", GRUEN, 7.4, 700, halo=True))
    t.append(txt(lr[0], lr[1] + 2.5, "r", ROT, 7.4, 700, halo=True))
    # Beispielzahlen der Formelsammlung: R = 5 cm, r = 3 cm, h = 10 cm.
    Rb, rb, hb = 5, 3, 10
    G = math.pi * (Rb ** 2 - rb ** 2)
    gleich(G, math.pi * Rb ** 2 - math.pi * rb ** 2, "Ring, Kreisring")
    gleich(round(G * hb, 2), 502.65, "Ring, Beispiel")
    xt = 112
    for i, (z, farbe, gew) in enumerate([("Kreisring: großer Kreis minus Loch", BLAU, 700),
                                         ("G = π · R² − π · r² = π · (R² − r²)", BLAU, 400),
                                         ("V = G · h = π · (R² − r²) · h", GRUEN, 700),
                                         (f"R = {Rb} cm, r = {rb} cm, h = {hb} cm:", SCHWARZ, 400),
                                         (f"V = π · ({Rb ** 2} − {rb ** 2}) · {hb} ≈ {de(G * hb, 2)} cm³", SCHWARZ, 400)]):
        t.append(txt(xt, 22 + i * 12, z, farbe, 6.4, gew, "start"))
    return svg(B, H, t)


FIGUREN = [fig_prisma, fig_schraegbild, fig_quadernetz, fig_halbquader, fig_zylinder, fig_zylindernetz, fig_fastrechteck, fig_ring]

if __name__ == "__main__":
    zeilen = [fn() for fn in FIGUREN]
    pfad = pathlib.Path(__file__).parent / "kp-figuren.txt"
    pfad.write_text("\n".join(zeilen) + "\n", encoding="utf-8")
    print(f"{len(zeilen)} Figuren geschrieben")
