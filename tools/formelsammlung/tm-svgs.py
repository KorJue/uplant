#!/usr/bin/env python3
"""Erzeugt die SVG-Figuren der Formelsammlung „Terme“ (Klasse 8, Terme, Themen 1 bis 5).

Jede Figur wird gerechnet, nicht gezeichnet: Hölzchen, Kacheln und Flächen entstehen aus denselben
Zahlen, die im Text daneben stehen, und das Skript rechnet mit, was die Formelsammlung behauptet —
Hölzchenzahl, Termwerte im Rechenbaum, Kachelzahlen, Flächeninhalte der Teile. Stimmt eine Zahl
nicht, bricht es ab. tf_kopf.pruefe_im_bild schlägt an, sobald etwas aus der Fläche ragt.

    python3 tm-svgs.py      schreibt tm-figuren.txt (eine Zeichnung je Zeile)
"""
import pathlib

from tf_kopf import (BLAU, GRUEN, ORANGE, ROT, VIOLETT, GRAU, SCHWARZ,
                     f, lin, rect, kreis, pruefe_im_bild, setze_flaeche, svg, txt)


def gleich(x, soll, was):
    assert abs(x - soll) < 1e-9, f"{was}: {x} statt {soll}"


def kachel(x, y, b, h, farbe, negativ=False):
    """Eine Kachel wie auf den Lernseiten: hell gefüllt, farbiger Rand; Minus rot gestrichelt."""
    if negativ:
        t = rect(x, y, b, h, ROT, ROT, 0.9, 0.12)
        t = t.replace("/>", ' stroke-dasharray="2 1.4"/>')
        return t + lin((x + b / 2 - min(2.2, b / 3), y + h / 2), (x + b / 2 + min(2.2, b / 3), y + h / 2), ROT, 0.9)
    return rect(x, y, b, h, farbe, farbe, 0.9, 0.16)


# Maße der Kacheln in Zeichenpunkten — dasselbe Verhältnis wie auf den Lernseiten (x : 1 ≈ 3,7).
U, LX = 6.0, 22.0


# ---------- Figur 1: Streichholzmuster, gezählt als 1 + 3 · n ----------

def fig_muster():
    n = 3
    B, H = 250.0, 62.0
    setze_flaeche(B, H)
    s, x0, y0 = 22.0, 18.0, 10.0
    hoelzer = []   # (x1, y1, x2, y2, gruppe)
    hoelzer.append((0, 0, 0, 1, 0))                     # das erste senkrechte Hölzchen
    for i in range(n):                                  # je Quadrat drei: oben, unten, rechts
        hoelzer += [(i, 1, i + 1, 1, i + 1), (i, 0, i + 1, 0, i + 1), (i + 1, 0, i + 1, 1, i + 1)]
    gleich(len(hoelzer), 3 * n + 1, "Muster, Hölzchen")
    farben = [GRAU, BLAU, VIOLETT, ORANGE]
    t = []
    for (a, b, c, d, g) in hoelzer:
        t.append(lin((x0 + a * s, y0 + (1 - b) * s), (x0 + c * s, y0 + (1 - d) * s), farben[g], 2.4))
    for i in range(n):
        t.append(txt(x0 + (i + 0.5) * s, y0 + s + 10, "3", farben[i + 1], 7.0, 700))
    t.append(txt(x0 - 6, y0 + s / 2 + 2.5, "1", GRAU, 7.0, 700, "end"))
    t.append(txt(x0 + n * s + 16, y0 + s / 2 - 2, f"n = {n} Quadrate:", SCHWARZ, 7.0, 400, "start"))
    t.append(txt(x0 + n * s + 16, y0 + s / 2 + 8, f"1 + 3 · {n} = {3 * n + 1} Hölzchen", SCHWARZ, 7.0, 700, "start"))
    t.append(txt(x0 + n * s + 16, y0 + s / 2 + 18, "Term: 1 + 3 · n = 3n + 1", BLAU, 7.0, 700, "start"))
    return svg(B, H, t)


# ---------- Figur 2: Rechenbaum für 2 · (x − 3) bei x = 5 ----------

def fig_baum():
    x = 5
    B, H = 160.0, 86.0
    setze_flaeche(B, H)
    k = {"x": (38, 70), "3": (82, 70), "2": (122, 44), "-": (60, 44), "*": (92, 16)}
    werte = {"x": x, "3": 3, "2": 2, "-": x - 3, "*": 2 * (x - 3)}
    gleich(werte["*"], 4, "Rechenbaum, Wurzel")
    t = [lin(k["x"], k["-"], GRAU, 0.9), lin(k["3"], k["-"], GRAU, 0.9), lin(k["-"], k["*"], GRAU, 0.9), lin(k["2"], k["*"], GRAU, 0.9)]
    zeichen = {"x": "x", "3": "3", "2": "2", "-": "−", "*": "·"}
    for name, (px, py) in k.items():
        farbe = VIOLETT if name == "x" else GRUEN if name == "*" else SCHWARZ
        t.append(kreis((px, py), 7.5, farbe, "#ffffff", 1.4 if name == "*" else 1.0))
        t.append(txt(px, py + 2.6, zeichen[name], farbe, 8.0, 700))
        t.append(txt(px + 10, py + 2.6, f"= {werte[name]}", GRUEN if name != "x" else VIOLETT, 6.4, 700, "start"))
    t.append(txt(8, 84, "unten zuerst, oben der letzte Schritt", GRAU, 6.0, 400, "start"))
    return svg(B, H, t)


# ---------- Figur 3: Kacheln — gleichartig und Nullpaar ----------

def fig_kacheln():
    B, H = 250.0, 60.0
    setze_flaeche(B, H)
    t = []
    x, y = 10.0, 10.0
    t.append(kachel(x, y, LX, LX, BLAU)); t.append(txt(x + LX / 2, y + LX + 9, "x²", BLAU, 7.0, 700))
    x += LX + 14
    t.append(kachel(x, y, U, LX, VIOLETT)); t.append(txt(x + U / 2, y + LX + 9, "x", VIOLETT, 7.0, 700))
    x += U + 14
    t.append(kachel(x, y + LX - U, U, U, GRUEN)); t.append(txt(x + U / 2, y + LX + 9, "1", GRUEN, 7.0, 700))
    x += U + 22
    # Nullpaar: x und −x
    t.append(kachel(x, y, U, LX, VIOLETT)); t.append(kachel(x + U + 3, y, U, LX, VIOLETT, negativ=True))
    t.append(txt(x + U + 1.5, y + LX + 9, "x − x = 0", ROT, 6.6, 700))
    x += 2 * U + 34
    # 4x + 5 − x − 2 sortiert: drei x bleiben, drei Einer bleiben
    plus_x, minus_x, plus_1, minus_1 = 4, 1, 5, 2
    # 4x + 5 − x − 2, nach Sorten gelegt: Jede Minus-Kachel liegt neben einer Plus-Kachel ihrer Sorte.
    xi = x
    for i in range(plus_x):
        t.append(kachel(xi, y, U, LX, VIOLETT)); xi += U + 2
    for i in range(minus_x):
        t.append(kachel(xi, y, U, LX, VIOLETT, negativ=True)); xi += U + 2
    xi += 6
    for i in range(plus_1):
        t.append(kachel(xi, y + LX - U, U, U, GRUEN)); xi += U + 2
    for i in range(minus_1):
        t.append(kachel(xi, y + LX - U, U, U, GRUEN, negativ=True)); xi += U + 2
    gleich(plus_x - minus_x, 3, "Kacheln, x-Glieder")
    gleich(plus_1 - minus_1, 3, "Kacheln, Einer")
    t.append(txt((x + xi) / 2, y + LX + 9, "4x + 5 − x − 2 = 3x + 3", SCHWARZ, 6.6, 700))
    return svg(B, H, t)


# ---------- Figur 4: Distributivgesetz 3 · (2x + 3) ----------

def fig_distributiv():
    k, m, c = 3, 2, 3
    B, H = 250.0, 66.0
    setze_flaeche(B, H)
    s = 1.35
    lx, u = LX * s, U * s
    x0, y0, spalt = 26.0, 12.0, 18.0
    t = []
    for r in range(k):
        for i in range(m):
            t.append(kachel(x0 + i * lx, y0 + r * u, lx, u, VIOLETT))
        for i in range(c):
            t.append(kachel(x0 + m * lx + spalt + i * u, y0 + r * u, u, u, GRUEN))
    gleich(k * m, 6, "Distributivgesetz, x-Streifen")
    gleich(k * c, 9, "Distributivgesetz, Einer")
    t.append(txt(x0 - 5, y0 + k * u / 2 + 2.5, str(k), BLAU, 7.4, 700, "end"))
    t.append(txt(x0 + m * lx / 2, y0 - 3, f"{m}x", VIOLETT, 7.0, 700))
    t.append(txt(x0 + m * lx + spalt + c * u / 2, y0 - 3, str(c), GRUEN, 7.0, 700))
    t.append(txt(x0 + m * lx / 2, y0 + k * u + 10, f"{k} · {m}x = {k * m}x", VIOLETT, 6.8, 700))
    t.append(txt(x0 + m * lx + spalt + c * u / 2, y0 + k * u + 10, f"{k} · {c} = {k * c}", GRUEN, 6.8, 700))
    t.append(txt(178, y0 + 12, "3 · (2x + 3)", SCHWARZ, 7.4, 700))
    t.append(txt(178, y0 + 24, "= 6x + 9", SCHWARZ, 7.4, 700))
    return svg(B, H, t)


# ---------- Figur 5: (x + 3) · (x + 2) — vier Rechtecke ----------

def fig_summe():
    a, b = 3, 2
    B, H = 250.0, 78.0
    setze_flaeche(B, H)
    lx, u = LX * 1.25, U * 1.25
    x0, y0, spalt = 30.0, 12.0, 8.0
    t = [kachel(x0, y0, lx, lx, BLAU)]
    for i in range(a):
        t.append(kachel(x0 + lx + spalt + i * u, y0, u, lx, VIOLETT))
    for r in range(b):
        t.append(kachel(x0, y0 + lx + spalt + r * u, lx, u, VIOLETT))
        for i in range(a):
            t.append(kachel(x0 + lx + spalt + i * u, y0 + lx + spalt + r * u, u, u, GRUEN))
    gleich(1 + a + b + a * b, 12, "Summe mal Summe, Kacheln")
    t.append(txt(x0 + lx / 2, y0 - 3, "x", VIOLETT, 7.0, 700))
    t.append(txt(x0 + lx + spalt + a * u / 2, y0 - 3, str(a), GRUEN, 7.0, 700))
    t.append(txt(x0 - 5, y0 + lx / 2 + 2.5, "x", VIOLETT, 7.0, 700, "end"))
    t.append(txt(x0 - 5, y0 + lx + spalt + b * u / 2 + 2.5, str(b), GRUEN, 7.0, 700, "end"))
    xt = 120
    for i, z in enumerate(["(x + 3) · (x + 2)", "= x · x + x · 2 + 3 · x + 3 · 2", "= x² + 2x + 3x + 6", "= x² + 5x + 6"]):
        t.append(txt(xt, y0 + 8 + i * 12, z, SCHWARZ, 6.8, 700 if i in (0, 3) else 400, "start"))
    return svg(B, H, t)


# ---------- Figuren 6 bis 8: die binomischen Formeln (a = 5, b = 2) ----------

A, Bb = 5.0, 2.0
S6 = 9.0


def fig_bin1():
    a, b, s = A, Bb, S6
    gleich((a + b) ** 2, a * a + 2 * a * b + b * b, "erste binomische Formel")
    B, H = 110.0, 84.0
    setze_flaeche(B, H)
    x0, y0, g = 16.0, 12.0, 3.0
    t = [rect(x0, y0, a * s, a * s, BLAU, BLAU, 0.9, 0.16),
         rect(x0 + a * s + g, y0, b * s, a * s, ORANGE, ORANGE, 0.9, 0.18),
         rect(x0, y0 + a * s + g, a * s, b * s, ORANGE, ORANGE, 0.9, 0.18),
         rect(x0 + a * s + g, y0 + a * s + g, b * s, b * s, GRUEN, GRUEN, 0.9, 0.18)]
    t += [txt(x0 + a * s / 2, y0 + a * s / 2 + 2.5, "a²", BLAU, 7.4, 700),
          txt(x0 + a * s + g + b * s / 2, y0 + a * s / 2 + 2.5, "ab", ORANGE, 6.6, 700),
          txt(x0 + a * s / 2, y0 + a * s + g + b * s / 2 + 2.5, "ab", ORANGE, 6.6, 700),
          txt(x0 + a * s + g + b * s / 2, y0 + a * s + g + b * s / 2 + 2.5, "b²", GRUEN, 6.0, 700),
          txt(x0 + a * s / 2, y0 - 3, "a", BLAU, 6.8, 700), txt(x0 + a * s + g + b * s / 2, y0 - 3, "b", GRUEN, 6.8, 700)]
    return svg(B, H, t)


def fig_bin2():
    a, b, s = A, Bb, S6
    gleich((a - b) ** 2, a * a - 2 * a * b + b * b, "zweite binomische Formel")
    B, H = 110.0, 84.0
    setze_flaeche(B, H)
    x0, y0 = 16.0, 12.0
    t = [rect(x0, y0, a * s, a * s, GRAU, "none", 0.8),
         rect(x0, y0, (a - b) * s, (a - b) * s, BLAU, BLAU, 0.9, 0.16),
         rect(x0 + (a - b) * s, y0, b * s, a * s, ORANGE, ORANGE, 0.9, 0.16),
         rect(x0, y0 + (a - b) * s, a * s, b * s, ORANGE, ORANGE, 0.9, 0.16),
         rect(x0 + (a - b) * s, y0 + (a - b) * s, b * s, b * s, GRUEN, GRUEN, 1.0, 0.35)]
    t += [txt(x0 + (a - b) * s / 2, y0 + (a - b) * s / 2 + 2.5, "(a − b)²", BLAU, 6.4, 700),
          txt(x0 + (a - b) * s + b * s / 2, y0 + (a - b) * s / 2 + 2.5, "ab", ORANGE, 6.4, 700),
          txt(x0 + (a - b) * s / 2, y0 + (a - b) * s + b * s / 2 + 2.5, "ab", ORANGE, 6.4, 700),
          txt(x0 + (a - b) * s + b * s / 2, y0 + (a - b) * s + b * s / 2 + 2.5, "b²", GRUEN, 6.0, 700),
          txt(x0 + a * s / 2, y0 - 3, "a", BLAU, 6.8, 700)]
    # Die beiden Streifen ab überdecken sich im Eckquadrat b²: zweimal weg, einmal zurück.
    gleich(a * a - 2 * a * b + b * b, (a - b) ** 2, "zweite Formel, Flächen")
    return svg(B, H, t)


def fig_bin3():
    a, b, s = A, Bb, S6 * 0.85
    gleich((a + b) * (a - b), a * a - b * b, "dritte binomische Formel")
    B, H = 150.0, 84.0
    setze_flaeche(B, H)
    x0, y0 = 10.0, 14.0
    t = [rect(x0, y0, a * s, (a - b) * s, BLAU, BLAU, 0.9, 0.16),
         rect(x0, y0 + (a - b) * s, (a - b) * s, b * s, ORANGE, ORANGE, 0.9, 0.18),
         rect(x0 + (a - b) * s, y0 + (a - b) * s, b * s, b * s, GRAU, "none", 0.7)]
    t[-1] = t[-1].replace("/>", ' stroke-dasharray="2 1.5"/>')
    t.append(txt(x0 + (a - b / 2) * s, y0 + (a - b / 2) * s + 2.4, "b²", GRAU, 6.0, 700))
    t.append(txt(x0 + a * s + 9, y0 + (a - b) * s / 2 + 2.5, "→", SCHWARZ, 9.0, 700))
    # Rechts: das Rechteck (a + b) × (a − b), der Streifen umgelegt.
    x1 = x0 + a * s + 20
    t += [rect(x1, y0, a * s, (a - b) * s, BLAU, BLAU, 0.9, 0.16),
          rect(x1 + a * s, y0, b * s, (a - b) * s, ORANGE, ORANGE, 0.9, 0.18),
          txt(x1 + (a + b) * s / 2, y0 - 3.5, "a + b", SCHWARZ, 6.6, 700),
          txt(x1 + (a + b) * s / 2, y0 + (a - b) * s + 10, "a − b hoch", SCHWARZ, 6.2, 400)]
    gleich(a * (a - b) + (a - b) * b, (a + b) * (a - b), "dritte Formel, umgelegt")
    gleich(a * (a - b) + (a - b) * b, a * a - b * b, "dritte Formel, Flächen")
    return svg(B, H, t)


FIGUREN = [fig_muster, fig_baum, fig_kacheln, fig_distributiv, fig_summe, fig_bin1, fig_bin2, fig_bin3]

if __name__ == "__main__":
    zeilen = [fn() for fn in FIGUREN]
    pfad = pathlib.Path(__file__).parent / "tm-figuren.txt"
    pfad.write_text("\n".join(zeilen) + "\n", encoding="utf-8")
    print(f"{len(zeilen)} Figuren geschrieben")
