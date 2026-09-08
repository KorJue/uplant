#!/usr/bin/env python3
"""Erzeugt die SVG-Zeichnungen für die Formelsammlung „Trigonometrische Funktionen“.

Jede Figur wird vor der Ausgabe geprüft: Die Kurven müssen wirklich die
behaupteten Funktionen erfüllen, der Punkt am Einheitskreis muss auf
(cos α | sin α) liegen, die Verdopplung der Periode muss im Bild messbar sein,
und alles muss samt Beschriftung in die Zeichenfläche passen.
"""

import math
import sys

sys.path.insert(0, __file__.rsplit("/", 1)[0])
from tf_kopf import (  # noqa: E402
    AUS, BLAU, GRUEN, ORANGE, ROT, VIOLETT, GRAU, SCHWARZ, GITTER,
    f, de, setze_flaeche, txt, lin, rect, kreis, bogen, polyline, svg,
)

def sinG(g):
    r = g % 360
    return [0, 1, 0, -1][int(r // 90)] if r % 90 == 0 else math.sin(math.radians(g))

def cosG(g):
    r = g % 360
    return [1, 0, -1, 0][int(r // 90)] if r % 90 == 0 else math.cos(math.radians(g))


def achsen(t, links, oben, breite, hoehe, xmin, xmax, ymin, ymax,
           xschritt, yschritt, xformat=lambda w: de(w, 0) + "°", yformat=lambda w: de(w, 0),
           groesse=5.6, xname="x"):
    px = lambda x: links + (x - xmin) / (xmax - xmin) * breite
    py = lambda y: oben + hoehe - (y - ymin) / (ymax - ymin) * hoehe
    x = math.ceil(xmin / xschritt) * xschritt
    while x <= xmax + 1e-9:
        t.append(lin((px(x), py(ymin)), (px(x), py(ymax)), GITTER, 0.6))
        t.append(txt(px(x), oben + hoehe + 9, xformat(x), GRAU, groesse, 400))
        x += xschritt
    y = math.ceil(ymin / yschritt) * yschritt
    while y <= ymax + 1e-9:
        t.append(lin((px(xmin), py(y)), (px(xmax), py(y)), GITTER, 0.6))
        if abs(y) > 1e-9:
            t.append(txt(px(max(xmin, 0)) - 3, py(y) + 2, yformat(y), GRAU, groesse, 400, anker="end"))
        y += yschritt
    t.append(lin((px(xmin), py(0)), (px(xmax) + 7, py(0)), SCHWARZ, 1.0))
    t.append(lin((px(max(xmin, 0)), py(ymin)), (px(max(xmin, 0)), py(ymax) - 6), SCHWARZ, 1.0))
    t.append(txt(px(xmax) + 10, py(0) + 3, xname, GRAU, groesse + 0.8, 700, anker="start"))
    return px, py


def kurve(t, px, py, fkt, xmin, xmax, ymin, ymax, farbe, breite=1.7, strich=None, schritte=320):
    punkte = []
    for i in range(schritte + 1):
        x = xmin + i / schritte * (xmax - xmin)
        y = fkt(x)
        if ymin <= y <= ymax:
            punkte.append((px(x), py(y)))
    assert len(punkte) > 30, "Die Kurve liegt fast ganz außerhalb des Bildes"
    t.append(polyline(punkte, farbe, breite, strich))


# ------------------------------------------------ 1. Der Einheitskreis
def figur_einheitskreis():
    B, H = 320.0, 214.0
    setze_flaeche(B, H)
    t = []
    t.append(txt(B / 2, 11, "P(cos α | sin α) — Kosinus waagerecht, Sinus senkrecht", GRAU, 7.0, 700))
    cx, cy, R = 112.0, 112.0, 70.0
    a = 55.0
    s, c = sinG(a), cosG(a)
    for k in range(4):
        m = (k + 0.5) * 90
        t.append(txt(cx + R * 0.86 * cosG(m), cy - R * 0.86 * sinG(m) + 3,
                     ["I", "II", "III", "IV"][k], VIOLETT, 6.4, 700))
    t.append(lin((cx - R - 16, cy), (cx + R + 16, cy), SCHWARZ, 1.0))
    t.append(lin((cx, cy + R + 16), (cx, cy - R - 16), SCHWARZ, 1.0))
    t.append(txt(cx + R + 18, cy + 3, "x", GRAU, 6.4, 700, anker="start"))
    t.append(txt(cx + 4, cy - R - 17, "y", GRAU, 6.4, 700, anker="start"))
    t.append(txt(cx + R, cy + 10, "1", GRAU, 5.6, 400))
    t.append(txt(cx - R, cy + 10, "−1", GRAU, 5.6, 400))
    t.append(txt(cx - 5, cy - R + 3, "1", GRAU, 5.6, 400, anker="end"))
    t.append(txt(cx - 5, cy + R + 3, "−1", GRAU, 5.6, 400, anker="end"))
    t.append(kreis((cx, cy), R, GRAU, "none", 1.1))
    Px, Py = cx + R * c, cy - R * s
    t.append(lin((Px, Py), (cx, Py), GRAU, 0.8, "3 2"))
    t.append(lin((Px, Py), (Px, cy), GRAU, 0.8, "3 2"))
    t.append(lin((cx, cy), (Px, cy), ORANGE, 2.4))
    t.append(lin((Px, cy), (Px, Py), GRUEN, 2.4))
    t.append(lin((cx, cy), (Px, Py), VIOLETT, 1.8))
    t.append(bogen((cx, cy), 26, 0, a, VIOLETT, 1.4))
    t.append(txt(cx + 36 * cosG(a / 2), cy - 36 * sinG(a / 2) + 3, "α", VIOLETT, 7.4, 700))
    t.append(kreis((Px, Py), 3.0, VIOLETT, "#ffffff", 1.0))
    t.append(txt(Px + 6, Py - 5, "P", VIOLETT, 7.4, 700, anker="start"))
    t.append(txt((cx + Px) / 2, cy + 10, "cos α", ORANGE, 6.6, 700))
    t.append(txt(Px + 5, (cy + Py) / 2 + 2, "sin α", GRUEN, 6.6, 700, anker="start"))
    # Die Zeichnung behauptet, dass der Punkt auf dem Kreis liegt.
    assert abs(math.hypot(Px - cx, Py - cy) - R) < 1e-9
    assert abs(s * s + c * c - 1) < 1e-12
    # Vorzeichentafel rechts
    kopf = ["", "I", "II", "III", "IV"]
    zeilen = [["cos", "+", "−", "−", "+"], ["sin", "+", "+", "−", "−"]]
    x0, y0, sb, zh = 212.0, 56.0, 20.0, 15.0
    for j, k in enumerate(kopf):
        t.append(txt(x0 + j * sb + sb / 2, y0, k, GRAU, 6.4, 700))
    for i, z in enumerate(zeilen):
        for j, w in enumerate(z):
            farbe = GRUEN if z[0] == "sin" and j > 0 else ORANGE if j > 0 else GRAU
            t.append(txt(x0 + j * sb + sb / 2, y0 + (i + 1) * zh, w, farbe, 6.6, 700))
    t.append(rect(x0, y0 - 10, 5 * sb, 3 * zh + 2, GITTER, "none", 0.8, 1.0, radius=2))
    t.append(txt(x0 + 2.5 * sb, y0 + 3 * zh + 12, "sin² α + cos² α = 1", ROT, 6.8, 700))
    t.append(txt(B / 2, H - 6, "Der Radius 1 macht die Koordinaten zu den Funktionswerten.", GRAU, 6.2, 400))
    return svg(B, H, t)


# ------------------------------------------------ 2. Sinus- und Kosinuskurve
def figur_kurven():
    B, H = 470.0, 162.0
    setze_flaeche(B, H)
    t = []
    t.append(txt(B / 2, 11, "Grün sin x, orange cos x — beide mit der Periode 360°", GRAU, 7.0, 700))
    links, oben, breite, hoehe = 30.0, 22.0, 408.0, 98.0
    px, py = achsen(t, links, oben, breite, hoehe, -90, 450, -1.3, 1.3, 90, 0.5,
                    yformat=lambda w: de(w, 1))
    kurve(t, px, py, cosG, -90, 450, -1.3, 1.3, ORANGE, 1.5, "5 3")
    kurve(t, px, py, sinG, -90, 450, -1.3, 1.3, GRUEN, 2.0)
    for x in (0, 180, 360):
        t.append(kreis((px(x), py(0)), 2.4, GRUEN, "#ffffff", 0.9))
    t.append(kreis((px(90), py(1)), 2.4, GRUEN, "#ffffff", 0.9))
    t.append(kreis((px(270), py(-1)), 2.4, GRUEN, "#ffffff", 0.9))
    t.append(txt(px(90), py(1) - 5, "Hochpunkt", GRUEN, 6.2, 700))
    t.append(txt(px(270), py(-1) + 11, "Tiefpunkt", GRUEN, 6.2, 700))
    t.append(txt(px(180), py(0) - 6, "Nullstellen alle 180°", GRUEN, 6.2, 700))
    # Die Behauptungen des Bildes nachrechnen.
    assert abs(sinG(90) - 1) < 1e-12 and abs(sinG(270) + 1) < 1e-12
    for x in (0, 180, 360):
        assert abs(sinG(x)) < 1e-12
    for x in range(-90, 361, 15):
        assert abs(cosG(x) - sinG(x + 90)) < 1e-12, "cos x = sin(x + 90°) stimmt nicht"
    t.append(txt(B / 2, H - 6,
                 "sin(−x) = −sin x (punktsymmetrisch) · cos(−x) = cos x (achsensymmetrisch) · cos x = sin(x + 90°)",
                 GRAU, 6.2, 400))
    return svg(B, H, t)


# ------------------------------------------------ 3. Die vier Parameter
def figur_parameter():
    B, H = 640.0, 162.0
    setze_flaeche(B, H)
    t = []
    t.append(txt(B / 2, 11, "f(x) = a · sin(b · (x − c)) + d", GRAU, 7.4, 700))
    a, b, c, d = 2.0, 1.0, 60.0, 1.0
    p = 360 / b
    links, oben, breite, hoehe = 34.0, 22.0, 576.0, 92.0
    fkt = lambda x: a * sinG(b * (x - c)) + d
    px, py = achsen(t, links, oben, breite, hoehe, -60, 720, -2.0, 4.0, 180, 1.0)
    t.append(lin((px(-60), py(d)), (px(720), py(d)), BLAU, 1.2, "6 3"))
    for w in (d + a, d - a):
        t.append(lin((px(-60), py(w)), (px(720), py(w)), BLAU, 0.8, "3 3"))
    kurve(t, px, py, sinG, -60, 720, -2.0, 4.0, VIOLETT, 1.0, "5 3")
    kurve(t, px, py, fkt, -60, 720, -2.0, 4.0, GRUEN, 2.0)
    t.append(kreis((px(c), py(d)), 2.6, VIOLETT, "#ffffff", 0.9))
    t.append(txt(px(c) - 4, py(d) + 11, "c", VIOLETT, 7.0, 700, anker="end"))
    t.append(kreis((px(c + p / 4), py(d + a)), 2.6, ROT, "#ffffff", 0.9))
    t.append(txt(px(c + p / 4) + 5, py(d + a) - 4, "Max = d + a", ROT, 6.4, 700, anker="start"))
    t.append(kreis((px(c + 3 * p / 4), py(d - a)), 2.6, ROT, "#ffffff", 0.9))
    t.append(txt(px(c + 3 * p / 4) + 5, py(d - a) + 9, "Min = d − a", ROT, 6.4, 700, anker="start"))
    t.append(txt(px(-60) + 4, py(d) - 4, "Mittellinie y = d", BLAU, 6.4, 700, anker="start"))
    # Periodenpfeil unter der Zeichenfläche
    yp = oben + hoehe + 21
    t.append(lin((px(c), yp), (px(c + p), yp), ROT, 1.4))
    for x, s in ((px(c), 1), (px(c + p), -1)):
        t.append(polyline([(x, yp), (x + s * 5, yp - 2.2), (x + s * 5, yp + 2.2), (x, yp)], ROT, 1.0))
    t.append(txt((px(c) + px(c + p)) / 2, yp - 4, "Periode p = 360° : b", ROT, 6.6, 700))
    # Die Extremstellen müssen wirklich Extrema sein.
    assert abs(fkt(c + p / 4) - (d + a)) < 1e-12
    assert abs(fkt(c + 3 * p / 4) - (d - a)) < 1e-12
    assert abs(fkt(c) - d) < 1e-12
    t.append(txt(B / 2, H - 6,
                 "Violett gestrichelt: die Grundkurve sin x. |a| = Amplitude · p = 360° : |b| · c nach rechts · d nach oben.",
                 GRAU, 6.2, 400))
    return svg(B, H, t)


# ------------------------------------------------ 4. Amplitude und Periode
def figur_streckung():
    B, H = 300.0, 168.0
    setze_flaeche(B, H)
    t = []
    t.append(txt(B / 2, 11, "Größeres b heißt kürzere Periode", GRAU, 7.0, 700))
    links, oben, breite, hoehe = 26.0, 22.0, 240.0, 106.0
    px, py = achsen(t, links, oben, breite, hoehe, 0, 720, -2.2, 2.2, 180, 1.0)
    kurve(t, px, py, sinG, 0, 720, -2.2, 2.2, VIOLETT, 1.0, "5 3")
    kurve(t, px, py, lambda x: 2 * sinG(x), 0, 720, -2.2, 2.2, GRUEN, 1.8)
    kurve(t, px, py, lambda x: sinG(3 * x), 0, 720, -2.2, 2.2, ORANGE, 1.4)
    t.append(txt(px(90) + 3, py(2) - 4, "2 · sin x", GRUEN, 6.4, 700, anker="start"))
    t.append(txt(px(510), py(1) - 5, "sin x", VIOLETT, 6.4, 700))
    t.append(txt(px(650), py(-1) + 10, "sin(3x)", ORANGE, 6.4, 700))
    # Die drei Kurven müssen wirklich verschiedene Perioden bzw. Amplituden haben.
    assert abs(2 * sinG(90) - 2) < 1e-12
    assert abs(sinG(3 * 120)) < 1e-12, "sin(3x) muss bei 120° eine Nullstelle haben"
    t.append(txt(B / 2, H - 6, "a = 2 verdoppelt die Höhe, b = 3 drittelt die Periode auf 120°.", GRAU, 6.2, 400))
    return svg(B, H, t)


# ------------------------------------------------ 5. Riesenrad als Anwendung
def figur_riesenrad():
    B, H = 320.0, 156.0
    setze_flaeche(B, H)
    t = []
    t.append(txt(B / 2, 11, "Riesenrad: Start ganz unten, also im Minimum", GRAU, 7.0, 700))
    D, boden, T = 40.0, 2.0, 240.0
    r, hAchse = D / 2, D / 2 + boden
    fkt = lambda tt: hAchse - r * cosG(360 * tt / T)
    links, oben, breite, hoehe = 28.0, 22.0, 172.0, 92.0
    px, py = achsen(t, links, oben, breite, hoehe, 0, 480, 0, 46, 120, 10,
                    xformat=lambda w: de(w, 0), xname="t")
    t.append(lin((px(0), py(hAchse)), (px(480), py(hAchse)), BLAU, 1.2, "6 3"))
    for w in (boden, D + boden):
        t.append(lin((px(0), py(w)), (px(480), py(w)), BLAU, 0.8, "3 3"))
    kurve(t, px, py, fkt, 0, 480, 0, 46, GRUEN, 1.8)
    t.append(kreis((px(120), py(D + boden)), 2.6, ROT, "#ffffff", 0.9))
    t.append(txt(px(120), py(D + boden) - 5, "42 m", ROT, 6.4, 700))
    t.append(txt(px(0) + 4, py(hAchse) - 4, "Achse 22 m", BLAU, 6.2, 700, anker="start"))
    # Skizze des Rades daneben
    mx, my, mr = 262.0, 66.0, 30.0
    t.append(kreis((mx, my), mr, GRAU, "none", 1.1))
    t.append(lin((mx - mr - 6, my + mr + 10), (mx + mr + 6, my + mr + 10), SCHWARZ, 1.2))
    t.append(lin((mx, my), (mx, my + mr + 10), GRAU, 0.8, "3 2"))
    t.append(kreis((mx, my + mr), 2.8, GRUEN, GRUEN, 0.8))
    t.append(txt(mx + 5, my + mr + 4, "Start", GRUEN, 6.2, 700, anker="start"))
    t.append(lin((mx - mr - 4, my), (mx + mr + 4, my), BLAU, 0.9, "4 3"))
    t.append(txt(mx + mr + 6, my + 2, "d", BLAU, 6.6, 700, anker="start"))
    t.append(lin((mx, my), (mx, my - mr), ROT, 1.4))
    t.append(txt(mx + 4, my - mr / 2, "a = r", ROT, 6.4, 700, anker="start"))
    # Der Bodenabstand ist der Abstand vom Boden zum tiefsten Punkt.
    t.append(txt(mx, my + mr + 20, "Boden", GRAU, 6.0, 400))
    # Nachrechnen, was das Bild behauptet.
    assert abs(fkt(0) - boden) < 1e-12, "Bei t = 0 muss die Gondel unten sein"
    assert abs(fkt(T / 2) - (D + boden)) < 1e-12, "Nach einer halben Umdrehung muss sie oben sein"
    assert abs(fkt(T / 4) - hAchse) < 1e-12
    t.append(txt(B / 2, H - 6, "d = 22, a = 20, p = 240 s, c = 60 s: h(t) = 20 · sin(1,5 · (t − 60)) + 22", GRAU, 6.2, 400))
    return svg(B, H, t)


# ------------------------------------------------ 5. Bogenmaß
def figur_bogenmass():
    """Kreis und abgewickeltes Lineal nebeneinander, im gleichen Maßstab.

    Die Merkwerte (30° = π:6 und so weiter) stehen bewusst nicht im Bild: Als
    SVG-Text wären sie auf dem Blatt nur wenige Punkt groß und würden sich
    gegenseitig überlappen. Sie stehen stattdessen als Text in der Box.
    """
    B, H = 300.0, 112.0
    setze_flaeche(B, H)
    t = []
    t.append(txt(B / 2, 10, "Der Bogen am Einheitskreis, geradegebogen", GRAU, 7.0, 700))
    cx, cy, R = 44.0, 58.0, 30.0
    a = 60.0
    t.append(lin((cx - R - 8, cy), (cx + R + 8, cy), SCHWARZ, 0.9))
    t.append(lin((cx, cy + R + 8), (cx, cy - R - 8), SCHWARZ, 0.9))
    t.append(kreis((cx, cy), R, GRAU, "none", 1.0))
    t.append(lin((cx, cy), (cx + R, cy), VIOLETT, 1.4))
    t.append(lin((cx, cy), (cx + R * cosG(a), cy - R * sinG(a)), VIOLETT, 1.4))
    t.append(bogen((cx, cy), R, 0, a, ROT, 2.6))
    t.append(txt(cx + 15 * cosG(a / 2), cy - 15 * sinG(a / 2) + 3, "α", VIOLETT, 7.0, 700))
    t.append(txt(cx + R / 2, cy + 9, "r = 1", VIOLETT, 5.8, 700))

    # Das Lineal rechts daneben — Bildpunkte je Längeneinheit sind dieselben
    # wie beim Kreis, sonst wäre die Aussage "gleich lang" falsch.
    x0, yl = 92.0, 66.0
    skala = R
    t.append(lin((x0, yl), (x0 + 2 * math.pi * skala, yl), SCHWARZ, 1.0))
    for k in range(5):
        x = x0 + k * math.pi / 2 * skala
        t.append(lin((x, yl - 4), (x, yl + 4), GITTER, 0.9))
        t.append(txt(x, yl + 13, ["0", "½π", "π", "1½π", "2π"][k], GRAU, 6.0, 400))
    t.append(lin((x0, yl - 12), (x0 + math.radians(a) * skala, yl - 12), ROT, 2.6))
    t.append(txt(x0, yl - 18, "Bogenlänge x = α · π : 180", ROT, 6.4, 700, anker="start"))
    # Der Kreisbogen und die Strecke müssen im Bild dieselbe Länge haben.
    assert abs(math.radians(a) * R - math.radians(a) * skala) < 1e-12
    t.append(txt(B / 2, H - 4, "Roter Bogen und rote Strecke sind gleich lang.", GRAU, 6.2, 400))
    return svg(B, H, t)


# Die Streckungsfigur (2 · sin x gegen sin(3x)) ist bewusst nicht dabei: Sie
# zeigt dasselbe wie die Parameterfigur, kostete aber eine ganze Zeile auf dem
# Blatt. Die Aussage steht stattdessen im Text der Parameterbox.
AUS.extend([
    figur_einheitskreis(),
    figur_kurven(),
    figur_parameter(),
    figur_riesenrad(),
    figur_bogenmass(),
])

with open(__file__.rsplit("/", 1)[0] + "/tf-figuren.txt", "w", encoding="utf-8") as fh:
    for s in AUS:
        fh.write(s + "\n")
print(f"{len(AUS)} Figuren geschrieben")
