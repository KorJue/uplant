#!/usr/bin/env python3
"""Erzeugt die SVG-Figuren der Formelsammlung „Terme“ (Klasse 8, Terme, Themen 1 bis 5).

Jede Figur wird gerechnet, nicht gezeichnet: Hölzchen, Kacheln und Flächen entstehen aus denselben
Zahlen, die im Text daneben stehen, und das Skript rechnet mit, was die Formelsammlung behauptet —
Hölzchenzahl, Termwerte im Rechenbaum, Kachelzahlen, Flächeninhalte der Teile. Stimmt eine Zahl
nicht, bricht es ab. tf_kopf.pruefe_im_bild schlägt an, sobald etwas aus der Fläche ragt.

    python3 tm-svgs.py      schreibt tm-figuren.txt (eine Zeichnung je Zeile)
"""
import pathlib
import re

from tf_kopf import (BLAU, GRUEN, ORANGE, ROT, VIOLETT, GRAU, SCHWARZ,
                     f, lin, rect, kreis, pruefe_im_bild, setze_flaeche, svg, txt)


def gleich(x, soll, was):
    assert abs(x - soll) < 1e-9, f"{was}: {x} statt {soll}"


# ---------- Terme nachrechnen ----------
# Jede Gleichung der Formelsammlung wird hier an mehreren krummen Stellen ausgewertet — mit Pythons
# eigener Klammer- und Vorzeichenrechnung, nicht mit den Regeln, die die Formelsammlung lehrt.

STELLEN = [{"a": 1.7, "b": -2.3, "c": 0.9, "d": -0.6, "n": 3.1, "x": 2.6, "y": -1.4},
           {"a": -0.8, "b": 3.9, "c": -2.2, "d": 1.45, "n": -1.3, "x": -3.7, "y": 0.6},
           {"a": 5.3, "b": 0.4, "c": 4.1, "d": 2.35, "n": 0.7, "x": 1.15, "y": 2.9}]


def wert(term, belegung):
    """Wertet einen Term in der Schreibweise der Formelsammlung aus (−, ·, ², 3x, xy, Klammern)."""
    s = term.replace("−", "-").replace("·", "*").replace("²", "**2").replace("³", "**3")
    s = re.sub(r"(?<=[0-9a-z)])(?=[a-z(])", "*", s)          # 3x → 3*x, xy → x*y, 2(… → 2*(…
    assert re.fullmatch(r"[0-9a-z+\-*/(). ]+", s), f"Term nicht lesbar: {term!r}"
    return eval(s, {"__builtins__": {}}, dict(belegung))


def kette(text, soll_gleich=True):
    """„A = B = C“: Alle Seiten haben an jeder Stelle denselben Wert — oder, bei einem absichtlich
    falschen Beispiel (soll_gleich=False), A und B an mindestens einer Stelle nicht."""
    seiten = text.split(" = ")
    assert len(seiten) >= 2, f"keine Gleichung: {text!r}"
    if soll_gleich:
        for st in STELLEN:
            w = [wert(x, st) for x in seiten]
            assert all(abs(v - w[0]) < 1e-9 * max(1.0, abs(w[0])) for v in w), f"falsch: {text} — Werte {w} bei {st}"
    else:
        assert len(seiten) == 2, text
        assert any(abs(wert(seiten[0], st) - wert(seiten[1], st)) > 1e-6 for st in STELLEN), \
            f"als Fehler gezeigt, stimmt aber: {text}"


def kachel(x, y, b, h, farbe, negativ=False):
    """Eine Kachel wie auf den Lernseiten: hell gefüllt, farbiger Rand; Minus rot gestrichelt."""
    if negativ:
        t = rect(x, y, b, h, ROT, ROT, 0.9, 0.12)
        # Eine Einerkachel ist nur 6 Punkte groß: Mit den langen Strichen der x-Kachel verschwämmen drei
        # davon nebeneinander zu einem Streifen, und ein langes Minus füllte sie ganz aus.
        klein = h <= U + 0.5
        t = t.replace("/>", f' stroke-dasharray="{"1.2 0.9" if klein else "2 1.4"}"/>')
        m = b / 4 if klein else min(2.2, b / 3)
        return t + lin((x + b / 2 - m, y + h / 2), (x + b / 2 + m, y + h / 2), ROT, 0.9)
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


# ---------- Figur 4: Plus- und Minusklammer — die Kacheln einer Minusklammer werden umgedreht ----------
# Ein Glied ist (Sorte, Zahl); Sorte "x" oder "1". Aus denselben Gliedern entstehen die Kacheln und die
# Texte daneben — und wert() rechnet den Text mit der Klammer unabhängig davon nach.

def glied_text(sorte, k, erstes):
    kern = (str(abs(k)) if abs(k) != 1 or sorte == "1" else "") + ("" if sorte == "1" else sorte)
    if erstes:
        return ("−" if k < 0 else "") + kern
    return (" − " if k < 0 else " + ") + kern


def term_text(glieder):
    return "".join(glied_text(s, k, i == 0) for i, (s, k) in enumerate(glieder)) or "0"


def zusammengefasst(glieder):
    summe = {}
    for s, k in glieder:
        summe[s] = summe.get(s, 0) + k
    return [(s, summe[s]) for s in ("x", "1") if summe.get(s)]


KLAMMER_BEISPIELE = [
    # (vor der Klammer, Vorzeichen der Klammer, in der Klammer)
    ([("x", 5)], 1, [("x", 2), ("1", -3)]),
    ([("x", 5)], -1, [("x", 2), ("1", -3)]),
]


def fig_klammern():
    B, H = 250.0, 106.0
    setze_flaeche(B, H)
    t = []
    PAD, LUECKE, ABSTAND = 3.0, 2.0, 5.0

    def reihe(x, glieder):
        """Legt die Kacheln der Glieder nebeneinander; liefert (Kacheln, rechter Rand)."""
        kacheln = []
        for gi, (s, k) in enumerate(glieder):
            if gi > 0:
                x += ABSTAND
            for j in range(abs(k)):
                if j > 0:
                    x += LUECKE
                kacheln.append((s, 1 if k > 0 else -1, x))
                x += U
        return kacheln, x

    for nr, (vorne, vz, innen) in enumerate(KLAMMER_BEISPIELE):
        y0 = 9.0 + nr * 52.0
        yk = y0 + 6.0                                    # Oberkante der x-Kacheln
        ohne = vorne + [(s, k * vz) for s, k in innen]   # Minusklammer: jedes Vorzeichen umgedreht
        mit_text = term_text(vorne) + (" − (" if vz < 0 else " + (") + term_text(innen) + ")"
        ohne_text = term_text(ohne)
        erg_text = term_text(zusammengefasst(ohne))
        kette(f"{mit_text} = {ohne_text} = {erg_text}")
        t.append(txt(8, y0, "Plusklammer — die Kacheln bleiben, wie sie sind" if vz > 0
                     else "Minusklammer — jede Kachel wird umgedreht", ROT if vz < 0 else GRUEN, 6.2, 700, "start"))
        # vorher: Glieder vor der Klammer, Zeichen, Rahmen um die Kacheln der Klammer
        k_vorne, x = reihe(8.0, vorne)
        zx = x + 5.0
        t.append(txt(zx + 4.0, yk + LX / 2 + 3.2, "−" if vz < 0 else "+", SCHWARZ, 9.0, 700))
        k_innen, x2 = reihe(zx + 8.0 + 3.0 + PAD, innen)
        t.append(rect(zx + 11.0, yk - PAD, x2 + PAD - (zx + 11.0), LX + 2 * PAD, GRAU, "none", 0.8, 1.0, 3)
                 .replace("/>", ' stroke-dasharray="3 1.6"/>'))
        # nachher: dieselben Kacheln ohne Rahmen; die der Minusklammer zeigen ihre andere Seite
        xp = x2 + PAD + 11.0
        t.append(txt(xp + 11.0, yk + LX / 2 - 3.0, "umdrehen" if vz < 0 else "weglassen", GRAU, 5.4, 400))
        t.append(txt(xp + 11.0, yk + LX / 2 + 4.0, "→", SCHWARZ, 9.0, 700))
        n_vorne, x3 = reihe(xp + 26.0, vorne)
        n_innen, _ = reihe(x3 + ABSTAND, [(s, k * vz) for s, k in innen])
        vorher, nachher = k_vorne + k_innen, n_vorne + n_innen
        gleich(len(nachher), len(vorher), "Klammer: keine Kachel kommt dazu, keine fällt weg")
        for s, v, xx in vorher + nachher:
            hoehe = LX if s == "x" else U
            t.append(kachel(xx, yk + LX - hoehe, U, hoehe, VIOLETT if s == "x" else GRUEN, negativ=v < 0))
        # Die umgedrehten Kacheln zählen, was der Term mit Klammer ausrechnet — an mehreren Stellen.
        for xw in (-3.0, 0.5, 2.0, 7.0):
            gezaehlt = sum(v * (xw if s == "x" else 1.0) for s, v, _ in nachher)
            gleich(gezaehlt, wert(mit_text, {"x": xw}), f"Klammer, Kacheln bei x = {xw}")
        t.append(txt(8, y0 + 39.0, f"{mit_text} = {ohne_text} = {erg_text}", SCHWARZ, 6.6, 700, "start"))
    return svg(B, H, t)


# ---------- Tabelle: die Klammerregeln, aus den Vorzeichen gebaut und nachgerechnet ----------

def tabelle_klammerregeln():
    faelle = [(1, [(1, "b"), (1, "c")]), (1, [(1, "b"), (-1, "c")]),
              (-1, [(1, "b"), (1, "c")]), (-1, [(1, "b"), (-1, "c")]), (-1, [(-1, "b"), (1, "c")])]
    zeilen = ['<tr><th></th><th>mit Klammer</th><th>ohne Klammer</th></tr>']
    for i, (vz, innen) in enumerate(faelle):
        drinnen = "".join(("−" if v < 0 else "") + n if j == 0 else (" − " if v < 0 else " + ") + n
                          for j, (v, n) in enumerate(innen))
        mit = "a " + ("−" if vz < 0 else "+") + " (" + drinnen + ")"
        # Ohne Klammer: jedes Glied mit Vorzeichen · Vorzeichen der Klammer; umgedrehte Zeichen rot.
        ohne, ohne_html = "a", "a"
        for v, n in innen:
            z = "−" if v * vz < 0 else "+"
            ohne += f" {z} {n}"
            ohne_html += f' <span class="ga">{z}</span> {n}' if vz < 0 else f" {z} {n}"
        kette(f"{mit} = {ohne}")
        kopf = ""
        if i == 0:
            kopf = '<td class="l" rowspan="2"><b>Plusklammer:</b> Klammer weglassen, die Vorzeichen bleiben</td>'
        elif i == 2:
            kopf = ('<td class="l" rowspan="3"><b>Minusklammer:</b> Klammer weglassen, '
                    '<b>jedes</b> Vorzeichen in ihr umdrehen</td>')
        zeilen.append(f'<tr>{kopf}<td class="f">{mit}</td><td class="f">{ohne_html}</td></tr>')
    return '<table class="regeln">' + "".join(zeilen) + "</table>"


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


# ---------- Die Gleichungen im Text der Formelsammlung ----------
# Jede steht wörtlich in der Quelle — sonst wurde sie dort geändert, ohne hier nachgerechnet zu werden —
# und wird an den STELLEN ausgewertet. FALSCH sind die absichtlich falschen Beispiele der Fehlertabelle.

GLEICHUNGEN = [
    "3 · n = 3n",
    "3x + 5x = 8x", "3x · 4y = 12xy", "2a · 5a = 10a²",
    "8 − (x + 3) = 8 − x − 3 = 5 − x",
    "(4x + 3y) − (2x − y) + (x − 5y) = 4x + 3y − 2x + y + x − 5y = 3x − y",
    "5x − (2x − 3) = 3x + 3",
    "−3 · (2x − 5) = −6x + 15", "x · (x + 4) = x² + 4x",
    "−(2x − 5) = (−1) · (2x − 5) = −2x + 5",
    "a · b + a · c = a · (b + c)", "a · (b + c) = a · b + a · c",
    "6x + 9 = 3 · (2x + 3)", "4x + 4 = 4 · (x + 1)", "12x² − 8x = 4x · (3x − 2)",
    "x + x = 2x",
    "5x − (2x − 3) = 5x − 2x + 3 = 3x + 3", "5x + (2x − 3) = 5x + 2x − 3 = 7x − 3",
    "x² − (x² − x − 6) = x + 6",
    "(a + b) · (c + d) = ac + ad + bc + bd",
    "2 · (x + 1) · (x − 3) = 2 · (x² − 2x − 3) = 2x² − 4x − 6",
    "(x + 4) · (x − 1) − (x + 2) · (x − 3) = (x² + 3x − 4) − (x² − x − 6) = x² + 3x − 4 − x² + x + 6 = 4x + 2",
    "(x + 3) · (x − 2) = x² + x − 6", "(x + 2) · (x − 2) = x² − 4",
    "(a + b)² = a² + 2ab + b²", "(a − b)² = a² − 2ab + b²", "(a + b) · (a − b) = a² − b²",
    "x² + 6x + 9 = (x + 3)²", "9x² − 4 = (3x + 2) · (3x − 2)",
    "51² = 2500 + 100 + 1 = 2601", "48 · 52 = 2500 − 4 = 2496",
    "(x + 3)² − (x − 3)² = (x² + 6x + 9) − (x² − 6x + 9) = 12x",
]
FALSCH = [
    "x + x = x²", "3x + 2 = 5x", "5x − (2x − 3) = 3x − 3", "5x + (2x − 3) = 5x + 2x + 3",
    "3 · (2x + 3) = 6x + 3", "(x + 3) · (x + 2) = x² + 6", "x² − (x + 2) · (x − 3) = x² − x² − x − 6",
    "(a + b)² = a² + b²", "(x − 4)² = x² − 8x − 16",
]
# Rechenwege, deren Schritte auf mehrere Zeilen verteilt sind: jeder Schritt wörtlich da, alle gleichwertig.
RECHENWEGE = [
    ["4x + 3y − (2x − y) + x · 3", "4x + 3y − (2x − y) + 3x", "4x + 3y − 2x + y + 3x", "4x − 2x + 3x + 3y + y", "5x + 4y"],
]
# Proben: (Term, eingesetzte Zahl, die Rechnung mit der Zahl, wie sie dasteht).
PROBEN = [("5x − (2x − 3)", 2, "5 · 2 − (2 · 2 − 3) = 9"), ("3x + 3", 2, "3 · 2 + 3 = 9")]


def pruefe_quelle():
    quelle = (pathlib.Path(__file__).parent / "formelsammlung-tm-quelle.html").read_text(encoding="utf-8")
    fehlt = [g for g in GLEICHUNGEN + FALSCH + [s for w in RECHENWEGE for s in w] + [p[2] for p in PROBEN]
             if g not in quelle]
    assert not fehlt, f"nicht (mehr) wörtlich in der Quelle: {fehlt}"
    for g in GLEICHUNGEN:
        kette(g)
    for g in FALSCH:
        kette(g, soll_gleich=False)
    for w in RECHENWEGE:
        kette(" = ".join(w))
    for term, zahl, rechnung in PROBEN:
        kette(rechnung)
        gleich(wert(term, {"x": zahl}), wert(rechnung.split(" = ")[-1], {}), f"Probe {term} mit x = {zahl}")
        gleich(wert(term, {"x": zahl}), wert(rechnung.split(" = ")[0], {}), f"Probe {term}: eingesetzt")
    return len(GLEICHUNGEN) + len(FALSCH) + len(RECHENWEGE) + len(PROBEN)


FIGUREN = [fig_muster, fig_baum, fig_kacheln, fig_klammern, tabelle_klammerregeln, fig_distributiv, fig_summe,
           fig_bin1, fig_bin2, fig_bin3]

if __name__ == "__main__":
    print(f"{pruefe_quelle()} Gleichungen der Quelle nachgerechnet")
    zeilen = [fn() for fn in FIGUREN]
    pfad = pathlib.Path(__file__).parent / "tm-figuren.txt"
    pfad.write_text("\n".join(zeilen) + "\n", encoding="utf-8")
    print(f"{len(zeilen)} Figuren geschrieben")
